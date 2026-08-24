import { z } from 'zod';
import type { ModuleValueSchemaDefinition } from './module-envelope';

export function buildModuleCharacterSchema(
  definition: ModuleValueSchemaDefinition,
): z.ZodType {
  let schema: z.ZodType;
  switch (definition.type) {
    case 'string': {
      let value = z.string();
      if (definition.minLength !== undefined)
        value = value.min(definition.minLength);
      if (definition.maxLength !== undefined)
        value = value.max(definition.maxLength);
      schema = value;
      break;
    }
    case 'integer': {
      let value = z.number().int();
      if (definition.minimum !== undefined)
        value = value.min(definition.minimum);
      if (definition.maximum !== undefined)
        value = value.max(definition.maximum);
      schema = value;
      break;
    }
    case 'boolean':
      schema = z.boolean();
      break;
    case 'enum':
      schema = z.string().refine((value) => definition.values.includes(value), {
        message: 'Value is not one of the declared options.',
      });
      break;
    case 'object':
      schema = z.object(
        Object.fromEntries(
          Object.entries(definition.properties).map(([key, child]) => [
            key,
            buildModuleCharacterSchema(child),
          ]),
        ),
      );
      break;
    case 'array': {
      let value = z.array(buildModuleCharacterSchema(definition.items));
      if (definition.minimum !== undefined)
        value = value.min(definition.minimum);
      if (definition.maximum !== undefined)
        value = value.max(definition.maximum);
      schema = value;
      break;
    }
    case 'nullable':
      schema = buildModuleCharacterSchema(definition.item).nullable();
      break;
  }
  if (!definition.required) schema = schema.optional();
  return schema;
}
