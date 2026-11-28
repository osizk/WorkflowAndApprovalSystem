import assert from 'node:assert/strict';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { startBrowserServer, stopBrowserServer } from './browser-server.mjs';
import { developmentDatabaseUrl, testDatabaseUrl } from '../scripts/test-db.mjs';

test('TEST-39: decision summary tracks Return, Resubmit, Approve and reload', { timeout: 60000 }, async () => {
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
    const requesterPage = await browser.newPage();
    const reviewerPage = await browser.newPage();

    async function signIn(page, user, workspace) {
      page.setDefaultTimeout(5000);
      await page.goto(origin + '/login');
      await page.getByLabel('Login').fill(user.login);
      await page.getByLabel('Password').fill(password);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.waitForURL(origin + workspace);
    }

    async function verifyTotals(page, approved, rejected) {
      const summary = page.getByRole('region', { name: 'Decision summary' });
      const totals = summary.locator('dd');
      await totals.nth(0).filter({ hasText: new RegExp('^' + approved + '$') }).waitFor();
      await totals.nth(1).filter({ hasText: new RegExp('^' + rejected + '$') }).waitFor();
      assert.deepEqual(await totals.allTextContents(), [String(approved), String(rejected)]);
    }

    await signIn(requesterPage, requester, '/requests');
    await signIn(reviewerPage, reviewer, '/reviews');
    await requesterPage.getByRole('link', { name: 'Create request' }).click();
    await requesterPage.getByLabel('Title').fill('Project pens');
    await requesterPage.getByLabel('Purpose').fill('Supplies for the team');
    await requesterPage.getByLabel('Amount (THB)').fill('125.50');
    await requesterPage.getByRole('button', { name: 'Submit request' }).click();
    await requesterPage.getByText('Status: SUBMITTED').waitFor();
    const requesterDetail = requesterPage.url();
    const reviewerDetail = origin + '/reviews/' + requesterDetail.split('/').at(-1);

    async function verifyWorkspaces(approved, rejected) {
      await requesterPage.goto(origin + '/requests');
      await reviewerPage.goto(origin + '/reviews');
      await verifyTotals(requesterPage, approved, rejected);
      await verifyTotals(reviewerPage, approved, rejected);
    }

    await verifyWorkspaces(0, 0);
    await reviewerPage.goto(reviewerDetail);
    await reviewerPage.getByLabel('Reason', { exact: true }).fill('Please clarify the quantity');
    await reviewerPage.getByRole('button', { name: 'Return', exact: true }).click();
    await reviewerPage.getByText('Status: RETURNED').waitFor();
    await verifyWorkspaces(0, 0);

    await requesterPage.goto(requesterDetail);
    await requesterPage.getByLabel('Title', { exact: true }).fill('Project pens for six people');
    await requesterPage.getByRole('button', { name: 'Edit & Resubmit' }).click();
    await requesterPage.getByText('Status: SUBMITTED').waitFor();
    await verifyWorkspaces(0, 0);

    await reviewerPage.goto(reviewerDetail);
    await reviewerPage.getByRole('button', { name: 'Approve', exact: true }).click();
    await reviewerPage.getByText('Status: APPROVED').waitFor();
    await verifyWorkspaces(1, 0);

    await requesterPage.reload();
    await reviewerPage.reload();
    await verifyTotals(requesterPage, 1, 0);
    await verifyTotals(reviewerPage, 1, 0);
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
