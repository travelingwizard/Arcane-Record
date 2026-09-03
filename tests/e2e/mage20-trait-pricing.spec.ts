import { expect, test } from '@playwright/test';

test('records and reloads a GM-approved Sphere pricing choice', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Mage 20' }).click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await dialog
    .getByLabel('Book of Secrets · official', { exact: true })
    .check();
  await dialog.getByRole('button', { name: 'Close Settings' }).click();
  const section = page.locator('section', {
    has: page.getByRole('heading', { name: 'Merits & Flaws', exact: true }),
  });
  await section.getByRole('button', { name: 'Open catalog' }).click();
  await section
    .getByRole('searchbox', { name: 'Search catalog' })
    .fill('Sphere Natural');
  await section
    .locator('.catalog-card')
    .getByRole('button', { name: 'Add', exact: true })
    .click();
  const selected = section.locator('.selected-merit-flaw');
  await selected
    .getByRole('button', { name: 'Expand selected Sphere Natural' })
    .click();
  await selected.getByLabel('Affected Sphere').selectOption('forces');
  await selected
    .getByLabel('Ruling and story justification')
    .fill('Use printed costs; Forces is central to the concept.');
  await selected.getByLabel('GM Approved this interpretation').check();
  await selected
    .getByRole('button', { name: 'Confirm Sphere Trait choice' })
    .click();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await selected
    .getByRole('button', { name: 'Expand selected Sphere Natural' })
    .click();
  await expect(selected.getByText(/Recorded: forces/)).toBeVisible();
  await page.setViewportSize({ width: 320, height: 760 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
