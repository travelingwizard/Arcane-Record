import {
  arsCharacterSchema,
  type ArsCharacter,
  type CharacterDefinition,
} from './schema';

export function beginRebuild(character: ArsCharacter): ArsCharacter {
  if (character.creation.draft)
    throw new Error('A rebuild draft already exists. Resume it instead.');
  if (!character.creation.baseline)
    throw new Error(
      'This manual character has no creation baseline. No history was inferred.',
    );
  return arsCharacterSchema.parse({
    ...character,
    creation: {
      ...character.creation,
      draft: structuredClone(character.creation.baseline),
    },
  });
}

export function previewRebuild(character: ArsCharacter) {
  const { baseline, draft } = character.creation;
  if (!baseline || !draft)
    throw new Error('Rebuild requires an existing baseline and draft.');
  const conflicts: (keyof CharacterDefinition)[] = [];
  const changed: (keyof CharacterDefinition)[] = [];
  const merged = structuredClone(character.definition);
  for (const key of Object.keys(baseline) as (keyof CharacterDefinition)[]) {
    const before = JSON.stringify(baseline[key]);
    const desired = JSON.stringify(draft[key]);
    const current = JSON.stringify(character.definition[key]);
    if (before === desired) continue;
    changed.push(key);
    if (current !== before && current !== desired) conflicts.push(key);
    else Object.assign(merged, { [key]: structuredClone(draft[key]) });
  }
  return { conflicts, changed, merged };
}

/** Explicit whole-field conflict choices; arrays are not silently replaced. */
export function applyRebuild(
  character: ArsCharacter,
  input: {
    id: string;
    at: string;
    reason: string;
    confirmed: boolean;
    choices: Partial<
      Record<keyof CharacterDefinition, 'keep-current' | 'use-draft'>
    >;
  },
): ArsCharacter {
  if (!input.confirmed || !input.reason.trim())
    throw new Error('Confirm the preview and record a reason.');
  if (character.history.some((e) => e.id === input.id))
    throw new Error('This rebuild was already applied.');
  const preview = previewRebuild(character);
  const nextBaseline = structuredClone(character.creation.baseline!);
  for (const field of preview.changed) {
    if (
      !preview.conflicts.includes(field) ||
      input.choices[field] === 'use-draft'
    )
      Object.assign(nextBaseline, {
        [field]: structuredClone(character.creation.draft![field]),
      });
  }
  for (const field of preview.conflicts) {
    if (!input.choices[field])
      throw new Error(`Review the conflicting ${field} field before applying.`);
    if (input.choices[field] === 'use-draft')
      Object.assign(preview.merged, {
        [field]: structuredClone(character.creation.draft![field]),
      });
  }
  return arsCharacterSchema.parse({
    ...character,
    name: preview.merged.name,
    definition: preview.merged,
    creation: {
      ...character.creation,
      baseline: nextBaseline,
      draft: null,
    },
    history: [
      ...character.history,
      {
        id: input.id,
        at: input.at,
        kind: 'rebuild',
        explanation: input.reason,
        before: character.definition,
        after: preview.merged,
      },
    ],
  });
}
