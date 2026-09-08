import type { CatalogSource } from '../shared/catalog-sources';
export const mouseGuardSources = [
  {
    id: 'mg2.core',
    title: 'Mouse Guard Roleplaying Game Second Edition',
    required: true,
    classification: 'official',
    maxPage: 320,
  },
  {
    id: 'mg2.new-rules',
    title: 'New Rules, New Missions',
    required: false,
    classification: 'official',
    maxPage: 46,
  },
] as const satisfies readonly CatalogSource[];
