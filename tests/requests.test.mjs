import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../dist/auth.js';
import { developmentDatabaseUrl, testDatabaseUrl } from '../scripts/test-db.mjs';

test('F-02: guarded submission, scoped retrieval and durable history', async () => {
  const url = testDatabaseUrl(process.env.TEST_DATABASE_URL, developmentDatabaseUrl());
  const db = new PrismaClient({ datasources: { db: { url } } });
  const users = [];
  const origin = 'http://127.0.0.1';
  let server;
  async function account(role) {
    const user = await db.user.create({ data: { login: randomUUID(), role, passwordHash: 'unused-test-hash' } });
    users.push(user.id);
    const token = randomBytes(32).toString('hex');
    await db.session.create({ data: { userId: user.id, tokenDigest: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 60000) } });
    return { id: user.id, login: user.login, cookie: 'session=' + token };
  }
  try {
    const owner = await account('REQUESTER');
    const other = await account('REQUESTER');
    const assigned = await account('REVIEWER');
    const unrelated = await account('REVIEWER');
    await db.reviewerAssignment.create({ data: { requesterId: owner.id, reviewerId: assigned.id } });
    server = createApp(db, { origin }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = 'http://127.0.0.1:' + server.address().port + '/api/requests';
    const call = (who, path = '', method = 'GET', body) => fetch(base + path, {
      method,
      headers: { origin, ...(who && { cookie: who.cookie }), ...(body && { 'content-type': 'application/json' }) },
      body: body && JSON.stringify(body),
    });
    const valid = { title: '  Pens ', purpose: 'Office supplies', amount: '0.01' };
    assert.equal((await call(null)).status, 401);
    assert.equal((await call(assigned, '', 'POST', valid)).status, 403);
    for (const invalid of [{ ...valid, amount: '0.001' }, { ...valid, amount: '1000000.01' }, { ...valid, title: '  ' }, { ...valid, title: 'ab' }, { ...valid, title: 'x'.repeat(121) }, { ...valid, purpose: 'x'.repeat(9) }, { ...valid, purpose: 'x'.repeat(2001) }, { ...valid, amount: '0.00' }, { ...valid, reviewerId: unrelated.id }]) {
      assert.equal((await call(owner, '', 'POST', invalid)).status, 422);
    }
    assert.equal((await call(other, '', 'POST', valid)).status, 409);
    await db.reviewerAssignment.create({ data: { requesterId: other.id, reviewerId: owner.id } });
    assert.equal((await call(other, '', 'POST', valid)).status, 409);
    assert.equal(await db.purchaseRequest.count({ where: { requesterId: { in: users } } }), 0);
    const created = await call(owner, '', 'POST', valid);
    assert.equal(created.status, 201);
    const { request } = await created.json();
    assert.equal(request.title, 'Pens');
    assert.equal(request.amount, '0.01');
    assert.equal(request.currency, 'THB');
    assert.equal(request.status, 'SUBMITTED');
    assert.equal(request.reviewerId, assigned.id);
    assert.equal(request.history.length, 1);
    assert.equal(request.history[0].actorId, owner.id);
    assert.equal(request.history[0].type, 'SUBMITTED');
    assert.equal((await call(owner, '/' + request.id, 'PATCH', valid)).status, 404);
    await db.reviewerAssignment.update({
      where: { requesterId: other.id },
      data: { reviewerId: unrelated.id },
    });
    const otherCreated = await call(other, '', 'POST', { ...valid, title: 'Second request' });
    assert.equal(otherCreated.status, 201);
    const { request: otherRequest } = await otherCreated.json();
    assert.equal(otherRequest.requesterId, other.id);
    assert.equal(otherRequest.reviewerId, unrelated.id);

    assert.equal((await call(owner, '/invalid-id')).status, 404);
    await db.$disconnect();
    for (const [who, visible, privateRequest, requesterLogin] of [
      [owner, request, otherRequest],
      [other, otherRequest, request],
      [assigned, request, otherRequest, owner.login],
      [unrelated, otherRequest, request, other.login],
    ]) {
      const expected = requesterLogin === undefined ? visible : { ...visible, requesterLogin };
      assert.deepEqual(await (await call(who, '/' + visible.id)).json(), { request: expected });
      assert.equal((await call(who, '/' + privateRequest.id)).status, 404);
      const list = await call(who);
      assert.equal(list.status, 200);
      const { requests } = await list.json();
      assert.deepEqual(requests.map(({ id }) => id), [visible.id]);
      assert.equal(requests[0].requesterLogin, requesterLogin);
      assert.equal(Object.hasOwn(requests[0], 'requesterLogin'), requesterLogin !== undefined);
      assert.equal('history' in requests[0], false);
    }
    const upper = await call(owner, '', 'POST', { title: 'x'.repeat(120), purpose: 'x'.repeat(2000), amount: '1000000.00' });
    assert.equal(upper.status, 201);
    assert.equal((await upper.json()).request.amount, '1000000.00');
    const lower = await call(owner, '', 'POST', { title: 'xxx', purpose: 'x'.repeat(10), amount: '0.01' });
    assert.equal(lower.status, 201);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await db.requestEvent.deleteMany({ where: { request: { requesterId: { in: users } } } });
    await db.purchaseRequest.deleteMany({ where: { requesterId: { in: users } } });
    await db.reviewerAssignment.deleteMany({ where: { requesterId: { in: users } } });
    await db.session.deleteMany({ where: { userId: { in: users } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
});

test('AC-15 to AC-18, AC-20 and AC-21: requester withdrawal API and persistence', async () => {
  const url = testDatabaseUrl(process.env.TEST_DATABASE_URL, developmentDatabaseUrl());
  const db = new PrismaClient({ datasources: { db: { url } } });
  const users = [];
  const origin = 'http://127.0.0.1';
  let server;
  async function account(role) {
    const user = await db.user.create({ data: { login: randomUUID(), role, passwordHash: 'unused-test-hash' } });
    users.push(user.id);
    const token = randomBytes(32).toString('hex');
    await db.session.create({ data: { userId: user.id, tokenDigest: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 60000) } });
    return { id: user.id, cookie: 'session=' + token };
  }
  try {
    const owner = await account('REQUESTER');
    const other = await account('REQUESTER');
    const reviewer = await account('REVIEWER');
    const unrelatedReviewer = await account('REVIEWER');
    await db.reviewerAssignment.create({ data: { requesterId: owner.id, reviewerId: reviewer.id } });
    server = createApp(db, { origin }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = 'http://127.0.0.1:' + server.address().port + '/api/requests';
    const call = (who, path = '', method = 'GET', body) => fetch(base + path, {
      method,
      headers: { origin, ...(who && { cookie: who.cookie }), ...(body && { 'content-type': 'application/json' }) },
      body: body && JSON.stringify(body),
    });
    const submission = { title: '  Pens ', purpose: 'Office supplies', amount: '0.01' };
    async function createRequest(title = submission.title) {
      const response = await call(owner, '', 'POST', { ...submission, title });
      assert.equal(response.status, 201);
      return (await response.json()).request;
    }

    const withdrawn = await createRequest();
    const success = await call(owner, `/${withdrawn.id}/withdraw`, 'POST', { reason: '  No longer needed  ' });
    assert.equal(success.status, 200);
    const saved = (await success.json()).request;
    assert.equal(saved.status, 'WITHDRAWN');
    assert.equal(saved.history.length, 2);
    assert.equal(saved.history[1].type, 'WITHDRAWN');
    assert.equal(saved.history[1].actorId, owner.id);
    assert.equal(saved.history[1].reason, 'No longer needed');
    assert.equal((await call(owner, `/${withdrawn.id}/withdraw`, 'POST', { reason: 'Again' })).status, 409);

    for (const [who, expected] of [[null, 401], [reviewer, 403], [other, 404], [unrelatedReviewer, 403]]) {
      assert.equal((await call(who, `/${withdrawn.id}/withdraw`, 'POST', { reason: 'Valid reason' })).status, expected);
    }
    assert.equal((await call(owner, '/not-a-uuid/withdraw', 'POST', { reason: 'Valid reason' })).status, 404);

    for (const [reason, expected] of [[undefined, 422], ['  \t\n ', 422], ['😀'.repeat(501), 422], ['x', 200], ['😀'.repeat(500), 200]]) {
      const request = await createRequest('Reason boundary');
      const response = await call(owner, `/${request.id}/withdraw`, 'POST', reason === undefined ? {} : { reason });
      assert.equal(response.status, expected);
      const stored = await db.purchaseRequest.findUnique({ where: { id: request.id }, include: { events: true } });
      if (expected === 422) {
        assert.equal(stored.status, 'SUBMITTED');
        assert.equal(stored.events.length, 1);
        assert.equal(stored.events[0].type, 'SUBMITTED');
      } else {
        const detail = (await response.json()).request;
        assert.equal(detail.status, 'WITHDRAWN');
        assert.equal(detail.history[1].reason, reason);
      }
    }

    const reviewerDetail = await call(reviewer, `/${withdrawn.id}`);
    assert.equal(reviewerDetail.status, 200);
    assert.equal((await reviewerDetail.json()).request.history[1].reason, 'No longer needed');
    assert.equal((await call(other, `/${withdrawn.id}`)).status, 404);

    for (const decision of ['APPROVE', 'REJECT']) {
      const item = await createRequest('Competing transitions');
      const results = await Promise.all([
        call(owner, `/${item.id}/withdraw`, 'POST', { reason: 'No longer needed' }),
        call(reviewer, `/${item.id}/decision`, 'POST', { decision, reason: 'Reviewed', version: item.version }),
      ]);
      assert.deepEqual(results.map(({ status }) => status).sort(), [200, 409]);
      const decisionWon = results[1].status === 200;
      const expected = decisionWon ? (decision === 'APPROVE' ? 'APPROVED' : 'REJECTED') : 'WITHDRAWN';
      const retry = decisionWon
        ? await call(owner, `/${item.id}/withdraw`, 'POST', { reason: 'No longer needed' })
        : await call(reviewer, `/${item.id}/decision`, 'POST', { decision, reason: 'Reviewed', version: item.version });
      assert.equal(retry.status, 409);
      const stored = await db.purchaseRequest.findUnique({ where: { id: item.id }, include: { events: true } });
      assert.equal(stored.status, expected);
      assert.deepEqual(stored.events.filter(({ type }) => type !== 'SUBMITTED').map(({ type }) => type), [expected]);
    }

    const rollback = await createRequest('Rollback on duplicate terminal event');
    const event = { requestId: rollback.id, actorId: owner.id, type: 'WITHDRAWN' };
    for (const reason of [null, '\u00a0', ' leading']) {
      await assert.rejects(db.requestEvent.create({ data: { ...event, reason } }), /request_event_(withdrawal_)?reason/);
    }
    await db.requestEvent.create({ data: { ...event, reason: 'Fixture terminal event' } });
    const readEvents = () => db.requestEvent.findMany({ where: { requestId: rollback.id }, orderBy: { id: 'asc' } });
    const before = await readEvents();
    assert.equal((await call(owner, `/${rollback.id}/withdraw`, 'POST', { reason: 'Second terminal event' })).status, 500);
    assert.equal((await db.purchaseRequest.findUnique({ where: { id: rollback.id } })).status, 'SUBMITTED');
    assert.deepEqual(await readEvents(), before);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await db.requestEvent.deleteMany({ where: { request: { requesterId: { in: users } } } });
    await db.purchaseRequest.deleteMany({ where: { requesterId: { in: users } } });
    await db.reviewerAssignment.deleteMany({ where: { requesterId: { in: users } } });
    await db.session.deleteMany({ where: { userId: { in: users } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
});
