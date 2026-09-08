import type { CatalogSource } from '../shared/catalog-sources';
export const w20Sources = [
  {
    id: 'w20.core',
    title: 'Werewolf: The Apocalypse 20th Anniversary Edition',
    required: true,
    classification: 'official',
    maxPage: 555,
  },
  {
    id: 'w20.changing-breeds',
    title: 'W20 Changing Breeds',
    required: false,
    classification: 'official',
    maxPage: 303,
  },
  {
    id: 'w20.book-of-the-wyrm',
    title: 'W20 Book of the Wyrm',
    required: false,
    classification: 'official',
    maxPage: 210,
  },
  {
    id: 'w20.kinfolk',
    title: 'W20 Kinfolk: A Breed Apart',
    required: false,
    classification: 'official',
    maxPage: 131,
  },
] as const satisfies readonly CatalogSource[];
