import { z } from 'zod';
import { dataPathSchema } from '../schema/data-path';

const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
const jsonScalar = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export type ModuleExpression =
  | { op: 'literal'; value: unknown }
  | { op: 'path'; path: z.infer<typeof dataPathSchema>; missing?: unknown }
  | { op: 'formula'; id: string }
  | {
      op: 'not' | 'negate' | 'round' | 'floor' | 'ceil';
      value: ModuleExpression;
    }
  | {
      op: 'add' | 'multiply' | 'and' | 'or' | 'min' | 'max' | 'sum';
      values: ModuleExpression[];
    }
  | {
      op:
        | 'subtract'
        | 'divide'
        | 'modulo'
        | 'eq'
        | 'ne'
        | 'lt'
        | 'lte'
        | 'gt'
        | 'gte';
      left: ModuleExpression;
      right: ModuleExpression;
    }
  | {
      op: 'if';
      condition: ModuleExpression;
      then: ModuleExpression;
      else: ModuleExpression;
    }
  | {
      op: 'clamp';
      value: ModuleExpression;
      minimum: ModuleExpression;
      maximum: ModuleExpression;
    };

export const moduleExpressionSchema: z.ZodType<ModuleExpression> = z.lazy(() =>
  z.discriminatedUnion('op', [
    z.strictObject({ op: z.literal('literal'), value: jsonScalar }),
    z.strictObject({
      op: z.literal('path'),
      path: dataPathSchema,
      missing: jsonScalar.optional(),
    }),
    z.strictObject({ op: z.literal('formula'), id }),
    ...(['not', 'negate', 'round', 'floor', 'ceil'] as const).map((op) =>
      z.strictObject({ op: z.literal(op), value: moduleExpressionSchema }),
    ),
    ...(['add', 'multiply', 'and', 'or', 'min', 'max', 'sum'] as const).map(
      (op) =>
        z.strictObject({
          op: z.literal(op),
          values: z.array(moduleExpressionSchema).min(1).max(100),
        }),
    ),
    ...(
      [
        'subtract',
        'divide',
        'modulo',
        'eq',
        'ne',
        'lt',
        'lte',
        'gt',
        'gte',
      ] as const
    ).map((op) =>
      z.strictObject({
        op: z.literal(op),
        left: moduleExpressionSchema,
        right: moduleExpressionSchema,
      }),
    ),
    z.strictObject({
      op: z.literal('if'),
      condition: moduleExpressionSchema,
      then: moduleExpressionSchema,
      else: moduleExpressionSchema,
    }),
    z.strictObject({
      op: z.literal('clamp'),
      value: moduleExpressionSchema,
      minimum: moduleExpressionSchema,
      maximum: moduleExpressionSchema,
    }),
  ]),
);

export const formulaDefinitionSchema = z.strictObject({
  id,
  resultType: z.enum(['number', 'integer', 'boolean', 'string']),
  expression: moduleExpressionSchema,
  fallback: jsonScalar.optional(),
  explanation: z.string().max(1000).optional(),
});

export const validationRuleDefinitionSchema = z
  .strictObject({
    id,
    code: id,
    severity: z.enum(['information', 'warning', 'soft-limit', 'hard-limit']),
    when: moduleExpressionSchema.optional(),
    assertion: moduleExpressionSchema,
    message: z.string().min(1).max(1000),
    targetComponentIds: z.array(id).max(100),
    appliesIn: z.array(id).max(20),
    override: z
      .strictObject({ allowed: z.boolean(), reasonRequired: z.boolean() })
      .optional(),
    preserveExisting: z.boolean(),
  })
  .refine((rule) => rule.severity !== 'hard-limit' || !rule.override?.allowed, {
    message: 'Hard limits cannot be overrideable.',
  });

const effectBase = { id };
export const actionEffectSchema = z.discriminatedUnion('type', [
  z.strictObject({
    ...effectBase,
    type: z.literal('set'),
    path: dataPathSchema,
    value: moduleExpressionSchema,
  }),
  z.strictObject({
    ...effectBase,
    type: z.literal('increment'),
    path: dataPathSchema,
    amount: moduleExpressionSchema,
  }),
  z.strictObject({
    ...effectBase,
    type: z.literal('decrement'),
    path: dataPathSchema,
    amount: moduleExpressionSchema,
  }),
  z.strictObject({
    ...effectBase,
    type: z.literal('toggle'),
    path: dataPathSchema,
  }),
  z.strictObject({
    ...effectBase,
    type: z.literal('add-record'),
    path: dataPathSchema,
    record: moduleExpressionSchema,
  }),
  z.strictObject({
    ...effectBase,
    type: z.literal('remove-record'),
    path: dataPathSchema,
    recordId: moduleExpressionSchema,
    missing: z.enum(['no-op', 'fail']),
  }),
]);

export const actionDefinitionSchema = z.strictObject({
  id,
  trigger: z.enum([
    'button',
    'field-changed',
    'record-added',
    'record-removed',
    'creation-step-entered',
    'creation-step-completed',
  ]),
  conditions: z.array(moduleExpressionSchema).max(20),
  effects: z.array(actionEffectSchema).min(1).max(100),
  validationRuleIds: z.array(id).max(100),
  successMessage: z.string().max(500).optional(),
  failureMessage: z.string().max(500).optional(),
  undo: z.enum(['none', 'single-step', 'transaction-history']),
});

const flowTransitionSchema = z.strictObject({
  to: id,
  when: moduleExpressionSchema.optional(),
  label: z.string().max(160),
});
export const creationFlowDefinitionSchema = z.strictObject({
  id,
  name: z.string().min(1).max(160),
  startStepId: id,
  steps: z
    .array(
      z.strictObject({
        id,
        label: z.string().min(1).max(160),
        description: z.string().max(2_000).optional(),
        componentIds: z.array(id).max(100),
        transitions: z.array(flowTransitionSchema).max(20),
        review: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(200),
});

export type FormulaDefinition = z.infer<typeof formulaDefinitionSchema>;
export type ValidationRuleDefinition = z.infer<
  typeof validationRuleDefinitionSchema
>;
export type ActionDefinition = z.infer<typeof actionDefinitionSchema>;
export type CreationFlowDefinition = z.infer<
  typeof creationFlowDefinitionSchema
>;
