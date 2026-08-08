import { z } from 'zod';
import {
  defaultExaltedSectionGroupOrder,
  dragonBloodedBackgrounds,
  exaltedAbilities,
  exaltedSectionGroupIds,
  exaltedSheetTypes,
  exaltedVirtues,
  solarBackgrounds,
  type ExaltedSectionGroupId,
} from './definitions';
import {
  dragonBloodedTraitById,
  getDragonBloodedTraitRepeatLimit,
  isLegalDragonBloodedTraitCost,
  type ExaltedTraitKind,
} from './reference/dragonblooded-merits-flaws';
import {
  dragonBloodedCharmIds,
  dragonBloodedSpellIds,
} from './reference/dragonblooded-powers';
import { exaltedComboSchema } from './shared/combos/schema';
import {
  combatProfileSchema,
  ownedEquipmentSchema,
} from './shared/equipment/schema';
import {
  ammunitionById,
  armorById,
  weaponById,
} from './shared/equipment/catalog';

const fivePointRating = z.number().int().min(0).max(5);
const attributeRating = z.number().int().min(1).max(5);
const exaltedSectionGroupIdSchema = z.enum(exaltedSectionGroupIds);
const exaltedSectionGroupOrderSchema = z
  .array(exaltedSectionGroupIdSchema)
  .length(exaltedSectionGroupIds.length)
  .refine((order) => new Set(order).size === exaltedSectionGroupIds.length, {
    message: 'Section order must contain every group exactly once.',
  });

const abilitiesShape = Object.fromEntries(
  exaltedAbilities.map((ability) => [ability.id, fivePointRating]),
) as Record<(typeof exaltedAbilities)[number]['id'], typeof fivePointRating>;

const virtuesShape = Object.fromEntries(
  exaltedVirtues.map((virtue) => [virtue.id, fivePointRating]),
) as Record<(typeof exaltedVirtues)[number]['id'], typeof fivePointRating>;

export const exaltedAbilityIdSchema = z.enum(
  exaltedAbilities.map((ability) => ability.id),
);

export const exaltedBackgroundIdSchema = z.enum(
  Array.from(
    new Set(
      [...solarBackgrounds, ...dragonBloodedBackgrounds].map(
        (background) => background.id,
      ),
    ),
  ),
);

const solarBackgroundIds = new Set<string>(
  solarBackgrounds.map((background) => background.id),
);
const dragonBloodedBackgroundIds = new Set<string>(
  dragonBloodedBackgrounds.map((background) => background.id),
);

const selectedTraitSchema = z.object({
  id: z.string().uuid(),
  definitionId: z.string(),
  chosenCost: z.number().int().nonnegative(),
  choiceLabel: z.string(),
  notes: z.string(),
});

