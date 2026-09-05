import { expect, test } from '@playwright/test';

async function selectMage(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Mage 20' }).click();
}

test('offers guided, manual and import Mage entry paths', async ({ page }) => {
  await selectMage(page);
  await expect(
    page.getByRole('button', { name: 'Build Character' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open Blank Sheet' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Import Character' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Build Character' }).click();
  await expect(page.locator('.mage-creator.character-creator')).toBeVisible();
  const creatorContract = await page
    .locator('.character-creator')
    .evaluate((node) => {
      const borderProbe = document.createElement('span');
      borderProbe.style.border = '1px solid var(--rule)';
      borderProbe.style.background = 'var(--panel-background)';
      borderProbe.style.fontFamily = 'var(--font-serif)';
      document.body.append(borderProbe);
      const expected = getComputedStyle(borderProbe);
      const heading = node.querySelector('h2')!;
      const control = node.querySelector('select')!;
      const result = {
        border: getComputedStyle(node).borderColor,
        expectedBorder: expected.borderColor,
        backgroundColor: getComputedStyle(node).backgroundColor,
        expectedBackgroundColor: expected.backgroundColor,
        backgroundImage: getComputedStyle(node).backgroundImage,
        expectedBackgroundImage: expected.backgroundImage,
        headingFont: getComputedStyle(heading).fontFamily,
        expectedHeadingFont: expected.fontFamily,
        controlHeight: control.getBoundingClientRect().height,
      };
      borderProbe.remove();
      return result;
    });
  expect(creatorContract.border).toBe(creatorContract.expectedBorder);
  expect(creatorContract.backgroundColor).toBe(
    creatorContract.expectedBackgroundColor,
  );
  expect(creatorContract.backgroundImage).toBe(
    creatorContract.expectedBackgroundImage,
  );
  expect(creatorContract.headingFont).toBe(creatorContract.expectedHeadingFont);
  expect(creatorContract.controlHeight).toBeGreaterThanOrEqual(44);
  await expect(
    page.getByRole('heading', { name: 'Build your Mage' }),
  ).toBeVisible();
  await expect(page.getByText('Mage 20, p. 250')).toBeVisible();
  await page.getByRole('button', { name: /2\. Identity/ }).click();
  await page.getByLabel('Creator name').fill('Astra Vale');
  await page.getByLabel('Creator affiliation').selectOption('Traditions');
  await page.getByLabel('Creator sect').fill('Order of Hermes');
  await expect(page.getByText(/Freebies remaining:/)).toBeVisible();
});

test('keeps Mage creator and advancement usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await selectMage(page);
  await page.getByRole('button', { name: 'Build Character' }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.getByRole('button', { name: 'Character library' }).click();
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Mage 20' }).click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();
  await page.getByRole('button', { name: 'Experience' }).click();
  await expect(page.getByText(/Total Experience: 0/)).toBeVisible();
  await page.getByText('Award or adjust XP').click();
  await page.getByLabel('XP amount').fill('5');
  await page.getByLabel('XP entry explanation').fill('First session');
  await page.getByRole('button', { name: 'Record XP entry' }).click();
  await expect(page.getByText(/Current Experience: 5/)).toBeVisible();
});
