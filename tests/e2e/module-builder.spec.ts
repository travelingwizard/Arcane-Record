import { expect, test } from '@playwright/test';

test('authors and recovers a local module draft at desktop and mobile widths', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Module Builder' }).click();
  await expect(
    page.getByRole('heading', { name: 'Module Builder' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'New module draft' }).click();
  await expect(page).toHaveURL(/\/module-builder\//);

  await page.getByLabel('Name', { exact: true }).fill('Lantern Test');
  await expect(page.getByRole('status')).toHaveText(
    'Draft saved in this browser',
  );
  await page.getByRole('button', { name: 'Hierarchy' }).click();
  await page.getByRole('button', { name: 'Add game node' }).click();
  await expect(page.getByLabel('Parent').last()).toHaveValue('game');

  await page.getByRole('button', { name: 'Sheet' }).click();
  await page.getByRole('button', { name: '＋ Section' }).click();
  await page.getByRole('button', { name: 'New Section' }).click();
  await page.getByRole('button', { name: 'Add text component' }).click();
  await expect(page.getByText('Text', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Rules' }).click();
  await page.getByRole('button', { name: 'Add formula' }).click();
  await page.getByRole('button', { name: 'Add validation' }).click();
  await page.getByRole('button', { name: 'Add action' }).click();
  await expect(page.getByText('formula-1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Flows' }).click();
  await page.getByRole('button', { name: 'Add creation flow' }).click();
  await expect(
    page.getByRole('heading', { name: 'New creation flow' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Preview' }).click();
  await page.getByRole('button', { name: 'Mobile 320px' }).click();
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(
    page.getByText('play mode · real module structure'),
  ).toBeVisible();
  await page.setViewportSize({ width: 320, height: 900 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(320);

  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Lantern Test' }),
  ).toBeVisible();
});
