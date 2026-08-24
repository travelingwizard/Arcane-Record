import { describe, expect, it } from 'vitest';
import {
  compareModules,
  createModuleFork,
  previewOverlayConflicts,
  resolveModuleOverlays,
} from '../../src/modules/homebrew/module-homebrew';
import { createSyntheticModule } from '../fixtures/synthetic-module';
import { validateModuleEnvelope } from '../../src/modules/registry/module-validation';

describe('local module homebrew', () => {
  it('creates a portable isolated fork with exact provenance', () => {
    const source = validateModuleEnvelope(createSyntheticModule());
    const fork = createModuleFork(source, 'local.example.test-fork');
    expect(fork.forkedFrom).toEqual({
      moduleId: source.moduleId,
      moduleVersion: source.moduleVersion,
    });
    fork.catalogs[0]!.entries[0]!.name = 'Fork name';
    expect(source.catalogs[0]!.entries[0]!.name).not.toBe('Fork name');
    expect(
      compareModules(source, fork).some(({ path }) =>
        path.includes('forkedFrom'),
      ),
    ).toBe(true);
  });

  it('detects deterministic overlay field conflicts', () => {
    const source = validateModuleEnvelope(createSyntheticModule());
    const first = structuredClone(source);
    first.moduleId = 'local.example.overlay-one';
    first.gameNodes[1]!.overrides[0]!.fields = { summary: 'One' };
    const second = structuredClone(source);
    second.moduleId = 'local.example.overlay-two';
    second.gameNodes[1]!.overrides[0]!.fields = { summary: 'Two' };
    expect(previewOverlayConflicts([first, second])).toEqual([
      {
        target: 'catalog/traits/test-entry',
        field: 'summary',
        overlayModuleIds: [
          'local.example.overlay-one',
          'local.example.overlay-two',
        ],
      },
    ]);
  });

  it('applies ordered non-conflicting overlays without mutating the base', () => {
    const source = validateModuleEnvelope(createSyntheticModule());
    const overlay = structuredClone(source);
    overlay.moduleId = 'local.example.overlay';
    overlay.gameNodes[1]!.overrides[0]!.fields = {
      summary: 'Homebrew summary',
    };
    const resolved = resolveModuleOverlays(source, [overlay]);
    expect(resolved.catalogs[0]!.entries[0]!.summary).toBe('Homebrew summary');
    expect(source.catalogs[0]!.entries[0]!.summary).not.toBe(
      'Homebrew summary',
    );
  });
});
