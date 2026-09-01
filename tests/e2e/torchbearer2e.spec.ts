import { expect, test } from '@playwright/test';

test('creates, edits, reorders, and persists a Torchbearer 2e sheet', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Torchbearer 2e' }).click();
  await page.getByRole('button', { name: 'Create Character' }).click();

  await expect(page).toHaveURL(/\/characters\//);
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Who You Are' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fresh' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByLabel('Name', { exact: true }).fill('Karolina');
  await page.getByLabel('Stock', { exact: true }).fill('Human');
  await page.getByLabel('Class', { exact: true }).fill('Warrior');
  await page.getByRole('button', { name: 'Set Will to 4' }).click();
  await page.getByRole('button', { name: 'Set Fighter to 3' }).click();
  await page.getByRole('button', { name: 'Injured' }).click();
  await expect(page.getByRole('button', { name: 'Fresh' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.getByRole('button', { name: 'Add Trait' }).click();
  await page.getByLabel('Trait name').fill('Heart of Battle');
  await page.getByRole('button', { name: 'Add Inventory Item' }).click();
  await page.getByLabel('Item').fill('Sword');

  const navigation = page.getByRole('navigation', {
    name: 'Character sheet sections',
  });
  await navigation.getByRole('button', { name: 'Edit section order' }).click();
  await navigation
    .getByRole('button', { name: 'Move Character later' })
    .click();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();

  await expect(
    page.locator('.tb2-character-sheet > section').first(),
  ).toHaveAttribute('id', 'tb2-rewards');

  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Karolina',
  );
  await expect(
    page.getByRole('group', { name: 'Will: 4 out of 6' }),
  ).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Fighter: 3 out of 6' }),
  ).toBeVisible();
  await expect(page.getByLabel('Trait name')).toHaveValue('Heart of Battle');
  await expect(page.getByLabel('Item')).toHaveValue('Sword');
  await expect(
    page.locator('.tb2-character-sheet > section').first(),
  ).toHaveAttribute('id', 'tb2-rewards');

  await page.setViewportSize({ width: 320, height: 900 });
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});
