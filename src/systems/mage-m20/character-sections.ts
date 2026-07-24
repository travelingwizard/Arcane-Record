export const characterSectionGroups = [
  { id: 'character', label: 'Character', order: 1 },
  { id: 'traits', label: 'Traits', order: 2 },
  { id: 'advantages', label: 'Advantages', order: 3 },
  { id: 'magick', label: 'Magick', order: 4 },
  { id: 'condition', label: 'Condition', order: 5 },
  { id: 'records', label: 'Records', order: 6 },
] as const;

export type CharacterSectionGroupId =
  (typeof characterSectionGroups)[number]['id'];

export const characterSections = [
  {
    id: 'identity',
    label: 'Identity',
    group: 'character',
    order: 1,
  },
  {
    id: 'attributes',
    label: 'Attributes',
    group: 'traits',
    order: 2,
  },
  {
    id: 'abilities',
    label: 'Abilities',
    group: 'traits',
    order: 3,
  },
  {
    id: 'backgrounds',
    label: 'Backgrounds',
    group: 'advantages',
    order: 4,
  },
  {
    id: 'merits-flaws',
    label: 'Merits & Flaws',
    shortLabel: 'Merits & Flaws',
    group: 'advantages',
    order: 5,
  },
  {
    id: 'spheres',
    label: 'Spheres',
    group: 'magick',
    order: 6,
  },
  {
    id: 'enlightenment',
    label: 'Enlightenment',
    group: 'magick',
    order: 7,
  },
  {
    id: 'focus',
    label: 'Focus',
    group: 'magick',
    order: 8,
  },
  {
    id: 'wonders',
    label: 'Wonders',
    group: 'magick',
    order: 9,
  },
  {
    id: 'rotes',
    label: 'Rotes',
    group: 'magick',
    order: 10,
  },
  {
    id: 'health',
    label: 'Health',
    group: 'condition',
    order: 11,
  },
  {
    id: 'import-export',
    label: 'Import & export',
    shortLabel: 'File exchange',
    group: 'records',
    order: 12,
  },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  shortLabel?: string;
  group: CharacterSectionGroupId;
  order: number;
}>;

export type CharacterSectionId = (typeof characterSections)[number]['id'];
export type CharacterSectionDefinition = (typeof characterSections)[number];

export const characterSectionIds = characterSections.map(
  ({ id }) => id,
) as CharacterSectionId[];

export const characterSectionById = new Map(
  characterSections.map((definition) => [definition.id, definition]),
);

export function isCharacterSectionId(
  value: string,
): value is CharacterSectionId {
  return characterSectionById.has(value as CharacterSectionId);
}

export function getCharacterSectionFromHash(hash = window.location.hash) {
  const candidate = decodeURIComponent(hash.replace(/^#/, ''));
  return isCharacterSectionId(candidate) ? candidate : null;
}
