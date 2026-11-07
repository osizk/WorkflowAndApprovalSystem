import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../dist/auth.js';
import { developmentDatabaseUrl, testDatabaseUrl } from '../scripts/test-db.mjs';

const url = testDatabaseUrl(process.env.TEST_DATABASE_URL, developmentDatabaseUrl());
const db = new PrismaClient({ datasources: { db: { url } } });
const users = [];
const origin = 'http://127.0.0.1';
let server, base, requester, otherRequester, reviewer, unrelated;

async function account(role) {
  const user = await db.user.create({ data: { login: randomUUID(), role, passwordHash: 'unused-test-hash' } });
  users.push(user.id);
  const token = randomBytes(32).toString('hex');
  await db.session.create({ data: { userId: user.id, tokenDigest: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 600000) } });
  return { id: user.id, cookie: `session=${token}` };
}

async function request() {
  return db.purchaseRequest.create({
    data: { requesterId: requester.id, reviewerId: reviewer.id, title: 'Pens', purpose: 'Office supplies', amountSatang: 100,
      events: { create: { actorId: requester.id, type: 'SUBMITTED' } } },
  });
}

function call(who, id, body) {
  return fetch(`${base}/api/requests/${id}/decision`, {
    method: 'POST',
    headers: { origin, ...(who && { cookie: who.cookie }), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

before(async () => {
  requester = await account('REQUESTER');
  otherRequester = await account('REQUESTER');
  reviewer = await account('REVIEWER');
  unrelated = await account('REVIEWER');
  server = createApp(db, { origin }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await db.requestEvent.deleteMany({ where: { request: { requesterId: { in: users } } } });
  await db.purchaseRequest.deleteMany({ where: { requesterId: { in: users } } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

test('TEST-09–11: assigned review, reason bounds, durable history and role isolation', async () => {
  const first = await request();
  assert.equal((await call(null, first.id, { decision: 'APPROVE' })).status, 401);
  assert.equal((await call(requester, first.id, { decision: 'APPROVE' })).status, 403);
  assert.equal((await call(unrelated, first.id, { decision: 'APPROVE' })).status, 404);
  assert.equal((await call(reviewer, randomUUID(), { decision: 'APPROVE' })).status, 404);
  assert.equal((await call(reviewer, 'invalid-id', { decision: 'APPROVE' })).status, 404);
  assert.deepEqual((await (await fetch(`${base}/api/requests`, { headers: { cookie: unrelated.cookie } })).json()).requests, []);
  await assert.rejects(db.purchaseRequest.create({ data: { requesterId: reviewer.id, reviewerId: reviewer.id, title: 'Pens', purpose: 'Office supplies', amountSatang: 100 } }));

  for (const body of [
    { decision: 'RETURN' }, { decision: 'APPROVE', reviewerId: unrelated.id },
    { decision: 'REJECT' }, { decision: 'REJECT', reason: '   ' },
    { decision: 'REJECT', reason: 'x'.repeat(501) }, { decision: 'APPROVE', reason: 'x'.repeat(501) },
  ]) assert.equal((await call(reviewer, first.id, body)).status, 422);
  assert.equal((await db.purchaseRequest.findUnique({ where: { id: first.id } })).status, 'SUBMITTED');
  assert.equal(await db.requestEvent.count({ where: { requestId: first.id } }), 1);

  const approved = await call(reviewer, first.id, { decision: 'APPROVE' });
  assert.equal(approved.status, 200);
  assert.equal((await approved.json()).request.status, 'APPROVED');
  assert.equal((await call(reviewer, first.id, { decision: 'APPROVE' })).status, 409);
  const detail = await (await fetch(`${base}/api/requests/${first.id}`, { headers: { cookie: requester.cookie } })).json();
  assert.deepEqual(detail.request.history.map(({ type }) => type), ['SUBMITTED', 'APPROVED']);
  assert.equal(detail.request.history[1].reason, null);

  const second = await request();
  const rejected = await call(reviewer, second.id, { decision: 'REJECT', reason: ` ${'x'.repeat(500)} ` });
  assert.equal(rejected.status, 200);
  assert.equal((await rejected.json()).request.status, 'REJECTED');
  const persisted = await (await fetch(`${base}/api/requests/${second.id}`, { headers: { cookie: reviewer.cookie } })).json();
  assert.equal(persisted.request.history[1].reason, 'x'.repeat(500));
});

test('TEST-12: concurrent and repeated decisions create one terminal event', async () => {
  const item = await request();
  const results = await Promise.all([
    call(reviewer, item.id, { decision: 'APPROVE' }),
    call(reviewer, item.id, { decision: 'REJECT', reason: 'Not needed' }),
  ]);
  assert.deepEqual(results.map(({ status }) => status).sort(), [200, 409]);
  assert.equal((await call(reviewer, item.id, { decision: 'APPROVE' })).status, 409);
  const events = await db.requestEvent.findMany({ where: { requestId: item.id } });
  assert.equal(events.filter(({ type }) => type !== 'SUBMITTED').length, 1);
});

test('TEST-13: failed event insert rolls back the status update', async () => {
  const item = await request();
  await db.requestEvent.create({ data: { requestId: item.id, actorId: reviewer.id, type: 'APPROVED' } });
  const before = await db.requestEvent.findMany({ where: { requestId: item.id }, orderBy: { id: 'asc' } });
  assert.equal((await call(reviewer, item.id, { decision: 'REJECT', reason: 'Not needed' })).status, 500);
  assert.equal((await db.purchaseRequest.findUnique({ where: { id: item.id } })).status, 'SUBMITTED');
  const after = await db.requestEvent.findMany({ where: { requestId: item.id }, orderBy: { id: 'asc' } });
  assert.deepEqual(after, before);
});
