import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('persists and exports combat favorites, custom references, and Do maneuvers', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create character' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Disciplined Adept');

  const navigation = page.getByRole('navigation', {
    name: 'Character sheet sections',
  });
  await navigation.getByRole('link', { name: 'Maneuvers' }).click();
  await expect(page).toHaveURL(/#maneuvers$/);

  await page.getByLabel('Search combat maneuvers').fill('Dodge');
  await page.getByRole('button', { name: '☆ Favorite' }).click();
  await page.getByLabel('Search combat maneuvers').clear();
  await page
    .getByLabel('Custom combat maneuver name')
    .fill('Cabal Cover Drill');
  await page
    .getByLabel('Custom combat description')
    .fill('Move together between cover.');
  await page
    .getByRole('button', { name: 'Add custom combat maneuver' })
    .click();

  await page.getByRole('tab', { name: 'Known Do Maneuvers' }).click();
  await page.getByLabel('Search Do maneuvers').fill('Arrow Cutting');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Expand Arrow Cutting' }).click();
  await page
    .getByRole('textbox', { name: 'Notes', exact: true })
    .fill('Practiced with a steel fan.');
  await page.getByLabel('Custom Do maneuver name').fill('Falling Leaf');
  await page.getByRole('button', { name: 'Add custom Do maneuver' }).click();

  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();

  await page.getByLabel('Search combat maneuvers').fill('Dodge');
  await expect(
    page.getByRole('button', { name: '★ Remove favorite' }),
  ).toBeVisible();
  await page.getByLabel('Search combat maneuvers').clear();
  await expect(
    page.getByRole('heading', { name: 'Cabal Cover Drill' }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Known Do Maneuvers' }).click();
  await expect(
    page.getByRole('heading', { name: 'Arrow Cutting' }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Falling Leaf' }),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save JSON' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const exported = JSON.parse(await readFile(path!, 'utf8')) as {
    repeatableEntries: {
      maneuvers: {
        favoriteCombatManeuverIds: string[];
        customCombatManeuvers: Array<{ name: string; description: string }>;
        selectedDoManeuvers: Array<{
          definitionId?: string;
          customName?: string;
          notes: string;
        }>;
      };
    };
  };
  expect(exported.repeatableEntries.maneuvers).toMatchObject({
    favoriteCombatManeuverIds: ['combat-dodge'],
    customCombatManeuvers: [
      {
        name: 'Cabal Cover Drill',
        description: 'Move together between cover.',
      },
    ],
  });
  expect(exported.repeatableEntries.maneuvers.selectedDoManeuvers).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        definitionId: 'do-arrow-cutting',
        notes: 'Practiced with a steel fan.',
      }),
      expect.objectContaining({ customName: 'Falling Leaf' }),
    ]),
  );
  expect(JSON.stringify(exported)).not.toContain(
    'Deflects arrows and similar missiles',
  );
  expect(JSON.stringify(exported)).not.toContain('citation');

  await page.setViewportSize({ width: 320, height: 900 });
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});
