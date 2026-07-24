import { forwardRef } from 'react';
import type { CharacterSectionSummary } from '../../features/character-editor/character-section-summaries';

export const CharacterSectionDisclosure = forwardRef<
  HTMLButtonElement,
  {
    label: string;
    summary: CharacterSectionSummary;
    expanded: boolean;
    contentId: string;
    onToggle: () => void;
  }
>(function CharacterSectionDisclosure(
  { label, summary, expanded, contentId, onToggle },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className="character-section-disclosure"
      aria-expanded={expanded}
      aria-controls={contentId}
      aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`}
      onClick={onToggle}
    >
      <span className="character-section-disclosure__label">{label}</span>
      <span className="character-section-disclosure__summary">
        {summary.primary}
        {summary.warning ? (
          <strong>
            <span aria-hidden="true">⚠ </span>
            {summary.warning}
          </strong>
        ) : null}
      </span>
      <span className="character-section-disclosure__icon" aria-hidden="true">
        {expanded ? '−' : '+'}
      </span>
    </button>
  );
});
