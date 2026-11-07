import assert from 'node:assert/strict';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { after, before, test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import { createApp, requireRole, requireSession } from '../dist/auth.js';
import { developmentDatabaseUrl, testDatabaseUrl } from '../scripts/test-db.mjs';

const url = testDatabaseUrl(process.env.TEST_DATABASE_URL, developmentDatabaseUrl());
const db = new PrismaClient({ datasources: { db: { url } } });
const login = `auth-${randomUUID()}`;
const password = 'correct-test-password';
const origin = 'http://127.0.0.1';
let user;
let reviewer;
let server;
let base;
let clockNow = new Date();

before(async () => {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  user = await db.user.create({ data: { login, role: 'REQUESTER', passwordHash: `scrypt:${salt.toString('hex')}:${hash.toString('hex')}` } });
  reviewer = await db.user.create({ data: { login: `${login}-reviewer`, role: 'REVIEWER', passwordHash: `scrypt:${salt.toString('hex')}:${hash.toString('hex')}` } });
  const app = createApp(db, { origin, now: () => clockNow });
  app.get('/test/reviewer', requireSession(db), requireRole('REVIEWER'), (_req, res) => res.json({ ok: true }));
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (user) {
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.user.delete({ where: { id: user.id } });
  }
  if (reviewer) {
    await db.session.deleteMany({ where: { userId: reviewer.id } });
    await db.user.delete({ where: { id: reviewer.id } });
  }
  await db.$disconnect();
});

test('TEST-01 to TEST-03: login, current identity, role isolation and logout', async () => {
  const anonymous = await fetch(`${base}/api/session`);
  assert.equal(anonymous.status, 401);
  const bad = await fetch(`${base}/api/session`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ login, password: 'wrong' }) });
  assert.equal(bad.status, 401);
  assert.equal(await db.session.count({ where: { userId: user.id } }), 0);
  const signedIn = await fetch(`${base}/api/session`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ login: login.toUpperCase(), password }) });
  assert.equal(signedIn.status, 200);
  assert.deepEqual(await signedIn.json(), { id: user.id, role: 'REQUESTER' });
  const cookie = signedIn.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Max-Age=28800/);
  const header = { cookie: cookie.split(';')[0] };
  const current = await fetch(`${base}/api/session`, { headers: header });
  assert.deepEqual(await current.json(), { id: user.id, role: 'REQUESTER' });
  assert.equal((await fetch(`${base}/test/reviewer`, { headers: header })).status, 403);
  assert.equal((await fetch(`${base}/test/reviewer`)).status, 401);
  assert.equal((await fetch(`${base}/api/session`, { method: 'DELETE', headers: { ...header, origin } })).status, 204);
  assert.equal((await fetch(`${base}/api/session`, { headers: header })).status, 401);
  assert.equal((await fetch(`${base}/api/session`, { method: 'DELETE', headers: { ...header, origin } })).status, 204);
  const reviewerLogin = await fetch(`${base}/api/session`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ login: reviewer.login, password }) });
  assert.deepEqual(await reviewerLogin.json(), { id: reviewer.id, role: 'REVIEWER' });
  assert.equal((await fetch(`${base}/test/reviewer`, { headers: { cookie: reviewerLogin.headers.get('set-cookie').split(';')[0] } })).status, 200);
});

test('TEST-03: expired session and wrong origin are refused', async () => {
  const wrongOrigin = await fetch(`${base}/api/session`, { method: 'POST', headers: { origin: 'http://other.example', 'content-type': 'application/json' }, body: JSON.stringify({ login, password }) });
  assert.equal(wrongOrigin.status, 403);
  const missingOrigin = await fetch(`${base}/api/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ login, password }) });
  assert.equal(missingOrigin.status, 403);
  const malformed = await fetch(`${base}/api/session`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400);
  const extraField = await fetch(`${base}/api/session`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ login, password, role: 'REVIEWER' }) });
  assert.equal(extraField.status, 422);
  const token = randomBytes(32).toString('hex');
  const { createHash } = await import('node:crypto');
  const expiry = new Date(clockNow.getTime() + 1000);
  await db.session.create({ data: { tokenDigest: createHash('sha256').update(token).digest('hex'), userId: user.id, expiresAt: expiry } });
  assert.equal((await fetch(`${base}/api/session`, { headers: { cookie: `session=${token}` } })).status, 200);
  clockNow = expiry;
  assert.equal((await fetch(`${base}/api/session`, { headers: { cookie: `session=${token}` } })).status, 401);
});
