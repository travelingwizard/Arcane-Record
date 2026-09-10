export const rootSources = [
  {
    id: 'root.core',
    title: 'Root: The Roleplaying Game Core Book',
    required: true,
    defaultEnabled: true,
    classification: 'official' as const,
  },
  {
    id: 'root.travelers',
    title: 'Travelers & Outsiders',
    required: false,
    defaultEnabled: false,
    classification: 'official' as const,
  },
  {
    id: 'root.clearings',
    title: 'Root Clearing Booklet',
    required: false,
    defaultEnabled: false,
    classification: 'official-reference' as const,
  },
  {
    id: 'root.re-preview',
    title: 'R&E Preview',
    required: false,
    defaultEnabled: false,
    classification: 'official-preview' as const,
  },
] as const;
