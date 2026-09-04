import { curseCharacterSchema, type CurseCharacter } from './schema';

function record(c: CurseCharacter, description: string): CurseCharacter {
  return curseCharacterSchema.parse({
    ...c,
    resourceHistory: [
      ...c.resourceHistory,
      { id: crypto.randomUUID(), date: new Date().toISOString(), description },
    ],
  });
}
export function bleedCurseDice(
  c: CurseCharacter,
  held: number,
  temporary: number,
  reason: string,
): CurseCharacter {
  if (!reason.trim())
    throw new Error('Record the spell or effect requiring this cost.');
  if (
    ![held, temporary].every((n) => Number.isInteger(n) && n >= 0) ||
    held + temporary < 1 ||
    held > c.curseDice ||
    temporary > c.temporaryCurseDice
  )
    throw new Error('Cannot bleed more dice than are held.');
  return record(
    {
      ...c,
      curseDice: c.curseDice - held,
      temporaryCurseDice: c.temporaryCurseDice - temporary,
    },
    `Bled ${held} non-temporary and ${temporary} temporary curse dice: ${reason.trim()}`,
  );
}
export function resetCurseScene(c: CurseCharacter): CurseCharacter {
  const losesAll = c.temporaryDiceRisk && c.temporaryCurseDice > 0;
  return record(
    {
      ...c,
      curseDice: losesAll ? 0 : c.curseDice,
      temporaryCurseDice: 0,
      temporaryDiceRisk: false,
    },
    losesAll
      ? 'Scene ended with unbled risky temporary dice: all curse dice removed; resolve Damnation with the Storyguide (core p. 226).'
      : 'Scene ended: temporary curse dice expired. Other resources and injuries were preserved.',
  );
}
export function resetCurseStory(c: CurseCharacter): CurseCharacter {
  return record(
    { ...c, curseDice: 1, temporaryCurseDice: 0, temporaryDiceRisk: false },
    'New story confirmed: held curse dice set to one (core p. 244). Other resources and history preserved.',
  );
}
export function advanceEntanglement(
  c: CurseCharacter,
  reason: string,
  approved: boolean,
): CurseCharacter {
  if (c.mode === 'play')
    throw new Error('Switch to Build mode to advance Entanglement.');
  if (!approved || !reason.trim())
    throw new Error(
      'Record the completed story and agreement of players and Storyguide.',
    );
  if (c.entanglement >= 10) throw new Error('Entanglement is already ten.');
  return record(
    { ...c, entanglement: c.entanglement + 1 },
    `Players and Storyguide approved Entanglement ${c.entanglement} → ${c.entanglement + 1}: ${reason.trim()}. No EXP spent.`,
  );
}
