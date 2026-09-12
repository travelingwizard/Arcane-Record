# Architecture review

Persona: software architect. Scope: local-first, primarily single-user. Confirmed findings cite files. Dual-interpreter coexistence is documented; that does not make it the simplest long-term design.

---

## Boundaries that work

Arcane Record owns library, routes, IndexedDB, interchange envelope, settings, and recovery. A game owns fields, catalogs, migration, and its editor. That split is the right size.

- `GameSystemDefinition<T>` — `src/games/game-system.ts`
- `gameSystemRegistry` — `src/games/registry.ts` (19 registrations)
- `StoredCharacter` — `src/storage/stored-character.ts`
- `resolveCharacter` — `src/games/resolve-character.ts`
- Shared chrome — `SheetEditorShell`, section nav, appearance

Dexie is not used from UI components in the production path; repositories sit in between. AGENTS.md’s persistence rule is largely followed.

---

## Application map

```
Browser SPA (Vite/React)
├── History router (src/app/routing.ts)
├── GameSystemRegistry  → code editors (production create/open)
├── ModuleRegistry      → ModuleCharacterEditor when moduleRef is set
└── Dexie "arcane-ledger"
    ├── characters
    └── modulePackages / installations / drafts / locks

Optional Node registry  ←→  RegistryClient (modules only)
```

Routes: `/`, `/create`, `/create/:systemId`, `/create-module/...`, `/characters/:id`, `/settings`, `/modules`, `/module-builder`.

---

## Under-engineering

- No React error boundary. A render throw on one sheet takes down the SPA.
- Custom History router is small and adequate; it has no scroll restoration or nested routes. That is fine at this scale.
- Mage save path lacks the concurrency controls already written for `useLocalSheet`.
- No route-level code splitting: every game ships in one graph (**inferred** from no `React.lazy` in `src/`).

## Over-engineering

- Hosted registry with JWT roles, WebAuthn/hwk MFA for admin, rate limits, audit, staging/approve/deprecate — for an undeployed, single-operator catalog.
- Module builder, expression/action/dice/creation-flow engines, homebrew overlay schema — while overlays are rejected at resolve time.
- Bundled declarative Mage (phase 2) and Exalted (phase 3) packages maintained next to full TypeScript editors.
- Two Mage persistence APIs (`CharacterRepository` vs `StoredCharacterRepository`).

The character envelope is **not** over-engineered.

---

## Findings

### [AR-006] Three editor and autosave runtimes

- **Category:** Architecture
- **Severity:** High
- **Confidence:** Confirmed
- **Location:** `src/features/character-editor/use-autosave.ts`; `src/state/editor-store.ts`; `src/games/mage20/Mage20Editor.tsx`; `src/games/shared/LocalSheet.tsx`; Exalted/BW/Torchbearer/Earthdawn editors
- **Current behavior:** Mage uses Zustand + `useAutosave` (550ms, `repository.save`, no queue). Newer WoD/Mist/Mouse Guard/Shadowrun/Curseborne use `useLocalSheet` (400ms, save queue, `saveIfUnchanged`, `beforeunload`). Several deep games still have custom loops.
- **Problem:** The same product promise (“saved in this browser”) is implemented three ways. Bugs and improvements cannot be shared. Mage, the complete first module, has the weakest contract.
- **Evidence:** `useAutosave` calls `repository.save(character)` with no `saveIfUnchanged`. `useLocalSheet` queues promises and compares `JSON.stringify(current.data)`. Debounce 550 vs 400.
- **Recommendation:** Extract one `useStoredCharacterAutosave` (or migrate Mage onto `useLocalSheet`). One debounce, one CAS, one unload guard.
- **Alternative:** Keep Mage Zustand for field updates but route persistence through the LocalSheet save helper only.
- **Benefit:** Data integrity parity; less editor code.
- **Cost:** Medium
- **Risk:** Medium — Mage store is large; migrate persistence first, UI later.
- **Scope:** Now
- **Verification:** Overlapping-save unit test; tab-close integration; Mage e2e refresh still persists.

### [AR-007] mage20 / mage-m20 circular split

