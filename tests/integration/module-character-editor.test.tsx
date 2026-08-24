import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppearanceProvider } from '../../src/features/settings/AppearanceProvider';
import { ModuleRegistry } from '../../src/modules/registry/module-registry';
import { ModuleCharacterEditor } from '../../src/modules/renderer/ModuleCharacterEditor';
import type { StoredCharacter } from '../../src/storage/stored-character';
import type { StoredCharacterRepository } from '../../src/storage/stored-character-repository';
import { createSyntheticModule } from '../fixtures/synthetic-module';

describe('minimal declarative module renderer', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('edits, autosaves, protects Play fields, and reorders shared navigation', async () => {
    const user = userEvent.setup();
    const registry = new ModuleRegistry().register(createSyntheticModule());
    const module = registry.list()[0]!;
    const resolved = registry.resolve(
      module.moduleId,
      module.moduleVersion,
      'test-variant',
      'test-sheet',
      1,
    );
    const record: StoredCharacter = {
      id: 'module-renderer-character',
      systemId: 'arcane-module',
      systemVersion: 1,
      name: 'Rendered Character',
      createdAt: '2026-08-24T12:00:00.000Z',
      updatedAt: '2026-08-24T12:00:00.000Z',
      moduleRef: {
        moduleId: module.moduleId,
        moduleVersion: module.moduleVersion,
        gameNodeId: 'test-variant',
        sheetTemplateId: 'test-sheet',
        sheetTemplateVersion: 1,
        dependencyLockId: 'd432d814-ed66-4749-b1de-7e94dac00f41',
        enabledOverlayRefs: [],
      },
      data: structuredClone(resolved.template.defaults),
    };
    let stored = record;
    const repository: StoredCharacterRepository = {
      list: vi.fn(async () => [stored]),
      get: vi.fn(async () => stored),
      create: vi.fn(async (next) => next),
      save: vi.fn(async (next) => {
        stored = { ...next, updatedAt: new Date().toISOString() };
        return stored;
      }),
      delete: vi.fn(async () => undefined),
    };

    render(
      <AppearanceProvider>
        <ModuleCharacterEditor
          record={record}
          resolved={resolved}
          repository={repository}
          onBack={async () => undefined}
          onRecordChanged={() => undefined}
        />
      </AppearanceProvider>,
    );

    expect(
      screen.getByRole('navigation', { name: 'Character sheet sections' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Set Resolve to 4' }));
    await waitFor(() => expect(repository.save).toHaveBeenCalled());
    expect(stored.data).toMatchObject({ traits: { resolve: 4 } });
    expect(screen.getByText('Saved in this browser')).toBeVisible();

    await user.selectOptions(screen.getByLabelText('Sheet mode'), 'play');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Set Resolve to 5' }),
      ).toBeDisabled(),
    );
    expect(screen.getByLabelText('Resource rating')).not.toHaveAttribute(
      'readonly',
    );

    await user.click(
      screen.getByRole('button', { name: 'Edit section order' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Move Traits earlier' }),
    );
    await waitFor(() =>
      expect(stored.data).toMatchObject({
        layout: { groupOrder: ['traits', 'character'] },
      }),
    );
  });
});
