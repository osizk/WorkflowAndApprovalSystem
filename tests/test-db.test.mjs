import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { testDatabaseUrl } from '../scripts/test-db.mjs';

test('requires an explicit disposable test database distinct from development', () => {
  const dev = 'postgresql://user:password@localhost:5432/workflow_dev';
  assert.throws(() => testDatabaseUrl(undefined, dev), /required/);
  assert.throws(() => testDatabaseUrl(dev, dev), /_test/);
  assert.throws(() => testDatabaseUrl('postgresql://user:password@db.example.com:5432/workflow_test', dev), /local/);
  assert.throws(() => testDatabaseUrl('postgresql://user:password@localhost:5432/workflow_test', 'postgresql://user:password@localhost:5432/workflow_test'), /differ/);
  assert.throws(() => testDatabaseUrl('postgresql://other:other@localhost:5432/workflow_test', 'postgresql://user:password@localhost:5432/workflow_test'), /differ/);
  assert.throws(() => testDatabaseUrl('postgresql://other:other@127.0.0.1/workflow_test', 'postgresql://user:password@localhost:5432/workflow_test'), /differ/);
  assert.throws(() => testDatabaseUrl('postgresql://user:password@localhost/workflow_test?host=elsewhere', dev), /routing options/);
  assert.throws(() => testDatabaseUrl('postgresql://user:password@localhost/workflow_test#other', dev), /routing options/);
  assert.equal(testDatabaseUrl('postgresql://user:password@localhost:5432/workflow_test', dev), 'postgresql://user:password@localhost:5432/workflow_test');
});

test('reads development database from local .env before migrating', () => {
  const directory = mkdtempSync(join(tmpdir(), 'workflow-db-guard-'));
  try {
    writeFileSync(join(directory, '.env'), 'DATABASE_URL=postgresql://user:password@localhost:5432/workflow_test\n');
    const run = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/test-db.mjs', import.meta.url))], {
      cwd: directory,
      env: { ...process.env, DATABASE_URL: '', TEST_DATABASE_URL: 'postgresql://other:other@127.0.0.1/workflow_test' },
      encoding: 'utf8',
    });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Test and development databases must differ/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

// C-02 deliberately fails only on this temporary demonstration branch.
test('Lab 5 C-02: required check blocks a failing PR', () => {
  assert.fail('Intentional Lab 5 C-02 failure; never merge this demonstration branch.');
});
