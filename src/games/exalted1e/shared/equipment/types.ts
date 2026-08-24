import type { ExaltedAbilityId } from '../../definitions';

export type CombatProfile = 'classic' | 'power-combat';
export type DamageType = 'bashing' | 'lethal' | 'aggravated';
export type EquipmentKind = 'weapon' | 'armor' | 'shield' | 'ammunition';
export type EquipmentQuality =
  'poor' | 'normal' | 'exceptional' | 'perfect' | 'custom';
export type MagicalMaterial =
  'none' | 'orichalcum' | 'moonsilver' | 'jade' | 'starmetal' | 'soulsteel';

export interface SourceReference {
  book: string;
  page: number;
  note?: string;
}

export interface DamageExpression {
  attribute: 'strength' | null;
  modifier: number;
  type: DamageType;
  alternateModifier?: number;
  note?: string;
}

export interface WeaponProfileStats {
  speed: number | null;
  accuracy: number;
  damage: DamageExpression;
  defense: number | null;
  rate: number;
  range: number | null;
  minimumStrength?: number;
  minimumDexterity?: number;
  minimumMartialArts?: number;
  notes: string[];
}

export interface WeaponModeDefinition {
  id: string;
  label: string;
  abilityId: ExaltedAbilityId;
  profiles: Partial<Record<CombatProfile, WeaponProfileStats>>;
}

export interface WeaponDefinition {
  id: string;
  name: string;
  category: 'natural' | 'melee' | 'thrown' | 'archery' | 'artifact';
  resourceCost: number | null;
  artifactRating?: number;
  modes: WeaponModeDefinition[];
  source: SourceReference;
}

export interface ArmorProfileStats {
  lethalSoak: number;
  bashingSoak: number;
  mobilityPenalty: number;
  fatigue: number;
  commitment: number;
}

export interface ArmorDefinition {
  id: string;
  name: string;
  category: 'light' | 'medium' | 'heavy' | 'superheavy' | 'artifact';
  resourceCost: number | null;
  artifactRating?: number;
  profiles: Record<CombatProfile, ArmorProfileStats>;
  source: SourceReference;
}

export interface ShieldDefinition {
  id: string;
  name: string;
  profiles: Partial<
    Record<CombatProfile, { difficultyModifier: number; notes: string[] }>
  >;
  source: SourceReference;
}

export interface AmmunitionDefinition {
  id: string;
  name: string;
  damageModifier: number;
  damageType: DamageType;
  notes: string[];
  source: SourceReference;
}

export interface OwnedEquipment {
  id: string;
  kind: EquipmentKind;
  definitionId: string | null;
  unresolvedReference?: {
    definitionId: string;
    label: string;
    summary: string;
    source: string;
    page: string;
    repairNotes: string;
    ownedDataJson: string;
  } | null;
  customName: string;
  modeId: string | null;
  quality: EquipmentQuality;
  qualityAdjustments: {
    speed: number;
    accuracy: number;
    damage: number;
    defense: number;
    rate: number;
    range: number;
  };
  material: MagicalMaterial;
  equipped: boolean;
  attuned: boolean;
  committedEssence: number;
  ammunition: {
    current: number | null;
    typeId: string | null;
  };
  enhancements: { id: string; label: string; notes: string }[];
  notes: string;
}
