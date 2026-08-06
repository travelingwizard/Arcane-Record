import { useCharacterSectionContext } from './character-section-context';

export function SheetLayoutModeToggle() {
  const navigation = useCharacterSectionContext();
  if (!navigation) {
    return null;
  }

  const playMode = navigation.sheetLayout.mode === 'play';

  return (
    <div className="sheet-layout-mode-control">
      <label className="sheet-layout-mode-toggle">
        <span>Build mode</span>
        <input
          type="checkbox"
          role="switch"
          checked={playMode}
          onChange={() =>
            navigation.setSheetLayoutMode(playMode ? 'build' : 'play')
          }
        />
        <span className="sheet-layout-mode-toggle__track" aria-hidden="true">
          <span />
        </span>
        <span>Play mode</span>
      </label>
      {playMode ? (
        <p className="sheet-layout-mode-note" role="status">
          Build ratings are view-only. Health, Temporary Willpower,
          Quintessence, Paradox, and Equipment remain editable.
        </p>
      ) : null}
    </div>
  );
}
