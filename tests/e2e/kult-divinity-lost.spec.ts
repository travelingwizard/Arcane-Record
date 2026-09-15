import { expect, test } from '@playwright/test';

test('offers all four KULT manual sheets and source suggestions', async ({
  page,
}) => {
  await page.goto('/create/kult-divinity-lost');
  for (const variant of ['General', 'Sleeper', 'Aware', 'Enlightened']) {
    await expect(
      page.getByRole('heading', { name: variant, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole('button', { name: 'Open blank Aware sheet' }).click();
  await expect(page.getByText('Saved in this browser')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Character' })).toBeVisible();
  await page.getByText('Browse source suggestions').first().click();
  await expect(
    page.getByRole('button', { name: 'Add suggestion' }).first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add suggestion' }).first().click();
  await expect(page.getByRole('textbox', { name: 'Archetype' })).toHaveValue(
    'Academic',
  );
  await expect(page.getByText('Saved in this browser')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Archetype' })).toHaveValue(
    'Academic',
  );
});

test('keeps KULT play controls usable without overflowing at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/kult-divinity-lost');
  await page.getByRole('button', { name: 'Open blank Sleeper sheet' }).click();
  await page.getByRole('switch', { name: 'Build mode Play mode' }).click();
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveAttribute(
    'readonly',
    '',
  );
  await expect(
    page.getByRole('button', { name: 'Add custom advantage' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('checkbox', { name: 'Stabilized' }).first(),
  ).toBeEnabled();
  await page.getByRole('button', { name: /Sections Character/ }).click();
  await expect(page.getByText('Wounds', { exact: true }).first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
