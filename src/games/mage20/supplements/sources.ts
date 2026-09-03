import { z } from 'zod';

export const mageSources = [
  { id: 'mage-20', name: 'Mage 20', kind: 'official', required: true },
  { id: 'bos', name: 'Book of Secrets', kind: 'official', required: false },
  {
    id: 'technocracy-reloaded',
    name: 'Technocracy Reloaded',
    kind: 'official',
    required: false,
  },
  {
    id: 'operatives-dossier',
    name: 'The Operative’s Dossier',
    kind: 'official',
    required: false,
  },
  {
    id: 'lore-traditions',
    name: 'Lore of the Traditions',
    kind: 'official',
    required: false,
  },
  {
    id: 'enlightened-grimoire',
    name: 'Enlightened Grimoire',
    kind: 'community',
    required: false,
  },
  {
    id: 'bof',
    name: 'Book of the Fallen',
    kind: 'official · mature',
    required: false,
  },
  {
    id: 'legacy-other',
    name: 'Other legacy references (unverified)',
    kind: 'unverified',
    required: false,
  },
] as const;
const defaultsKey = 'arcane-record:mage20:source-defaults';
export const mageSourcePreferencesSchema = z.object({
  enabled: z.array(z.string()).default(['mage-20']),
  mature: z.boolean().default(false),
});
export type MageSourcePreferences = z.infer<typeof mageSourcePreferencesSchema>;
export function readMageSourceDefaults(): MageSourcePreferences {
  try {
    const saved = mageSourcePreferencesSchema.parse(
      JSON.parse(localStorage.getItem(defaultsKey) ?? '{}'),
    );
    return { ...saved, enabled: [...new Set(['mage-20', ...saved.enabled])] };
  } catch {
    return { enabled: ['mage-20'], mature: false };
  }
}
export function saveMageSourceDefaults(value: MageSourcePreferences) {
  localStorage.setItem(defaultsKey, JSON.stringify(value));
}
export interface SourcedDefinition {
  sources?: readonly { bookId: string; bookLabel?: string }[];
  citation?: string;
  contentLabel?: string;
  category?: string;
}
export function sourceIds(entry: SourcedDefinition): string[] {
  const text = [
    entry.citation ?? '',
    ...(entry.sources ?? []).map((s) => `${s.bookId} ${s.bookLabel ?? ''}`),
  ]
    .join(';')
    .toLowerCase();
  const ids: string[] = [];
  if (/mage[- ]20|m20 core/.test(text)) ids.push('mage-20');
  if (/\bbos\b|book of secrets/.test(text)) ids.push('bos');
  if (/technocracy.?reloaded|\btr\b/.test(text))
    ids.push('technocracy-reloaded');
  if (/operative|\bod\b/.test(text)) ids.push('operatives-dossier');
  if (/lore.*traditions|\blot\b/.test(text)) ids.push('lore-traditions');
  if (/enlightened.?grimoire|\beg\b/.test(text))
    ids.push('enlightened-grimoire');
  if (/book of the fallen|\bbof\b/.test(text)) ids.push('bof');
  return ids.length ? ids : ['legacy-other'];
}
export function sourceAvailable(
  entry: SourcedDefinition,
  preferences: MageSourcePreferences,
) {
  const ids = sourceIds(entry);
  const mature =
    entry.contentLabel === 'mature' ||
    entry.category === 'nephandic' ||
    ids.includes('bof');
  return (
    (!mature || preferences.mature) &&
    ids.some((id) => id === 'mage-20' || preferences.enabled.includes(id))
  );
}