export const exalted1eCharacterSchema = z
  .object({
    sheetType: z.enum(exaltedSheetTypes),
    identity: z.object({
      name: z.string(),
      player: z.string(),
      concept: z.string(),
      nature: z.string(),
      caste: z.string(),
      aspect: z.string(),
      house: z.string(),
      anima: z.string(),
    }),
    attributes: z.object({
      physical: z.object({
        strength: attributeRating,
        dexterity: attributeRating,
        stamina: attributeRating,
      }),
      social: z.object({
        charisma: attributeRating,
        manipulation: attributeRating,
        appearance: attributeRating,
      }),
      mental: z.object({
        perception: attributeRating,
        intelligence: attributeRating,
        wits: attributeRating,
      }),
    }),
    abilities: z.object(abilitiesShape),
    favoredAbilities: z.array(exaltedAbilityIdSchema),
    backgrounds: z.array(
      z.object({
        id: z.string().uuid(),
        definitionId: exaltedBackgroundIdSchema,
        rating: fivePointRating,
        notes: z.string(),
      }),
    ),
    virtues: z.object(virtuesShape),
    willpower: z.object({
      permanent: z.number().int().min(0).max(10),
      temporary: z.number().int().min(0).max(10),
    }),
    essence: z.object({
      rating: z.number().int().min(1).max(6),
      personal: z.number().int().min(0).max(999),
      peripheral: z.number().int().min(0).max(999),
      committed: z.number().int().min(0).max(999),
    }),
    limit: z.object({
      rating: z.number().int().min(0).max(10),
      virtueFlaw: z.string(),
    }),
    meritsFlaws: z.object({
      merits: z.array(selectedTraitSchema),
      flaws: z.array(selectedTraitSchema),
    }),
    powers: z.object({
      charms: z.array(
        z.object({
          id: z.string().uuid(),
          definitionId: z.string(),
          notes: z.string(),
        }),
      ),
      spells: z.array(
        z.object({
          id: z.string().uuid(),
          definitionId: z.string(),
          notes: z.string(),
        }),
      ),
    }),
    equipment: z.object({
      weapons: z.array(ownedEquipmentSchema),
      armor: z.array(ownedEquipmentSchema),
      shields: z.array(ownedEquipmentSchema),
      ammunition: z.array(ownedEquipmentSchema),
    }),
    combat: z.object({
      profile: combatProfileSchema,
      specialties: z.array(
        z.object({
          id: z.string().uuid(),
          abilityId: exaltedAbilityIdSchema,
          label: z.string(),
          rating: z.number().int().min(1).max(3),
        }),
      ),
      woundPenalty: z.number().int().max(0).min(-4),
      staticInitiativeModifier: z.number().int().min(-99).max(99),
      staticDodgeModifier: z.number().int().min(-99).max(99),
    }),
    combos: z.array(exaltedComboSchema),
    notes: z.object({
      anima: z.string(),
      weapons: z.string(),
      experience: z.string(),
    }),
    sheetLayout: z.object({
      groupOrder: exaltedSectionGroupOrderSchema,
    }),
  })
  .superRefine((character, context) => {
    const equipmentGroups = [
      ['weapons', 'weapon', weaponById] as const,
      ['armor', 'armor', armorById] as const,
      ['shields', 'shield', new Map<string, unknown>()] as const,
      ['ammunition', 'ammunition', ammunitionById] as const,
    ];
    for (const [group, expectedKind, definitions] of equipmentGroups) {
      character.equipment[group].forEach((item, index) => {
        if (item.kind !== expectedKind) {
          context.addIssue({
            code: 'custom',
            message: `Expected ${expectedKind} equipment.`,
            path: ['equipment', group, index, 'kind'],
          });
        }
        if (item.definitionId && !definitions.has(item.definitionId)) {
          context.addIssue({
            code: 'custom',
            message: `Unknown ${expectedKind} definition.`,
            path: ['equipment', group, index, 'definitionId'],
          });
        }
        if (!item.definitionId && !item.customName.trim()) {
          context.addIssue({
            code: 'custom',
            message: 'Custom equipment requires a name.',
            path: ['equipment', group, index, 'customName'],
          });
        }
      });
    }
    character.combos.forEach((combo, index) => {
      if (new Set(combo.charmIds).size !== combo.charmIds.length) {
        context.addIssue({
          code: 'custom',
          message: 'A Combo cannot include the same Charm twice.',
          path: ['combos', index, 'charmIds'],
        });
      }
      if (character.sheetType === 'dragon-blooded') {
        combo.charmIds.forEach((charmId) => {
          if (!dragonBloodedCharmIds.has(charmId)) {
            context.addIssue({
              code: 'custom',
              message: 'Unknown Dragon-Blooded Charm in Combo.',
              path: ['combos', index, 'charmIds'],
            });
          }
        });
      }
    });
    const allowedBackgroundIds =
      character.sheetType === 'solar'
        ? solarBackgroundIds
        : dragonBloodedBackgroundIds;
    character.backgrounds.forEach((background, index) => {
      if (!allowedBackgroundIds.has(background.definitionId)) {
        context.addIssue({
          code: 'custom',
          message: `Background is not available to ${character.sheetType} sheets.`,
          path: ['backgrounds', index, 'definitionId'],
        });
      }
    });
    character.powers.charms.forEach((selection, index) => {
      if (!dragonBloodedCharmIds.has(selection.definitionId)) {
        context.addIssue({
          code: 'custom',
          message: 'Unknown Dragon-Blooded Charm definition.',
          path: ['powers', 'charms', index, 'definitionId'],
        });
      }
    });
    character.powers.spells.forEach((selection, index) => {
      if (!dragonBloodedSpellIds.has(selection.definitionId)) {
        context.addIssue({
          code: 'custom',
          message: 'Unknown Dragon-Blooded spell definition.',
          path: ['powers', 'spells', index, 'definitionId'],
        });
      }
    });
    const validateTraitSelections = (
      kind: ExaltedTraitKind,
      selections: typeof character.meritsFlaws.merits,
    ) => {
      const pathKey = kind === 'merit' ? 'merits' : 'flaws';
      const definitionCounts = new Map<string, number>();
      selections.forEach((selection, index) => {
        const definition = dragonBloodedTraitById.get(selection.definitionId);
        if (!definition || definition.kind !== kind) {
          context.addIssue({
            code: 'custom',
            message: `Unknown Dragon-Blooded ${kind} definition.`,
            path: ['meritsFlaws', pathKey, index, 'definitionId'],
          });
          return;
        }
        if (!isLegalDragonBloodedTraitCost(definition, selection.chosenCost)) {
          context.addIssue({
            code: 'custom',
            message: `Chosen cost is not legal for ${definition.name}.`,
            path: ['meritsFlaws', pathKey, index, 'chosenCost'],
          });
        }
        definitionCounts.set(
          definition.id,
          (definitionCounts.get(definition.id) ?? 0) + 1,
        );
      });
      definitionCounts.forEach((count, definitionId) => {
        const limit = getDragonBloodedTraitRepeatLimit(definitionId);
        if (limit !== undefined && count > limit) {
          context.addIssue({
            code: 'custom',
            message: `Trait may be selected no more than ${limit} time${limit === 1 ? '' : 's'}.`,
            path: ['meritsFlaws', pathKey],
          });
        }
      });
    };
    validateTraitSelections('merit', character.meritsFlaws.merits);
    validateTraitSelections('flaw', character.meritsFlaws.flaws);
    const derangements = character.meritsFlaws.flaws.filter(
      ({ definitionId }) => definitionId === 'derangement',
    );
    if (
      derangements.length > 0 &&
      (derangements.filter(({ chosenCost }) => chosenCost === 3).length !== 1 ||
        derangements.some(({ chosenCost }) => ![1, 3].includes(chosenCost)))
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'The first Derangement is worth 3 points; additional Derangements are worth 1 point each.',
        path: ['meritsFlaws', 'flaws'],
      });
    }
    if (
      character.sheetType === 'solar' &&
      (character.powers.charms.length > 0 ||
        character.powers.spells.length > 0 ||
        character.meritsFlaws.merits.length > 0 ||
        character.meritsFlaws.flaws.length > 0)
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'Dragon-Blooded-only records are not available on Solar sheets.',
        path: ['sheetType'],
      });
    }
  });

