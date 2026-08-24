import { expect, test } from '@playwright/test';
import { mage20Phase2Module } from '../../src/games/mage20/module/mage20-phase2-module';
import { stageModuleFile } from '../../src/modules/interchange/module-files';

test('renders the Mage identity and grouped Trait parity slice', async ({
  page,
}) => {
  const staged = await stageModuleFile(
    JSON.stringify(mage20Phase2Module),
    'mage20-phase2.json',
  );
  const module = staged.envelope!;
  const data = structuredClone(module.sheetTemplates[0]!.defaults) as {
    identity: Record<string, string>;
    attributes: { physical: { dexterity: number } };
  };
  data.identity.name = 'Morgan Vale';
  data.identity.affiliation = 'Order of Hermes';
  data.attributes.physical.dexterity = 4;
  const characterId = 'mage20-phase2-e2e';
  const dependencyLockId = '77dcb1f7-13b1-4986-9c78-2f6a940d9afb';

  await page.goto('/');
  await page.evaluate(
    async ({ modulePackage, checksum, characterData, lockId }) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('arcane-ledger');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(
            ['modulePackages', 'moduleLocks', 'characters'],
            'readwrite',
          );
          transaction.objectStore('modulePackages').put({
            moduleId: modulePackage.moduleId,
            moduleVersion: modulePackage.moduleVersion,
            checksum,
            origin: 'bundled',
            installedAt: '2026-08-24T12:00:00.000Z',
            envelope: modulePackage,
          });
          transaction.objectStore('moduleLocks').put({
            id: lockId,
            moduleId: modulePackage.moduleId,
            moduleVersion: modulePackage.moduleVersion,
            dependencies: [],
            createdAt: '2026-08-24T12:00:00.000Z',
          });
          transaction.objectStore('characters').put({
            id: 'mage20-phase2-e2e',
            systemId: 'arcane-module',
            systemVersion: 1,
            name: 'Morgan Vale',
            createdAt: '2026-08-24T12:00:00.000Z',
            updatedAt: '2026-08-24T12:00:00.000Z',
            moduleRef: {
              moduleId: modulePackage.moduleId,
              moduleVersion: modulePackage.moduleVersion,
              gameNodeId: 'mage20',
              sheetTemplateId: 'mage20-character',
              sheetTemplateVersion: 1,
              dependencyLockId: lockId,
              enabledOverlayRefs: [],
            },
            data: characterData,
          });
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      });
    },
    {
      modulePackage: module,
      checksum: staged.checksum!,
      characterData: data,
      lockId: dependencyLockId,
    },
  );

  await page.goto(`/characters/${characterId}`);
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(
    'Morgan Vale',
  );
  await expect(page.getByRole('heading', { name: 'Physical' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Talents' })).toBeVisible();
  await page.getByRole('button', { name: 'Set Dexterity to 5' }).click();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
  await page.getByRole('switch').click();
  await expect(
    page.getByRole('button', { name: 'Set Dexterity to 5' }),
  ).toBeDisabled();
  await expect(page.getByRole('textbox', { name: 'Name' })).toBeEditable();

  await page.setViewportSize({ width: 320, height: 760 });
  await page.reload();
  await page.getByRole('button', { name: /Sections/ }).click();
  await expect(
    page.getByRole('dialog', { name: 'Character Sections' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});
