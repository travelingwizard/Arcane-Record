export function SectionOrderEditToggle({
  editing,
  onToggle,
}: {
  editing: boolean;
  onToggle: () => void;
}) {
  const label = editing ? 'Finish editing section order' : 'Edit section order';

  return (
    <button
      type="button"
      className="icon-button section-order-edit-toggle"
      aria-label={label}
      aria-pressed={editing}
      title={label}
      onClick={onToggle}
    >
      <span aria-hidden="true">✎</span>
    </button>
  );
}
