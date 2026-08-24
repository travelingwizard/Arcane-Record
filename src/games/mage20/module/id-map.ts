import {
  abilityGroups,
  attributeGroups,
  enlightenmentTraits,
  identityFields,
  spheres,
} from '../../../systems/mage-m20/definitions';
import { backgroundCatalog } from '../../../systems/mage-m20/reference/backgrounds';
import { equipmentCatalog } from '../../../systems/mage-m20/reference/equipment';
import {
  instrumentCatalog,
  paradigmCatalog,
  practiceCatalog,
} from '../../../systems/mage-m20/reference/focus';
import {
  combatManeuverCatalog,
  doManeuverCatalog,
} from '../../../systems/mage-m20/reference/maneuvers';
import { meritFlawCatalog } from '../../../systems/mage-m20/reference/merits-flaws';
import { roteCatalog } from '../../../systems/mage-m20/reference/rotes';
import { wonderCatalog } from '../../../systems/mage-m20/reference/wonders';

export const MAGE20_MODULE_ID =
  'net.travelingwizard.arcane-record.mage20' as const;
export const MAGE20_MODULE_VERSION = '0.2.0' as const;
export const MAGE20_GAME_NODE_ID = 'mage20' as const;
export const MAGE20_SHEET_ID = 'mage20-character' as const;
export const MAGE20_SHEET_VERSION = 1 as const;

const normalizeLegacyId = (legacyId: string) => {
  const normalized = legacyId
    .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return /^[a-z]/.test(normalized) ? normalized : `definition-${normalized}`;
};

const idMap = <T extends { id: string }>(entries: readonly T[]) =>
  Object.freeze(
    Object.fromEntries(
      entries.map(({ id }) => [id, normalizeLegacyId(id)]),
    ) as Readonly<Record<string, string>>,
  );

/**
 * Published Mage IDs are copied from the legacy definitions, never generated
 * from labels. Once a module version ships, these values are immutable.
 */
export const mage20DefinitionIdMap = Object.freeze({
  identityFields: idMap(identityFields),
  attributes: idMap(
    attributeGroups.flatMap(({ traits }) => traits.map(({ id }) => ({ id }))),
  ),
  abilities: idMap(
    abilityGroups.flatMap(({ traits }) => traits.map(({ id }) => ({ id }))),
  ),
  enlightenment: idMap(enlightenmentTraits),
  spheres: idMap(spheres),
  backgrounds: idMap(backgroundCatalog),
  merits: idMap(meritFlawCatalog.filter(({ kind }) => kind === 'merit')),
  flaws: idMap(meritFlawCatalog.filter(({ kind }) => kind === 'flaw')),
  paradigms: idMap(paradigmCatalog),
  practices: idMap(practiceCatalog),
  instruments: idMap(instrumentCatalog),
  wonders: idMap(wonderCatalog),
  rotes: idMap(roteCatalog),
  equipment: idMap(equipmentCatalog),
  combatManeuvers: idMap(combatManeuverCatalog),
  doManeuvers: idMap(doManeuverCatalog),
});

export type Mage20DefinitionKind = keyof typeof mage20DefinitionIdMap;

export function resolveMage20DefinitionId(
  kind: Mage20DefinitionKind,
  definitionId: string,
) {
  const moduleDefinitionId = mage20DefinitionIdMap[kind][definitionId];
  return moduleDefinitionId
    ? ({ status: 'available', definitionId, moduleDefinitionId } as const)
    : ({
        status: 'unresolved',
        kind,
        definitionId,
        fallbackLabel: `Unknown ${kind} definition (${definitionId})`,
      } as const);
}
