import type { CatalogSource } from '../shared/catalog-sources';
export const citySources: readonly CatalogSource[] = [
  {
    id: 'com.players-guide',
    title: 'Player’s Guide',
    required: true,
    classification: 'official',
    maxPage: 304,
  },
  {
    id: 'com.shadows-showdowns',
    title: 'Shadows & Showdowns',
    required: false,
    classification: 'official',
    maxPage: 299,
  },
];
