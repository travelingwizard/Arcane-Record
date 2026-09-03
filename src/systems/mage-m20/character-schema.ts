import { z } from 'zod';
import { backgroundRatingRules } from './background-rules';
import {
  createDefaultAbilityRatings,
  createDefaultEnlightenment,
} from './create-character';
import { MAGE_SCHEMA_VERSION, MAGE_SYSTEM_ID, spheres } from './definitions';
import { mageDevelopmentSchema } from '../../games/mage20/development/schema';
import { mageSourcePreferencesSchema } from '../../games/mage20/supplements/sources';
import { mageTraitChoiceSchema } from '../../games/mage20/supplements/trait-choice';
import { developmentFor } from '../../games/mage20/development/rules';
import {
  characterSectionGroupIds,
  defaultGroupOrderByMode,
} from './character-sections';
import { backgroundById, backgroundCatalog } from './reference/backgrounds';
import { equipmentById, equipmentCategorySchema } from './reference/equipment';
import { focusDefinitionsByKind, type FocusKind } from './reference/focus';
import { combatManeuverById, doManeuverById } from './reference/maneuvers';
import { meritFlawById, type MeritFlawKind } from './reference/merits-flaws';
import { roteById } from './reference/rotes';
import { wonderById } from './reference/wonders';

const attributeRating = z.number().int().min(1).max(5);
const fivePointRating = z.number().int().min(0).max(5);
const tenPointRating = z.number().int().min(0).max(10);
const twentyPointRating = z.number().int().min(0).max(20);
const uuid = z.string().uuid();

const identitySchema = z.object({
  name: z.string(),
  player: z.string(),
  chronicle: z.string(),
  nature: z.string(),
  demeanor: z.string(),
  essence: z.string(),
  affiliation: z.string(),
  sect: z.string(),
  concept: z.string(),
});

const attributesSchema = z.object({
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
});

const legacyAbilitiesSchemaV6 = z.object({
  talents: z.object({
    alertness: fivePointRating,
    art: fivePointRating,
    athletics: fivePointRating,
    awareness: fivePointRating,
    brawl: fivePointRating,
    empathy: fivePointRating,
    expression: fivePointRating,
    intimidation: fivePointRating,
    leadership: fivePointRating,
    streetwise: fivePointRating,
    subterfuge: fivePointRating,
  }),
  skills: z.object({
    crafts: fivePointRating,
    drive: fivePointRating,
    etiquette: fivePointRating,
    firearms: fivePointRating,
    martialArts: fivePointRating,
    meditation: fivePointRating,
    melee: fivePointRating,
    research: fivePointRating,
    stealth: fivePointRating,
    survival: fivePointRating,
    technology: fivePointRating,
  }),
  knowledges: z.object({
    academics: fivePointRating,
    computer: fivePointRating,
    cosmology: fivePointRating,
    enigmas: fivePointRating,
    esoterica: fivePointRating,
    investigation: fivePointRating,
    law: fivePointRating,
    medicine: fivePointRating,
    occult: fivePointRating,
    politics: fivePointRating,
    science: fivePointRating,
  }),
});

const abilitiesSchema = legacyAbilitiesSchemaV6.extend({
  skills: legacyAbilitiesSchemaV6.shape.skills.extend({
    do: fivePointRating,
  }),
});

const spheresSchema = z.object({
  correspondence: fivePointRating,
  entropy: fivePointRating,
  forces: fivePointRating,
  life: fivePointRating,
  matter: fivePointRating,
  mind: fivePointRating,
  prime: fivePointRating,
  spirit: fivePointRating,
  time: fivePointRating,
});

export const sphereIdSchema = z.enum(spheres.map(({ id }) => id));

const legacyRatedBackgroundSchema = z.object({
  id: uuid,
  label: z.string(),
  rating: fivePointRating,
});

const legacyRepeatableEntriesSchema = z.object({
  backgrounds: z.array(legacyRatedBackgroundSchema),
  merits: z.array(
    z.object({
      id: uuid,
      label: z.string(),
      cost: z.number().int().nonnegative().nullable(),
    }),
  ),
  flaws: z.array(
    z.object({
      id: uuid,
      label: z.string(),
      cost: z.number().int().nonnegative().nullable(),
    }),
  ),
  focus: z.array(z.string()),
  wonders: z.array(z.string()),
  rotes: z.array(
    z.object({ id: uuid, spheres: z.string(), effect: z.string() }),
  ),
});

