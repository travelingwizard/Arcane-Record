import { expect, test } from '@playwright/test';

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

test('Curseborne optional catalog requires source and Storyguide approval', async ({
  page,
}) => {
  await page.goto('/create/curseborne');
  await page.getByRole('button', { name: /Create Character/ }).click();
  await page.getByRole('button', { name: /Settings/ }).click();
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
  await expect(page.getByText(/Witness Lens · equipment · 1/)).toBeVisible();
  await expect(
    page.getByText(/Catalog reference; effects recorded manually/),
  ).toBeVisible();
});
