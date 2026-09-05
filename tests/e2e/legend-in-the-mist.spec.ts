import { expect, test } from '@playwright/test';

async function chooseLegend(page: import('@playwright/test').Page) {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Legend in the Mist', exact: true })
    .click();
}

test('Legend Hero uses the shared semantic sheet and responsive four-theme layout', async ({
  page,
}) => {
  await chooseLegend(page);
  await page
    .getByRole('button', { name: 'Choose Hero sheet', exact: true })
    .click();
  await page.getByRole('button', { name: 'Build Hero', exact: true }).click();

  await expect(page.locator('.local-character-sheet')).toBeVisible();
  await expect(page.locator('.litm-theme-card')).toHaveCount(4);
  const desktopColumns = await page
    .locator('.litm-theme-grid')
    .evaluate(
      (node) => getComputedStyle(node).gridTemplateColumns.split(' ').length,
    );
  expect(desktopColumns).toBe(4);
  const semanticColors = await page
    .locator('.litm-theme-card')
    .first()
    .evaluate((node) => ({
      card: getComputedStyle(node).backgroundColor,
      expected: getComputedStyle(document.documentElement)
        .getPropertyValue('--surface-raised')
        .trim(),
    }));
  expect(semanticColors.card).toBe('rgb(251, 247, 236)');
  expect(semanticColors.expected).toBe('#fbf7ec');

  await page.setViewportSize({ width: 320, height: 800 });
  const mobileColumns = await page
    .locator('.litm-theme-grid')
    .evaluate(
      (node) => getComputedStyle(node).gridTemplateColumns.split(' ').length,
    );
  expect(mobileColumns).toBe(1);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(320);
});

test('Legend Fellowship opens as a separate shared local sheet', async ({
  page,
}) => {
  await chooseLegend(page);
  await page
    .getByRole('button', { name: 'Choose Fellowship sheet', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Untitled Legend in the Mist · Fellowship',
    }),
  ).toBeVisible();
  await expect(page.locator('.local-character-sheet')).toBeVisible();
  await expect(page.locator('#litmf-theme-heading')).toContainText(
    'Fellowship Theme',
  );
});