- **Category:** Architecture
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** `src/games/mage20/*`; `src/systems/mage-m20/*`; `src/games/mage20/character-adapter.ts`
- **Current behavior:** Envelope and registry ID is `mage20`. Inner character `systemId` is `mage-m20`. `systems/mage-m20` imports Mage development/supplements from `games/mage20` and vice versa.
- **Problem:** Two IDs and a cycle make Mage the hardest module to reason about. New contributors must learn both trees.
- **Evidence:** Adapter remaps on hydrate/save. `character-schema.ts` / `create-character.ts` import from `games/mage20/development`.
- **Recommendation:** Keep `mage-m20` only as a legacy-file detector. Collapse inner types under `src/games/mage20/` when persistence is unified. Do not rename IndexedDB.
- **Alternative:** Leave the split documented forever if Mage changes are rare.
- **Benefit:** One Mage package.
- **Cost:** Large if done as a big-bang; Medium if adapter stays and folders merge incrementally
- **Risk:** Medium — import/export of legacy files
- **Scope:** Next
- **Verification:** Legacy `mage-m20` file import; schema 13 round-trip; Mage e2e.

### [AR-008] Dual interpreters without a shared type

- **Category:** Architecture
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** `src/games/resolve-character.ts`; `src/app/CharacterPage.tsx`; `src/app/App.tsx`; `src/modules/registry/module-registry.ts`; bundled modules under `src/games/mage20/module/` and `src/games/exalted1e/module/`
- **Current behavior:** `moduleRef` present → ModuleRegistry; else GameSystemRegistry. App injects bundled Mage/Exalted packages on boot. Creation for those games still uses code editors. Docs name a `CharacterInterpreter` that does not exist as a type.
- **Problem:** Every shared flow (create, open, import, library summary) branches. Two Mage/Exalted implementations to keep in sync. For a single developer, the second runtime is expensive until a parity gate actually ships.
- **Evidence:** `resolveCharacter` if/else; `App` loads `getBundledMage20ModuleRecords` / `getBundledExalted1eModuleRecords`; overlays rejected as `deferred-overlay-runtime`.
- **Recommendation:** Treat `GameSystemRegistry` as production SoT. Keep ModuleRegistry for installed third-party/local packages and experiments. Do not convert production Mage/Exalted create onto modules until editors share one autosave and Mage module conversion is lossless (docs/06 already blocks conversion when new records exist).
- **Alternative:** Accelerate module parity and delete code editors — Large, high risk, not justified now.
- **Benefit:** Clearer mental model; less dual maintenance.
- **Cost:** Small (policy) to Medium (stop expanding bundled modules)
- **Risk:** Low if framed as coexistence, not deletion
- **Scope:** Now (policy); Later (delete unused module path)
- **Verification:** Creating Mage/Exalted still opens code editors; module-backed records still recover if package missing.

### [AR-009] No application error boundary

- **Category:** Architecture
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** `src/app/App.tsx`; `src/main.tsx`; no `ErrorBoundary` / `componentDidCatch` in repo
- **Current behavior:** Route-level empty/not-found/unavailable UI exists. A thrown render error unmounts the tree.
- **Problem:** One bad character or catalog edge can make the library unreachable until reload, even though IndexedDB is intact.
- **Evidence:** Grep found no ErrorBoundary. Recovery UI is only for `resolveCharacter` statuses.
- **Recommendation:** A single React error boundary around the character page (and optionally App) with “export raw JSON / return to library”.
- **Alternative:** `window.onerror` toast only — weaker.
- **Benefit:** Failure isolation appropriate to local-first.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** Integration test that throws in an editor child and asserts library navigation still works.

### [AR-010] Dead Mage CharacterRepository singleton

- **Category:** Architecture
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `src/storage/repository-instance.ts`; `src/storage/dexie-character-repository.ts`; `src/app/App.tsx`
- **Current behavior:** App wires `storedCharacterRepository`. `DexieCharacterRepository.list()` maps every row through `storedCharacterToMage`, which throws for non-Mage systems. The singleton is unused.
- **Problem:** A dangerous Mage-only list API sits on the shared DB. Someone wiring it to a multi-game screen would break the library.
- **Evidence:** `App` default prop is `storedCharacterRepository`. No app-boundary importers of `characterRepository`.
- **Recommendation:** Stop exporting the singleton; keep the class only behind the Mage editor adapter if still needed.
- **Alternative:** Delete `DexieCharacterRepository` after Mage uses `StoredCharacter` directly.
- **Benefit:** Removes a footgun.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** Typecheck; Mage editor still saves.

