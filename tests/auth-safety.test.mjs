import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from '../dist/auth.js';

test('WF-BUG-001: oversized JSON returns 413 before authentication or database access', async () => {
  const db = { user: { findUnique: () => assert.fail('Invalid bodies must not query the database') } };
  const server = createApp(db, { origin: 'http://127.0.0.1' }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const headers = { origin: 'http://127.0.0.1', 'content-type': 'application/json' };
  const overhead = Buffer.byteLength(JSON.stringify({ unexpected: '' }));
  try {
    const controlBody = JSON.stringify({ unexpected: 'x'.repeat(102400 - overhead) });
    assert.equal(Buffer.byteLength(controlBody), 102400);
    const control = await fetch(origin + '/api/session', { method: 'POST', headers, body: controlBody });
    assert.equal(control.status, 422);
    assert.equal((await control.json()).error.code, 'VALIDATION_ERROR');

    const oversizedBody = JSON.stringify({ unexpected: 'x'.repeat(102401 - overhead) });
    assert.equal(Buffer.byteLength(oversizedBody), 102401);
    const oversized = await fetch(origin + '/api/session', { method: 'POST', headers, body: oversizedBody });
    assert.equal(oversized.status, 413);
    assert.deepEqual(await oversized.json(), {
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' },
    });

    const malformed = await fetch(origin + '/api/session', { method: 'POST', headers, body: '{' });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).error.code, 'BAD_REQUEST');

    const health = await fetch(origin + '/api/health');
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok' });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

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
