import { expect, test } from '@playwright/test';

test('offers Dog and Town records and opens guided creation', async ({
  page,
}) => {
  await page.goto('/create/dogs-in-the-vineyard');
  await expect(
    page.getByText('Town & NPC workspace', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Choose Dog character', exact: true })
    .click();
  await page.getByRole('button', { name: 'Build a Dog' }).click();
  await expect(page.getByText('Guided character creation')).toBeVisible();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
});

test('blank character has no page overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/dogs-in-the-vineyard');
  await page
    .getByRole('button', { name: 'Choose Dog character', exact: true })
    .click();
  await page.getByRole('button', { name: 'Open Blank Character' }).click();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test('Town workspace generates a proto-NPC batch', async ({ page }) => {
  await page.goto('/create/dogs-in-the-vineyard');
  await page
    .getByRole('button', { name: 'Choose Town & NPC workspace', exact: true })
    .click();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
  await page.getByRole('link', { name: 'NPCs & Groups' }).click();
  await page.getByRole('button', { name: 'Generate six proto-NPCs' }).click();
  await expect(page.getByText(/Acuity \d+d6/).first()).toBeVisible();
});
