export const WR20_SYSTEM_ID = 'wraith20';
export const WR20_SHADOW_SYSTEM_ID = 'wraith20-shadow';
export const WR20_SCHEMA_VERSION = 1;
export const WR20_SHADOW_SCHEMA_VERSION = 1;

export const wr20SectionGroups = [
  { id: 'character', label: 'Character' },
  { id: 'traits', label: 'Traits' },
  { id: 'advantages', label: 'Advantages' },
  { id: 'resources', label: 'Resources' },
  { id: 'society', label: 'Society' },
  { id: 'conditions', label: 'Conditions' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const;
export const wr20Sections = [
  { id: 'identity', label: 'Identity', group: 'character' },
  { id: 'creator', label: 'Character Creator', group: 'character' },
  { id: 'attributes', label: 'Attributes', group: 'traits' },
  { id: 'abilities', label: 'Abilities', group: 'traits' },
  { id: 'passions-fetters', label: 'Passions & Fetters', group: 'advantages' },
  { id: 'arcanoi', label: 'Arcanoi', group: 'advantages' },
  { id: 'backgrounds', label: 'Backgrounds', group: 'advantages' },
  { id: 'resources', label: 'Corpus, Pathos & Willpower', group: 'resources' },
  { id: 'shadow', label: 'Shadow', group: 'resources' },
  { id: 'society', label: 'Circle, Haunts & Society', group: 'society' },
  { id: 'conditions', label: 'Conditions', group: 'conditions' },
  { id: 'experience', label: 'Experience', group: 'advancement' },
  { id: 'sources', label: 'Sources', group: 'records' },
  { id: 'records', label: 'Records', group: 'records' },
] as const;
export const wr20GroupIds = wr20SectionGroups.map((x) => x.id);
export const defaultWr20Order = [...wr20GroupIds];

export const shadowSections = [
  { id: 'identity', label: 'Shadow Identity', group: 'shadow' },
  { id: 'angst', label: 'Angst', group: 'shadow' },
  { id: 'dark-passions', label: 'Dark Passions', group: 'shadow' },
  { id: 'thorns', label: 'Thorns', group: 'shadow' },
  { id: 'catharsis', label: 'Catharsis & Harrowings', group: 'play' },
  { id: 'experience', label: 'Shadow Experience', group: 'advancement' },
  { id: 'records', label: 'Records & Boundaries', group: 'records' },
] as const;
export const shadowGroups = [
  { id: 'shadow', label: 'Shadow' },
  { id: 'play', label: 'Play State' },
  { id: 'advancement', label: 'Advancement' },
  { id: 'records', label: 'Records' },
] as const;
