import { z } from 'zod';
import { backgroundRatingRules } from './background-rules';
import {
  createDefaultAbilityRatings,
  createDefaultEnlightenment,
} from './create-character';
import { MAGE_SCHEMA_VERSION, MAGE_SYSTEM_ID, spheres } from './definitions';
import { backgroundById, backgroundCatalog } from './reference/backgrounds';
import { meritFlawById, type MeritFlawKind } from './reference/merits-flaws';

const attributeRating = z.number().int().min(1).max(5);
const fivePointRating = z.number().int().min(0).max(5);
const tenPointRating = z.number().int().min(0).max(10);
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

const abilitiesSchema = z.object({
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

const repeatableEntriesSchema = z
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

const healthSchema = z.object({
  damage: z.array(z.enum(['bashing', 'lethal', 'aggravated'])).max(7),
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

const versionFourCommonFields = {
  ...legacyCommonFields,
  repeatableEntries: legacyRepeatableEntriesSchemaV4,
};

export const sphereIdSchema = z.enum(spheres.map(({ id }) => id));

export const legacyMageCharacterSchemaV1 = z.object({
  ...legacyCommonFields,
  schemaVersion: z.literal(1),
  affinitySphere: sphereIdSchema.nullable(),
});

export const legacyMageCharacterSchemaV2 = z.object({
  ...legacyCommonFields,
  schemaVersion: z.literal(2),
  abilities: abilitiesSchema,
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

export const legacyMageCharacterSchemaV4 = z.object({
  ...versionFourCommonFields,
  schemaVersion: z.literal(4),
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

export const mageCharacterSchema = z.object({
  ...commonFields,
  schemaVersion: z.literal(MAGE_SCHEMA_VERSION),
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

export function migrateMageCharacter(input: unknown) {
  const current = mageCharacterSchema.safeParse(input);
  if (current.success) {
    return current.data;
  }

  const versionFour = legacyMageCharacterSchemaV4.safeParse(input);
  if (versionFour.success) {
    return mageCharacterSchema.parse({
      ...versionFour.data,
      schemaVersion: MAGE_SCHEMA_VERSION,
      repeatableEntries: {
        ...versionFour.data.repeatableEntries,
        backgrounds: migrateLegacyBackgrounds(
          versionFour.data.repeatableEntries.backgrounds,
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
      repeatableEntries: {
        ...versionThree.data.repeatableEntries,
        backgrounds: migrateLegacyBackgrounds(
          versionThree.data.repeatableEntries.backgrounds,
          versionThree.data.createdAt,
        ),
        merits: [],
        flaws: [],
      },
    });
  }

  const versionTwo = legacyMageCharacterSchemaV2.safeParse(input);
  if (versionTwo.success) {
    return mageCharacterSchema.parse({
      ...versionTwo.data,
      schemaVersion: MAGE_SCHEMA_VERSION,
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
    },
  });
}
