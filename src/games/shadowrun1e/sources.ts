import type { CatalogSource } from '../shared/catalog-sources';

export const shadowrun1eSources = [
  {
    id: 'sr1.core',
    title: 'Shadowrun First Edition',
    required: true,
    classification: 'official',
    maxPage: 232,
  },
  {
    id: 'sr1.street-samurai-catalog-revised',
    title: 'Street Samurai Catalog (Revised)',
    required: false,
    classification: 'official',
    maxPage: 106,
  },
  {
    id: 'sr1.grimoire',
    title: 'The Grimoire: The Manual of Practical Thaumaturgy',
    required: false,
    classification: 'official',
    maxPage: 127,
  },
  {
    id: 'sr1.virtual-realities',
    title: 'Virtual Realities',
    required: false,
    classification: 'official',
    maxPage: 159,
  },
  {
    id: 'sr1.rigger-black-book',
    title: 'Rigger Black Book',
    required: false,
    classification: 'official',
    maxPage: 147,
  },
  {
    id: 'sr1.shadowtech',
    title: 'Shadowtech',
    required: false,
    classification: 'official',
    maxPage: 117,
  },
] as const satisfies readonly CatalogSource[];
