import { expect, test, type Page } from '@playwright/test';

async function chooseExalted(page: Page) {
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Exalted 1e' }).click();
}

test('creates and persists Solar and Dragon-Blooded foundation sheets', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto('/');
  await chooseExalted(page);
  await expect(
    page.getByRole('heading', { name: 'Solar Exalted' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Dragon-Blooded' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Choose Solar' }).click();
  await expect(page).toHaveURL(/\/characters\//);
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  const navigation = page.getByRole('navigation', {
    name: 'Character sheet sections',
  });
  await expect(navigation).toBeVisible();
  await expect(
    navigation.getByRole('button', { name: 'Move Character later' }),
  ).toHaveCount(0);
  await page.getByLabel('Name', { exact: true }).fill('Tepet Sun-at-Dawn');
  await page.getByLabel('Caste', { exact: true }).fill('Dawn');
  await page.getByRole('button', { name: 'Set Strength to 3' }).click();
  await page.getByRole('button', { name: 'Set Archery to 2' }).click();
  await page.getByRole('button', { name: 'Mark Archery as favored' }).click();
  await page
    .getByRole('combobox', { name: 'Background' })
    .selectOption('artifact');
  await page.getByRole('button', { name: 'Add Background' }).click();
  await page.getByRole('button', { name: 'Set Artifact to 3' }).click();
  await navigation.getByRole('button', { name: 'Edit section order' }).click();
  await navigation
    .getByRole('button', { name: 'Move Character later' })
    .click();
  await expect(
    page.getByText('Unsaved changes', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();

  const reorderedSections = await page
    .locator('.exalted-character-sheet > section')
    .evaluateAll((sections) => sections.map((section) => section.id));
  expect(reorderedSections[0]).toBe('exalted-advantages');

  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Tepet Sun-at-Dawn',
  );
  await expect(
    page.getByRole('group', { name: 'Strength: 3 out of 5' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Clear Archery as favored' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('group', { name: 'Artifact: 3 out of 5' }),
  ).toBeVisible();
  await expect(
    page.locator('.exalted-character-sheet > section').first(),
  ).toHaveAttribute('id', 'exalted-advantages');

  await page.getByRole('button', { name: /Character library/ }).click();
  await chooseExalted(page);
  await page.getByRole('button', { name: 'Choose Dragon-Blooded' }).click();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(page.getByLabel('Aspect', { exact: true })).toBeVisible();
  await expect(page.getByLabel('House', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Air' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wood' })).toBeVisible();
  await expect(page.getByLabel('Caste', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Limit Break', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Charms & Sorcery' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Merits & Flaws' }),
  ).toBeVisible();
  const originalViewport = page.viewportSize();
  await page.setViewportSize({ width: 1100, height: 800 });
  const willpowerDimensions = await page
    .locator('.exalted-willpower-card')
    .evaluate((card) => ({
      clientWidth: card.clientWidth,
      scrollWidth: card.scrollWidth,
    }));
  expect(willpowerDimensions.scrollWidth).toBeLessThanOrEqual(
    willpowerDimensions.clientWidth,
  );
  if (originalViewport) await page.setViewportSize(originalViewport);
  await expect(
    page.getByRole('button', { name: 'Expand Merits & Flaws' }),
  ).toHaveAttribute('aria-expanded', 'false');
  await expect(
    page.getByRole('searchbox', { name: 'Search Merits and Flaws' }),
  ).toBeHidden();
  await page.getByRole('button', { name: 'Expand Merits & Flaws' }).click();
  await page.getByRole('button', { name: 'Browse Merits & Flaws' }).click();
  await expect(
    page.getByRole('searchbox', { name: 'Search Merits and Flaws' }),
  ).toBeVisible();
  await page
    .getByRole('searchbox', { name: 'Search Merits and Flaws' })
    .fill('Prodigy');
  await page.getByLabel('Prodigy chosen cost').selectOption('5');
  await page.getByLabel('Prodigy choice or label').fill('Occult');
  await page.getByRole('button', { name: 'Add Merit' }).click();
  await expect(page.getByText('Merit points: 5')).toBeVisible();
  await expect(page.getByText('Prodigy — Occult')).toBeVisible();
  await page.getByRole('button', { name: 'Browse charms catalog' }).click();
  await page
    .locator('#dragon-blooded-power-catalog')
    .getByRole('searchbox', { name: 'Search', exact: true })
    .fill('Terrestrial Circle Sorcery');
  const sorceryCharm = page
    .locator('.exalted-power-card')
    .filter({ hasText: 'Terrestrial Circle Sorcery' });
  await sorceryCharm
    .getByRole('button', { name: 'Add Without Spending XP' })
    .click();
  await page
    .getByRole('combobox', { name: 'Catalog definition' })
    .selectOption('reaver-daiklave');
  await page
    .getByRole('textbox', { name: 'Custom name' })
    .fill('Kiss of Thunder');
  await page.getByRole('button', { name: 'Add Weapon' }).click();
  await page.getByRole('radio', { name: 'Power Combat' }).check();
  const reaverAttack = page
    .locator('.exalted-attack-list article')
    .filter({ hasText: 'Kiss of Thunder' });
  await expect(reaverAttack).toContainText('Speed');
  await expect(reaverAttack).toContainText('+7');
  await page
    .locator('#exalted-combos')
    .getByRole('button', { name: 'Add', exact: true })
    .click();
  await expect(
    page.locator('#exalted-combos .exalted-combo-analysis'),
  ).toContainText('Terrestrial Circle Sorcery cannot be included in a Combo.');
  await page
    .getByRole('textbox', { name: 'Combo name' })
    .fill('Forbidden Working');
  await page.getByRole('button', { name: 'Save Combo' }).click();
  await expect(
    page.getByRole('heading', { name: 'Forbidden Working' }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Sorcery (0)' }).click();
  await page
    .locator('#dragon-blooded-power-catalog')
    .getByRole('searchbox', { name: 'Search', exact: true })
    .fill("Assassin's Fatal Touch");
  const spell = page
    .locator('.exalted-power-card')
    .filter({ hasText: "Assassin's Fatal Touch" });
  await spell.getByRole('button', { name: 'Add Without Spending XP' }).click();
  await expect(page.getByRole('tab', { name: 'Sorcery (1)' })).toBeVisible();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText('Prodigy — Occult')).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Power Combat' })).toBeChecked();
  await expect(
    page
      .locator('#exalted-equipment')
      .getByRole('heading', { name: 'Kiss of Thunder' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Forbidden Working' }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Sorcery (1)' }).click();
  await expect(
    page.getByRole('heading', { name: "Assassin's Fatal Touch" }),
  ).toBeVisible();

  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByRole('button', { name: /^Sections / }).click();
  const mobileSections = page.getByRole('dialog', {
    name: 'Character Sections',
  });
  await mobileSections
    .getByRole('button', { name: 'Edit section order' })
    .click();
  await expect(
    mobileSections.getByRole('button', { name: 'Move Character later' }),
  ).toBeVisible();
  await mobileSections
    .getByRole('button', { name: 'Close Character Sections' })
    .click();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  expect(browserErrors).toEqual([]);
});