function selectedMeritFlawSchema(expectedKind: MeritFlawKind) {
  return z
    .object({
      id: uuid,
      definitionId: z.string().min(1),
      chosenCost: z.number().int().positive(),
      notes: z.string(),
      addedAt: z.string().datetime(),
      kind: z.enum(['merit', 'flaw']).optional(),
      choice: mageTraitChoiceSchema.optional(),
    })
    .superRefine((selection, context) => {
      if (selection.kind && selection.kind !== expectedKind) {
        context.addIssue({
          code: 'custom',
          path: ['kind'],
          message: `Selection kind must be ${expectedKind}.`,
        });
      }
      const definition = meritFlawById.get(selection.definitionId);
      if (!definition) {
        return;
      }
      if (definition.kind !== expectedKind) {
        context.addIssue({
          code: 'custom',
          path: ['definitionId'],
          message: `Definition is not a ${expectedKind}.`,
        });
      }
      if (!definition.allowedCosts.includes(selection.chosenCost)) {
        context.addIssue({
          code: 'custom',
          path: ['chosenCost'],
          message: 'Chosen cost is not allowed for this definition.',
        });
      }
    })
    .transform((selection) => ({
      id: selection.id,
      definitionId: selection.definitionId,
      chosenCost: selection.chosenCost,
      ...(selection.choice ? { choice: selection.choice } : {}),
      notes: selection.notes,
      addedAt: selection.addedAt,
    }));
}

const selectedBackgroundSchema = z
  .object({
    id: uuid,
    definitionId: z.string().min(1),
    displayName: z.string(),
    rating: z
      .number()
      .int()
      .min(0)
      .max(backgroundRatingRules.extendedInterfaceMaximum),
    notes: z.string(),
    addedAt: z.string().datetime(),
    pooled: z.boolean().optional().default(false),
    unresolvedDefinitionName: z.string().optional(),
  })
  .superRefine((selection, context) => {
    const definition = backgroundById.get(selection.definitionId);
    if (!definition) {
      return;
    }
    const maximum = definition.supportsRatingsAboveFive
      ? backgroundRatingRules.extendedInterfaceMaximum
      : definition.standardMaximumRating;
    if (
      selection.rating < definition.minimumRating ||
      selection.rating > maximum
    ) {
      context.addIssue({
        code: 'custom',
        path: ['rating'],
        message: 'Rating is not allowed for this Background definition.',
      });
    }
    if (selection.pooled && !definition.canBePooled) {
      context.addIssue({
        code: 'custom',
        path: ['pooled'],
        message: 'This Background cannot be pooled.',
      });
    }
  });

const legacyRepeatableEntriesSchemaV4 = z.object({
  backgrounds: z.array(legacyRatedBackgroundSchema),
  merits: z.array(selectedMeritFlawSchema('merit')),
  flaws: z.array(selectedMeritFlawSchema('flaw')),
  focus: z.array(z.string()),
  wonders: z.array(z.string()),
  rotes: z.array(
    z.object({ id: uuid, spheres: z.string(), effect: z.string() }),
  ),
});

const legacyRepeatableEntriesSchemaV5 = z
  .object({
    backgrounds: z.array(selectedBackgroundSchema),
    merits: z.array(selectedMeritFlawSchema('merit')),
    flaws: z.array(selectedMeritFlawSchema('flaw')),
    focus: z.array(z.string()),
    wonders: z.array(z.string()),
    rotes: z.array(
      z.object({ id: uuid, spheres: z.string(), effect: z.string() }),
    ),
  })
  .superRefine((entries, context) => {
    const backgroundSelectionIds = new Set<string>();
    const backgroundDefinitionIds = new Set<string>();
    entries.backgrounds.forEach((selection, index) => {
      if (backgroundSelectionIds.has(selection.id)) {
        context.addIssue({
          code: 'custom',
          path: ['backgrounds', index, 'id'],
          message: 'Background selection IDs must be unique.',
        });
      }
      const definition = backgroundById.get(selection.definitionId);
      if (
        definition &&
        !definition.canBeSelectedMultipleTimes &&
        backgroundDefinitionIds.has(definition.id)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['backgrounds', index, 'definitionId'],
          message: 'This Background may only be selected once.',
        });
      }
      backgroundSelectionIds.add(selection.id);
      if (definition) {
        backgroundDefinitionIds.add(definition.id);
      }
    });

    const selectionIds = new Set<string>();
    const definitionIds = new Set<string>();
    for (const [kind, selections] of [
      ['merits', entries.merits],
      ['flaws', entries.flaws],
    ] as const) {
      selections.forEach((selection, index) => {
        if (selectionIds.has(selection.id)) {
          context.addIssue({
            code: 'custom',
            path: [kind, index, 'id'],
            message: 'Selection IDs must be unique.',
          });
        }
        if (definitionIds.has(selection.definitionId)) {
          context.addIssue({
            code: 'custom',
            path: [kind, index, 'definitionId'],
            message: 'A definition may only be selected once.',
          });
        }
        selectionIds.add(selection.id);
        definitionIds.add(selection.definitionId);
      });
    }
  });

const focusSelectionFields = {
  id: uuid,
  definitionId: z.string().min(1).optional(),
  customName: z.string().optional(),
  notes: z.string(),
  addedAt: z.string().datetime(),
  unresolvedDefinitionName: z.string().optional(),
};

