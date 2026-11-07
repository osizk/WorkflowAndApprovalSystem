import assert from 'node:assert/strict';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';
import { startBrowserServer, stopBrowserServer } from './browser-server.mjs';
import { developmentDatabaseUrl, testDatabaseUrl } from '../scripts/test-db.mjs';

test('F-01: browser login, reload and logout against PostgreSQL', { timeout: 30000 }, async () => {
  const url = testDatabaseUrl(process.env.TEST_DATABASE_URL, developmentDatabaseUrl());
  const db = new PrismaClient({ datasources: { db: { url } } });
  const password = randomUUID();
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64).toString('hex');
  let server, browser, requester, reviewer;
  try {
    requester = await db.user.create({ data: { login: randomUUID(), role: 'REQUESTER', passwordHash: `scrypt:${salt.toString('hex')}:${hash}` } });
    reviewer = await db.user.create({ data: { login: randomUUID(), role: 'REVIEWER', passwordHash: requester.passwordHash } });
    const started = await startBrowserServer(url);
    server = started.server;
    const { origin } = started;
    browser = await chromium.launch({ channel: process.env.WORKFLOW_BROWSER_CHANNEL || undefined });
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    assert.equal((await page.goto(`${origin}/login`)).status(), 200);
    await page.getByLabel('Login').fill(requester.login);
    await page.getByLabel('Password').fill('invalid-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByText('Invalid credentials', { exact: true }).waitFor();
    await page.getByLabel('Password').fill(password);
    await page.getByLabel('Password').press('Enter');
    await page.waitForURL(`${origin}/requests`);
    await page.getByRole('heading', { name: 'My requests' }).waitFor();
    await page.reload();
    await page.getByRole('heading', { name: 'My requests' }).waitFor();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL(`${origin}/login`);
    assert.equal((await page.request.get(`${origin}/api/session`)).status(), 401);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel('Login').fill(reviewer.login);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(`${origin}/reviews`);
    await page.getByRole('heading', { name: 'Review queue' }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  } finally {
    await browser?.close();
    await stopBrowserServer(server);
    for (const user of [requester, reviewer]) {
      if (!user) continue;
      await db.session.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
    await db.$disconnect();
  }
});
