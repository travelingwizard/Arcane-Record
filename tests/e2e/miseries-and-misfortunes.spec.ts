import { expect, test } from '@playwright/test';
test('offers protagonist and campaign creation', async ({ page }) => {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Miseries & Misfortunes', exact: true })
    .click();
  await expect(
    page.getByText('Campaign & motif', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Choose Protagonist', exact: true })
    .click();
  await page.getByRole('button', { name: 'Build Protagonist' }).click();
  await expect(page.getByText(/Guided creation/)).toBeVisible();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
});
test('blank protagonist fits 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/miseries-and-misfortunes');
  await page
    .getByRole('button', { name: 'Choose Protagonist', exact: true })
    .click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
