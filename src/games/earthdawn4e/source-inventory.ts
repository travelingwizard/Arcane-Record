import { earthdawnCatalog, earthdawnSources } from './catalog';

export type EarthdawnDisposition =
  | 'selectable'
  | 'calculated'
  | 'reference-only'
  | 'unresolved'
  | 'gm-only'
  | 'excluded';

export interface EarthdawnInventoryRow {
  id: string;
  sourceId: string;
  printedPage: number | null;
  pdfPage: number | null;
  subject: string;
  disposition: EarthdawnDisposition;
  definitionId: string | null;
  note: string;
}

const catalogRows: EarthdawnInventoryRow[] = earthdawnCatalog.map(
  (definition) => ({
    id: `inventory.${definition.id}`,
    sourceId: definition.sourceId,
    printedPage: definition.page,
    pdfPage: null,
    subject: definition.name,
    disposition:
      definition.verification === 'verified'
        ? 'selectable'
        : definition.verification === 'reference-only'
          ? 'reference-only'
          : 'unresolved',
    definitionId: definition.id,
    note: 'Player-facing catalog definition.',
  }),
);

const boundaryRows: EarthdawnInventoryRow[] = [
  [
    'players-rules',
    'ed4.players-guide',
    'Characteristics, Step/Dice, Karma, health, creation, and advancement arithmetic',
    'calculated',
    'Implemented as pure rules and schema validation.',
  ],
  [
    'gm-creatures',
    'ed4.gamemasters-guide',
    'Creatures, Horrors, encounters, and GM procedures',
    'gm-only',
    'Not character-selectable.',
  ],
  [
    'companion-high-circle',
    'ed4.companion',
    'Ninth–Fifteenth Circle Discipline progression',
    'calculated',
    'Required talents are represented in Discipline progression records.',
  ],
  [
    'questors-nonadept',
    'ed4.questors',
    'Non-Adept Questor initial skill allocation',
    'unresolved',
    'The source permits the framework but does not supply a complete replacement starting allocation; a specific GM-approved profile is required.',
  ],
  [
    'questors-mad-passions',
    'ed4.questors',
    'Mad Passion devotion',
    'reference-only',
    'Hidden by default and approval-gated.',
  ],
  [
    'travar-setting',
    'ed4.travar',
    'Setting, adventures, NPCs, and secrets',
    'excluded',
    'Not copied into the player runtime.',
  ],
  [
    'iopos-setting',
    'ed4.iopos',
    'Setting, adventures, NPCs, and secrets',
    'excluded',
    'Not copied into the player runtime.',
  ],
  [
    'deeper-secrets-gm',
    'ed4.deeper-secrets',
    'GM-only secrets and campaign material',
    'gm-only',
    'Not character-selectable.',
  ],
  [
    'vasgothia-setting',
    'ed4.vasgothia',
    'Setting, adventures, NPCs, and secrets',
    'excluded',
    'Only verified player paths may be cataloged.',
  ],
  [
    'mystic-paths-setting',
    'ed4.mystic-paths',
    'Setting and authored examples',
    'excluded',
    'Only verified player paths may be cataloged.',
  ],
  [
    'elven-nations-setting',
    'ed4.elven-nations',
    'Setting, adventures, NPCs, and secrets',
    'excluded',
    'No unverified option affects calculations.',
  ],
].map(([id, sourceId, subject, disposition, note]) => ({
  id: `inventory.boundary.${id}`,
  sourceId,
  printedPage: null,
  pdfPage: null,
  subject,
  disposition: disposition as EarthdawnDisposition,
  definitionId: null,
  note,
}));

export const earthdawnSourceInventory = [...catalogRows, ...boundaryRows];

export function auditEarthdawnSourceInventory() {
  const errors: string[] = [];
  const sourceIds = new Set(earthdawnSources.map(({ id }) => id));
  const catalogIds = new Set(earthdawnCatalog.map(({ id }) => id));
  const rowIds = new Set<string>();
  for (const row of earthdawnSourceInventory) {
    if (rowIds.has(row.id)) errors.push(`Duplicate inventory ID: ${row.id}`);
    rowIds.add(row.id);
    if (!sourceIds.has(row.sourceId))
      errors.push(`Unknown source: ${row.sourceId}`);
    if (row.definitionId && !catalogIds.has(row.definitionId))
      errors.push(`Unknown definition: ${row.definitionId}`);
    if (row.disposition === 'selectable' && !row.printedPage) {
      const definition = earthdawnCatalog.find(
        ({ id }) => id === row.definitionId,
      );
      const hasSourceOnlySpellCitation =
        definition?.kind === 'spell' &&
        Boolean(definition.spellMetadata?.variants.length) &&
        definition.spellMetadata!.variants.every(({ sourceId }) =>
          sourceIds.has(sourceId),
        );
      if (!hasSourceOnlySpellCitation)
        errors.push(`Selectable row lacks citation: ${row.id}`);
    }
  }
  for (const definition of earthdawnCatalog) {
    if (
      !earthdawnSourceInventory.some(
        (row) => row.definitionId === definition.id,
      )
    )
      errors.push(`Catalog definition lacks inventory row: ${definition.id}`);
  }
  return errors;
}
