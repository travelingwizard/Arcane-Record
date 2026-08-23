import { expect, test } from '@playwright/test';

test('navigates the full desktop sheet with anchors and active-section tracking', async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Mage 20' }).click();
  await page.getByRole('button', { name: 'Create Character' }).click();

  const desktopNavigation = page.getByRole('navigation', {
    name: 'Character sheet sections',
  });
  await expect(desktopNavigation).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Sections / }),
  ).not.toBeVisible();

  const modeSwitch = page.getByRole('switch', {
    name: /Build mode.*Play mode/,
  });
  await modeSwitch.check();
  await expect(modeSwitch).toBeChecked();
  await expect(
    page.getByRole('button', { name: 'Set Strength to 3' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Set Temporary Willpower to 3' }),
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Add Quintessence' }),
  ).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Add Paradox' })).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Bruised: Unmarked damage' }),
  ).toBeEnabled();
  await expect(
    page.locator('.character-sheet section').first(),
  ).toHaveAttribute('id', 'health');
  await expect(
    desktopNavigation.getByRole('button', {
      name: 'Move Character earlier',
    }),
  ).toHaveCount(0);
  await desktopNavigation
    .getByRole('button', { name: 'Edit section order' })
    .click();
  await desktopNavigation
    .getByRole('button', { name: 'Move Character earlier' })
    .click();
  await expect(page.locator('.character-sheet section').nth(9)).toHaveAttribute(
    'id',
    'identity',
  );

  const backgroundsLink = desktopNavigation.getByRole('link', {
    name: 'Backgrounds',
  });
  await backgroundsLink.click();
  await expect(page).toHaveURL(/#backgrounds$/);
  await expect(backgroundsLink).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('#backgrounds-heading')).toBeVisible();
  const backgroundHeadingTop = await page
    .locator('#backgrounds-heading')
    .evaluate((heading) => heading.getBoundingClientRect().top);
  expect(backgroundHeadingTop).toBeGreaterThanOrEqual(0);

  await page.locator('#spheres').scrollIntoViewIfNeeded();
  const spheresLink = desktopNavigation.getByRole('link', { name: 'Spheres' });
  await expect(spheresLink).toHaveAttribute('aria-current', 'location');

  await page.goBack();
  await expect(desktopNavigation).toBeVisible();
  await desktopNavigation.getByRole('link', { name: 'Health' }).click();
  await expect(page).toHaveURL(/#health$/);

  await page.setViewportSize({ width: 1119, height: 900 });
  await expect(desktopNavigation).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: /Sections Health/ }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1120, height: 900 });
  await expect(desktopNavigation).toBeVisible();

  expect(browserErrors).toEqual([]);
});

test('uses persistent independent disclosures and the mobile Sections sheet', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Character' }).click();
  await page.getByRole('button', { name: 'Choose Mage 20' }).click();
  await page.getByRole('button', { name: 'Create Character' }).click();

  await expect(
    page.getByRole('navigation', { name: 'Character sheet sections' }),
  ).not.toBeVisible();
  const sectionsTrigger = page.getByRole('button', {
    name: /Sections /,
  });
  await expect(sectionsTrigger).toBeVisible();

  await page.getByRole('button', { name: 'Expand Backgrounds' }).click();
  await page.getByRole('button', { name: 'Collapse Backgrounds' }).click();
  await expect(page.getByText('0 selected · 0 of 7 points')).toBeVisible();

  await sectionsTrigger.click();
  const sheet = page.getByRole('dialog', { name: 'Character Sections' });
  await expect(sheet).toBeVisible();
  await expect(
    sheet.getByRole('button', { name: 'Move Character later' }),
  ).toHaveCount(0);
  await sheet.getByRole('button', { name: 'Edit section order' }).click();
  await expect(
    sheet.getByRole('button', { name: 'Move Character later' }),
  ).toBeVisible();
  await sheet
    .getByRole('button', { name: 'Finish editing section order' })
    .click();
  await expect(
    sheet.getByRole('button', { name: 'Move Character later' }),
  ).toHaveCount(0);
  await sheet.getByRole('link', { name: /Backgrounds/ }).click();
  await expect(sheet).not.toBeVisible();
  await expect(page).toHaveURL(/#backgrounds$/);
  await expect(
    page.getByRole('button', { name: 'Collapse Backgrounds' }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#backgrounds-heading')).toBeVisible();

  await page.getByRole('button', { name: 'Expand Spheres' }).click();
  await expect(
    page.getByRole('button', { name: 'Collapse Backgrounds' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Collapse Spheres' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Expand Attributes' }).click();
  await page.getByRole('button', { name: 'Set Strength to 3' }).click();
  await page.getByRole('button', { name: 'Collapse Attributes' }).click();
  await expect(
    page.getByText('Saved in this browser', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Expand Attributes' }).click();
  await expect(
    page.getByRole('group', { name: 'Strength: 3 out of 5' }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Collapse Backgrounds' }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByRole('button', { name: 'Collapse Spheres' }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByRole('button', { name: 'Collapse Attributes' }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByRole('group', { name: 'Strength: 3 out of 5' }),
  ).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

  await page.setViewportSize({ width: 320, height: 900 });
  await expect(page.getByRole('button', { name: /Sections / })).toBeVisible();
  const narrowDimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(narrowDimensions.content).toBeLessThanOrEqual(
    narrowDimensions.viewport,
  );
});
