import type { ExaltedSheetType } from '../../definitions';
import type {
  ArmorProfileStats,
  CombatProfile,
  MagicalMaterial,
  WeaponProfileStats,
  OwnedEquipment,
} from './types';

export interface ResolvedValue<T> {
  value: T;
  breakdown: string[];
}

function hasAffinity(material: MagicalMaterial, sheetType: ExaltedSheetType) {
  return (
    (material === 'orichalcum' && sheetType === 'solar') ||
    (material === 'jade' && sheetType === 'dragon-blooded')
  );
}

export function resolveWeaponMaterial(
  base: WeaponProfileStats,
  material: MagicalMaterial,
  sheetType: ExaltedSheetType,
): ResolvedValue<WeaponProfileStats> {
  const value: WeaponProfileStats = {
    ...base,
    damage: { ...base.damage },
    notes: [...base.notes],
  };
  const breakdown = ['Catalog profile'];
  if (!hasAffinity(material, sheetType)) {
    if (material !== 'none') breakdown.push('No matching material affinity');
    return { value, breakdown };
  }
  if (material === 'orichalcum') {
    value.speed = value.speed === null ? null : value.speed + 1;
    value.accuracy += 1;
    value.defense = value.defense === null ? null : value.defense + 1;
    breakdown.push('Orichalcum Solar affinity: +1 Speed, Accuracy, Defense');
  }
  if (material === 'jade') {
    value.speed = value.speed === null ? null : value.speed + 3;
    breakdown.push('Jade Dragon-Blooded affinity: +3 Speed');
  }
  return { value, breakdown };
}

export function resolveArmorMaterial(
  base: ArmorProfileStats,
  material: MagicalMaterial,
  sheetType: ExaltedSheetType,
): ResolvedValue<ArmorProfileStats> {
  const value = { ...base };
  const breakdown = ['Catalog profile'];
  if (!hasAffinity(material, sheetType)) {
    if (material !== 'none') breakdown.push('No matching material affinity');
    return { value, breakdown };
  }
  if (material === 'orichalcum') {
    value.lethalSoak += 2;
    value.bashingSoak += 2;
    breakdown.push('Orichalcum Solar affinity: +2 lethal and bashing soak');
  }
  if (material === 'jade') {
    value.fatigue = 0;
    breakdown.push('Jade Dragon-Blooded affinity: fatigue becomes 0');
  }
  return { value, breakdown };
}

export function resolveProfile<T>(
  profiles: Partial<Record<CombatProfile, T>>,
  profile: CombatProfile,
) {
  return profiles[profile] ?? null;
}

export function resolveQualityEffects(
  base: WeaponProfileStats,
  item: Pick<OwnedEquipment, 'quality' | 'qualityAdjustments'>,
): ResolvedValue<WeaponProfileStats> {
  const adjustments = item.qualityAdjustments;
  const value: WeaponProfileStats = {
    ...base,
    speed: base.speed === null ? null : base.speed + adjustments.speed,
    accuracy: base.accuracy + adjustments.accuracy,
    damage: {
      ...base.damage,
      modifier: base.damage.modifier + adjustments.damage,
    },
    defense: base.defense === null ? null : base.defense + adjustments.defense,
    rate: base.rate + adjustments.rate,
    range: base.range === null ? null : base.range + adjustments.range,
    notes: [...base.notes],
  };
  const changes = Object.entries(adjustments)
    .filter(([, amount]) => amount !== 0)
    .map(([stat, amount]) => `${stat} ${amount > 0 ? '+' : ''}${amount}`);
  return {
    value,
    breakdown: changes.length
      ? [`${item.quality} quality allocation: ${changes.join(', ')}`]
      : [`${item.quality} quality: no recorded statistical allocation`],
  };
}
