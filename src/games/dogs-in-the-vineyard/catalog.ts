import { DITV_SOURCE_ID } from './definitions';

export const backgrounds = [
  {
    id: 'ditv.background.well-rounded',
    name: 'Well-rounded',
    statD6: 17,
    traits: { d4: 1, d6: 4, d8: 2, d10: 0 },
    relationships: { d4: 0, d6: 4, d8: 2, d10: 0 },
    page: 22,
  },
  {
    id: 'ditv.background.strong-history',
    name: 'Strong History',
    statD6: 13,
    traits: { d4: 0, d6: 3, d8: 4, d10: 3 },
    relationships: { d4: 1, d6: 3, d8: 2, d10: 0 },
    page: 22,
  },
  {
    id: 'ditv.background.complicated-history',
    name: 'Complicated History',
    statD6: 15,
    traits: { d4: 4, d6: 2, d8: 0, d10: 2 },
    relationships: { d4: 0, d6: 5, d8: 2, d10: 0 },
    page: 22,
  },
  {
    id: 'ditv.background.strong-community',
    name: 'Strong Community',
    statD6: 13,
    traits: { d4: 1, d6: 3, d8: 2, d10: 0 },
    relationships: { d4: 0, d6: 4, d8: 4, d10: 3 },
    page: 23,
  },
  {
    id: 'ditv.background.complicated-community',
    name: 'Complicated Community',
    statD6: 15,
    traits: { d4: 0, d6: 6, d8: 2, d10: 0 },
    relationships: { d4: 4, d6: 2, d8: 2, d10: 2 },
    page: 23,
  },
].map((x) => ({ ...x, sourceId: DITV_SOURCE_ID })) as readonly {
  id: string;
  name: string;
  statD6: number;
  traits: Record<'d4' | 'd6' | 'd8' | 'd10', number>;
  relationships: Record<'d4' | 'd6' | 'd8' | 'd10', number>;
  page: number;
  sourceId: string;
}[];

export const ceremonies = [
  ['anointing-earth', 'Anointing with Sacred Earth', 8],
  ['calling-name', 'Calling by Name', 4],
  ['invoking-ancients', 'Invoking the Ancients', 4],
  ['laying-hands', 'Laying on Hands', 6],
  ['sign-tree', 'Making the Sign of the Tree', 6],
  ['book-life', 'Reciting the Book of Life', 4],
  ['singing-praise', 'Singing Praise', 6],
  ['three-authority', 'Three In Authority', 8],
] as const;

export const wrongnessStages = [
  ['pride', 'Pride'],
  ['injustice', 'Injustice'],
  ['sin', 'Sin'],
  ['demonic-attacks', 'Demonic Attacks'],
  ['false-doctrine', 'False Doctrine'],
  ['corrupt-worship', 'Corrupt Worship'],
  ['false-priesthood', 'False Priesthood'],
  ['sorcery', 'Sorcery'],
  ['hate-murder', 'Hate & Murder'],
] as const;
