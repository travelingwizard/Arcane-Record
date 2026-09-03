import {
  mageCharacterDataSchema,
  mageCharacterSchema,
  migrateMageCharacter,
} from '../../systems/mage-m20/character-schema';
import { createBlankMageCharacter } from '../../systems/mage-m20/create-character';
import {
  MAGE_SCHEMA_VERSION,
  MAGE_SYSTEM_ID,
} from '../../systems/mage-m20/definitions';
import type { MageCharacter, MageCharacterData } from '../../types/character';
import type { StoredCharacter } from '../../storage/stored-character';
import { developmentFor, experienceTotals } from './development/rules';

export const MAGE20_SYSTEM_ID = 'mage20' as const;

export function getMageCharacterData(
  character: MageCharacter,
): MageCharacterData {
  return mageCharacterDataSchema.parse(character);
}

export function createMageStoredCharacter(
  now = new Date(),
  id = crypto.randomUUID(),
): StoredCharacter {
  return mageToStoredCharacter(createBlankMageCharacter(now, id));
}

export function mageToStoredCharacter(
  character: MageCharacter,
): StoredCharacter {
  const validated = mageCharacterSchema.parse(
    character.development
      ? {
          ...character,
          experience: experienceTotals(character.development.ledger),
        }
      : character,
  );
  return {
    id: validated.id,
    systemId: MAGE20_SYSTEM_ID,
    systemVersion: MAGE_SCHEMA_VERSION,
    name: validated.identity.name,
    createdAt: validated.createdAt,
    updatedAt: validated.updatedAt,
    data: getMageCharacterData(validated),
  };
}

export function storedCharacterToMage(record: StoredCharacter): MageCharacter {
  if (record.systemId !== MAGE20_SYSTEM_ID) {
    throw new Error('This record is not a Mage 20 character.');
  }

  const hadDevelopment =
    typeof record.data === 'object' &&
    record.data !== null &&
    Object.prototype.hasOwnProperty.call(record.data, 'development');
  const currentData = mageCharacterDataSchema.safeParse(record.data);
  if (currentData.success) {
    const hydrated = mageCharacterSchema.parse({
      ...currentData.data,
      id: record.id,
      systemId: MAGE_SYSTEM_ID,
      schemaVersion: MAGE_SCHEMA_VERSION,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    const development = hadDevelopment
      ? hydrated.development!
      : developmentFor({ ...hydrated, development: undefined });
    const normalized = mageCharacterSchema.parse({
      ...hydrated,
      development,
    });
    return {
      ...normalized,
      experience: experienceTotals(normalized.development!.ledger),
    };
  }

  return migrateMageCharacter({
    ...(record.data as object),
    id: record.id,
    systemId: MAGE_SYSTEM_ID,
    schemaVersion: record.systemVersion,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function migrateLegacyMageRecord(input: unknown): StoredCharacter {
  return mageToStoredCharacter(migrateMageCharacter(input));
}
