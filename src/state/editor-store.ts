import { create } from 'zustand';
import type {
  AbilityGroupId,
  AbilityId,
  AttributeGroupId,
  AttributeId,
  EnlightenmentId,
  IdentityFieldId,
  SphereId,
} from '../systems/mage-m20/definitions';
import { backgroundRatingRules } from '../systems/mage-m20/background-rules';
import { backgroundById } from '../systems/mage-m20/reference/backgrounds';
import type { MeritFlawKind } from '../systems/mage-m20/reference/merits-flaws';
import { meritFlawById } from '../systems/mage-m20/reference/merits-flaws';
import type {
  MageCharacter,
  SelectedBackground,
  SelectedMeritFlaw,
} from '../types/character';

export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

export type MeritFlawUndo =
  | {
      type: 'remove';
      kind: MeritFlawKind;
      selection: SelectedMeritFlaw;
      index: number;
    }
  | {
      type: 'update';
      kind: MeritFlawKind;
      selection: SelectedMeritFlaw;
    };

export type BackgroundUndo =
  | {
      type: 'remove';
      selection: SelectedBackground;
      index: number;
    }
  | {
      type: 'update';
      selection: SelectedBackground;
    };

interface EditorState {
  character: MageCharacter | null;
  revision: number;
  saveStatus: SaveStatus;
  lastMeritFlawChange: MeritFlawUndo | null;
  lastBackgroundChange: BackgroundUndo | null;
  load: (character: MageCharacter) => void;
  clear: () => void;
  updateIdentity: (field: IdentityFieldId, value: string) => void;
  updateAttribute: (
    group: AttributeGroupId,
    trait: AttributeId,
    value: number,
  ) => void;
  updateAbility: (
    group: AbilityGroupId,
    ability: AbilityId,
    value: number,
  ) => void;
  updateEnlightenment: (trait: EnlightenmentId, value: number) => void;
  updateTemporaryWillpower: (value: number) => void;
  addBackground: (definitionId: string) => string | null;
  updateBackground: (
    selectionId: string,
    update: Partial<
      Pick<SelectedBackground, 'displayName' | 'rating' | 'notes' | 'pooled'>
    >,
  ) => void;
  repairBackground: (selectionId: string, definitionId: string) => void;
  removeBackground: (selectionId: string) => void;
  undoBackgroundChange: () => void;
  addMeritFlaw: (
    kind: MeritFlawKind,
    definitionId: string,
    chosenCost: number,
  ) => void;
  updateMeritFlaw: (
    kind: MeritFlawKind,
    selectionId: string,
    update: Partial<Pick<SelectedMeritFlaw, 'chosenCost' | 'notes'>>,
  ) => void;
  removeMeritFlaw: (kind: MeritFlawKind, selectionId: string) => void;
  undoMeritFlawChange: () => void;
  cycleHealthDamage: (index: number) => void;
  updateSphere: (sphere: SphereId, value: number) => void;
  toggleAffinity: (sphere: SphereId) => void;
  markSaving: (revision: number) => void;
  markSaved: (character: MageCharacter, revision: number) => void;
  markSaveFailed: (revision: number) => void;
}

function withChange(
  state: EditorState,
  update: (character: MageCharacter) => MageCharacter,
): Partial<EditorState> {
  if (!state.character) {
    return {};
  }
  return {
    character: update(state.character),
    revision: state.revision + 1,
    saveStatus: 'unsaved',
  };
}

