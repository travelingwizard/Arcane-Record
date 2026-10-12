import { expect, test } from '@playwright/test';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import { EXALTED1E_SCHEMA_VERSION } from '../../src/games/exalted1e/definitions';

/**
 * Phase 6 "browser tests" certification dimension for Alchemical: real,
 * rendered-browser evidence of the guided-creation wizard (including its
 * Alchemical-only "Favored Attributes" checkbox grid, since Alchemical's
 * Attributes are Caste/Favored-keyed rather than priority-group-keyed
 * like every other family), the `AlchemicalInstallationPanel` (Clarity,
 * Dedicated/General Slots, Charm installation), the Charms/Weaving
 * Protocols catalog, and IndexedDB persistence -- all exercised in an
 * actual browser engine, which is the dimension no jsdom-based
 * integration test can provide. See `tests/e2e/exalted1e-lunar.spec.ts`
 * for the full rationale behind the direct-IndexedDB-injection approach
 * (Alchemical is still locked, so the "Choose Alchemical Exalted" button
 * on `/create` stays disabled -- see `exalted.spec.ts`'s own assertion
 * of that fact).
 */
test('builds, saves, and persists a real Alchemical Exalted sheet through guided creation (Phase 6 browser-test evidence)', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  const character = createBlankExaltedCharacter('alchemical', 'draft');
  character.identity.name = 'Unit-7 Calibration';

  await page.goto('/');
  await page.evaluate(
    async ({ characterData, schemaVersion }) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('arcane-ledger');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction('characters', 'readwrite');
          transaction.objectStore('characters').put({
            id: '77777777-7777-4777-8777-777777777774',
            systemId: 'exalted1e',
            systemVersion: schemaVersion,
            name: characterData.identity.name,
            createdAt: '2026-10-12T12:00:00.000Z',
            updatedAt: '2026-10-12T12:00:00.000Z',
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
    { characterData: character, schemaVersion: EXALTED1E_SCHEMA_VERSION },
  );
  await page.reload();

  await page
    .getByRole('button', { name: `Open ${character.identity.name}` })
    .click();
  await expect(page).toHaveURL(/\/characters\//);
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();

  // The guided-creation wizard renders its own "Caste" <select>; the main
  // Identity section only has a plain text "Caste" <input> for Alchemical
  // (no dedicated identity UI yet -- see Exalted1eEditor.tsx), so no
  // disambiguation is needed, but every wizard interaction stays scoped
  // to `.exalted-creation-panel` for consistency with every other family.
  const creationPanel = page.locator('.exalted-creation-panel');
  await expect(
    creationPanel.getByRole('heading', { name: 'Build character' }),
  ).toBeVisible();
  await expect(creationPanel.getByText('Choose a Caste.')).toBeVisible();
  await expect(
    creationPanel.getByText(/Allocate exactly 23 initial Ability dots/),
  ).toBeVisible();
  await expect(
    creationPanel.getByRole('button', { name: 'Finalize character' }),
  ).toBeDisabled();

  await creationPanel
    .getByRole('combobox', { name: 'Caste' })
    .selectOption('orichalcum');
  await expect(creationPanel.getByText('Choose a Caste.')).toHaveCount(0);
  await expect(
    creationPanel.getByRole('textbox', { name: 'Creation source' }),
  ).toHaveValue('autochthonians, p. 63 (PDF 64)');

  // Alchemical-only: choose three Favored Attributes outside the Caste's
  // own three (Orichalcum = Strength/Charisma/Intelligence).
  await creationPanel.getByLabel('Dexterity', { exact: true }).check();
  await creationPanel.getByLabel('Stamina', { exact: true }).check();
  await creationPanel.getByLabel('Wits', { exact: true }).check();

  await creationPanel
    .getByRole('button', { name: 'Initialize verified Attribute profile' })
    .click();
  await creationPanel
    .getByRole('button', { name: 'Apply derived values' })
    .click();

  // Alchemical-specific family state: Clarity, Dedicated/General Slots,
  // and the installed-Charms checkbox list.
  await expect(
    page.getByRole('heading', { name: 'Alchemical installation' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Set Permanent Clarity to 2' })
    .click();
  await page.getByLabel('Dedicated Slots', { exact: true }).fill('1');
  await page.getByLabel('General Slots', { exact: true }).fill('1');

  // Core traits: the same shared Attribute/Ability dot-rating controls
  // already proven for Solar/Dragon-Blooded/Lunar/Abyssal/Sidereal.
  // "Initialize verified Attribute profile" above already set Strength
  // (a Caste Attribute) to 3; raise it one further to 4 to prove the
  // dot-rating control itself (not just the initializer) really works,
  // since re-clicking the same already-set dot toggles it off instead.
  await page.getByRole('button', { name: 'Set Strength to 4' }).click();
  await page.getByRole('button', { name: 'Set Melee to 2' }).click();
  await page.getByRole('button', { name: 'Mark Melee as favored' }).click();

  // Backgrounds: Alchemical's own real, page-cited catalog.
  await page
    .getByRole('combobox', { name: 'Background' })
    .selectOption('artifact');
  await page.getByRole('button', { name: 'Add Background' }).click();
  await page.getByRole('button', { name: 'Set Artifact to 3' }).click();

  // Merits & Flaws: the shared trait catalog's universal "Internal
  // Compass" Merit, confirming Alchemical's own reinterpreted catalog
  // description renders and prices correctly in a real browser.
  await page.getByRole('button', { name: 'Expand Merits & Flaws' }).click();
  await page.getByRole('button', { name: 'Browse Merits & Flaws' }).click();
  await page
    .getByRole('searchbox', { name: 'Search Merits and Flaws' })
    .fill('Internal Compass');
  const internalCompass = page
    .locator('#alchemical-trait-catalog .exalted-trait-card')
    .filter({ has: page.getByRole('heading', { name: 'Internal Compass' }) });
  await internalCompass.getByRole('button', { name: 'Add Merit' }).click();
  await expect(page.getByText('Merit points: 1')).toBeVisible();

  // Charms: the real 96-entry promoted Alchemical catalog, then install
  // it via `AlchemicalInstallationPanel`'s own checkbox list (only Charms
  // already on the sheet appear there).
  await page.getByRole('button', { name: 'Browse charms catalog' }).click();
  await page
    .locator('#alchemical-power-catalog')
    .getByRole('searchbox', { name: 'Search', exact: true })
    .fill('Interceptor Spark Emitter');
  const interceptorSpark = page
    .locator('#alchemical-power-catalog .exalted-power-card')
    .filter({
      has: page.getByRole('heading', { name: 'Interceptor Spark Emitter' }),
    });
  await interceptorSpark
    .getByRole('button', { name: 'Add Without Spending XP' })
    .click();
  await page.getByLabel('Interceptor Spark Emitter').check();
  await expect(
    page.getByText(
      '1 of 2 Slots installed \u00b7 0 installation motes committed',
    ),
  ).toBeVisible();

  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();

  await page.reload();

  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Unit-7 Calibration',
  );
  await expect(
    creationPanel.getByRole('combobox', { name: 'Caste' }),
  ).toHaveValue('orichalcum');
  await expect(
    page.getByRole('group', { name: 'Permanent Clarity: 2 out of 10' }),
  ).toBeVisible();
  await expect(page.getByLabel('Dedicated Slots', { exact: true })).toHaveValue(
    '1',
  );
  await expect(page.getByLabel('General Slots', { exact: true })).toHaveValue(
    '1',
  );
  await expect(
    page.getByRole('group', { name: 'Strength: 4 out of 5' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Clear Melee as favored' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('group', { name: 'Artifact: 3 out of 5' }),
  ).toBeVisible();
  await expect(page.getByText('Merit points: 1')).toBeVisible();
  await expect(
    page.locator('.exalted-selected-powers').getByRole('heading', {
      name: 'Interceptor Spark Emitter',
    }),
  ).toBeVisible();
  await expect(page.getByLabel('Interceptor Spark Emitter')).toBeChecked();
  await expect(
    page.getByText(
      '1 of 2 Slots installed \u00b7 0 installation motes committed',
    ),
  ).toBeVisible();

  await page.setViewportSize({ width: 320, height: 900 });
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

  expect(browserErrors).toEqual([]);
});