function validateFocusSelection(
  expectedKind: FocusKind,
  selection: { definitionId?: string; customName?: string },
  context: z.RefinementCtx,
) {
  if (!selection.definitionId && selection.customName === undefined) {
    context.addIssue({
      code: 'custom',
      path: ['customName'],
      message: 'A catalog definition or custom name is required.',
    });
  }
  if (selection.definitionId && selection.customName) {
    context.addIssue({
      code: 'custom',
      path: ['customName'],
      message: 'Catalog selections must not also store a custom name.',
    });
  }
  if (!selection.definitionId) {
    return;
  }
  const expectedDefinition = focusDefinitionsByKind[expectedKind].get(
    selection.definitionId,
  );
  if (expectedDefinition) {
    return;
  }
  const belongsToAnotherKind = (
    Object.entries(focusDefinitionsByKind) as Array<
      [FocusKind, Map<string, { id: string }>]
    >
  ).some(
    ([kind, definitions]) =>
      kind !== expectedKind && definitions.has(selection.definitionId!),
  );
  if (belongsToAnotherKind) {
    context.addIssue({
      code: 'custom',
      path: ['definitionId'],
      message: `Definition is not a ${expectedKind}.`,
    });
  }
}

const paradigmSelectionSchema = z
  .object(focusSelectionFields)
  .superRefine((selection, context) =>
    validateFocusSelection('paradigm', selection, context),
  );
const practiceSelectionSchema = z
  .object(focusSelectionFields)
  .superRefine((selection, context) =>
    validateFocusSelection('practice', selection, context),
  );
const instrumentSelectionSchema = z
  .object({ ...focusSelectionFields, significant: z.boolean() })
  .superRefine((selection, context) =>
    validateFocusSelection('instrument', selection, context),
  );

const focusDataSchema = z.object({
  paradigms: z.array(paradigmSelectionSchema),
  practices: z.array(practiceSelectionSchema),
  instruments: z.array(instrumentSelectionSchema),
  need: z.string(),
  culture: z.string(),
  notes: z.string(),
});

const ownedWonderSchema = z.object({
  id: uuid,
  definitionId: z.string().min(1).optional(),
  name: z.string(),
  typeLabel: z.string(),
  rating: z.number().int().min(0).max(10).nullable(),
  powers: z.string(),
  notes: z.string(),
  addedAt: z.string().datetime(),
  unresolvedDefinitionName: z.string().optional(),
});

const sphereRequirementSchema = z
  .object({
    sphereId: z.union([sphereIdSchema, z.literal('data'), z.literal('other')]),
    minimum: z.number().int().min(1).max(10),
    maximum: z.number().int().min(1).max(10).optional(),
    label: z.string().optional(),
  })
  .superRefine((requirement, context) => {
    if (
      requirement.maximum !== undefined &&
      requirement.maximum < requirement.minimum
    ) {
      context.addIssue({
        code: 'custom',
        path: ['maximum'],
        message: 'Maximum rank must not be below the minimum.',
      });
    }
    if (requirement.sphereId === 'other' && !requirement.label?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['label'],
        message: 'Other requirements need a label.',
      });
    }
  });

const knownRoteSchema = z.object({
  id: uuid,
  definitionId: z.string().min(1).optional(),
  name: z.string(),
  sphereRequirements: z.array(sphereRequirementSchema),
  requirementNotes: z.string(),
  effect: z.string(),
  focusNotes: z.string(),
  notes: z.string(),
  addedAt: z.string().datetime(),
  unresolvedDefinitionName: z.string().optional(),
});

