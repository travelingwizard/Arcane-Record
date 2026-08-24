import type { SectionSummaryDefinition } from '../schema/module-envelope';
import { readDataPath } from '../schema/data-path';

export function resolveSectionSummary(
  summary: SectionSummaryDefinition | undefined,
  data: Record<string, unknown>,
  fallback: string,
) {
  if (!summary) return fallback;
  if (summary.type === 'fields') {
    const fields = summary.paths
      .map((path) => readDataPath(data, path))
      .filter((value): value is string =>
        Boolean(typeof value === 'string' && value.trim()),
      );
    return fields.length ? fields.join(summary.separator) : summary.fallback;
  }
  if (summary.type === 'field-slots') {
    return summary.slots
      .map((slot) => {
        const value = slot.paths
          .map((path) => readDataPath(data, path))
          .find(
            (candidate) =>
              typeof candidate === 'string' && candidate.trim().length > 0,
          );
        return typeof value === 'string' ? value : slot.fallback;
      })
      .join(summary.separator);
  }
  return summary.groups
    .map((group) => {
      const values = group.paths.map((path) => readDataPath(data, path));
      const result =
        summary.type === 'rating-group-totals'
          ? values.reduce<number>(
              (total, value) => total + (typeof value === 'number' ? value : 0),
              0,
            )
          : values.filter((value) => typeof value === 'number' && value > 0)
              .length;
      return `${group.label} ${result}`;
    })
    .join(summary.separator);
}
