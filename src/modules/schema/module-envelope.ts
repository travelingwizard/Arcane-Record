import { z } from 'zod';
import { dataPathSchema } from './data-path';

const stableSlugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);

const objectFieldKeySchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
  .refine(
    (value) =>
      value !== '__proto__' && value !== 'prototype' && value !== 'constructor',
  );

const definitionReferenceSchema = z
  .string()
  .min(3)
  .max(260)
  .regex(/^[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)+$/);

export const moduleIdSchema = z
  .string()
  .min(3)
  .max(160)
  .regex(
    /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+(?:-[a-z0-9]+)*$/,
    'Use a lowercase reverse-domain module ID.',
  );

export const moduleVersionSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/);

export const moduleVersionRefSchema = z.strictObject({
  moduleId: moduleIdSchema,
  moduleVersion: moduleVersionSchema,
});

const sourceReferenceSchema = z.strictObject({
  id: stableSlugSchema,
  title: z.string().min(1).max(200),
  edition: z.string().max(120).optional(),
  url: z.string().url().max(500).optional(),
  notes: z.string().max(2_000).optional(),
});

export type ModuleValueSchemaDefinition =
  | {
      type: 'string';
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      default?: string;
    }
  | {
      type: 'integer';
      required?: boolean;
      minimum?: number;
      maximum?: number;
      default?: number;
    }
  | { type: 'boolean'; required?: boolean; default?: boolean }
  | {
      type: 'enum';
      required?: boolean;
      values: string[];
      default?: string;
    }
  | {
      type: 'object';
      required?: boolean;
      properties: Record<string, ModuleValueSchemaDefinition>;
    }
  | {
      type: 'array';
      required?: boolean;
      items: ModuleValueSchemaDefinition;
      minimum?: number;
      maximum?: number;
    };

export const moduleValueSchemaDefinitionSchema: z.ZodType<ModuleValueSchemaDefinition> =
  z.lazy(() =>
    z.discriminatedUnion('type', [
      z.strictObject({
        type: z.literal('string'),
        required: z.boolean().optional(),
        minLength: z.number().int().nonnegative().optional(),
        maxLength: z.number().int().positive().max(20_000).optional(),
        default: z.string().optional(),
      }),
      z.strictObject({
        type: z.literal('integer'),
        required: z.boolean().optional(),
        minimum: z.number().int().optional(),
        maximum: z.number().int().optional(),
        default: z.number().int().optional(),
      }),
      z.strictObject({
        type: z.literal('boolean'),
        required: z.boolean().optional(),
        default: z.boolean().optional(),
      }),
      z.strictObject({
        type: z.literal('enum'),
        required: z.boolean().optional(),
        values: z.array(z.string().min(1).max(100)).min(1).max(100),
        default: z.string().optional(),
      }),
      z.strictObject({
        type: z.literal('object'),
        required: z.boolean().optional(),
        properties: z.record(
          objectFieldKeySchema,
          moduleValueSchemaDefinitionSchema,
        ),
      }),
      z.strictObject({
        type: z.literal('array'),
        required: z.boolean().optional(),
        items: moduleValueSchemaDefinitionSchema,
        minimum: z.number().int().nonnegative().optional(),
        maximum: z.number().int().positive().max(10_000).optional(),
      }),
    ]),
  );

export type ModuleCondition =
  | { op: 'equals'; path: z.infer<typeof dataPathSchema>; value: unknown }
  | { op: 'truthy'; path: z.infer<typeof dataPathSchema> }
  | { op: 'not'; condition: ModuleCondition }
  | { op: 'and' | 'or'; conditions: ModuleCondition[] };

export const moduleConditionSchema: z.ZodType<ModuleCondition> = z.lazy(() =>
  z.discriminatedUnion('op', [
    z.strictObject({
      op: z.literal('equals'),
      path: dataPathSchema,
      value: z.unknown(),
    }),
    z.strictObject({ op: z.literal('truthy'), path: dataPathSchema }),
    z.strictObject({
      op: z.literal('not'),
      condition: moduleConditionSchema,
    }),
    z.strictObject({
      op: z.enum(['and', 'or']),
      conditions: z.array(moduleConditionSchema).min(1).max(20),
    }),
  ]),
);

