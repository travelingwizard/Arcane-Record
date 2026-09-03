import { expect, test } from '@playwright/test';

test('keeps edited character data after refresh', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Mage 20' }).click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();

  await page.getByLabel('Name', { exact: true }).fill('Mara Voss');
  await page.getByRole('button', { name: 'Set Strength to 3' }).click();
  await page.getByRole('button', { name: 'Set Forces to 3' }).click();
  await page
    .getByRole('button', { name: 'Mark Forces as Affinity Sphere' })
    .click();
  await page.getByLabel('Total Experience').fill('18');
  await page.getByLabel('Current Experience').fill('7');

  await expect(
    page.getByText('Unsaved changes', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  const storedName = await page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const openRequest = indexedDB.open('arcane-ledger');
        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => {
          const database = openRequest.result;
          const transaction = database.transaction('characters', 'readonly');
          const activeId = location.pathname.split('/').at(-1);
          if (!activeId) {
            reject(new Error('No active character ID.'));
            return;
          }
          const getRequest = transaction
            .objectStore('characters')
            .get(activeId);
          getRequest.onerror = () => reject(getRequest.error);
          getRequest.onsuccess = () =>
            resolve(
              (
                getRequest.result as {
                  data?: { identity?: { name?: string } };
                }
              ).data?.identity?.name ?? '',
            );
        };
      }),
  );
  expect(storedName).toBe('Mara Voss');
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
  await expect(page.getByLabel('Total Experience')).toHaveValue('18');
  await expect(page.getByLabel('Current Experience')).toHaveValue('7');
});
