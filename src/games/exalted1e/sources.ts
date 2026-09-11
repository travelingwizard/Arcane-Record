import type { ExaltedCharacterType, ExaltedSourceId } from './profiles';

export interface ExaltedSourceDefinition {
  id: ExaltedSourceId;
  title: string;
  required: boolean;
  defaultEnabled: boolean;
  governingCharacterTypes: readonly ExaltedCharacterType[];
  classification: 'core' | 'family' | 'supplement';
  inventoryStatus: 'existing' | 'in-progress';
  playerFacingRanges: readonly {
    label: string;
    printedStart: number;
    printedEnd: number;
  }[];
}

const familySource = (
  id: ExaltedSourceId,
  title: string,
  type: ExaltedCharacterType,
  ranges: ExaltedSourceDefinition['playerFacingRanges'],
  inventoryStatus: ExaltedSourceDefinition['inventoryStatus'] = 'in-progress',
): ExaltedSourceDefinition => ({
  id,
  title,
  required: false,
  defaultEnabled: false,
  governingCharacterTypes: [type],
  classification: 'family',
  inventoryStatus,
  playerFacingRanges: ranges,
});

export const exaltedSources: readonly ExaltedSourceDefinition[] = [
  {
    id: 'core',
    title: 'Exalted First Edition',
    required: true,
    defaultEnabled: true,
    governingCharacterTypes: ['solar'],
    classification: 'core',
    inventoryStatus: 'existing',
    playerFacingRanges: [
      { label: 'Character Creation', printedStart: 94, printedEnd: 111 },
      { label: 'Traits', printedStart: 112, printedEnd: 149 },
      { label: 'Charms and Sorcery', printedStart: 150, printedEnd: 223 },
    ],
  },
  familySource(
    'dragon-blooded',
    'Dragon-Blooded source foundation',
    'dragon-blooded',
    [],
    'existing',
  ),
  familySource('lunars', 'The Lunars', 'lunar', [
    { label: 'Character Creation', printedStart: 86, printedEnd: 93 },
    { label: 'Traits', printedStart: 94, printedEnd: 115 },
    { label: 'Charms', printedStart: 116, printedEnd: 193 },
  ]),
  familySource('abyssals', 'The Abyssals', 'abyssal', [
    { label: 'Character Creation', printedStart: 118, printedEnd: 127 },
    { label: 'Traits', printedStart: 128, printedEnd: 153 },
    { label: 'Charms', printedStart: 154, printedEnd: 229 },
    { label: 'Arts of the Dead', printedStart: 230, printedEnd: 261 },
  ]),
  familySource('fair-folk', 'The Fair Folk', 'fair-folk', [
    { label: 'Character Creation', printedStart: 90, printedEnd: 101 },
    { label: 'Traits', printedStart: 102, printedEnd: 125 },
    { label: 'Raksha Magic', printedStart: 126, printedEnd: 221 },
  ]),
  familySource('autochthonians', 'The Autochthonians', 'alchemical', [
    {
      label: 'Character Creation and Traits',
      printedStart: 56,
      printedEnd: 85,
    },
    { label: 'Charms', printedStart: 86, printedEnd: 141 },
  ]),
  familySource('sidereals', 'The Sidereals', 'sidereal', [
    { label: 'Character Creation', printedStart: 94, printedEnd: 101 },
    { label: 'Traits', printedStart: 102, printedEnd: 125 },
    { label: 'Charms and Martial Arts', printedStart: 126, printedEnd: 201 },
    { label: 'Sidereal Astrology', printedStart: 202, printedEnd: 235 },
  ]),
  ...(
    [
      ['players-guide', "Exalted Player's Guide"],
      ['storytellers-companion', "Exalted Storyteller's Companion"],
      ['book-of-three-circles', 'Book of Three Circles'],
      ['book-of-bone-and-ebony', 'Book of Bone and Ebony'],
      ['blood-and-salt', 'Blood and Salt'],
      ['games-of-divinity', 'Games of Divinity'],
    ] as const
  ).map(([id, title]) => ({
    id,
    title,
    required: false,
    defaultEnabled: false,
    governingCharacterTypes: [],
    classification: 'supplement' as const,
    inventoryStatus: 'in-progress' as const,
    playerFacingRanges: [],
  })),
];

export const exaltedSourceById = new Map(
  exaltedSources.map((source) => [source.id, source]),
);

export function defaultExaltedSourceIds(type: ExaltedCharacterType) {
  return exaltedSources
    .filter(
      (source) =>
        source.required || source.governingCharacterTypes.includes(type),
    )
    .map(({ id }) => id);
}
