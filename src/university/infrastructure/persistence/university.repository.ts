import type { CourseSelect, UniversitySelect } from '../../../database/schema/universities';

export interface CreateUniversityData {
  name: string;
  abbreviation?: string;
  state?: string;
  city?: string;
}

export interface CreateCourseData {
  name: string;
  universityId?: string;
}

export abstract class UniversityRepository {
  abstract searchUniversities(query: string, limit?: number): Promise<UniversitySelect[]>;

  abstract searchCourses(
    query: string,
    universityId?: string,
    limit?: number,
  ): Promise<CourseSelect[]>;

  abstract findUniversityById(id: string): Promise<UniversitySelect | null>;

  abstract findCourseById(id: string): Promise<CourseSelect | null>;

  abstract createUniversity(data: CreateUniversityData): Promise<UniversitySelect>;

  abstract createCourse(data: CreateCourseData): Promise<CourseSelect>;
}
