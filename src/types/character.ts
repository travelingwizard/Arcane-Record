import { abilityGroups } from '../systems/mage-m20/definitions';
import type {
  AttributeGroupId,
  AttributeId,
  EnlightenmentId,
  IdentityFieldId,
  MAGE_SCHEMA_VERSION,
  MAGE_SYSTEM_ID,
  SphereId,
} from '../systems/mage-m20/definitions';

export type IdentityData = Record<IdentityFieldId, string>;

export type AbilityRatings = {
  [Group in (typeof abilityGroups)[number] as Group['id']]: {
    [Trait in Group['traits'][number] as Trait['id']]: number;
  };
};

export type AttributeRatings = Record<
  AttributeGroupId,
  Partial<Record<AttributeId, number>>
> & {
  physical: {
    strength: number;
    dexterity: number;
    stamina: number;
  };
  social: {
    charisma: number;
    manipulation: number;
    appearance: number;
  };
  mental: {
    perception: number;
    intelligence: number;
    wits: number;
  };
};

export interface RatedEntry {
  id: string;
  label: string;
  rating: number;
}

export interface CostedEntry {
  id: string;
  label: string;
  cost: number | null;
}

export interface RoteEntry {
  id: string;
  spheres: string;
  effect: string;
}

export interface RepeatableEntries {
  backgrounds: RatedEntry[];
  merits: CostedEntry[];
  flaws: CostedEntry[];
  focus: string[];
  wonders: string[];
  rotes: RoteEntry[];
}

export interface HealthState {
  damage: Array<'bashing' | 'lethal' | 'aggravated'>;
}

export type EnlightenmentRatings = Record<EnlightenmentId, number> & {
  willpowerTemporary: number;
};

export interface MageCharacter {
  id: string;
  systemId: typeof MAGE_SYSTEM_ID;
  schemaVersion: typeof MAGE_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
  identity: IdentityData;
  attributes: AttributeRatings;
  abilities: AbilityRatings;
  enlightenment: EnlightenmentRatings;
  spheres: Record<SphereId, number>;
  affinitySphere: SphereId | null;
  repeatableEntries: RepeatableEntries;
  health: HealthState;
}
