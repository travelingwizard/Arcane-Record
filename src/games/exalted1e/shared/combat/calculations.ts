import type { ExaltedAbilityId, ExaltedSheetType } from '../../definitions';
import type { Exalted1eCharacter } from '../../schema';
import { ammunitionById, armorById, weaponById } from '../equipment/catalog';
import {
  resolveArmorMaterial,
  resolveProfile,
  resolveQualityEffects,
  resolveWeaponMaterial,
} from '../equipment/resolvers';
import type { DamageExpression, OwnedEquipment } from '../equipment/types';

export interface CalculationLine {
  label: string;
  value: number;
}

export interface CalculatedAttack {
  equipmentId: string;
  name: string;
  abilityId: ExaltedAbilityId;
  attackPool: number;
  attackBreakdown: CalculationLine[];
  speed: number | null;
  accuracy: number;
  damage: DamageExpression;
  damageTotal: number;
  defense: number | null;
  rate: number;
  range: number | null;
  notes: string[];
  source: { book: string; page: number };
}

export interface ProtectionSummary {
  naturalBashing: number;
  naturalLethal: number;
  armorBashing: number;
  armorLethal: number;
  finalBashing: number;
  finalLethal: number;
  mobilityPenalty: number;
  fatigue: number;
  breakdown: string[];
}

function specialtyBonus(
  character: Exalted1eCharacter,
  abilityId: ExaltedAbilityId,
) {
  return character.combat.specialties
    .filter((specialty) => specialty.abilityId === abilityId)
    .reduce((sum, specialty) => sum + specialty.rating, 0);
}

function equipmentName(item: OwnedEquipment, fallback: string) {
  return item.customName.trim() || fallback;
}

export function calculateAttacks(
  character: Exalted1eCharacter,
): CalculatedAttack[] {
  const naturalItems: OwnedEquipment[] = ['fist', 'kick'].map(
    (definitionId) => ({
      id: `natural-${definitionId}`,
      kind: 'weapon',
      definitionId,
      customName: '',
      modeId: 'melee',
      quality: 'normal',
      qualityAdjustments: {
        speed: 0,
        accuracy: 0,
        damage: 0,
        defense: 0,
        rate: 0,
        range: 0,
      },
      material: 'none',
      equipped: true,
      attuned: false,
      committedEssence: 0,
      ammunition: { current: null, typeId: null },
      enhancements: [],
      notes: '',
    }),
  );
  return [...naturalItems, ...character.equipment.weapons]
    .filter((item) => item.equipped && item.definitionId)
    .flatMap((item) => {
      const definition = weaponById.get(item.definitionId!);
      if (!definition) return [];
      const mode =
        definition.modes.find(({ id }) => id === item.modeId) ??
        definition.modes[0];
      if (!mode) return [];
      const base = resolveProfile(mode.profiles, character.combat.profile);
      if (!base) return [];
      const quality = resolveQualityEffects(base, item);
      const resolved = resolveWeaponMaterial(
        quality.value,
        definition.category === 'artifact' ? item.material : 'none',
        character.sheetType as ExaltedSheetType,
      );
      const stats = resolved.value;
      const dexterity = character.attributes.physical.dexterity;
      const ability = character.abilities[mode.abilityId];
      const specialty = specialtyBonus(character, mode.abilityId);
      const attackBreakdown: CalculationLine[] = [
        { label: 'Dexterity', value: dexterity },
        { label: mode.abilityId, value: ability },
        ...(specialty ? [{ label: 'Specialties', value: specialty }] : []),
        { label: 'Weapon Accuracy', value: stats.accuracy },
        ...(character.combat.woundPenalty
          ? [
              {
                label: 'Current wound penalty',
                value: character.combat.woundPenalty,
              },
            ]
          : []),
      ];
      const ammunition = item.ammunition.typeId
        ? ammunitionById.get(item.ammunition.typeId)
        : undefined;
      const damage = ammunition
        ? {
            ...stats.damage,
            modifier: ammunition.damageModifier,
            type: ammunition.damageType,
            note: ammunition.notes.join(' '),
          }
        : stats.damage;
      return [
        {
          equipmentId: item.id,
          name: equipmentName(item, definition.name),
          abilityId: mode.abilityId,
          attackPool: attackBreakdown.reduce(
            (sum, line) => sum + line.value,
            0,
          ),
          attackBreakdown,
          speed: stats.speed,
          accuracy: stats.accuracy,
          damage,
          damageTotal:
            (damage.attribute === 'strength'
              ? character.attributes.physical.strength
              : 0) + damage.modifier,
          defense: stats.defense,
          rate: stats.rate,
          range: stats.range,
          notes: [
            ...stats.notes,
            ...quality.breakdown,
            ...resolved.breakdown.slice(1),
            ...(ammunition?.notes ?? []),
          ],
          source: definition.source,
        },
      ];
    });
}

export function calculateProtection(
  character: Exalted1eCharacter,
): ProtectionSummary {
  const stamina = character.attributes.physical.stamina;
  const naturalBashing = stamina;
  const naturalLethal = Math.floor(stamina / 2);
  let armorBashing = 0;
  let armorLethal = 0;
  let mobilityPenalty = 0;
  let fatigue = 0;
  const breakdown = [
    `Natural bashing soak: Stamina ${stamina}`,
    `Natural lethal soak: half Stamina ${naturalLethal}`,
  ];
  const equippedArmor = character.equipment.armor.filter(
    (entry) => entry.equipped && entry.definitionId,
  );
  for (const item of equippedArmor.slice(0, 1)) {
    const definition = armorById.get(item.definitionId!);
    if (!definition) continue;
    const resolved = resolveArmorMaterial(
      definition.profiles[character.combat.profile],
      definition.category === 'artifact' ? item.material : 'none',
      character.sheetType,
    );
    armorBashing += resolved.value.bashingSoak;
    armorLethal += resolved.value.lethalSoak;
    mobilityPenalty += resolved.value.mobilityPenalty;
    fatigue = Math.max(fatigue, resolved.value.fatigue);
    breakdown.push(
      `${equipmentName(item, definition.name)}: ${resolved.value.lethalSoak}L/${resolved.value.bashingSoak}B`,
      ...resolved.breakdown.slice(1),
    );
  }
  if (equippedArmor.length > 1) {
    breakdown.push(
      'Multiple armor suits are marked equipped; only the first is included.',
    );
  }
  return {
    naturalBashing,
    naturalLethal,
    armorBashing,
    armorLethal,
    finalBashing: naturalBashing + armorBashing,
    finalLethal: naturalLethal + armorLethal,
    mobilityPenalty,
    fatigue,
    breakdown,
  };
}
