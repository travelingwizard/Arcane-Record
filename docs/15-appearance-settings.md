# 15. Appearance settings

## Scope

Settings separates the neutral application shell from character-sheet
appearance. The library route at `/settings` manages global shell color and the
default character-sheet appearance. Every Mage, Solar, and Dragon-Blooded
editor also provides an accessible Settings dialog in its header.

Character-sheet appearance supports three actions:

- editing in a sheet creates or updates that character's browser-local override;
- **Set as Default** keeps the open character's selection and applies it to new
  characters that do not have an override;
- **Apply Universally** promotes the current selection to the default and clears
  all existing character overrides after confirmation.

Changes apply immediately to semantic attributes on the root element. They do
not alter character data, rules, layout, IndexedDB records, or JSON/YAML files.

## Theme catalog

All themes are available to every registered character sheet. Preview cards are
grouped as General, Suggested for Mage, Suggested for Exalted, and Simple
backgrounds; these are recommendations rather than restrictions.

- Mage suggestions: Arcane Ledger, Midnight Quintessence, Hermetic Observatory,
  Technocratic Dossier, Umbral Dreamscape, and Tradition Codex.
- Exalted suggestion: Exalted Vermilion, which preserves the original ivory,
  vermilion, and ceremonial-gold treatment.
- Simple backgrounds: Crimson, Navy, Forest, Plum, and Charcoal.
- Custom Background: a native color picker controls only the area behind a
  crisp white sheet canvas.

Identity overlays remain optional and may be combined with any base theme.
System Default resolves to Arcane Ledger for light appearance and Midnight
Quintessence for dark appearance.

## Persistence

The Zod-validated, versioned preference is stored under
`arcane-record:appearance-preferences`:

```ts
interface AppearancePreferenceStore {
  version: 2;
  defaultAppearance: AppearancePreferences;
  characterAppearances: Record<string, AppearancePreferences>;
}

interface AppearancePreferences {
  baseTheme: BaseThemeId;
  identityOverlay: IdentityOverlayId;
  reduceMotion: boolean;
  customBackground: string | null;
}
```

The previous single Mage appearance object migrates safely into
`defaultAppearance`; no selection is discarded. Deleting a character removes
its override. New, imported, and duplicated characters inherit the default
because they have a new stable UUID and no override.

Appearance is intentionally separate from the active editor store, IndexedDB,
autosave, character schemas, and exchange files. Global shell preferences remain
under `arcane-record:global-preferences`.

## Game-specific settings

The shared dialog accepts a game-owned settings panel without teaching shared
components any game rules. Mage exposes Sphere ordering, the Desktop Sphere
wheel, and a Temporary Willpower boxes-or-dots choice. Boxes are the Willpower
default. These controls use one synchronized browser-local preference source
and do not alter exported character ratings. Exalted does not show an empty
placeholder and can add Solar- or Dragon-Blooded-specific controls later.

## Accessibility and tokens

Theme selectors assign semantic surface, text, border, accent, focus, status,
ornament, pattern, and shadow tokens in `src/styles/tokens.css`. No theme changes
component geometry, navigation, labels, validation, or responsive behavior.
Selection uses radio controls plus explicit Selected text, not color alone.

The Settings dialog traps focus, closes with Escape or its labeled close button,
restores focus to the trigger, and uses practical touch targets. The live sample
covers headings, surfaces, dots, inputs, actions, warnings, Willpower,
Quintessence, and Paradox. Reduced motion respects both the saved setting and the
system accessibility preference.
