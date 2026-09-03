import { expect, test } from '@playwright/test';

test('selects, rates, persists, removes, and restores Backgrounds', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Mage 20' }).click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Background Adept');

  const section = page.locator('section', {
    has: page.getByRole('heading', { name: 'Backgrounds', exact: true }),
  });
  await section.getByRole('button', { name: 'Open catalog' }).click();
  const search = section.getByRole('searchbox', {
    name: 'Search Backgrounds',
  });

  await search.fill('Resources');
  await section
    .getByRole('button', { name: 'Preview description for Resources' })
    .click();
  await expect(section.getByRole('tooltip')).toContainText('Financial assets');
  await page.keyboard.press('Escape');
  await section
    .getByRole('button', { name: 'Expand description for Resources' })
    .click();
  await expect(section.getByText('Mage 20, p. 322')).toBeVisible();
  const resourcesResult = section.locator('.background-catalog-card', {
    has: page.getByRole('heading', { name: 'Resources', exact: true }),
  });
  await resourcesResult
    .getByRole('button', { name: 'Add', exact: true })
    .click();

  const resources = section.locator('.selected-background', {
    hasText: 'Mage 20, p. 322',
  });
  await resources.getByRole('button', { name: 'Set Resources to 3' }).click();
  await expect(section.locator('.background-summary > summary')).toContainText(
    'Backgrounds 3/7 · 4 remaining',
  );

  await search.fill('Enhancement');
  await section.getByRole('button', { name: 'Add', exact: true }).click();
  const enhancement = section.locator('.selected-background', {
    has: page.getByRole('heading', { name: 'Enhancement', exact: true }),
  });
  await enhancement
    .getByRole('button', { name: 'Set Enhancement to 2' })
    .click();
  await expect(section.locator('.background-summary > summary')).toContainText(
    'Backgrounds 7/7 · 0 remaining',
  );
  await expect(enhancement.getByText('Creation cost: 4 points')).toBeVisible();

  await search.fill('Totem');
  await section.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(section.locator('.background-summary > summary')).toContainText(
    'Backgrounds 9/7 · 2 over',
  );
  await expect(
    section.getByText(/This character has spent 9 Background points/),
  ).toBeVisible();

  await resources.getByLabel('Character label').fill('Investment Portfolio');
  await resources
    .getByLabel('Character notes')
    .fill('Diversified holdings and property.');

  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();

  const reloadedSection = page.locator('section', {
    has: page.getByRole('heading', { name: 'Backgrounds', exact: true }),
  });
  await expect(
    reloadedSection.getByRole('heading', { name: 'Investment Portfolio' }),
  ).toBeVisible();
  await expect(
    reloadedSection.locator('.background-summary > summary'),
  ).toContainText('Backgrounds 9/7 · 2 over');

  const reloadedResources = reloadedSection.locator('.selected-background', {
    hasText: 'Reference Background: Resources',
  });
  await reloadedResources
    .getByRole('button', { name: 'Expand selected Investment Portfolio' })
    .click();
  await expect(reloadedResources.getByLabel('Character notes')).toHaveValue(
    'Diversified holdings and property.',
  );

  const totem = reloadedSection.locator('.selected-background', {
    has: page.getByRole('heading', { name: 'Totem', exact: true }),
  });
  await totem.getByRole('button', { name: 'Remove' }).click();
  await expect(
    reloadedSection.locator('.background-summary > summary'),
  ).toContainText('Backgrounds 7/7 · 0 remaining');
  await reloadedSection
    .getByRole('button', { name: 'Undo last Background change' })
    .click();
  await expect(
    reloadedSection.getByRole('heading', { name: 'Totem', exact: true }),
  ).toBeVisible();
  await expect(
    reloadedSection.locator('.background-summary > summary'),
  ).toContainText('Backgrounds 9/7 · 2 over');
});
