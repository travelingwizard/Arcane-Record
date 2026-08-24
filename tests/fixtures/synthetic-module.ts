export function createSyntheticModule(overrides: Record<string, unknown> = {}) {
  return {
    format: 'arcane-record-module',
    formatVersion: 1,
    moduleId: 'net.example.arcane-test',
    moduleVersion: '1.0.0',
    name: 'Arcane Runtime Test',
    description: 'A synthetic fixture used to verify the declarative runtime.',
    author: [{ name: 'Arcane Record Tests' }],
    licenseMetadata: {
      spdxExpression: 'CC0-1.0',
      notice: 'Synthetic test data.',
      provenance: 'Created for Arcane Record tests.',
    },
    minimumCoreVersion: '0.1.0',
    dependencies: [],
    gameNodes: [
      {
        id: 'test-game',
        name: 'Test Game',
        parentId: null,
        order: 0,
        additions: ['catalog/traits/test-entry'],
      },
      {
        id: 'test-variant',
        name: 'Test Variant',
        parentId: 'test-game',
        order: 1,
        overrides: [
          {
            target: 'catalog/traits/test-entry',
            fields: { summary: 'Variant summary' },
          },
        ],
      },
    ],
    sheetTemplates: [
      {
        id: 'test-sheet',
        templateVersion: 1,
        gameNodeId: 'test-variant',
        name: 'Test Character Sheet',
        characterSchema: {
          type: 'object',
          required: true,
          properties: {
            identity: {
              type: 'object',
              required: true,
              properties: {
                name: {
                  type: 'string',
                  required: true,
                  maxLength: 100,
                },
              },
            },
            traits: {
              type: 'object',
              required: true,
              properties: {
                resolve: {
                  type: 'integer',
                  required: true,
                  minimum: 0,
                  maximum: 5,
                },
                resource: {
                  type: 'integer',
                  required: true,
                  minimum: 0,
                  maximum: 10,
                },
              },
            },
            layout: {
              type: 'object',
              required: true,
              properties: {
                mode: {
                  type: 'enum',
                  required: true,
                  values: ['build', 'play'],
                },
                groupOrder: {
                  type: 'array',
                  required: true,
                  items: {
                    type: 'enum',
                    required: true,
                    values: ['character', 'traits'],
                  },
                  minimum: 2,
                  maximum: 2,
                },
              },
            },
          },
        },
        defaults: {
          identity: { name: 'Test Character' },
          traits: { resolve: 2, resource: 4 },
          layout: {
            mode: 'build',
            groupOrder: ['character', 'traits'],
          },
        },
        modes: [
          { id: 'build', label: 'Build' },
          { id: 'play', label: 'Play' },
        ],
        defaultModeId: 'build',
        modePath: { root: 'character', segments: ['layout', 'mode'] },
        groupOrderPath: {
          root: 'character',
          segments: ['layout', 'groupOrder'],
        },
        navigationGroups: [
          { id: 'character', label: 'Character', order: 0 },
          { id: 'traits', label: 'Traits', order: 1 },
        ],
        sections: [
          {
            id: 'test-identity',
            label: 'Identity',
            groupId: 'character',
            order: 0,
            componentIds: ['identity-heading', 'name'],
          },
          {
            id: 'test-traits',
            label: 'Traits',
            groupId: 'traits',
            order: 1,
            componentIds: ['resolve', 'resource', 'validation'],
          },
        ],
        componentIds: [
          'identity-heading',
          'name',
          'resolve',
          'resource',
          'validation',
        ],
      },
    ],
    reusableComponents: [
      {
        id: 'identity-heading',
        type: 'heading',
        label: 'Who are you?',
        accessibilityLabel: 'Identity heading',
        level: 3,
      },
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        accessibilityLabel: 'Character name',
        dataPath: { root: 'character', segments: ['identity', 'name'] },
        maximumLength: 100,
        sourceRefIds: ['test-source'],
      },
      {
        id: 'resolve',
        type: 'dot-rating',
        label: 'Resolve',
        accessibilityLabel: 'Resolve rating',
        dataPath: { root: 'character', segments: ['traits', 'resolve'] },
        minimum: 0,
        maximum: 5,
        modes: { build: 'edit', play: 'view' },
      },
      {
        id: 'resource',
        type: 'number',
        label: 'Resource',
        accessibilityLabel: 'Resource rating',
        dataPath: { root: 'character', segments: ['traits', 'resource'] },
        minimum: 0,
        maximum: 10,
        step: 1,
        modes: { build: 'edit', play: 'edit' },
      },
      {
        id: 'validation',
        type: 'validation-summary',
        label: 'Validation',
        accessibilityLabel: 'Validation summary',
      },
    ],
    catalogs: [
      {
        id: 'traits',
        name: 'Traits',
        entries: [
          {
            id: 'test-entry',
            name: 'Synthetic Trait',
            summary: 'Base summary',
          },
        ],
      },
    ],
    diceSystems: [],
    actions: [],
    formulas: [],
    validationRules: [],
    creationProfiles: [],
    creationFlows: [],
    themes: [],
    assets: [],
    sourceReferences: [
      {
        id: 'test-source',
        title: 'Synthetic Test Reference',
      },
    ],
    migrations: [],
    ...overrides,
  };
}
