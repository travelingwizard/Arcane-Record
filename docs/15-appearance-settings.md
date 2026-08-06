# 15. Appearance settings

## Scope

Settings > Appearance is an application-level view preference. It changes the
visual treatment of the library, editor, navigation, controls, and dialogs
without changing character data, section order, component placement,
responsive breakpoints, validation, or Mage rules.

The Settings button is available from both the library and an open character.
Changes are applied immediately to semantic attributes on the root element:

```html
<html
  data-theme="arcane-ledger"
  data-theme-choice="arcane-ledger"
  data-overlay="neutral"
  data-reduce-motion="false"
></html>
```

`data-theme` is the resolved visual theme. When `data-theme-choice="system"`,
it resolves to Arcane Ledger for light appearance and Midnight Quintessence for
dark appearance and follows changes to the system media query.

## Preferences

The validated preference contains only stable machine IDs and a Boolean motion
choice:

```ts
interface AppearancePreferences {
  baseTheme:
    | 'system'
    | 'arcane-ledger'
    | 'midnight-quintessence'
    | 'hermetic-observatory'
    | 'technocratic-dossier'
    | 'umbral-dreamscape'
    | 'tradition-codex';
  identityOverlay:
    | 'neutral'
    | 'akashayana'
    | 'order-of-hermes'
    | 'virtual-adepts'
    | 'verbena'
    | 'cult-of-ecstasy'
    | 'sons-of-ether'
    | 'technocracy'
    | 'nephandic';
  reduceMotion: boolean;
}
```

It is validated with Zod at the `localStorage` boundary and stored under
`arcane-record:appearance-preferences`. Invalid or missing data falls back to
Arcane Ledger, Neutral, and standard motion. Appearance is intentionally
separate from the editor store, IndexedDB characters, autosave, and JSON/YAML
character files.

## Token architecture

Theme selectors assign semantic surface, text, border, accent, focus, status,
ornament, pattern, and shadow tokens in `src/styles/tokens.css`. Compatibility
aliases keep existing components on the same semantic layer while avoiding
theme-specific component branches. Identity overlays override only accent and
ornament variables, section glyphs, portrait framing, border treatment, and a
subtle background illustration.

No theme or overlay changes component geometry or behavior. All decorative
imagery is CSS-only and remains behind content. The manual Reduce decorative
motion preference applies the same suppression guarantees as
`prefers-reduced-motion`.

## Settings preview

Base themes and overlays use labeled radio cards with explicit Selected text.
The live sample covers a heading, raised surface, filled and empty dots, an
input, primary action, warning, and Willpower, Quintessence, and Paradox
indicators. Selection is never communicated by color alone.
