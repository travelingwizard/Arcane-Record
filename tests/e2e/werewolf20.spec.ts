import { expect, test } from '@playwright/test';

test('offers all four W20 character families', async ({ page }) => {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Werewolf 20', exact: true })
    .click();
  for (const name of ['Garou', 'Changing Breed', 'Kinfolk', 'Wyrm-Aligned'])
    await expect(
      page.getByRole('heading', { name, exact: true }),
    ).toBeVisible();
  await page.getByRole('button', { name: 'Choose Garou', exact: true }).click();
  await expect(page.locator('main.local-sheet-editor-shell')).toBeVisible();
  await expect(page.getByText(/Attributes 7\/5\/3/)).toBeVisible();
});

test('keeps a blank Kinfolk sheet usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/werewolf20');
  await page.getByRole('button', { name: 'Open blank Kinfolk sheet' }).click();
  await expect(page.locator('input[value="kinfolk"]')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
