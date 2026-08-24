import { buildModuleCharacterSchema } from '../../../modules/schema/character-schema';
import {
  ARCANE_MODULE_SYSTEM_ID,
  type StoredCharacter,
} from '../../../storage/stored-character';
import { EXALTED1E_SCHEMA_VERSION } from '../definitions';
import { dragonBloodedTraitIds } from '../reference/dragonblooded-merits-flaws';
import {
  dragonBloodedCharmIds,
  dragonBloodedSpellIds,
} from '../reference/dragonblooded-powers';
import { prepareExalted1eCharacterData } from '../schema';
import {
  ammunitionById,
  armorById,
  weaponById,
} from '../shared/equipment/catalog';
import { exaltedLanguageById } from '../shared/languages/catalog';
import {
  dragonBloodedBackgrounds,
  solarBackgrounds,
  type ExaltedSheetType,
} from '../definitions';
import { EXALTED1E_BUNDLED_LOCK_ID } from './bundled-module';
import { exalted1ePhase3Module } from './exalted1e-phase3-module';
import {
  EXALTED1E_DRAGON_BLOODED_NODE_ID,
  EXALTED1E_DRAGON_BLOODED_SHEET_ID,
  EXALTED1E_MODULE_ID,
  EXALTED1E_MODULE_VERSION,
  EXALTED1E_SHEET_VERSION,
  EXALTED1E_SOLAR_NODE_ID,
  EXALTED1E_SOLAR_SHEET_ID,
} from './id-map';

type MutableRecord = Record<string, unknown>;

function unresolvedReference(
  definitionId: string,
  owned: MutableRecord,
  known: boolean,
) {
  if (known) return null;
  const ownedData = Object.fromEntries(
    Object.entries(owned).filter(
      ([key]) => !['id', 'definitionId', 'unresolvedReference'].includes(key),
    ),
  );
  return {
    definitionId,
    label:
      typeof owned.label === 'string'
        ? owned.label
        : typeof owned.name === 'string'
          ? owned.name
          : definitionId,
    summary: typeof owned.summary === 'string' ? owned.summary : '',
    source: typeof owned.source === 'string' ? owned.source : '',
    page:
      typeof owned.page === 'string' || typeof owned.page === 'number'
        ? String(owned.page)
        : '',
    repairNotes: 'Definition unavailable during copy-first conversion.',
    ownedDataJson: JSON.stringify(ownedData),
  };
}

function normalizeSelectionArray(
  value: unknown,
  isKnown: (definitionId: string) => boolean,
) {
  if (!Array.isArray(value)) return [];
  return value.map((selection) => {
    const owned = selection as MutableRecord;
    const definitionId = String(owned.definitionId ?? 'unknown-definition');
    return {
      ...owned,
      unresolvedReference: unresolvedReference(
        definitionId,
        owned,
        isKnown(definitionId),
      ),
    };
  });
}

