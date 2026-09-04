import type { CatalogSource } from '../shared/catalog-sources';
export const curseSources: readonly CatalogSource[] = [
  {
    id: 'curseborne.core',
    title: 'Curseborne (final core)',
    required: true,
    classification: 'official',
    maxPage: 388,
  },
  {
    id: 'curseborne.accursed-adventures',
    title: 'Accursed Adventures',
    required: false,
    classification: 'official',
    maxPage: 78,
  },
];
