import { z } from 'zod';
import {
  burningWheelGroupIds,
  defaultBurningWheelGroupOrder,
} from './definitions';
import { burningWheelStockIds } from './catalog';

const shadeSchema = z.enum(['B', 'G', 'W']);
const groupIdSchema = z.enum(burningWheelGroupIds);
const groupOrderSchema = z
  .array(groupIdSchema)
  .length(burningWheelGroupIds.length)
  .refine((order) => new Set(order).size === burningWheelGroupIds.length);
const testsSchema = z.object({
  routine: z.number().int().nonnegative(),
  difficult: z.number().int().nonnegative(),
  challenging: z.number().int().nonnegative(),
});
const statSchema = z.object({
  shade: shadeSchema,
  mentalPoints: z.number().int().nonnegative(),
  physicalPoints: z.number().int().nonnegative(),
  eitherPoints: z.number().int().nonnegative(),
  bonus: z.number().int(),
  tests: testsSchema,
});
const namedRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  notes: z.string(),
});

export const burningWheelCharacterSchema = z.object({
  stock: z.enum(burningWheelStockIds),
  mode: z.enum(['build', 'play']),
  identity: z.object({
    name: z.string(),
    player: z.string(),
    concept: z.string(),
    gender: z.string(),
  }),
  beliefs: z.array(z.string()).length(3),
  instincts: z.array(z.string()).length(3),
  burn: z.object({
    settings: z.object({
      enforceLifepathRequirements: z.boolean(),
      enforcePointLimits: z.boolean(),
      appropriateWeapons: z.record(z.string(), z.array(z.string())),
    }),
    lifepaths: z.array(
      z.object({
        id: z.string().uuid(),
        definitionId: z.string(),
        time: z.number().int().positive(),
        weaponChoice: z.string(),
        statChoice: z.enum(['', 'm', 'p']),
        brutalLifeDie: z.number().int().min(0).max(6),
        brutalLifeTrait: z.string(),
      }),
    ),
    stats: z.object({
      will: statSchema,
      perception: statSchema,
      power: statSchema,
      forte: statSchema,
      agility: statSchema,
      speed: statSchema,
    }),
    skills: z.array(
      z.object({
        id: z.string().uuid(),
        definitionId: z.string().nullable(),
        customName: z.string(),
        lifepathPoints: z.number().int().nonnegative(),
        generalPoints: z.number().int().nonnegative(),
        tests: testsSchema,
        notes: z.string(),
      }),
    ),
    traits: z.array(
      z.object({
        id: z.string().uuid(),
        definitionId: z.string().nullable(),
        customName: z.string(),
        notes: z.string(),
      }),
    ),
    attributeModifiers: z.record(z.string(), z.number().int()),
  }),
  connections: z.object({
    relationships: z.array(
      namedRecordSchema.extend({
        importance: z.enum(['minor', 'significant', 'powerful']),
        immediateFamily: z.boolean(),
        otherFamily: z.boolean(),
        romantic: z.boolean(),
        forbidden: z.boolean(),
        hateful: z.boolean(),
      }),
    ),
    affiliations: z.array(
      namedRecordSchema.extend({
        importance: z.enum(['small', 'large', 'national']),
      }),
    ),
    reputations: z.array(
      namedRecordSchema.extend({
        importance: z.enum(['local', 'regional', 'national']),
      }),
    ),
  }),
  possessions: z.array(
    namedRecordSchema.extend({
      kind: z.enum(['gear', 'property', 'weapon', 'armor']),
      definitionId: z.string().nullable(),
      cost: z.number().int().nonnegative(),
      damaged: z.boolean(),
    }),
  ),
  play: z.object({
    experience: z
      .object({
        total: z.number().int().nonnegative(),
        current: z.number().int().nonnegative(),
      })
      .default({ total: 0, current: 0 }),
    artha: z.object({
      fate: z.number().int().nonnegative(),
      persona: z.number().int().nonnegative(),
      deeds: z.number().int().nonnegative(),
    }),
    resourceTax: z.number().int().nonnegative(),
    wounds: z.array(
      namedRecordSchema.extend({
        severity: z.enum([
          'superficial',
          'light',
          'midi',
          'severe',
          'traumatic',
          'mortal',
        ]),
        obstacle: z.number().int().nonnegative(),
        treated: z.boolean(),
      }),
    ),
    advancement: z.array(
      z.object({
        id: z.string().uuid(),
        date: z.string(),
        target: z.string(),
        kind: z.enum(['test', 'advance', 'practice', 'artha']),
        difficulty: z.enum(['routine', 'difficult', 'challenging', '']),
        notes: z.string(),
      }),
    ),
    notes: z.string(),
  }),
  sheetLayout: z.object({
    buildGroupOrder: groupOrderSchema,
    playGroupOrder: groupOrderSchema,
  }),
});

export type BurningWheelCharacter = z.infer<typeof burningWheelCharacterSchema>;

export function migrateBurningWheelCharacter(
  data: unknown,
  fromVersion: number,
): BurningWheelCharacter {
  void fromVersion;
  const parsed = burningWheelCharacterSchema.safeParse(data);
  if (parsed.success) return parsed.data;
  throw new Error('The Burning Wheel character data could not be migrated.');
}

export const defaultGroupOrder = [...defaultBurningWheelGroupOrder];