export const useEditorStore = create<EditorState>((set) => ({
  character: null,
  revision: 0,
  saveStatus: 'saved',
  lastMeritFlawChange: null,
  lastBackgroundChange: null,

  load: (character) =>
    set({
      character,
      revision: 0,
      saveStatus: 'saved',
      lastMeritFlawChange: null,
      lastBackgroundChange: null,
    }),

  clear: () =>
    set({
      character: null,
      revision: 0,
      saveStatus: 'saved',
      lastMeritFlawChange: null,
      lastBackgroundChange: null,
    }),

  updateIdentity: (field, value) =>
    set((state) =>
      withChange(state, (character) => ({
        ...character,
        identity: { ...character.identity, [field]: value },
      })),
    ),

  updateAttribute: (group, trait, value) =>
    set((state) =>
      withChange(state, (character) => ({
        ...character,
        attributes: {
          ...character.attributes,
          [group]: {
            ...character.attributes[group],
            [trait]: value,
          },
        },
      })),
    ),

  updateAbility: (group, ability, value) =>
    set((state) =>
      withChange(state, (character) => ({
        ...character,
        abilities: {
          ...character.abilities,
          [group]: {
            ...character.abilities[group],
            [ability]: value,
          },
        },
      })),
    ),

  updateEnlightenment: (trait, value) =>
    set((state) =>
      withChange(state, (character) => ({
        ...character,
        enlightenment: {
          ...character.enlightenment,
          [trait]: value,
        },
      })),
    ),

  updateTemporaryWillpower: (value) =>
    set((state) =>
      withChange(state, (character) => ({
        ...character,
        enlightenment: {
          ...character.enlightenment,
          willpowerTemporary: value,
        },
      })),
    ),

  addBackground: (definitionId) => {
    let addedId: string | null = null;
    set((state) => {
      if (!state.character) {
        return {};
      }
      const definition = backgroundById.get(definitionId);
      if (!definition) {
        return {};
      }
      const alreadySelected =
        state.character.repeatableEntries.backgrounds.some(
          (selection) => selection.definitionId === definitionId,
        );
      if (alreadySelected && !definition.canBeSelectedMultipleTimes) {
        return {};
      }
      addedId = crypto.randomUUID();
      const selection: SelectedBackground = {
        id: addedId,
        definitionId,
        displayName: definition.name,
        rating: definition.minimumRating,
        notes: '',
        addedAt: new Date().toISOString(),
        pooled: false,
      };
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            backgrounds: [
              ...character.repeatableEntries.backgrounds,
              selection,
            ],
          },
        })),
        lastBackgroundChange: null,
      };
    });
    return addedId;
  },

  updateBackground: (selectionId, update) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const selection = state.character.repeatableEntries.backgrounds.find(
        (entry) => entry.id === selectionId,
      );
      if (!selection) {
        return {};
      }
      const definition = backgroundById.get(selection.definitionId);
      if (update.rating !== undefined) {
        const minimum = definition?.minimumRating ?? 0;
        const maximum = definition
          ? definition.supportsRatingsAboveFive
            ? backgroundRatingRules.extendedInterfaceMaximum
            : definition.standardMaximumRating
          : backgroundRatingRules.extendedInterfaceMaximum;
        if (
          !Number.isInteger(update.rating) ||
          update.rating < minimum ||
          update.rating > maximum
        ) {
          return {};
        }
      }
      if (update.pooled && definition && !definition.canBePooled) {
        return {};
      }
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            backgrounds: character.repeatableEntries.backgrounds.map((entry) =>
              entry.id === selectionId ? { ...entry, ...update } : entry,
            ),
          },
        })),
        lastBackgroundChange: { type: 'update', selection },
      };
    }),

  repairBackground: (selectionId, definitionId) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const selection = state.character.repeatableEntries.backgrounds.find(
        (entry) => entry.id === selectionId,
      );
      const definition = backgroundById.get(definitionId);
      if (!selection || !definition) {
        return {};
      }
      const duplicate = state.character.repeatableEntries.backgrounds.some(
        (entry) =>
          entry.id !== selectionId && entry.definitionId === definitionId,
      );
      const maximum = definition.supportsRatingsAboveFive
        ? backgroundRatingRules.extendedInterfaceMaximum
        : definition.standardMaximumRating;
      if (
        (duplicate && !definition.canBeSelectedMultipleTimes) ||
        selection.rating < definition.minimumRating ||
        selection.rating > maximum
      ) {
        return {};
      }
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            backgrounds: character.repeatableEntries.backgrounds.map((entry) =>
              entry.id === selectionId
                ? {
                    ...entry,
                    definitionId,
                    pooled: definition.canBePooled ? entry.pooled : false,
                    unresolvedDefinitionName: undefined,
                  }
                : entry,
            ),
          },
        })),
        lastBackgroundChange: { type: 'update', selection },
      };
    }),

  removeBackground: (selectionId) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const index = state.character.repeatableEntries.backgrounds.findIndex(
        (entry) => entry.id === selectionId,
      );
      if (index < 0) {
        return {};
      }
      const selection = state.character.repeatableEntries.backgrounds[index];
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            backgrounds: character.repeatableEntries.backgrounds.filter(
              (entry) => entry.id !== selectionId,
            ),
          },
        })),
        lastBackgroundChange: { type: 'remove', selection, index },
      };
    }),

  undoBackgroundChange: () =>
    set((state) => {
      if (!state.character || !state.lastBackgroundChange) {
        return {};
      }
      const change = state.lastBackgroundChange;
      return {
        ...withChange(state, (character) => {
          const backgrounds = [...character.repeatableEntries.backgrounds];
          if (change.type === 'remove') {
            backgrounds.splice(change.index, 0, change.selection);
          } else {
            const index = backgrounds.findIndex(
              (entry) => entry.id === change.selection.id,
            );
            if (index >= 0) {
              backgrounds[index] = change.selection;
            }
          }
          return {
            ...character,
            repeatableEntries: {
              ...character.repeatableEntries,
              backgrounds,
            },
          };
        }),
        lastBackgroundChange: null,
      };
    }),

  addMeritFlaw: (kind, definitionId, chosenCost) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const definition = meritFlawById.get(definitionId);
      const alreadySelected = [
        ...state.character.repeatableEntries.merits,
        ...state.character.repeatableEntries.flaws,
      ].some((selection) => selection.definitionId === definitionId);
      if (
        !definition ||
        definition.kind !== kind ||
        !definition.allowedCosts.includes(chosenCost) ||
        alreadySelected
      ) {
        return {};
      }
      const key = kind === 'merit' ? 'merits' : 'flaws';
      const selection: SelectedMeritFlaw = {
        id: crypto.randomUUID(),
        definitionId,
        chosenCost,
        notes: '',
        addedAt: new Date().toISOString(),
      };
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            [key]: [...character.repeatableEntries[key], selection],
          },
        })),
        lastMeritFlawChange: null,
      };
    }),

  updateMeritFlaw: (kind, selectionId, update) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const key = kind === 'merit' ? 'merits' : 'flaws';
      const selection = state.character.repeatableEntries[key].find(
        (entry) => entry.id === selectionId,
      );
      if (!selection) {
        return {};
      }
      const definition = meritFlawById.get(selection.definitionId);
      if (
        update.chosenCost !== undefined &&
        definition &&
        !definition.allowedCosts.includes(update.chosenCost)
      ) {
        return {};
      }
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            [key]: character.repeatableEntries[key].map((entry) =>
              entry.id === selectionId ? { ...entry, ...update } : entry,
            ),
          },
        })),
        lastMeritFlawChange: {
          type: 'update',
          kind,
          selection,
        },
      };
    }),

  removeMeritFlaw: (kind, selectionId) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const key = kind === 'merit' ? 'merits' : 'flaws';
      const index = state.character.repeatableEntries[key].findIndex(
        (entry) => entry.id === selectionId,
      );
      if (index < 0) {
        return {};
      }
      const selection = state.character.repeatableEntries[key][index];
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            [key]: character.repeatableEntries[key].filter(
              (entry) => entry.id !== selectionId,
            ),
          },
        })),
        lastMeritFlawChange: {
          type: 'remove',
          kind,
          selection,
          index,
        },
      };
    }),

  undoMeritFlawChange: () =>
    set((state) => {
      if (!state.character || !state.lastMeritFlawChange) {
        return {};
      }
      const change = state.lastMeritFlawChange;
      const key = change.kind === 'merit' ? 'merits' : 'flaws';
      return {
        ...withChange(state, (character) => {
          const entries = [...character.repeatableEntries[key]];
          if (change.type === 'remove') {
            entries.splice(change.index, 0, change.selection);
          } else {
            const index = entries.findIndex(
              (entry) => entry.id === change.selection.id,
            );
            if (index >= 0) {
              entries[index] = change.selection;
            }
          }
          return {
            ...character,
            repeatableEntries: {
              ...character.repeatableEntries,
              [key]: entries,
            },
          };
        }),
        lastMeritFlawChange: null,
      };
    }),

  cycleHealthDamage: (index) =>
    set((state) =>
      withChange(state, (character) => {
        const damage = [...character.health.damage];
        const current = damage[index];

        if (index > damage.length || index < 0 || index >= 7) {
          return character;
        }
        if (!current) {
          damage.push('bashing');
        } else if (current === 'bashing') {
          damage[index] = 'lethal';
        } else if (current === 'lethal') {
          damage[index] = 'aggravated';
        } else {
          damage.splice(index);
        }

        return {
          ...character,
          health: { damage },
        };
      }),
    ),

  updateSphere: (sphere, value) =>
    set((state) =>
      withChange(state, (character) => ({
        ...character,
        spheres: { ...character.spheres, [sphere]: value },
      })),
    ),

  toggleAffinity: (sphere) =>
    set((state) =>
      withChange(state, (character) => ({
        ...character,
        affinitySphere: character.affinitySphere === sphere ? null : sphere,
      })),
    ),

  markSaving: (revision) =>
    set((state) =>
      state.revision === revision ? { saveStatus: 'saving' } : {},
    ),

  markSaved: (savedCharacter, revision) =>
    set((state) => {
      if (!state.character || state.character.id !== savedCharacter.id) {
        return {};
      }
      if (state.revision !== revision) {
        return {
          character: {
            ...state.character,
            updatedAt: savedCharacter.updatedAt,
          },
        };
      }
      return {
        character: savedCharacter,
        saveStatus: 'saved',
      };
    }),

  markSaveFailed: (revision) =>
    set((state) =>
      state.revision === revision ? { saveStatus: 'error' } : {},
    ),
}));
