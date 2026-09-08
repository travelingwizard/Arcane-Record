import type { CatalogSource } from '../shared/catalog-sources';

export const changeling20Sources = [
  {
    id: 'c20.core',
    title: 'Changeling: The Dreaming 20th Anniversary Edition',
    required: true,
    classification: 'official',
    maxPage: 503,
  },
  {
    id: 'c20.legacy.storytellers-secrets',
    title: 'Book of Storyteller Secrets',
    required: false,
    classification: 'official',
    maxPage: 62,
  },
  {
    id: 'c20.legacy.autumn-people',
    title: 'The Autumn People',
    required: false,
    classification: 'official',
    maxPage: 101,
  },
  {
    id: 'c20.legacy.enchanted',
    title: 'The Enchanted',
    required: false,
    classification: 'official',
    maxPage: 105,
  },
] as const satisfies readonly CatalogSource[];
