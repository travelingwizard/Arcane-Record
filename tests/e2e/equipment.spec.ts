import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('records, persists, and exports catalog and custom equipment', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Mage 20' }).click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const sourceSettings = page.getByRole('dialog', { name: 'Settings' });
  await sourceSettings
    .getByLabel('Other legacy references (unverified) · unverified', {
      exact: true,
    })
    .check();
  await sourceSettings.getByRole('button', { name: 'Close Settings' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Prepared Adept');

  const navigation = page.getByRole('navigation', {
    name: 'Character sheet sections',
  });
  await navigation.getByRole('link', { name: 'Equipment' }).click();
  await expect(page).toHaveURL(/#equipment$/);

  await page.getByLabel('Custom equipment name').fill('Chalk-lined satchel');
  await page
    .getByLabel('Custom description')
    .fill('Carries ritual chalk, candles, and string.');
  await page.getByRole('button', { name: 'Add custom equipment' }).click();
  await page
    .getByRole('button', { name: 'Expand Chalk-lined satchel' })
    .click();
  await page.getByLabel('Equipped or readied').check();

  await page.getByRole('button', { name: 'Browse equipment catalog' }).click();
  const catalog = page.getByLabel('Equipment reference catalog');
  await catalog
    .getByRole('searchbox', { name: 'Search equipment' })
    .fill('Kevlar Vest');
  await catalog.getByRole('button', { name: 'Add', exact: true }).click();

  await catalog
    .getByRole('searchbox', { name: 'Search equipment' })
    .fill('Bayonet');
  await catalog.getByRole('button', { name: 'Add', exact: true }).click();

  await expect(
    page.getByText('Armor 3; Dexterity -1', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByText('Damage 2 (L); Size 1/S; Durability 3; Cost •', {
        exact: true,
      })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Chalk-lined satchel' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Kevlar Vest' }),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save JSON' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const exported = JSON.parse(await readFile(path!, 'utf8')) as {
    character: {
      repeatableEntries: {
        equipment: Array<{
          definitionId?: string;
          name: string;
          description: string;
          equipped: boolean;
        }>;
      };
    };
  };
  expect(exported.character.repeatableEntries.equipment).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'Chalk-lined satchel',
        description: 'Carries ritual chalk, candles, and string.',
        equipped: true,
      }),
      expect.objectContaining({
        definitionId: 'kevlar-vest',
        name: 'Kevlar Vest',
      }),
      expect.objectContaining({
        definitionId: 'wod-armory-bayonet',
        name: 'Bayonet',
      }),
    ]),
  );
  expect(JSON.stringify(exported)).not.toContain('Armor 3; Dexterity -1');
  expect(JSON.stringify(exported)).not.toContain('citation');
  expect(JSON.stringify(exported)).not.toContain('Durability 3');

  await page.setViewportSize({ width: 320, height: 900 });
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});
