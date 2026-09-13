import { expect, test } from '@playwright/test';

test('offers manual Ars Magica character and Covenant records', async ({
  page,
}) => {
  await page.goto('/create/ars-magica-definitive');
  await expect(
    page.getByRole('heading', { name: 'Character', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Covenant', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Choose Character' }).click();
  await expect(
    page.getByRole('heading', { name: 'Open Blank Magus' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Open Blank Companion' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Open Blank Grog' }),
  ).toBeVisible();
});

test('persists a blank Magus sheet at 320px without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/ars-magica-definitive');
  await page.getByRole('button', { name: 'Choose Character' }).click();
  await page.getByRole('button', { name: 'Open Blank Magus' }).click();
  await page
    .getByLabel('Name', { exact: true })
    .first()
    .fill('Aelia of Bonisagus');
  await expect(page.getByLabel('Current year')).toHaveValue('1220');
  await expect(page.getByLabel('Armor worn')).toBeVisible();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true }).first()).toHaveValue(
    'Aelia of Bonisagus',
  );
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
