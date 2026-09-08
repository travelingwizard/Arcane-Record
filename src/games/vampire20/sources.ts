import type { CatalogSource } from '../shared/catalog-sources';

export const v20Sources = [
  {
    id: 'v20.core',
    title: 'Vampire: The Masquerade 20th Anniversary Edition',
    required: true,
    classification: 'official',
    maxPage: 520,
  },
  {
    id: 'v20.companion',
    title: 'V20 Companion',
    required: false,
    classification: 'official',
    maxPage: 80,
  },
  {
    id: 'v20.ghouls-revenants',
    title: 'V20 Ghouls & Revenants',
    required: false,
    classification: 'official',
    maxPage: 183,
  },
] as const satisfies readonly CatalogSource[];
