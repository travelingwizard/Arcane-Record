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

    await page
      .getByRole('heading', { name: 'Enlightenment' })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `tmp/qa/editor-${viewport.name}-expanded.png`,
      fullPage: false,
    });

    const expandedDimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(expandedDimensions.content).toBeLessThanOrEqual(
      expandedDimensions.viewport,
    );

    await page
      .getByRole('heading', { name: 'Backgrounds', exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `tmp/qa/editor-${viewport.name}-backgrounds.png`,
      fullPage: false,
    });
    const backgroundSection = page.locator('section', {
      has: page.getByRole('heading', { name: 'Backgrounds', exact: true }),
    });
    if (viewport.name === '320') {
      await backgroundSection
        .getByRole('button', { name: 'Open catalog' })
        .click();
      await backgroundSection
        .getByRole('searchbox', { name: 'Search Backgrounds' })
        .fill('Resources');
    }
    await backgroundSection
      .getByRole('searchbox', { name: 'Search Backgrounds' })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `tmp/qa/editor-${viewport.name}-background-catalog.png`,
      fullPage: false,
    });
    const backgroundDimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(backgroundDimensions.content).toBeLessThanOrEqual(
      backgroundDimensions.viewport,
    );

    await page
      .getByRole('heading', { name: 'Health' })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `tmp/qa/editor-${viewport.name}-health.png`,
      fullPage: false,
    });

    await page
      .getByRole('heading', { name: 'Merits & Flaws' })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `tmp/qa/editor-${viewport.name}-merits-flaws.png`,
      fullPage: false,
    });

    await page
      .getByRole('heading', { name: 'Import & export' })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `tmp/qa/editor-${viewport.name}-file-exchange.png`,
      fullPage: false,
    });
  }

  await page.setViewportSize(viewports[2]);
  const correspondence = await page
    .getByRole('heading', { name: 'Correspondence' })
    .boundingBox();
  const entropy = await page
    .getByRole('heading', { name: 'Entropy' })
    .boundingBox();
  const mind = await page.getByRole('heading', { name: 'Mind' }).boundingBox();

  expect(correspondence).not.toBeNull();
  expect(entropy).not.toBeNull();
  expect(mind).not.toBeNull();
  expect(Math.abs(correspondence!.x - entropy!.x)).toBeLessThan(2);
  expect(entropy!.y).toBeGreaterThan(correspondence!.y);
  expect(mind!.x).toBeGreaterThan(correspondence!.x);
  expect(Math.abs(mind!.y - correspondence!.y)).toBeLessThan(2);

  await page.setViewportSize(viewports[2]);
  const wheelToggle = page.getByRole('checkbox', {
    name: 'Desktop Sphere wheel',
  });
  await wheelToggle.check();

  const wheel = page.getByLabel('Desktop Sphere wheel editor');
  await expect(wheel).toBeVisible();
  await wheel.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: 'tmp/qa/editor-1440-wheel.png',
    fullPage: false,
  });

  await wheel
    .getByRole('button', { name: 'Mark Forces as Affinity Sphere' })
    .click();
  await expect(
    wheel.getByRole('button', { name: 'Clear Forces as Affinity Sphere' }),
  ).toHaveAttribute('aria-pressed', 'true');

  await page.setViewportSize(viewports[0]);
  await expect(wheel).not.toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Forces: 0 out of 5' }),
  ).toBeVisible();

  const narrowWheelPreferenceDimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(narrowWheelPreferenceDimensions.content).toBeLessThanOrEqual(
    narrowWheelPreferenceDimensions.viewport,
  );

  expect(browserErrors).toEqual([]);
});
