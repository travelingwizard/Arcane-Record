export const mmSources = [
  {
    id: 'mm.book1',
    title: 'Miseries & Misfortunes',
    required: true,
    defaultEnabled: true,
    kind: 'core',
  },
  {
    id: 'mm.book2',
    title: 'Les Fruits Malheureux',
    required: true,
    defaultEnabled: true,
    kind: 'core',
  },
  {
    id: 'mm.book3',
    title: 'The Sacred & the Profane',
    required: true,
    defaultEnabled: true,
    kind: 'core',
  },
  {
    id: 'mm.book4',
    title: 'More Miseries',
    required: false,
    defaultEnabled: false,
    kind: 'supplement',
  },
  {
    id: 'mm.book5',
    title: 'Catalunya',
    required: false,
    defaultEnabled: false,
    kind: 'setting',
  },
  {
    id: 'mm.book6',
    title: 'Paris 1648',
    required: false,
    defaultEnabled: false,
    kind: 'setting',
  },
] as const;
export const requiredMmSourceIds = mmSources
  .filter((x) => x.required)
  .map((x) => x.id);
