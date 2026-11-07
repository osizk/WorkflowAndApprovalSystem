import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';

function target(value) {
  const url = new URL(value);
  const host = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ? 'loopback' : url.hostname;
  return `${host}:${url.port || '5432'}/${decodeURIComponent(url.pathname.slice(1))}`;
}

export function testDatabaseUrl(testUrl, developmentUrl) {
  if (!testUrl) throw new Error('TEST_DATABASE_URL is required');
  const url = new URL(testUrl);
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') throw new Error('Test database must use PostgreSQL');
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Test database must be local');
  if (url.search || url.hash) throw new Error('Test database URL must not have routing options');
  if (!decodeURIComponent(url.pathname.slice(1)).endsWith('_test')) throw new Error('Test database name must end in _test');
  if (developmentUrl) {
    if (target(url.href) === target(developmentUrl)) {
      throw new Error('Test and development databases must differ');
    }
  }
  return url.href;
}

export function developmentDatabaseUrl() {
  const localEnv = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {};
  return process.env.DATABASE_URL || localEnv.DATABASE_URL;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const databaseUrl = testDatabaseUrl(process.env.TEST_DATABASE_URL, developmentDatabaseUrl());
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
