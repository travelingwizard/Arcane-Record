# Module component registry

## Implemented boundary

`src/modules/renderer/component-registry.tsx` is the only runtime mapping from a declarative component `type` to trusted React. Module JSON cannot contain React, callbacks, HTML, CSS, URLs, or executable code. Unknown component types fail the strict Zod envelope before activation.

Every registered type has centralized authoring metadata: stable type, name, category, description, icon, import safety, and, where the general builder can create it, a builder kind. The searchable builder palette is derived from this metadata rather than maintaining a second component list.

## General authorable components

| Type             | Stored value | Runtime behavior                |
| ---------------- | ------------ | ------------------------------- |
| `static-text`    | none         | Safe plain instructions         |
| `text`           | string       | Labeled single-line field       |
| `multiline-text` | string       | Labeled notes field             |
| `number`         | integer      | Bounded native numeric field    |
| `checkbox`       | boolean      | Labeled Boolean choice          |
| `select`         | string       | Finite labeled options          |
| `dot-rating`     | integer      | Shared accessible dots or boxes |

Adding a bound component also adds its property and default to the template schema. Duplicating a bound component creates a new property and data path; copies therefore do not silently edit the original value. Removing a component does not delete its old schema field, which preserves character data and permits Undo or later repair.

## Trusted composed components

The runtime also registers `heading`, `field-grid`, `grouped-dot-ratings`, `sphere-rating-wheel`, `permanent-temporary-rating`, `opposed-wheel-20`, `cycling-damage-track`, `validation-summary`, Mage catalog/collection adapters, and the Exalted section adapter. These are valid imported definitions and render through trusted core code. The generic palette does not fabricate them because their configuration requires structured nested paths or game-specific catalogs; authors may currently configure them through the validated module JSON view.

That limitation is visible and remains in `backlog.md`; the UI does not claim a form inspector for those types.

## Inspector and layout contract

The general inspector edits only relevant safe properties: label/accessibility name, help, full/half width, mode behavior, numeric bounds, select options, and section placement. Data paths are shown but not renamed after creation because renaming persisted paths requires an explicit migration.

Sections use `full` or `half` widths. Components normally use `full` or `half`. Core CSS supplies the responsive grid and always stacks it at narrow widths. Modules cannot supply arbitrary classes, breakpoints, colors, or positioning.

Drag-and-drop is an enhancement. Add, move up/down, move to section, copy, paste, duplicate, and delete all have buttons. Changes use the same snapshot history as JSON edits, autosave to the draft repository, and can be undone.

## Serialization and migration

Component definitions are strict JSON data inside format version 1. New optional fields are additive. Character values remain stable, schema-validated values. Module migrations support `set-default-if-missing` and `rename-path`; unsupported future definitions remain recoverable rather than being coerced.
