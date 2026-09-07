import { expect, test } from '@playwright/test';

test('creates a Shadowrun 1e priority character in the shared sheet shell', async ({
  page,
}) => {
  await page.goto('/create');
  await page.getByRole('button', { name: 'Choose Shadowrun 1e' }).click();
  await page.getByRole('button', { name: 'Build Character' }).click();

  await expect(page.locator('main.local-sheet-editor-shell')).toBeVisible();
  await expect(page.getByText('Calculated starting budgets')).toBeVisible();
  await expect(page.getByText(/Attributes 24 · Skills 24/)).toBeVisible();
  await page.getByLabel('Character name').fill('Neon Ghost');
  await page.getByRole('button', { name: 'Finalize priority build' }).click();
  await expect(
    page.getByRole('switch', { name: /Build mode Play mode/ }),
  ).toBeChecked();
  await expect(page.getByLabel('Character name')).toHaveAttribute(
    'readonly',
    '',
  );
});

test('keeps the blank Shadowrun play sheet usable at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/create');
  await page.getByRole('button', { name: 'Choose Shadowrun 1e' }).click();
  await page.getByRole('button', { name: 'Open Blank Play Sheet' }).click();
  await expect(page.getByLabel('Physical damage')).toBeEditable();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
});
