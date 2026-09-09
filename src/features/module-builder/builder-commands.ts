import type {
  ArcaneModuleEnvelope,
  ModuleComponentDefinition,
  ModuleValueSchemaDefinition,
  SheetTemplateDefinition,
} from '../../modules/schema/module-envelope';

export type BuilderComponentKind =
  | 'static-text'
  | 'text'
  | 'multiline-text'
  | 'checkbox'
  | 'select'
  | 'number'
  | 'dot-rating';

export function moveItem<T>(items: T[], from: number, to: number) {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return;
  const [item] = items.splice(from, 1);
  items.splice(to, 0, item!);
}

export function uniqueId(base: string, used: Iterable<string>) {
  const values = new Set(used);
  if (!values.has(base)) return base;
  let suffix = 2;
  while (values.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function schemaFor(kind: BuilderComponentKind): ModuleValueSchemaDefinition {
  if (kind === 'text' || kind === 'multiline-text' || kind === 'select')
    return { type: 'string', required: false, maxLength: 500 };
  if (kind === 'checkbox')
    return { type: 'boolean', required: false, default: false };
  if (kind === 'number' || kind === 'dot-rating')
    return {
      type: 'integer',
      required: false,
      minimum: 0,
      maximum: kind === 'dot-rating' ? 5 : 999,
      default: 0,
    };
  return { type: 'string', required: false, maxLength: 500 };
}

function addSchemaProperty(
  template: SheetTemplateDefinition,
  key: string,
  kind: BuilderComponentKind,
) {
  if (template.characterSchema.type !== 'object')
    throw new Error('Sheet root schema must be an object.');
  template.characterSchema.properties[key] = schemaFor(kind);
  (template.defaults as Record<string, unknown>)[key] =
    kind === 'text' || kind === 'multiline-text' || kind === 'select'
      ? ''
      : kind === 'checkbox'
        ? false
        : 0;
}

export function addBuilderComponent(
  module: ArcaneModuleEnvelope,
  sectionId: string,
  kind: BuilderComponentKind,
) {
  const template = module.sheetTemplates[0];
  if (!template) throw new Error('Add a sheet template first.');
  const section = template.sections.find((item) => item.id === sectionId);
  if (!section) throw new Error('Choose a valid section.');
  const id = uniqueId(
    kind,
    module.reusableComponents.map((item) => item.id),
  );
  const common = {
    id,
    label: kind === 'static-text' ? 'Instructions' : 'New field',
    accessibilityLabel: kind === 'static-text' ? 'Instructions' : 'New field',
    sourceRefIds: [],
    layout: { width: 'full' as const },
    modes: {
      build: 'edit' as const,
      play: kind === 'static-text' ? ('view' as const) : ('edit' as const),
    },
    display: {
      format:
        kind === 'number' || kind === 'dot-rating'
          ? ('integer' as const)
          : ('plain' as const),
    },
  };
  let component: ModuleComponentDefinition;
  if (kind === 'static-text')
    component = { ...common, type: 'static-text', text: 'New instructions' };
  else {
    const key = uniqueId(
      id,
      Object.keys(
        template.characterSchema.type === 'object'
          ? template.characterSchema.properties
          : {},
      ),
    );
    addSchemaProperty(template, key, kind);
    const dataPath = { root: 'character' as const, segments: [key] };
    component =
      kind === 'text'
        ? { ...common, type: 'text', dataPath, maximumLength: 500 }
        : kind === 'multiline-text'
          ? {
              ...common,
              type: 'multiline-text',
              dataPath,
              maximumLength: 2_000,
              rows: 4,
            }
          : kind === 'checkbox'
            ? { ...common, type: 'checkbox', dataPath }
            : kind === 'select'
              ? {
                  ...common,
                  type: 'select',
                  dataPath,
                  options: [{ value: 'option-one', label: 'Option one' }],
                }
              : kind === 'number'
                ? {
                    ...common,
                    type: 'number',
                    dataPath,
                    minimum: 0,
                    maximum: 999,
                    step: 1,
                  }
                : {
                    ...common,
                    type: 'dot-rating',
                    dataPath,
                    minimum: 0,
                    maximum: 5,
                    variant: 'dots',
                  };
  }
  module.reusableComponents.push(component);
  template.componentIds.push(id);
  section.componentIds.push(id);
  return id;
}

export function moveComponent(
  template: SheetTemplateDefinition,
  componentId: string,
  targetSectionId: string,
  targetIndex?: number,
) {
  const target = template.sections.find((item) => item.id === targetSectionId);
  if (!target) throw new Error('Choose a valid destination section.');
  template.sections.forEach((section) => {
    section.componentIds = section.componentIds.filter(
      (id) => id !== componentId,
    );
  });
  target.componentIds.splice(
    targetIndex ?? target.componentIds.length,
    0,
    componentId,
  );
}

export function duplicateComponent(
  module: ArcaneModuleEnvelope,
  componentId: string,
  sectionId: string,
) {
  const source = module.reusableComponents.find(
    (item) => item.id === componentId,
  );
  const template = module.sheetTemplates[0];
  const section = template?.sections.find((item) => item.id === sectionId);
  if (!source || !template || !section)
    throw new Error('The selected component is unavailable.');
  const copy = structuredClone(source);
  copy.id = uniqueId(
    `${source.id}-copy`,
    module.reusableComponents.map((item) => item.id),
  );
  copy.label = `${source.label} copy`;
  if ('dataPath' in copy) {
    if (template.characterSchema.type !== 'object')
      throw new Error('Sheet root schema must be an object.');
    const sourceKey = copy.dataPath.segments.at(-1)!;
    const copyKey = uniqueId(
      `${sourceKey}-copy`,
      Object.keys(template.characterSchema.properties),
    );
    const sourceSchema = template.characterSchema.properties[sourceKey];
    if (!sourceSchema)
      throw new Error('The selected component data field is unavailable.');
    template.characterSchema.properties[copyKey] =
      structuredClone(sourceSchema);
    (template.defaults as Record<string, unknown>)[copyKey] = structuredClone(
      (template.defaults as Record<string, unknown>)[sourceKey],
    );
    copy.dataPath = {
      root: 'character',
      segments: [...copy.dataPath.segments.slice(0, -1), copyKey],
    };
  }
  module.reusableComponents.push(copy);
  template.componentIds.push(copy.id);
  const index = section.componentIds.indexOf(componentId);
  section.componentIds.splice(index + 1, 0, copy.id);
  return copy.id;
}

export function removeComponent(
  module: ArcaneModuleEnvelope,
  componentId: string,
) {
  module.reusableComponents = module.reusableComponents.filter(
    (item) => item.id !== componentId,
  );
  module.sheetTemplates.forEach((template) => {
    template.componentIds = template.componentIds.filter(
      (id) => id !== componentId,
    );
    template.sections.forEach((section) => {
      section.componentIds = section.componentIds.filter(
        (id) => id !== componentId,
      );
    });
  });
}
