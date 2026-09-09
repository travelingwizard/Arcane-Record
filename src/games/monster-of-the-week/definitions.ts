export const MOTW_SYSTEM_ID = 'monster-of-the-week';
export const MOTW_KEEPER_SYSTEM_ID = 'monster-of-the-week-keeper';
export const MOTW_SCHEMA_VERSION = 1;

export const hunterGroups = [
  { id: 'hunter', label: 'Hunter' },
  { id: 'ratings', label: 'Ratings' },
  { id: 'moves', label: 'Moves' },
  { id: 'playbook', label: 'Playbook' },
  { id: 'gear', label: 'Gear' },
  { id: 'team', label: 'Team & History' },
  { id: 'luck', label: 'Luck' },
  { id: 'harm', label: 'Harm' },
  { id: 'mystery', label: 'Mystery' },
  { id: 'advancement', label: 'Experience & Improvements' },
  { id: 'records', label: 'Records' },
] as const;
export const hunterSections = hunterGroups.map((x) => ({ ...x, group: x.id }));
export const hunterGroupIds = hunterGroups.map((x) => x.id);

export const keeperGroups = [
  { id: 'campaign', label: 'Campaign' },
  { id: 'roster', label: 'Hunter Roster' },
  { id: 'mysteries', label: 'Mysteries' },
  { id: 'threats', label: 'Threats' },
  { id: 'arcs', label: 'Arcs & Custom Moves' },
  { id: 'session', label: 'Session & Awards' },
  { id: 'records', label: 'Records' },
] as const;
export const keeperSections = keeperGroups.map((x) => ({ ...x, group: x.id }));
export const keeperGroupIds = keeperGroups.map((x) => x.id);
