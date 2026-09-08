import type { CatalogSource } from '../shared/catalog-sources';
export const wr20Sources = [
  {
    id: 'wr20.core',
    title: 'Wraith: The Oblivion 20th Anniversary Edition',
    required: true,
    classification: 'official',
    maxPage: 594,
  },
  {
    id: 'wr20.handbook',
    title: 'Handbook for the Recently Deceased',
    required: false,
    classification: 'official',
    maxPage: 45,
  },
  {
    id: 'wr20.book-of-oblivion',
    title: 'Book of Oblivion',
    required: false,
    classification: 'official',
    maxPage: 130,
  },
  {
    id: 'wr20.haunts',
    title: 'Haunts',
    required: false,
    classification: 'official',
    maxPage: 129,
  },
  {
    id: 'wr20.mediums',
    title: 'Mediums: Speakers with the Dead',
    required: false,
    classification: 'official',
    maxPage: 121,
  },
  {
    id: 'wr20.risen',
    title: 'The Risen',
    required: false,
    classification: 'official',
    maxPage: 81,
  },
  {
    id: 'wr20.buried-secrets',
    title: 'Buried Secrets',
    required: false,
    classification: 'official',
    maxPage: 65,
  },
] as const satisfies readonly CatalogSource[];
