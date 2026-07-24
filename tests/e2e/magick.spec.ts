import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('records, persists, and exports Focus, Wonders, and Rotes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create character' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Magick Adept');

  const navigation = page.getByRole('navigation', {
    name: 'Character sheet sections',
  });
  await navigation.getByRole('link', { name: 'Focus' }).click();
  await expect(page).toHaveURL(/#focus$/);

  await page.getByLabel('Custom Focus entry type').selectOption('instrument');
  await page.getByLabel('Custom name').fill('Silver Key');
  await page.getByRole('button', { name: 'Add custom', exact: true }).click();
  await page
    .getByRole('checkbox', { name: 'Significant to this mage' })
    .check();
  await page
    .getByLabel('Personal need')
    .fill('To reveal hidden paths and forgotten names.');

  await page.getByRole('button', { name: 'Browse references' }).click();
  const focusCatalog = page.getByLabel('Paradigms reference catalog');
  await focusCatalog
    .getByRole('searchbox', { name: 'Search paradigms' })
    .fill('Everything is Data');
  await focusCatalog.getByRole('button', { name: 'Add' }).click();

  await navigation.getByRole('link', { name: 'Wonders' }).click();
  await page.getByLabel('Custom Wonder name').fill('Copper Compass');
  await page.getByRole('button', { name: 'Add custom Wonder' }).click();
  await page.getByRole('button', { name: 'Expand Copper Compass' }).click();
  await page
    .getByLabel('Powers and Effects')
    .fill('Points toward people the mage has promised to find.');

  await navigation.getByRole('link', { name: 'Rotes' }).click();
  await page.getByLabel('Custom Rote name').fill('Find the Thread');
  await page.getByRole('button', { name: 'Add custom Rote' }).click();
  await page.getByRole('button', { name: 'Expand Find the Thread' }).click();
  await page.getByRole('button', { name: 'Add Sphere requirement' }).click();
  const requirements = page.getByRole('group', {
    name: 'Structured Sphere requirements',
  });
  await requirements.getByRole('combobox').selectOption('correspondence');
  await requirements.getByRole('spinbutton', { name: 'Minimum' }).fill('2');
  await page
    .getByLabel('Effect', { exact: true })
    .fill('Locates a person through a sympathetic connection.');

  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Silver Key' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Copper Compass' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Find the Thread' }),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const exported = JSON.parse(await readFile(path!, 'utf8')) as {
    repeatableEntries: {
      focus: { paradigms: unknown[]; instruments: unknown[] };
      wonders: Array<{ name: string; powers: string }>;
      rotes: Array<{ name: string; effect: string }>;
    };
  };
  expect(exported.repeatableEntries.focus.paradigms).toHaveLength(1);
  expect(exported.repeatableEntries.focus.instruments).toHaveLength(1);
  expect(exported.repeatableEntries.wonders[0]).toMatchObject({
    name: 'Copper Compass',
    powers: 'Points toward people the mage has promised to find.',
  });
  expect(exported.repeatableEntries.rotes[0]).toMatchObject({
    name: 'Find the Thread',
    effect: 'Locates a person through a sympathetic connection.',
  });
  expect(JSON.stringify(exported)).not.toContain('citation');
  expect(JSON.stringify(exported)).not.toContain('summary');

  await page.setViewportSize({ width: 320, height: 900 });
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});
