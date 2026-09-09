# Mage 20 declarative proof

Mage 20 is the end-to-end proof because it exercises the broadest existing combination of identity fields, grouped ratings, mode protection, responsive navigation, catalog selections, resource tracks, collections, citations, local files, and settings.

## Verified implementation

- `src/games/mage20/module/mage20-module.ts` defines the bundled envelope and stable component/catalog references.
- `src/games/mage20/module/convert-mage-character.ts` performs copy-first conversion and retains the production character.
- `src/modules/renderer/ModuleCharacterEditor.tsx` renders the resolved module with the shared Mage-style shell, navigation, section ordering, settings, autosave, JSON/YAML Save, and Build/Play behavior.
- Trusted advanced registry components cover Spheres, Willpower, Quintessence/Paradox, Health, Backgrounds, Merits/Flaws, Focus, Wonders, Rotes, equipment, and maneuvers.
- `tests/unit/mage20-phase2-module.test.ts`, `tests/unit/mage20-module-conversion.test.ts`, `tests/integration/mage20-module-editor.test.tsx`, and `tests/e2e/mage20-module.spec.ts` provide the parity evidence.

## Intentional boundary

The production Mage editor remains the default. The module-built copy is an explicit preview/conversion path until product approval changes that default. Advanced Mage controls are core-trusted registry adapters, not executable module code. A future fully generic catalog/collection inspector is a builder enhancement, not a prerequisite for safely running the proof module.
