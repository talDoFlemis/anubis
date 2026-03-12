import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const CONTAINER_ID_FILE = path.join(os.tmpdir(), 'anubis-test-container-id');

export default function globalTeardown() {
  if (!fs.existsSync(CONTAINER_ID_FILE)) {
    return;
  }

  try {
    const data: { containerId: string; connectionUri: string } = JSON.parse(
      fs.readFileSync(CONTAINER_ID_FILE, 'utf-8'),
    ) as { containerId: string; connectionUri: string };
    const containerId: string = data.containerId;

    execSync(`docker stop ${containerId}`, { stdio: 'ignore' });
    execSync(`docker rm ${containerId}`, { stdio: 'ignore' });
  } catch {
    // Container may already be stopped; ignore errors
  } finally {
    fs.unlinkSync(CONTAINER_ID_FILE);
  }
}
