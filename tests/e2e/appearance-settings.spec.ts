import { expect, test } from '@playwright/test';

test('applies and restores appearance preferences without changing character data', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  const settings = page.getByRole('main');

  await expect(page).toHaveURL(/\/settings$/);
  await expect(
    settings.getByRole('heading', { name: 'Settings' }),
  ).toBeVisible();
  await expect(settings.getByRole('radio')).toHaveCount(23);
  await settings.getByRole('radio', { name: /Technocratic Dossier/ }).check();
  await settings.getByRole('radio', { name: /Virtual Adepts/ }).check();
  await settings
    .getByRole('switch', { name: /Reduce decorative motion/ })
    .check();

  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    'technocratic-dossier',
  );
  await expect(page.locator('html')).toHaveAttribute(
    'data-overlay',
    'virtual-adepts',
  );
  await expect(page.locator('html')).toHaveAttribute(
    'data-reduce-motion',
    'true',
  );
  await expect(settings.getByText('Willpower', { exact: true })).toBeVisible();
  await expect(
    settings.getByText('Quintessence', { exact: true }),
  ).toBeVisible();
  await expect(settings.getByText('Paradox', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    'technocratic-dossier',
  );
  await expect(
    page.getByRole('radio', { name: /Technocratic Dossier/ }),
  ).toBeChecked();

  const documentWidth = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(documentWidth.scroll).toBeLessThanOrEqual(documentWidth.client + 1);
});

test('offers character settings and cross-game themes on every sheet', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Mage 20' }).click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();

  await page.getByRole('button', { name: 'Settings' }).click();
  const mageSettings = page.getByRole('dialog', { name: 'Settings' });
  await expect(
    mageSettings.getByRole('heading', { name: 'Mage 20 settings' }),
  ).toBeVisible();
  await mageSettings.getByRole('radio', { name: /^Navy/ }).check();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    'simple-navy',
  );
  await mageSettings
    .getByRole('switch', { name: 'Desktop Sphere wheel' })
    .check();
  await mageSettings
    .getByRole('switch', { name: /Temporary Willpower dots/ })
    .check();
  await mageSettings.getByRole('button', { name: 'Close Settings' }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Desktop Sphere wheel' }),
  ).toBeChecked();
  await expect(page.getByTestId('rating-temporary-willpower')).toHaveClass(
    /dot-rating--dots/,
  );
  await page.reload();
  await expect(page.getByTestId('rating-temporary-willpower')).toHaveClass(
    /dot-rating--dots/,
  );

  await page.getByRole('button', { name: /Character library/ }).click();
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Exalted 1e' }).click();
  await page.getByRole('button', { name: 'Choose Solar' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
  const exaltedSettings = page.getByRole('dialog', { name: 'Settings' });
  await expect(
    exaltedSettings.getByRole('radio', { name: /Exalted Vermilion/ }),
  ).toBeVisible();
  await exaltedSettings
    .getByRole('radio', { name: /Custom Background/ })
    .check();
  await exaltedSettings.getByLabel('Custom background color').fill('#245678');
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    'custom-background',
  );
  await expect(page.locator('html')).toHaveCSS(
    '--custom-app-background',
    '#245678',
  );
});
