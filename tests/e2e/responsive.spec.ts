import { expect, test } from '@playwright/test';

const viewports = [
  { name: '320', width: 320, height: 900 },
  { name: '768', width: 768, height: 900 },
  { name: '1440', width: 1440, height: 1000 },
] as const;

test('has no page overflow or browser errors at target widths', async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.setViewportSize(viewports[0]);
  await page.goto('/');
  await page.screenshot({
    path: 'tmp/qa/library-320.png',
    fullPage: false,
  });
  const libraryMobileWidth = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(libraryMobileWidth.content).toBeLessThanOrEqual(
    libraryMobileWidth.viewport,
  );

  await page.setViewportSize(viewports[2]);
  await page.screenshot({
    path: 'tmp/qa/library-1440.png',
    fullPage: false,
  });
  await page.setViewportSize(viewports[0]);
  await page.getByRole('button', { name: 'Create character' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Responsive Adept');

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(
      page.getByRole('heading', { name: 'Attributes' }),
    ).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

    await page.screenshot({
      path: `tmp/qa/editor-${viewport.name}.png`,
      fullPage: false,
    });

    await page
      .getByRole('heading', { name: 'Spheres' })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `tmp/qa/editor-${viewport.name}-spheres.png`,
      fullPage: false,
    });
  }

  expect(browserErrors).toEqual([]);
});
