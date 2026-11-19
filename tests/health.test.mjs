import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp } from '../dist/auth.js';

async function withServer(database, check) {
  const server = createApp(database, { origin: 'http://127.0.0.1' }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await check(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

test('health responds without querying the database', async () => {
  await withServer({ $queryRaw: () => { throw new Error('Database must not be queried'); } }, async (base) => {
    const response = await fetch(base + '/api/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
});

test('readiness runs a database query before reporting connected', async () => {
  let queried = false;
  await withServer({ $queryRaw: async (sql) => {
    queried = true;
    assert.equal(sql.join(''), 'SELECT 1');
    return [{ '?column?': 1 }];
  } }, async (base) => {
    const response = await fetch(base + '/api/ready');
    assert.equal(response.status, 200);
    assert.equal(queried, true);
    assert.deepEqual(await response.json(), { db: 'connected' });
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
});

test('readiness rejects a failed database without exposing connection details', async () => {
  await withServer({ $queryRaw: async () => { throw new Error('postgresql://private-host/private-db'); } }, async (base) => {
    const response = await fetch(base + '/api/ready');
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { db: 'unavailable' });
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
});
