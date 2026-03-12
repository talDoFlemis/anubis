import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const CONTAINER_ID_FILE = path.join(
  require('node:os').tmpdir(),
  'anubis-test-container-id',
);

export default async function globalTeardown() {
  if (!fs.existsSync(CONTAINER_ID_FILE)) {
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(CONTAINER_ID_FILE, 'utf-8'));
    const containerId: string = data.containerId;

    execSync(`docker stop ${containerId}`, { stdio: 'ignore' });
    execSync(`docker rm ${containerId}`, { stdio: 'ignore' });
  } catch {
    // Container may already be stopped; ignore errors
  } finally {
    fs.unlinkSync(CONTAINER_ID_FILE);
  }
}
