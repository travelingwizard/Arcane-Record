import { expect, test } from '@playwright/test';
import { createHighCircleMatrixFixture } from '../fixtures/earthdawn-high-circle';
import {
  createMatrixBrowserFixture,
  matrixBrowserCases,
} from '../fixtures/earthdawn-matrix-browser';
import { expectMageAlignedFieldGrid } from './support/sheet-alignment';

async function seedEarthdawnCharacter(
  page: import('@playwright/test').Page,
  id: string,
  name: string,
  data: ReturnType<typeof createHighCircleMatrixFixture>,
) {
  data.identity.name = name;
  await page.goto('/');
  await page.evaluate(
    async ({ characterData, characterId, characterName }) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('arcane-ledger');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction('characters', 'readwrite');
          transaction.objectStore('characters').put({
            id: characterId,
            systemId: 'earthdawn4e',
            systemVersion: 13,
            name: characterName,
            createdAt: '2026-10-05T12:00:00.000Z',
            updatedAt: '2026-10-05T12:00:00.000Z',
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
    { characterData: data, characterId: id, characterName: name },
  );
  await page.reload();
  await page.getByRole('button', { name: `Open ${name}` }).click();
}

async function openEarthdawnCreator(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Earthdawn 4e' }).click();
  await page.getByRole('button', { name: 'Build Character' }).click();
}

async function applyCreatorChange(
  page: import('@playwright/test').Page,
  title: string,
) {
  const dialog = page.getByRole('dialog', { name: title });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Apply change' }).click();
}

async function finishCreatorFromRaceStep(
  page: import('@playwright/test').Page,
  name: string,
) {
  for (let index = 0; index < 5; index += 1)
    await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('name').fill(name);
  const review = page.locator('.earthdawn-creator').getByText(/Final wallet/);
  await expect(review).toBeVisible();
  await page.getByRole('button', { name: 'Complete Character' }).click();
  await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible();
  await expect(page.locator('.save-status')).toHaveText(
    'Saved in this browser',
  );
}

test('confirms squeezed matrix blood magic and preserves native group warnings', async ({
  page,
}) => {
  const data = createHighCircleMatrixFixture();
  const switchMatrix = data.magic.matrices.find(
    ({ name }) => name === 'Squeezed Switch Matrix',
  )!;
  const switchSpell = data.magic.spells.find(({ name }) => name === 'Switch')!;
  switchMatrix.spellId = switchSpell.id;
  switchMatrix.spellIds = [switchSpell.id];

  await page.goto('/');
  await page.evaluate(async (characterData) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('arcane-ledger');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('characters', 'readwrite');
        transaction.objectStore('characters').put({
          id: '77777777-7777-4777-8777-777777777777',
          systemId: 'earthdawn4e',
          systemVersion: 13,
          name: 'Matrix Verification Adept',
          createdAt: '2026-10-05T12:00:00.000Z',
          updatedAt: '2026-10-05T12:00:00.000Z',
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
  await page
    .getByRole('button', { name: 'Open Matrix Verification Adept' })
    .click();
  await page
    .getByRole('heading', { name: 'Spells & Matrices' })
    .scrollIntoViewIfNeeded();

  const squeezedMatrix = page
    .locator('.earthdawn-matrix-card')
    .filter({ hasText: 'Squeezed Switch Matrix' });
  const picker = squeezedMatrix.getByLabel('Add compatible spell');
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('2 Blood Magic Damage');
    await dialog.dismiss();
  });
  await picker.selectOption({ label: 'True Switch · Illusionist Circle 6' });
  await expect(squeezedMatrix.getByText(/True Switch · Circle 6/)).toHaveCount(
    0,
  );
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('2 Blood Magic Damage');
    await dialog.accept();
  });
  await picker.selectOption({ label: 'True Switch · Illusionist Circle 6' });
  await expect(
    squeezedMatrix.getByText(/True Switch · Circle 6/),
  ).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        return new Promise<number>((resolve, reject) => {
          const request = indexedDB.open('arcane-ledger');
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const database = request.result;
            const transaction = database.transaction('characters', 'readonly');
            const get = transaction
              .objectStore('characters')
              .get('77777777-7777-4777-8777-777777777777');
            get.onsuccess = () => {
              resolve(get.result.data.health.bloodMagicDamage);
              database.close();
            };
            get.onerror = () => reject(get.error);
          };
        });
      }),
    )
    .toBe(2);

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('removes every spell');
    await dialog.accept();
  });
  await squeezedMatrix
    .locator('li')
    .filter({ hasText: 'True Switch' })
    .getByRole('button', { name: 'Remove' })
    .click();
  await expect(squeezedMatrix.getByText(/Switch · Circle/)).toHaveCount(0);

  for (const matrixName of ['External Matrix', 'Divided Matrix']) {
    const restrictedCard = page
      .locator('.earthdawn-matrix-card')
      .filter({ hasText: matrixName });
    await restrictedCard
      .getByLabel('Attuned spell')
      .selectOption({ label: 'Switch · Illusionist Circle 5' });
    await expect(
      restrictedCard.getByLabel('Add compatible spell'),
    ).not.toContainText('True Switch');
    await restrictedCard
      .locator('.earthdawn-matrix-attuned-list li')
      .filter({ hasText: 'Switch' })
      .getByRole('button', { name: 'Remove' })
      .click();
  }

  const sharedMatrix = page
    .locator('.earthdawn-matrix-card')
    .filter({ hasText: 'Mixed Shared Matrix' });
  await expect(
    sharedMatrix.getByText(/Only one Fog Ghost spell may be active/),
  ).toBeVisible();
  await expect(
    sharedMatrix.getByText(/Only one Shadow Hunter spell may be active/),
  ).toBeVisible();

  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
});

