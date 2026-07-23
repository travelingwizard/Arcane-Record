import { expect, test } from '@playwright/test';
import { serializeCharacter } from '../../src/features/import-export/character-files';
import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';

test('persists expanded sections and exchanges local character files', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create character' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Expanded Section Adept');

  await page.getByRole('button', { name: 'Set Alertness to 3' }).click();
  await page.getByRole('button', { name: 'Set Arete to 4' }).click();
  await page
    .getByRole('button', { name: 'Set Temporary Willpower to 3' })
    .click();
  await page.getByRole('button', { name: 'Bruised: Unmarked damage' }).click();

  await expect(
    page.getByText('Unsaved changes', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();

  await expect(
    page.getByRole('group', { name: 'Alertness: 3 out of 5' }),
  ).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Arete: 4 out of 10' }),
  ).toBeVisible();
  await expect(
    page.getByRole('group', {
      name: 'Temporary Willpower: 3 out of 10',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Bruised: Bashing damage' }),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('expanded-section-adept.json');

  const importSource = createBlankMageCharacter(
    new Date('2026-07-23T12:00:00.000Z'),
    'b677e325-ae7c-4b23-9645-a041e6879338',
  );
  importSource.identity.name = 'Archive Adept';
  importSource.abilities.knowledges.occult = 4;
  importSource.enlightenment.quintessence = 6;

  await page.locator('input[type="file"]').setInputFiles({
    name: 'archive-adept.json',
    mimeType: 'application/json',
    buffer: Buffer.from(serializeCharacter(importSource, 'json')),
  });

  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Archive Adept (Imported)',
  );
  await expect(
    page.getByRole('group', { name: 'Occult: 4 out of 5' }),
  ).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Quintessence: 6 out of 10' }),
  ).toBeVisible();
});
