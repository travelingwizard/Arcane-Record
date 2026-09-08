import { expect, test } from '@playwright/test';

test('offers linked Scoundrel and Crew sheets', async ({ page }) => {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Blades', exact: true })
    .click();
  await expect(
    page.getByText('Crew & campaign', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Choose Scoundrel', exact: true })
    .click();
  await page.getByRole('button', { name: 'Build Scoundrel' }).click();
  await expect(page.locator('main.local-sheet-editor-shell')).toBeVisible();
  await expect(page.getByText(/Guided Scoundrel creation/)).toBeVisible();
  await expect(page.locator('#actions-heading')).toBeVisible();
});

test('keeps a blank Scoundrel usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/blades-in-the-dark');
  await page
    .getByRole('button', { name: 'Choose Scoundrel', exact: true })
    .click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
