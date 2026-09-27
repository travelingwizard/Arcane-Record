import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.removeItem('arcane-record:game-chooser-preferences'),
  );
  await page.reload();
  await page.getByRole('button', { name: 'Create Character' }).click();
});

test('searches nested game choices and filters by creation support', async ({
  page,
}) => {
  const search = page.getByRole('searchbox', { name: 'Search games' });
  await search.fill('Solar');
  await expect(
    page.getByRole('heading', { name: 'Exalted First Edition' }),
  ).toBeVisible();
  await expect(page.getByText('Matches: Solar')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Mage:/ })).toBeHidden();

  await search.fill('Ghoul');
  await expect(
    page.getByRole('heading', {
      name: 'Vampire: The Masquerade 20th Anniversary',
    }),
  ).toBeVisible();
  await expect(page.getByText('Matches: Ghoul')).toBeVisible();

  await page.getByRole('button', { name: 'Clear' }).click();
  await page.getByLabel('Creation support filter').selectOption('sheet-only');
  await expect(page.getByRole('heading', { name: 'Curseborne' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'KULT: Divinity Lost' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /Mage:/ })).toBeHidden();
});

test('groups by engine and keeps the requested games together', async ({
  page,
}) => {
  await page.getByLabel('Sort games').selectOption('engine');
  const world = page
    .locator('.game-chooser-group')
    .filter({ has: page.getByRole('heading', { name: 'World of Darkness' }) });
  await expect(world.getByRole('heading', { name: /Mage:/ })).toBeVisible();
  await expect(world.getByRole('heading', { name: /Vampire:/ })).toHaveCount(2);
  await expect(world.getByRole('heading', { name: /Werewolf:/ })).toBeVisible();

  const forged = page
    .locator('.game-chooser-group')
    .filter({ has: page.getByRole('heading', { name: 'Forged in the Dark' }) });
  await expect(
    forged.getByRole('heading', { name: 'Band of Blades' }),
  ).toBeVisible();
  await expect(
    forged.getByRole('heading', { name: 'Blades in the Dark' }),
  ).toBeVisible();

  const burning = page
    .locator('.game-chooser-group')
    .filter({ has: page.getByRole('heading', { name: 'Burning Wheel' }) });
  await expect(
    burning.getByRole('heading', { name: /Burning Wheel Gold/ }),
  ).toBeVisible();
  await expect(
    burning.getByRole('heading', { name: /Mouse Guard/ }),
  ).toBeVisible();
  await expect(
    burning.getByRole('heading', { name: /Torchbearer/ }),
  ).toBeVisible();
});

test('favorites games, orders them first, and preserves normal search sorting', async ({
  page,
}) => {
  const mageCard = page.locator('.game-chooser-card').filter({
    has: page.getByRole('heading', { name: /Mage:/ }),
  });
  const earthdawnCard = page.locator('.game-chooser-card').filter({
    has: page.getByRole('heading', { name: 'Earthdawn Fourth Edition' }),
  });
  await mageCard.getByRole('button', { name: /Add favorite/ }).click();
  await earthdawnCard.getByRole('button', { name: /Add favorite/ }).click();

  const favorites = page
    .locator('.game-chooser-group')
    .filter({ has: page.getByRole('heading', { name: 'Favorites' }) });
  await expect(favorites.getByRole('heading', { name: /Mage:/ })).toBeVisible();
  await expect(
    favorites.getByRole('heading', { name: 'Earthdawn Fourth Edition' }),
  ).toBeVisible();
  await favorites
    .locator('article')
    .filter({ hasText: 'Earthdawn Fourth Edition' })
    .dragTo(favorites.locator('article').filter({ hasText: 'Mage' }));
  expect((await favorites.locator('article h2').allTextContents())[0]).toBe(
    'Earthdawn Fourth Edition',
  );
  await favorites.getByRole('button', { name: /Move Mage:.*earlier/ }).click();
  const favoriteNames = await favorites.locator('article h2').allTextContents();
  expect(favoriteNames[0]).toMatch(/^Mage:/);

  await page.reload();
  await expect(
    page.getByRole('button', {
      name: 'Remove favorite: Earthdawn Fourth Edition',
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Hide game: Earthdawn Fourth Edition' })
    .click();
  await page.getByRole('button', { name: 'Show hidden games (1)' }).click();
  await expect(
    page.getByRole('button', {
      name: 'Remove favorite: Earthdawn Fourth Edition',
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Restore game: Earthdawn Fourth Edition' })
    .click();
  await page.getByRole('searchbox', { name: 'Search games' }).fill('Mage');
  await expect(page.getByRole('heading', { name: 'Favorites' })).toHaveCount(0);
});

test('hides, restores, and persists games without disabling their routes', async ({
  page,
}) => {
  const search = page.getByRole('searchbox', { name: 'Search games' });
  await search.fill('KULT');
  const kultCard = page.locator('.game-chooser-card').filter({
    has: page.getByRole('heading', { name: 'KULT: Divinity Lost' }),
  });
  await kultCard.getByRole('button', { name: 'Hide game' }).click();
  await expect(kultCard).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Show hidden games (1)' }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole('searchbox', { name: 'Search games' }),
  ).toHaveValue('');
  await page.getByRole('searchbox', { name: 'Search games' }).fill('KULT');
  await expect(
    page.getByRole('heading', { name: 'KULT: Divinity Lost' }),
  ).toBeHidden();
  await page.getByRole('button', { name: 'Show hidden games (1)' }).click();
  await expect(
    page.getByRole('heading', { name: 'KULT: Divinity Lost' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Restore game' }).click();
  await expect(
    page.getByRole('button', { name: /Show hidden games/ }),
  ).toHaveCount(0);

  await page.goto('/create/kult-divinity-lost');
  await expect(
    page.getByRole('heading', { name: /Choose a character type/ }),
  ).toBeVisible();
});

test('remains keyboard-sized without horizontal overflow at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole('searchbox', { name: 'Search games' }).fill('Vampire');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
  const controls = await page
    .locator('.game-chooser-controls :is(button, input, select)')
    .all();
  for (const control of controls)
    expect(
      await control.evaluate((node) => node.getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(44);
});
