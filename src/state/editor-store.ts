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
import { equipmentById } from '../systems/mage-m20/reference/equipment';
import {
  focusDefinitionsByKind,
  type FocusKind,
} from '../systems/mage-m20/reference/focus';
import type { MeritFlawKind } from '../systems/mage-m20/reference/merits-flaws';
import { meritFlawById } from '../systems/mage-m20/reference/merits-flaws';
import {
  combatManeuverById,
  doManeuverById,
  getSpecialDoTechniqueAllowance,
} from '../systems/mage-m20/reference/maneuvers';
import { roteById } from '../systems/mage-m20/reference/rotes';
import { wonderById } from '../systems/mage-m20/reference/wonders';
import type {
  CustomCombatManeuver,
  CustomDoTechniqueInput,
  FocusSelection,
  InstrumentSelection,
  KnownRote,
  MageCharacter,
  OwnedEquipment,
  OwnedWonder,
  SelectedDoManeuver,
  SelectedBackground,
  SelectedMeritFlaw,
  SheetLayout,
} from '../types/character';
import type {
  CharacterSectionGroupId,
  SheetLayoutMode,
} from '../systems/mage-m20/character-sections';

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

export type MagickRemoval =
  | {
      type: 'focus';
      kind: FocusKind;
      selection: FocusSelection | InstrumentSelection;
      index: number;
    }
  | { type: 'wonder'; selection: OwnedWonder; index: number }
  | { type: 'rote'; selection: KnownRote; index: number };

export interface EquipmentRemoval {
  selection: OwnedEquipment;
  index: number;
}

export type ManeuverRemoval =
  | {
      type: 'custom-combat';
      selection: CustomCombatManeuver;
      index: number;
      wasFavorite: boolean;
    }
  | { type: 'do'; selection: SelectedDoManeuver; index: number };

const focusKeyByKind = {
  paradigm: 'paradigms',
  practice: 'practices',
  instrument: 'instruments',
} as const;

