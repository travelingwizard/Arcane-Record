import { z } from 'zod';

const safePathSegment = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
  .refine(
    (value) =>
      value !== '__proto__' && value !== 'prototype' && value !== 'constructor',
    'Unsafe data-path segment.',
  );

export const dataPathSchema = z.strictObject({
  root: z.literal('character'),
  segments: z.array(safePathSegment).min(1).max(16),
});

export type DataPath = z.infer<typeof dataPathSchema>;

export function readDataPath(root: unknown, path: DataPath): unknown {
  let value = root;
  for (const segment of path.segments) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[segment];
  }
  return value;
}

export function writeDataPath(
  root: Record<string, unknown>,
  path: DataPath,
  value: unknown,
) {
  let target: Record<string, unknown> = root;
  for (const segment of path.segments.slice(0, -1)) {
    const child = target[segment];
    if (!child || typeof child !== 'object' || Array.isArray(child)) {
      throw new Error(`Data path "${path.segments.join('.')}" is unavailable.`);
    }
    target = child as Record<string, unknown>;
  }
  target[path.segments.at(-1)!] = value;
}

export function deleteDataPath(root: Record<string, unknown>, path: DataPath) {
  let target: Record<string, unknown> = root;
  for (const segment of path.segments.slice(0, -1)) {
    const child = target[segment];
    if (!child || typeof child !== 'object' || Array.isArray(child)) return;
    target = child as Record<string, unknown>;
  }
  delete target[path.segments.at(-1)!];
}

export function dataPathKey(path: DataPath) {
  return path.segments.join('.');
}