const legacyRepeatableEntriesSchemaV6 = z
  .object({
    backgrounds: z.array(selectedBackgroundSchema),
    merits: z.array(selectedMeritFlawSchema('merit')),
    flaws: z.array(selectedMeritFlawSchema('flaw')),
    focus: focusDataSchema,
    wonders: z.array(ownedWonderSchema),
    rotes: z.array(knownRoteSchema),
  })
  .superRefine((entries, context) => {
    const backgroundSelectionIds = new Set<string>();
    const backgroundDefinitionIds = new Set<string>();
    entries.backgrounds.forEach((selection, index) => {
      if (backgroundSelectionIds.has(selection.id)) {
        context.addIssue({
          code: 'custom',
          path: ['backgrounds', index, 'id'],
          message: 'Background selection IDs must be unique.',
        });
      }
      const definition = backgroundById.get(selection.definitionId);
      if (
        definition &&
        !definition.canBeSelectedMultipleTimes &&
        backgroundDefinitionIds.has(definition.id)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['backgrounds', index, 'definitionId'],
          message: 'This Background may only be selected once.',
        });
      }
      backgroundSelectionIds.add(selection.id);
      if (definition) {
        backgroundDefinitionIds.add(definition.id);
      }
    });

    const meritFlawSelectionIds = new Set<string>();
    const meritFlawDefinitionIds = new Set<string>();
    for (const [kind, selections] of [
      ['merits', entries.merits],
      ['flaws', entries.flaws],
    ] as const) {
      selections.forEach((selection, index) => {
        if (meritFlawSelectionIds.has(selection.id)) {
          context.addIssue({
            code: 'custom',
            path: [kind, index, 'id'],
            message: 'Selection IDs must be unique.',
          });
        }
        if (meritFlawDefinitionIds.has(selection.definitionId)) {
          context.addIssue({
            code: 'custom',
            path: [kind, index, 'definitionId'],
            message: 'A definition may only be selected once.',
          });
        }
        meritFlawSelectionIds.add(selection.id);
        meritFlawDefinitionIds.add(selection.definitionId);
      });
    }

    const seenIds = new Set<string>();
    const groups = [
      ['focus.paradigms', entries.focus.paradigms],
      ['focus.practices', entries.focus.practices],
      ['focus.instruments', entries.focus.instruments],
      ['wonders', entries.wonders],
      ['rotes', entries.rotes],
    ] as const;
    for (const [path, selections] of groups) {
      selections.forEach((selection, index) => {
        if (seenIds.has(selection.id)) {
          context.addIssue({
            code: 'custom',
            path: [...path.split('.'), index, 'id'],
            message: 'Magick selection IDs must be unique.',
          });
        }
        seenIds.add(selection.id);
      });
    }

    const selectedFocusDefinitions = new Set<string>();
    for (const [path, selections] of [
      ['paradigms', entries.focus.paradigms],
      ['practices', entries.focus.practices],
      ['instruments', entries.focus.instruments],
    ] as const) {
      selections.forEach((selection, index) => {
        if (!selection.definitionId) {
          return;
        }
        if (selectedFocusDefinitions.has(selection.definitionId)) {
          context.addIssue({
            code: 'custom',
            path: ['focus', path, index, 'definitionId'],
            message: 'A Focus definition may only be selected once.',
          });
        }
        selectedFocusDefinitions.add(selection.definitionId);
      });
    }

    for (const [path, selections, definitions] of [
      ['wonders', entries.wonders, wonderById],
      ['rotes', entries.rotes, roteById],
    ] as const) {
      const selectedDefinitions = new Set<string>();
      selections.forEach((selection, index) => {
        if (
          !selection.definitionId ||
          !definitions.has(selection.definitionId)
        ) {
          return;
        }
        if (selectedDefinitions.has(selection.definitionId)) {
          context.addIssue({
            code: 'custom',
            path: [path, index, 'definitionId'],
            message: 'A catalog definition may only be selected once.',
          });
        }
        selectedDefinitions.add(selection.definitionId);
      });
    }
  });

const ownedEquipmentSchema = z.object({
  id: uuid,
  definitionId: z.string().min(1).optional(),
  name: z.string(),
  category: equipmentCategorySchema,
  description: z.string(),
  quantity: z.number().int().min(1).max(999),
  equipped: z.boolean(),
  notes: z.string(),
  addedAt: z.string().datetime(),
  unresolvedDefinitionName: z.string().optional(),
});

const equipmentEntriesSchema = z
  .array(ownedEquipmentSchema)
  .superRefine((entries, context) => {
    const selectionIds = new Set<string>();
    const definitionIds = new Set<string>();
    entries.forEach((entry, index) => {
      if (selectionIds.has(entry.id)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'id'],
          message: 'Equipment selection IDs must be unique.',
        });
      }
      selectionIds.add(entry.id);

      if (!entry.definitionId) {
        return;
      }
      const definition = equipmentById.get(entry.definitionId);
      if (definition && definition.category !== entry.category) {
        context.addIssue({
          code: 'custom',
          path: [index, 'category'],
          message: 'Equipment category must match its catalog definition.',
        });
      }
      if (definition && definitionIds.has(entry.definitionId)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'definitionId'],
          message: 'A catalog equipment definition may only be selected once.',
        });
      }
      if (definition) {
        definitionIds.add(entry.definitionId);
      }
    });
  });

const legacyRepeatableEntriesSchemaV7 = z.intersection(
  legacyRepeatableEntriesSchemaV6,
  z.object({ equipment: equipmentEntriesSchema }),
);

const customCombatManeuverSchema = z.object({
  id: uuid,
  name: z.string(),
  description: z.string(),
  notes: z.string(),
  addedAt: z.string().datetime(),
});

const selectedDoManeuverSchema = z
  .object({
    id: uuid,
    definitionId: z.string().min(1).optional(),
    customName: z.string().optional(),
    customSummary: z.string().optional(),
    customRoll: z.string().optional(),
    customDifficulty: z.string().optional(),
    customDamage: z.string().optional(),
    customActions: z.string().optional(),
    customSourceTitle: z.string().optional(),
    customSourcePage: z.string().optional(),
    notes: z.string(),
    addedAt: z.string().datetime(),
    unresolvedDefinitionName: z.string().optional(),
  })
  .superRefine((selection, context) => {
    if (!selection.definitionId && selection.customName === undefined) {
      context.addIssue({
        code: 'custom',
        path: ['customName'],
        message: 'A catalog definition or custom name is required.',
      });
    }
    if (selection.definitionId && selection.customName) {
      context.addIssue({
        code: 'custom',
        path: ['customName'],
        message: 'Catalog selections must not store a custom name.',
      });
    }
    if (
      selection.definitionId &&
      (selection.customSummary ||
        selection.customRoll ||
        selection.customDifficulty ||
        selection.customDamage ||
        selection.customActions ||
        selection.customSourceTitle ||
        selection.customSourcePage)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['definitionId'],
        message: 'Catalog selections must not store custom rules fields.',
      });
    }
  });

