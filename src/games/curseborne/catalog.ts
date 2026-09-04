import type { CatalogCitation } from '../shared/catalog-sources';

export interface CurseCatalogDefinition extends CatalogCitation {
  id: string;
  name: string;
  kind: 'equipment' | 'edge' | 'spell';
  aliases: string[];
  summary: string;
  requirements: string[];
  dotCost: number | null;
  costVerified: boolean;
  automation: 'reference-only';
}

/** Player-usable heirlooms only. Scenario actors and adversary qualities are not selectable. */
export const curseCatalog: readonly CurseCatalogDefinition[] = [
  {
    id: 'curseborne.accursed-adventures.heirloom.lethean-blade',
    name: 'The Lethean Blade',
    aliases: ['Lethean Blade'],
    kind: 'equipment',
    sourceId: 'curseborne.accursed-adventures',
    page: 46,
    dotCost: 3,
    costVerified: true,
    verification: 'citation-only',
    automation: 'reference-only',
    summary:
      'A scalpel pendant reduces certain targeting Trick costs and grants a pain-related effect, but using it brings a dangerous influence Complication.',
    requirements: [
      'Storyguide-approved acquisition. Review the linked Pain Absorption effect on p. 47 and the influence wording before play.',
    ],
  },
  {
    id: 'curseborne.accursed-adventures.heirloom.osseous-adze',
    name: 'Osseous Adze',
    aliases: [],
    kind: 'equipment',
    sourceId: 'curseborne.accursed-adventures',
    page: 46,
    dotCost: 2,
    costVerified: true,
    verification: 'rules-reviewed',
    automation: 'reference-only',
    summary:
      'An otherworldly one-handed bone weapon with Returning and Transcendent (Psychic) tags.',
    requirements: [
      'Storyguide-approved acquisition; resolve weapon tags at the table.',
    ],
  },
  {
    id: 'curseborne.accursed-adventures.heirloom.witness-lens',
    name: 'Witness Lens',
    aliases: [],
    kind: 'equipment',
    sourceId: 'curseborne.accursed-adventures',
    page: 47,
    dotCost: 1,
    costVerified: true,
    verification: 'rules-reviewed',
    automation: 'reference-only',
    summary:
      'Hold this smoky glass against a wall to see through it. Living beings remain invisible to the viewer.',
    requirements: ['Storyguide-approved acquisition.'],
  },
  {
    id: 'curseborne.accursed-adventures.heirloom.varicias-knot',
    name: 'Varicia’s Knot',
    aliases: ["Varicia's Knot"],
    kind: 'equipment',
    sourceId: 'curseborne.accursed-adventures',
    page: 47,
    dotCost: 1,
    costVerified: true,
    verification: 'rules-reviewed',
    automation: 'reference-only',
    summary:
      'Once in a story, untying this lock of hair substitutes for bleeding one curse die. Record its use manually.',
    requirements: ['Storyguide-approved acquisition; once-per-story use.'],
  },
];
