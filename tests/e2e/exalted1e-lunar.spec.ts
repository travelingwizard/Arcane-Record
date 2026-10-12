import { expect, test } from '@playwright/test';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import { EXALTED1E_SCHEMA_VERSION } from '../../src/games/exalted1e/definitions';

/**
 * Phase 6 "browser tests" certification dimension for Lunar: real,
 * rendered-browser evidence of the guided-creation wizard, the
 * Lunar-specific family-state panels (Lunar state, Heart's Blood forms,
 * The Great Curse, Shapechanging rules reference), the Charms/Merits &
 * Flaws catalogs, and IndexedDB persistence -- all exercised in an actual
 * browser engine, which is the dimension no jsdom-based integration test
 * (`exalted-creation-panel.test.tsx`, `lunar-powers-editor.test.tsx`, etc.)
 * can provide.
 *
 * Lunar is now certified and available through the normal "Create
 * Character" screen's real "Choose Lunar" button (see `exalted.spec.ts`'s
 * own exercise of that exact flow, added in Phase 6's final
 * all-five-together unlock commit). This spec still reaches the character
 * by injecting a `'draft'`-status Lunar record directly into IndexedDB
 * and opening it via the character library's real "Open <name>" button,
 * exactly mirroring `exalted1e-module.spec.ts`'s own established
 * direct-injection precedent, since that approach was already written and
 * gives a stable, independent fixture; every control this spec drives
 * after that point is the same production UI a player reaches through the
 * normal creation flow.
 */
test('builds, saves, and persists a real Lunar Exalted sheet through guided creation (Phase 6 browser-test evidence)', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  const character = createBlankExaltedCharacter('lunar', 'draft');
  character.identity.name = 'Silver-Tongued Mara';

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
            id: '77777777-7777-4777-8777-777777777771',
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
  // from the main Identity section's own "Caste" <select> just below it
  // (see `Exalted1eEditor.tsx`'s `isLunar` branch) -- scope every wizard
  // interaction to `.exalted-creation-panel` so Playwright never has to
  // disambiguate between the two same-labeled fields.
  const creationPanel = page.locator('.exalted-creation-panel');
  await expect(
    creationPanel.getByRole('heading', { name: 'Build character' }),
  ).toBeVisible();
  await expect(creationPanel.getByText('Choose a Caste.')).toBeVisible();
  await expect(
    creationPanel.getByText(/Allocate exactly 25 initial Ability dots/),
  ).toBeVisible();
  await expect(
    creationPanel.getByText(/Allocate Attribute categories as 9\/7\/5/),
  ).toBeVisible();
  await expect(
    creationPanel.getByRole('button', { name: 'Finalize character' }),
  ).toBeDisabled();

  await creationPanel
    .getByRole('combobox', { name: 'Caste' })
    .selectOption('full-moon');
  await expect(creationPanel.getByText('Choose a Caste.')).toHaveCount(0);
  await expect(
    creationPanel.getByRole('textbox', { name: 'Creation source' }),
  ).toHaveValue('lunars, p. 92 (PDF 95)');

  await creationPanel
    .getByRole('button', { name: 'Initialize verified Attribute profile' })
    .click();
  await creationPanel
    .getByRole('button', { name: 'Apply derived values' })
    .click();

  // Lunar-specific family state: the compact "Lunar state" card plus the
  // extracted `LunarShapechangingPanel` (Heart's Blood forms, the Great
  // Curse reference, and the Shapechanging rules reference).
  await expect(
    page.getByRole('heading', { name: 'Lunar state' }),
  ).toBeVisible();
  await page
    .getByLabel('Tell', { exact: true })
    .fill('Eyes flash silver in moonlight');
  await page.getByLabel('Moonsilver tattoos').check();

  await expect(
    page.getByRole('heading', { name: 'Heart\u2019s Blood forms' }),
  ).toBeVisible();
  await page.getByLabel('New form name').fill('Snow leopard');
  await page.getByRole('button', { name: 'Add form' }).click();
  await expect(page.getByText('Snow leopard')).toBeVisible();

  await expect(
    page.getByRole('heading', { name: 'The Great Curse' }),
  ).toBeVisible();
  await page.getByLabel('Primary Virtue').selectOption('valor');
  await expect(
    page.getByText('Curse of the Raging Bull', { exact: false }).first(),
  ).toBeVisible();

  await expect(
    page.getByRole('heading', { name: 'Shapechanging rules reference' }),
  ).toBeVisible();

  // Core traits: the same shared Attribute/Ability dot-rating controls
  // already proven for Solar/Dragon-Blooded in `exalted.spec.ts`.
  await page.getByRole('button', { name: 'Set Strength to 3' }).click();
  await page.getByRole('button', { name: 'Set Perception to 2' }).click();
  await page.getByRole('button', { name: 'Set Archery to 2' }).click();
  await page.getByRole('button', { name: 'Mark Archery as favored' }).click();

  // Backgrounds: Lunar's own real, page-cited catalog.
  await page
    .getByRole('combobox', { name: 'Background' })
    .selectOption('artifact');
  await page.getByRole('button', { name: 'Add Background' }).click();
  await page.getByRole('button', { name: 'Set Artifact to 3' }).click();

  // Merits & Flaws: Lunar-only "Chimera (Lunar)" Flaw, confirming the
  // shared trait catalog's Lunar-specific wiring renders and prices
  // correctly in a real browser.
  await page.getByRole('button', { name: 'Expand Merits & Flaws' }).click();
  await page.getByRole('button', { name: 'Browse Merits & Flaws' }).click();
  await page.getByRole('tab', { name: /Browse Flaws \(\d+\)/ }).click();
  await page
    .getByRole('searchbox', { name: 'Search Merits and Flaws' })
    .fill('Chimera');
  const chimera = page
    .locator('#lunar-trait-catalog .exalted-trait-card')
    .filter({ has: page.getByRole('heading', { name: 'Chimera (Lunar)' }) });
  await chimera.getByRole('button', { name: 'Add Flaw' }).click();
  await expect(page.getByText('Flaw points: 3')).toBeVisible();

  // Charms: the real 219-entry promoted Lunar catalog.
  await page.getByRole('button', { name: 'Browse charms catalog' }).click();
  await page
    .locator('#lunar-power-catalog')
    .getByRole('searchbox', { name: 'Search', exact: true })
    .fill('Hide of the Cunning Hunter');
  const hideCharm = page
    .locator('#lunar-power-catalog .exalted-power-card')
    .filter({
      has: page.getByRole('heading', { name: 'Hide of the Cunning Hunter' }),
    });
  await hideCharm
    .getByRole('button', { name: 'Add Without Spending XP' })
    .click();

  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();

  await page.reload();

  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Silver-Tongued Mara',
  );
  await expect(
    creationPanel.getByRole('combobox', { name: 'Caste' }),
  ).toHaveValue('full-moon');
  await expect(page.getByLabel('Tell', { exact: true })).toHaveValue(
    'Eyes flash silver in moonlight',
  );
  await expect(page.getByLabel('Moonsilver tattoos')).toBeChecked();
  await expect(page.getByText('Snow leopard')).toBeVisible();
  await expect(page.getByLabel('Primary Virtue')).toHaveValue('valor');
  await expect(
    page.getByRole('group', { name: 'Strength: 3 out of 5' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Clear Archery as favored' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('group', { name: 'Artifact: 3 out of 5' }),
  ).toBeVisible();
  await expect(page.getByText('Flaw points: 3')).toBeVisible();
  await expect(
    page.locator('.exalted-selected-powers').getByRole('heading', {
      name: 'Hide of the Cunning Hunter',
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
