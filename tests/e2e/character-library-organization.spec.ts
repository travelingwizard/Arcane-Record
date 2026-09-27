import { expect, test, type Page } from '@playwright/test';

async function createMage(page: Page, name: string) {
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Mage 20' }).click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Character library' }).click();
}

test('favorites, orders, archives, and restores local characters', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.removeItem('arcane-record:character-library-preferences'),
  );
  await page.reload();
  await createMage(page, 'Alpha Adept');
  await createMage(page, 'Beta Adept');

  const alpha = page
    .locator('.character-card')
    .filter({ hasText: 'Alpha Adept' });
  const beta = page
    .locator('.character-card')
    .filter({ hasText: 'Beta Adept' });
  await beta.getByRole('button', { name: 'Add favorite: Beta Adept' }).click();
  await alpha
    .getByRole('button', { name: 'Add favorite: Alpha Adept' })
    .click();

  const favorites = page.locator('.character-library-group').filter({
    has: page.getByRole('heading', { name: 'Favorite Characters' }),
  });
  await favorites
    .locator('.character-card')
    .filter({ hasText: 'Beta Adept' })
    .dragTo(
      favorites.locator('.character-card').filter({ hasText: 'Alpha Adept' }),
    );
  expect(
    await favorites.locator('.character-card__copy strong').allTextContents(),
  ).toEqual(['Beta Adept', 'Alpha Adept']);
  await favorites
    .getByRole('button', { name: 'Move Alpha Adept earlier' })
    .click();
  expect(
    await favorites.locator('.character-card__copy strong').allTextContents(),
  ).toEqual(['Alpha Adept', 'Beta Adept']);

  await beta.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(beta).toHaveCount(0);
  const recent = page
    .getByRole('heading', { name: 'Recent characters' })
    .locator('..');
  await expect(recent.getByText('Beta Adept')).toHaveCount(0);

  await page.getByLabel('Show All Characters').check();
  const archived = page.locator('.character-library-group').filter({
    has: page.getByRole('heading', { name: 'Archived Characters' }),
  });
  await expect(archived.getByText('Beta Adept')).toBeVisible();
  await archived.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(favorites.getByText('Beta Adept')).toBeVisible();

  await page.getByLabel('Search').fill('Alpha');
  await expect(
    page.getByText(/Clear search and choose All games/),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Move Alpha Adept/ }),
  ).toHaveCount(0);

  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Remove favorite: Alpha Adept' }),
  ).toBeVisible();
});

test('keeps library organization controls contained at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await expect(page.getByLabel('Show All Characters')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
});
