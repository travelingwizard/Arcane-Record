import { expect, test } from '@playwright/test';

test('opens the adaptive Changeling 20 creator in the shared Mage-style shell', async ({
  page,
}) => {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Changeling 20', exact: true })
    .click();
  await page.getByRole('button', { name: 'Build Character' }).click();

  await expect(page.locator('main.local-sheet-editor-shell')).toBeVisible();
  await expect(page.getByLabel('Character family')).toHaveValue('kithain');
  await expect(page.getByText(/Attributes 7\/5\/3/)).toBeVisible();
  await expect(page.getByText(/Backgrounds 0\/5/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Finalize character' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('navigation', { name: 'Character sheet' }),
  ).toBeVisible();
});

test('keeps the blank Changeling sheet local, themed, and usable at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Changeling 20', exact: true })
    .click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await expect(page.getByLabel('Character name')).toBeEditable();
  await page.getByLabel('Character name').fill('Moon-in-the-Glass');
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
});
