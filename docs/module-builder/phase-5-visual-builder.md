# Phase 5: local visual module builder

## Result

The library now links to a local-only Module Builder. Draft projects have their
own IndexedDB table and repository API, remain separate from characters and
immutable installed packages, and autosave valid or invalid working material.
The interface uses the exact status “Draft saved in this browser.”

The project workspace provides:

- draft create, open, duplicate, and delete;
- a root/child game hierarchy editor with inheritance metadata;
- a sheet outline, canvas, inspector, and registered-component inventory;
- section creation and keyboard-operable ordering controls;
- catalog creation and bulk line paste with stable generated IDs;
- desktop/mobile and Build/Play structural previews;
- installable-snapshot validation with detailed schema diagnostics;
- bounded undo/redo history with redo invalidation;
- raw JSON recovery editing for invalid drafts;
- a safe semantic theme preview with no CSS, layout, script, asset, or network
  escape hatch.

Only a validated snapshot can be exported. Export does not install or activate
the module. Formula, action, dice, validation-rule, and creation-flow editors
are explicitly read-only Phase 6 placeholders, so the builder does not imply
that deferred rule-authoring features work.

## Safety and migration

No character schema or existing character is migrated. No current game changes
renderer. The builder consumes the same closed module schema, validation
pipeline, and component registry as the runtime. Draft persistence accepts
unknown working data by design; package export requires full validation.
