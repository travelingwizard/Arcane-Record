# Project instructions

## Product boundary

- Build Arcane Record as a local-first, multi-game character-sheet application.
  Mage 20 is the complete first module; Exalted First Edition includes Solar
  and Dragon-Blooded sheet variants.
- Keep character data in browser-local IndexedDB. Never upload character data,
  local drafts, preferences, or usage events. Analytics, telemetry, cloud
  character sync, and external character-sheet runtime assets remain
  prohibited.
- A separately deployed hosted Module Registry is authorized. It may store
  authenticated publisher identities, namespace grants, immutable validated
  module packages, checksums, review/deprecation state, catalog pointers, and
  security audit events. It must never receive character data and the app must
  remain fully usable offline with cached modules.
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

- Treat the shared section-navigation system as core application chrome. Every
  character editor uses the desktop left rail, the mobile Sections sheet, and
  pencil-gated section-group reordering that also reorders the sheet.
- Preserve the reference's parchment, charcoal, serif, fine-rule, compact-row character using original CSS decoration only.
- Do not use the PDF as a background or reuse its logos/art.
- Maintain keyboard support, visible focus, real labels, sufficient contrast, reduced-motion support, and practical 44px touch targets.
- Verify there is no page-level horizontal scrolling at 320 CSS pixels.
- Mobile Spheres are always a vertical list. Desktop users may toggle between the list and the circular wheel; both views must share the same character data.

## Change safety and verification

- Work only inside this repository. Do not publish, use sudo, change global
  settings, or install operating-system packages. Registry implementation and
  local verification are authorized; deployment and public publication still
  require the user's explicit authorization.
- Use npm and preserve the lockfile.
- Keep changes reviewable and make local commits only after the scaffold works and all checks pass.
- Before completion, run formatting, typecheck, lint, unit/integration tests, the supported E2E smoke test, and a production build.
- Review documentation and the Git diff for contradictions or unrelated changes.
