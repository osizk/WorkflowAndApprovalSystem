import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../dist/auth.js';
import { developmentDatabaseUrl, testDatabaseUrl } from '../scripts/test-db.mjs';

async function query(db, run) {
  const server = createApp(db, { origin: 'http://127.0.0.1' }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await run((token) => fetch('http://127.0.0.1:' + server.address().port + '/api/requests/decision-summary',
      { headers: token ? { cookie: 'session=' + token } : {} }));
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

test('TEST-35: summaries count current final status in the full authorized set', async () => {
  const db = new PrismaClient({ datasources: { db: { url: testDatabaseUrl(process.env.TEST_DATABASE_URL, developmentDatabaseUrl()) } } });
  const ids = [];
  async function account(role) {
    const user = await db.user.create({ data: { login: randomUUID(), role, passwordHash: 'unused-test-hash' } });
    ids.push(user.id);
    const token = randomBytes(32).toString('hex');
    await db.session.create({ data: { userId: user.id, tokenDigest: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 60000) } });
    return { id: user.id, token };
  }
  try {
    const a = await account('REQUESTER');
    const b = await account('REQUESTER');
    const ra = await account('REVIEWER');
    const rb = await account('REVIEWER');
    const empty = await account('REQUESTER');
    for (const [owner, reviewer, statuses] of [
      [a, ra, [...Array(12).fill('APPROVED'), 'REJECTED', 'SUBMITTED', 'RETURNED', 'WITHDRAWN']],
      [a, rb, ['APPROVED']],
      [b, ra, ['REJECTED']],
      [b, rb, ['APPROVED', 'REJECTED']],
    ]) {
      await db.purchaseRequest.createMany({ data: statuses.map((status) => ({
        requesterId: owner.id, reviewerId: reviewer.id, status, title: 'Summary fixture', purpose: 'Office supplies', amountSatang: 100,
      })) });
    }
    await query(db, async (get) => {
      for (const [user, approved, rejected] of [[a, 13, 1], [b, 1, 2], [ra, 12, 2], [rb, 2, 1], [empty, 0, 0]]) {
        const response = await get(user.token);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { approved, rejected });
      }
    });
  } finally {
    await db.purchaseRequest.deleteMany({ where: { requesterId: { in: ids } } });
    await db.session.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  }
});

test('TEST-36: missing and expired sessions are denied and repository failures use the standard envelope', async () => {
  const expiredToken = randomBytes(32).toString('hex');
  const activeToken = randomBytes(32).toString('hex');
  const sessionRow = { tokenDigest: createHash('sha256').update(activeToken).digest('hex'), expiresAt: new Date(Date.now() + 60000), user: { id: randomUUID(), role: 'REQUESTER' } };
  let countCalls = 0;
  const db = {
    session: { findFirst: async ({ where }) => {
      const row = where.tokenDigest === sessionRow.tokenDigest ? sessionRow : {
        ...sessionRow, tokenDigest: createHash('sha256').update(expiredToken).digest('hex'), expiresAt: new Date(0),
      };
      return where.tokenDigest === row.tokenDigest && row.expiresAt > where.expiresAt.gt ? row : null;
    } },
    purchaseRequest: { groupBy: async () => { countCalls++; throw new Error('test-only database failure'); } },
  };
  await query(db, async (get) => {
    for (const token of [undefined, expiredToken]) {
      const response = await get(token);
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { error: { code: 'AUTH_REQUIRED', message: 'Sign in required' } });
    }
    assert.equal(countCalls, 0);
    const failure = await get(activeToken);
    assert.equal(failure.status, 500);
    assert.deepEqual(await failure.json(), { error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } });
    assert.equal(countCalls, 1);
  });
});
