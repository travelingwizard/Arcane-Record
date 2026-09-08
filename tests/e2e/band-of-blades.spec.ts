import { expect, test } from '@playwright/test';
test('offers Legionnaire, Legion, and Chosen sheets', async ({ page }) => {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Band of Blades', exact: true })
    .click();
  await expect(
    page.getByText('Legion campaign', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Chosen', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Choose Legionnaire', exact: true })
    .click();
  await page.getByRole('button', { name: 'Build Legionnaire' }).click();
  await expect(page.locator('main.local-sheet-editor-shell')).toBeVisible();
  await expect(
    page.getByText('Legionnaire creation · Step 1 of 5'),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Heavy' })).toBeVisible();
});
test('keeps a blank Legionnaire usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/band-of-blades');
  await page
    .getByRole('button', { name: 'Choose Legionnaire', exact: true })
    .click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
