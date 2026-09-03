import { mageCharacterDataSchema } from '../../../systems/mage-m20/character-schema';
import { MAGE_SCHEMA_VERSION } from '../../../systems/mage-m20/definitions';
import {
  ARCANE_MODULE_SYSTEM_ID,
  type StoredCharacter,
} from '../../../storage/stored-character';
import { storedCharacterToMage } from '../character-adapter';
import { MAGE20_BUNDLED_LOCK_ID } from './bundled-module';
import {
  MAGE20_GAME_NODE_ID,
  MAGE20_MODULE_ID,
  MAGE20_MODULE_VERSION,
  MAGE20_SHEET_ID,
  MAGE20_SHEET_VERSION,
} from './id-map';
import { mage20Phase2Module } from './mage20-phase2-module';
import { buildModuleCharacterSchema } from '../../../modules/schema/character-schema';

export function convertMageCharacterToModuleCopy(
  source: StoredCharacter,
  now = new Date(),
  id = crypto.randomUUID(),
): StoredCharacter {
  const mage = storedCharacterToMage(source);
  if (
    mage.sourcePreferences?.mature ||
    mage.sourcePreferences?.enabled.some((id) => id !== 'mage-20')
  )
    throw new Error(
      'Supplement source settings require the production Mage editor.',
    );
  const development = mage.development;
  if (
    development &&
    (development.status !== 'manual' ||
      development.draft ||
      development.baseline ||
      development.ledger.length ||
      development.extraAbilities.length ||
      Object.keys(development.specialties).length ||
      Object.keys(development.details).length)
  ) {
    throw new Error(
      'Mage creation and advancement records require the production Mage editor; this experimental module preview cannot preserve them.',
    );
  }
  const data = mageCharacterDataSchema.parse(mage);
  const template = mage20Phase2Module.sheetTemplates[0]!;
  const validated = buildModuleCharacterSchema(template.characterSchema).parse(
    data,
  );
  const timestamp = now.toISOString();
  return {
    id,
    systemId: ARCANE_MODULE_SYSTEM_ID,
    systemVersion: MAGE_SCHEMA_VERSION,
    name: `${source.name || mage.identity.name || 'Untitled mage'} · Module preview`,
    createdAt: timestamp,
    updatedAt: timestamp,
    data: validated,
    moduleRef: {
      moduleId: MAGE20_MODULE_ID,
      moduleVersion: MAGE20_MODULE_VERSION,
      gameNodeId: MAGE20_GAME_NODE_ID,
      sheetTemplateId: MAGE20_SHEET_ID,
      sheetTemplateVersion: MAGE20_SHEET_VERSION,
      dependencyLockId: MAGE20_BUNDLED_LOCK_ID,
      enabledOverlayRefs: [],
      convertedFromCharacterId: source.id,
    },
  };
}
