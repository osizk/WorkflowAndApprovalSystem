import assert from 'node:assert/strict';
import { test } from 'node:test';
import { testDatabaseUrl } from '../scripts/test-db.mjs';

test('requires an explicit disposable test database distinct from development', () => {
  const dev = 'postgresql://user:password@localhost:5432/workflow_dev';
  assert.throws(() => testDatabaseUrl(undefined, dev), /required/);
  assert.throws(() => testDatabaseUrl(dev, dev), /_test/);
  assert.throws(() => testDatabaseUrl('postgresql://user:password@db.example.com:5432/workflow_test', dev), /local/);
  assert.throws(() => testDatabaseUrl('postgresql://user:password@localhost:5432/workflow_test', 'postgresql://user:password@localhost:5432/workflow_test'), /differ/);
  assert.throws(() => testDatabaseUrl('postgresql://other:other@localhost:5432/workflow_test', 'postgresql://user:password@localhost:5432/workflow_test'), /differ/);
  assert.equal(testDatabaseUrl('postgresql://user:password@localhost:5432/workflow_test', dev), 'postgresql://user:password@localhost:5432/workflow_test');
});
