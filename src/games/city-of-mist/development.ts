import {
  cityCharacterSchema,
  cityThemeSchema,
  type CityCharacter,
} from './schema';
import type { z } from 'zod';
type Theme = z.infer<typeof cityThemeSchema>;
export interface PowerChoice {
  name: string;
  questionId: string;
}
function getTheme(c: CityCharacter, id: string) {
  const theme = c.themes.find((t) => t.id === id && t.state !== 'archived');
  if (!theme) throw new Error('Choose an active theme.');
  return theme;
}
function addPower(theme: Theme, choice?: PowerChoice): Theme {
  if (!choice?.name.trim() || !choice.questionId.trim())
    throw new Error('A power tag and its source question are required.');
  const questionId = choice.questionId.trim().toUpperCase();
  if (
    theme.tags.some(
      (t) => t.kind === 'power' && t.questionId?.toUpperCase() === questionId,
    )
  )
    throw new Error('That power question is already used.');
  return {
    ...theme,
    tags: [
      ...theme.tags,
      {
        id: crypto.randomUUID(),
        kind: 'power',
        name: choice.name.trim(),
        questionId,
        broad: false,
        burnt: false,
      },
    ],
  };
}
function record(
  c: CityCharacter,
  before: Theme,
  after: Theme | null,
  reason: string,
): CityCharacter {
  if (!reason.trim())
    throw new Error('Record the fictional trigger and table ruling.');
  return cityCharacterSchema.parse({
    ...c,
    development: {
      ...c.development,
      history: [
        ...c.development.history,
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          themeId: before.id,
          reason: reason.trim(),
          before: structuredClone(before),
          after: after ? structuredClone(after) : null,
        },
      ],
    },
  });
}
export function markCityAttention(
  c: CityCharacter,
  id: string,
  reason: string,
  choice?: PowerChoice,
): CityCharacter {
  const before = getTheme(c, id);
  if (before.attention === 3)
    throw new Error(
      'Choose the earned improvement before marking more Attention.',
    );
  let after = { ...before, attention: before.attention + 1 };
  if (
    before.state === 'nascent' &&
    (before.attention === 0 || before.attention === 2)
  )
    after = addPower(after, choice);
  if (before.state === 'nascent' && before.attention === 2)
    after = { ...after, state: 'standard', attention: 0 };
  return record(
    { ...c, themes: c.themes.map((t) => (t.id === id ? after : t)) },
    before,
    after,
    reason,
  );
}
export function claimCityImprovement(
  c: CityCharacter,
  id: string,
  kind: 'power' | 'stabilize',
  reason: string,
  choice?: PowerChoice,
): CityCharacter {
  const before = getTheme(c, id);
  if (before.state !== 'standard' || before.attention !== 3)
    throw new Error('A completed standard Attention track is required.');
  const improved =
    kind === 'power' ? addPower(before, choice) : { ...before, strain: 0 };
  const after = { ...improved, attention: 0 };
  return record(
    { ...c, themes: c.themes.map((t) => (t.id === id ? after : t)) },
    before,
    after,
    reason,
  );
}
export function markCityStrain(
  c: CityCharacter,
  id: string,
  amount: 1 | 2,
  reason: string,
): CityCharacter {
  const before = getTheme(c, id);
  if (amount === 2 && before.kind !== 'mist')
    throw new Error(
      'Two Strikes applies only to an exceptional Gatekeeper transgression.',
    );
  if (before.strain >= 3)
    throw new Error('This theme is already awaiting replacement.');
  const after = { ...before, strain: Math.min(3, before.strain + amount) };
  return record(
    { ...c, themes: c.themes.map((t) => (t.id === id ? after : t)) },
    before,
    after,
    reason,
  );
}
export function quoteCityReplacement(
  c: CityCharacter,
  id: string,
  promotion: boolean,
) {
  const theme = getTheme(c, id);
  if (!['mythos', 'logos', 'mist'].includes(theme.kind))
    throw new Error('Use crew-specific rules for crew or extra themes.');
  const sameKind = c.themes.filter(
    (t) => t.state !== 'archived' && t.kind === theme.kind,
  ).length;
  let state: CityCharacter['development']['state'] = 'normal';
  let nextKind: 'mythos' | 'logos' | 'mist' | null;
  if (c.profile === 'rift') {
    nextKind = theme.kind === 'mythos' ? 'logos' : 'mythos';
    if (sameKind === 1) {
      state = theme.kind === 'mythos' ? 'sleeper' : 'avatar';
      nextKind = null;
    }
  } else if (theme.kind === 'mist') {
    nextKind = sameKind === 1 ? null : 'logos';
    if (!nextKind) state = 'fired';
  } else {
    nextKind = promotion ? 'mist' : 'logos';
    if (promotion && sameKind === 1) {
      state = 'bigwig';
      nextKind = null;
    }
  }
  const buildUp =
    Math.max(0, theme.tags.length - 3) + theme.improvements.length;
  const total = c.playState.buildUp + buildUp;
  return {
    nextKind,
    state,
    buildUp,
    remainder: total % 5,
    moments: Math.floor(total / 5),
  };
}
export function replaceCityTheme(
  c: CityCharacter,
  id: string,
  replacement: Theme | null,
  promotion: boolean,
  reason: string,
  sudden: boolean,
  nemesis: string,
): CityCharacter {
  const before = getTheme(c, id);
  if (before.strain < 3 && !sudden)
    throw new Error(
      'Three strain marks or a recorded move requiring replacement is necessary.',
    );
  const quote = quoteCityReplacement(c, id, promotion);
  if (quote.nextKind) {
    if (
      !replacement ||
      replacement.kind !== quote.nextKind ||
      replacement.state !== 'nascent'
    )
      throw new Error(`Choose a nascent ${quote.nextKind} theme.`);
    if (c.themes.some((t) => t.id === replacement.id))
      throw new Error('Replacement must have a new identity.');
    if (
      replacement.tags.filter((t) => t.kind === 'power').length !== 1 ||
      replacement.tags.filter((t) => t.kind === 'weakness').length !== 1 ||
      !replacement.statement.trim() ||
      replacement.tags.some((t) => !t.name.trim() || !t.questionId?.trim())
    )
      throw new Error(
        'A nascent theme needs one power, one weakness, their questions and a statement.',
      );
    if (
      replacement.tags
        .find((t) => t.kind === 'power')
        ?.questionId?.toUpperCase() !== 'A'
    )
      throw new Error('The first nascent power answers question A.');
  } else if (replacement)
    throw new Error(
      'This transition does not immediately create a replacement theme.',
    );
  if (!nemesis.trim())
    throw new Error(
      'Record the Nemesis or explicitly say the MC will reveal it later.',
    );
  const next = {
    ...c,
    themes: [
      ...c.themes.map((t) =>
        t.id === id ? { ...t, state: 'archived' as const } : t,
      ),
      ...(replacement ? [replacement] : []),
    ],
    playState: { ...c.playState, buildUp: quote.remainder },
    gatekeeper: {
      ...c.gatekeeper,
      clearance: quote.state === 'bigwig' ? 1 : c.gatekeeper.clearance,
    },
    development: {
      ...c.development,
      state: quote.state,
      pendingMoments: c.development.pendingMoments + quote.moments,
      nemeses: [
        ...c.development.nemeses,
        {
          id: crypto.randomUUID(),
          lostThemeId: id,
          description: nemesis.trim(),
        },
      ],
    },
  };
  return record(next, before, replacement, reason);
}
