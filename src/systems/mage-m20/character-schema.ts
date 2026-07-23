import { z } from 'zod';
import {
  createDefaultAbilityRatings,
  createDefaultEnlightenment,
} from './create-character';
import { MAGE_SCHEMA_VERSION, MAGE_SYSTEM_ID, spheres } from './definitions';

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

const repeatableEntriesSchema = z.object({
  backgrounds: z.array(
    z.object({ id: uuid, label: z.string(), rating: fivePointRating }),
  ),
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

const healthSchema = z.object({
  damage: z.array(z.enum(['bashing', 'lethal', 'aggravated'])).max(7),
});

const commonFields = {
  id: uuid,
  systemId: z.literal(MAGE_SYSTEM_ID),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  identity: identitySchema,
  attributes: attributesSchema,
  spheres: spheresSchema,
  repeatableEntries: repeatableEntriesSchema,
  health: healthSchema,
};

export const sphereIdSchema = z.enum(spheres.map(({ id }) => id));

export const legacyMageCharacterSchemaV1 = z.object({
  ...commonFields,
  schemaVersion: z.literal(1),
  affinitySphere: sphereIdSchema.nullable(),
});

export const mageCharacterSchema = z.object({
  ...commonFields,
  schemaVersion: z.literal(MAGE_SCHEMA_VERSION),
  abilities: abilitiesSchema,
  enlightenment: z.object({
    arete: tenPointRating.min(1),
    willpower: tenPointRating.min(1),
    quintessence: tenPointRating,
    paradox: tenPointRating,
  }),
  affinitySphere: sphereIdSchema.nullable(),
});

export function migrateMageCharacter(input: unknown) {
  const current = mageCharacterSchema.safeParse(input);
  if (current.success) {
    return current.data;
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
  });
}
