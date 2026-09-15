import type { KultCharacter } from './schema';

export function claimedAdvancementCount(character: KultCharacter): number {
  return character.advancements.filter(({ status }) => status === 'claimed')
    .length;
}

export function canTransition(character: KultCharacter): boolean {
  const claimed = claimedAdvancementCount(character);
  return (
    (character.sheetType === 'sleeper' && claimed >= 6) ||
    (character.sheetType === 'aware' && claimed >= 10)
  );
}

export function applyReviewedTransition(
  character: KultCharacter,
  id: string,
  createdAt: string,
): KultCharacter {
  const draft = character.transitionDraft;
  if (!draft || !canTransition(character) || !draft.newArchetype.trim()) {
    throw new Error('This character is not ready for the reviewed transition.');
  }
  const expectedTarget =
    character.sheetType === 'sleeper'
      ? 'aware'
      : character.sheetType === 'aware'
        ? 'enlightened'
        : null;
  if (draft.target !== expectedTarget) {
    throw new Error('The transition target does not match the current sheet.');
  }
  return {
    ...character,
    sheetType: draft.target,
    archetype: draft.newArchetype.trim(),
    archetypeDefinitionId: null,
    transitionDraft: null,
    advancements: [],
    transitionArchives: [
      ...character.transitionArchives,
      {
        id,
        from: character.sheetType,
        to: draft.target,
        previousArchetype: character.archetype,
        note: draft.note,
        advancements: structuredClone(character.advancements),
        createdAt,
      },
    ],
    history: [
      ...character.history,
      {
        id,
        kind: 'transition',
        summary: `Transitioned from ${character.sheetType} to ${draft.target}`,
        createdAt,
      },
    ],
  };
}
