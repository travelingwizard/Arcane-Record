# Backlog

Prioritized work from the 2026-09-08 comprehensive review. Prefer high-value, low-complexity items. Cosmetic cleanup is below data integrity, broken linked workflows, and configuration conflicts.

**Recommended first phase (after approval):** nginx gzip/brotli + favicon/robots → Mage save parity → YAML/import caps → docs → linked export. Live production issues are in [live-site-review.md](live-site-review.md).

---

## Prioritized summary

| Priority | ID | Recommendation | Value | Effort | Risk | Timing |
|---|---|---|---|---|---|---|
| 0 | BL-26 | Enable gzip/brotli on character.travelingwizard.net | High | Small | Low | Now |
| 0 | BL-27 | Real favicon/robots; stop HTML 200 on those paths | Medium | Small | Low | Now |
| 1 | BL-01 | Mage autosave parity with LocalSheet (queue, CAS, beforeunload) | High | Medium | Medium | Now |
| 2 | BL-02 | Character YAML `{ json: true }` + size cap | High | Small | Low | Now |
| 3 | BL-03 | Sync README, charter, docs/16, docs/07 with 19 games | High | Small | Low | Now |
| 4 | BL-04 | Linked-record export/import/delete hooks | High | Medium | Medium | Now |
| 5 | BL-05 | Playwright port off 4173; document ledger DB name | High | Small | Low | Now |
| 6 | BL-06 | `.gitignore` `.env`; ESLint/Prettier ignore `registry-dist` | Medium | Small | Low | Now |
| 7 | BL-07 | Character-page React error boundary | Medium | Small | Low | Now |
| 8 | BL-08 | Stop exporting unused `characterRepository` | Medium | Small | Low | Now |
| 9 | BL-09 | Create-list Completeness / Preview labels | Medium | Small | Low | Now |
| 10 | BL-10 | Format-v2 import validation when module missing | Medium | Small | Low | Now |
| 11 | BL-11 | Persistence unit tests for shared autosave helper | High | Medium | Low | Now |
| 12 | BL-12 | Document `prebuild` and registry scripts | Low | Small | Low | Now |
| 13 | BL-13 | JWT audience string alignment | Medium | Small | Low | Next |
| 14 | BL-14 | Declare `esbuild`; align Node engines vs target | Medium | Small | Low | Next |
| 15 | BL-15 | Production-preview e2e smoke | Medium | Small | Low | Next |
| 16 | BL-16 | Shared undo for LocalSheet removals | Medium | Medium | Low | Next |
| 17 | BL-17 | LocalSheet section-expansion prefs | Low | Small | Low | Next |
| 18 | BL-18 | Centralize localStorage key constants | Low | Small | Low | Next |
| 19 | BL-19 | Skip link; confirm 44px on dense rows | Low | Small | Low | Next |
| 20 | BL-20 | Orphan section-pref cleanup on delete | Low | Small | Low | Next |
| 21 | BL-21 | `saveIfUnchanged` envelope compare | Low | Small | Low | Next |
| 22 | BL-22 | CSP/HSTS after background-URL audit | Low | Small | Medium | Next |
| 23 | BL-23 | Lazy-load game editors after gzip is on (bundle is 3.9 MB raw) | Medium | Medium | Medium | Next |
| 24 | BL-24 | Merge `mage-m20` into `games/mage20` | Medium | Large | Medium | Later |
| 25 | BL-25 | Optional CI | Low | Small | Low | Later |
| — | BL-90 | Hosted registry production expansion | — | Large | High | Do not pursue now |
| — | BL-91 | Convert production Mage/Exalted to module runtime | — | Large | High | Do not pursue now |
| — | BL-92 | Rename IndexedDB `arcane-ledger` | — | Medium | Critical | Do not pursue |
| — | BL-93 | React Router / extra state libraries / cloud sync | — | Medium | High | Do not pursue |
| — | BL-94 | Overlay/homebrew runtime UI | — | Large | Medium | Do not pursue now |
| — | BL-95 | Visual redesign away from parchment | — | Large | High | Do not pursue |

---

## 1. Critical corrections

None at **Critical** severity: no confirmed total data wipe, RCE, or core library failure in a default single-tab Mage session. High items below are the closest to that line.

---

## 2. High-value improvements

### BL-26 — Enable gzip/brotli on the live character host

