import { expect, test } from '@playwright/test';

test('burns, protects, reorders, and persists a Burning Wheel character', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Burning Wheel' }).click();
  await expect(page.getByRole('heading', { name: 'Man' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Great Wolf' })).toBeVisible();
  await page.getByRole('button', { name: 'Choose Man' }).click();

  await expect(page).toHaveURL(/\/characters\//);
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await page.getByLabel('Name', { exact: true }).fill('Ada of the Hills');
  await page.getByLabel('Gender', { exact: true }).fill('female');
  await page
    .getByLabel('Available lifepath')
    .selectOption('man:peasant-setting:born-peasant');
  await page.getByRole('button', { name: 'Add Lifepath' }).click();
  await expect(page.getByText('Age', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Born Peasant')).toBeVisible();
  await page
    .getByLabel('Available lifepath')
    .selectOption('man:peasant-setting:farmer');
  await page.getByRole('button', { name: 'Add Lifepath' }).click();
  await expect(page.getByText('2. Farmer', { exact: true })).toBeVisible();

  await page.getByPlaceholder('Search skills').fill('Accounting');
  await page.getByRole('button', { name: /Accounting · Perception/ }).click();
  await page.getByLabel('Accounting general points').fill('2');
  await page.getByLabel('Accounting routine tests').fill('1');
  await page.getByPlaceholder('Search Traits').fill('Abashed');
  await page.getByRole('button', { name: /Abashed · character/ }).click();
  await expect(page.getByRole('heading', { name: 'Abashed' })).toBeVisible();

  const navigation = page.getByRole('navigation', {
    name: 'Character sheet sections',
  });
  await navigation.getByRole('button', { name: 'Edit section order' }).click();
  await navigation
    .getByRole('button', { name: 'Move Character later' })
    .click();
  await expect(
    page.locator('.burning-wheel-sheet > section').first(),
  ).toHaveAttribute('id', 'bw-lifepaths');

  await page.getByRole('switch', { name: /Build mode/ }).check();
  await expect(
    page.getByText(/Burn selections and starting allocations are protected/),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add Lifepath' })).toHaveCount(
    0,
  );
  await expect(page.getByLabel('Accounting general points')).toBeDisabled();
  await page.getByLabel('Fate').fill('2');
  await page.getByLabel('Total Experience').fill('12');
  await page.getByLabel('Current Experience').fill('5');
  await expect(page.locator('.save-status')).toHaveText('Unsaved changes');
  await expect(page.locator('.save-status')).toHaveText(
    'Saved in this browser',
  );

  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Ada of the Hills',
  );
  await expect(page.getByLabel('Fate')).toHaveValue('2');
  await expect(page.getByLabel('Total Experience')).toHaveValue('12');
  await expect(page.getByLabel('Current Experience')).toHaveValue('5');
  await expect(page.getByLabel('Accounting routine tests')).toHaveValue('1');
  await expect(page.getByRole('button', { name: 'Save JSON' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save YAML' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save .char' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save PDF' })).toBeVisible();

  await page.setViewportSize({ width: 320, height: 900 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(320);
  await page.getByRole('button', { name: /^Sections / }).click();
  await expect(
    page.getByRole('dialog', { name: 'Character Sections' }),
  ).toBeVisible();
  expect(browserErrors).toEqual([]);
});
