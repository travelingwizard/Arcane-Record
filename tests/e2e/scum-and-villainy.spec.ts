import { expect, test } from '@playwright/test';
test('offers Scoundrel and linked ship records', async ({ page }) => {
  await page.goto('/create/scum-and-villainy');
  await expect(page.getByRole('heading', { name: 'Scoundrel' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Ship & crew' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Choose Scoundrel' }).click();
  await expect(
    page.getByRole('heading', { name: 'Build Scoundrel' }),
  ).toBeVisible();
});
test('opens a local Scum and Villainy sheet at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/scum-and-villainy');
  await page.getByRole('button', { name: 'Choose Scoundrel' }).click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Rim Runner');
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
