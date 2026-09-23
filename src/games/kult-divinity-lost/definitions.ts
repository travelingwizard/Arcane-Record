export const KULT_SYSTEM_ID = 'kult-divinity-lost';
export const KULT_SCHEMA_VERSION = 1;

export const kultSectionGroups = [
  { id: 'character', label: 'Character' },
  { id: 'traits', label: 'Traits' },
  { id: 'connections', label: 'Connections' },
  { id: 'conditions', label: 'Conditions' },
  { id: 'possessions', label: 'Possessions' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const;

export const kultSections = [
  { id: 'character', label: 'Character', group: 'character' },
  { id: 'attributes', label: 'Attributes', group: 'traits' },
  { id: 'dark-secrets', label: 'Dark Secrets', group: 'traits' },
  { id: 'disadvantages', label: 'Disadvantages', group: 'traits' },
  { id: 'advantages', label: 'Advantages', group: 'traits' },
  { id: 'relations', label: 'Relations', group: 'connections' },
  { id: 'wounds', label: 'Wounds', group: 'conditions' },
  { id: 'stability', label: 'Stability', group: 'conditions' },
  { id: 'hooks', label: 'Dramatic Hooks', group: 'connections' },
  { id: 'gear', label: 'Gear & Weapons', group: 'possessions' },
  { id: 'advancement', label: 'Advancement', group: 'advancement' },
  { id: 'records', label: 'Notes & Records', group: 'records' },
] as const;

export const kultGroupIds = kultSectionGroups.map(({ id }) => id);
export const defaultKultOrder = [...kultGroupIds];

export const passiveAttributeNames = [
  'Fortitude',
  'Willpower',
  'Reflexes',
] as const;
export const activeAttributeNames = [
  'Reason',
  'Intuition',
  'Perception',
  'Coolness',
  'Violence',
  'Charisma',
  'Soul',
] as const;

export const stabilityStates = [
  'Composed',
  'Uneasy',
  'Unfocused',
  'Shaken',
  'Distressed',
  'Neurotic',
  'Anxious',
  'Irrational',
  'Unhinged',
  'Broken',
] as const;