export type Exalted1eCharacter = z.infer<typeof exalted1eCharacterSchema>;

export function migrateExalted1eCharacter(data: unknown, fromVersion: number) {
  let candidate = data;
  if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
    let recordCandidate = candidate as Record<string, unknown>;
    if (fromVersion < 2) {
      recordCandidate = {
        ...recordCandidate,
        sheetLayout: {
          groupOrder: [...defaultExaltedSectionGroupOrder],
        },
      };
    }
    if (fromVersion < 3) {
      recordCandidate = {
        ...recordCandidate,
        powers: { charms: [], spells: [] },
      };
    }
    if (fromVersion < 4) {
      recordCandidate = {
        ...recordCandidate,
        meritsFlaws: { merits: [], flaws: [] },
      };
    }
    if (fromVersion < 5) {
      const storedOrder = (
        recordCandidate.sheetLayout as { groupOrder?: unknown } | undefined
      )?.groupOrder;
      const previousOrder = Array.isArray(storedOrder)
        ? storedOrder.filter(
            (id): id is Exclude<ExaltedSectionGroupId, 'combat'> =>
              typeof id === 'string' &&
              id !== 'combat' &&
              exaltedSectionGroupIds.includes(id as ExaltedSectionGroupId),
          )
        : [];
      const recordsIndex = previousOrder.indexOf('records');
      const migratedOrder: ExaltedSectionGroupId[] = [...previousOrder];
      migratedOrder.splice(
        recordsIndex < 0 ? migratedOrder.length : recordsIndex,
        0,
        'combat',
      );
      recordCandidate = {
        ...recordCandidate,
        equipment: { weapons: [], armor: [], shields: [], ammunition: [] },
        combat: {
          profile: 'classic',
          specialties: [],
          woundPenalty: 0,
          staticInitiativeModifier: 0,
          staticDodgeModifier: 0,
        },
        combos: [],
        sheetLayout: {
          groupOrder:
            migratedOrder.length === exaltedSectionGroupIds.length
              ? migratedOrder
              : [...defaultExaltedSectionGroupOrder],
        },
      };
    }
    candidate = recordCandidate;
  }
  return exalted1eCharacterSchema.parse(candidate);
}
