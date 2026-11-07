import assert from 'node:assert/strict';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { startBrowserServer, stopBrowserServer } from './browser-server.mjs';
import { developmentDatabaseUrl, testDatabaseUrl } from '../scripts/test-db.mjs';

test('Sprint 1: requester to reviewer decision survives application restart', { timeout: 60000 }, async () => {
  const url = testDatabaseUrl(process.env.TEST_DATABASE_URL, developmentDatabaseUrl());
  const db = new PrismaClient({ datasources: { db: { url } } });
  const password = randomUUID();
  const salt = randomBytes(16);
  const hash = `scrypt:${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`;
  let server, browser, requester, reviewer;

  try {
    requester = await db.user.create({ data: { login: randomUUID(), role: 'REQUESTER', passwordHash: hash } });
    reviewer = await db.user.create({ data: { login: randomUUID(), role: 'REVIEWER', passwordHash: hash } });
    await db.reviewerAssignment.create({ data: { requesterId: requester.id, reviewerId: reviewer.id } });
    const started = await startBrowserServer(url);
    server = started.server;
    const { origin } = started;
    browser = await chromium.launch({ channel: process.env.WORKFLOW_BROWSER_CHANNEL || undefined });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(5000);

    await page.goto(origin + '/login');
    await page.getByLabel('Login').fill(requester.login);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(origin + '/requests');
    await page.getByRole('link', { name: 'Create request' }).click();
    await page.getByLabel('Title').fill('Project pens');
    await page.getByLabel('Purpose').fill('Supplies for the team');
    await page.getByLabel('Amount (THB)').fill('125.50');
    await page.getByRole('button', { name: 'Submit request' }).click();
    await page.waitForURL(/\/requests\/[0-9a-f-]+$/);
    const requestId = page.url().split('/').at(-1);
    await page.getByText('Status: SUBMITTED').waitFor();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL(origin + '/login');
    assert.equal((await page.request.get(origin + '/api/session')).status(), 401);

    await page.getByLabel('Login').fill(reviewer.login);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(origin + '/reviews');
    await page.getByRole('link', { name: 'Project pens' }).click();
    await page.getByRole('button', { name: 'Approve' }).click();
    await page.getByText('Status: APPROVED').waitFor();
    await stopBrowserServer(server);
    server = (await startBrowserServer(url, origin)).server;
    await page.reload();
    await page.getByText('Status: APPROVED').waitFor();
    assert.equal((await page.locator('.request-detail li').allTextContents()).length, 2);

    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL(origin + '/login');
    await page.getByLabel('Login').fill(requester.login);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(origin + '/requests');
    await page.goto(origin + '/requests/' + requestId);
    await page.getByText('Status: APPROVED').waitFor();
    assert.equal((await db.purchaseRequest.findUnique({ where: { id: requestId } })).status, 'APPROVED');
    assert.deepEqual((await db.requestEvent.findMany({ where: { requestId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] })).map(({ type }) => type), ['SUBMITTED', 'APPROVED']);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
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
    await db.$disconnect();
  }
});
