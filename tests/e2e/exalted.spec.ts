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
  expect(reorderedSections.slice(0, 3)).toEqual([
    'exalted-attributes',
    'exalted-abilities',
    'exalted-identity',
  ]);

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
  ).toHaveAttribute('id', 'exalted-attributes');

  await page.getByRole('button', { name: /Character library/ }).click();
  await chooseExalted(page);
  await page.getByRole('button', { name: 'Choose Dragon-Blooded' }).click();
  await expect(page.getByLabel('Aspect', { exact: true })).toBeVisible();
  await expect(page.getByLabel('House', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Air' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wood' })).toBeVisible();
  await expect(page.getByLabel('Caste', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Limit Break', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Charms & Sorcery' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Browse charms catalog' }).click();
  await page
    .getByRole('searchbox', { name: 'Search' })
    .fill('Terrestrial Circle Sorcery');
  const sorceryCharm = page
    .locator('.exalted-power-card')
    .filter({ hasText: 'Terrestrial Circle Sorcery' });
  await sorceryCharm.getByRole('button', { name: 'Add charm' }).click();
  await page.getByRole('tab', { name: 'Sorcery (0)' }).click();
  await page
    .getByRole('searchbox', { name: 'Search' })
    .fill("Assassin's Fatal Touch");
  const spell = page
    .locator('.exalted-power-card')
    .filter({ hasText: "Assassin's Fatal Touch" });
  await spell.getByRole('button', { name: 'Add spell' }).click();
  await expect(page.getByRole('tab', { name: 'Sorcery (1)' })).toBeVisible();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();
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