function normalizeModuleData(candidate: unknown) {
  const data = structuredClone(candidate) as MutableRecord;
  const sheetType = data.sheetType as ExaltedSheetType;
  const availableBackgrounds = new Set(
    (sheetType === 'solar' ? solarBackgrounds : dragonBloodedBackgrounds).map(
      ({ id }) => id,
    ),
  );
  data.backgrounds = normalizeSelectionArray(data.backgrounds, (id) =>
    availableBackgrounds.has(id as never),
  );
  data.languages = (Array.isArray(data.languages) ? data.languages : []).map(
    (selection) => {
      const owned = selection as MutableRecord;
      const definitionId =
        typeof owned.definitionId === 'string' ? owned.definitionId : null;
      return {
        ...owned,
        unresolvedReference: definitionId
          ? unresolvedReference(
              definitionId,
              owned,
              exaltedLanguageById.has(definitionId),
            )
          : null,
      };
    },
  );
  data.derangements = (
    Array.isArray(data.derangements) ? data.derangements : []
  ).map((selection) => {
    const owned = selection as MutableRecord;
    const definitionId =
      typeof owned.definitionId === 'string' ? owned.definitionId : null;
    return {
      ...owned,
      unresolvedReference: definitionId
        ? unresolvedReference(definitionId, owned, false)
        : null,
    };
  });
  const meritsFlaws = data.meritsFlaws as MutableRecord;
  data.meritsFlaws = {
    merits: normalizeSelectionArray(meritsFlaws?.merits, (id) =>
      dragonBloodedTraitIds.has(id),
    ),
    flaws: normalizeSelectionArray(meritsFlaws?.flaws, (id) =>
      dragonBloodedTraitIds.has(id),
    ),
  };
  const powers = data.powers as MutableRecord;
  data.powers = {
    charms: normalizeSelectionArray(powers?.charms, (id) =>
      dragonBloodedCharmIds.has(id),
    ),
    spells: normalizeSelectionArray(powers?.spells, (id) =>
      dragonBloodedSpellIds.has(id),
    ),
  };
  const equipment = data.equipment as MutableRecord;
  const equipmentGroups = [
    ['weapons', (id: string) => weaponById.has(id)],
    ['armor', (id: string) => armorById.has(id)],
    ['shields', () => false],
    ['ammunition', (id: string) => ammunitionById.has(id)],
  ] as const;
  data.equipment = Object.fromEntries(
    equipmentGroups.map(([group, known]) => [
      group,
      (Array.isArray(equipment?.[group]) ? equipment[group] : []).map(
        (selection) => {
          const owned = selection as MutableRecord;
          const definitionId =
            typeof owned.definitionId === 'string' ? owned.definitionId : null;
          return {
            ...owned,
            unresolvedReference: definitionId
              ? unresolvedReference(definitionId, owned, known(definitionId))
              : null,
          };
        },
      ),
    ]),
  );
  const sheetLayout = data.sheetLayout as { groupOrder?: unknown } | undefined;
  const groupOrder = Array.isArray(sheetLayout?.groupOrder)
    ? [...sheetLayout.groupOrder]
    : ['character', 'exalted', 'combat', 'resources', 'advancement'];
  data.sheetLayout = {
    groupOrder,
    mode: 'build',
    buildOrder: [...groupOrder],
    playOrder: [...groupOrder],
  };
  return data;
}

export function convertExaltedCharacterToModuleCopy(
  source: StoredCharacter,
  now = new Date(),
  id: string = crypto.randomUUID(),
): StoredCharacter {
  const migrated = prepareExalted1eCharacterData(
    source.data,
    source.systemVersion,
  );
  const normalized = normalizeModuleData(migrated);
  const sheetType = normalized.sheetType as ExaltedSheetType;
  const template = exalted1ePhase3Module.sheetTemplates.find(
    ({ id }) =>
      id ===
      (sheetType === 'solar'
        ? EXALTED1E_SOLAR_SHEET_ID
        : EXALTED1E_DRAGON_BLOODED_SHEET_ID),
  )!;
  const validated = buildModuleCharacterSchema(template.characterSchema).parse(
    normalized,
  );
  const timestamp = now.toISOString();
  const identity = normalized.identity as { name?: unknown } | undefined;
  const originalName =
    source.name ||
    (typeof identity?.name === 'string' ? identity.name : '') ||
    `Untitled ${sheetType === 'solar' ? 'Solar' : 'Dragon-Blooded'}`;
  return {
    id,
    systemId: ARCANE_MODULE_SYSTEM_ID,
    systemVersion: EXALTED1E_SCHEMA_VERSION,
    name: `${originalName} · Module preview`,
    createdAt: timestamp,
    updatedAt: timestamp,
    data: validated,
    moduleRef: {
      moduleId: EXALTED1E_MODULE_ID,
      moduleVersion: EXALTED1E_MODULE_VERSION,
      gameNodeId:
        sheetType === 'solar'
          ? EXALTED1E_SOLAR_NODE_ID
          : EXALTED1E_DRAGON_BLOODED_NODE_ID,
      sheetTemplateId:
        sheetType === 'solar'
          ? EXALTED1E_SOLAR_SHEET_ID
          : EXALTED1E_DRAGON_BLOODED_SHEET_ID,
      sheetTemplateVersion: EXALTED1E_SHEET_VERSION,
      dependencyLockId: EXALTED1E_BUNDLED_LOCK_ID,
      enabledOverlayRefs: [],
      convertedFromCharacterId: source.id,
    },
  };
}
