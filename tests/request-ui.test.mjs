import assert from 'node:assert/strict';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { startBrowserServer, stopBrowserServer } from './browser-server.mjs';
import { developmentDatabaseUrl, testDatabaseUrl } from '../scripts/test-db.mjs';

test('F-02: browser submits and retrieves a saved request', { timeout: 30000 }, async () => {
  const url = testDatabaseUrl(process.env.TEST_DATABASE_URL, developmentDatabaseUrl());
  const db = new PrismaClient({ datasources: { db: { url } } });
  const password = randomUUID();
  const salt = randomBytes(16);
  const hash = `scrypt:${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`;
  let server, browser, requester, reviewer;
  try {
    requester = await db.user.create({ data: { login: randomUUID(), role: 'REQUESTER', passwordHash: hash } });
    reviewer = await db.user.create({ data: { login: randomUUID(), role: 'REVIEWER', passwordHash: hash } });
    const started = await startBrowserServer(url);
    server = started.server;
    const { origin } = started;
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

test('TEST-19: an owner withdraws a submitted request and the assigned reviewer sees read-only history', { timeout: 30000 }, async () => {
  const url = testDatabaseUrl(process.env.TEST_DATABASE_URL, developmentDatabaseUrl());
  const db = new PrismaClient({ datasources: { db: { url } } });
  const password = randomUUID();
  const salt = randomBytes(16);
  const hash = `scrypt:${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`;
  const title = 'Lab 7 withdrawal request';
  const reason = 'These supplies are no longer needed';
  let server, browser, requester, reviewer;
  try {
    requester = await db.user.create({ data: { login: randomUUID(), role: 'REQUESTER', passwordHash: hash } });
    reviewer = await db.user.create({ data: { login: randomUUID(), role: 'REVIEWER', passwordHash: hash } });
    const request = await db.purchaseRequest.create({ data: {
      requesterId: requester.id, reviewerId: reviewer.id, title, purpose: 'Office supplies', amountSatang: 120,
      events: { create: { actorId: requester.id, type: 'SUBMITTED' } },
    } });
    const started = await startBrowserServer(url);
    server = started.server;
    const { origin } = started;
    browser = await chromium.launch({ channel: process.env.WORKFLOW_BROWSER_CHANNEL || undefined });

    const ownerPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    ownerPage.setDefaultTimeout(5000);
    await ownerPage.goto(`${origin}/login`);
    await ownerPage.getByLabel('Login').fill(requester.login);
    await ownerPage.getByLabel('Password').fill(password);
    await ownerPage.getByRole('button', { name: 'Sign in' }).click();
    await ownerPage.waitForURL(`${origin}/requests`);
    await ownerPage.getByRole('link', { name: title, exact: true }).click();
    await ownerPage.waitForURL(`${origin}/requests/${request.id}`);
    await ownerPage.getByText('Status: SUBMITTED').waitFor();

    await ownerPage.getByRole('button', { name: 'Withdraw request', exact: true }).click();
    await ownerPage.getByLabel('Withdrawal reason', { exact: true }).fill(reason);
    await ownerPage.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click();
    await ownerPage.getByText('Status: WITHDRAWN').waitFor();
    await ownerPage.reload();
    await ownerPage.getByText('Status: WITHDRAWN').waitFor();
    await ownerPage.getByRole('listitem').filter({ hasText: 'SUBMITTED ·' }).waitFor();
    const ownerWithdrawal = ownerPage.getByRole('listitem').filter({ hasText: 'WITHDRAWN ·' });
    await ownerWithdrawal.filter({ hasText: reason }).waitFor();
    assert.equal(await ownerWithdrawal.count(), 1);
    assert.equal(await ownerPage.getByRole('button', { name: 'Withdraw request', exact: true }).count(), 0);

    const reviewerPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    reviewerPage.setDefaultTimeout(5000);
    await reviewerPage.goto(`${origin}/login`);
    await reviewerPage.getByLabel('Login').fill(reviewer.login);
    await reviewerPage.getByLabel('Password').fill(password);
    await reviewerPage.getByRole('button', { name: 'Sign in' }).click();
    await reviewerPage.waitForURL(`${origin}/reviews`);
    await reviewerPage.getByRole('link', { name: title, exact: true }).click();
    await reviewerPage.waitForURL(`${origin}/reviews/${request.id}`);
    await reviewerPage.getByText('Status: WITHDRAWN').waitFor();
    await reviewerPage.getByRole('listitem').filter({ hasText: 'SUBMITTED ·' }).waitFor();
    const reviewerWithdrawal = reviewerPage.getByRole('listitem').filter({ hasText: 'WITHDRAWN ·' });
    await reviewerWithdrawal.filter({ hasText: reason }).waitFor();
    assert.equal(await reviewerWithdrawal.count(), 1);
    assert.equal(await reviewerPage.getByRole('button', { name: 'Approve', exact: true }).count(), 0);
    assert.equal(await reviewerPage.getByRole('button', { name: 'Reject', exact: true }).count(), 0);
  } finally {
    await browser?.close();
    await stopBrowserServer(server);
    if (requester) {
      await db.requestEvent.deleteMany({ where: { request: { requesterId: requester.id } } });
      await db.purchaseRequest.deleteMany({ where: { requesterId: requester.id } });
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