const componentBase = {
  id: stableSlugSchema,
  label: z.string().min(1).max(160),
  helpText: z.string().max(1_000).optional(),
  accessibilityLabel: z.string().min(1).max(200),
  defaultValue: z.unknown().optional(),
  sourceRefIds: z.array(stableSlugSchema).max(20).default([]),
  layout: z
    .strictObject({
      width: z.enum(['full', 'half', 'third', 'content']).default('full'),
    })
    .default({ width: 'full' }),
  modes: z
    .record(stableSlugSchema, z.enum(['edit', 'view', 'hidden']))
    .default({ build: 'edit', play: 'view' }),
  visibleWhen: moduleConditionSchema.optional(),
  editableWhen: moduleConditionSchema.optional(),
  display: z
    .strictObject({
      format: z.enum(['plain', 'integer', 'rating']).default('plain'),
    })
    .default({ format: 'plain' }),
};

export const moduleComponentSchema = z.discriminatedUnion('type', [
  z.strictObject({
    ...componentBase,
    type: z.literal('heading'),
    level: z.number().int().min(3).max(4).default(3),
  }),
  z.strictObject({
    ...componentBase,
    type: z.literal('static-text'),
    text: z.string().max(5_000),
  }),
  z.strictObject({
    ...componentBase,
    type: z.literal('text'),
    dataPath: dataPathSchema,
    maximumLength: z.number().int().positive().max(20_000).default(500),
  }),
  z.strictObject({
    ...componentBase,
    type: z.literal('number'),
    dataPath: dataPathSchema,
    minimum: z.number().int(),
    maximum: z.number().int(),
    step: z.number().int().positive().default(1),
  }),
  z.strictObject({
    ...componentBase,
    type: z.literal('dot-rating'),
    dataPath: dataPathSchema,
    minimum: z.number().int().nonnegative().default(0),
    maximum: z.number().int().positive().max(20),
    variant: z.enum(['dots', 'boxes']).default('dots'),
  }),
  z.strictObject({
    ...componentBase,
    type: z.literal('validation-summary'),
  }),
]);

export type ModuleComponentDefinition = z.infer<typeof moduleComponentSchema>;

const gameNodeSchema = z.strictObject({
  id: stableSlugSchema,
  name: z.string().min(1).max(160),
  description: z.string().max(2_000).optional(),
  parentId: stableSlugSchema.nullable(),
  order: z.number().int().nonnegative(),
  additions: z.array(definitionReferenceSchema).default([]),
  overrides: z
    .array(
      z.strictObject({
        target: definitionReferenceSchema,
        fields: z.record(objectFieldKeySchema, z.unknown()),
      }),
    )
    .default([]),
  sourceRefIds: z.array(stableSlugSchema).default([]),
});

const navigationGroupSchema = z.strictObject({
  id: stableSlugSchema,
  label: z.string().min(1).max(100),
  order: z.number().int().nonnegative(),
});

const sectionSchema = z.strictObject({
  id: stableSlugSchema,
  label: z.string().min(1).max(160),
  description: z.string().max(1_000).optional(),
  groupId: stableSlugSchema,
  order: z.number().int().nonnegative(),
  componentIds: z.array(stableSlugSchema).max(200),
});

const sheetTemplateSchema = z.strictObject({
  id: stableSlugSchema,
  templateVersion: z.number().int().positive(),
  gameNodeId: stableSlugSchema,
  name: z.string().min(1).max(160),
  description: z.string().max(2_000).optional(),
  characterSchema: moduleValueSchemaDefinitionSchema,
  defaults: z.record(z.string(), z.unknown()),
  modes: z
    .array(
      z.strictObject({
        id: stableSlugSchema,
        label: z.string().min(1).max(100),
      }),
    )
    .min(1)
    .max(10),
  defaultModeId: stableSlugSchema,
  modePath: dataPathSchema.optional(),
  groupOrderPath: dataPathSchema.optional(),
  navigationGroups: z.array(navigationGroupSchema).min(1).max(100),
  sections: z.array(sectionSchema).min(1).max(300),
  componentIds: z.array(stableSlugSchema).max(1_000),
  creationProfileIds: z.array(stableSlugSchema).default([]),
  creationFlowIds: z.array(stableSlugSchema).default([]),
});

