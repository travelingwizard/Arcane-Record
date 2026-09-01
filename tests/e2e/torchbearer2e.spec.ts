import { expect, test, type Page } from '@playwright/test';

async function goToStep(page: Page, name: string) {
  await page
    .getByRole('list', { name: 'Character creation steps' })
    .getByRole('button', { name: new RegExp(name) })
    .click();
}

test('guides, finalizes, edits, browses, reorders, and persists a Torchbearer character', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Torchbearer 2e' }).click();
  await page.getByRole('button', { name: 'Create Character' }).click();

  await expect(page).toHaveURL(/\/characters\//);
  await expect(
    page.getByRole('heading', { name: 'Build your Torchbearer' }),
  ).toBeVisible();
  await page.getByRole('radio', { name: /Warrior/ }).check();

  await goToStep(page, 'Upbringing');
  await page.getByLabel('Will', { exact: true }).fill('4');
  await page.getByLabel('Health', { exact: true }).fill('4');
  await page.getByRole('radio', { name: /Laborer/ }).check();

  await goToStep(page, 'Home');
  await page.getByRole('radio', { name: 'Religious Bastion' }).check();
  await page.getByRole('radio', { name: 'Cartographer' }).check();
  await page.getByRole('radio', { name: 'Defender' }).check();

  await goToStep(page, 'Social grace');
  await page.getByRole('radio', { name: 'Haggler' }).check();
  await goToStep(page, 'Specialty');
  await page.getByRole('radio', { name: 'Cook' }).check();

  await goToStep(page, 'Wises');
  await page.getByRole('button', { name: 'Add Wise' }).click();
  await page.getByLabel('Wise 1').fill('Dungeons-wise');

  await goToStep(page, 'Nature');
  await page
    .getByRole('radio', { name: 'Boast of my great deeds by the hearth.' })
    .check();
  await page
    .getByRole('radio', { name: 'Demand to be heard as an equal.' })
    .check();
  await page
    .getByRole('radio', { name: 'Flee and hide inside tall citadels.' })
    .check();

  await goToStep(page, 'Circles');
  await page.getByRole('checkbox', { name: 'Friend' }).check();

  await goToStep(page, 'Containers & gear');
  await page.getByRole('checkbox', { name: /Backpack/ }).check();
  await page.getByRole('checkbox', { name: /Tinderbox/ }).check();

  await goToStep(page, 'Weapons & armor');
  await page.getByRole('radio', { name: /Battle Axe/ }).check();

  await goToStep(page, 'Identity');
  const creator = page.locator('.tb2-creator');
  await creator.getByLabel('Name', { exact: true }).fill('Karolina');
  await creator.getByLabel('Age', { exact: true }).fill('18');
  await creator
    .getByLabel('Raiment', { exact: true })
    .fill('Red traveling cloak');
  await creator.getByLabel('Friend', { exact: true }).fill('Dralic');
  await creator
    .getByLabel('Belief', { exact: true })
    .fill('No one is left behind.');
  await creator
    .getByLabel('Instinct', { exact: true })
    .fill('Always check the exit.');

  await goToStep(page, 'Review');
  await expect(
    page.getByText('All enforced creation rules are satisfied.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Finalize character' }).click();

  await expect(
    page.getByRole('heading', { name: 'Who You Are' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fresh' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('group', { name: 'Fighter: 4 out of 6' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Injured' }).click();
  await page.getByRole('button', { name: 'Add Trait' }).click();
  await page.getByLabel('Trait name').last().fill('Campaign Gift');

  await page.getByRole('button', { name: 'Browse catalogs' }).click();
  await page
    .getByRole('searchbox', { name: 'Search' })
    .fill('Arcane Semblance');
  await expect(
    page.getByRole('heading', { name: 'Arcane Semblance' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add to sheet' }).click();
  await page.getByRole('button', { name: 'Close catalog browser' }).click();

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(
    page.getByRole('switch', { name: /Enforce core creation rules/ }),
  ).toBeChecked();
  await expect(
    page.getByRole('button', { name: 'Reopen Character Creator' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close Settings' }).click();

  const navigation = page.getByRole('navigation', {
    name: 'Character sheet sections',
  });
  await navigation.getByRole('button', { name: 'Edit section order' }).click();
  await navigation
    .getByRole('button', { name: 'Move Character later' })
    .click();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('.tb2-character-sheet > section').first(),
  ).toHaveAttribute('id', 'tb2-rewards');

  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Karolina',
  );
  await expect(page.getByLabel('Trait name').last()).toHaveValue(
    'Campaign Gift',
  );
  await expect(page.getByRole('textbox', { name: 'Spell' })).toHaveValue(
    'Arcane Semblance',
  );
  await expect(
    page.locator('.tb2-character-sheet > section').first(),
  ).toHaveAttribute('id', 'tb2-rewards');

  await page.setViewportSize({ width: 320, height: 900 });
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});

test('keeps the guided creator usable at 320px with keyboard controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Torchbearer 2e' }).click();
  await page.getByRole('button', { name: 'Create Character' }).click();

  const warrior = page.getByRole('radio', { name: /Warrior/ });
  await warrior.focus();
  await warrior.press('Space');
  await expect(warrior).toBeChecked();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});
