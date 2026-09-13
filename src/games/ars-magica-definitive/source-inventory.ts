/**
 * Machine-readable chapter disposition register. Individual selectable entries
 * live in the catalogs; a chapter remains unresolved until every row within its
 * page range has a reviewed disposition.
 */
export const sourceInventory = {
  sourceId: 'ars.definitive',
  title: 'Ars Magica Definitive Edition',
  pdfPages: 582,
  printedPageOffset: 8,
  complete: false,
  rules: [
    {
      id: 'simple-stress-dice',
      pages: [7],
      implementation: 'dice.ts',
      tests: 'ars-magica-rules.test.ts',
      status: 'implemented',
    },
    {
      id: 'characteristic-costs',
      pages: [48],
      implementation: 'creation-rules.ts',
      tests: 'ars-magica-rules.test.ts',
      status: 'implemented',
    },
    {
      id: 'starting-ability-caps',
      pages: [48],
      implementation: 'creation-rules.ts',
      tests: 'ars-magica-rules.test.ts',
      status: 'implemented',
    },
    {
      id: 'life-stage-budgets',
      pages: [44, 49, 50, 51],
      implementation: 'creation-rules.ts',
      tests: 'ars-magica-rules.test.ts',
      status: 'implemented',
    },
    {
      id: 'earned-experience',
      pages: [375],
      implementation: 'experience.ts',
      tests: 'ars-magica-experience.test.ts',
      status: 'implemented',
    },
    {
      id: 'gain-limits',
      pages: [376],
      implementation: 'experience.ts',
      tests: 'ars-magica-experience.test.ts',
      status: 'implemented',
    },
    {
      id: 'exposure',
      pages: [376],
      implementation: 'seasons.ts',
      tests: 'ars-magica-records.test.ts',
      status: 'partial-unmodified-only',
    },
  ],
  chapters: [
    {
      id: 'houses-and-character-options',
      start: 9,
      end: 58,
      disposition: 'unresolved',
    },
    { id: 'virtues-flaws', start: 59, end: 154, disposition: 'unresolved' },
    { id: 'abilities', start: 155, end: 172, disposition: 'unresolved' },
    { id: 'covenants', start: 173, end: 200, disposition: 'unresolved' },
    { id: 'hermetic-magic', start: 201, end: 246, disposition: 'unresolved' },
    { id: 'laboratory', start: 247, end: 298, disposition: 'unresolved' },
    {
      id: 'spells',
      start: 299,
      end: 372,
      disposition: 'reference-only',
      inventory: 'generated-spells.json',
      entries: 330,
    },
    { id: 'long-term-events', start: 373, end: 392, disposition: 'unresolved' },
    {
      id: 'combat-and-obstacles',
      start: 393,
      end: 408,
      disposition: 'unresolved',
    },
    {
      id: 'player-facing-realm-interactions',
      start: 409,
      end: 422,
      disposition: 'unresolved',
    },
    {
      id: 'familiar-and-form-dependencies-only',
      start: 423,
      end: 494,
      disposition: 'unresolved',
    },
  ],
} as const;
