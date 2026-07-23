import type { SaveStatus } from '../../state/editor-store';

const labels: Record<SaveStatus, string> = {
  unsaved: 'Unsaved changes',
  saving: 'Saving locally…',
  saved: 'Saved in this browser',
  error: 'Local save failed',
};

export function SaveStatusBadge({ status }: { status: SaveStatus }) {
  return (
    <div className={`save-status save-status--${status}`} role="status">
      <span className="save-status__mark" aria-hidden="true" />
      {labels[status]}
    </div>
  );
}
