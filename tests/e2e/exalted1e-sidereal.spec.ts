import { expect, test } from '@playwright/test';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import { EXALTED1E_SCHEMA_VERSION } from '../../src/games/exalted1e/definitions';

/**
 * Phase 6 "browser tests" certification dimension for Sidereal: real,
 * rendered-browser evidence of the guided-creation wizard, the
 * `SiderealAstrologyPanel` (Astrology: Colleges, Resplendent Destinies,
 * Greater Signs, the rules reference), the Division/Paradox fields, the
 * Charms/Sorcery catalog, and IndexedDB persistence -- all exercised in
 * an actual browser engine, which is the dimension no jsdom-based
 * integration test can provide. See `tests/e2e/exalted1e-lunar.spec.ts`
 * for the full rationale behind the direct-IndexedDB-injection approach,
 * which this spec keeps using even now that Sidereal is certified and
 * available through the normal "Create Character" screen's real "Choose
 * Sidereal" button (see `exalted.spec.ts`'s own exercise of that exact
 * flow for Lunar, added in Phase 6's final all-five-together unlock
 * commit).
 */
test('builds, saves, and persists a real Sidereal Exalted sheet through guided creation (Phase 6 browser-test evidence)', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  const character = createBlankExaltedCharacter('sidereal', 'draft');
  character.identity.name = 'Reader-of-Threads';

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
            id: '77777777-7777-4777-8777-777777777773',
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
    creationPanel.getByText(/Allocate exactly 35 initial Ability dots/),
  ).toBeVisible();
  await expect(
    creationPanel.getByText(/Allocate Attribute categories as 8\/6\/4/),
  ).toBeVisible();
  await expect(
    creationPanel.getByRole('button', { name: 'Finalize character' }),
  ).toBeDisabled();

  await creationPanel
    .getByRole('combobox', { name: 'Caste' })
    .selectOption('journeys');
  await expect(creationPanel.getByText('Choose a Caste.')).toHaveCount(0);
  await expect(
    creationPanel.getByRole('textbox', { name: 'Creation source' }),
  ).toHaveValue('sidereals, p. 100 (PDF 103)');

  await creationPanel
    .getByRole('button', { name: 'Initialize verified Attribute profile' })
    .click();
  await creationPanel
    .getByRole('button', { name: 'Apply derived values' })
    .click();

  // Sidereal-specific family state: Division, Paradox, and the
  // SiderealAstrologyPanel's Astrology: Colleges / Resplendent Destinies /
  // Greater Signs / rules-reference cards.
  await expect(
    page.getByRole('heading', { name: 'Sidereal state' }),
  ).toBeVisible();
  await page.getByLabel('Division', { exact: true }).fill('Secret History');
  await page.getByLabel('Paradox', { exact: true }).fill('2');

  await expect(
    page.getByRole('heading', { name: 'Astrology: Colleges' }),
  ).toBeVisible();
  // "The Mast" is the House of Journeys' own Endurance-governed College.
  await page.getByRole('button', { name: 'Set The Mast to 2' }).click();

  await expect(
    page.getByRole('heading', { name: 'Resplendent Destinies' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Greater Signs' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Astrology & Paradox rules reference',
    }),
  ).toBeVisible();

  // Core traits: the same shared Attribute/Ability dot-rating controls
  // already proven for Solar/Dragon-Blooded/Lunar/Abyssal.
  await page.getByRole('button', { name: 'Set Strength to 3' }).click();
  await page.getByRole('button', { name: 'Set Perception to 2' }).click();
  await page.getByRole('button', { name: 'Set Endurance to 2' }).click();
  await page.getByRole('button', { name: 'Mark Endurance as favored' }).click();

  // Backgrounds: Sidereal's own real, page-cited catalog.
  await page
    .getByRole('combobox', { name: 'Background' })
    .selectOption('artifact');
  await page.getByRole('button', { name: 'Add Background' }).click();
  await page.getByRole('button', { name: 'Set Artifact to 3' }).click();

  // Merits & Flaws: the shared trait catalog's Sidereal-specific "Permanent
  // Caste Mark" cost override (a flat 1-point Flaw for Sidereal, vs. the
  // shared 2-point base cost), confirming the override renders and prices
  // correctly in a real browser.
  await page.getByRole('button', { name: 'Expand Merits & Flaws' }).click();
  await page.getByRole('button', { name: 'Browse Merits & Flaws' }).click();
  await page.getByRole('tab', { name: /Browse Flaws \(\d+\)/ }).click();
  await page
    .getByRole('searchbox', { name: 'Search Merits and Flaws' })
    .fill('Permanent Caste Mark');
  const casteMark = page
    .locator('#sidereal-trait-catalog .exalted-trait-card')
    .filter({
      has: page.getByRole('heading', { name: 'Permanent Caste Mark' }),
    });
  await casteMark.getByRole('button', { name: 'Add Flaw' }).click();
  await expect(page.getByText('Flaw points: 1')).toBeVisible();

  // Charms: the real 193-entry promoted Sidereal catalog.
  await page.getByRole('button', { name: 'Browse charms catalog' }).click();
  await page
    .locator('#sidereal-power-catalog')
    .getByRole('searchbox', { name: 'Search', exact: true })
    .fill('Optimistic Security Practice');
  const optimisticSecurity = page
    .locator('#sidereal-power-catalog .exalted-power-card')
    .filter({
      has: page.getByRole('heading', { name: 'Optimistic Security Practice' }),
    });
  await optimisticSecurity
    .getByRole('button', { name: 'Add Without Spending XP' })
    .click();

  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();

  await page.reload();

  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Reader-of-Threads',
  );
  await expect(
    creationPanel.getByRole('combobox', { name: 'Caste' }),
  ).toHaveValue('journeys');
  await expect(page.getByLabel('Division', { exact: true })).toHaveValue(
    'Secret History',
  );
  await expect(page.getByLabel('Paradox', { exact: true })).toHaveValue('2');
  await expect(
    page.getByRole('group', { name: 'The Mast: 2 out of 5' }),
  ).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Strength: 3 out of 5' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Clear Endurance as favored' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('group', { name: 'Artifact: 3 out of 5' }),
  ).toBeVisible();
  await expect(page.getByText('Flaw points: 1')).toBeVisible();
  await expect(
    page.locator('.exalted-selected-powers').getByRole('heading', {
      name: 'Optimistic Security Practice',
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
