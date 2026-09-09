import { describe, expect, it } from 'vitest';
import {
  addBuilderComponent,
  duplicateComponent,
  moveComponent,
  moveItem,
  removeComponent,
} from '../../src/features/module-builder/builder-commands';
import { createModuleDraft } from '../../src/features/module-builder/create-module-draft';
import { validateModuleEnvelope } from '../../src/modules/registry/module-validation';

describe('module builder commands', () => {
  it('adds schema-bound safe components and preserves validation', () => {
    const module = createModuleDraft();
    const id = addBuilderComponent(module, 'identity', 'dot-rating');
    expect(module.sheetTemplates[0]!.sections[0]!.componentIds).toContain(id);
    expect(validateModuleEnvelope(module)).toBeTruthy();
  });

  it('adds every general-purpose palette field as validated data', () => {
    const module = createModuleDraft();
    for (const kind of [
      'text',
      'multiline-text',
      'number',
      'checkbox',
      'select',
      'dot-rating',
    ] as const)
      addBuilderComponent(module, 'identity', kind);
    expect(validateModuleEnvelope(module).reusableComponents).toHaveLength(7);
  });

  it('moves, duplicates, and removes components deterministically', () => {
    const module = createModuleDraft();
    module.sheetTemplates[0]!.sections.push({
      id: 'second',
      label: 'Second',
      groupId: 'character',
      order: 1,
      componentIds: [],
    });
    const id = addBuilderComponent(module, 'identity', 'text');
    moveComponent(module.sheetTemplates[0]!, id, 'second');
    expect(module.sheetTemplates[0]!.sections[1]!.componentIds).toEqual([id]);
    const copy = duplicateComponent(module, id, 'second');
    expect(module.sheetTemplates[0]!.sections[1]!.componentIds).toEqual([
      id,
      copy,
    ]);
    const originalComponent = module.reusableComponents.find(
      (item) => item.id === id,
    );
    const copiedComponent = module.reusableComponents.find(
      (item) => item.id === copy,
    );
    expect(
      copiedComponent && 'dataPath' in copiedComponent
        ? copiedComponent.dataPath
        : undefined,
    ).not.toEqual(
      originalComponent && 'dataPath' in originalComponent
        ? originalComponent.dataPath
        : undefined,
    );
    removeComponent(module, copy);
    expect(module.reusableComponents.some((item) => item.id === copy)).toBe(
      false,
    );
  });

  it('offers the same reorder operation to pointer and keyboard UI', () => {
    const items = ['a', 'b', 'c'];
    moveItem(items, 2, 0);
    expect(items).toEqual(['c', 'a', 'b']);
  });
});
