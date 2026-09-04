import { expect, test } from '@playwright/test';

test('City of Mist groups crew creation beneath its game choice', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create');
  await expect(
    page.getByRole('button', { name: 'Choose Crew', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Choose City of Mist', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Choose Character sheet', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Choose Gatekeeper', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: '← Choose another sheet', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Choose Crew sheet', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/characters\//);
  await expect(
    page.getByLabel('Shared crew notes', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel('Shared crew notes', { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('linked crew refreshes across tabs and stale edits cannot overwrite a saved crew', async ({
  page,
  context,
}) => {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose City of Mist', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Choose Character sheet', exact: true })
    .click();
  await page.getByRole('button', { name: /Rift/ }).click();
  await page
    .getByRole('button', { name: 'Create Shared Crew', exact: true })
    .click();
  const link = page.getByRole('link', { name: 'Open standalone Crew sheet' });
  await expect(link).toBeVisible();
  const url = await link.getAttribute('href');
  const a = await context.newPage(),
    b = await context.newPage();
  await a.goto(url!);
  await b.goto(url!);
  await a
    .getByLabel('Shared crew notes', { exact: true })
    .fill('Shared lead visible to everyone');
  await expect(
    a.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Shared lead visible to everyone', { exact: true }),
  ).toBeVisible();
  await b
    .getByLabel('Shared crew notes', { exact: true })
    .fill('Stale conflicting draft');
  await expect(b.getByRole('alert')).toContainText('Save failed');
  await a.reload();
  await expect(a.getByLabel('Shared crew notes', { exact: true })).toHaveValue(
    'Shared lead visible to everyone',
  );
});

test('Curseborne saves and applies a reviewed build draft without changing notes', async ({
  page,
}) => {
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Curseborne', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Create Character', exact: true })
    .click();
  await page.getByLabel('Name', { exact: true }).fill('Before rebuild');
  await page
    .getByLabel('History, description and notes', { exact: true })
    .fill('Keep my history');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page
    .getByText('Review permanent build changes', { exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Open separate build draft', exact: true })
    .click();
  await page.getByLabel('name (draft)', { exact: true }).fill('After rebuild');
  await page
    .getByRole('button', {
      name: 'Confirm reviewed build changes',
      exact: true,
    })
    .click();
  await page
    .getByRole('button', { name: 'Close Settings', exact: true })
    .click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'After rebuild',
  );
  await expect(
    page.getByLabel('History, description and notes', { exact: true }),
  ).toHaveValue('Keep my history');
});

test('Curseborne preview saves identity and protects it in Play', async ({
  page,
}) => {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Curseborne', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Create Character', exact: true })
    .click();
  await page.getByLabel('Name', { exact: true }).fill('Local Accursed');
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
    'Local Accursed',
  );
  await page.getByRole('switch', { name: 'Play mode', exact: true }).check();
  await expect(page.getByLabel('Name', { exact: true })).toHaveAttribute(
    'readonly',
    '',
  );
  await page
    .getByRole('button', { name: 'Roll ordinary and curse dice', exact: true })
    .click();
  await expect(
    page.getByText('Roll history (1)', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('Roll history (1)', { exact: true }),
  ).toBeVisible();
});

test('City of Mist opens a Rift sheet and personal crew at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose City of Mist', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Choose Character sheet', exact: true })
    .click();
  await page.getByRole('button', { name: /Rift/ }).click();
  await page.getByLabel('Name', { exact: true }).fill('Local Rift');
  await page
    .getByRole('button', { name: 'Create Crew Just for This Character' })
    .click();
  await expect(page.getByLabel('Crew name', { exact: true })).toHaveValue(
    'Personal crew',
  );
  await page
    .getByLabel('New status or story-tag name', { exact: true })
    .fill('bruised');
  await page
    .getByLabel('Status spectrum (confirm with the MC)', { exact: true })
    .fill('harm');
  await page
    .getByRole('button', { name: 'Add or stack status', exact: true })
    .click();
  await expect(
    page.getByText('bruised-1 · 0 pips · ongoing', { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel('New batch method', { exact: true })
    .fill('Library research');
  await page
    .getByRole('button', { name: 'Add resource batch', exact: true })
    .click();
  await expect(
    page.getByText('clue: Library research · 1 remaining', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('bruised-1 · 0 pips · ongoing', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Roll ordinary/ })).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
});
