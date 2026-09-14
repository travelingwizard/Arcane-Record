import { arsCharacterSchema, type ArsCharacter } from './schema';
import type { CharacterRole } from './creation-rules';
import { abilityCatalog, artCatalog } from './catalog';

export const sectionIds = [
  'character',
  'characteristics',
  'virtues',
  'abilities',
  'arts',
  'spells',
  'equipment',
  'wounds',
  'resources',
  'covenant',
  'laboratory',
  'seasons',
  'records',
];

export function createArsCharacter(
  role: CharacterRole = 'magus',
  status: ArsCharacter['creation']['status'] = 'manual',
): ArsCharacter {
  const traits = [
    ...abilityCatalog.map((ability) => ({
      id: crypto.randomUUID(),
      definitionId: ability.id,
      name: ability.name,
      status: 'verified' as const,
      citation: {
        sourceId: ability.sourceId,
        book: 'Ars Magica Definitive Edition',
        printedPage: ability.printedPage,
        pdfPage: ability.pdfPage,
      },
      notes: '',
      scale: 'ability' as const,
      experience: 0,
      specialty: '',
    })),
    ...(role === 'magus'
      ? artCatalog.map((art) => ({
          id: crypto.randomUUID(),
          definitionId: art.id,
          name: art.name,
          status: 'verified' as const,
          citation: {
            sourceId: art.sourceId,
            book: 'Ars Magica Definitive Edition',
            printedPage: art.printedPage,
            pdfPage: art.pdfPage,
          },
          notes: '',
          scale: 'art' as const,
          experience: 0,
          specialty: '',
        }))
      : []),
  ];
  return arsCharacterSchema.parse({
    schemaVersion: 2,
    name: '',
    mode: 'build',
    definition: {
      role,
      name: '',
      player: '',
      concept: '',
      saga: '',
      houseId: null,
      age: role === 'magus' ? 25 : 20,
      apprenticeshipAge: 10,
      characteristics: {
        intelligence: 0,
        perception: 0,
        strength: 0,
        stamina: 0,
        presence: 0,
        communication: 0,
        dexterity: 0,
        quickness: 0,
      },
      virtuesFlaws: [],
      traits,
      spells: [],
      socialStatus: role === 'magus' ? 'Hermetic Magus' : '',
      appearance: '',
      personality: [],
    },
    creation: {
      status,
      step: status === 'draft' ? 1 : 0,
      approvals: [],
      baseline: null,
      draft: null,
      method: status === 'manual' ? 'manual' : 'guided',
      wealth: 'normal',
      experienceAllocations: [],
      spellAllocations: [],
    },
    play: {
      fatigue: 0,
      confidenceScore: role === 'grog' ? 0 : 1,
      confidencePoints: role === 'grog' ? 0 : 3,
      warpingPoints: 0,
      decrepitudePoints: 0,
      wounds: [],
      effects: [],
    },
    inventory: [],
    covenantId: null,
    covenantSnapshot: null,
    seasons: [],
    history: [],
    rolls: [],
    layout: { build: [...sectionIds], play: [...sectionIds] },
    notes: '',
  });
}
