import { expect, test } from '@playwright/test';
import { expectMageAlignedFieldGrid } from './support/sheet-alignment';

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
  await expectMageAlignedFieldGrid(
    page,
    '.litm-identity-grid.sheet-field-grid',
  );
  await expect(page.locator('.litm-creator.character-creator')).toBeVisible();
  await expect(page.locator('.litm-theme-card')).toHaveCount(4);
  const desktopColumns = await page
    .locator('.litm-theme-grid')
    .evaluate(
      (node) => getComputedStyle(node).gridTemplateColumns.split(' ').length,
    );
  expect(desktopColumns).toBe(4);
  const cardGeometry = await page
    .locator('.litm-theme-card')
    .evaluateAll((cards) =>
      cards.map((card) => {
        const bounds = card.getBoundingClientRect();
        return {
          left: Math.round(bounds.left),
          top: Math.round(bounds.top),
          width: Math.round(bounds.width),
          height: Math.round(bounds.height),
        };
      }),
    );
  expect(new Set(cardGeometry.map(({ top }) => top)).size).toBe(1);
  expect(new Set(cardGeometry.map(({ width }) => width)).size).toBe(1);
  expect(new Set(cardGeometry.map(({ height }) => height)).size).toBe(1);
  expect(cardGeometry.map(({ left }) => left)).toEqual(
    [...cardGeometry.map(({ left }) => left)].sort(
      (left, right) => left - right,
    ),
  );

  const semanticContract = await page
    .locator('.litm-theme-card')
    .first()
    .evaluate((node) => {
      const fontProbe = document.createElement('span');
      fontProbe.style.fontFamily = 'var(--font-serif)';
      document.body.append(fontProbe);
      const expectedHeadingFont = getComputedStyle(fontProbe).fontFamily;
      fontProbe.remove();
      return {
        cardBackground: getComputedStyle(node).backgroundColor,
        cardBorder: getComputedStyle(node).borderColor,
        expectedBackground: getComputedStyle(document.documentElement)
          .getPropertyValue('--paper-light')
          .trim(),
        expectedBorder: getComputedStyle(document.documentElement)
          .getPropertyValue('--rule-light')
          .trim(),
        headingFont: getComputedStyle(node.querySelector('header')!).fontFamily,
        expectedHeadingFont,
      };
    });
  expect(semanticContract.cardBackground).toBe('rgb(251, 247, 236)');
  expect(semanticContract.cardBorder).toBe('rgb(182, 170, 145)');
  expect(semanticContract.expectedBackground).toBe('#fbf7ec');
  expect(semanticContract.expectedBorder).toBe('#b6aa91');
  expect(semanticContract.headingFont).toBe(
    semanticContract.expectedHeadingFont,
  );

  const tagRows = await page.locator('.litm-tag-row').evaluateAll((rows) =>
    rows.map((row) => {
      const rowBounds = row.getBoundingClientRect();
      const inputBounds = row.querySelector('input')!.getBoundingClientRect();
      const actionBounds = row
        .querySelector('.litm-tag-actions')!
        .getBoundingClientRect();
      return {
        inputWidth: inputBounds.width,
        contained:
          inputBounds.left >= rowBounds.left &&
          inputBounds.right <= rowBounds.right + 1 &&
          actionBounds.left >= rowBounds.left &&
          actionBounds.right <= rowBounds.right + 1,
      };
    }),
  );
  expect(tagRows.every(({ contained }) => contained)).toBe(true);
  expect(tagRows.every(({ inputWidth }) => inputWidth >= 100)).toBe(true);

  await page.setViewportSize({ width: 900, height: 800 });
  const intermediateColumns = await page
    .locator('.litm-theme-grid')
    .evaluate(
      (node) => getComputedStyle(node).gridTemplateColumns.split(' ').length,
    );
  expect(intermediateColumns).toBe(2);

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
