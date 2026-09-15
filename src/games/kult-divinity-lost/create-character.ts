import {
  activeAttributeNames,
  KULT_SCHEMA_VERSION,
  passiveAttributeNames,
} from './definitions';
import { kultDefaultLayout, type KultCharacter } from './schema';

export function createKultCharacter(
  sheetType: KultCharacter['sheetType'] = 'general',
): KultCharacter {
  const attributes: KultCharacter['attributes'] = [
    ...passiveAttributeNames.map((name) => ({
      id: `passive.${name.toLowerCase()}`,
      name,
      kind: 'passive' as const,
      rating: 0,
      notes: '',
    })),
    ...activeAttributeNames.map((name) => ({
      id: `active.${name.toLowerCase()}`,
      name,
      kind: 'active' as const,
      rating: 0,
      notes: '',
    })),
  ];
  const wounds: KultCharacter['wounds'] = [1, 2, 3, 4].map((slot) => ({
    id: crypto.randomUUID(),
    severity: 'serious',
    slot,
    description: '',
    stabilized: false,
    ongoingEffect: '',
    penalty: 0,
  }));
  wounds.push({
    id: crypto.randomUUID(),
    severity: 'critical',
    slot: 1,
    description: '',
    stabilized: false,
    ongoingEffect: '',
    penalty: 0,
  });
  return {
    schemaVersion: KULT_SCHEMA_VERSION,
    sheetType,
    name: '',
    player: '',
    pronouns: '',
    archetype: '',
    archetypeDefinitionId: null,
    occupation: '',
    appearance: '',
    concept: '',
    mode: 'build',
    layout: structuredClone(kultDefaultLayout),
    settings: {
      matureSuggestions: false,
      showUnavailableSuggestions: false,
    },
    attributes,
    darkSecrets: [],
    disadvantages: [],
    advantages: [],
    relations: [],
    wounds,
    stability: { position: 0, stressEffects: '', notes: '' },
    dramaticHooks: [],
    gear: [],
    advancements: [],
    transitionArchives: [],
    transitionDraft: null,
    approvals: [],
    notes: '',
    sessionNotes: '',
    history: [],
  };
}
