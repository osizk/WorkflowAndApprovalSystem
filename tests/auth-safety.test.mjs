import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from '../dist/auth.js';

test('database failure returns a generic error and logs no sensitive details', async () => {
  const sentinel = 'private-connection-sentinel';
  const db = { user: { findUnique: async () => { throw new Error(sentinel); } } };
  const app = createApp(db, { origin: 'http://127.0.0.1' });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const logs = [];
  const previous = console.error;
  console.error = (...parts) => logs.push(parts.join(' '));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/session`, {
      method: 'POST',
      headers: { origin: 'http://127.0.0.1', 'content-type': 'application/json' },
      body: JSON.stringify({ login: 'requester1', password: 'example-password' }),
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } });
    assert.ok(logs.length > 0);
    assert.doesNotMatch(logs.join(' '), /private-connection-sentinel/);
  } finally {
    console.error = previous;
    await new Promise((resolve) => server.close(resolve));
  }
});
