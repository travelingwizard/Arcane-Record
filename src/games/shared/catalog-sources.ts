import { z } from 'zod';

export interface CatalogSource {
  id: string;
  title: string;
  required: boolean;
  classification: 'official' | 'community';
  maxPage: number;
}

export interface CatalogCitation {
  sourceId: string;
  page: number;
  verification: 'citation-only' | 'rules-reviewed';
}

export function sourceSelectionSchema(sources: readonly CatalogSource[]) {
  return z
    .array(z.string().min(1))
    .default([])
    .transform((ids) => [
      ...new Set([
        ...sources.filter((s) => s.required).map((s) => s.id),
        ...ids,
      ]),
    ]);
}

export function readSourceDefaults(
  gameId: string,
  sources: readonly CatalogSource[],
): string[] {
  const schema = sourceSelectionSchema(sources);
  try {
    const parsed = schema.safeParse(
      JSON.parse(
        localStorage.getItem(`arcane-record:${gameId}:source-defaults`) ?? '[]',
      ),
    );
    return parsed.success ? parsed.data : schema.parse([]);
  } catch {
    return schema.parse([]);
  }
}

export function writeSourceDefaults(
  gameId: string,
  sources: readonly CatalogSource[],
  ids: string[],
) {
  localStorage.setItem(
    `arcane-record:${gameId}:source-defaults`,
    JSON.stringify(sourceSelectionSchema(sources).parse(ids)),
  );
}

export function catalogAvailability(
  sourceId: string,
  enabled: readonly string[],
  sources: readonly CatalogSource[],
) {
  const source = sources.find((s) => s.id === sourceId);
  if (!source) return 'unresolved' as const;
  return source.required || enabled.includes(sourceId)
    ? ('available' as const)
    : ('disabled-source' as const);
}

export function canAutomateCatalogEntry(
  entry: CatalogCitation,
  costVerified: boolean,
) {
  return entry.verification === 'rules-reviewed' && costVerified;
}
