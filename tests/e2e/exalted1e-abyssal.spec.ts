import { expect, test } from '@playwright/test';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import { EXALTED1E_SCHEMA_VERSION } from '../../src/games/exalted1e/definitions';

/**
 * Phase 6 "browser tests" certification dimension for Abyssal: real,
 * rendered-browser evidence of the guided-creation wizard, the Abyssal
 * state panel (Liege/Resonance/Whispers), the Charms/Necromancy & Sorcery
 * catalog, and IndexedDB persistence -- all exercised in an actual browser
 * engine, which is the dimension no jsdom-based integration test can
 * provide. See `tests/e2e/exalted1e-lunar.spec.ts` for the full rationale
 * behind the direct-IndexedDB-injection approach (Abyssal is still locked,
 * so the "Choose Abyssal Exalted" button on `/create` stays disabled --
 * see `exalted.spec.ts`'s own assertion of that fact).
 */
test('builds, saves, and persists a real Abyssal Exalted sheet through guided creation (Phase 6 browser-test evidence)', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  const character = createBlankExaltedCharacter('abyssal', 'draft');
  character.identity.name = 'Mask-of-Winters-Heir';

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
            id: '77777777-7777-4777-8777-777777777772',
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

  // The guided-creation wizard renders its own "Caste" <select>, distinct
  // from the main Identity section's own "Caste" <select> just below it --
  // scope every wizard interaction to `.exalted-creation-panel`.
  const creationPanel = page.locator('.exalted-creation-panel');
  await expect(
    creationPanel.getByRole('heading', { name: 'Build character' }),
  ).toBeVisible();
  await expect(creationPanel.getByText('Choose a Caste.')).toBeVisible();
  await expect(
    creationPanel.getByText(/Allocate exactly 25 initial Ability dots/),
  ).toBeVisible();
  await expect(
    creationPanel.getByText(/Allocate Attribute categories as 8\/6\/4/),
  ).toBeVisible();
  await expect(
    creationPanel.getByRole('button', { name: 'Finalize character' }),
  ).toBeDisabled();

  await creationPanel
    .getByRole('combobox', { name: 'Caste' })
    .selectOption('dusk');
  await expect(creationPanel.getByText('Choose a Caste.')).toHaveCount(0);
  await expect(
    creationPanel.getByRole('textbox', { name: 'Creation source' }),
  ).toHaveValue('abyssals, p. 124 (PDF 125)');

  await creationPanel
    .getByRole('button', { name: 'Initialize verified Attribute profile' })
    .click();
  await creationPanel
    .getByRole('button', { name: 'Apply derived values' })
    .click();

  // Abyssal-specific family state: Liege, Resonance, and the Whispers
  // dot rating.
  await expect(
    page.getByRole('heading', { name: 'Abyssal state' }),
  ).toBeVisible();
  await page.getByLabel('Liege', { exact: true }).fill('The Mask of Winters');
  await page.getByLabel('Resonance', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Set Whispers to 2' }).click();

  // Core traits: the same shared Attribute/Ability dot-rating controls
  // already proven for Solar/Dragon-Blooded/Lunar.
  await page.getByRole('button', { name: 'Set Strength to 3' }).click();
  await page.getByRole('button', { name: 'Set Charisma to 2' }).click();
  await page.getByRole('button', { name: 'Set Archery to 2' }).click();
  await page.getByRole('button', { name: 'Mark Archery as favored' }).click();

  // Backgrounds: Abyssal's own real, page-cited catalog.
  await page
    .getByRole('combobox', { name: 'Background' })
    .selectOption('artifact');
  await page.getByRole('button', { name: 'Add Background' }).click();
  await page.getByRole('button', { name: 'Set Artifact to 3' }).click();

  // Merits & Flaws: Abyssal-only "Taint's Warning" Merit, confirming the
  // shared trait catalog's Abyssal-specific wiring renders and prices
  // correctly in a real browser.
  await page.getByRole('button', { name: 'Expand Merits & Flaws' }).click();
  await page.getByRole('button', { name: 'Browse Merits & Flaws' }).click();
  await page
    .getByRole('searchbox', { name: 'Search Merits and Flaws' })
    .fill("Taint's Warning");
  const taintsWarning = page
    .locator('#abyssal-trait-catalog .exalted-trait-card')
    .filter({ has: page.getByRole('heading', { name: "Taint's Warning" }) });
  await taintsWarning.getByRole('button', { name: 'Add Merit' }).click();
  await expect(page.getByText('Merit points: 1')).toBeVisible();

  // Charms: the real 227-entry promoted Abyssal catalog.
  await page.getByRole('button', { name: 'Browse charms catalog' }).click();
  await page
    .locator('#abyssal-power-catalog')
    .getByRole('searchbox', { name: 'Search', exact: true })
    .fill('Bloodthirsty Arrow');
  const bloodthirstyArrow = page
    .locator('#abyssal-power-catalog .exalted-power-card')
    .filter({
      has: page.getByRole('heading', { name: 'Bloodthirsty Arrow' }),
    });
  await bloodthirstyArrow
    .getByRole('button', { name: 'Add Without Spending XP' })
    .click();

  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();

  await page.reload();

  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Mask-of-Winters-Heir',
  );
  await expect(
    creationPanel.getByRole('combobox', { name: 'Caste' }),
  ).toHaveValue('dusk');
  await expect(page.getByLabel('Liege', { exact: true })).toHaveValue(
    'The Mask of Winters',
  );
  await expect(page.getByLabel('Resonance', { exact: true })).toHaveValue('3');
  await expect(
    page.getByRole('group', { name: 'Strength: 3 out of 5' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Clear Archery as favored' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('group', { name: 'Artifact: 3 out of 5' }),
  ).toBeVisible();
  await expect(page.getByText('Merit points: 1')).toBeVisible();
  await expect(
    page.locator('.exalted-selected-powers').getByRole('heading', {
      name: 'Bloodthirsty Arrow',
    }),
  ).toBeVisible();

  await page.setViewportSize({ width: 320, height: 900 });
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

  expect(browserErrors).toEqual([]);
});
