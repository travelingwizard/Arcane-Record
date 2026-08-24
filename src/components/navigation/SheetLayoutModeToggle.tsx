import type { SheetLayoutMode } from '../../systems/mage-m20/character-sections';

export function SheetLayoutModeToggle({
  mode,
  onModeChange,
  playModeNote = 'Build-only ratings are view-only in Play mode.',
}: {
  mode: SheetLayoutMode;
  onModeChange: (mode: SheetLayoutMode) => void;
  playModeNote?: string;
}) {
  const playMode = mode === 'play';

  return (
    <div className="sheet-layout-mode-control">
      <label className="sheet-layout-mode-toggle">
        <span>Build mode</span>
        <input
          type="checkbox"
          role="switch"
          checked={playMode}
          onChange={() => onModeChange(playMode ? 'build' : 'play')}
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
