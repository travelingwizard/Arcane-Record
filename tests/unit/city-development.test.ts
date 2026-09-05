import { expect, it } from 'vitest';
import { createCityCharacter } from '../../src/games/city-of-mist/schema';
import { newTheme } from '../../src/games/city-of-mist/ThemeCards';
import {
  markCityAttention,
  claimCityImprovement,
  quoteCityReplacement,
  replaceCityTheme,
  markCityStrain,
} from '../../src/games/city-of-mist/development';
const character = () => ({
  ...createCityCharacter(),
  themes: [
    newTheme('Bastion', 'mythos'),
    newTheme('Divination', 'mythos'),
    newTheme('Mission', 'logos'),
    newTheme('Training', 'logos'),
  ],
});
it('spends completed Attention on an actual tag and prevents duplicate questions', () => {
  const c = character();
  c.themes[0]!.attention = 3;
  const next = claimCityImprovement(c, c.themes[0]!.id, 'power', 'Reviewed', {
    name: 'Armored',
    questionId: 'A',
  });
  expect(next.themes[0]!.tags[0]!.name).toBe('Armored');
  expect(next.themes[0]!.attention).toBe(0);
  next.themes[0]!.attention = 3;
  expect(() =>
    claimCityImprovement(next, next.themes[0]!.id, 'power', 'Again', {
      name: 'Other',
      questionId: 'a',
    }),
  ).toThrow('already');
});
it('grants nascent powers at the first mark and first completed track only', () => {
  let c = character();
  c.themes[0]!.state = 'nascent';
  const id = c.themes[0]!.id;
  c = markCityAttention(c, id, 'First', {
    name: 'Second tag',
    questionId: 'B',
  });
  expect(c.themes[0]!.attention).toBe(1);
  c = markCityAttention(c, id, 'Second');
  c = markCityAttention(c, id, 'Third', { name: 'Third tag', questionId: 'C' });
  expect(c.themes[0]!.state).toBe('standard');
  expect(c.themes[0]!.attention).toBe(0);
});
it('archives lost themes, counts weakness tags toward Build-Up and records Nemesis', () => {
  const c = character();
  const old = c.themes[0]!;
  old.strain = 3;
  old.tags = Array.from({ length: 6 }, (_, i) => ({
    id: crypto.randomUUID(),
    name: `Tag ${i}`,
    kind: i === 5 ? ('weakness' as const) : ('power' as const),
    questionId: String(i),
    burnt: false,
    invoked: false,
    broad: false,
  }));
  c.playState.buildUp = 4;
  const replacement = {
    ...newTheme('Mission', 'logos'),
    state: 'nascent' as const,
    statement: 'Protect them',
    tags: [
      { ...old.tags[0]!, id: crypto.randomUUID(), questionId: 'A' },
      { ...old.tags[5]!, id: crypto.randomUUID(), questionId: 'A' },
    ],
  };
  const next = replaceCityTheme(
    c,
    old.id,
    replacement,
    false,
    'Lost contact',
    false,
    'MC reveal pending',
  );
  expect(next.themes[0]!.state).toBe('archived');
  expect(next.themes[0]!.tags).toEqual(old.tags);
  expect(next.playState.buildUp).toBe(2);
  expect(next.development.pendingMoments).toBe(1);
  expect(next.development.nemeses).toHaveLength(1);
});
it('distinguishes Gatekeeper personal business, promotion and firing', () => {
  const c = character();
  c.profile = 'gatekeeper';
  c.themes[0]!.kind = 'mist';
  c.themes[1]!.kind = 'logos';
  expect(quoteCityReplacement(c, c.themes[2]!.id, false).nextKind).toBe(
    'logos',
  );
  expect(quoteCityReplacement(c, c.themes[2]!.id, true).nextKind).toBe('mist');
  expect(quoteCityReplacement(c, c.themes[0]!.id, false).state).toBe('fired');
  expect(() => markCityStrain(c, c.themes[2]!.id, 2, 'Severe')).toThrow();
});
