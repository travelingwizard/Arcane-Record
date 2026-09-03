import { expect, test } from '@playwright/test';

test('enables a supplement, retains selections, and restores source settings at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Mage 20' }).click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(
    dialog.getByLabel('Book of Secrets · official', { exact: true }),
  ).not.toBeChecked();
  await dialog
    .getByLabel('Book of Secrets · official', { exact: true })
    .check();
  await expect(
    dialog.getByLabel('Enlightened Grimoire · community', { exact: true }),
  ).not.toBeChecked();
  await dialog.getByRole('button', { name: 'Close Settings' }).click();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(
    dialog.getByLabel('Book of Secrets · official', { exact: true }),
  ).toBeChecked();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await dialog
    .getByLabel('Book of Secrets · official', { exact: true })
    .uncheck();
  await dialog.getByRole('button', { name: 'Close Settings' }).click();
});
