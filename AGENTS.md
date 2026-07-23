# Project instructions

## Product boundary

- Build a local-first Mage: The Ascension 20th Anniversary Edition character sheet.
- Keep character data in browser-local IndexedDB. Never add a backend, accounts, analytics, telemetry, cloud sync, or external runtime assets.
- Use the exact phrase "Saved in this browser" for successful persistence.
- This milestone is an editable sheet, not a character-creation rules engine.
- Keep deferred features visibly labeled as previews or placeholders; do not imply they work.

## Architecture

- Keep reusable controls independent of Mage-specific definitions.
- UI components must not access Dexie or IndexedDB directly. Route persistence through `CharacterRepository`.
- Persist stable machine IDs and integer ratings, never visible labels or Boolean dot arrays.
- Keep the active editor store separate from persistence and from view-only preferences.
- Validate stored and imported character data with Zod at system boundaries.
- Keep components focused; do not turn the entire sheet into one page component.

## Interface

- Preserve the reference's parchment, charcoal, serif, fine-rule, compact-row character using original CSS decoration only.
- Do not use the PDF as a background or reuse its logos/art.
- Maintain keyboard support, visible focus, real labels, sufficient contrast, reduced-motion support, and practical 44px touch targets.
- Verify there is no page-level horizontal scrolling at 320 CSS pixels.
- Mobile Spheres are always a vertical list. Desktop users may toggle between the list and the circular wheel; both views must share the same character data.

## Change safety and verification

- Work only inside this repository. Do not deploy, publish, use sudo, change global settings, or install operating-system packages.
- Use npm and preserve the lockfile.
- Keep changes reviewable and make local commits only after the scaffold works and all checks pass.
- Before completion, run formatting, typecheck, lint, unit/integration tests, the supported E2E smoke test, and a production build.
- Review documentation and the Git diff for contradictions or unrelated changes.