const catalogSchema = z.strictObject({
  id: stableSlugSchema,
  name: z.string().min(1).max(160),
  entries: z
    .array(
      z.strictObject({
        id: stableSlugSchema,
        name: z.string().min(1).max(200),
        category: z.string().max(160).optional(),
        summary: z.string().max(2_000).optional(),
        sourceRefIds: z.array(stableSlugSchema).default([]),
      }),
    )
    .max(20_000),
});

const deferredDefinitionSchema = z.strictObject({
  id: stableSlugSchema,
  kind: z.literal('deferred'),
});

const moduleMigrationSchema = z.strictObject({
  id: stableSlugSchema,
  fromVersion: moduleVersionSchema,
  toVersion: moduleVersionSchema,
  operations: z
    .array(
      z.discriminatedUnion('type', [
        z.strictObject({
          type: z.literal('set-default-if-missing'),
          path: dataPathSchema,
          value: z.unknown(),
        }),
        z.strictObject({
          type: z.literal('rename-path'),
          from: dataPathSchema,
          to: dataPathSchema,
        }),
      ]),
    )
    .max(500),
});

export const arcaneModuleEnvelopeSchema = z.strictObject({
  format: z.literal('arcane-record-module'),
  formatVersion: z.literal(1),
  moduleId: moduleIdSchema,
  moduleVersion: moduleVersionSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(5_000),
  author: z
    .array(
      z.strictObject({
        name: z.string().min(1).max(200),
        publisherId: z.string().min(1).max(200).optional(),
      }),
    )
    .min(1)
    .max(20),
  licenseMetadata: z.strictObject({
    spdxExpression: z.string().min(1).max(200),
    notice: z.string().max(5_000).default(''),
    provenance: z.string().max(5_000).default(''),
  }),
  minimumCoreVersion: moduleVersionSchema,
  forkedFrom: moduleVersionRefSchema.optional(),
  dependencies: z
    .array(
      z.strictObject({
        moduleId: moduleIdSchema,
        version: moduleVersionSchema,
        required: z.boolean().default(true),
        purpose: z.string().max(500).default(''),
      }),
    )
    .max(100),
  gameNodes: z.array(gameNodeSchema).min(1).max(100),
  sheetTemplates: z.array(sheetTemplateSchema).min(1).max(100),
  reusableComponents: z.array(moduleComponentSchema).max(2_000),
  catalogs: z.array(catalogSchema).max(200),
  diceSystems: z.array(deferredDefinitionSchema).default([]),
  actions: z.array(deferredDefinitionSchema).default([]),
  formulas: z.array(deferredDefinitionSchema).default([]),
  validationRules: z.array(deferredDefinitionSchema).default([]),
  creationProfiles: z.array(deferredDefinitionSchema).default([]),
  creationFlows: z.array(deferredDefinitionSchema).default([]),
  themes: z.array(deferredDefinitionSchema).default([]),
  assets: z
    .array(
      z.strictObject({
        id: stableSlugSchema,
        mediaType: z.string().min(1).max(100),
        byteLength: z.number().int().nonnegative(),
        checksum: z.string().min(1).max(200),
      }),
    )
    .default([]),
  sourceReferences: z.array(sourceReferenceSchema).max(1_000),
  migrations: z.array(moduleMigrationSchema).max(100),
});

export type ArcaneModuleEnvelope = z.infer<typeof arcaneModuleEnvelopeSchema>;
export type SheetTemplateDefinition =
  ArcaneModuleEnvelope['sheetTemplates'][number];
export type GameNodeDefinition = ArcaneModuleEnvelope['gameNodes'][number];
export type ModuleMigrationDefinition =
  ArcaneModuleEnvelope['migrations'][number];
