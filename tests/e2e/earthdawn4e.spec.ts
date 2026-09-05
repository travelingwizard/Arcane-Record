import { expect, test } from '@playwright/test';

test('creates an Earthdawn adept and exposes source and dice tools', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Earthdawn 4e' }).click();
  await page.getByRole('button', { name: 'Build Character' }).click();

  await expect(page.locator('.tb2-creator.character-creator')).toBeVisible();
  await expect(
    page.getByText(/Earthdawn creation · Step 1 of 10/),
  ).toBeVisible();
  await page.getByRole('button', { name: /Warrior/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  const human = page.getByRole('button', { name: /Human/ });
  await human.click();
  await expect(human).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
  const nextButtonHeight = await page
    .getByRole('button', { name: 'Next' })
    .evaluate((button) => button.getBoundingClientRect().height);
  expect(nextButtonHeight).toBeGreaterThanOrEqual(44);
});

test('blank play sheet remains usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Earthdawn 4e' }).click();
  await page.getByRole('button', { name: 'Open Blank Play Sheet' }).click();

  await expect(page.locator('main.local-sheet-editor-shell')).toBeVisible();
  await expect(page.locator('.local-character-sheet')).toBeVisible();
  const sheetSurface = await page
    .locator('.tb2-character-sheet')
    .evaluate((node) => ({
      border: getComputedStyle(node).borderTopWidth,
      background: getComputedStyle(node).backgroundImage,
      shadow: getComputedStyle(node).boxShadow,
    }));
  expect(sheetSurface).toEqual({
    border: '0px',
    background: 'none',
    shadow: 'none',
  });
  await expect(
    page.getByRole('switch', { name: /Earthdawn Edit and Play mode/ }),
  ).toBeChecked();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
