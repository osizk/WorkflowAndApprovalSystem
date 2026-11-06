import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function testDatabaseUrl(testUrl, developmentUrl) {
  if (!testUrl) throw new Error('TEST_DATABASE_URL is required');
  const url = new URL(testUrl);
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') throw new Error('Test database must use PostgreSQL');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Test database must be local');
  if (!url.pathname.slice(1).endsWith('_test')) throw new Error('Test database name must end in _test');
  if (developmentUrl) {
    const dev = new URL(developmentUrl);
    if (url.hostname === dev.hostname && url.port === dev.port && url.pathname === dev.pathname) {
      throw new Error('Test and development databases must differ');
    }
  }
  return url.href;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const databaseUrl = testDatabaseUrl(process.env.TEST_DATABASE_URL, process.env.DATABASE_URL);
    const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
