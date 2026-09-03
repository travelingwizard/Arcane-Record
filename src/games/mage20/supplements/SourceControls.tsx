import { useState } from 'react';
import { useEditorStore } from '../../../state/editor-store';
import {
  mageSources,
  sourceAvailable,
  sourceIds,
  type SourcedDefinition,
} from './sources';

export function useMageSourceFilter() {
  const preferences = useEditorStore((s) => s.character?.sourcePreferences);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [source, setSource] = useState('all');
  const available = (entry: SourcedDefinition) =>
    sourceAvailable(
      entry,
      preferences ?? { enabled: ['mage-20'], mature: false },
    );
  const visible = (entry: SourcedDefinition) =>
    (preferences?.mature ||
      !(
        entry.contentLabel === 'mature' ||
        entry.category === 'nephandic' ||
        sourceIds(entry).includes('bof')
      )) &&
    (showUnavailable || available(entry)) &&
    (source === 'all' || sourceIds(entry).includes(source));
  const controls = (
    <fieldset className="catalog-filters">
      <legend>Sources</legend>
      <label>
        Source filter
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="all">All enabled sources</option>
          {mageSources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.kind}
            </option>
          ))}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={showUnavailable}
          onChange={(e) => setShowUnavailable(e.target.checked)}
        />
        Show unavailable sources
      </label>
      <p>
        Enable books in character Settings. Source changes never remove selected
        records.
      </p>
    </fieldset>
  );
  return { available, visible, controls };
}
export function MageSourceWarning({ entry }: { entry: SourcedDefinition }) {
  const preferences = useEditorStore((s) => s.character?.sourcePreferences);
  if (
    sourceAvailable(
      entry,
      preferences ?? { enabled: ['mage-20'], mature: false },
    )
  )
    return null;
  return (
    <p className="catalog-card__review">
      Source unavailable. Existing selection retained; its recorded rules still
      apply.
    </p>
  );
}
