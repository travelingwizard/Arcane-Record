export const MOUSE_GUARD_SYSTEM_ID = 'mouse-guard2e';
export const MOUSE_GUARD_PATROL_SYSTEM_ID = 'mouse-guard2e-patrol';
export const MOUSE_GUARD_SCHEMA_VERSION = 1;
export const MOUSE_GUARD_PATROL_SCHEMA_VERSION = 1;
export const mouseGuardGroups = [
  { id: 'character', label: 'Character' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'skills', label: 'Skills & Wises' },
  { id: 'traits', label: 'Traits' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'gear', label: 'Gear' },
  { id: 'conditions', label: 'Conditions' },
  { id: 'mission', label: 'Mission' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const;
export const mouseGuardSections = mouseGuardGroups.map((x) => ({
  id: x.id,
  label: x.label,
  group: x.id,
}));
export const mouseGuardGroupIds = mouseGuardGroups.map((x) => x.id);
export const patrolGroups = [
  { id: 'patrol', label: 'Patrol' },
  { id: 'roster', label: 'Roster' },
  { id: 'mission', label: 'Mission' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'history', label: 'History' },
] as const;
export const patrolSections = patrolGroups.map((x) => ({
  id: x.id,
  label: x.label,
  group: x.id,
}));
