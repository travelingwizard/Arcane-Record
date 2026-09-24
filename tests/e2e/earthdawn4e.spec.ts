import { expect, test } from '@playwright/test';
import { expectMageAlignedFieldGrid } from './support/sheet-alignment';

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
  await page.getByRole('button', { name: 'Next' }).click();
  const human = page.getByRole('button', { name: /Human/ });
  await human.click();
  await expect(human).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(
    page.getByRole('heading', { name: /Talent Options/ }),
  ).toBeVisible();
  const talentOption = page.getByRole('button', {
    name: 'Acrobatic Defense',
    exact: true,
  });
  await talentOption.click();
  await expect(talentOption).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('GM Override reason').fill('High-powered campaign');
  await page.getByRole('switch', { name: 'GM Override' }).check();
  const secondTalentOption = page.getByRole('button', {
    name: 'Anticipate Blow',
    exact: true,
  });
  await secondTalentOption.click();
  await expect(secondTalentOption).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Avoid Blow free ranks').fill('5');
  await expect(page.getByLabel('Avoid Blow free ranks')).toHaveValue('5');
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
    .getByRole('button', { name: 'Add' })
    .click();
  await skillDialog.getByRole('button', { name: 'Close' }).click();
  const selectedSkill = page.locator('.sheet-card').filter({
    has: page.locator('input[value="Singing"]'),
  });
  await expect(selectedSkill).toBeVisible();
  await expect(selectedSkill.locator('select').first()).toHaveValue('artisan');

  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Starting silver').fill('0');
  await page
    .getByRole('button', { name: 'Browse Equipment and Weapons' })
    .click();
  const equipmentDialog = page.getByRole('dialog', {
    name: 'Browse Equipment and Weapons',
  });
  await equipmentDialog.getByRole('button', { name: 'Weapons' }).click();
  await equipmentDialog.getByRole('searchbox').fill('Broadsword');
  await equipmentDialog
    .getByRole('article')
    .filter({ hasText: 'Broadsword' })
    .getByRole('button', { name: 'Add' })
    .click();
  await equipmentDialog.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText(/Starting funds are negative/)).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(
    page.getByRole('button', { name: 'Complete Character' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Previous' }).click();
  await page.getByLabel('GM Override reason').fill('Approved starting debt');
  await page.getByRole('switch', { name: 'GM Override' }).check();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('name').fill('Partial Adept');
  await page.getByRole('button', { name: 'Complete Character' }).click();
  await expect(
    page.getByRole('switch', { name: /Earthdawn Edit and Play mode/ }),
  ).toBeChecked();
  await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible();
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
    name: 'Browse catalogs',
  });
  await browseCatalogs.focus();
  await browseCatalogs.click();
  await expect(
    page.getByRole('dialog', { name: 'Earthdawn catalog' }),
  ).toBeVisible();
  await expect(
    page.getByRole('searchbox', { name: 'Search catalog' }),
  ).toBeFocused();
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
  const browseTalents = page
    .locator('#ed4-talents')
    .getByRole('button', { name: 'Browse Talents' });
  await browseTalents.click();
  const talentDialog = page.getByRole('dialog', { name: 'Earthdawn catalog' });
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
    page.locator('#ed4-talents .earthdawn-talent-row').filter({
      has: page.locator('input[value="Acrobatic Defense"]'),
    }),
  ).toBeVisible();
  await page
    .locator('#ed4-skills')
    .getByRole('button', { name: 'Add Custom Skill' })
    .click();
  const customSkillName = page
    .locator('#ed4-skills')
    .getByLabel('Record name')
    .last();
  await customSkillName.fill('Barsaive Lore');
  await expect(customSkillName).toHaveValue('Barsaive Lore');
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
  await page.getByRole('button', { name: 'Cancel' }).click();
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
  await page.getByRole('button', { name: 'Browse Spells' }).click();
  const spellDialog = page.getByRole('dialog', {
    name: 'Earthdawn catalog',
  });
  await spellDialog
    .getByRole('button', { name: 'Add', exact: true })
    .first()
    .click();
  await expect(page.getByText(/Learn Air Armor/)).toBeVisible();
  await page.getByRole('button', { name: 'Confirm purchase' }).click();
  await expect(page.getByText('100 current LP')).toBeVisible();
  await page.getByRole('button', { name: 'Refund' }).first().click();
  await expect(page.getByText('200 current LP')).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
