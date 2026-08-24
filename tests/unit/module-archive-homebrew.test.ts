import { describe, expect, it } from 'vitest';
import {
  createLocalArchive,
  parseLocalArchive,
} from '../../src/modules/interchange/local-archive';
import { resolveCharacterDefinition } from '../../src/modules/homebrew/character-homebrew';
import { validateModuleEnvelope } from '../../src/modules/registry/module-validation';
import type { StoredCharacter } from '../../src/storage/stored-character';
import { createSyntheticModule } from '../fixtures/synthetic-module';

const character: StoredCharacter = {
  id: 'character',
  systemId: 'arcane-module',
  systemVersion: 1,
  name: 'Homebrew',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  data: {},
  moduleRef: {
    moduleId: 'net.example.arcane-test',
    moduleVersion: '1.0.0',
    gameNodeId: 'test-variant',
    sheetTemplateId: 'test-sheet',
    sheetTemplateVersion: 1,
    dependencyLockId: '00000000-0000-4000-8000-000000000000',
    enabledOverlayRefs: [],
  },
  homebrew: {
    customDefinitions: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        kind: 'trait',
        name: 'Custom Trait',
        data: { cost: 2 },
      },
    ],
    definitionOverrides: [
      {
        id: '22222222-2222-4222-8222-222222222222',
        definitionId: 'trait/base',
        fields: { name: 'Character Name' },
        notes: '',
      },
    ],
  },
};

describe('local archives and character homebrew', () => {
  it('gives character custom content and overrides highest precedence', () => {
    expect(
      resolveCharacterDefinition(
        '11111111-1111-4111-8111-111111111111',
        null,
        character,
      ),
    ).toMatchObject({ name: 'Custom Trait', source: 'character-custom' });
    expect(
      resolveCharacterDefinition(
        'trait/base',
        { name: 'Module Name', cost: 1 },
        character,
      ),
    ).toMatchObject({
      name: 'Character Name',
      cost: 1,
      source: 'character-override',
    });
  });

  it('round trips a distinct checksum-verified local archive', async () => {
    const module = validateModuleEnvelope(createSyntheticModule());
    const serialized = await createLocalArchive(
      [character],
      [module],
      new Date('2026-01-02T00:00:00.000Z'),
    );
    const archive = await parseLocalArchive(serialized);
    expect(archive.characters[0]?.homebrew?.customDefinitions).toHaveLength(1);
    expect(archive.modules[0]?.envelope.moduleId).toBe(module.moduleId);
  });
});
