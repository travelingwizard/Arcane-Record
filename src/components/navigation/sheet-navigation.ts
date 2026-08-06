export interface SheetNavigationGroupDefinition {
  id: string;
  label: string;
}

export interface SheetNavigationSectionDefinition {
  id: string;
  label: string;
  shortLabel?: string;
  group: string;
}

export interface SheetNavigationSummary {
  primary: string;
  warning?: string;
}

export function getOrderedNavigationGroups(
  groups: readonly SheetNavigationGroupDefinition[],
  order: readonly string[],
) {
  const positions = new Map(order.map((id, index) => [id, index]));
  return [...groups].sort(
    (left, right) =>
      (positions.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (positions.get(right.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

export function getSheetSectionFromHash(
  sections: readonly SheetNavigationSectionDefinition[],
  hash = window.location.hash,
) {
  const candidate = decodeURIComponent(hash.replace(/^#/, ''));
  return sections.some((section) => section.id === candidate)
    ? candidate
    : null;
}

export function moveOrderedId<TId extends string>(
  order: readonly TId[],
  id: TId,
  direction: 'earlier' | 'later',
) {
  const index = order.indexOf(id);
  const target = direction === 'earlier' ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= order.length) {
    return [...order];
  }
  const next = [...order];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}
