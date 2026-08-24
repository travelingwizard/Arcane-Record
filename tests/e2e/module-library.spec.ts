import { expect, test } from '@playwright/test';

test('reviews local and hosted module states without weakening offline use', async ({
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
    page.getByText(/No hosted registry URL is configured/),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Browse published modules' }),
  ).toBeDisabled();
  await page.setViewportSize({ width: 320, height: 900 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(320);
});