interface EditorState {
  updateMage: (update: (character: MageCharacter) => MageCharacter) => void;
  character: MageCharacter | null;
  revision: number;
  saveStatus: SaveStatus;
  lastMeritFlawChange: MeritFlawUndo | null;
  lastBackgroundChange: BackgroundUndo | null;
  lastMagickRemoval: MagickRemoval | null;
  lastEquipmentRemoval: EquipmentRemoval | null;
  lastManeuverRemoval: ManeuverRemoval | null;
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
  updateExperience: (field: 'total' | 'current', value: number) => void;
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
    update: Partial<Pick<SelectedMeritFlaw, 'chosenCost' | 'notes' | 'choice'>>,
  ) => void;
  removeMeritFlaw: (kind: MeritFlawKind, selectionId: string) => void;
  undoMeritFlawChange: () => void;
  updateFocusText: (field: 'need' | 'culture' | 'notes', value: string) => void;
  addFocusSelection: (
    kind: FocusKind,
    definitionId?: string,
    customName?: string,
  ) => string | null;
  updateFocusSelection: (
    kind: FocusKind,
    selectionId: string,
    update: Partial<
      Pick<FocusSelection, 'customName' | 'notes'> & {
        significant: boolean;
      }
    >,
  ) => void;
  removeFocusSelection: (kind: FocusKind, selectionId: string) => void;
  addWonder: (definitionId?: string, customName?: string) => string | null;
  updateWonder: (
    selectionId: string,
    update: Partial<
      Pick<OwnedWonder, 'name' | 'typeLabel' | 'rating' | 'powers' | 'notes'>
    >,
  ) => void;
  removeWonder: (selectionId: string) => void;
  addRote: (definitionId?: string, customName?: string) => string | null;
  updateRote: (
    selectionId: string,
    update: Partial<
      Pick<
        KnownRote,
        | 'name'
        | 'sphereRequirements'
        | 'requirementNotes'
        | 'effect'
        | 'focusNotes'
        | 'notes'
      >
    >,
  ) => void;
  removeRote: (selectionId: string) => void;
  undoMagickRemoval: () => void;
  addEquipment: (
    definitionId?: string,
    custom?: Pick<OwnedEquipment, 'name' | 'description' | 'category'>,
  ) => string | null;
  updateEquipment: (
    selectionId: string,
    update: Partial<
      Pick<
        OwnedEquipment,
        'name' | 'category' | 'description' | 'quantity' | 'equipped' | 'notes'
      >
    >,
  ) => void;
  removeEquipment: (selectionId: string) => void;
  undoEquipmentRemoval: () => void;
  toggleCombatManeuverFavorite: (maneuverId: string) => void;
  addCustomCombatManeuver: (name: string, description: string) => string | null;
  updateCustomCombatManeuver: (
    maneuverId: string,
    update: Partial<
      Pick<CustomCombatManeuver, 'name' | 'description' | 'notes'>
    >,
  ) => void;
  removeCustomCombatManeuver: (maneuverId: string) => void;
  addDoManeuver: (
    definitionId?: string,
    custom?: CustomDoTechniqueInput,
  ) => string | null;
  updateDoManeuver: (
    selectionId: string,
    update: Partial<
      Pick<
        SelectedDoManeuver,
        | 'customName'
        | 'customSummary'
        | 'customRoll'
        | 'customDifficulty'
        | 'customDamage'
        | 'customActions'
        | 'customSourceTitle'
        | 'customSourcePage'
        | 'notes'
      >
    >,
  ) => void;
  removeDoManeuver: (selectionId: string) => void;
  undoManeuverRemoval: () => void;
  cycleHealthDamage: (index: number) => void;
  updateSphere: (sphere: SphereId, value: number) => void;
  toggleAffinity: (sphere: SphereId) => void;
  setSheetLayoutMode: (mode: SheetLayoutMode) => void;
  moveSheetGroup: (
    mode: SheetLayoutMode,
    groupId: CharacterSectionGroupId,
    direction: 'earlier' | 'later',
  ) => void;
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
  updateMage: (update) => set((state) => withChange(state, update)),
  character: null,
  revision: 0,
  saveStatus: 'saved',
  lastMeritFlawChange: null,
  lastBackgroundChange: null,
  lastMagickRemoval: null,
  lastEquipmentRemoval: null,
  lastManeuverRemoval: null,

  load: (character) =>
    set({
      character,
      revision: 0,
      saveStatus: 'saved',
      lastMeritFlawChange: null,
      lastBackgroundChange: null,
      lastMagickRemoval: null,
      lastEquipmentRemoval: null,
      lastManeuverRemoval: null,
    }),

  clear: () =>
    set({
      character: null,
      revision: 0,
      saveStatus: 'saved',
      lastMeritFlawChange: null,
      lastBackgroundChange: null,
      lastMagickRemoval: null,
      lastEquipmentRemoval: null,
      lastManeuverRemoval: null,
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

  updateExperience: (field, value) =>
    set((state) =>
      withChange(state, (character) => ({
        ...character,
        experience: {
          ...character.experience,
          [field]: Math.max(0, Math.trunc(value)),
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
        !definition.playerSelectable ||
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

  updateFocusText: (field, value) =>
    set((state) =>
      withChange(state, (character) => ({
        ...character,
        repeatableEntries: {
          ...character.repeatableEntries,
          focus: {
            ...character.repeatableEntries.focus,
            [field]: value,
          },
        },
      })),
    ),

  addFocusSelection: (kind, definitionId, customName) => {
    let addedId: string | null = null;
    set((state) => {
      if (!state.character) {
        return {};
      }
      const definition = definitionId
        ? focusDefinitionsByKind[kind].get(definitionId)
        : undefined;
      const trimmedCustomName = customName?.trim();
      if (
        (definitionId && !definition) ||
        (!definition && !trimmedCustomName)
      ) {
        return {};
      }
      const focus = state.character.repeatableEntries.focus;
      const allSelections = [
        ...focus.paradigms,
        ...focus.practices,
        ...focus.instruments,
      ];
      if (
        definitionId &&
        allSelections.some(
          (selection) => selection.definitionId === definitionId,
        )
      ) {
        return {};
      }
      addedId = crypto.randomUUID();
      const base = {
        id: addedId,
        ...(definitionId
          ? { definitionId }
          : { customName: trimmedCustomName }),
        notes: '',
        addedAt: new Date().toISOString(),
      };
      const selection =
        kind === 'instrument' ? { ...base, significant: false } : base;
      const key = focusKeyByKind[kind];
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            focus: {
              ...character.repeatableEntries.focus,
              [key]: [...character.repeatableEntries.focus[key], selection],
            },
          },
        })),
        lastMagickRemoval: null,
      };
    });
    return addedId;
  },

  updateFocusSelection: (kind, selectionId, update) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const key = focusKeyByKind[kind];
      const selections = state.character.repeatableEntries.focus[key];
      if (!selections.some((selection) => selection.id === selectionId)) {
        return {};
      }
      const safeUpdate =
        kind === 'instrument'
          ? update
          : { customName: update.customName, notes: update.notes };
      return withChange(state, (character) => ({
        ...character,
        repeatableEntries: {
          ...character.repeatableEntries,
          focus: {
            ...character.repeatableEntries.focus,
            [key]: character.repeatableEntries.focus[key].map((selection) =>
              selection.id === selectionId
                ? { ...selection, ...safeUpdate }
                : selection,
            ),
          },
        },
      }));
    }),

  removeFocusSelection: (kind, selectionId) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const key = focusKeyByKind[kind];
      const selections = state.character.repeatableEntries.focus[key];
      const index = selections.findIndex(
        (selection) => selection.id === selectionId,
      );
      if (index < 0) {
        return {};
      }
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            focus: {
              ...character.repeatableEntries.focus,
              [key]: character.repeatableEntries.focus[key].filter(
                (selection) => selection.id !== selectionId,
              ),
            },
          },
        })),
        lastMagickRemoval: {
          type: 'focus',
          kind,
          selection: selections[index],
          index,
        },
      };
    }),

  addWonder: (definitionId, customName) => {
    let addedId: string | null = null;
    set((state) => {
      if (!state.character) {
        return {};
      }
      const definition = definitionId
        ? wonderById.get(definitionId)
        : undefined;
      const trimmedCustomName = customName?.trim();
      if (
        (definitionId && !definition) ||
        (!definition && !trimmedCustomName)
      ) {
        return {};
      }
      if (
        definitionId &&
        state.character.repeatableEntries.wonders.some(
          (selection) => selection.definitionId === definitionId,
        )
      ) {
        return {};
      }
      addedId = crypto.randomUUID();
      const selection: OwnedWonder = {
        id: addedId,
        ...(definitionId ? { definitionId } : {}),
        name: definition?.name ?? trimmedCustomName!,
        typeLabel: definition?.typeLabel ?? '',
        rating: null,
        powers: '',
        notes: '',
        addedAt: new Date().toISOString(),
      };
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            wonders: [...character.repeatableEntries.wonders, selection],
          },
        })),
        lastMagickRemoval: null,
      };
    });
    return addedId;
  },

  updateWonder: (selectionId, update) =>
    set((state) => {
      if (
        !state.character ||
        !state.character.repeatableEntries.wonders.some(
          (selection) => selection.id === selectionId,
        )
      ) {
        return {};
      }
      if (
        update.rating !== undefined &&
        update.rating !== null &&
        (!Number.isInteger(update.rating) ||
          update.rating < 0 ||
          update.rating > 10)
      ) {
        return {};
      }
      return withChange(state, (character) => ({
        ...character,
        repeatableEntries: {
          ...character.repeatableEntries,
          wonders: character.repeatableEntries.wonders.map((selection) =>
            selection.id === selectionId
              ? { ...selection, ...update }
              : selection,
          ),
        },
      }));
    }),

  removeWonder: (selectionId) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const index = state.character.repeatableEntries.wonders.findIndex(
        (selection) => selection.id === selectionId,
      );
      if (index < 0) {
        return {};
      }
      const selection = state.character.repeatableEntries.wonders[index];
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            wonders: character.repeatableEntries.wonders.filter(
              (entry) => entry.id !== selectionId,
            ),
          },
        })),
        lastMagickRemoval: { type: 'wonder', selection, index },
      };
    }),

  addRote: (definitionId, customName) => {
    let addedId: string | null = null;
    set((state) => {
      if (!state.character) {
        return {};
      }
      const definition = definitionId ? roteById.get(definitionId) : undefined;
      const trimmedCustomName = customName?.trim();
      if (
        (definitionId && !definition) ||
        (!definition && !trimmedCustomName)
      ) {
        return {};
      }
      if (
        definitionId &&
        state.character.repeatableEntries.rotes.some(
          (selection) => selection.definitionId === definitionId,
        )
      ) {
        return {};
      }
      addedId = crypto.randomUUID();
      const selection: KnownRote = {
        id: addedId,
        ...(definitionId ? { definitionId } : {}),
        name: definition?.name ?? trimmedCustomName!,
        sphereRequirements: [],
        requirementNotes: definition?.requirements ?? '',
        effect: '',
        focusNotes: '',
        notes: '',
        addedAt: new Date().toISOString(),
      };
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            rotes: [...character.repeatableEntries.rotes, selection],
          },
        })),
        lastMagickRemoval: null,
      };
    });
    return addedId;
  },

  updateRote: (selectionId, update) =>
    set((state) => {
      if (
        !state.character ||
        !state.character.repeatableEntries.rotes.some(
          (selection) => selection.id === selectionId,
        )
      ) {
        return {};
      }
      return withChange(state, (character) => ({
        ...character,
        repeatableEntries: {
          ...character.repeatableEntries,
          rotes: character.repeatableEntries.rotes.map((selection) =>
            selection.id === selectionId
              ? { ...selection, ...update }
              : selection,
          ),
        },
      }));
    }),

  removeRote: (selectionId) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const index = state.character.repeatableEntries.rotes.findIndex(
        (selection) => selection.id === selectionId,
      );
      if (index < 0) {
        return {};
      }
      const selection = state.character.repeatableEntries.rotes[index];
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            rotes: character.repeatableEntries.rotes.filter(
              (entry) => entry.id !== selectionId,
            ),
          },
        })),
        lastMagickRemoval: { type: 'rote', selection, index },
      };
    }),

  undoMagickRemoval: () =>
    set((state) => {
      if (!state.character || !state.lastMagickRemoval) {
        return {};
      }
      const removal = state.lastMagickRemoval;
      return {
        ...withChange(state, (character) => {
          if (removal.type === 'focus') {
            const key = focusKeyByKind[removal.kind];
            const selections = [...character.repeatableEntries.focus[key]];
            selections.splice(removal.index, 0, removal.selection);
            return {
              ...character,
              repeatableEntries: {
                ...character.repeatableEntries,
                focus: {
                  ...character.repeatableEntries.focus,
                  [key]: selections,
                },
              },
            };
          }
          const key = removal.type === 'wonder' ? 'wonders' : 'rotes';
          const selections = [...character.repeatableEntries[key]] as Array<
            OwnedWonder | KnownRote
          >;
          selections.splice(removal.index, 0, removal.selection);
          return {
            ...character,
            repeatableEntries: {
              ...character.repeatableEntries,
              [key]: selections,
            },
          } as MageCharacter;
        }),
        lastMagickRemoval: null,
      };
    }),

  addEquipment: (definitionId, custom) => {
    let addedId: string | null = null;
    set((state) => {
      if (!state.character) {
        return {};
      }
      const definition = definitionId
        ? equipmentById.get(definitionId)
        : undefined;
      const name = custom?.name.trim();
      const description = custom?.description.trim();
      if (
        (definitionId && !definition) ||
        (!definition && (!name || !description))
      ) {
        return {};
      }
      if (
        definitionId &&
        state.character.repeatableEntries.equipment.some(
          (selection) => selection.definitionId === definitionId,
        )
      ) {
        return {};
      }
      addedId = crypto.randomUUID();
      const selection: OwnedEquipment = {
        id: addedId,
        ...(definitionId ? { definitionId } : {}),
        name: definition?.name ?? name!,
        category: definition?.category ?? custom!.category,
        description: definition ? '' : description!,
        quantity: 1,
        equipped: false,
        notes: '',
        addedAt: new Date().toISOString(),
      };
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            equipment: [...character.repeatableEntries.equipment, selection],
          },
        })),
        lastEquipmentRemoval: null,
      };
    });
    return addedId;
  },

  updateEquipment: (selectionId, update) =>
    set((state) => {
      if (
        !state.character ||
        !state.character.repeatableEntries.equipment.some(
          (selection) => selection.id === selectionId,
        )
      ) {
        return {};
      }
      if (
        update.quantity !== undefined &&
        (!Number.isInteger(update.quantity) ||
          update.quantity < 1 ||
          update.quantity > 999)
      ) {
        return {};
      }
      const selection = state.character.repeatableEntries.equipment.find(
        (entry) => entry.id === selectionId,
      );
      const definition = selection?.definitionId
        ? equipmentById.get(selection.definitionId)
        : undefined;
      const safeUpdate = definition
        ? { ...update, category: definition.category }
        : update;
      return withChange(state, (character) => ({
        ...character,
        repeatableEntries: {
          ...character.repeatableEntries,
          equipment: character.repeatableEntries.equipment.map((entry) =>
            entry.id === selectionId ? { ...entry, ...safeUpdate } : entry,
          ),
        },
      }));
    }),

  removeEquipment: (selectionId) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const index = state.character.repeatableEntries.equipment.findIndex(
        (selection) => selection.id === selectionId,
      );
      if (index < 0) {
        return {};
      }
      const selection = state.character.repeatableEntries.equipment[index];
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            equipment: character.repeatableEntries.equipment.filter(
              (entry) => entry.id !== selectionId,
            ),
          },
        })),
        lastEquipmentRemoval: { selection, index },
      };
    }),

  undoEquipmentRemoval: () =>
    set((state) => {
      if (!state.character || !state.lastEquipmentRemoval) {
        return {};
      }
      const equipment = [...state.character.repeatableEntries.equipment];
      equipment.splice(
        state.lastEquipmentRemoval.index,
        0,
        state.lastEquipmentRemoval.selection,
      );
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            equipment,
          },
        })),
        lastEquipmentRemoval: null,
      };
    }),

  toggleCombatManeuverFavorite: (maneuverId) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const maneuvers = state.character.repeatableEntries.maneuvers;
      if (
        !combatManeuverById.has(maneuverId) &&
        !maneuvers.customCombatManeuvers.some(
          (entry) => entry.id === maneuverId,
        )
      ) {
        return {};
      }
      const isFavorite =
        maneuvers.favoriteCombatManeuverIds.includes(maneuverId);
      return withChange(state, (character) => ({
        ...character,
        repeatableEntries: {
          ...character.repeatableEntries,
          maneuvers: {
            ...character.repeatableEntries.maneuvers,
            favoriteCombatManeuverIds: isFavorite
              ? character.repeatableEntries.maneuvers.favoriteCombatManeuverIds.filter(
                  (id) => id !== maneuverId,
                )
              : [
                  ...character.repeatableEntries.maneuvers
                    .favoriteCombatManeuverIds,
                  maneuverId,
                ],
          },
        },
      }));
    }),

  addCustomCombatManeuver: (name, description) => {
    let addedId: string | null = null;
    set((state) => {
      if (!state.character || !name.trim() || !description.trim()) {
        return {};
      }
      addedId = crypto.randomUUID();
      const selection: CustomCombatManeuver = {
        id: addedId,
        name: name.trim(),
        description: description.trim(),
        notes: '',
        addedAt: new Date().toISOString(),
      };
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            maneuvers: {
              ...character.repeatableEntries.maneuvers,
              customCombatManeuvers: [
                ...character.repeatableEntries.maneuvers.customCombatManeuvers,
                selection,
              ],
            },
          },
        })),
        lastManeuverRemoval: null,
      };
    });
    return addedId;
  },

  updateCustomCombatManeuver: (maneuverId, update) =>
    set((state) => {
      if (
        !state.character?.repeatableEntries.maneuvers.customCombatManeuvers.some(
          (entry) => entry.id === maneuverId,
        )
      ) {
        return {};
      }
      return withChange(state, (character) => ({
        ...character,
        repeatableEntries: {
          ...character.repeatableEntries,
          maneuvers: {
            ...character.repeatableEntries.maneuvers,
            customCombatManeuvers:
              character.repeatableEntries.maneuvers.customCombatManeuvers.map(
                (entry) =>
                  entry.id === maneuverId ? { ...entry, ...update } : entry,
              ),
          },
        },
      }));
    }),

  removeCustomCombatManeuver: (maneuverId) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const maneuvers = state.character.repeatableEntries.maneuvers;
      const index = maneuvers.customCombatManeuvers.findIndex(
        (entry) => entry.id === maneuverId,
      );
      if (index < 0) {
        return {};
      }
      const wasFavorite =
        maneuvers.favoriteCombatManeuverIds.includes(maneuverId);
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            maneuvers: {
              ...character.repeatableEntries.maneuvers,
              customCombatManeuvers:
                character.repeatableEntries.maneuvers.customCombatManeuvers.filter(
                  (entry) => entry.id !== maneuverId,
                ),
              favoriteCombatManeuverIds:
                character.repeatableEntries.maneuvers.favoriteCombatManeuverIds.filter(
                  (id) => id !== maneuverId,
                ),
            },
          },
        })),
        lastManeuverRemoval: {
          type: 'custom-combat',
          selection: maneuvers.customCombatManeuvers[index],
          index,
          wasFavorite,
        },
      };
    }),

  addDoManeuver: (definitionId, custom) => {
    let addedId: string | null = null;
    set((state) => {
      if (!state.character) {
        return {};
      }
      const definition = definitionId
        ? doManeuverById.get(definitionId)
        : undefined;
      const customValues = custom
        ? (Object.fromEntries(
            Object.entries(custom).map(([key, value]) => [key, value.trim()]),
          ) as unknown as CustomDoTechniqueInput)
        : undefined;
      const selections =
        state.character.repeatableEntries.maneuvers.selectedDoManeuvers;
      const allowance = getSpecialDoTechniqueAllowance(
        state.character.abilities.skills.do,
      );
      if (
        selections.length >= allowance ||
        (definitionId && (!definition || !definition.official)) ||
        (!definition &&
          (!customValues ||
            Object.values(customValues).some((value) => !value)))
      ) {
        return {};
      }
      if (
        definitionId &&
        selections.some((selection) => selection.definitionId === definitionId)
      ) {
        return {};
      }
      addedId = crypto.randomUUID();
      const selection: SelectedDoManeuver = {
        id: addedId,
        ...(definitionId
          ? { definitionId }
          : {
              customName: customValues?.name,
              customSummary: customValues?.summary,
              customRoll: customValues?.roll,
              customDifficulty: customValues?.difficulty,
              customDamage: customValues?.damage,
              customActions: customValues?.actions,
              customSourceTitle: customValues?.sourceTitle,
              customSourcePage: customValues?.sourcePage,
            }),
        notes: '',
        addedAt: new Date().toISOString(),
      };
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            maneuvers: {
              ...character.repeatableEntries.maneuvers,
              selectedDoManeuvers: [
                ...character.repeatableEntries.maneuvers.selectedDoManeuvers,
                selection,
              ],
            },
          },
        })),
        lastManeuverRemoval: null,
      };
    });
    return addedId;
  },

  updateDoManeuver: (selectionId, update) =>
    set((state) => {
      if (
        !state.character?.repeatableEntries.maneuvers.selectedDoManeuvers.some(
          (selection) => selection.id === selectionId,
        )
      ) {
        return {};
      }
      return withChange(state, (character) => ({
        ...character,
        repeatableEntries: {
          ...character.repeatableEntries,
          maneuvers: {
            ...character.repeatableEntries.maneuvers,
            selectedDoManeuvers:
              character.repeatableEntries.maneuvers.selectedDoManeuvers.map(
                (selection) =>
                  selection.id === selectionId
                    ? { ...selection, ...update }
                    : selection,
              ),
          },
        },
      }));
    }),

  removeDoManeuver: (selectionId) =>
    set((state) => {
      if (!state.character) {
        return {};
      }
      const selections =
        state.character.repeatableEntries.maneuvers.selectedDoManeuvers;
      const index = selections.findIndex(
        (selection) => selection.id === selectionId,
      );
      if (index < 0) {
        return {};
      }
      return {
        ...withChange(state, (character) => ({
          ...character,
          repeatableEntries: {
            ...character.repeatableEntries,
            maneuvers: {
              ...character.repeatableEntries.maneuvers,
              selectedDoManeuvers:
                character.repeatableEntries.maneuvers.selectedDoManeuvers.filter(
                  (selection) => selection.id !== selectionId,
                ),
            },
          },
        })),
        lastManeuverRemoval: {
          type: 'do',
          selection: selections[index],
          index,
        },
      };
    }),

  undoManeuverRemoval: () =>
    set((state) => {
      if (!state.character || !state.lastManeuverRemoval) {
        return {};
      }
      const removal = state.lastManeuverRemoval;
      return {
        ...withChange(state, (character) => {
          if (removal.type === 'custom-combat') {
            const customCombatManeuvers = [
              ...character.repeatableEntries.maneuvers.customCombatManeuvers,
            ];
            customCombatManeuvers.splice(removal.index, 0, removal.selection);
            return {
              ...character,
              repeatableEntries: {
                ...character.repeatableEntries,
                maneuvers: {
                  ...character.repeatableEntries.maneuvers,
                  customCombatManeuvers,
                  favoriteCombatManeuverIds: removal.wasFavorite
                    ? [
                        ...character.repeatableEntries.maneuvers
                          .favoriteCombatManeuverIds,
                        removal.selection.id,
                      ]
                    : character.repeatableEntries.maneuvers
                        .favoriteCombatManeuverIds,
                },
              },
            };
          }
          const selectedDoManeuvers = [
            ...character.repeatableEntries.maneuvers.selectedDoManeuvers,
          ];
          selectedDoManeuvers.splice(removal.index, 0, removal.selection);
          return {
            ...character,
            repeatableEntries: {
              ...character.repeatableEntries,
              maneuvers: {
                ...character.repeatableEntries.maneuvers,
                selectedDoManeuvers,
              },
            },
          };
        }),
        lastManeuverRemoval: null,
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

  setSheetLayoutMode: (mode) =>
    set((state) =>
      withChange(state, (character) => ({
        ...character,
        sheetLayout: { ...character.sheetLayout, mode },
      })),
    ),

  moveSheetGroup: (mode, groupId, direction) =>
    set((state) =>
      withChange(state, (character) => {
        const order = [...character.sheetLayout.groupOrders[mode]];
        const index = order.indexOf(groupId);
        const target = direction === 'earlier' ? index - 1 : index + 1;
        if (index < 0 || target < 0 || target >= order.length) {
          return character;
        }
        [order[index], order[target]] = [order[target], order[index]];
        const groupOrders: SheetLayout['groupOrders'] = {
          ...character.sheetLayout.groupOrders,
          [mode]: order,
        };
        return {
          ...character,
          sheetLayout: { ...character.sheetLayout, groupOrders },
        };
      }),
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
