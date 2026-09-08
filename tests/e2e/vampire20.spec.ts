import { expect, test } from '@playwright/test';

test('offers Vampire, Ghoul, and Revenant builders', async ({ page }) => {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Vampire 20', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Vampire', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Ghoul', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Revenant', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Choose Ghoul', exact: true }).click();
  await expect(page.locator('main.local-sheet-editor-shell')).toBeVisible();
  await expect(page.getByText(/Attributes 6\/4\/3/)).toBeVisible();
  await expect(page.getByRole('combobox', { name: /Ghoul type/ })).toHaveValue(
    'vassal',
  );
});

test('opens a blank Revenant sheet without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/vampire20');
  await page.getByRole('button', { name: 'Open blank Revenant sheet' }).click();
  await expect(page.locator('input[value="Revenant"]')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
