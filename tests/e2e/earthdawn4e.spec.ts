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
  await page.locator('.earthdawn-choice-grid button').first().click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Warrior/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  const human = page.getByRole('button', { name: /Human/ });
  await human.click();
  await expect(human).toHaveAttribute('aria-pressed', 'true');
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
    ['#ed4-talents', 'Browse catalog'],
    ['#ed4-skills', 'Browse catalog'],
    ['#ed4-skills', 'Browse Knacks'],
    ['#ed4-magic', 'Browse Spells'],
    ['#ed4-patterns', 'Browse Thread Items'],
    ['#ed4-equipment', 'Browse Equipment'],
    ['#ed4-equipment', 'Browse Weapons'],
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
  await page.getByLabel('Add a Discipline').selectOption({ label: 'Warrior' });
  await page.getByLabel('Warrior Circle').fill('2');
  await expect(page.getByText('Review Circle 1 → 2')).toBeVisible();
  await expect(
    page.getByText(/required talent\(s\) will be added/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByLabel('Warrior Circle')).toHaveValue('1');
  await page.getByLabel('Legend award / correction').fill('1000');
  await page.getByLabel('Reason').fill('First adventure');
  await page.getByRole('button', { name: 'Record transaction' }).click();
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
  await spellDialog.getByRole('button', { name: 'Add' }).first().click();
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