### [AR-011] Overlay and homebrew runtime is schema-ahead of implementation

- **Category:** Architecture
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `src/storage/stored-character.ts` (`enabledOverlayRefs`, `homebrew`); `src/games/resolve-character.ts`; `src/modules/homebrew/`
- **Current behavior:** Envelope allows overlay refs; resolver rejects overlays. Homebrew fields exist on format v2 files.
- **Problem:** Data model invites features the runtime forbids. Importers may think overlays work.
- **Evidence:** Overlay path errors with deferred diagnostic; schema still accepts the field.
- **Recommendation:** Keep the field for forward compatibility but document it as non-functional; reject on import with a clear message (already unavailable). Do not build overlay UI now.
- **Alternative:** Strip overlay refs on import.
- **Benefit:** Honest product surface.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Later / Do not pursue overlay UI now
- **Verification:** Import with `enabledOverlayRefs` still recoverable/unavailable, never silently applied.

### [AR-012] Hand-rolled router is adequate

- **Category:** Architecture
- **Severity:** Informational
- **Confidence:** Confirmed
- **Location:** `src/app/routing.ts`
- **Current behavior:** `parseRoute` + `history.pushState` + synthetic `popstate`. Production nginx `try_files` fallback required.
- **Problem:** None at current scale. Adding React Router would be fashion, not need.
- **Evidence:** Small route union; tests exist under unit routing coverage (see testing review).
- **Recommendation:** Keep. Document SPA fallback as a deploy invariant (already in docs/16).
- **Alternative:** React Router — extra dependency, no user benefit.
- **Benefit:** Simplicity.
- **Cost:** None
- **Risk:** None
- **Scope:** Do not pursue replacement
- **Verification:** Refresh on `/characters/:id` in production hosting.

---

## Coupling and duplication

| Concern | Assessment |
|---|---|
| Envelope vs game data | Good |
| Shared nav vs game sections | Good, with duplicate Mage vs sheet hooks |
| `components/character/*` | Mage-specific despite shared-looking names |
| Catalogs in `systems/mage-m20/reference` | Appropriate isolation |
| Module rules engines vs code `rules.ts` per game | Duplicated concepts; only some games use engines |
| City of Mist `prepareExport` / `getDeleteWarning` | Good extension points; underused by other linked games |

## Circular dependencies

Mage `games/mage20` ↔ `systems/mage-m20` is the only significant cycle found. Registry code imports shared module schema; that direction is one-way.

## Persistence and sync

There is no multi-device sync (correct). Multi-tab is handled only on the LocalSheet path. See data review [AR-026].

## Schema versioning

Per-game `currentSchemaVersion` plus envelope `formatVersion` 1|2 plus Dexie 1–5, 10, 11 is coherent. Skipping Dexie 6–9 is intentional and should stay documented.

## Error recovery

Unavailable/invalid records + raw export is excellent for a local-first app. Missing: render error boundary [AR-009].

## Stack fitness

React + Vite + Dexie + Zod remains the right choice. Zustand is only justified while Mage’s editor store exists; do not add Redux/TanStack Query. Do not add a backend for characters.

---

## Proposed architectural changes (summary)

| Change | Problem | Why current is insufficient | Benefit | Migration | Risk | When |
|---|---|---|---|---|---|---|
| Shared autosave | Mage data loss | Mage omits CAS/queue/unload | Integrity | Adapter then delete `useAutosave` | Medium | Now |
| Production = GameSystemRegistry | Dual maintenance | Two Mage/Exalted stacks | Focus | Policy, not a rewrite | Low | Now |
| Error boundary | White screen | Route UI does not catch throws | Recovery | One component | Low | Now |
| Remove unused Mage repo export | Footgun | Dead code on shared DB | Clarity | Delete export | Low | Now |
| Merge mage-m20 folder | Cycle | Two IDs, two trees | Understandability | Incremental | Medium | Next |
| Hosted registry production | Publishing | Not a player need | None yet | — | High distraction | Later / not now |
