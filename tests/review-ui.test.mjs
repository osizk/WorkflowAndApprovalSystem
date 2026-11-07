import assert from 'node:assert/strict';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { startBrowserServer, stopBrowserServer } from './browser-server.mjs';
import { developmentDatabaseUrl, testDatabaseUrl } from '../scripts/test-db.mjs';

test('F-03: reviewer rejects an assigned request and reads persisted history', { timeout: 30000 }, async () => {
  const url = testDatabaseUrl(process.env.TEST_DATABASE_URL, developmentDatabaseUrl());
  const db = new PrismaClient({ datasources: { db: { url } } });
  const password = randomUUID();
  const salt = randomBytes(16);
  const hash = `scrypt:${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`;
  let server, browser, requester, reviewer, unrelated;
  try {
    requester = await db.user.create({ data: { login: randomUUID(), role: 'REQUESTER', passwordHash: hash } });
    reviewer = await db.user.create({ data: { login: randomUUID(), role: 'REVIEWER', passwordHash: hash } });
    unrelated = await db.user.create({ data: { login: randomUUID(), role: 'REVIEWER', passwordHash: hash } });
    const started = await startBrowserServer(url);
    server = started.server;
    const { origin } = started;
    browser = await chromium.launch({ channel: process.env.WORKFLOW_BROWSER_CHANNEL || undefined });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(5000);
        const assigned = await db.purchaseRequest.create({ data: {
      requesterId: requester.id, reviewerId: reviewer.id, title: 'Pens', purpose: 'Office supplies', amountSatang: 120,
      events: { create: { actorId: requester.id, type: 'SUBMITTED' } },
    } });
    const hidden = await db.purchaseRequest.create({ data: {
      requesterId: requester.id, reviewerId: unrelated.id, title: 'Hidden request', purpose: 'Office supplies', amountSatang: 120,
      events: { create: { actorId: requester.id, type: 'SUBMITTED' } },
    } });
    const approval = await db.purchaseRequest.create({ data: {
      requesterId: requester.id, reviewerId: reviewer.id, title: 'Paper', purpose: 'Office supplies', amountSatang: 120,
      events: { create: { actorId: requester.id, type: 'SUBMITTED' } },
    } });
    await page.goto(origin + '/login');
    await page.getByLabel('Login').fill(reviewer.login);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(origin + '/reviews');
    await page.getByRole('link', { name: 'Pens' }).click();
    await page.waitForURL(origin + '/reviews/' + assigned.id);
    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByText('A rejection reason is required.').waitFor();
    await page.getByLabel('Reason').fill('Already in stock');
    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByText('Decision saved.').waitFor();
    await page.reload();
    await page.getByText('Status: REJECTED').waitFor();
    await page.getByText('Already in stock', { exact: false }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Reject' }).count(), 0);
    assert.equal(await db.requestEvent.count({ where: { requestId: assigned.id } }), 2);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await page.getByRole('link', { name: 'Back to review queue' }).click();
    await page.getByRole('link', { name: 'Paper' }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'Hidden request' }).count(), 0);
    await page.getByRole('link', { name: 'Paper' }).click();
    await page.getByRole('button', { name: 'Approve' }).click();
    await page.getByText('Status: APPROVED').waitFor();
    assert.equal(await db.requestEvent.count({ where: { requestId: approval.id, type: 'APPROVED' } }), 1);
    await page.goto(origin + '/reviews/' + hidden.id);
    await page.getByText('Request not found.').waitFor();
  } finally {
    await browser?.close();
    await stopBrowserServer(server);
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
    if (unrelated) await db.user.delete({ where: { id: unrelated.id } });
    await db.$disconnect();
  }
});
