import { expect, test } from '@playwright/test';
import { expectMageAlignedFieldGrid } from './support/sheet-alignment';

test('City source controls reveal supplement themes and retain them when disabled', async ({
  page,
}) => {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose City of Mist', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Choose Character sheet', exact: true })
    .click();
  await page.getByRole('button', { name: 'Choose Rift', exact: true }).click();
  await page.getByRole('button', { name: /Settings/ }).click();
  await page.getByRole('checkbox', { name: /Shadows & Showdowns/ }).check();
  await page.getByRole('button', { name: 'Close Settings' }).click();
  await page.getByText('Browse themebooks', { exact: true }).click();
  await page.getByLabel('Search themebooks').fill('Conjuration');
  await page
    .getByRole('button', { name: 'Add Conjuration', exact: true })
    .click();
  await expect(page.getByText(/Conjuration · mythos · standard/)).toBeVisible();
  await page.getByRole('button', { name: /Settings/ }).click();
  await page.getByRole('checkbox', { name: /Shadows & Showdowns/ }).uncheck();
  await page.getByRole('button', { name: 'Close Settings' }).click();
  await expect(
    page.getByText(/Source disabled; existing theme retained/),
  ).toBeVisible();
});

test('City sheet uses shared Arcane Record cards and Play-safe marks', async ({
  page,
}) => {
  await page.goto('/create');
  await page.getByRole('button', { name: 'Choose City of Mist' }).click();
  await page.getByRole('button', { name: 'Choose Character sheet' }).click();
  await page.getByRole('button', { name: 'Choose Rift' }).click();
  await expect(page.locator('.city-creator.character-creator')).toBeVisible();
  await expect(page.locator('.local-character-sheet')).toBeVisible();
  await expect(
    page.locator('.local-identity-grid.sheet-field-grid'),
  ).toBeVisible();
  await expect(page.locator('.local-identity-grid textarea')).toHaveCount(0);
  await expectMageAlignedFieldGrid(page, '.local-identity-grid');
  await page.getByText('Browse themebooks', { exact: true }).click();
  for (const name of ['Adaptation', 'Bastion', 'Defining Event', 'Mission']) {
    await page.getByLabel('Search themebooks').fill(name);
    await page.getByRole('button', { name: `Add ${name}` }).click();
  }
  await expect(page.locator('.city-theme-card--primary')).toHaveCount(4);
  const columns = await page
    .locator('.city-theme-card-grid')
    .evaluate(
      (node) => getComputedStyle(node).gridTemplateColumns.split(' ').length,
    );
  expect(columns).toBe(2);
  await page.getByRole('switch', { name: 'Play mode' }).check();
  await expect(page.getByLabel('Player')).toHaveAttribute('readonly', '');
  await page.setViewportSize({ width: 320, height: 800 });
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('Curseborne optional catalog requires source and Storyguide approval', async ({
  page,
}) => {
  await page.goto('/create/curseborne');
  await page.getByRole('button', { name: /Create Character/ }).click();
  await page.getByRole('button', { name: /Settings/ }).click();
  await expect(page.locator('.reviewed-build.character-creator')).toBeVisible();
  await page.getByRole('checkbox', { name: /Accursed Adventures/ }).check();
  await page.getByRole('button', { name: 'Close Settings' }).click();
  await page
    .getByText('Browse verified source references', { exact: true })
    .click();
  await page.getByLabel('Search Curseborne references').fill('Witness Lens');
  const add = page.getByRole('button', {
    name: 'Add Witness Lens',
    exact: true,
  });
  await expect(add).toBeDisabled();
  await page.getByLabel('Storyguide approved acquisition').check();
  await add.click();
  await expect(page.getByText(/Witness Lens · carried/)).toBeVisible();
});

test('Curseborne sheet uses shared Arcane Record cards and protects permanent fields in Play', async ({
  page,
}) => {
  await page.goto('/create/curseborne');
  await page.getByRole('button', { name: /Create Character/ }).click();
  await expect(page.locator('.local-character-sheet')).toBeVisible();
  await expect(
    page.locator('.local-identity-grid.sheet-field-grid'),
  ).toBeVisible();
  await expect(page.locator('#curse-connections-heading')).toBeVisible();
  await expect(page.locator('#curse-gear-heading')).toBeVisible();
  await expect(page.locator('#curse-spells-heading')).toBeVisible();

  await page.getByRole('button', { name: 'Add Contact' }).click();
  await page.getByText(/New contact · 0/).click();
  await page.getByLabel('Name').last().fill('Mara Vale');
  await page.getByRole('button', { name: 'Add Gear' }).click();
  await page.getByText(/New gear · carried/).click();
  await page.getByLabel('Item').fill('Silver thread');
  await page.getByRole('button', { name: 'Add Spell' }).click();
  await page.getByText(/New spell · cost — · ready/).click();
  await page.getByLabel('Spell', { exact: true }).fill('Quiet the Grave');

  await page.getByRole('switch', { name: 'Play mode' }).check();
  await expect(page.getByLabel('Item')).toHaveAttribute('readonly', '');
  await page.getByLabel('State').first().selectOption('equipped');
  await page.getByRole('button', { name: 'Set injuries to 1' }).click();
  await expect(
    page.getByRole('button', { name: 'Set injuries to 1' }),
  ).toHaveAttribute('aria-pressed', 'true');

  await page.setViewportSize({ width: 320, height: 800 });
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
