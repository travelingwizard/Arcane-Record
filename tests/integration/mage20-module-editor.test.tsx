import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppearanceProvider } from '../../src/features/settings/AppearanceProvider';
import { mage20Phase2Module } from '../../src/games/mage20/module/mage20-phase2-module';
import { getMageCharacterData } from '../../src/games/mage20/character-adapter';
import { ModuleRegistry } from '../../src/modules/registry/module-registry';
import { ModuleCharacterEditor } from '../../src/modules/renderer/ModuleCharacterEditor';
import type { StoredCharacter } from '../../src/storage/stored-character';
import type { StoredCharacterRepository } from '../../src/storage/stored-character-repository';
import { createMage20Phase2GoldenCharacter } from '../fixtures/mage20-phase2-golden';

describe('Mage 20 Phase 2 module editor', () => {
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

  afterEach(() => vi.unstubAllGlobals());

  it('matches identity/group layout, locks dots in Play, and keeps per-mode order', async () => {
    const user = userEvent.setup();
    const registry = new ModuleRegistry().register(mage20Phase2Module);
    const resolved = registry.resolve(
      mage20Phase2Module.moduleId,
      mage20Phase2Module.moduleVersion,
      'mage20',
      'mage20-character',
      1,
    );
    const legacy = getMageCharacterData(createMage20Phase2GoldenCharacter());
    const record: StoredCharacter = {
      id: 'mage20-phase2-renderer',
      systemId: 'arcane-module',
      systemVersion: 1,
      name: legacy.identity.name,
      createdAt: '2026-08-24T12:00:00.000Z',
      updatedAt: '2026-08-24T12:00:00.000Z',
      moduleRef: {
        moduleId: mage20Phase2Module.moduleId,
        moduleVersion: mage20Phase2Module.moduleVersion,
        gameNodeId: 'mage20',
        sheetTemplateId: 'mage20-character',
        sheetTemplateVersion: 1,
        dependencyLockId: 'dd105e5f-b389-48fd-ac66-c071fe0afac7',
        enabledOverlayRefs: [],
      },
      data: {
        ...structuredClone(resolved.template.defaults),
        identity: legacy.identity,
        attributes: legacy.attributes,
        abilities: legacy.abilities,
      },
    };
    let stored = record;
    const repository: StoredCharacterRepository = {
      list: vi.fn(async () => [stored]),
      get: vi.fn(async () => stored),
      create: vi.fn(async (next) => next),
      save: vi.fn(async (next) => {
        stored = next;
        return next;
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

    expect(screen.getByLabelText('Name')).toHaveValue('Morgan Vale');
    expect(screen.getByRole('heading', { name: 'Physical' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Talents' })).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Correspondence' }),
    ).toBeVisible();
    await user.click(
      screen.getByRole('button', {
        name: 'Mark Correspondence as Affinity Sphere',
      }),
    );
    expect(
      screen.getByRole('button', {
        name: 'Clear Correspondence as Affinity Sphere',
      }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Add Quintessence' }));
    expect(screen.getByLabelText('Quintessence rating')).toHaveTextContent(
      '1 / 20',
    );
    await user.click(
      screen.getByRole('button', { name: 'Bruised: Unmarked damage' }),
    );
    expect(
      screen.getByRole('button', { name: 'Bruised: Bashing damage' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Set Dexterity to 5' }),
    ).toBeEnabled();

    const backgrounds = screen.getByRole('region', { name: 'Backgrounds' });
    await user.click(
      within(backgrounds).getByRole('button', { name: 'Open catalog' }),
    );
    await user.click(
      within(backgrounds).getAllByRole('button', { name: 'Add' })[0]!,
    );
    const focus = screen.getByRole('region', { name: 'Focus' });
    await user.type(
      within(focus).getByRole('textbox', { name: 'Custom name' }),
      'Everything is connected',
    );
    await user.click(within(focus).getByRole('button', { name: 'Add custom' }));
    await waitFor(() =>
      expect(stored.data).toMatchObject({
        repeatableEntries: {
          backgrounds: [expect.objectContaining({ rating: 1 })],
          focus: {
            paradigms: [
              expect.objectContaining({
                customName: 'Everything is connected',
              }),
            ],
          },
        },
      }),
    );

    await user.click(screen.getByRole('switch'));
    expect(
      screen.getByText(
        'Attributes and Abilities are view-only in Play mode. Identity remains editable.',
      ),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Set Dexterity to 5' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Set Arete to 2' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Set Temporary Willpower to 6' }),
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Add Paradox' })).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Hurt: Unmarked damage' }),
    ).toBeEnabled();
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('readonly');

    const navigation = screen.getByRole('navigation', {
      name: 'Character sheet sections',
    });
    const groupControls = within(navigation)
      .getAllByRole('heading', { level: 2 })
      .map((heading) => within(heading).getByRole('button'))
      .map((button) => button.getAttribute('aria-controls'));
    expect(groupControls).toEqual([
      'character-section-nav-condition',
      'character-section-nav-magick',
      'character-section-nav-traits',
      'character-section-nav-gear',
      'character-section-nav-advantages',
      'character-section-nav-paradigm',
      'character-section-nav-character',
      'character-section-nav-records',
    ]);

    await user.click(screen.getByRole('switch'));
    await user.click(
      screen.getByRole('button', { name: 'Edit section order' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Move Traits earlier' }),
    );
    await waitFor(() =>
      expect(stored.data).toMatchObject({
        sheetLayout: {
          groupOrders: {
            build: [
              'traits',
              'character',
              'magick',
              'advantages',
              'condition',
              'gear',
              'paradigm',
              'records',
            ],
            play: [
              'condition',
              'magick',
              'traits',
              'gear',
              'advantages',
              'paradigm',
              'character',
              'records',
            ],
          },
        },
      }),
    );
    expect(screen.getByText('Saved in this browser')).toBeVisible();
  }, 10_000);
});