- **Problem:** Production sends ~3.9 MB of JavaScript with no `Content-Encoding`.
- **Findings:** AR-058, AR-040
- **Proposed work:** nginx `gzip on` (+ brotli if the module is available) for js/css/html/json/svg; or precompress at build. Do not change IndexedDB.
- **Files:** `deploy/nginx/character.travelingwizard.net.conf` (and the http vhost if needed)
- **Dependencies:** Deploy access
- **Effort:** Small
- **Risk:** Low
- **Acceptance:** `curl -I -H "Accept-Encoding: gzip"` on `/assets/index-*.js` returns `content-encoding: gzip` and a body well under 2 MB. App still loads.
- **Tests:** Manual curl; existing e2e after deploy
- **Order:** 0

### BL-27 — Favicon and robots must not be the SPA HTML

- **Problem:** `/favicon.ico` and `/robots.txt` return 200 `text/html` index.html.
- **Findings:** AR-059
- **Proposed work:** Exact nginx locations that 404, or add `public/favicon.ico` and `public/robots.txt`. Keep `try_files` for app routes only.
- **Files:** `deploy/nginx/character.travelingwizard.net.conf`; optional `public/`
- **Dependencies:** None
- **Effort:** Small
- **Risk:** Low
- **Acceptance:** Favicon is an image or 404; robots is `text/plain` or 404; `/characters/:id` still SPA-falls-back.
- **Tests:** curl
- **Order:** 0

### BL-01 — Mage autosave parity with LocalSheet

- **Problem:** Flagship sheet can lose overlapping or in-flight edits; no unload prompt.
- **Findings:** AR-006, AR-026, AR-027, AR-042, AR-051
- **Proposed work:** Extract or reuse LocalSheet save queue + `saveIfUnchanged` + `beforeunload`; point Mage `useAutosave` at it (Zustand can remain for fields). Unify debounce constant.
- **Files:** `src/features/character-editor/use-autosave.ts`; `src/games/shared/LocalSheet.tsx`; `src/games/mage20/Mage20Editor.tsx`; `src/storage/dexie-stored-character-repository.ts`; new tests
- **Dependencies:** None
- **Effort:** Medium
- **Risk:** Medium
- **Acceptance:** Mage overlapping saves do not write stale drafts (conflict or queue). Tab close with unsaved Mage edits prompts. Badge still says “Saved in this browser.” Existing Mage e2e persistence passes.
- **Tests:** Unit fake-repository overlapping save; beforeunload integration; `tests/e2e/local-persistence.spec.ts`
- **Order:** 1

### BL-02 — Harden character file import

- **Problem:** YAML tags and unbounded file size are a worse boundary than module import.
- **Findings:** AR-035, AR-036, AR-028 (related)
- **Proposed work:** `load(contents, { json: true })`; 2–5 MB cap; reject non-plain objects; optionally refuse v2 garbage when module missing or quarantine.
- **Files:** `src/features/import-export/character-files.ts`; `tests/unit` import tests
- **Dependencies:** None (BL-10 can ship in the same PR)
- **Effort:** Small
- **Risk:** Low
- **Acceptance:** Exported YAML still imports. Custom-tag YAML rejected with a clear error. Oversized file rejected. Open character not replaced on failure.
- **Tests:** YAML tag fixture; size fixture; Mage YAML round-trip
- **Order:** 2

### BL-04 — Linked-record interchange

- **Problem:** Wraith/Shadow, Mouse Guard/Patrol, Legend/Fellowship UUIDs break on import/delete.
- **Findings:** AR-004, AR-029, AR-052
- **Proposed work:** Generalize City of Mist `prepareExport` / `getDeleteWarning`. Export companion snapshot or multi-record archive. Import recreates links with new IDs.
- **Files:** `src/games/city-of-mist/crew-service.ts` (pattern); `wraith20`; `mouse-guard2e`; `legend-in-the-mist`; `character-files.ts`; `ArcaneRecordLibrary.tsx`
- **Dependencies:** None
- **Effort:** Medium
- **Risk:** Medium
- **Acceptance:** Empty-profile import of a linked pair yields two records that still resolve. Delete of a psyche/patrol warns. Mage single-file import unchanged.
- **Tests:** Unit fixtures per pair; optional e2e for Wraith
- **Order:** 4

### BL-11 — Tests for the shared save helper

- **Problem:** Persistence risk is under-tested on the Mage path.
- **Findings:** AR-051
- **Proposed work:** Fake `StoredCharacterRepository` tests for queue, CAS, stale writer message.
- **Files:** new `tests/unit/stored-character-autosave.test.ts` (name flexible)
- **Dependencies:** BL-01 (or write tests first, red/green)
- **Effort:** Medium
- **Risk:** Low
- **Acceptance:** Tests fail if queue/CAS removed.
- **Tests:** themselves
- **Order:** 1 (with BL-01)