test('contains Earthdawn rules UI at desktop, tablet, narrow, and zoom-equivalent widths', async ({
  page,
}) => {
  const character = createHighCircleMatrixFixture();
  character.identity.raceName = 'Troll';
  character.creation.enforceRules = false;
  await seedEarthdawnCharacter(
    page,
    '99999999-9999-4999-8999-999999999999',
    'Responsive Matrix Adept',
    character,
  );

  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 768, height: 900 },
    { width: 640, height: 800 }, // 1280px display at effective 200% zoom.
    { width: 320, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(
      page.getByRole('heading', {
        name: 'Characteristics & Health',
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }

  await page.getByRole('button', { name: 'Compendium' }).click();
  const catalog = page.getByRole('dialog', { name: 'Earthdawn catalog' });
  await expect(catalog).toBeVisible();
  await catalog.getByRole('button', { name: 'Show catalog as a list' }).click();
  const tableScroller = catalog.locator('.earthdawn-catalog-table-wrap');
  await expect(tableScroller).toBeVisible();
  const bounds = await catalog.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      viewport: window.innerWidth,
      pageWidth: document.documentElement.scrollWidth,
    };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport);
  expect(bounds.pageWidth).toBeLessThanOrEqual(bounds.viewport);
  expect(
    await tableScroller.evaluate(
      (node) => node.scrollWidth >= node.clientWidth && node.clientWidth > 0,
    ),
  ).toBe(true);
  await catalog.getByRole('button', { name: 'Close catalog' }).click();
  await expect(page.getByRole('button', { name: 'Compendium' })).toBeFocused();

  await page.getByRole('button', { name: 'Basic Rules' }).click();
  const rules = page.getByRole('dialog', { name: 'Basic Rules reference' });
  const healingRule = rules
    .locator('details')
    .filter({ hasText: '7. Healing Aids' });
  await healingRule.locator('summary').click();
  await expect(healingRule.locator('.earthdawn-rule-table-wrap')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const rulesBounds = await rules.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { left: rect.left, right: rect.right, viewport: window.innerWidth };
  });
  expect(rulesBounds.left).toBeGreaterThanOrEqual(0);
  expect(rulesBounds.right).toBeLessThanOrEqual(rulesBounds.viewport);
  await rules.getByRole('button', { name: 'Close rules' }).click();
});

test('reviews dependency-safe optional-record removal in Build and Play modes', async ({
  page,
}) => {
  const data = createHighCircleMatrixFixture();
  await seedEarthdawnCharacter(
    page,
    '61616161-6161-4616-8616-616161616161',
    'CRUD Verification Adept',
    data,
  );

  const switchSpell = page
    .locator('.earthdawn-known-spell')
    .filter({ has: page.locator('summary strong', { hasText: /^Switch$/ }) });
  await switchSpell.locator('summary').click();
  const removeSpell = switchSpell.getByRole('button', {
    name: 'Remove known spell',
  });
  await removeSpell.click();
  let dialog = page.getByRole('dialog', { name: 'Review record removal' });
  await expect(dialog).toContainText('Remove Switch?');
  await expect(dialog).toContainText('Squeezed Switch Matrix');
  await expect(dialog).toContainText('does not erase or refund Legend Points');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(removeSpell).toBeFocused();

  await removeSpell.click();
  dialog = page.getByRole('dialog', { name: 'Review record removal' });
  await dialog.getByRole('button', { name: 'Confirm removal' }).click();
  await expect(
    page
      .locator('.earthdawn-known-spell')
      .filter({ has: page.locator('summary strong', { hasText: /^Switch$/ }) }),
  ).toHaveCount(0);

  await page
    .getByRole('switch', { name: /Earthdawn Edit and Play mode/ })
    .check();
  const knack = page
    .locator('.sheet-card')
    .filter({ has: page.locator('strong', { hasText: /^Squeeze Switch$/ }) });
  await knack.getByRole('button', { name: 'Remove' }).click();
  dialog = page.getByRole('dialog', { name: 'Review record removal' });
  await expect(dialog).toContainText('Remove Squeeze Switch?');
  await dialog.getByRole('button', { name: 'Confirm removal' }).click();
  await expect(
    page.locator('.sheet-card strong', { hasText: /^Squeeze Switch$/ }),
  ).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 720 });
  const remainingSpell = page.locator('.earthdawn-known-spell').first();
  await remainingSpell.locator('summary').click();
  await remainingSpell
    .getByRole('button', { name: 'Remove known spell' })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Review record removal' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('browses every supported Mystic Path without treating Boatman as a Path', async ({
  page,
}) => {
  const pathAdept = createHighCircleMatrixFixture();
  pathAdept.creation.enforceRules = false;
  await seedEarthdawnCharacter(
    page,
    '91919191-9191-4919-8919-919191919191',
    'Mystic Path Browser Adept',
    pathAdept,
  );
  await page.getByRole('button', { name: 'Browse Mystic Paths' }).click();
  const dialog = page.getByRole('dialog', { name: 'Browse Mystic Paths' });
  await expect(dialog).toBeVisible();
  for (const name of [
    'Outcast Path',
    'Windmaster Path',
    'Tail Dancer Path',
    'Fire Eater Path',
    'Horror Stalker Path',
    'Journeyman Path',
    'Liberator Path',
    'Messenger Path',
    'Purifier Path',
    'Scholar Path',
    'Woodsman Path',
  ])
    await expect(dialog.getByRole('heading', { name })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Boatman' })).toHaveCount(0);
  await expect(dialog.getByRole('heading', { name: 'Gauntlet' })).toHaveCount(
    0,
  );
  await expect(dialog.getByRole('heading', { name: 'Shaman' })).toHaveCount(0);
  await dialog
    .getByRole('button', { name: 'Show Mystic Paths as a list' })
    .click();
  await expect(
    dialog.getByRole('button', { name: 'Resize Name column' }),
  ).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Show Mystic Paths as cards' })
    .click();
  const outcast = dialog.locator('.catalog-card').filter({
    has: page.getByRole('heading', { name: 'Outcast Path', exact: true }),
  });
  await outcast.getByRole('button', { name: 'Initiate Path' }).click();
  await page.getByRole('button', { name: 'Confirm purchase' }).click();
  await expect(page.getByText('Outcast Path').first()).toBeVisible();
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('offers Gauntlet and Shaman as complete Disciplines', async ({ page }) => {
  const data = createHighCircleMatrixFixture();
  data.disciplines = data.disciplines.filter(({ name }) => name !== 'Shaman');
  await seedEarthdawnCharacter(
    page,
    '92929292-9292-4929-8929-929292929292',
    'Supplemental Discipline Browser',
    data,
  );
  await page.getByRole('button', { name: 'Add Discipline & Questor' }).click();
  const dialog = page.getByRole('dialog', {
    name: 'Add Discipline and Questor',
  });
  await expect(dialog).toBeVisible();
  const search = dialog.getByLabel(
    'Search Disciplines, Questors, talents, and abilities',
  );
  await search.fill('Pattern Manifestation');
  await expect(dialog.getByRole('heading', { name: 'Gauntlet' })).toBeVisible();
  await dialog.getByText('Novice · Circles 1–4').click();
  await expect(dialog.getByText('page unavailable').first()).toBeVisible();
  await search.fill('Pack Leadership');
  await expect(dialog.getByRole('heading', { name: 'Shaman' })).toBeVisible();
  await dialog.getByText('Novice · Circles 1–4').click();
  await expect(dialog.getByText(/p\. 167–178/).first()).toBeVisible();
  await dialog
    .getByRole('button', {
      name: 'Show Disciplines and Questors as a list',
    })
    .click();
  await expect(
    dialog.getByRole('button', { name: 'Resize Name column' }),
  ).toBeVisible();
  await dialog
    .getByRole('button', {
      name: 'Show Disciplines and Questors as cards',
    })
    .click();
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await dialog.getByRole('button', { name: 'Close' }).click();

  await openEarthdawnCreator(page);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: /Gauntlet/ })).toBeVisible();
  await page.getByRole('button', { name: /Shaman/ }).click();
  await applyCreatorChange(page, 'Review Discipline change');
  await expect(page.getByText('Thread Weaving (Shamanism)')).toBeVisible();
  await expect(page.getByText('Alter Tracks')).toBeVisible();
});

