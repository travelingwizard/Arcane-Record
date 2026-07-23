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
import type { MageCharacter } from '../types/character';

export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

interface EditorState {
  character: MageCharacter | null;
  revision: number;
  saveStatus: SaveStatus;
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

  load: (character) => set({ character, revision: 0, saveStatus: 'saved' }),

  clear: () => set({ character: null, revision: 0, saveStatus: 'saved' }),

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
