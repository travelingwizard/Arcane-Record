import { describe, expect, it } from 'vitest';
import { mage20Phase2Module } from '../../src/games/mage20/module/mage20-phase2-module';
import { ModuleRegistry } from '../../src/modules/registry/module-registry';
import { resolveSectionSummary } from '../../src/modules/renderer/section-summary';
import { getMageCharacterData } from '../../src/games/mage20/character-adapter';
import {
  createMage20Phase2GoldenCharacter,
  mage20Phase2GoldenSummaries,
} from '../fixtures/mage20-phase2-golden';

describe('Mage 20 Phase 2 declarative slice', () => {
  it('validates the bundled module and preserves the complete Mage sheet', () => {
    const registry = new ModuleRegistry().register(mage20Phase2Module);
    const resolved = registry.resolve(
      mage20Phase2Module.moduleId,
      mage20Phase2Module.moduleVersion,
      'mage20',
      'mage20-character',
      1,
    );
    const legacy = getMageCharacterData(createMage20Phase2GoldenCharacter());
    const slice = structuredClone(legacy);
    delete slice.development;

    expect(resolved.characterSchema.parse(slice)).toEqual(slice);
    expect(resolved.template.sections.map(({ id }) => id)).toEqual([
      'identity',
      'attributes',
      'abilities',
      'maneuvers',
      'backgrounds',
      'merits-flaws',
      'spheres',
      'enlightenment',
      'focus',
      'wonders',
      'rotes',
      'equipment',
      'health',
      'experience',
    ]);
  });

  it('matches the legacy golden section summaries', () => {
    const registry = new ModuleRegistry().register(mage20Phase2Module);
    const resolved = registry.resolve(
      mage20Phase2Module.moduleId,
      mage20Phase2Module.moduleVersion,
      'mage20',
      'mage20-character',
      1,
    );
    const legacy = getMageCharacterData(createMage20Phase2GoldenCharacter());
    const data = {
      identity: legacy.identity,
      attributes: legacy.attributes,
      abilities: legacy.abilities,
    };

    expect(
      Object.fromEntries(
        resolved.template.sections
          .filter(({ summary }) => summary)
          .map((section) => [
            section.id,
            resolveSectionSummary(section.summary, data, section.label),
          ]),
      ),
    ).toEqual(mage20Phase2GoldenSummaries);
  });

  it('rejects invalid nested grouped-component paths', () => {
    const broken = structuredClone(mage20Phase2Module);
    const component = broken.reusableComponents.find(
      ({ id }) => id === 'attribute-ratings',
    );
    if (!component || component.type !== 'grouped-dot-ratings') {
      throw new Error('Expected grouped Attribute component.');
    }
    component.groups![0]!.ratings[0]!.dataPath.segments = [
      'attributes',
      'physical',
      'missing',
    ];
    expect(() => new ModuleRegistry().register(broken)).toThrow(
      /cannot be activated/i,
    );
  });
});
