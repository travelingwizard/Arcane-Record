import { expect, test, type Locator } from '@playwright/test';

async function expectFieldUsesThemeTokens(field: Locator) {
  const colors = await field.evaluate((node) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--ink)';
    probe.style.backgroundColor = 'var(--paper-light)';
    probe.style.border = '1px solid var(--rule-light)';
    document.body.append(probe);
    const actual = getComputedStyle(node);
    const expected = getComputedStyle(probe);
    const result = {
      color: actual.color,
      background: actual.backgroundColor,
      border: actual.borderTopColor,
      expectedColor: expected.color,
      expectedBackground: expected.backgroundColor,
      expectedBorder: expected.borderTopColor,
      height: node.getBoundingClientRect().height,
    };
    probe.remove();
    return result;
  });

  expect(colors.color).toBe(colors.expectedColor);
  expect(colors.background).toBe(colors.expectedBackground);
  expect(colors.border).toBe(colors.expectedBorder);
  expect(colors.height).toBeGreaterThanOrEqual(44);
}

test('Mage Experience fields follow every dark base theme', async ({
  page,
}) => {
  await page.goto('/create');
  await page.getByRole('button', { name: 'Choose Mage 20' }).click();
  await page.getByRole('button', { name: 'Open Blank Sheet' }).click();

  const totalExperience = page.getByLabel('Total Experience', { exact: true });
  await expect(totalExperience).toBeVisible();

  for (const theme of [
    'Midnight Quintessence',
    'Technocratic Dossier',
    'Tradition Codex',
    'Barsaive Twilight',
    'Dragon’s Horn',
    'Blood Wood',
    'Horror Taint',
    'Astral Thread',
  ]) {
    await page.getByRole('button', { name: 'Settings' }).click();
    const settings = page.getByRole('dialog', { name: 'Settings' });
    await settings.getByRole('radio', { name: new RegExp(theme) }).check();
    await expectFieldUsesThemeTokens(totalExperience);
    await settings.getByRole('button', { name: 'Close Settings' }).click();
  }
});

test('Legend actions use the shared primary and secondary treatments', async ({
  page,
}) => {
  await page.goto('/create');
  await page
    .getByRole('button', { name: 'Choose Legend in the Mist', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Choose Hero sheet', exact: true })
    .click();
  await page.getByRole('button', { name: 'Build Hero', exact: true }).click();

  await page.getByRole('button', { name: 'Settings' }).click();
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await settings.getByRole('radio', { name: /Midnight Quintessence/ }).check();
  await settings.getByRole('button', { name: 'Close Settings' }).click();

  const primary = page.getByRole('button', { name: 'Roll 2d6' });
  const secondary = page.getByRole('button', { name: 'Add status' });
  await expect(primary).toHaveClass(/primary-button/);
  await expect(secondary).toHaveClass(/secondary-button/);

  const styles = await Promise.all(
    [primary, secondary].map((control) =>
      control.evaluate((node) => ({
        color: getComputedStyle(node).color,
        background: getComputedStyle(node).backgroundColor,
        border: getComputedStyle(node).borderTopColor,
        height: node.getBoundingClientRect().height,
      })),
    ),
  );
  expect(styles.every(({ height }) => height >= 44)).toBe(true);
  expect(styles[0]!.background).not.toBe(styles[1]!.background);
  expect(styles[1]!.background).toBe('rgba(0, 0, 0, 0)');
});
