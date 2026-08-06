import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

type GroupedSectionElement = ReactElement<{
  'data-section-group'?: string;
}>;

export function OrderedSheetSections({
  groupOrder,
  className,
  children,
}: {
  groupOrder: readonly string[];
  className?: string;
  children: ReactNode;
}) {
  const sectionElements = Children.toArray(children).filter(
    (child): child is GroupedSectionElement => isValidElement(child),
  );
  const ordered = groupOrder.flatMap((groupId) =>
    sectionElements.filter(
      (section) => section.props['data-section-group'] === groupId,
    ),
  );
  const knownGroups = new Set(groupOrder);
  const ungrouped = sectionElements.filter((section) => {
    const groupId = section.props['data-section-group'];
    return !groupId || !knownGroups.has(groupId);
  });

  return <div className={className}>{[...ordered, ...ungrouped]}</div>;
}
