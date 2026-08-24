import type { StoredCharacter } from '../../storage/stored-character';

export function resolveCharacterDefinition(
  definitionId: string,
  base: Record<string, unknown> | null,
  character: StoredCharacter,
) {
  const custom = character.homebrew?.customDefinitions.find(
    ({ id }) => id === definitionId,
  );
  if (custom)
    return {
      id: custom.id,
      name: custom.name,
      ...custom.data,
      source: 'character-custom' as const,
    };
  if (!base) return null;
  const override = character.homebrew?.definitionOverrides.find(
    ({ definitionId: target }) => target === definitionId,
  );
  return override
    ? { ...base, ...override.fields, source: 'character-override' as const }
    : { ...base, source: 'module' as const };
}
