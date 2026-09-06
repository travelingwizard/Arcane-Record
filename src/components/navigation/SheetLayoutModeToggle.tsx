type EditableSheetMode = 'build' | 'edit';

export function SheetLayoutModeToggle<T extends EditableSheetMode = 'build'>({
  mode,
  onModeChange,
  playModeNote = 'Build-only ratings are view-only in Play mode.',
  editMode = 'build' as T,
  editLabel = 'Build mode',
  ariaLabel,
}: {
  mode: T | 'play';
  onModeChange: (mode: T | 'play') => void;
  playModeNote?: string;
  editMode?: T;
  editLabel?: string;
  ariaLabel?: string;
}) {
  const playMode = mode === 'play';

  return (
    <div className="sheet-layout-mode-control">
      <label className="sheet-layout-mode-toggle">
        <span>{editLabel}</span>
        <input
          type="checkbox"
          role="switch"
          aria-label={ariaLabel}
          checked={playMode}
          onChange={() => onModeChange(playMode ? editMode : 'play')}
        />
        <span className="sheet-layout-mode-toggle__track" aria-hidden="true">
          <span />
        </span>
        <span>Play mode</span>
      </label>
      {playMode ? (
        <p className="sheet-layout-mode-note" role="status">
          {playModeNote}
        </p>
      ) : null}
    </div>
  );
}
