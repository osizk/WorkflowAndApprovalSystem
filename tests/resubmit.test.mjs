import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../dist/auth.js';
import { developmentDatabaseUrl, testDatabaseUrl } from '../scripts/test-db.mjs';

async function withHarness(run) {
  const url = testDatabaseUrl(process.env.TEST_DATABASE_URL, developmentDatabaseUrl());
  const db = new PrismaClient({ datasources: { db: { url } } });
  const users = [];
  const origin = 'http://127.0.0.1';
  let server;
  async function account(role) {
    const user = await db.user.create({ data: { login: randomUUID(), role, passwordHash: 'unused-test-hash' } });
    users.push(user.id);
    const token = randomBytes(32).toString('hex');
    await db.session.create({
      data: {
        userId: user.id,
        tokenDigest: createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    return { id: user.id, cookie: 'session=' + token };
  }
  try {
    const owner = await account('REQUESTER');
    const otherOwner = await account('REQUESTER');
    const reviewer = await account('REVIEWER');
    await db.reviewerAssignment.create({ data: { requesterId: owner.id, reviewerId: reviewer.id } });
    server = createApp(db, { origin }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = 'http://127.0.0.1:' + server.address().port + '/api/requests';
    const call = (who, path = '', method = 'GET', body) => fetch(base + path, {
      method,
      headers: { origin, ...(who && { cookie: who.cookie }), ...(body !== undefined && { 'content-type': 'application/json' }) },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    const createRequest = async () => {
      const response = await call(owner, '', 'POST', {
        title: 'Original pens', purpose: 'Purchase office supplies', amount: '12.34',
      });
      assert.equal(response.status, 201);
      return (await response.json()).request;
    };
    const returnRequest = async (request, version, reason = 'Please revise this request') => {
      const response = await call(reviewer, `/${request.id}/return`, 'POST', { reason, version });
      assert.equal(response.status, 200);
      return (await response.json()).request;
    };
    const snapshot = async (id) => {
      const request = await db.purchaseRequest.findUnique({
        where: { id }, include: { events: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] } },
      });
      return {
        id: request.id,
        requesterId: request.requesterId,
        reviewerId: request.reviewerId,
        title: request.title,
        purpose: request.purpose,
        amountSatang: request.amountSatang,
        status: request.status,
        version: request.version,
        events: request.events.map(({ id: eventId, actorId, type, reason, createdAt }) => ({
          id: eventId, actorId, type, reason, createdAt,
        })),
      };
    };
    await run({ db, owner, otherOwner, reviewer, base, call, createRequest, returnRequest, snapshot });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await db.requestEvent.deleteMany({ where: { request: { requesterId: { in: users } } } });
    await db.purchaseRequest.deleteMany({ where: { requesterId: { in: users } } });
    await db.reviewerAssignment.deleteMany({ where: { requesterId: { in: users } } });
    await db.session.deleteMany({ where: { userId: { in: users } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
}

test('TEST-26: owner resubmits and repeats the Return/Resubmit cycle', async () => {
  await withHarness(async ({ call, createRequest, returnRequest, owner, reviewer, snapshot }) => {
    const original = await createRequest();
    assert.equal(original.version, 1);
    const returned = await returnRequest(original, 1, '  Add the missing quantity  ');
    assert.equal(returned.status, 'RETURNED');
    assert.equal(returned.version, 2);

    const first = await call(owner, `/${original.id}/resubmit`, 'POST', {
      title: '  Revised pens  ', purpose: '  Purchase blue office pens  ', amount: '25.05', version: 2,
    });
    assert.equal(first.status, 200);
    const firstDetail = (await first.json()).request;
    assert.equal(firstDetail.id, original.id);
    assert.equal(firstDetail.requesterId, owner.id);
    assert.equal(firstDetail.reviewerId, reviewer.id);
    assert.equal(firstDetail.title, 'Revised pens');
    assert.equal(firstDetail.purpose, 'Purchase blue office pens');
    assert.equal(firstDetail.amount, '25.05');
    assert.equal(firstDetail.status, 'SUBMITTED');
    assert.equal(firstDetail.version, 3);
    assert.deepEqual(firstDetail.history.map(({ type }) => type), ['SUBMITTED', 'RETURNED', 'RESUBMITTED']);
    assert.equal(firstDetail.history[1].reason, 'Add the missing quantity');
    assert.equal(firstDetail.history[2].actorId, owner.id);
    assert.equal((await snapshot(original.id)).events.length, 3);

    const returnedAgain = await returnRequest(firstDetail, 3, '  Use a different item  ');
    assert.equal(returnedAgain.version, 4);
    const second = await call(owner, `/${original.id}/resubmit`, 'POST', {
      title: 'Second revision', purpose: 'Purchase replacement items', amount: '100.00', version: 4,
    });
    assert.equal(second.status, 200);
    const final = (await second.json()).request;
    assert.equal(final.id, original.id);
    assert.equal(final.reviewerId, reviewer.id);
    assert.equal(final.status, 'SUBMITTED');
    assert.equal(final.version, 5);
    assert.deepEqual(final.history.map(({ type }) => type), [
      'SUBMITTED', 'RETURNED', 'RESUBMITTED', 'RETURNED', 'RESUBMITTED',
    ]);
    assert.deepEqual(final.history.filter(({ type }) => type === 'RESUBMITTED').map(({ actorId }) => actorId), [owner.id, owner.id]);
    assert.equal((await snapshot(original.id)).events.length, 5);
  });
});

test('TEST-27: resubmit trims and validates Unicode fields and exact satang without invalid writes', async () => {
  await withHarness(async ({ call, createRequest, returnRequest, owner, snapshot }) => {
    const initial = await createRequest();
    await returnRequest(initial, 1);
    const minimumTitle = '😀'.repeat(3);
    const minimumPurpose = '😀'.repeat(10);
    const minimum = await call(owner, `/${initial.id}/resubmit`, 'POST', {
      title: `  ${minimumTitle}  `, purpose: `  ${minimumPurpose}  `, amount: '0.01', version: 2,
    });
    assert.equal(minimum.status, 200);
    let minimumResult = (await minimum.json()).request;
    assert.equal(minimumResult.title, minimumTitle);
    assert.equal(minimumResult.purpose, minimumPurpose);
    assert.equal(minimumResult.amount, '0.01');
    assert.equal((await snapshot(initial.id)).amountSatang, 1);

    await returnRequest(minimumResult, 3);
    const maximumTitle = 'a'.repeat(119) + '😀';
    const maximumPurpose = 'b'.repeat(1999) + '😀';
    const maximum = await call(owner, `/${initial.id}/resubmit`, 'POST', {
      title: ` ${maximumTitle} `, purpose: ` ${maximumPurpose} `, amount: '1000000.00', version: 4,
    });
    assert.equal(maximum.status, 200);
    const maximumResult = (await maximum.json()).request;
    assert.equal(maximumResult.title, maximumTitle);
    assert.equal(maximumResult.purpose, maximumPurpose);
    assert.equal(maximumResult.amount, '1000000.00');
    assert.equal((await snapshot(initial.id)).amountSatang, 100000000);

    const invalidCases = [
      { name: 'short title', field: 'title', patch: { title: '😀😀' } },
      { name: 'long title', field: 'title', patch: { title: 'x'.repeat(120) + '😀' } },
      { name: 'short purpose', field: 'purpose', patch: { purpose: '😀'.repeat(9) } },
      { name: 'long purpose', field: 'purpose', patch: { purpose: 'x'.repeat(2000) + '😀' } },
      { name: 'numeric amount', field: 'amount', patch: { amount: 12.34 } },
      { name: 'zero amount', field: 'amount', patch: { amount: '0.00' } },
      { name: 'amount above maximum', field: 'amount', patch: { amount: '1000000.01' } },
      { name: 'extra amount precision', field: 'amount', patch: { amount: '12.345' } },
      { name: 'missing title', field: 'title', omit: 'title' },
      { name: 'missing purpose', field: 'purpose', omit: 'purpose' },
      { name: 'missing amount', field: 'amount', omit: 'amount' },
      { name: 'missing version', field: 'version', omit: 'version' },
      { name: 'string version', field: 'version', patch: { version: '2' } },
      { name: 'zero version', field: 'version', patch: { version: 0 } },
      { name: 'fractional version', field: 'version', patch: { version: 1.5 } },
    ];
    for (const { name, field, patch = {}, omit } of invalidCases) {
      const candidate = await createRequest();
      await returnRequest(candidate, 1);
      const payload = {
        title: 'Revised pens', purpose: 'Purchase office supplies', amount: '12.34', version: 2,
        ...patch,
      };
      if (omit) delete payload[omit];
      const before = await snapshot(candidate.id);
      const response = await call(owner, `/${candidate.id}/resubmit`, 'POST', payload);
      assert.equal(response.status, 422, name);
      const { error } = await response.json();
      assert.equal(error.code, 'VALIDATION_ERROR', name);
      assert.ok(error.fields[field], name);
      assert.deepEqual(await snapshot(candidate.id), before, `${name} must not change request or history`);
    }
  });
});

test('TEST-29 (Resubmit): stale, wrong-state and out-of-scope attempts do not mutate', async () => {
  await withHarness(async ({ call, createRequest, returnRequest, owner, otherOwner, reviewer, snapshot }) => {
    const candidate = await createRequest();
    const payload = { title: 'Revised pens', purpose: 'Purchase office supplies', amount: '12.34', version: 1 };
    let before = await snapshot(candidate.id);
    const premature = await call(owner, `/${candidate.id}/resubmit`, 'POST', payload);
    assert.equal(premature.status, 409);
    assert.equal((await premature.json()).error.code, 'REQUEST_CONFLICT');
    assert.deepEqual(await snapshot(candidate.id), before);

    await returnRequest(candidate, 1);
    before = await snapshot(candidate.id);
    const stale = await call(owner, `/${candidate.id}/resubmit`, 'POST', payload);
    assert.equal(stale.status, 409);
    assert.equal((await stale.json()).error.code, 'REQUEST_CONFLICT');
    assert.deepEqual(await snapshot(candidate.id), before);

    const validPayload = { ...payload, version: 2 };
    assert.equal((await call(null, `/${candidate.id}/resubmit`, 'POST', validPayload)).status, 401);
    assert.equal((await call(reviewer, `/${candidate.id}/resubmit`, 'POST', validPayload)).status, 403);
    assert.equal((await call(otherOwner, `/${candidate.id}/resubmit`, 'POST', validPayload)).status, 404);
    assert.equal((await call(owner, '/not-a-uuid/resubmit', 'POST', validPayload)).status, 404);

    const success = await call(owner, `/${candidate.id}/resubmit`, 'POST', validPayload);
    assert.equal(success.status, 200);
    before = await snapshot(candidate.id);
    const duplicate = await call(owner, `/${candidate.id}/resubmit`, 'POST', validPayload);
    assert.equal(duplicate.status, 409);
    assert.equal((await duplicate.json()).error.code, 'REQUEST_CONFLICT');
    assert.deepEqual(await snapshot(candidate.id), before);
  });
});
