import { expect, test } from '@playwright/test';

test('offers linked Root Vagabond and Woodland campaign records', async ({
  page,
}) => {
  await page.goto('/create/root-rpg');
  await expect(page.getByRole('heading', { name: 'Vagabond' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Woodland campaign' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Choose Vagabond' }).click();
  await expect(
    page.getByRole('heading', { name: 'Build Vagabond' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Open Blank Vagabond' }),
  ).toBeVisible();
});

test('opens a Root Vagabond in the shared mobile sheet without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/root-rpg');
  await page.getByRole('button', { name: 'Choose Vagabond' }).click();
  await page.getByRole('button', { name: 'Open Blank Vagabond' }).click();
  await expect(page.getByRole('heading', { name: 'Character' })).toBeVisible();
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
