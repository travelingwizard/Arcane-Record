import { expect, test } from '@playwright/test';

test('applies and restores appearance preferences without changing character data', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });

  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('radio')).toHaveCount(16);
  await dialog.getByRole('radio', { name: /Technocratic Dossier/ }).check();
  await dialog.getByRole('radio', { name: /Virtual Adepts/ }).check();
  await dialog
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
  await expect(dialog.getByText('Willpower', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Quintessence', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Paradox', { exact: true })).toBeVisible();

  await dialog.getByRole('button', { name: 'Close Settings' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    'technocratic-dossier',
  );
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(
    page.getByRole('radio', { name: /Technocratic Dossier/ }),
  ).toBeChecked();

  const documentWidth = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(documentWidth.scroll).toBeLessThanOrEqual(documentWidth.client + 1);
});