const characterManeuversSchema = z
  .object({
    favoriteCombatManeuverIds: z.array(z.string().min(1)),
    customCombatManeuvers: z.array(customCombatManeuverSchema),
    selectedDoManeuvers: z.array(selectedDoManeuverSchema),
  })
  .superRefine((maneuvers, context) => {
    const favorites = new Set<string>();
    maneuvers.favoriteCombatManeuverIds.forEach((id, index) => {
      if (favorites.has(id)) {
        context.addIssue({
          code: 'custom',
          path: ['favoriteCombatManeuverIds', index],
          message: 'Favorite maneuver IDs must be unique.',
        });
      }
      favorites.add(id);
    });

    const customIds = new Set<string>();
    maneuvers.customCombatManeuvers.forEach((entry, index) => {
      if (customIds.has(entry.id)) {
        context.addIssue({
          code: 'custom',
          path: ['customCombatManeuvers', index, 'id'],
          message: 'Custom combat maneuver IDs must be unique.',
        });
      }
      customIds.add(entry.id);
    });

    const selectionIds = new Set<string>();
    const definitionIds = new Set<string>();
    maneuvers.selectedDoManeuvers.forEach((selection, index) => {
      if (selectionIds.has(selection.id)) {
        context.addIssue({
          code: 'custom',
          path: ['selectedDoManeuvers', index, 'id'],
          message: 'Selected Do maneuver IDs must be unique.',
        });
      }
      selectionIds.add(selection.id);
      if (
        selection.definitionId &&
        doManeuverById.has(selection.definitionId)
      ) {
        if (definitionIds.has(selection.definitionId)) {
          context.addIssue({
            code: 'custom',
            path: ['selectedDoManeuvers', index, 'definitionId'],
            message: 'A Do maneuver definition may only be selected once.',
          });
        }
        definitionIds.add(selection.definitionId);
      }
    });

    maneuvers.favoriteCombatManeuverIds.forEach((id, index) => {
      if (
        !combatManeuverById.has(id) &&
        !customIds.has(id) &&
        !id.startsWith('combat-')
      ) {
        context.addIssue({
          code: 'custom',
          path: ['favoriteCombatManeuverIds', index],
          message: 'Favorite ID must reference combat maneuver data.',
        });
      }
    });
  });

const repeatableEntriesSchema = z.intersection(
  legacyRepeatableEntriesSchemaV7,
  z.object({ maneuvers: characterManeuversSchema }),
);

const healthSchema = z.object({
  damage: z.array(z.enum(['bashing', 'lethal', 'aggravated'])).max(7),
});
const experienceSchema = z.object({
  total: z.number().int().nonnegative(),
  current: z.number().int().nonnegative(),
});

const sheetLayoutModeSchema = z.enum(['build', 'play']);
const sectionGroupIdSchema = z.enum([
  'character',
  'traits',
  'magick',
  'advantages',
  'condition',
  'gear',
  'paradigm',
  'records',
]);
const groupOrderSchema = z
  .array(sectionGroupIdSchema)
  .length(characterSectionGroupIds.length)
  .superRefine((order, context) => {
    if (new Set(order).size !== characterSectionGroupIds.length) {
      context.addIssue({
        code: 'custom',
        message: 'Each sheet group must appear exactly once.',
      });
    }
  });
const sheetLayoutSchema = z.object({
  mode: sheetLayoutModeSchema,
  groupOrders: z.object({ build: groupOrderSchema, play: groupOrderSchema }),
});

const legacyCommonFields = {
  id: uuid,
  systemId: z.literal(MAGE_SYSTEM_ID),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  identity: identitySchema,
  attributes: attributesSchema,
  spheres: spheresSchema,
  repeatableEntries: legacyRepeatableEntriesSchema,
  health: healthSchema,
};

const commonFields = {
  ...legacyCommonFields,
  repeatableEntries: repeatableEntriesSchema,
};

const versionSixCommonFields = {
  ...legacyCommonFields,
  repeatableEntries: legacyRepeatableEntriesSchemaV6,
};

const versionSevenCommonFields = {
  ...legacyCommonFields,
  repeatableEntries: legacyRepeatableEntriesSchemaV7,
};

const versionFiveCommonFields = {
  ...legacyCommonFields,
  repeatableEntries: legacyRepeatableEntriesSchemaV5,
};

const versionFourCommonFields = {
  ...legacyCommonFields,
  repeatableEntries: legacyRepeatableEntriesSchemaV4,
};

export const legacyMageCharacterSchemaV1 = z.object({
  ...legacyCommonFields,
  schemaVersion: z.literal(1),
  affinitySphere: sphereIdSchema.nullable(),
});

export const legacyMageCharacterSchemaV2 = z.object({
  ...legacyCommonFields,
  schemaVersion: z.literal(2),
  abilities: legacyAbilitiesSchemaV6,
  enlightenment: z.object({
    arete: tenPointRating.min(1),
    willpower: tenPointRating.min(1),
    quintessence: tenPointRating,
    paradox: tenPointRating,
  }),
  affinitySphere: sphereIdSchema.nullable(),
});