---

## 3. Consistency and cleanup

### BL-03 — Documentation matches `registry.ts`

- **Problem:** README/charter/docs/16 understate games and contradict the authorized registry.
- **Findings:** AR-001, AR-032, AR-050, AR-056
- **Proposed work:** List all 19 systems with status. Charter: exception for module registry (no character data). docs/16 registered systems table. docs/16 expansion vs order. docs/07 coverage table. docs/06 YAML/lock remap notes.
- **Files:** `README.md`; `docs/00-project-charter.md`; `docs/16-multi-game-architecture.md`; `docs/07-testing-plan.md`; `docs/06-import-export.md`; `docs/09-future-systems.md`
- **Dependencies:** None
- **Effort:** Small
- **Risk:** Low
- **Acceptance:** A reader of README can name every create-page game and its status.
- **Tests:** None (doc)
- **Order:** 3

### BL-05 — Isolate Playwright from port 4173

- **Problem:** E2E can attach to HEMA or Vite preview.
- **Findings:** AR-013, AR-025
- **Proposed work:** Playwright `4174` (or similar). Pin Vite preview if needed. Comment in `playwright.config.ts`. Do not rename `arcane-ledger`.
- **Files:** `playwright.config.ts`; `vite.config.ts` optional; `deploy/README.md` note
- **Dependencies:** Confirm HEMA should stay on 4173
- **Effort:** Small
- **Risk:** Low
- **Acceptance:** E2e config port ≠ HEMA upstream. `reuseExistingServer` cannot collide.
- **Tests:** `npm run test:e2e`
- **Order:** 5

### BL-06 — Env and generated-artifact ignores

- **Findings:** AR-024, AR-039
- **Proposed work:** gitignore `.env`; eslint/prettier ignore `registry-dist`
- **Files:** `.gitignore`; `eslint.config.js`; `.prettierignore`
- **Dependencies:** None
- **Effort:** Small
- **Risk:** Low
- **Acceptance:** `git check-ignore .env` and `registry-dist/server.js`
- **Tests:** none
- **Order:** 6

### BL-08 — Remove dead Mage repository export

- **Findings:** AR-010, AR-055
- **Proposed work:** Stop exporting `characterRepository` from `repository-instance.ts`; keep class private to Mage adapter if needed
- **Files:** `src/storage/repository-instance.ts`; Mage editor adapter
- **Dependencies:** None
- **Effort:** Small
- **Risk:** Low
- **Acceptance:** App still lists mixed games; Mage saves
- **Tests:** typecheck; Mage e2e
- **Order:** 8

### BL-09 — Create-flow status labels

- **Findings:** AR-001, AR-045 (product IA)
- **Proposed work:** Complete / Foundation / Preview on create cards (Curseborne already describes itself)
- **Files:** `CreateCharacterPage.tsx`; optional field on `GameSystemDefinition`
- **Dependencies:** BL-03 copy
- **Effort:** Small
- **Risk:** Low
- **Acceptance:** Curseborne marked Preview; Mage Complete; user can still create all
- **Tests:** unit route/create render or e2e create page
- **Order:** 9

### BL-10 — Module v2 import validation

- **Findings:** AR-028
- **Proposed work:** Size/type guards always; parse when installed; when not installed, still reject non-objects
- **Files:** `character-files.ts`
- **Dependencies:** BL-02
- **Effort:** Small
- **Risk:** Low
- **Acceptance:** Garbage v2 file does not become a silent IDB row **or** is only recoverable-raw, never “available”
- **Tests:** unit
- **Order:** 2 (with BL-02)

### BL-12 — Document prebuild and registry scripts

- **Findings:** AR-023
- **Files:** `README.md`; `docs/08-local-development.md`
- **Effort:** Small
- **Risk:** Low
- **Acceptance:** `prebuild` mentioned; registry commands listed as optional
- **Order:** 12
- **Tests:** none
- **Dependencies:** none
- **Problem:** Silent BW packaging on `npm run build`
- **Proposed work:** One paragraph

### BL-07 — Error boundary

- **Findings:** AR-009, AR-043
- **Proposed work:** Boundary around character page: message, export raw, back to library
- **Files:** `src/app/CharacterPage.tsx`; `App.tsx`
- **Effort:** Small
- **Risk:** Low
- **Acceptance:** Thrown child does not unmount the whole SPA
- **Tests:** integration
- **Order:** 7
- **Dependencies:** none
- **Problem:** Render throw loses UI

### BL-13 — JWT audience alignment

