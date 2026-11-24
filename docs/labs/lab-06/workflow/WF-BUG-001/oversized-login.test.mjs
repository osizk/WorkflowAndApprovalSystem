import assert from 'node:assert/strict';
import { test } from 'node:test';

const origin = process.env.WORKFLOW_UAT_ORIGIN
  || 'https://scd928edd-4d7hbszvwq-as.a.run.app';

async function submitInvalidBody(bytes) {
  const body = JSON.stringify({ unexpected: 'x'.repeat(bytes - 17) });
  assert.equal(Buffer.byteLength(body), bytes);
  const response = await fetch(new URL('/api/session', origin), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body,
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  console.log(JSON.stringify({
    observedAt: new Date().toISOString(),
    origin,
    requestBytes: bytes,
    status: response.status,
    response: data,
  }));
  return { status: response.status, data };
}

test('WF-BUG-001 control at 100 KiB returns a client validation error', async () => {
  const result = await submitInvalidBody(102400);
  assert.equal(result.status, 422);
  assert.equal(result.data.error.code, 'VALIDATION_ERROR');
});

test('WF-BUG-001 oversized login body preserves the HTTP 413 rejection', async () => {
  const result = await submitInvalidBody(102401);
  assert.equal(result.status, 413,
    'A body above the existing parser limit should return Payload Too Large');
  assert.ok(result.data.error?.code, 'The response must use the JSON error envelope');
});
