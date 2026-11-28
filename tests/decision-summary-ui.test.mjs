import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { startBrowserServer, stopBrowserServer } from './browser-server.mjs';

const rows = Array.from({ length: 12 }, (_, index) => ({
  id: String(index + 1),
  title: `Request ${index + 1}`,
  amount: '12.34',
  currency: 'THB',
  status: index === 11 ? 'APPROVED' : 'SUBMITTED',
  requesterLogin: 'fixture-requester',
  createdAt: '2026-11-28T00:00:00Z',
}));

async function openBrowser(t) {
  // All API traffic is intercepted. This unreachable URL prevents fixture tests touching any database.
  const { server, origin } = await startBrowserServer('postgresql://127.0.0.1:1/decision_summary_mock_test');
  t.after(() => stopBrowserServer(server));
  const browser = await chromium.launch({ channel: process.env.WORKFLOW_BROWSER_CHANNEL || undefined });
  t.after(() => browser.close());
  return { browser, origin };
}

async function openWorkspace(browser, origin, role, handleSummary) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(2500);
  let expired = false;
  let summaryCalls = 0;
  await page.route('**/api/**', (route) => {
    const { pathname, searchParams, search } = new URL(route.request().url());
    if (pathname === '/api/session') {
      if (expired) return route.fulfill({ status: 401, json: { error: { code: 'AUTH_REQUIRED', message: 'Sign in' } } });
      return route.fulfill({ json: { id: role, role } });
    }
    if (pathname === '/api/requests') {
      const status = searchParams.get('status');
      return route.fulfill({ json: { requests: rows.filter((row) => !status || row.status === status) } });
    }
    if (pathname === '/api/requests/decision-summary' && !search && route.request().method() === 'GET') {
      summaryCalls++;
      return handleSummary(route, () => { expired = true; });
    }
    return route.fulfill({ status: 404 });
  });
  const reviewer = role === 'REVIEWER';
  await page.goto(origin + (reviewer ? '/reviews' : '/requests'));
  await page.getByRole('heading', { name: reviewer ? 'Review Queue' : 'My requests', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Request 1', exact: true }).waitFor();
  return { page, summaryCalls: () => summaryCalls };
}

const summaryRegion = (page) => page.getByRole('region', { name: 'Decision summary' });

async function expectTotals(summary, approved, rejected) {
  await summary.getByText('Approved', { exact: true }).waitFor();
  await summary.getByText('Rejected', { exact: true }).waitFor();
  assert.deepEqual(await summary.locator('dd').allTextContents(), [String(approved), String(rejected)]);
}

test('TEST-37: role totals, successful zeros and independence from list controls', { timeout: 25000 }, async (t) => {
  const { browser, origin } = await openBrowser(t);
  for (const [role, approved, rejected] of [['REQUESTER', 7, 3], ['REVIEWER', 12, 5], ['REQUESTER', 0, 0]]) {
    const { page, summaryCalls } = await openWorkspace(browser, origin, role,
      (route) => route.fulfill({ json: { approved, rejected } }));
    const summary = summaryRegion(page);
    await expectTotals(summary, approved, rejected);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('link', { name: 'Request 11', exact: true }).waitFor();
    await expectTotals(summary, approved, rejected);
    await page.getByLabel('Status', { exact: true }).selectOption('APPROVED');
    await page.getByRole('link', { name: 'Request 12', exact: true }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'Request 11', exact: true }).count(), 0);
    await expectTotals(summary, approved, rejected);
    await page.getByRole('button', { name: 'Clear filter' }).click();
    await page.getByRole('link', { name: 'Request 1', exact: true }).waitFor();
    await expectTotals(summary, approved, rejected);
    assert.equal(summaryCalls(), 1);
    await page.close();
  }
});

test('TEST-38: pending, server and network errors, keyboard retry and expired session', { timeout: 25000 }, async (t) => {
  const { browser, origin } = await openBrowser(t);
  const pending = Promise.withResolvers();
  let attempt = 0;
  const { page } = await openWorkspace(browser, origin, 'REQUESTER', async (route) => {
    attempt++;
    if (attempt === 1) {
      await pending.promise;
      return route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR', message: 'Failed' } } });
    }
    if (attempt === 2) return route.abort('failed');
    return route.fulfill({ json: { approved: 0, rejected: 0 } });
  });
  const summary = summaryRegion(page);
  try {
    await summary.getByRole('status').getByText('Loading decision summary…').waitFor();
    assert.equal(await summary.getByText('0', { exact: true }).count(), 0);
  } finally {
    pending.resolve();
  }

  for (const key of ['Enter', 'Space']) {
    await summary.getByRole('alert').getByText('Could not load decision summary.').waitFor();
    assert.equal(await summary.getByText('0', { exact: true }).count(), 0);
    await page.getByLabel('Status', { exact: true }).selectOption('APPROVED');
    await page.getByRole('link', { name: 'Request 12', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Clear filter' }).click();
    await page.getByRole('link', { name: 'Request 1', exact: true }).waitFor();
    const retry = summary.getByRole('button', { name: 'Retry', exact: true });
    await retry.focus();
    await page.keyboard.press(key);
  }
  await expectTotals(summary, 0, 0);
  assert.equal(attempt, 3);

  const unauthorized = Promise.withResolvers();
  const { page: expiredPage } = await openWorkspace(browser, origin, 'REVIEWER', async (route, expire) => {
    await unauthorized.promise;
    expire();
    return route.fulfill({ status: 401, json: { error: { code: 'AUTH_REQUIRED', message: 'Sign in' } } });
  });
  unauthorized.resolve();
  await expiredPage.waitForURL(origin + '/login');
  await expiredPage.getByRole('heading', { name: 'Sign in', exact: true }).waitFor();
});

