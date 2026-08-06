import { expect, test, type Page } from '@playwright/test';

async function chooseExalted(page: Page) {
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Exalted 1e' }).click();
}

test('creates and persists Solar and Dragon-Blooded foundation sheets', async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('/');
  await chooseExalted(page);
  await expect(
    page.getByRole('heading', { name: 'Solar Exalted' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Dragon-Blooded' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Choose Solar' }).click();
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Tepet Sun-at-Dawn');
  await page.getByLabel('Caste', { exact: true }).fill('Dawn');
  await page.getByRole('button', { name: 'Set Strength to 3' }).click();
  await page.getByRole('button', { name: 'Set Archery to 2' }).click();
  await page.getByRole('button', { name: 'Mark Archery as favored' }).click();
  await page
    .getByRole('combobox', { name: 'Background' })
    .selectOption('artifact');
  await page.getByRole('button', { name: 'Add Background' }).click();
  await page.getByRole('button', { name: 'Set Artifact to 3' }).click();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Tepet Sun-at-Dawn',
  );
  await expect(
    page.getByRole('group', { name: 'Strength: 3 out of 5' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Clear Archery as favored' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('group', { name: 'Artifact: 3 out of 5' }),
  ).toBeVisible();

  await page.getByRole('button', { name: /Character library/ }).click();
  await chooseExalted(page);
  await page.getByRole('button', { name: 'Choose Dragon-Blooded' }).click();
  await page.getByRole('button', { name: 'Create Character' }).click();
  await expect(page.getByLabel('Aspect', { exact: true })).toBeVisible();
  await expect(page.getByLabel('House', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Air' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wood' })).toBeVisible();
  await expect(page.getByLabel('Caste', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Limit Break', { exact: true })).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 900 });
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  expect(browserErrors).toEqual([]);
});