- **Findings:** AR-014
- **Files:** env example; `tests/registry/registry-security.test.ts`; smoke script
- **Effort:** Small
- **Risk:** Low
- **Timing:** Next
- **Acceptance:** One audience string in example and tests
- **Order:** 13
- **Dependencies:** none
- **Problem:** Deploy example would not match tests
- **Proposed work:** Pick `arcane-record-registry` or `arcane-registry` and use it everywhere

### BL-14 — Node engines + direct esbuild

- **Findings:** AR-015
- **Files:** `package.json`; `scripts/build-registry.mjs`; `docs/08`
- **Effort:** Small
- **Risk:** Low
- **Timing:** Next
- **Acceptance:** `engines` matches esbuild `target`; esbuild is a direct devDependency
- **Order:** 14
- **Dependencies:** decide Node 20 vs 22
- **Problem:** Fragile registry builds
- **Proposed work:** declare engines and esbuild

### BL-18 — Preference key constants

- **Findings:** AR-016
- **Files:** new `src/storage/preference-keys.ts`; Mage prefs; phase-2 module
- **Effort:** Small
- **Risk:** Low
- **Timing:** Next
- **Acceptance:** No duplicated `arcane-ledger:sphere-sort` literals; keys unchanged
- **Order:** 18
- **Dependencies:** none
- **Problem:** Dual prefixes + duplicated strings
- **Proposed work:** constants module + short docs comment

### BL-20 — Delete section prefs with character

- **Findings:** AR-031
- **Files:** `ArcaneRecordLibrary.tsx`
- **Effort:** Small
- **Risk:** Low
- **Timing:** Next
- **Acceptance:** After delete, `arcane-ledger:section-preferences:<id>` is gone
- **Order:** 20
- **Dependencies:** none
- **Problem:** Orphan keys
- **Proposed work:** `removeItem` on delete

### BL-21 — Stronger `saveIfUnchanged`

- **Findings:** AR-030
- **Files:** `dexie-stored-character-repository.ts`; LocalSheet
- **Effort:** Small
- **Risk:** Low
- **Timing:** Next
- **Acceptance:** Name-only concurrent change either conflicts or is defined
- **Order:** 21
- **Dependencies:** BL-01
- **Problem:** CAS ignores envelope fields
- **Proposed work:** hash data+name+moduleRef+homebrew

---

## 4. Testing and documentation

Covered by BL-03, BL-11, BL-12, plus:

### BL-15 — Production preview smoke

- **Findings:** AR-019
- **Proposed work:** One Playwright project using `vite preview` **or** README sentence that e2e is dev-only
- **Files:** `playwright.config.ts`; README
- **Effort:** Small
- **Risk:** Low
- **Timing:** Next
- **Acceptance:** Documented truth; optionally a passing preview spec
- **Tests:** e2e
- **Order:** 15
- **Dependencies:** BL-05 ports
- **Problem:** E2E ≠ production build

### BL-25 — Optional CI

- **Findings:** AR-053
- **Proposed work:** `npm ci`, typecheck, lint, `vitest run` only
- **Files:** `.github/workflows/*`
- **Effort:** Small
- **Risk:** Low
- **Timing:** Later
- **Acceptance:** Push runs unit tests
- **Tests:** the workflow
- **Order:** 25
- **Dependencies:** User wants GitHub Actions
- **Problem:** No automated gate

Move `tests/curseborne-rules.test.ts` into `tests/unit/` (AR-054) as a drive-by of BL-03/BL-15.

---

## 5. Optional future improvements

### BL-16 — Shared one-step undo

- **Findings:** AR-045
- **Effort:** Medium
- **Risk:** Low
- **Timing:** Next
- **Acceptance:** LocalSheet removal can undo once
- **Order:** 16
- **Dependencies:** none
- **Problem:** Mage has undo; newer sheets often don’t
- **Proposed work:** toast/undo in shared lists
- **Files:** `LocalSheet.tsx`; list components
- **Tests:** integration on one WoD sheet

### BL-17 — Persist LocalSheet section expansion

- **Findings:** AR-046
- **Effort:** Small
- **Timing:** Next
- **Order:** 17
- **Files:** `LocalSheet.tsx`; section preference hook
- **Acceptance:** Collapse survives reload
- **Dependencies:** none
- **Problem:** Mage remembers sections; LocalSheet does not
- **Proposed work:** reuse Mage preference hook
- **Risk:** Low
- **Tests:** existing section-preference unit tests extended

### BL-19 — Skip link and touch-target audit

