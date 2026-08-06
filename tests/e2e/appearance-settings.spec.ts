import { expect, test } from '@playwright/test';

test('applies and restores appearance preferences without changing character data', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  const settings = page.getByRole('main');

  await expect(page).toHaveURL(/\/settings$/);
  await expect(
    settings.getByRole('heading', { name: 'Settings' }),
  ).toBeVisible();
  await expect(settings.getByRole('radio')).toHaveCount(16);
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
