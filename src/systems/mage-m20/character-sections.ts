export const characterSectionGroups = [
  { id: 'character', label: 'Character', order: 1 },
  { id: 'traits', label: 'Traits', order: 2 },
  { id: 'magick', label: 'Magic', order: 3 },
  { id: 'advantages', label: 'Advantages', order: 4 },
  { id: 'condition', label: 'Conditions', order: 5 },
  { id: 'gear', label: 'Gear', order: 6 },
  { id: 'paradigm', label: 'Paradigm', order: 7 },
  { id: 'records', label: 'Records', order: 8 },
] as const;

export type CharacterSectionGroupId =
  (typeof characterSectionGroups)[number]['id'];

export const characterSectionGroupIds = characterSectionGroups.map(
  ({ id }) => id,
) as CharacterSectionGroupId[];

export type SheetLayoutMode = 'build' | 'play';

export const defaultGroupOrderByMode: Record<
  SheetLayoutMode,
  CharacterSectionGroupId[]
> = {
  build: [
    'character',
    'traits',
    'magick',
    'advantages',
    'condition',
    'gear',
    'paradigm',
    'records',
  ],
  play: [
    'condition',
    'magick',
    'traits',
    'gear',
    'advantages',
    'paradigm',
    'character',
    'records',
  ],
};

export function getOrderedSectionGroups(
  order: readonly CharacterSectionGroupId[],
) {
  const positions = new Map(order.map((id, index) => [id, index]));
  return [...characterSectionGroups].sort(
    (left, right) => positions.get(left.id)! - positions.get(right.id)!,
  );
}

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
    id: 'maneuvers',
    label: 'Maneuvers',
    group: 'traits',
    order: 4,
  },
  {
    id: 'backgrounds',
    label: 'Backgrounds',
    group: 'advantages',
    order: 5,
  },
  {
    id: 'merits-flaws',
    label: 'Merits & Flaws',
    shortLabel: 'Merits & Flaws',
    group: 'advantages',
    order: 6,
  },
  {
    id: 'spheres',
    label: 'Spheres',
    group: 'magick',
    order: 7,
  },
  {
    id: 'enlightenment',
    label: 'Enlightenment',
    group: 'magick',
    order: 8,
  },
  {
    id: 'focus',
    label: 'Focus',
    group: 'paradigm',
    order: 9,
  },
  {
    id: 'wonders',
    label: 'Wonders',
    group: 'paradigm',
    order: 10,
  },
  {
    id: 'rotes',
    label: 'Rotes',
    group: 'paradigm',
    order: 11,
  },
  {
    id: 'equipment',
    label: 'Equipment',
    group: 'gear',
    order: 12,
  },
  {
    id: 'health',
    label: 'Health',
    group: 'condition',
    order: 13,
  },
  {
    id: 'experience',
    label: 'Experience',
    group: 'records',
    order: 14,
  },
  {
    id: 'import-export',
    label: 'Save',
    shortLabel: 'Save',
    group: 'records',
    order: 15,
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
