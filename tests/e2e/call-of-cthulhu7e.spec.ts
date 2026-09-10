import { expect, test } from '@playwright/test';

test('groups Call of Cthulhu editions and labels the unavailable 7E Keeper workspace', async ({
  page,
}) => {
  await page.goto('/create/call-of-cthulhu');
  await expect(
    page.getByRole('heading', { name: 'Choose an edition' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Second Edition' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Choose Seventh Edition' }).click();
  await expect(
    page.getByRole('heading', { name: 'Investigator' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Keeper workspace' }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Supply an authoritative Call of Cthulhu Seventh Edition Keeper Rulebook.',
    ),
  ).toBeVisible();
});

test('opens a strict 7E blank investigator at 320px without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/create/call-of-cthulhu-7e');
  await page.getByRole('button', { name: 'Choose Investigator' }).click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await expect(
    page.getByRole('heading', { name: 'Characteristics' }),
  ).toBeVisible();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
