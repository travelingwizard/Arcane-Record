import { expect, test } from '@playwright/test';

test('opens the Dark Ages Vampire creator in the shared sheet shell', async ({
  page,
}) => {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Vampire Dark Ages 20', exact: true })
    .click();
  await page.getByRole('button', { name: 'Build Character' }).click();
  await expect(page.locator('main.local-sheet-editor-shell')).toBeVisible();
  await expect(page.getByText(/Attributes 7\/5\/3/)).toBeVisible();
  await expect(page.getByText(/Disciplines 0\/4/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Finalize fledgling' }),
  ).toBeDisabled();
});

test('keeps a blank Dark Ages Vampire sheet usable at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Vampire Dark Ages 20', exact: true })
    .click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await page.getByLabel('Character name').fill('Magda');
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
