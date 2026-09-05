import { expect, test } from '@playwright/test';
import { createSyntheticModule } from '../fixtures/synthetic-module';
import { stageModuleFile } from '../../src/modules/interchange/module-files';

test('opens, edits, persists, and navigates a module-rendered character', async ({
  page,
}) => {
  const staged = await stageModuleFile(
    JSON.stringify(createSyntheticModule()),
    'synthetic.json',
  );
  const module = staged.envelope!;
  const characterId = 'module-e2e-character';
  const character = {
    id: characterId,
    systemId: 'arcane-module',
    systemVersion: 1,
    name: 'Module E2E Character',
    createdAt: '2026-08-24T12:00:00.000Z',
    updatedAt: '2026-08-24T12:00:00.000Z',
    moduleRef: {
      moduleId: module.moduleId,
      moduleVersion: module.moduleVersion,
      gameNodeId: 'test-variant',
      sheetTemplateId: 'test-sheet',
      sheetTemplateVersion: 1,
      dependencyLockId: '11eb1f47-fe49-445a-9a07-0c0048766682',
      enabledOverlayRefs: [],
    },
    data: structuredClone(module.sheetTemplates[0]!.defaults),
  };

  await page.goto('/');
  await page.evaluate(
    async ({ modulePackage, storedCharacter, checksum }) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('arcane-ledger');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(
            [
              'modulePackages',
              'moduleInstallations',
              'moduleLocks',
              'characters',
            ],
            'readwrite',
          );
          transaction.objectStore('modulePackages').put({
            moduleId: modulePackage.moduleId,
            moduleVersion: modulePackage.moduleVersion,
            checksum,
            origin: 'local',
            installedAt: '2026-08-24T12:00:00.000Z',
            envelope: modulePackage,
          });
          transaction.objectStore('moduleLocks').put({
            id: storedCharacter.moduleRef.dependencyLockId,
            moduleId: modulePackage.moduleId,
            moduleVersion: modulePackage.moduleVersion,
            dependencies: [],
            createdAt: '2026-08-24T12:00:00.000Z',
          });
          transaction.objectStore('moduleInstallations').put({
            moduleId: modulePackage.moduleId,
            activeVersion: modulePackage.moduleVersion,
            origin: 'local',
            enabled: true,
            enabledOverlayRefs: [],
            updatedAt: '2026-08-24T12:00:00.000Z',
          });
          transaction.objectStore('characters').put(storedCharacter);
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
      storedCharacter: character,
      checksum: staged.checksum!,
    },
  );

  await page.goto(`/characters/${characterId}`);
  await expect(
    page.getByRole('heading', { name: 'Module E2E Character' }),
  ).toBeVisible();
  await expect(page.locator('main.local-sheet-editor-shell')).toBeVisible();
  await expect(page.locator('.local-character-sheet')).toBeVisible();
  const moduleSectionSurface = await page
    .locator('.local-character-sheet .sheet-section')
    .first()
    .evaluate((node) => {
      const probe = document.createElement('span');
      probe.style.border = '1px solid var(--rule)';
      document.body.append(probe);
      const expectedBorder = getComputedStyle(probe).borderColor;
      probe.remove();
      return {
        border: getComputedStyle(node).borderColor,
        expectedBorder,
        background: getComputedStyle(node).backgroundImage,
        headingFont: getComputedStyle(node.querySelector('h2')!).fontFamily,
      };
    });
  expect(moduleSectionSurface.border).toBe(moduleSectionSurface.expectedBorder);
  expect(moduleSectionSurface.background).not.toBe('none');
  expect(moduleSectionSurface.headingFont).toContain('Iowan Old Style');
  await expect(
    page.getByRole('navigation', { name: 'Character sheet sections' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Set Resolve to 4' }).click();
  await expect(page.getByText('Saved in this browser')).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Set Resolve to 4' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('switch').click();
  await expect(
    page.getByRole('button', { name: 'Set Resolve to 5' }),
  ).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();

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
