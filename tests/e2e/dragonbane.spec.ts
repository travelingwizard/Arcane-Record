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
