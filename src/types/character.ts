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
import type {
  CharacterSectionGroupId,
  SheetLayoutMode,
} from '../systems/mage-m20/character-sections';

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

export interface SelectedBackground {
  id: string;
  definitionId: string;
  displayName: string;
  rating: number;
  notes: string;
  addedAt: string;
  pooled: boolean;
  unresolvedDefinitionName?: string;
}

export interface SelectedMeritFlaw {
  id: string;
  definitionId: string;
  chosenCost: number;
  notes: string;
  addedAt: string;
}

export interface FocusSelection {
  id: string;
  definitionId?: string;
  customName?: string;
  notes: string;
  addedAt: string;
  unresolvedDefinitionName?: string;
}

export interface InstrumentSelection extends FocusSelection {
  significant: boolean;
}

export interface FocusData {
  paradigms: FocusSelection[];
  practices: FocusSelection[];
  instruments: InstrumentSelection[];
  need: string;
  culture: string;
  notes: string;
}

export interface OwnedWonder {
  id: string;
  definitionId?: string;
  name: string;
  typeLabel: string;
  rating: number | null;
  powers: string;
  notes: string;
  addedAt: string;
  unresolvedDefinitionName?: string;
}

export interface SphereRequirement {
  sphereId: SphereId | 'data' | 'other';
  minimum: number;
  maximum?: number;
  label?: string;
}

export interface KnownRote {
  id: string;
  definitionId?: string;
  name: string;
  sphereRequirements: SphereRequirement[];
  requirementNotes: string;
  effect: string;
  focusNotes: string;
  notes: string;
  addedAt: string;
  unresolvedDefinitionName?: string;
}

export type EquipmentCategory = 'melee' | 'ranged' | 'armor' | 'gear';

export interface OwnedEquipment {
  id: string;
  definitionId?: string;
  name: string;
  category: EquipmentCategory;
  description: string;
  quantity: number;
  equipped: boolean;
  notes: string;
  addedAt: string;
  unresolvedDefinitionName?: string;
}

export interface CustomCombatManeuver {
  id: string;
  name: string;
  description: string;
  notes: string;
  addedAt: string;
}

export interface SelectedDoManeuver {
  id: string;
  definitionId?: string;
  customName?: string;
  customSummary?: string;
  customRoll?: string;
  customDifficulty?: string;
  customDamage?: string;
  customActions?: string;
  customSourceTitle?: string;
  customSourcePage?: string;
  notes: string;
  addedAt: string;
  unresolvedDefinitionName?: string;
}

export interface CustomDoTechniqueInput {
  name: string;
  summary: string;
  roll: string;
  difficulty: string;
  damage: string;
  actions: string;
  sourceTitle: string;
  sourcePage: string;
}

export interface CharacterManeuvers {
  favoriteCombatManeuverIds: string[];
  customCombatManeuvers: CustomCombatManeuver[];
  selectedDoManeuvers: SelectedDoManeuver[];
}

export interface RepeatableEntries {
  backgrounds: SelectedBackground[];
  merits: SelectedMeritFlaw[];
  flaws: SelectedMeritFlaw[];
  focus: FocusData;
  wonders: OwnedWonder[];
  rotes: KnownRote[];
  equipment: OwnedEquipment[];
  maneuvers: CharacterManeuvers;
}

export interface HealthState {
  damage: Array<'bashing' | 'lethal' | 'aggravated'>;
}

export interface ExperienceTotals {
  total: number;
  current: number;
}

export interface SheetLayout {
  mode: SheetLayoutMode;
  groupOrders: Record<SheetLayoutMode, CharacterSectionGroupId[]>;
}

export type EnlightenmentRatings = Record<EnlightenmentId, number> & {
  willpowerTemporary: number;
};

export interface MageCharacter {
  development?: import('../games/mage20/development/schema').MageDevelopment;
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
  experience: ExperienceTotals;
  sheetLayout: SheetLayout;
}

export type MageCharacterData = Omit<
  MageCharacter,
  'id' | 'systemId' | 'schemaVersion' | 'createdAt' | 'updatedAt'
>;