test('opens isolated, ordered Basic Rules and Character Creation references', async ({
  page,
}) => {
  await seedEarthdawnCharacter(
    page,
    '97979797-9797-4979-8979-979797979797',
    'Rules Reader',
    createHighCircleMatrixFixture(),
  );

  const basicRulesButton = page.getByRole('button', { name: 'Basic Rules' });
  await basicRulesButton.click();
  const basicRules = page.getByRole('dialog', {
    name: 'Basic Rules reference',
  });
  await expect(
    basicRules.getByRole('searchbox', { name: 'Search Basic Rules' }),
  ).toBeFocused();
  await expect(basicRules.locator('details')).toHaveCount(10);
  await expect(basicRules.locator('summary strong')).toHaveText([
    '1. Resolve a Test',
    '2. Combat Procedure',
    '3. Karma',
    '4. Damage, Wounds, and Recovery',
    '5. Spellcasting Methods',
    '6. Thread Items',
    '7. Healing Aids',
    '8. Alchemy and Custom Enchanting',
    '9. Blood Charms',
    '10. Keep Play Moving',
  ]);
  await expect(basicRules.locator('details[open]')).toHaveCount(0);
  const firstRule = basicRules.locator('details').nth(0);
  const secondRule = basicRules.locator('details').nth(1);
  await firstRule.locator('summary').click();
  await secondRule.locator('summary').click();
  await expect(firstRule).toHaveAttribute('open', '');
  await expect(secondRule).toHaveAttribute('open', '');
  await basicRules.getByRole('searchbox').fill('Last Chance Salve');
  await expect(basicRules.locator('details')).toHaveCount(1);
  await expect(basicRules.getByText('7. Healing Aids')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(basicRulesButton).toBeFocused();

  const creationButton = page.getByRole('button', {
    name: 'Character Creation',
  });
  await creationButton.click();
  const creationRules = page.getByRole('dialog', {
    name: 'Character Creation reference',
  });
  await expect(creationRules.locator('details')).toHaveCount(10);
  await expect(creationRules.locator('summary strong')).toHaveText([
    '1. Choose a Discipline',
    '2. Choose a Race',
    '3. Generate Attributes',
    '4. Determine Characteristics',
    '5. Record Racial Abilities',
    '6. Assign Talent Ranks',
    '7. Choose Spells',
    '8. Assign Skill Ranks',
    '9. Equip the Character',
    '10. Finish the Character',
  ]);
  await creationRules.getByRole('searchbox').fill('25 Attribute Points');
  const attributeRule = creationRules.locator('details');
  await expect(attributeRule).toHaveCount(1);
  await attributeRule.locator('summary').click();
  await expect(attributeRule.getByText('+8')).toBeVisible();
  await creationRules.getByRole('button', { name: 'Close rules' }).click();
  await expect(creationButton).toBeFocused();
});

test('assigns every registered matrix-sharing combination through the UI', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const { character, expectedBloodMagicDamage } = createMatrixBrowserFixture();
  let confirmationCount = 0;
  page.on('dialog', async (dialog) => {
    if (/Blood Magic Damage/.test(dialog.message())) confirmationCount += 1;
    await dialog.accept();
  });

  await page.goto('/');
  await page.evaluate(async (characterData) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('arcane-ledger');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('characters', 'readwrite');
        transaction.objectStore('characters').put({
          id: '66666666-6666-4666-8666-666666666666',
          systemId: 'earthdawn4e',
          systemVersion: 14,
          name: 'Matrix Browser Coverage',
          createdAt: '2026-10-05T12:00:00.000Z',
          updatedAt: '2026-10-05T12:00:00.000Z',
          data: characterData,
        });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }, character);
  await page.reload();
  await page
    .getByRole('button', { name: 'Open Matrix Browser Coverage' })
    .click();
  await page
    .getByRole('heading', { name: 'Spells & Matrices' })
    .scrollIntoViewIfNeeded();

  for (const testCase of matrixBrowserCases) {
    const card = page.locator('.earthdawn-matrix-card').filter({
      has: page.getByText(`${testCase.id} Matrix`, { exact: true }),
    });
    const expectedCount = testCase.spellName
      ? testCase.forms.length
      : testCase.members.length;
    for (let index = 1; index < expectedCount; index += 1) {
      const picker = card.getByLabel('Add compatible spell');
      const value = await picker.locator('option').nth(1).getAttribute('value');
      expect(value, `compatible option for ${testCase.id}`).toBeTruthy();
      await picker.selectOption(value!);
      await expect(
        card.locator('.earthdawn-matrix-attuned-list li'),
      ).toHaveCount(index + 1);
    }
  }

  expect(confirmationCount).toBeGreaterThanOrEqual(10);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        return new Promise<{ bloodMagicDamage: number; filled: number }>(
          (resolve, reject) => {
            const request = indexedDB.open('arcane-ledger');
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const database = request.result;
              const transaction = database.transaction(
                'characters',
                'readonly',
              );
              const get = transaction
                .objectStore('characters')
                .get('66666666-6666-4666-8666-666666666666');
              get.onsuccess = () => {
                resolve({
                  bloodMagicDamage: get.result.data.health.bloodMagicDamage,
                  filled: get.result.data.magic.matrices.filter(
                    (matrix: { spellIds: string[] }) =>
                      matrix.spellIds.length > 1,
                  ).length,
                });
                database.close();
              };
              get.onerror = () => reject(get.error);
            };
          },
        );
      }),
    )
    .toEqual({
      bloodMagicDamage: expectedBloodMagicDamage,
      filled: matrixBrowserCases.length,
    });
});

