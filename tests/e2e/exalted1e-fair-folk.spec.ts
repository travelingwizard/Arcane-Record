import { expect, test } from '@playwright/test';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import { EXALTED1E_SCHEMA_VERSION } from '../../src/games/exalted1e/definitions';

/**
 * Phase 6 "browser tests" certification dimension for Fair Folk: real,
 * rendered-browser evidence of the guided-creation wizard (including its
 * noble-raksha-only "Second Caste" <select>), the inline Fair Folk
 * Graces card, `FairFolkGracesPanel` (Bedlam, and the Graces/Glamour
 * Sorcery/Adjurations/Behemoths/Wyld Artifacts reference catalogs), the
 * Charms catalog,
 * and IndexedDB persistence -- all exercised in an actual browser
 * engine, which is the dimension no jsdom-based integration test can
 * provide. See `tests/e2e/exalted1e-lunar.spec.ts` for the full
 * rationale behind the direct-IndexedDB-injection approach, which this
 * spec keeps using even now that Fair Folk is certified and available
 * through the normal "Create Character" screen's real "Choose Fair Folk"
 * button (see `exalted.spec.ts`'s own exercise of that exact flow for
 * Lunar, added in Phase 6's final all-five-together unlock commit).
 */
test('builds, saves, and persists a real Fair Folk sheet through guided creation (Phase 6 browser-test evidence)', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  const character = createBlankExaltedCharacter('fair-folk', 'draft');
  character.identity.name = 'Glimmer-in-Dusklight';

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
            id: '77777777-7777-4777-8777-777777777775',
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
  // from the main Identity section's own plain "Caste" <input> for Fair
  // Folk (no dedicated identity UI yet -- see Exalted1eEditor.tsx); every
  // wizard interaction stays scoped to `.exalted-creation-panel`.
  const creationPanel = page.locator('.exalted-creation-panel');
  await expect(
    creationPanel.getByRole('heading', { name: 'Build character' }),
  ).toBeVisible();
  await expect(creationPanel.getByText('Choose a Caste.')).toBeVisible();
  await expect(
    creationPanel.getByText(/Allocate exactly 25 initial Ability dots/),
  ).toBeVisible();
  await expect(
    creationPanel.getByText(/Allocate Attribute categories as 10\/7\/4/),
  ).toBeVisible();
  await expect(
    creationPanel.getByRole('button', { name: 'Finalize character' }),
  ).toBeDisabled();

  await creationPanel
    .getByRole('combobox', { name: 'Caste', exact: true })
    .selectOption('diplomat');
  await expect(creationPanel.getByText('Choose a Caste.')).toHaveCount(0);
  await expect(
    creationPanel.getByRole('textbox', { name: 'Creation source' }),
  ).toHaveValue('fair-folk, p. 99 (PDF 100)');

  // Fair-Folk-only: a noble raksha declares a distinct Second Caste.
  await creationPanel
    .getByRole('combobox', { name: 'Second Caste' })
    .selectOption('warrior');
  await expect(
    creationPanel.getByText(
      'A noble raksha must choose a distinct second Caste.',
    ),
  ).toHaveCount(0);

  await creationPanel
    .getByRole('button', { name: 'Initialize verified Attribute profile' })
    .click();
  await creationPanel
    .getByRole('button', { name: 'Apply derived values' })
    .click();

  // Fair-Folk-specific family state: the inline Graces card (DotRatings,
  // Active assumption, Feeding notes) plus `FairFolkGracesPanel`'s own
  // Bedlam declaration and Graces/Glamour Sorcery/Adjurations/Behemoths
  // reference catalogs.
  await expect(
    page.getByRole('heading', { name: 'Fair Folk Graces' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Set Sword to 2' }).click();
  await page
    .getByLabel('Active assumption', { exact: true })
    .fill('Mortal merchant');
  // `getByLabel` cannot be used here: once a real value is typed, Chromium
  // serializes a <textarea>'s live value as its own child text node, which
  // gets folded into the wrapping <label>'s DOM text and breaks exact-name
  // label matching (its computed *accessible* name stays correct, which is
  // why `getByRole('textbox', ...)` still works). Use the role locator for
  // any filled <textarea>, the same way combobox name collisions elsewhere
  // in these specs are worked around.
  await page
    .getByRole('textbox', { name: 'Feeding notes', exact: true })
    .fill('Feeds on Valor');

  await expect(page.getByRole('heading', { name: 'Bedlam' })).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Virtue in bedlam' })
    .selectOption('valor');
  await expect(
    page.getByRole('heading', { name: 'Graces reference' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Glamour Sorcery reference' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Adjurations reference' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Behemoths reference' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Wyld Artifacts reference' }),
  ).toBeVisible();

  // Core traits: the same shared Attribute/Ability dot-rating controls
  // already proven for every prior family. "Initialize verified Attribute
  // profile" above already set Strength to 3; raise it one further to 4
  // to prove the control itself (not just the initializer) really works,
  // since re-clicking the same already-set dot toggles it off instead
  // (see DotRating's own `selectDot`). Fair Folk Attributes cap at 7
  // (raksha run higher than every other family's 5), not 5.
  await page.getByRole('button', { name: 'Set Strength to 4' }).click();
  await page.getByRole('button', { name: 'Set Melee to 2' }).click();
  await page.getByRole('button', { name: 'Mark Melee as favored' }).click();

  // Backgrounds: Fair Folk's own real, page-cited catalog.
  await page
    .getByRole('combobox', { name: 'Background' })
    .selectOption('artifact');
  await page.getByRole('button', { name: 'Add Background' }).click();
  await page.getByRole('button', { name: 'Set Artifact to 3' }).click();

  // Merits & Flaws: the shared trait catalog's universal "Internal
  // Compass" Merit, confirming Fair Folk's own reinterpreted catalog
  // description renders and prices correctly in a real browser.
  await page.getByRole('button', { name: 'Expand Merits & Flaws' }).click();
  await page.getByRole('button', { name: 'Browse Merits & Flaws' }).click();
  await page
    .getByRole('searchbox', { name: 'Search Merits and Flaws' })
    .fill('Internal Compass');
  const internalCompass = page
    .locator('#fair-folk-trait-catalog .exalted-trait-card')
    .filter({ has: page.getByRole('heading', { name: 'Internal Compass' }) });
  await internalCompass.getByRole('button', { name: 'Add Merit' }).click();
  await expect(page.getByText('Merit points: 1')).toBeVisible();

  // Charms: the real 201-entry promoted Fair Folk catalog.
  await page.getByRole('button', { name: 'Browse charms catalog' }).click();
  await page
    .locator('#fair-folk-power-catalog')
    .getByRole('searchbox', { name: 'Search', exact: true })
    .fill('Essence-Forging Art');
  const essenceForgingArt = page
    .locator('#fair-folk-power-catalog .exalted-power-card')
    .filter({
      has: page.getByRole('heading', { name: 'Essence-Forging Art' }),
    });
  await essenceForgingArt
    .getByRole('button', { name: 'Add Without Spending XP' })
    .click();

  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();

  await page.reload();

  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Glimmer-in-Dusklight',
  );
  await expect(
    creationPanel.getByRole('combobox', { name: 'Caste', exact: true }),
  ).toHaveValue('diplomat');
  await expect(
    creationPanel.getByRole('combobox', { name: 'Second Caste' }),
  ).toHaveValue('warrior');
  await expect(
    page.getByRole('group', { name: 'Sword: 2 out of 5' }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Active assumption', { exact: true }),
  ).toHaveValue('Mortal merchant');
  await expect(
    page.getByRole('textbox', { name: 'Feeding notes', exact: true }),
  ).toHaveValue('Feeds on Valor');
  await expect(
    page.getByRole('combobox', { name: 'Virtue in bedlam' }),
  ).toHaveValue('valor');
  await expect(
    page.getByRole('group', { name: 'Strength: 4 out of 7' }),
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
      name: 'Essence-Forging Art',
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
