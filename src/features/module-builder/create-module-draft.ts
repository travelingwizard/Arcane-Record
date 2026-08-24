import type { ArcaneModuleEnvelope } from '../../modules/schema/module-envelope';

export function createModuleDraft(
  name = 'Untitled Game Module',
): ArcaneModuleEnvelope {
  return {
    format: 'arcane-record-module',
    formatVersion: 1,
    moduleId: `local.arcane.${crypto.randomUUID().slice(0, 8)}`,
    moduleVersion: '0.1.0',
    name,
    description: 'A browser-local Arcane Record module draft.',
    author: [{ name: 'Local author' }],
    licenseMetadata: {
      spdxExpression: 'LicenseRef-Proprietary',
      notice: 'Local draft; not published.',
      provenance: 'Created with the Arcane Record Module Builder.',
    },
    minimumCoreVersion: '0.1.0',
    dependencies: [],
    gameNodes: [
      {
        id: 'game',
        name: 'New Game',
        parentId: null,
        order: 0,
        additions: [],
        overrides: [],
        sourceRefIds: [],
      },
    ],
    sheetTemplates: [
      {
        id: 'character-sheet',
        templateVersion: 1,
        gameNodeId: 'game',
        name: 'Character Sheet',
        characterSchema: {
          type: 'object',
          required: true,
          properties: {
            identity: {
              type: 'object',
              required: true,
              properties: {
                name: { type: 'string', required: true, maxLength: 200 },
              },
            },
            mode: {
              type: 'enum',
              required: true,
              values: ['build', 'play'],
              default: 'build',
            },
          },
        },
        defaults: { identity: { name: 'Untitled Character' }, mode: 'build' },
        modes: [
          { id: 'build', label: 'Build' },
          { id: 'play', label: 'Play' },
        ],
        defaultModeId: 'build',
        modePath: { root: 'character', segments: ['mode'] },
        groupOrderPaths: {},
        navigationGroups: [{ id: 'character', label: 'Character', order: 0 }],
        sections: [
          {
            id: 'identity',
            label: 'Identity',
            groupId: 'character',
            order: 0,
            componentIds: ['character-name'],
          },
        ],
        componentIds: ['character-name'],
        creationProfileIds: [],
        creationFlowIds: [],
      },
    ],
    reusableComponents: [
      {
        id: 'character-name',
        type: 'text',
        label: 'Name',
        accessibilityLabel: 'Character name',
        dataPath: { root: 'character', segments: ['identity', 'name'] },
        maximumLength: 200,
        sourceRefIds: [],
        layout: { width: 'full' },
        modes: { build: 'edit', play: 'edit' },
        display: { format: 'plain' },
      },
    ],
    catalogs: [],
    diceSystems: [],
    actions: [],
    formulas: [],
    validationRules: [],
    creationProfiles: [],
    creationFlows: [],
    themes: [],
    assets: [],
    sourceReferences: [],
    migrations: [],
  };
}
