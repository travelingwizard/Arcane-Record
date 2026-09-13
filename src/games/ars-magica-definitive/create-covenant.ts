import { covenantPackages } from './catalog';
import { covenantSchema, type ArsCovenant } from './schema';

export const covenantSectionIds = [
  'covenant',
  'members',
  'boons',
  'library',
  'vis',
  'laboratories',
  'projects',
  'records',
];

export function createCovenant(
  packageId?: (typeof covenantPackages)[number]['id'],
): ArsCovenant {
  const selected = covenantPackages.find((x) => x.id === packageId);
  return covenantSchema.parse({
    schemaVersion: 1,
    name: '',
    mode: 'build',
    saga: '',
    location: '',
    aura: 3,
    covenantSeason: 'spring',
    calendar: { year: 1220, season: 'spring' },
    memberIds: [],
    buildPointBudget: selected?.buildPoints ?? 0,
    vis: [],
    library: [],
    laboratories: [],
    specialists: [],
    enchantedItems: [],
    projects: [],
    boonsHooks: [],
    history: [],
    notes: '',
    layout: {
      build: [...covenantSectionIds],
      play: [...covenantSectionIds],
    },
  });
}