export const legacyMageCharacterSchemaV3 = z.object({
  ...legacyCommonFields,
  schemaVersion: z.literal(3),
  abilities: legacyAbilitiesSchemaV6,
  enlightenment: z.object({
    arete: tenPointRating.min(1),
    willpower: tenPointRating.min(1),
    willpowerTemporary: tenPointRating,
    quintessence: tenPointRating,
    paradox: tenPointRating,
  }),
  affinitySphere: sphereIdSchema.nullable(),
});

export const legacyMageCharacterSchemaV4 = z.object({
  ...versionFourCommonFields,
  schemaVersion: z.literal(4),
  abilities: legacyAbilitiesSchemaV6,
  enlightenment: z.object({
    arete: tenPointRating.min(1),
    willpower: tenPointRating.min(1),
    willpowerTemporary: tenPointRating,
    quintessence: tenPointRating,
    paradox: tenPointRating,
  }),
  affinitySphere: sphereIdSchema.nullable(),
});

export const legacyMageCharacterSchemaV5 = z.object({
  ...versionFiveCommonFields,
  schemaVersion: z.literal(5),
  abilities: legacyAbilitiesSchemaV6,
  enlightenment: z.object({
    arete: tenPointRating.min(1),
    willpower: tenPointRating.min(1),
    willpowerTemporary: tenPointRating,
    quintessence: tenPointRating,
    paradox: tenPointRating,
  }),
  affinitySphere: sphereIdSchema.nullable(),
});

export const legacyMageCharacterSchemaV6 = z.object({
  ...versionSixCommonFields,
  schemaVersion: z.literal(6),
  abilities: legacyAbilitiesSchemaV6,
  enlightenment: z.object({
    arete: tenPointRating.min(1),
    willpower: tenPointRating.min(1),
    willpowerTemporary: tenPointRating,
    quintessence: tenPointRating,
    paradox: tenPointRating,
  }),
  affinitySphere: sphereIdSchema.nullable(),
});

export const legacyMageCharacterSchemaV7 = z.object({
  ...versionSevenCommonFields,
  schemaVersion: z.literal(7),
  abilities: abilitiesSchema,
  enlightenment: z.object({
    arete: tenPointRating.min(1),
    willpower: tenPointRating.min(1),
    willpowerTemporary: tenPointRating,
    quintessence: tenPointRating,
    paradox: tenPointRating,
  }),
  affinitySphere: sphereIdSchema.nullable(),
});

export const legacyMageCharacterSchemaV8 = z.object({
  ...commonFields,
  schemaVersion: z.literal(8),
  abilities: abilitiesSchema,
  enlightenment: z.object({
    arete: tenPointRating.min(1),
    willpower: tenPointRating.min(1),
    willpowerTemporary: tenPointRating,
    quintessence: tenPointRating,
    paradox: tenPointRating,
  }),
  affinitySphere: sphereIdSchema.nullable(),
});

export const legacyMageCharacterSchemaV9 = z.object({
  ...commonFields,
  schemaVersion: z.literal(9),
  abilities: abilitiesSchema,
  enlightenment: z.object({
    arete: tenPointRating.min(1),
    willpower: tenPointRating.min(1),
    willpowerTemporary: tenPointRating,
    quintessence: tenPointRating,
    paradox: tenPointRating,
  }),
  affinitySphere: sphereIdSchema.nullable(),
  sheetLayout: sheetLayoutSchema,
});

export const mageCharacterSchema = z.object({
  ...commonFields,
  sourcePreferences: mageSourcePreferencesSchema.default({
    enabled: ['mage-20'],
    mature: false,
  }),
  development: mageDevelopmentSchema.default({
    version: 1,
    status: 'manual',
    draft: null,
    baseline: null,
    finalizedAt: null,
    ledger: [],
    backgroundXp: true,
    extraAbilities: [],
    specialties: {},
    details: {},
  }),
  schemaVersion: z.literal(MAGE_SCHEMA_VERSION),
  abilities: abilitiesSchema,
  enlightenment: z.object({
    arete: tenPointRating.min(1),
    willpower: tenPointRating.min(1),
    willpowerTemporary: tenPointRating,
    quintessence: twentyPointRating,
    paradox: twentyPointRating,
  }),
  affinitySphere: sphereIdSchema.nullable(),
  experience: experienceSchema,
  sheetLayout: sheetLayoutSchema,
});

export const mageCharacterDataSchema = mageCharacterSchema.omit({
  id: true,
  systemId: true,
  schemaVersion: true,
  createdAt: true,
  updatedAt: true,
});

function createDefaultSheetLayout() {
  return {
    mode: 'build' as const,
    groupOrders: {
      build: [...defaultGroupOrderByMode.build],
      play: [...defaultGroupOrderByMode.play],
    },
  };
}

