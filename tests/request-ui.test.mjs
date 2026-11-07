import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { developmentDatabaseUrl, testDatabaseUrl } from '../scripts/test-db.mjs';

test('F-02: browser submits and retrieves a saved request', { timeout: 30000 }, async () => {
  const url = testDatabaseUrl(process.env.TEST_DATABASE_URL, developmentDatabaseUrl());
  const db = new PrismaClient({ datasources: { db: { url } } });
  const password = randomUUID();
  const salt = randomBytes(16);
  const hash = `scrypt:${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`;
  const origin = 'http://127.0.0.1:55477';
  let server, browser, requester, reviewer;
  try {
    requester = await db.user.create({ data: { login: randomUUID(), role: 'REQUESTER', passwordHash: hash } });
    reviewer = await db.user.create({ data: { login: randomUUID(), role: 'REVIEWER', passwordHash: hash } });
    server = spawn(process.execPath, ['dist/server.js'], {
      env: { ...process.env, DATABASE_URL: url, PUBLIC_ORIGIN: origin, PORT: '55477' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await Promise.race([
      once(server.stdout, 'data'),
      once(server, 'exit').then(([code]) => { throw new Error(`API exited: ${code}`); }),
      once(server, 'error').then(([error]) => { throw error; }),
    ]);
    browser = await chromium.launch({ channel: process.env.WORKFLOW_BROWSER_CHANNEL || undefined });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(5000);
    await page.goto(`${origin}/login`);
    await page.getByLabel('Login').fill(requester.login);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(`${origin}/requests`);
    await page.getByText('You have no requests yet.').waitFor();
    await page.getByRole('link', { name: 'Create request' }).click();
    await page.waitForURL(`${origin}/requests/new`);
    await page.getByLabel('Title').fill('ab');
    await page.getByLabel('Purpose').fill('Office supplies');
    await page.getByLabel('Amount (THB)').fill('0.01');
    await page.getByRole('button', { name: 'Submit request' }).click();
    await page.getByText('Enter 3 to 120 characters.').waitFor();
    await page.getByLabel('Title').fill('Pens');
    await page.getByRole('button', { name: 'Submit request' }).click();
    await page.getByText('No eligible reviewer is available. Try again later.').waitFor();
    assert.equal(await page.getByLabel('Title').inputValue(), 'Pens');
    await db.reviewerAssignment.create({ data: { requesterId: requester.id, reviewerId: reviewer.id } });
    await page.getByRole('button', { name: 'Submit request' }).click();
    await page.waitForURL(/\/requests\/[0-9a-f-]+$/);
    await page.getByText('Status: SUBMITTED').waitFor();
    await page.getByText('SUBMITTED ·', { exact: false }).waitFor();
    const id = page.url().split('/').at(-1);
    await page.reload();
    await page.getByText('Status: SUBMITTED').waitFor();
    assert.equal((await db.purchaseRequest.findUnique({ where: { id }, include: { events: true } })).events.length, 1);
    await page.getByRole('link', { name: 'Back to my requests' }).click();
    await page.getByRole('link', { name: 'Pens' }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  } finally {
    await browser?.close();
    if (server && server.exitCode === null && server.pid) {
      const exited = once(server, 'exit');
      server.kill();
      await exited;
    }
    if (requester) {
      await db.requestEvent.deleteMany({ where: { request: { requesterId: requester.id } } });
      await db.purchaseRequest.deleteMany({ where: { requesterId: requester.id } });
      await db.reviewerAssignment.deleteMany({ where: { requesterId: requester.id } });
      await db.session.deleteMany({ where: { userId: requester.id } });
      await db.user.delete({ where: { id: requester.id } });
    }
    if (reviewer) {
      await db.session.deleteMany({ where: { userId: reviewer.id } });
      await db.user.delete({ where: { id: reviewer.id } });
    }
    await db.$disconnect();
  }
});
