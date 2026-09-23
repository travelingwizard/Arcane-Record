/** Definitive Edition p. 7. Faces use printed d10 digits, 0 through 9. */
export function resolveDie(
  kind: 'simple' | 'stress',
  dice: readonly number[],
  botchDice: readonly number[] = [],
  modifier = 0,
) {
  if (!Number.isSafeInteger(modifier)) throw new Error('Invalid modifier.');
  if (
    !dice.length ||
    [...dice, ...botchDice].some((d) => !Number.isInteger(d) || d < 0 || d > 9)
  )
    throw new Error('Use d10 digits from 0 through 9.');
  if (kind === 'simple') {
    if (dice.length !== 1 || botchDice.length)
      throw new Error('Simple rolls use one die and no botch dice.');
    const value = dice[0] || 10;
    if (!Number.isSafeInteger(value + modifier))
      throw new Error('Roll exceeds safe integer range.');
    return { value, total: value + modifier, botches: 0 };
  }
  if (dice[0] === 0) {
    if (dice.length !== 1) throw new Error('Initial zero does not explode.');
    const botches = botchDice.filter((d) => d === 0).length;
    return {
      value: 0,
      total: botches ? Math.min(0, modifier) : modifier,
      botches,
    };
  }
  if (botchDice.length)
    throw new Error('Only an initial zero checks for botches.');
  if (dice.at(-1) === 1 || dice.slice(0, -1).some((d) => d !== 1))
    throw new Error(
      'An exploding chain must end with exactly one non-one result.',
    );
  const value = (dice.at(-1) || 10) * 2 ** (dice.length - 1);
  if (!Number.isSafeInteger(value + modifier))
    throw new Error('Roll exceeds safe integer range.');
  return { value, total: value + modifier, botches: 0 };
}

/** Rejection sampling avoids modulo bias. Returns a printed d10 digit. */
export function randomDie() {
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= 4294967290);
  return buffer[0] % 10;
}
