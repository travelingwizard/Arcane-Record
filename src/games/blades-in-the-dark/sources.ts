import type { CatalogSource } from '../shared/catalog-sources';
export const bitdSources = [
  {
    id: 'bitd.core',
    title: 'Blades in the Dark Special Edition v8.1',
    required: true,
    classification: 'official',
    maxPage: 368,
  },
  {
    id: 'bitd.gm-reference',
    title: 'Blades in the Dark GM Reference',
    required: false,
    classification: 'official',
    maxPage: 1,
  },
  {
    id: 'bitd.streets',
    title: 'Streets & Buildings Reference',
    required: false,
    classification: 'official',
    maxPage: 1,
  },
  {
    id: 'bitd.rumors',
    title: 'Doskvol Rumors',
    required: false,
    classification: 'official',
    maxPage: 1,
  },
] as const satisfies readonly CatalogSource[];
