import { expect, test } from '@playwright/test';

test('offers guardmouse Recruitment and a separate patrol sheet', async ({
  page,
}) => {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Mouse Guard 2e', exact: true })
    .click();
  await expect(
    page.getByText('Patrol / GM record', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Choose Guardmouse', exact: true })
    .click();
  await page.getByRole('button', { name: 'Recruit a Guardmouse' }).click();
  await expect(page.locator('main.local-sheet-editor-shell')).toBeVisible();
  await expect(page.getByText('Recruitment step 1 of 21')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByLabel('Rank')).toBeVisible();
});

test('keeps a blank Mouse Guard sheet usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/mouse-guard2e');
  await page
    .getByRole('button', { name: 'Choose Guardmouse', exact: true })
    .click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
