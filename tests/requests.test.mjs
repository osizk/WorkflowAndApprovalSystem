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
    return { id: user.id, cookie: 'session=' + token };
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
    for (const who of [other, unrelated]) {
      assert.deepEqual(await (await call(who)).json(), { requests: [] });
      assert.equal((await call(who, '/' + request.id)).status, 404);
    }
    assert.equal((await call(owner, '/invalid-id')).status, 404);
    await db.$disconnect();
    for (const who of [owner, assigned]) {
      assert.deepEqual(await (await call(who, '/' + request.id)).json(), { request });
      const { requests } = await (await call(who)).json();
      assert.deepEqual(requests.map(({ id }) => id), [request.id]);
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
