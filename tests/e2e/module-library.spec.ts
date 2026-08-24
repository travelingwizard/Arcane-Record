import { expect, test } from '@playwright/test';

test('reviews local module states without offering hosted publishing', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Module Library' }).click();
  await expect(page).toHaveURL('/modules');
  await expect(
    page.getByRole('heading', { name: 'Module Library' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Bundled modules' }),
  ).toBeVisible();
  await expect(
    page.getByText(/Hosted publishing is unavailable/),
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 900 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(320);
});
