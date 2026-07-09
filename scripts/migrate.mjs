import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as path from 'node:path';

async function main() {
  const host = process.env.DATABASE_HOST;
  const port = Number(process.env.DATABASE_PORT) || 5432;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;
  const ssl = process.env.DATABASE_SSL === 'true';

  if (!host || !user || !password || !database) {
    console.error(
      'Missing required environment variables: DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME',
    );
    process.exit(1);
  }

  console.log(
    `Connecting to ${host}:${port}/${database}?ssl=${ssl} as ${user}...`,
  );

  const pool = new Pool({ host, port, user, password, database, ssl });
  const db = drizzle(pool);

  try {
    const migrationsFolder = path.join(import.meta.dirname, '..', 'drizzle');
    console.log(`Running migrations from ${migrationsFolder}...`);

    await migrate(db, { migrationsFolder });

    console.log('Migrations completed successfully.');

    console.log('Running undergrad university and course data migration...');
    
    // 1. Migrate universities
    const unisToMigrate = await pool.query(`
      SELECT DISTINCT TRIM(undergrad_university) as name 
      FROM enrollments 
      WHERE undergrad_university IS NOT NULL 
        AND undergrad_university_id IS NULL 
        AND TRIM(undergrad_university) <> ''
    `);
    
    for (const row of unisToMigrate.rows) {
      const name = row.name;
      const existing = await pool.query(`
        SELECT id FROM universities WHERE LOWER(name) = LOWER($1) LIMIT 1
      `, [name]);
      
      let uniId;
      if (existing.rows.length > 0) {
        uniId = existing.rows[0].id;
      } else {
        const inserted = await pool.query(`
          INSERT INTO universities (id, name, is_manual, status) 
          VALUES (gen_random_uuid(), $1, true, 'pending') 
          RETURNING id
        `, [name]);
        uniId = inserted.rows[0].id;
        console.log(`Created pending university: "${name}"`);
      }
      
      await pool.query(`
        UPDATE enrollments 
        SET undergrad_university_id = $1 
        WHERE TRIM(undergrad_university) = $2 
          AND undergrad_university_id IS NULL
      `, [uniId, name]);
    }

    // 2. Migrate courses
    const coursesToMigrate = await pool.query(`
      SELECT DISTINCT TRIM(undergrad_course) as name, undergrad_university_id as uni_id
      FROM enrollments 
      WHERE undergrad_course IS NOT NULL 
        AND undergrad_course_id IS NULL 
        AND TRIM(undergrad_course) <> ''
    `);
    
    for (const row of coursesToMigrate.rows) {
      const name = row.name;
      const uniId = row.uni_id;
      
      const existing = await pool.query(`
        SELECT id FROM courses 
        WHERE LOWER(name) = LOWER($1) 
          AND (university_id = $2 OR university_id IS NULL) 
        LIMIT 1
      `, [name, uniId]);
      
      let courseId;
      if (existing.rows.length > 0) {
        courseId = existing.rows[0].id;
        if (uniId) {
          await pool.query(`
            UPDATE courses SET university_id = $1 WHERE id = $2 AND university_id IS NULL
          `, [uniId, courseId]);
        }
      } else {
        const inserted = await pool.query(`
          INSERT INTO courses (id, name, university_id, is_manual, status) 
          VALUES (gen_random_uuid(), $1, $2, true, 'pending') 
          RETURNING id
        `, [name, uniId || null]);
        courseId = inserted.rows[0].id;
        console.log(`Created pending course: "${name}"`);
      }
      
      await pool.query(`
        UPDATE enrollments 
        SET undergrad_course_id = $1 
        WHERE TRIM(undergrad_course) = $2 
          AND (undergrad_university_id = $3 OR undergrad_university_id IS NULL)
          AND undergrad_course_id IS NULL
      `, [courseId, name, uniId]);
    }
    
    console.log('Undergrad data migration completed.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