test('creates an Earthdawn adept and exposes source and dice tools', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Earthdawn 4e' }).click();
  await page.getByRole('button', { name: 'Build Character' }).click();

  await expect(
    page.locator('.earthdawn-creator.character-creator'),
  ).toBeVisible();
  await expect(
    page.getByText(/Earthdawn creation · Step 1 of 8/),
  ).toBeVisible();
  const adeptPath = page.locator('.earthdawn-choice-grid button').first();
  await expect(
    adeptPath.evaluate((node) => ({
      direction: getComputedStyle(node).flexDirection,
      titleAlign: getComputedStyle(node.querySelector('strong')!).textAlign,
      summaryDisplay: getComputedStyle(node.querySelector('small')!).display,
    })),
  ).resolves.toEqual({
    direction: 'column',
    titleAlign: 'center',
    summaryDisplay: 'block',
  });
  await adeptPath.click();
  await page
    .getByRole('dialog', { name: 'Review character profile change' })
    .getByRole('button', { name: 'Apply change' })
    .click();
  await page.getByRole('button', { name: 'Next' }).click();
  const warrior = page.getByRole('button', { name: /Warrior/ });
  await expect(
    warrior.evaluate((node) => ({
      direction: getComputedStyle(node).flexDirection,
      titleAlign: getComputedStyle(node.querySelector('strong')!).textAlign,
      summaryDisplay: getComputedStyle(node.querySelector('small')!).display,
    })),
  ).resolves.toEqual({
    direction: 'column',
    titleAlign: 'center',
    summaryDisplay: 'block',
  });
  await warrior.click();
  await page
    .getByRole('dialog', { name: 'Review Discipline change' })
    .getByRole('button', { name: 'Apply change' })
    .click();
  await page.getByRole('button', { name: 'Next' }).click();
  const human = page.getByRole('button', { name: /Human/ });
  await human.click();
  await page
    .getByRole('dialog', { name: 'Review Race change' })
    .getByRole('button', { name: 'Apply change' })
    .click();
  await expect(human).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(
    page.getByRole('heading', { name: /Talent Options/ }),
  ).toBeVisible();
  const talentOption = page
    .locator('.earthdawn-compact-choice-grid button')
    .filter({ hasText: 'Acrobatic Defense' });
  await talentOption.click();
  await expect(talentOption).toHaveAttribute('aria-pressed', 'true');
  await expect(talentOption).toContainText('click to remove');
  await talentOption.click();
  await expect(talentOption).toHaveAttribute('aria-pressed', 'false');
  await talentOption.click();
  await page.getByLabel('Avoid Blow free ranks').fill('9');
  const budgetDialog = page.getByRole('dialog', {
    name: 'Creation budget exceeded',
  });
  await expect(budgetDialog).toContainText('over by 1');
  await budgetDialog
    .getByRole('button', { name: 'Return to allocations' })
    .click();
  await page.getByLabel('GM Override reason').fill('High-powered campaign');
  await page.getByRole('switch', { name: 'GM Override' }).check();
  const secondTalentOption = page
    .locator('.earthdawn-compact-choice-grid button')
    .filter({ hasText: 'Anticipate Blow' });
  await secondTalentOption.click();
  await expect(secondTalentOption).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Avoid Blow free ranks')).toHaveValue('9');
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
  const nextButtonHeight = await page
    .getByRole('button', { name: 'Next' })
    .evaluate((button) => button.getBoundingClientRect().height);
  expect(nextButtonHeight).toBeGreaterThanOrEqual(44);
});

