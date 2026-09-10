export const COC7E_SYSTEM_ID = 'call-of-cthulhu-7e';
export const COC7E_SCHEMA_VERSION = 1;

export const coc7eGroups = [
  { id: 'investigator', label: 'Investigator' },
  { id: 'characteristics', label: 'Characteristics' },
  { id: 'skills', label: 'Skills' },
  { id: 'resources', label: 'Resources & Sanity' },
  { id: 'backstory', label: 'Backstory' },
  { id: 'combat', label: 'Combat' },
  { id: 'equipment', label: 'Equipment & Finances' },
  { id: 'investigation', label: 'Investigation' },
  { id: 'development', label: 'Development' },
  { id: 'records', label: 'Records' },
] as const;
export const coc7eSections = coc7eGroups.map((x) => ({ ...x, group: x.id }));
export const coc7eGroupIds = coc7eGroups.map((x) => x.id);
