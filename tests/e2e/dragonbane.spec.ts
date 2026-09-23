import { expect, test } from '@playwright/test';

test('offers guided and blank Dragonbane adventurers', async ({ page }) => {
  await page.goto('/create/dragonbane');
  await expect(
    page.getByRole('heading', { name: 'Build Adventurer' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Open Blank Sheet' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Build Adventurer' }).click();
  await expect(page.getByText(/Guided adventurer creation/)).toBeVisible();
  await expect(page.getByLabel('Kin')).toBeVisible();
  await expect(page.getByLabel('Profession')).toBeVisible();
});

test('opens a playable local Dragonbane sheet at 320px without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/dragonbane');
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Misty Vale Adventurer');
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Misty Vale Adventurer',
  );
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test('uses the compact Dragonbane reference hierarchy on desktop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/create/dragonbane');
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();

  await expect(page.locator('.dragonbane-character-sheet')).toBeVisible();
  await expect(page.locator('.dragonbane-attribute')).toHaveCount(6);
  await expect(page.locator('.dragonbane-condition-chip')).toHaveCount(6);
  await expect(page.locator('.dragonbane-derived-strip > span')).toHaveCount(4);

  const attributeColumns = await page
    .locator('.dragonbane-attribute-grid')
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  expect(attributeColumns.split(' ')).toHaveLength(6);

  await page.getByRole('link', { name: 'Skills' }).click();
  await expect(page.locator('.dragonbane-skill-column')).toHaveCount(2);
  await expect(
    page.getByRole('heading', { name: 'General skills' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Weapon skills' }),
  ).toBeVisible();
});
