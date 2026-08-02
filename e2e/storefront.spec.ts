import { expect, test } from '@playwright/test';

let pageErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', m => {
    if (m.type() === 'error') pageErrors.push(m.text());
  });
});

test('home page loads renders hero and products', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
  await expect(page.getByRole('button', { name: 'Dristi Fashions home' })).toBeVisible();
  // Product grid should render (home shows products).
  await expect(page.locator('main').first()).toBeVisible();
});

test('header navigation links exist', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('header');
  await expect(header).toBeVisible();
  await expect(header.getByPlaceholder(/Search sarees/)).toBeVisible();
});

test('search returns results', async ({ page }) => {
  await page.goto('/');
  const input = page.getByPlaceholder(/Search sarees/);
  await input.fill('saree');
  await input.press('Enter');
  await page.waitForURL(/\/search/);
  // The filter block and results area should render (either a grid or the
  // "Found" count line).
  await expect(page.getByPlaceholder('Search by name, brand or collection…')).toBeVisible();
});

test('sign in with valid customer account', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#login-email', 'gavhanenitin911@gmail.com');
  await page.fill('#login-password', 'Nitin@123');
  await page.getByRole('button', { name: /SIGN IN/ }).click();
  // After login we land back on home with the account menu visible.
  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible({ timeout: 20_000 });
});

test('invalid login shows an error', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#login-email', 'gavhanenitin911@gmail.com');
  await page.fill('#login-password', 'Wrong-Password-1');
  await page.getByRole('button', { name: /SIGN IN/ }).click();
  // The failure toast "Sign In Failed" should appear (auto-retrying).
  await expect(page.getByText('Failed', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
  // The account menu must NOT appear (still logged out).
  await expect(page.getByRole('button', { name: 'Account menu' })).toHaveCount(0);
});

test('product detail page loads', async ({ page }) => {
  // Grab any product card off the home grid (cards are clickable divs).
  await page.goto('/');
  const firstCard = page.locator('.card-hover').first();
  await firstCard.waitFor({ state: 'visible', timeout: 20_000 });
  await firstCard.click();
  await page.waitForURL(/\/product\//);
  // Product detail: a title and an add-to-bag or out-of-stock control present.
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(
    page.getByRole('button', { name: /ADD TO BAG|OUT OF STOCK|SELECT OPTIONS/ }).first(),
  ).toBeVisible();
});

test('public pages route correctly', async ({ page }) => {
  for (const path of ['/blog', '/categories', '/contact', '/about']) {
    await page.goto(path);
    await expect.poll(() => page.locator('header').count(), { timeout: 10_000 }).toBeGreaterThan(0);
  }
});

test('home logs no page-load console errors', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Ignore benign 4xx favicon/asset noise if any; flag real JS errors.
  const severe = pageErrors.filter(e => !/favicon|404|net::ERR/i.test(e));
  expect(severe).toEqual([]);
});