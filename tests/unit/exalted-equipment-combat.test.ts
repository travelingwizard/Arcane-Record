import { describe, expect, it } from 'vitest';
import { createBlankExaltedCharacter } from '../../src/games/exalted1e/create-character';
import {
  exaltedAmmunitionCatalog,
  exaltedArmorCatalog,
  exaltedWeaponCatalog,
  weaponById,
} from '../../src/games/exalted1e/shared/equipment/catalog';
import {
  calculateAttacks,
  calculateProtection,
} from '../../src/games/exalted1e/shared/combat/calculations';
import {
  resolveArmorMaterial,
  resolveWeaponMaterial,
} from '../../src/games/exalted1e/shared/equipment/resolvers';
import type { OwnedEquipment } from '../../src/games/exalted1e/shared/equipment/types';

function owned(kind: 'weapon' | 'armor', definitionId: string): OwnedEquipment {
  return {
    id: crypto.randomUUID(),
    kind,
    definitionId,
    customName: '',
    modeId: 'melee',
    quality: 'normal' as const,
    qualityAdjustments: {
      speed: 0,
      accuracy: 0,
      damage: 0,
      defense: 0,
      rate: 0,
      range: 0,
    },
    material: 'none' as const,
    equipped: true,
    attuned: false,
    committedEssence: 0,
    ammunition: { current: null, typeId: null },
    enhancements: [],
    notes: '',
  };
}

describe('shared Exalted equipment and combat', () => {
  it('has stable unique IDs, source citations, and separate profile records', () => {
    for (const catalog of [
      exaltedWeaponCatalog,
      exaltedArmorCatalog,
      exaltedAmmunitionCatalog,
    ]) {
      expect(new Set(catalog.map(({ id }) => id))).toHaveLength(catalog.length);
      expect(
        catalog.every(({ source }) => source.book && source.page > 0),
      ).toBe(true);
    }
    const sword = weaponById.get('straight-sword')!;
    expect(sword.modes[0]?.profiles.classic).not.toBe(
      sword.modes[0]?.profiles['power-combat'],
    );
    expect(sword.modes[0]?.profiles.classic?.speed).toBe(0);
    expect(sword.modes[0]?.profiles['power-combat']?.speed).toBe(4);
  });

  it('models a javelin as one definition with melee and thrown modes', () => {
    expect(weaponById.get('javelin')?.modes.map(({ id }) => id)).toEqual([
      'melee',
      'thrown',
    ]);
  });

  it('switches profiles without changing character-owned equipment', () => {
    const character = createBlankExaltedCharacter('solar');
    character.attributes.physical.dexterity = 4;
    character.abilities.melee = 3;
    character.equipment.weapons.push(owned('weapon', 'straight-sword'));
    const classic = calculateAttacks(character).find(
      ({ equipmentId }) => !equipmentId.startsWith('natural'),
    )!;
    character.combat.profile = 'power-combat';
    const power = calculateAttacks(character).find(
      ({ equipmentId }) => !equipmentId.startsWith('natural'),
    )!;
    expect(classic.speed).toBe(0);
    expect(power.speed).toBe(4);
    expect(power.attackPool).toBeGreaterThan(classic.attackPool);
    expect(character.equipment.weapons).toHaveLength(1);
  });

  it('applies recorded quality allocations without inventing a default allocation', () => {
    const character = createBlankExaltedCharacter('solar');
    const sword = owned('weapon', 'straight-sword');
    sword.quality = 'exceptional';
    sword.qualityAdjustments.accuracy = 1;
    sword.qualityAdjustments.damage = 1;
    character.equipment.weapons.push(sword);
    const attack = calculateAttacks(character).find(
      ({ equipmentId }) => equipmentId === sword.id,
    )!;
    expect(attack.accuracy).toBe(2);
    expect(attack.damageTotal).toBe(5);
    expect(attack.notes.join(' ')).toMatch(/exceptional quality allocation/i);
  });

  it('calculates breakdowns, armor, ammunition, and sourced material affinities', () => {
    const character = createBlankExaltedCharacter('dragon-blooded');
    character.identity.aspect = 'Earth';
    character.attributes.physical.dexterity = 4;
    character.attributes.physical.strength = 3;
    character.abilities.archery = 3;
    character.combat.specialties.push({
      id: crypto.randomUUID(),
      abilityId: 'archery',
      label: 'Long Bow',
      rating: 2,
    });
    const bow = owned('weapon', 'long-bow');
    bow.ammunition.typeId = 'frog-crotch-arrow';
    character.equipment.weapons.push(bow);
    const attack = calculateAttacks(character).find(
      ({ name }) => name === 'Long Bow',
    )!;
    expect(attack.attackPool).toBe(10);
    expect(attack.damageTotal).toBe(7);
    expect(attack.notes.join(' ')).toMatch(/armor lethal soak/i);

    const plate = owned('armor', 'artifact-articulated-plate');
    plate.material = 'jade';
    character.equipment.armor.push(plate);
    expect(calculateProtection(character)).toMatchObject({
      armorLethal: 12,
      armorBashing: 14,
      fatigue: 0,
    });

    const weaponStats = weaponById.get('daiklave')!.modes[0]!.profiles.classic!;
    expect(
      resolveWeaponMaterial(weaponStats, 'jade', 'dragon-blooded').value.speed,
    ).toBe(6);
    expect(
      resolveWeaponMaterial(weaponStats, 'jade', 'solar').value.speed,
    ).toBe(3);
    expect(
      resolveArmorMaterial(
        {
          lethalSoak: 6,
          bashingSoak: 4,
          mobilityPenalty: 0,
          fatigue: 0,
          commitment: 2,
        },
        'orichalcum',
        'solar',
      ).value.lethalSoak,
    ).toBe(8);
  });
});
