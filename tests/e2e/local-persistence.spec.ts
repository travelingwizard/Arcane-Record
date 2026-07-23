import { expect, test } from '@playwright/test';

test('keeps edited character data after refresh', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create character' }).click();

  await page.getByLabel('Name', { exact: true }).fill('Mara Voss');
  await page.getByRole('button', { name: 'Set Strength to 3' }).click();
  await page.getByRole('button', { name: 'Set Forces to 3' }).click();
  await page
    .getByRole('button', { name: 'Mark Forces as Affinity Sphere' })
    .click();

  await expect(page.getByText('Saved in this browser')).toBeVisible();
  await page.reload();

  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Mara Voss',
  );
  await expect(
    page.getByRole('group', { name: 'Strength: 3 out of 5' }),
  ).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Forces: 3 out of 5' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Clear Forces as Affinity Sphere' }),
  ).toHaveAttribute('aria-pressed', 'true');
});