- **Findings:** AR-047
- **Effort:** Small
- **Timing:** Next
- **Order:** 19
- **Files:** shell layout; sample dense editors
- **Acceptance:** Skip link visible on focus; no new 320px overflow
- **Dependencies:** none
- **Problem:** Keyboard/chrome cost; possible small hit targets
- **Proposed work:** skip link + spot-check
- **Risk:** Low
- **Tests:** optional a11y e2e

### BL-22 — CSP/HSTS

- **Findings:** AR-037, AR-038
- **Effort:** Small
- **Risk:** Medium (custom backgrounds)
- **Timing:** Next
- **Order:** 22
- **Files:** `index.html` or nginx; appearance background URL policy
- **Acceptance:** App loads; backgrounds still work; no character POSTs
- **Dependencies:** verify background URL schemes
- **Problem:** XSS defense-in-depth missing on character origin
- **Proposed work:** conservative CSP after audit
- **Tests:** e2e appearance spec

### BL-23 — Lazy-load editors

- **Findings:** AR-040, AR-041
- **Effort:** Medium
- **Risk:** Medium
- **Timing:** Later — **measure `npm run build` first**
- **Order:** 23
- **Files:** `registry.ts` or `CharacterPage.tsx`
- **Acceptance:** Library loads without parsing Torchbearer catalog; Mage open still works
- **Dependencies:** build stats
- **Problem:** All games in one graph
- **Proposed work:** `React.lazy` per editor
- **Tests:** e2e per game still pass

### BL-24 — Collapse Mage folder cycle

- **Findings:** AR-007
- **Effort:** Large
- **Risk:** Medium
- **Timing:** Later
- **Order:** 24
- **Files:** `src/systems/mage-m20/**`; `src/games/mage20/**`
- **Acceptance:** Legacy `mage-m20` files still import; envelope remains `mage20`
- **Dependencies:** BL-01
- **Problem:** Circular Mage trees
- **Proposed work:** incremental move, keep adapter
- **Tests:** full Mage suite

Module checksum lazy verify (AR-041): Later, with BL-23.

---

## 6. Recommendations that should not be pursued

### BL-90 — Hosted registry production expansion

- **Problem claimed:** Need a public module store
- **Findings:** AR-008 over-engineering notes
- **Proposed work:** Do not add roles, deploy automation, or publisher UX now
- **Files:** `registry/`, `deploy/`
- **Dependencies:** Explicit user authorization (AGENTS.md)
- **Effort:** Large
- **Risk:** High distraction
- **Acceptance:** n/a
- **Tests:** n/a
- **Order:** — 
- **Reason:** Character product gaps are higher value. Keep existing local smoke as-is.

### BL-91 — Production Mage/Exalted as declarative modules

- **Reason:** docs/06 already blocks conversion when development records exist; dual stacks would last a long time.
- **Findings:** AR-008, AR-011
- **Effort:** Large
- **Risk:** High
- **Timing:** Do not pursue now

### BL-92 — Rename IndexedDB to `arcane-record`

- **Reason:** Would look like a “consistency fix” and wipe or strand every existing character.
- **Effort:** Medium
- **Risk:** Critical
- **Timing:** Do not pursue

### BL-93 — React Router, Redux, cloud character sync, Kubernetes, microservices

- **Reason:** Wrong scale. Sync is an AGENTS.md prohibition.
- **Timing:** Do not pursue

### BL-94 — Overlay/homebrew runtime UI

- **Reason:** Resolver rejects overlays. Schema-ahead-of-runtime.
- **Findings:** AR-011
- **Timing:** Do not pursue now

### BL-95 — Visual identity redesign

- **Reason:** Parchment/charcoal is specified. UX value is workflow, not a new look.
- **Timing:** Do not pursue

---

## Cross-persona synthesis (disagreements resolved)

| Tension | Resolution |
|---|---|
| Architect: freeze module platform vs module-builder docs that assume phases | **Freeze expansion**; keep code. Do not delete `/modules`. |
| Security: CSP now vs UX custom backgrounds | **Audit URLs first** (BL-22 Next, not Now). |
| Performance: lazy-load now vs YAGNI | **Measure build** before BL-23. |
| Product: hide incomplete games vs keep creating them | **Label, don’t hide** (BL-09). |
| Config: rename `arcane-ledger` for consistency | **Never rename the DB** (BL-92). |
| Mage Zustand vs LocalSheet React state | **Persistence first**, store later (BL-01). |

**Root cause of many symptoms:** the app grew from a Mage sheet to a multi-game workbench and a module platform without unifying the **save/import/link** contract or the **docs**. Fix the contract and the docs; do not add a new platform layer.
