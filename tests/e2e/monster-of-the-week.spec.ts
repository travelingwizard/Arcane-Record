import { expect, test } from '@playwright/test';

test('offers guided Hunter and Keeper campaign records', async ({ page }) => {
  await page.goto('/create');
  await page.getByRole('button', { name: 'Choose MotW', exact: true }).click();
  await expect(
    page.getByText('Keeper campaign', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Choose Hunter', exact: true })
    .click();
  await page.getByRole('button', { name: 'Build Hunter' }).click();
  await expect(page.getByText(/Guided Hunter creation/)).toBeVisible();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
});

test('blank Hunter uses the shared mobile layout without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/monster-of-the-week');
  await page
    .getByRole('button', { name: 'Choose Hunter', exact: true })
    .click();
  await page.getByRole('button', { name: 'Open Blank Hunter' }).click();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
