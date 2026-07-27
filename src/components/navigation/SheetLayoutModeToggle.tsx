import { useCharacterSectionContext } from './character-section-context';

export function SheetLayoutModeToggle() {
  const navigation = useCharacterSectionContext();
  if (!navigation) {
    return null;
  }

  const playMode = navigation.sheetLayout.mode === 'play';

  return (
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
      <span>Play mode</span>
    </label>
  );
}
