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

function call(who, id, body, action = 'decision') {
  return fetch(`${base}/api/requests/${id}/${action}`, {
    method: 'POST',
    headers: { origin, ...(who && { cookie: who.cookie }), 'content-type': 'application/json' },
    body: JSON.stringify(action === 'decision' ? { version: 1, ...body } : body),
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

test('TEST-22: reviewer returns a submitted request and records history', async () => {
  const item = await request();
  const response = await call(reviewer, item.id, { reason: '  Update quantity  ', version: 1 }, 'return');
  assert.equal(response.status, 200);
  const detail = (await response.json()).request;
  assert.equal(detail.status, 'RETURNED');
  assert.equal(detail.version, 2);
  const saved = await db.purchaseRequest.findUniqueOrThrow({
    where: { id: item.id },
    include: { events: true },
  });
  assert.equal(saved.status, 'RETURNED');
  assert.equal(saved.version, 2);
  assert.equal(saved.events.length, 2);
  const event = saved.events.find(({ type }) => type === 'RETURNED');
  assert.equal(event?.reason, 'Update quantity');
  assert.equal(event?.actorId, reviewer.id);
});

test('TEST-23: return reason validates trimmed Unicode boundaries', async () => {
  for (const reason of [undefined, '   ', '😀'.repeat(501)]) {
    const item = await request();
    const response = await call(reviewer, item.id, { reason, version: 1 }, 'return');
    assert.equal(response.status, 422);
    const { error } = await response.json();
    assert.equal(error.code, 'VALIDATION_ERROR');
    assert.ok(error.fields.reason);
    const saved = await db.purchaseRequest.findUniqueOrThrow({ where: { id: item.id } });
    assert.equal(saved.status, 'SUBMITTED');
    assert.equal(saved.version, 1);
    assert.equal(await db.requestEvent.count({ where: { requestId: item.id } }), 1);
  }
  for (const reason of ['😀', '😀'.repeat(500)]) {
    const item = await request();
    const response = await call(reviewer, item.id, { reason: ' ' + reason + ' ', version: 1 }, 'return');
    assert.equal(response.status, 200);
    const event = await db.requestEvent.findFirstOrThrow({
      where: { requestId: item.id, type: 'RETURNED' },
    });
    assert.equal(event.reason, reason);
  }
});

test('TEST-25: Return and Withdraw commit only the winning transition', async () => {
  const item = await request();
  const [returned, withdrawn] = await Promise.all([
    call(reviewer, item.id, { version: 1, reason: 'Update quantity' }, 'return'),
    call(requester, item.id, { version: 1, reason: 'No longer needed' }, 'withdraw'),
  ]);
  assert.deepEqual([returned.status, withdrawn.status].sort(), [200, 409]);
  const returnWon = returned.ok;
  const conflict = await (returnWon ? withdrawn : returned).json();
  assert.equal(conflict.error.code, returnWon ? 'WITHDRAWAL_CONFLICT' : 'REQUEST_CONFLICT');
  const saved = await db.purchaseRequest.findUniqueOrThrow({
    where: { id: item.id },
    include: { events: true },
  });
  assert.equal(saved.status, returnWon ? 'RETURNED' : 'WITHDRAWN');
  assert.equal(saved.version, returnWon ? 2 : 1);
  assert.equal(saved.events.length, 2);
  assert.equal(saved.events.find(({ type }) => type !== 'SUBMITTED')?.type, saved.status);
});

test('TEST-28: decisions require a valid version and reject stale versions', async () => {
  for (const decision of ['APPROVE', 'REJECT']) {
    const item = await request();
    const body = { decision, ...(decision === 'REJECT' && { reason: 'Not needed' }) };
    for (const version of [undefined, '1', 0, 1.5]) {
      const response = await call(reviewer, item.id, { ...body, version });
      assert.equal(response.status, 422);
      const { error } = await response.json();
      assert.equal(error.code, 'VALIDATION_ERROR');
      assert.ok(error.fields.version);
    }

    // Model a newer submitted revision; the full Return/Resubmit flow is covered by S2-02.
    await db.purchaseRequest.update({ where: { id: item.id }, data: { version: 3 } });
    const stale = await call(reviewer, item.id, { ...body, version: 1 });
    assert.equal(stale.status, 409);
    assert.equal((await stale.json()).error.code, 'DECISION_CONFLICT');
    const saved = await db.purchaseRequest.findUniqueOrThrow({
      where: { id: item.id },
      include: { events: true },
    });
    assert.equal(saved.status, 'SUBMITTED');
    assert.equal(saved.version, 3);
    assert.deepEqual(saved.events.map(({ type }) => type), ['SUBMITTED']);

    const current = await call(reviewer, item.id, { ...body, version: 3 });
    assert.equal(current.status, 200);
    assert.equal((await current.json()).request.status, decision === 'APPROVE' ? 'APPROVED' : 'REJECTED');
  }
});

test('TEST-24 (Return): enforce reviewer role and assignment', async () => {
  const item = await request();
  const payload = { reason: 'Update quantity', version: 1 };
  assert.equal((await call(null, item.id, payload, 'return')).status, 401);
  assert.equal((await call(requester, item.id, payload, 'return')).status, 403);
  assert.equal((await call(unrelated, item.id, payload, 'return')).status, 404);
  const saved = await db.purchaseRequest.findUniqueOrThrow({
    where: { id: item.id },
    include: { events: true },
  });
  assert.equal(saved.status, 'SUBMITTED');
  assert.equal(saved.version, 1);
  assert.deepEqual(saved.events.map(({ type }) => type), ['SUBMITTED']);
});

test('TEST-32: status filters preserve requester and reviewer scope and ordering', async () => {
  const statuses = ['SUBMITTED', 'RETURNED', 'APPROVED', 'REJECTED', 'WITHDRAWN'];
  const fixtures = [];
  for (const [index, status] of statuses.entries()) {
    const createdAt = new Date(Date.UTC(2026, 10, 28, 0, index));
    const common = { title: 'Filter fixture', purpose: 'Office supplies', amountSatang: 100, status, createdAt };
    fixtures.push(await db.purchaseRequest.create({
      data: { ...common, requesterId: requester.id, reviewerId: reviewer.id },
    }));
    await db.purchaseRequest.create({
      data: { ...common, requesterId: otherRequester.id, reviewerId: unrelated.id },
    });
  }
  const fixtureIds = new Set(fixtures.map(({ id }) => id));
  for (const account of [requester, reviewer]) {
    const list = (suffix = '') => fetch(base + '/api/requests' + suffix, { headers: { cookie: account.cookie } });
    for (const item of fixtures) {
      const response = await list('?status=' + item.status);
      assert.equal(response.status, 200);
      const { requests } = await response.json();
      assert.ok(requests.some(({ id }) => id === item.id));
      assert.ok(requests.every(({ status, title, id }) => status === item.status &&
        (title !== 'Filter fixture' || fixtureIds.has(id))));
    }

    const { requests } = await (await list()).json();
    assert.deepEqual(requests.filter(({ title }) => title === 'Filter fixture').map(({ id }) => id),
      fixtures.map(({ id }) => id).reverse());
    for (const suffix of ['?status=INVALID', '?status=', '?status=SUBMITTED&status=SUBMITTED']) {
      const response = await list(suffix);
      assert.equal(response.status, 422);
      const { error } = await response.json();
      assert.equal(error.code, 'VALIDATION_ERROR');
      assert.ok(error.fields.status);
    }
  }
});
