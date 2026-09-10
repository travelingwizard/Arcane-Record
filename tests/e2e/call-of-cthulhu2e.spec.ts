import { expect, test } from '@playwright/test';

test('offers Investigator and Keeper records', async ({ page }) => {
  await page.goto('/create/call-of-cthulhu-2e');
  await expect(
    page.getByText('Keeper campaign', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Choose Investigator', exact: true })
    .click();
  await page.getByRole('button', { name: 'Build Investigator' }).click();
  await expect(page.getByText(/Guided Investigator creation/)).toBeVisible();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByText('1920s Sourcebook')).toBeVisible();
});

test('blank Investigator uses the shared mobile sheet without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/call-of-cthulhu-2e');
  await page
    .getByRole('button', { name: 'Choose Investigator', exact: true })
    .click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
