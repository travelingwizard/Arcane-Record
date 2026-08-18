export const exaltedLanguageCatalog = [
  { id: 'low-realm', name: 'Low Realm' },
  { id: 'high-realm', name: 'High Realm' },
  { id: 'old-realm', name: 'Old Realm' },
  { id: 'riverspeak', name: 'Riverspeak' },
  { id: 'seatongue', name: 'Seatongue' },
  { id: 'forest-tongue', name: 'Forest-tongue' },
  { id: 'flametongue', name: 'Flametongue' },
  { id: 'skytongue', name: 'Skytongue' },
] as const;

export const exaltedLanguageById = new Map<
  string,
  { id: string; name: string }
>(exaltedLanguageCatalog.map((language) => [language.id, language]));