function slugifyLegacyBackground(value: string) {
  const slug = value
    .normalize('NFKD')
    .replace(/[“”"'’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return slug || 'background';
}

function migrateLegacyBackgrounds(
  backgrounds: z.infer<typeof legacyRatedBackgroundSchema>[],
  addedAt: string,
) {
  const names = new Map(
    backgroundCatalog.flatMap((definition) =>
      [definition.name, ...definition.aliases].map((name) => [
        name.toLocaleLowerCase(),
        definition,
      ]),
    ),
  );
  const usedSingleDefinitions = new Set<string>();

  return backgrounds.map((background) => {
    const definition = names.get(background.label.trim().toLocaleLowerCase());
    const maximum = definition?.supportsRatingsAboveFive
      ? backgroundRatingRules.extendedInterfaceMaximum
      : definition?.standardMaximumRating;
    const isDuplicate =
      definition &&
      !definition.canBeSelectedMultipleTimes &&
      usedSingleDefinitions.has(definition.id);
    const isKnownAndValid =
      definition &&
      !isDuplicate &&
      background.rating >= definition.minimumRating &&
      background.rating <= (maximum ?? 0);

    if (isKnownAndValid) {
      usedSingleDefinitions.add(definition.id);
    }

    return {
      id: background.id,
      definitionId: isKnownAndValid
        ? definition.id
        : `legacy-${slugifyLegacyBackground(background.label)}`,
      displayName: background.label,
      rating: background.rating,
      notes: '',
      addedAt,
      pooled: false,
      ...(isKnownAndValid
        ? {}
        : { unresolvedDefinitionName: background.label }),
    };
  });
}

function migrateLegacyMagick(
  entries: {
    focus: string[];
    wonders: string[];
    rotes: Array<{ id: string; spheres: string; effect: string }>;
  },
  addedAt: string,
) {
  return {
    focus: {
      paradigms: [],
      practices: [],
      instruments: [],
      need: '',
      culture: '',
      notes: entries.focus.filter(Boolean).join('\n'),
    },
    wonders: entries.wonders.map((name) => ({
      id: crypto.randomUUID(),
      name,
      typeLabel: '',
      rating: null,
      powers: '',
      notes: '',
      addedAt,
    })),
    rotes: entries.rotes.map((rote) => ({
      id: rote.id,
      name: '',
      sphereRequirements: [],
      requirementNotes: rote.spheres,
      effect: rote.effect,
      focusNotes: '',
      notes: '',
      addedAt,
    })),
    equipment: [],
    maneuvers: {
      favoriteCombatManeuverIds: [],
      customCombatManeuvers: [],
      selectedDoManeuvers: [],
    },
  };
}

function migrateLegacyAbilities(
  abilities: z.infer<typeof legacyAbilitiesSchemaV6>,
) {
  return {
    ...abilities,
    skills: {
      ...abilities.skills,
      do: 0,
    },
  };
}

export function migrateMageCharacter(input: unknown) {
  const current = mageCharacterSchema.safeParse(input);
  if (current.success) {
    const hadDevelopment =
      typeof input === 'object' &&
      input !== null &&
      Object.prototype.hasOwnProperty.call(input, 'development');
    return hadDevelopment
      ? current.data
      : mageCharacterSchema.parse({
          ...current.data,
          development: developmentFor({
            ...current.data,
            development: undefined,
          }),
        });
  }

  const versionTwelve = mageCharacterSchema
    .extend({ schemaVersion: z.literal(12) })
    .safeParse(input);
  if (versionTwelve.success)
    return mageCharacterSchema.parse({
      ...versionTwelve.data,
      schemaVersion: MAGE_SCHEMA_VERSION,
    });

  const versionEleven = mageCharacterSchema
    .extend({ schemaVersion: z.literal(11) })
    .safeParse(input);
  if (versionEleven.success)
    return mageCharacterSchema.parse({
      ...versionEleven.data,
      schemaVersion: MAGE_SCHEMA_VERSION,
    });

  const versionTen = mageCharacterSchema
    .extend({ schemaVersion: z.literal(10) })
    .safeParse(input);
  if (versionTen.success) {
    return mageCharacterSchema.parse({
      ...versionTen.data,
      schemaVersion: MAGE_SCHEMA_VERSION,
      development: developmentFor({
        ...versionTen.data,
        development: undefined,
      }),
    });
  }

  const versionNine = legacyMageCharacterSchemaV9.safeParse(input);
  if (versionNine.success) {
    return mageCharacterSchema.parse({
      ...versionNine.data,
      schemaVersion: MAGE_SCHEMA_VERSION,
      experience: { total: 0, current: 0 },
    });
  }

  const versionEight = legacyMageCharacterSchemaV8.safeParse(input);
  if (versionEight.success) {
    return mageCharacterSchema.parse({
      ...versionEight.data,
      schemaVersion: MAGE_SCHEMA_VERSION,
      experience: { total: 0, current: 0 },
      sheetLayout: createDefaultSheetLayout(),
    });
  }

  const versionSeven = legacyMageCharacterSchemaV7.safeParse(input);
  if (versionSeven.success) {
    return mageCharacterSchema.parse({
      ...versionSeven.data,
      schemaVersion: MAGE_SCHEMA_VERSION,
      experience: { total: 0, current: 0 },
      sheetLayout: createDefaultSheetLayout(),
      repeatableEntries: {
        ...versionSeven.data.repeatableEntries,
        maneuvers: {
          favoriteCombatManeuverIds: [],
          customCombatManeuvers: [],
          selectedDoManeuvers: [],
        },
      },
    });
  }

  const versionSix = legacyMageCharacterSchemaV6.safeParse(input);
  if (versionSix.success) {
    return mageCharacterSchema.parse({
      ...versionSix.data,
      schemaVersion: MAGE_SCHEMA_VERSION,
      experience: { total: 0, current: 0 },
      sheetLayout: createDefaultSheetLayout(),
      abilities: migrateLegacyAbilities(versionSix.data.abilities),
      repeatableEntries: {
        ...versionSix.data.repeatableEntries,
        equipment: [],
        maneuvers: {
          favoriteCombatManeuverIds: [],
          customCombatManeuvers: [],
          selectedDoManeuvers: [],
        },
      },
    });
  }

  const versionFive = legacyMageCharacterSchemaV5.safeParse(input);
  if (versionFive.success) {
    return mageCharacterSchema.parse({
      ...versionFive.data,
      schemaVersion: MAGE_SCHEMA_VERSION,
      experience: { total: 0, current: 0 },
      sheetLayout: createDefaultSheetLayout(),
      abilities: migrateLegacyAbilities(versionFive.data.abilities),
      repeatableEntries: {
        ...versionFive.data.repeatableEntries,
        ...migrateLegacyMagick(
          versionFive.data.repeatableEntries,
          versionFive.data.createdAt,
        ),
      },
    });
  }

  const versionFour = legacyMageCharacterSchemaV4.safeParse(input);
  if (versionFour.success) {
    return mageCharacterSchema.parse({
      ...versionFour.data,
      schemaVersion: MAGE_SCHEMA_VERSION,
      experience: { total: 0, current: 0 },
      sheetLayout: createDefaultSheetLayout(),
      abilities: migrateLegacyAbilities(versionFour.data.abilities),
      repeatableEntries: {
        ...versionFour.data.repeatableEntries,
        backgrounds: migrateLegacyBackgrounds(
          versionFour.data.repeatableEntries.backgrounds,
          versionFour.data.createdAt,
        ),
        ...migrateLegacyMagick(
          versionFour.data.repeatableEntries,
          versionFour.data.createdAt,
        ),
      },
    });
  }

  const versionThree = legacyMageCharacterSchemaV3.safeParse(input);
  if (versionThree.success) {
    return mageCharacterSchema.parse({
      ...versionThree.data,
      schemaVersion: MAGE_SCHEMA_VERSION,
      experience: { total: 0, current: 0 },
      sheetLayout: createDefaultSheetLayout(),
      abilities: migrateLegacyAbilities(versionThree.data.abilities),
      repeatableEntries: {
        ...versionThree.data.repeatableEntries,
        backgrounds: migrateLegacyBackgrounds(
          versionThree.data.repeatableEntries.backgrounds,
          versionThree.data.createdAt,
        ),
        merits: [],
        flaws: [],
        ...migrateLegacyMagick(
          versionThree.data.repeatableEntries,
          versionThree.data.createdAt,
        ),
      },
    });
  }

  const versionTwo = legacyMageCharacterSchemaV2.safeParse(input);
  if (versionTwo.success) {
    return mageCharacterSchema.parse({
      ...versionTwo.data,
      schemaVersion: MAGE_SCHEMA_VERSION,
      experience: { total: 0, current: 0 },
      sheetLayout: createDefaultSheetLayout(),
      abilities: migrateLegacyAbilities(versionTwo.data.abilities),
      enlightenment: {
        ...versionTwo.data.enlightenment,
        willpowerTemporary: versionTwo.data.enlightenment.willpower,
      },
      repeatableEntries: {
        ...versionTwo.data.repeatableEntries,
        backgrounds: migrateLegacyBackgrounds(
          versionTwo.data.repeatableEntries.backgrounds,
          versionTwo.data.createdAt,
        ),
        merits: [],
        flaws: [],
        ...migrateLegacyMagick(
          versionTwo.data.repeatableEntries,
          versionTwo.data.createdAt,
        ),
      },
    });
  }

  const legacy = legacyMageCharacterSchemaV1.safeParse(input);
  if (!legacy.success) {
    throw current.error;
  }

  return mageCharacterSchema.parse({
    ...legacy.data,
    schemaVersion: MAGE_SCHEMA_VERSION,
    experience: { total: 0, current: 0 },
    sheetLayout: createDefaultSheetLayout(),
    abilities: createDefaultAbilityRatings(),
    enlightenment: createDefaultEnlightenment(),
    repeatableEntries: {
      ...legacy.data.repeatableEntries,
      backgrounds: migrateLegacyBackgrounds(
        legacy.data.repeatableEntries.backgrounds,
        legacy.data.createdAt,
      ),
      merits: [],
      flaws: [],
      ...migrateLegacyMagick(
        legacy.data.repeatableEntries,
        legacy.data.createdAt,
      ),
    },
  });
}