test('offers persistent card and list views in the creator skill browser', async ({
  page,
}) => {
  await openEarthdawnCreator(page);
  for (let index = 0; index < 5; index += 1)
    await page.getByRole('button', { name: 'Next' }).click();

  await page.getByRole('button', { name: 'Add Specific Skill' }).click();
  let dialog = page.getByRole('dialog', { name: 'Add Specific Skill' });
  await dialog.getByRole('searchbox').fill('Awareness');
  const addAwareness = dialog.getByRole('button', { name: 'Add Awareness' });
  await expect(addAwareness).toHaveText('+');
  await addAwareness.click();
  const selectedAwareness = dialog.getByRole('button', {
    name: 'Awareness already added',
  });
  await expect(selectedAwareness).toBeDisabled();
  await expect(selectedAwareness).toHaveClass(/earthdawn-skill-add--selected/);
  await expect(
    selectedAwareness.evaluate((node) => ({
      background: getComputedStyle(node).backgroundColor,
      color: getComputedStyle(node).color,
      opacity: getComputedStyle(node).opacity,
    })),
  ).resolves.toMatchObject({ opacity: '1' });

  await dialog.getByRole('button', { name: 'Show skills as a list' }).click();
  await expect(dialog.getByRole('table')).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Resize Name column' }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Show details' }).click();
  await expect(dialog.locator('.earthdawn-catalog-list-details')).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Add Specific Skill' }).click();
  dialog = page.getByRole('dialog', { name: 'Add Specific Skill' });
  await expect(
    dialog.getByRole('button', { name: 'Show skills as a list' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
});

test('reduces Play attributes and presents Equipment wealth in silver', async ({
  page,
}) => {
  await openEarthdawnCreator(page);
  for (let index = 0; index < 7; index += 1)
    await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('name').fill('Silver Playtest');
  await page.getByRole('button', { name: 'Complete Character' }).click();

  const attributes = page.locator('#ed4-attributes');
  await expect(attributes.getByText('Race', { exact: true })).toHaveCount(0);
  await expect(attributes.getByText('Purchased', { exact: true })).toHaveCount(
    0,
  );
  await expect(attributes.getByText('Permanent', { exact: true })).toHaveCount(
    0,
  );
  await expect(
    attributes.getByText('Temporary', { exact: true }),
  ).toBeVisible();
  const temporaryDexterity = attributes.getByLabel(
    'Dexterity temporary modifier',
  );
  await temporaryDexterity.fill('2');
  await expect(temporaryDexterity).toHaveValue('2');

  const equipment = page.locator('#ed4-equipment');
  await expect(equipment.getByLabel('Denomination')).toHaveValue('sp');
  const balances = equipment.locator('.earthdawn-wallet__balances span');
  await expect(balances.nth(0)).toContainText('sp');
  await expect(equipment.getByText('100 sp', { exact: true })).toBeVisible();
  await equipment.getByLabel('Coin amount').fill('5');
  await equipment.getByLabel('Denomination').selectOption('cp');
  await equipment.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(
    equipment.getByText('100 sp 5 cp', { exact: true }),
  ).toBeVisible();
  await equipment.getByLabel('Coin amount').fill('6');
  await equipment.getByLabel('Denomination').selectOption('sp');
  await equipment.getByRole('button', { name: 'Spend', exact: true }).click();
  await expect(
    equipment.getByText('94 sp 5 cp', { exact: true }),
  ).toBeVisible();
  await equipment.getByLabel('Coin amount').fill('999');
  await equipment.getByRole('button', { name: 'Spend', exact: true }).click();
  await expect(equipment.getByRole('alert')).toContainText(
    'Available: 94 sp 5 cp',
  );

  await page
    .getByRole('switch', { name: /Earthdawn Edit and Play mode/ })
    .uncheck();
  await expect(attributes.getByText('Race', { exact: true })).toBeVisible();
  await expect(
    attributes.getByText('Purchased', { exact: true }),
  ).toBeVisible();
  await expect(
    attributes.getByText('Permanent', { exact: true }),
  ).toBeVisible();
});

test('playtests Warrior, Wizard, non-Adept Questor, and Windmaster creation through final sheets', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await openEarthdawnCreator(page);
  await expect(page.getByLabel('Creation budgets')).toContainText('Attributes');
  await expect(page.getByLabel('Creation budgets')).toContainText(
    'Silver budget',
  );
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Warrior/ }).click();
  await applyCreatorChange(page, 'Review Discipline change');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Human/ }).click();
  await applyCreatorChange(page, 'Review Race change');
  await finishCreatorFromRaceStep(page, 'Warrior Playtest');
  await expect(page.getByLabel('Discipline name')).toHaveValue('Warrior');
  await expect(page.getByText('Human', { exact: true }).first()).toBeVisible();

  await openEarthdawnCreator(page);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Wizard/ }).click();
  await applyCreatorChange(page, 'Review Discipline change');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Elf/ }).click();
  await applyCreatorChange(page, 'Review Race change');
  await finishCreatorFromRaceStep(page, 'Wizard Playtest');
  await expect(page.getByText('Grimoire', { exact: true })).toBeVisible();
  await expect(page.getByText(/Standard Matrix/).first()).toBeVisible();

  await openEarthdawnCreator(page);
  await page.getByRole('button', { name: /Non-Adept Questor/ }).click();
  await applyCreatorChange(page, 'Review character profile change');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Chorrolis/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Dwarf/ }).click();
  await applyCreatorChange(page, 'Review Race change');
  await finishCreatorFromRaceStep(page, 'Questor Playtest');
  await expect(page.getByLabel('passion', { exact: true })).toHaveValue(
    'Chorrolis',
  );
  await expect(page.getByText(/Standard Matrix/)).toHaveCount(0);

  await openEarthdawnCreator(page);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Warrior/ }).click();
  await applyCreatorChange(page, 'Review Discipline change');
  await page.getByLabel('Starting Circle').selectOption('5');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /^Windling / }).click();
  await applyCreatorChange(page, 'Review Race change');
  for (let index = 0; index < 4; index += 1)
    await page.getByRole('button', { name: 'Next' }).click();
  await page
    .getByLabel('GM Override reason')
    .fill('Windmaster playtest prerequisites approved');
  await page.getByRole('switch', { name: 'GM Override' }).check();
  for (let index = 0; index < 4; index += 1)
    await page.getByRole('button', { name: 'Previous' }).click();
  await page.getByRole('button', { name: /Windmaster/ }).click();
  for (let index = 0; index < 5; index += 1)
    await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('name').fill('Windmaster Playtest');
  await expect(
    page.getByText(/Windmaster Path initiation costs/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Complete Character' }).click();
  await expect(page.locator('.save-status')).toHaveText(
    'Saved in this browser',
  );
  await expect(
    page.getByText('Windmaster Path', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('Windmaster Path', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Windling', { exact: true }).first(),
  ).toBeVisible();
});

test('previews and applies all eight Race reconciliations without page overflow', async ({
  page,
}) => {
  await openEarthdawnCreator(page);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  for (const race of [
    'Dwarf',
    'Elf',
    'Human',
    'Obsidiman',
    'Ork',
    'Troll',
    'T’skrang',
    'Windling',
  ]) {
    const choice = page.getByRole('button', {
      name: new RegExp(`^${race.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} `),
    });
    await choice.click();
    const preview = page.getByRole('dialog', { name: 'Review Race change' });
    await expect(preview.getByRole('heading', { name: 'Added' })).toBeVisible();
    await expect(
      preview.getByRole('heading', { name: 'Removed' }),
    ).toBeVisible();
    await preview.getByRole('button', { name: 'Apply change' }).click();
    await expect(choice).toHaveAttribute('aria-pressed', 'true');
  }
  await page.setViewportSize({ width: 320, height: 760 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
});

test('keeps creator Equipment general-only and provides a resizable List view', async ({
  page,
}) => {
  await openEarthdawnCreator(page);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /^T’skrang / }).click();
  await applyCreatorChange(page, 'Review Race change');
  for (let index = 0; index < 4; index += 1)
    await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Browse Equipment' }).click();
  const catalog = page.getByRole('dialog', {
    name: 'Browse Equipment',
  });
  await expect(catalog.getByText('Starting Funds')).toBeVisible();
  await expect(catalog.getByText('Projected Remaining Funds')).toBeVisible();
  await expect(catalog.getByRole('button', { name: 'Weapons' })).toHaveCount(0);
  await catalog
    .getByRole('button', { name: 'Show equipment as a list' })
    .click();
  await expect(
    catalog.getByRole('columnheader', { name: /Name/ }),
  ).toBeVisible();
  const resizer = catalog.getByRole('button', { name: 'Resize Name column' });
  await resizer.focus();
  await resizer.press('ArrowRight');
  await expect(
    catalog.getByRole('button', { name: 'Reset columns' }),
  ).toBeVisible();
});

test('uses compact catalogs, reasoned GM override, and completes a partial character', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Earthdawn 4e' }).click();
  await page.getByRole('button', { name: 'Build Character' }).click();

  for (let index = 0; index < 5; index += 1)
    await page.getByRole('button', { name: 'Next' }).click();

  await page.getByRole('button', { name: 'Add Specific Skill' }).click();
  const skillDialog = page.getByRole('dialog', { name: 'Add Specific Skill' });
  await skillDialog.getByRole('button', { name: 'Artisan' }).click();
  await skillDialog.getByRole('searchbox').fill('Singing');
  await skillDialog
    .getByRole('article')
    .filter({ hasText: 'Singing' })
    .getByRole('button', { name: 'Add Singing' })
    .click();
  await skillDialog.getByRole('button', { name: 'Close' }).click();
  const selectedSkill = page.locator('.sheet-card').filter({
    has: page.locator('input[value="Singing"]'),
  });
  await expect(selectedSkill).toBeVisible();
  await expect(selectedSkill.locator('select').first()).toHaveValue('artisan');

  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Starting silver').fill('0');
  await page.getByRole('button', { name: 'Browse Equipment' }).click();
  const equipmentDialog = page.getByRole('dialog', {
    name: 'Browse Equipment',
  });
  await equipmentDialog.getByRole('searchbox').fill('Backpack');
  await equipmentDialog
    .getByRole('button', { name: 'Add Backpack', exact: true })
    .click();
  const overspend = page.getByRole('dialog', {
    name: 'Equipment budget exceeded',
  });
  await expect(overspend).toContainText('exceed starting funds');
  await overspend.getByRole('checkbox', { name: 'GM Override' }).check();
  await overspend.getByRole('button', { name: 'Add Anyway' }).click();
  await equipmentDialog.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText(/Starting funds are negative/)).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(
    page.getByRole('button', { name: 'Complete Character' }),
  ).toBeEnabled();
  await page.getByLabel('name').fill('Partial Adept');
  await page.getByRole('button', { name: 'Complete Character' }).click();
  await expect(
    page.getByRole('switch', { name: /Earthdawn Edit and Play mode/ }),
  ).toBeChecked();
  await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible();
  await expect(page.getByText('Adventurer’s Kit', { exact: true })).toHaveCount(
    1,
  );
  await expect(
    page.locator('#ed4-equipment .earthdawn-wallet-total strong'),
  ).toBeVisible();
  await expect(
    page.locator('#ed4-equipment .earthdawn-wallet-total strong'),
  ).toHaveText('0 sp');
  await expect(page.locator('.save-status')).toHaveText(
    'Saved in this browser',
    {
      timeout: 5000,
    },
  );
  await page.reload();
  await expect(page.getByText('Adventurer’s Kit', { exact: true })).toHaveCount(
    1,
  );
  await expect(
    page.locator('#ed4-equipment .earthdawn-wallet-total strong'),
  ).toBeVisible();
  await expect(
    page.locator('#ed4-equipment .earthdawn-wallet-total strong'),
  ).toHaveText('0 sp');
  await page
    .getByRole('switch', { name: /Earthdawn Edit and Play mode/ })
    .uncheck();
  await page.getByRole('button', { name: 'Settings' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reopen Character Builder' }).click();
  await expect(page.locator('.earthdawn-creator')).toBeVisible();
  await page.getByRole('button', { name: 'Close Settings' }).click();
  await page.getByRole('button', { name: 'Complete Character' }).click();
  await expect(page.getByText('Adventurer’s Kit', { exact: true })).toHaveCount(
    1,
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  const dashboardBounds = await page.evaluate(() => {
    const health = document
      .getElementById('ed4-health')!
      .getBoundingClientRect();
    const characteristics = document
      .getElementById('ed4-characteristics')!
      .getBoundingClientRect();
    return {
      health: { top: health.top, bottom: health.bottom },
      characteristics: {
        top: characteristics.top,
        bottom: characteristics.bottom,
      },
    };
  });
  expect(dashboardBounds.health.top).toBeCloseTo(
    dashboardBounds.characteristics.top,
    0,
  );
  expect(dashboardBounds.health.bottom).toBeCloseTo(
    dashboardBounds.characteristics.bottom,
    0,
  );
});

test('completes an entirely blank creator without inventing required fields', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Earthdawn 4e' }).click();
  await page.getByRole('button', { name: 'Build Character' }).click();
  for (let index = 0; index < 7; index += 1)
    await page.getByRole('button', { name: 'Next' }).click();
  const complete = page.getByRole('button', { name: 'Complete Character' });
  await expect(complete).toBeEnabled();
  await complete.click();
  await expect(
    page.getByRole('switch', { name: /Earthdawn Edit and Play mode/ }),
  ).toBeChecked();
  await expect(page.getByText('Untitled Earthdawn Adept')).toBeVisible();
});

test('blank Build sheet repairs catalog and custom editing at 320px', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Earthdawn 4e' }).click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();

  await expect(page.locator('main.local-sheet-editor-shell')).toBeVisible();
  await expect(page.locator('.local-character-sheet')).toBeVisible();
  await expectMageAlignedFieldGrid(
    page,
    '.earthdawn-field-grid.sheet-field-grid',
  );
  const sheetSurface = await page
    .locator('.earthdawn-character-sheet')
    .evaluate((node) => ({
      border: getComputedStyle(node).borderTopWidth,
      background: getComputedStyle(node).backgroundImage,
      shadow: getComputedStyle(node).boxShadow,
    }));
  expect(sheetSurface).toEqual({
    border: '0px',
    background: 'none',
    shadow: 'none',
  });
  await expect(
    page.getByRole('switch', { name: /Earthdawn Edit and Play mode/ }),
  ).not.toBeChecked();
  const browseCatalogs = page.getByRole('button', {
    name: 'Compendium',
  });
  await browseCatalogs.focus();
  await browseCatalogs.click();
  await expect(
    page.getByRole('dialog', { name: 'Earthdawn catalog' }),
  ).toBeVisible();
  await expect(
    page.getByRole('searchbox', { name: 'Search catalog' }),
  ).toBeFocused();
  const compendium = page.getByRole('dialog', { name: 'Earthdawn catalog' });
  await compendium.getByRole('button', { name: 'Clear all' }).click();
  await expect(
    compendium.getByText('Select one or more Catalog sections to browse.'),
  ).toBeVisible();
  await expect(compendium.getByLabel('Basic Rules')).toHaveCount(0);
  await expect(compendium.getByLabel('Character Creation')).toHaveCount(0);
  await compendium.getByLabel('Knacks').check();
  await compendium.getByRole('searchbox').fill('Assess Intentions');
  await expect(
    compendium
      .locator('.catalog-card')
      .filter({ hasText: 'Assess Intentions' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(browseCatalogs).toBeFocused();
  for (const [sectionId, buttonName] of [
    ['#ed4-talents', 'Browse Talents'],
    ['#ed4-skills', 'Browse Skills'],
    ['#ed4-skills', 'Browse Knacks'],
    ['#ed4-magic', 'Browse Spells'],
    ['#ed4-patterns', 'Browse Thread Items'],
    ['#ed4-equipment', 'Browse Equipment, Weapons & Armor'],
  ] as const) {
    const opener = page.locator(sectionId).getByRole('button', {
      name: buttonName,
      exact: true,
    });
    await opener.click();
    await expect(
      page.getByRole('dialog', { name: 'Earthdawn catalog' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
  }
  const browseKnacks = page
    .locator('#ed4-skills')
    .getByRole('button', { name: 'Browse Knacks' });
  await browseKnacks.click();
  const knackDialog = page.getByRole('dialog', {
    name: 'Earthdawn catalog',
  });
  await knackDialog.getByRole('searchbox').fill('Assess Intentions');
  const knackCard = knackDialog
    .locator('.catalog-card')
    .filter({ hasText: 'Assess Intentions' });
  await expect(knackCard).toBeVisible();
  await knackCard.getByText('2 source/association variants').click();
  await knackCard
    .getByLabel('Choose Assess Intentions variant')
    .selectOption({ index: 1 });
  await expect(knackCard.getByRole('button', { name: 'Add' })).toBeEnabled();
  await page.keyboard.press('Escape');
  const browseTalents = page
    .locator('#ed4-talents')
    .getByRole('button', { name: 'Browse Talents' });
  await browseTalents.click();
  const talentDialog = page.getByRole('dialog', { name: 'Earthdawn catalog' });
  await expect(
    talentDialog.getByRole('combobox', { name: 'Discipline', exact: true }),
  ).toBeVisible();
  await talentDialog
    .getByRole('combobox', { name: 'Discipline', exact: true })
    .selectOption('Warrior');
  await expect(
    talentDialog.getByRole('combobox', { name: 'Discipline talent type' }),
  ).toBeEnabled();
  await talentDialog
    .getByRole('combobox', { name: 'Discipline', exact: true })
    .selectOption('all');
  await talentDialog.getByRole('searchbox').fill('Acrobatic Defense');
  const talentCard = talentDialog
    .locator('.catalog-card')
    .filter({ hasText: 'Acrobatic Defense' });
  await expect(talentCard).toContainText('Dexterity');
  await expect(talentCard).toContainText('Simple');
  await expect(talentCard).toContainText('Strain');
  await talentCard.getByRole('button', { name: 'Add' }).click();
  await expect(talentDialog).toBeVisible();
  await expect(
    talentCard.getByRole('button', { name: 'Selected' }),
  ).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(
    page
      .locator('#ed4-talents .earthdawn-talent-row')
      .filter({ hasText: 'Acrobatic Defense' }),
  ).toBeVisible();
  await expect(
    page
      .locator('#ed4-skills')
      .getByRole('button', { name: 'Add Custom Skill' }),
  ).toHaveCount(0);
  await page
    .locator('#ed4-skills')
    .getByRole('button', { name: 'Browse Skills' })
    .click();
  await page
    .getByRole('dialog', { name: 'Earthdawn catalog' })
    .getByRole('button', { name: 'Show catalog as a list' })
    .click();
  const skillDialog = page.getByRole('dialog', {
    name: 'Earthdawn catalog',
  });
  await expect(skillDialog.locator('.earthdawn-catalog-table')).toBeVisible();
  await expect(
    skillDialog.getByRole('columnheader', { name: /Category/ }),
  ).toBeVisible();
  await expect(
    skillDialog.getByRole('columnheader', { name: /Attribute/ }),
  ).toBeVisible();
  await expect(
    skillDialog.getByRole('combobox', { name: 'Sort skills' }),
  ).toHaveCount(0);
  await page
    .getByRole('dialog', { name: 'Earthdawn catalog' })
    .getByRole('button', { name: 'Add custom skill' })
    .click();
  await page.keyboard.press('Escape');
  const customSkillName = page
    .locator('#ed4-skills')
    .getByLabel('Record name')
    .last();
  await customSkillName.fill('Barsaive Lore');
  await expect(customSkillName).toHaveValue('Barsaive Lore');
  const identity = page.locator('#ed4-identity');
  const addRace = identity.getByRole('button', { name: 'Add Race' });
  await expect(addRace).toHaveClass(/primary-button/);
  await expect(
    identity.getByRole('button', { name: 'Add Discipline & Questor' }),
  ).toHaveClass(/primary-button/);
  await addRace.click();
  let raceDialog = page.getByRole('dialog', { name: 'Earthdawn catalog' });
  await raceDialog
    .getByRole('article')
    .filter({ hasText: 'Windling' })
    .getByRole('button', { name: 'Select Race' })
    .click();
  await expect(identity.getByText(/Movement 6 \/ 16 flying/)).toBeVisible();
  page.once('dialog', (dialog) => dialog.dismiss());
  await identity.getByRole('button', { name: 'Change Race' }).click();
  raceDialog = page.getByRole('dialog', { name: 'Earthdawn catalog' });
  await raceDialog
    .getByRole('article')
    .filter({ hasText: 'Human' })
    .getByRole('button', { name: 'Change to this Race' })
    .click();
  await raceDialog.getByRole('button', { name: 'Close' }).click();
  await expect(identity.getByText('Windling', { exact: true })).toBeVisible();
  const equipment = page.locator('#ed4-equipment');
  await equipment.getByLabel('Coin amount').fill('1');
  await equipment.getByLabel('Denomination').selectOption('gp');
  await equipment.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(
    equipment.getByText('11', { exact: true }).first(),
  ).toBeVisible();
  await page
    .locator('#ed4-patterns')
    .getByRole('button', { name: 'Add magic effect' })
    .click();
  const magicEffect = page.locator('#ed4-patterns .sheet-card').last();
  await magicEffect.getByLabel('name').fill('Test effect');
  const physicalDefense = page
    .locator('#ed4-characteristics .earthdawn-adjusted-stat')
    .filter({ hasText: 'Physical Defense' });
  const physicalDefenseBefore = Number(
    await physicalDefense.locator('summary strong').textContent(),
  );
  await magicEffect.getByLabel('Target').selectOption('physicalDefense');
  await magicEffect.getByLabel('Bonus / Penalty').fill('2');
  await expect(physicalDefense.locator('summary strong')).toHaveText(
    String(physicalDefenseBefore + 2),
  );
  await magicEffect.getByText('Effect active').click();
  await expect(physicalDefense.locator('summary strong')).toHaveText(
    String(physicalDefenseBefore),
  );
  await magicEffect
    .getByRole('button', { name: 'Remove magic effect' })
    .click();
  await page
    .getByRole('dialog', { name: 'Review record removal' })
    .getByRole('button', { name: 'Confirm removal' })
    .click();
  await expect(
    page
      .locator('#ed4-patterns')
      .getByRole('button', { name: 'Remove magic effect' }),
  ).toHaveCount(0);
  const health = page.locator('#ed4-health');
  await expect(
    health.getByRole('switch', { name: /Basic play mode/ }),
  ).toHaveCount(0);
  await expect(health.getByText('Recovery', { exact: true })).toBeVisible();
  await expect(health.getByText('Combat & Roller')).toBeVisible();
  const characteristics = page.locator('#ed4-characteristics');
  await characteristics.getByLabel('Damage amount').fill('3');
  await characteristics.getByRole('button', { name: 'Take Damage' }).click();
  await expect(
    characteristics.getByText('3', { exact: true }).first(),
  ).toBeVisible();
  await characteristics.getByRole('button', { name: 'Add one wound' }).click();
  await expect(
    characteristics.getByText('1', { exact: true }).first(),
  ).toBeVisible();
  await characteristics
    .getByRole('button', { name: 'Remove one wound' })
    .click();
  await characteristics.getByRole('button', { name: 'Heal Damage' }).click();
  await expect(
    characteristics.getByText('0', { exact: true }).first(),
  ).toBeVisible();
  const unconsciousness = Number(
    await characteristics
      .locator('.earthdawn-health-ratings div')
      .filter({ hasText: 'Unconsciousness' })
      .locator('dd')
      .textContent(),
  );
  await characteristics
    .getByLabel('Damage amount')
    .fill(String(unconsciousness));
  await characteristics.getByRole('button', { name: 'Take Damage' }).click();
  await expect(characteristics.getByText('😵 Unconscious')).toBeVisible();
  await characteristics.getByRole('button', { name: 'Heal Damage' }).click();
  await characteristics.getByLabel('Damage amount').fill('999');
  await characteristics.getByRole('button', { name: 'Take Damage' }).click();
  await expect(characteristics.getByText('💀 Dead')).toBeVisible();
  await page.getByRole('button', { name: 'Add Discipline & Questor' }).click();
  const pathDialog = page.getByRole('dialog', {
    name: 'Add Discipline and Questor',
  });
  await pathDialog.getByRole('searchbox').fill('Warrior');
  await pathDialog
    .locator('.catalog-card')
    .filter({ hasText: 'Warrior' })
    .getByRole('button', { name: 'Add Discipline' })
    .click();
  await pathDialog.getByRole('button', { name: 'Close' }).click();
  await page.getByLabel('Warrior Circle').fill('2');
  await expect(page.getByText('Review Circle 1 → 2')).toBeVisible();
  await expect(
    page.getByText(/required talent\(s\) will be added/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click({ force: true });
  await expect(page.getByLabel('Warrior Circle')).toHaveValue('1');
  await page.getByLabel('Legend Points').fill('1000');
  await page.getByLabel('Reason').fill('First adventure');
  await page.getByRole('button', { name: 'Add LP' }).click();
  await page
    .getByRole('switch', { name: /Earthdawn Edit and Play mode/ })
    .check();
  await page.getByRole('button', { name: '+1' }).first().click();
  await expect(page.getByText(/Increase Dexterity to/)).toBeVisible();
  await expect(page.getByText(/dedicated training days/)).toBeVisible();
  await page.getByRole('button', { name: 'Confirm purchase' }).click();
  await expect(page.getByText('200 current LP')).toBeVisible();
  const avoidBlowTalent = page
    .locator('#ed4-talents .earthdawn-talent-row')
    .filter({ hasText: 'Avoid Blow' });
  await avoidBlowTalent.getByRole('button', { name: 'Advance' }).click();
  await expect(page.getByText(/Advance Avoid Blow to rank/)).toBeVisible();
  await expect(page.getByText(/Legend Point balance:/)).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Browse Spells' }).click();
  const spellDialog = page.getByRole('dialog', {
    name: 'Earthdawn catalog',
  });
  await expect(
    spellDialog.getByRole('combobox', { name: 'Sort spells' }),
  ).toHaveValue('discipline-circle');
  await spellDialog.getByRole('searchbox').fill('Air Armor');
  const airArmorCard = spellDialog
    .locator('.catalog-card')
    .filter({ hasText: 'Air Armor' });
  await expect(airArmorCard).toContainText('Weaving:');
  await airArmorCard.getByText(/available source variant/).click();
  await expect(
    airArmorCard.getByRole('combobox', { name: 'Choose Air Armor variant' }),
  ).toContainText('Elementalist · Circle 1');
  await spellDialog
    .getByRole('button', { name: 'Add variant', exact: true })
    .click();
  await expect(page.getByText(/Learn Air Armor/)).toBeVisible();
  await page
    .getByRole('button', { name: 'Confirm purchase' })
    .click({ force: true });
  await expect(page.getByText('100 current LP')).toBeVisible();
  await page.getByRole('button', { name: 'Refund' }).first().click();
  await expect(page.getByText('200 current LP')).toBeVisible();
  const overflow = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth > window.innerWidth,
    offenders: [...document.querySelectorAll<HTMLElement>('body *')]
      .filter(
        (element) =>
          element.getBoundingClientRect().right > window.innerWidth + 1,
      )
      .slice(0, 10)
      .map((element) => `${element.tagName}.${element.className}`),
  }));
  expect(overflow).toEqual({ page: false, offenders: [] });
});
