import type { CatalogSource } from '../shared/catalog-sources';

export const dav20Sources = [
  {
    id: 'dav20.core',
    title: 'Vampire: The Dark Ages 20th Anniversary Edition',
    required: true,
    classification: 'official',
    maxPage: 489,
  },
] as const satisfies readonly CatalogSource[];
