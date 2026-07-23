import { dump, load } from 'js-yaml';
import {
  mageCharacterSchema,
  migrateMageCharacter,
} from '../../systems/mage-m20/character-schema';
import type { MageCharacter } from '../../types/character';

export type CharacterFileFormat = 'json' | 'yaml';

export function serializeCharacter(
  character: MageCharacter,
  format: CharacterFileFormat,
) {
  const validated = mageCharacterSchema.parse(character);
  return format === 'json'
    ? `${JSON.stringify(validated, null, 2)}\n`
    : dump(validated, {
        noRefs: true,
        lineWidth: 100,
        noCompatMode: true,
      });
}

export function createCharacterFileName(
  character: MageCharacter,
  format: CharacterFileFormat,
) {
  const baseName =
    character.identity.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'untitled-mage';
  const extension = format === 'json' ? 'json' : 'yaml';
  return `${baseName}.${extension}`;
}

export function prepareImportedCharacter(
  contents: string,
  fileName: string,
  now = new Date(),
  id = crypto.randomUUID(),
): MageCharacter {
  const isYaml = /\.ya?ml$/i.test(fileName);
  const parsed: unknown = isYaml ? load(contents) : JSON.parse(contents);
  const source = migrateMageCharacter(parsed);
  const timestamp = now.toISOString();

  return mageCharacterSchema.parse({
    ...structuredClone(source),
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
    identity: {
      ...source.identity,
      name: source.identity.name
        ? `${source.identity.name} (Imported)`
        : 'Imported mage',
    },
  });
}
