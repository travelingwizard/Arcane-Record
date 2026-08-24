import { expect, test } from '@playwright/test';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';

test('creates an Exalted module copy and preserves shared Play behavior', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const data = createBlankExaltedCharacter('dragon-blooded');
  data.identity.name = 'Ledaal Kes';
  data.identity.aspect = 'Air';

  await page.goto('/');
  await page.evaluate(async (characterData) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('arcane-ledger');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('characters', 'readwrite');
        transaction.objectStore('characters').put({
          id: '88888888-8888-4888-8888-888888888888',
          systemId: 'exalted1e',
          systemVersion: 6,
          name: 'Ledaal Kes',
          createdAt: '2026-08-24T12:00:00.000Z',
          updatedAt: '2026-08-24T12:00:00.000Z',
          data: characterData,
        });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }, data);
  await page.reload();

  const legacyCard = page.locator('.character-card').filter({
    has: page.getByText('Ledaal Kes', { exact: true }),
  });
  await legacyCard.getByRole('button', { name: 'Preview module copy' }).click();

  await expect(
    page.getByRole('heading', { name: 'Ledaal Kes · Module preview' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Air' })).toBeVisible();
  await expect(
    page.getByText(/Choose from 320 Dragon-Blooded Charms and 99/),
  ).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Catalog language' })
    .selectOption('low-realm');
  await page.getByRole('button', { name: 'Add language' }).click();
  await expect(
    page
      .locator('.exalted-record-group strong')
      .filter({ hasText: 'Low Realm' }),
  ).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Background' })
    .selectOption('artifact');
  await page.getByRole('button', { name: 'Add Background' }).click();
  await expect(
    page
      .locator('.exalted-background-list strong')
      .filter({ hasText: 'Artifact' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Browse Merits & Flaws' }).click();
  await page
    .getByRole('searchbox', { name: 'Search Merits and Flaws' })
    .fill('Ambidextrous');
  await page.getByLabel('Ambidextrous chosen cost').selectOption('2');
  await page.getByRole('button', { name: 'Add Merit' }).click();
  await expect(page.getByText('Merit points: 2')).toBeVisible();
  await page.getByRole('button', { name: 'Browse charms catalog' }).click();
  await page
    .locator('#dragon-blooded-power-catalog')
    .getByRole('searchbox', { name: 'Search', exact: true })
    .fill('Terrestrial Circle Sorcery');
  await page
    .locator('.exalted-power-card')
    .filter({ hasText: 'Terrestrial Circle Sorcery' })
    .getByRole('button', { name: 'Add Without Spending XP' })
    .click();
  await expect(page.getByRole('tab', { name: 'Charms (1)' })).toBeVisible();
  await page.getByRole('button', { name: 'Set Melee to 3' }).click();
  await page
    .getByRole('button', { name: 'Set Temporary Willpower to 2' })
    .click();
  await expect(page.getByText('Saved in this browser')).toBeVisible();

  await page.getByRole('switch').click();
  await expect(
    page.getByRole('button', { name: 'Set Melee to 4' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', {
      name: 'Set Permanent Willpower to 1',
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: 'Set Temporary Willpower to 3' })
    .click();

  const navigation = page.getByRole('navigation', {
    name: 'Character sheet sections',
  });
  await navigation.getByRole('button', { name: 'Edit section order' }).click();
  await navigation
    .getByRole('button', { name: 'Move Character later' })
    .click();

  await page.setViewportSize({ width: 320, height: 820 });
  await page.reload();
  await page.getByRole('button', { name: /^Sections / }).click();
  await expect(
    page.getByRole('dialog', { name: 'Character Sections' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);

  await expect
    .poll(() =>
      page.evaluate(async () => {
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('arcane-ledger');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const records = await new Promise<Array<Record<string, unknown>>>(
          (resolve, reject) => {
            const request = database
              .transaction('characters')
              .objectStore('characters')
              .getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          },
        );
        database.close();
        return records.map(({ systemId, moduleRef }) => ({
          systemId,
          convertedFromCharacterId: (
            moduleRef as { convertedFromCharacterId?: string } | undefined
          )?.convertedFromCharacterId,
        }));
      }),
    )
    .toEqual(
      expect.arrayContaining([
        { systemId: 'exalted1e', convertedFromCharacterId: undefined },
        {
          systemId: 'arcane-module',
          convertedFromCharacterId: '88888888-8888-4888-8888-888888888888',
        },
      ]),
    );
});

test('routes a Solar module copy to explicit incomplete catalog placeholders', async ({
  page,
}) => {
  const data = createBlankExaltedCharacter('solar');
  data.identity.name = 'Aurelia';
  data.identity.caste = 'Dawn';
  await page.goto('/');
  await page.evaluate(async (characterData) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('arcane-ledger');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('characters', 'readwrite');
        transaction.objectStore('characters').put({
          id: '99999999-9999-4999-8999-999999999999',
          systemId: 'exalted1e',
          systemVersion: 6,
          name: 'Aurelia',
          createdAt: '2026-08-24T12:00:00.000Z',
          updatedAt: '2026-08-24T12:00:00.000Z',
          data: characterData,
        });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }, data);
  await page.reload();
  const card = page.locator('.character-card').filter({
    has: page.getByText('Aurelia', { exact: true }),
  });
  await card.getByRole('button', { name: 'Preview module copy' }).click();
  await expect(page.getByLabel('Caste')).toHaveValue('Dawn');
  await expect(
    page.getByText(/Solar Merits & Flaws reference data is not yet available/),
  ).toBeVisible();
  await expect(
    page.getByText(/Solar Charm and Sorcery catalog is not yet converted/),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Limit Break' }),
  ).toBeVisible();
});
