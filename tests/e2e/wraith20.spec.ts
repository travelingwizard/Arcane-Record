import { expect, test } from '@playwright/test';

test('offers Wraith, Medium, Spectre, and separate Shadow sheets', async ({
  page,
}) => {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Wraith 20', exact: true })
    .click();
  await expect(page.getByText('Shadow sheet', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Choose Psyche sheet', exact: true })
    .click();
  for (const name of ['Wraith', 'Medium', 'Spectre'])
    await expect(
      page.getByRole('heading', { name, exact: true }),
    ).toBeVisible();
  await page
    .getByRole('button', { name: 'Choose Wraith', exact: true })
    .click();
  await expect(page.locator('main.local-sheet-editor-shell')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Passions & Fetters' }),
  ).toBeVisible();
});

test('keeps a blank Medium sheet usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/wraith20');
  await page
    .getByRole('button', { name: 'Choose Psyche sheet', exact: true })
    .click();
  await page.getByRole('button', { name: 'Open blank Medium sheet' }).click();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
