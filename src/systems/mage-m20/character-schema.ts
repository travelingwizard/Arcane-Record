import { z } from 'zod';
import { MAGE_SCHEMA_VERSION, MAGE_SYSTEM_ID, spheres } from './definitions';

const rating = z.number().int().min(1).max(5);
const sphereRating = z.number().int().min(0).max(5);
const uuid = z.string().uuid();

export const sphereIdSchema = z.enum(spheres.map(({ id }) => id));

export const mageCharacterSchema = z.object({
  id: uuid,
  systemId: z.literal(MAGE_SYSTEM_ID),
  schemaVersion: z.literal(MAGE_SCHEMA_VERSION),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  identity: z.object({
    name: z.string(),
    player: z.string(),
    chronicle: z.string(),
    nature: z.string(),
    demeanor: z.string(),
    essence: z.string(),
    affiliation: z.string(),
    sect: z.string(),
    concept: z.string(),
  }),
  attributes: z.object({
    physical: z.object({
      strength: rating,
      dexterity: rating,
      stamina: rating,
    }),
    social: z.object({
      charisma: rating,
      manipulation: rating,
      appearance: rating,
    }),
    mental: z.object({
      perception: rating,
      intelligence: rating,
      wits: rating,
    }),
  }),
  spheres: z.object({
    correspondence: sphereRating,
    entropy: sphereRating,
    forces: sphereRating,
    life: sphereRating,
    matter: sphereRating,
    mind: sphereRating,
    prime: sphereRating,
    spirit: sphereRating,
    time: sphereRating,
  }),
  affinitySphere: sphereIdSchema.nullable(),
  repeatableEntries: z.object({
    backgrounds: z.array(
      z.object({ id: uuid, label: z.string(), rating: sphereRating }),
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
  }),
  health: z.object({
    damage: z.array(z.enum(['bashing', 'lethal', 'aggravated'])).max(7),
  }),
});
