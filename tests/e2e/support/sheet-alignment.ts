import { expect, type Page } from '@playwright/test';

export async function expectMageAlignedFieldGrid(page: Page, selector: string) {
  const grid = page.locator(selector).first();
  await expect(grid).toBeVisible();
  const geometry = await grid
    .locator(':scope > label, :scope > .field')
    .evaluateAll((fields) =>
      fields.map((field) => {
        const bounds = field.getBoundingClientRect();
        const label = field.querySelector('label') ?? field;
        const labelBounds = label
          .querySelector(':scope > span')
          ?.getBoundingClientRect();
        const control = field.querySelector(
          'input:not([type="checkbox"]), select, textarea',
        );
        const controlBounds = control?.getBoundingClientRect();
        return {
          semanticField: label.classList.contains('sheet-field'),
          top: Math.round(bounds.top),
          width: Math.round(bounds.width),
          labelBottom: labelBounds ? Math.round(labelBounds.bottom) : null,
          controlTop: controlBounds ? Math.round(controlBounds.top) : null,
          controlWidth: controlBounds ? Math.round(controlBounds.width) : null,
          controlHeight: controlBounds
            ? Math.round(controlBounds.height)
            : null,
          labelFont: getComputedStyle(label)
            .fontFamily.replace(/["']/g, '')
            .replace(/\s+/g, ' '),
          controlFont: control
            ? getComputedStyle(control)
                .fontFamily.replace(/["']/g, '')
                .replace(/\s+/g, ' ')
            : null,
          sansToken: getComputedStyle(document.documentElement)
            .getPropertyValue('--font-sans')
            .replace(/["']/g, '')
            .replace(/\s+/g, ' ')
            .trim(),
          serifToken: getComputedStyle(document.documentElement)
            .getPropertyValue('--font-serif')
            .replace(/["']/g, '')
            .replace(/\s+/g, ' ')
            .trim(),
        };
      }),
    );

  expect(geometry.length).toBeGreaterThan(1);
  expect(
    geometry.every(({ semanticField }) => semanticField),
    JSON.stringify(geometry),
  ).toBe(true);
  expect(
    geometry.every(
      ({ labelBottom, controlTop }) =>
        labelBottom !== null &&
        controlTop !== null &&
        labelBottom <= controlTop + 1,
    ),
    JSON.stringify(geometry),
  ).toBe(true);
  expect(
    geometry.every(
      ({ controlHeight, labelFont, controlFont, sansToken, serifToken }) =>
        controlHeight !== null &&
        controlHeight >= 44 &&
        labelFont === sansToken &&
        controlFont === serifToken,
    ),
    JSON.stringify(geometry),
  ).toBe(true);
  expect(
    geometry.every(
      ({ width, controlWidth }) =>
        controlWidth !== null && Math.abs(controlWidth - width) <= 1,
    ),
  ).toBe(true);

  const firstRow = geometry.filter(({ top }) => top === geometry[0]!.top);
  expect(new Set(firstRow.map(({ width }) => width)).size).toBe(1);
}
