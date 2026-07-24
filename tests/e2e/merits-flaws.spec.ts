import { expect, test } from '@playwright/test';

test('selects, persists, edits, removes, and restores Merits and Flaws', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create character' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Catalog Adept');
  const section = page.locator('section', {
    has: page.getByRole('heading', { name: 'Merits & Flaws' }),
  });
  await section.getByRole('button', { name: 'Open catalog' }).click();

  const search = page.getByRole('searchbox', { name: 'Search catalog' });
  await search.fill('Acute Senses');
  await page
    .getByRole('button', { name: 'Preview description for Acute Senses' })
    .click();
  await expect(page.getByRole('tooltip')).toContainText(
    'Reduces the difficulty',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).not.toBeVisible();

  const acuteExpand = page.getByRole('button', {
    name: 'Expand description for Acute Senses',
  });
  await acuteExpand.click();
  await expect(
    page.getByRole('button', {
      name: 'Collapse description for Acute Senses',
    }),
  ).toHaveAttribute('aria-expanded', 'true');
  await page.getByLabel('Choose cost').selectOption('3');
  await expect(
    page.getByText('Merits 3 · Flaws 0/7 · Net 3', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add' }).click();

  await search.fill('Addiction');
  const addictionResult = page.locator('.catalog-card', {
    has: page.getByRole('heading', { name: 'Addiction', exact: true }),
  });
  await expect(addictionResult).toBeVisible();
  await addictionResult.getByLabel('Choose cost').selectOption('1');
  await addictionResult
    .getByRole('button', { name: 'Add', exact: true })
    .click();
  await expect(page.locator('.merit-flaw-summary > summary')).toContainText(
    'Merits 3 · Flaws 1/7 · Net 2',
  );

  await expect(
    page.getByText('Unsaved changes', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();

  await expect(
    page.getByRole('heading', { name: 'Acute Senses' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Addiction' })).toBeVisible();
  await expect(page.locator('.merit-flaw-summary > summary')).toContainText(
    'Merits 3 · Flaws 1/7 · Net 2',
  );

  const acuteCard = page.locator('.selected-merit-flaw', {
    has: page.getByRole('heading', { name: 'Acute Senses' }),
  });
  await acuteCard
    .getByRole('button', { name: 'Expand selected Acute Senses' })
    .click();
  await acuteCard.getByLabel('Selected cost').selectOption('1');
  await expect(page.locator('.merit-flaw-summary > summary')).toContainText(
    'Merits 1 · Flaws 1/7 · Net 0',
  );

  const addictionCard = page.locator('.selected-merit-flaw', {
    has: page.getByRole('heading', { name: 'Addiction' }),
  });
  await addictionCard
    .getByRole('button', { name: 'Expand selected Addiction' })
    .click();
  await addictionCard.getByLabel('Character notes').fill('Coffee');
  await addictionCard.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('No Flaws selected.')).toBeVisible();
  await page.getByRole('button', { name: 'Undo last change' }).click();

  const restored = page.locator('.selected-merit-flaw', {
    has: page.getByRole('heading', { name: 'Addiction' }),
  });
  await expect(restored.getByLabel('Character notes')).toHaveValue('Coffee');
  await expect(page.locator('.merit-flaw-summary > summary')).toContainText(
    'Merits 1 · Flaws 1/7 · Net 0',
  );
});
