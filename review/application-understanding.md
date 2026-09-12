# Application understanding

**Review date:** 2026-09-08  
**Repository:** `travelingwizard/Arcane-Record` at `/Users/mward/Documents/Cursor/Arcane-Record`  
**HEAD:** `d748ba0` (`Add Mouse Guard 2e character and patrol module`)  
**Git status:** clean `main`, in sync with `origin/main`. No uncommitted user changes were present; none were modified.

This document records what the application is and how it works **before** judging the implementation. Statements taken from docs are unmarked. Statements inferred from code are labeled **(inferred)**.

---

## What problem it appears to solve

Arcane Record is a **local-first, multi-game tabletop character-record application**. It lets a single player create, edit, save, search, duplicate, export, and import character sheets for several published RPGs, in the current browser profile, without an account or cloud backup.

The original product center is a Mage: The Ascension 20th Anniversary Edition sheet that mimics a vintage parchment character record. The app has since grown into a **game-neutral library** plus **nineteen registered sheet systems** (some complete, some foundations, some labeled previews).

A second, overlapping product is a **declarative module runtime and hosted Module Registry**: packages that describe games, catalogs, and sheets so they can theoretically be installed without shipping a new TypeScript editor. That path is implemented and locally usable, but production creation for Mage, Exalted, Burning Wheel, Torchbearer, and the newer games still goes through code-owned editors.

---

## Who uses it

**Intended user (documented):** one player / Storyteller using their own browser.

**Not intended:** multi-user accounts, table-wide sync, enterprise administration, or analytics.

**Secondary users (inferred from `registry/` and `docs/module-builder/`):** the same developer (or a future publisher) staging, reviewing, and installing game modules. AGENTS.md authorizes a hosted registry that stores publisher identities and packages, never character data.

---

## Most important user workflows

1. **Open the library** (`/`) — list locally stored characters, search, filter by game, import a file, create a new character.
2. **Choose a game** (`/create`, `/create/:systemId`) — pick a system and, where required, a sheet variant (Solar vs Dragon-Blooded, Burning Wheel stock, Vampire clan/type, City of Mist Character vs Crew, etc.).
3. **Edit a sheet** (`/characters/:id`) — fill identity and traits; use the desktop left rail or mobile Sections sheet; autosave to IndexedDB.
4. **Reload and continue** — the primary success criterion: values survive a refresh in the same browser profile.
5. **Export / import** — JSON or YAML envelope; Burning Wheel also `.char` and a locally generated PDF.
6. **Settings** (`/settings`) — appearance (theme, overlay, motion, custom background).
7. **Module library / builder** (`/modules`, `/module-builder`) — install or author declarative modules. **(inferred)** These are real routes but are not the charter’s primary player workflow.

Honest persistence language is a product requirement: success reads **“Saved in this browser”**. The UI must never imply online backup.

---

## Technology stack

| Layer | Choice |
|---|---|
| UI | React 19, custom History API router (not React Router) |
| Build | Vite 7, TypeScript 5.8, ESLint 9, Prettier 3 |
| State | Zustand (Mage editor only); React `useState` elsewhere (`useLocalSheet`) |
| Validation | Zod 4 at import/save/schema boundaries |
| Persistence | Dexie 4 → IndexedDB database `arcane-ledger` |
| Interchange | JSON + `js-yaml`; Burning Wheel `pdf-lib` |
| Tests | Vitest + Testing Library + jsdom + `fake-indexeddb`; Playwright Chromium |
| Optional server | Node HTTP Module Registry (`registry/`), esbuild bundle, nginx deploy assets |

There is **no** authentication, accounts, or character-data API in the SPA.

---

## How it stores and retrieves data

**Character records** live in IndexedDB table `characters` as a game-neutral `StoredCharacter` envelope (`src/storage/stored-character.ts`):

- Shared: `id`, `systemId`, `systemVersion`, `name`, `createdAt`, `updatedAt`
- Opaque: `data` (game-owned payload)
- Optional: `moduleRef`, `homebrew` for module-backed records

UI components are required (AGENTS.md) not to touch Dexie. Persistence goes through `StoredCharacterRepository` (`DexieStoredCharacterRepository`). Mage still hydrates a legacy `MageCharacter` model via `mageToStoredCharacter` / `storedCharacterToMage`.

**Module packages** live in Dexie v11 tables: `modulePackages`, `moduleInstallations`, `moduleDrafts`, `moduleLocks`. Uninstalling a module leaves character rows intact; the character page shows a recoverable unavailable record.

**Preferences** live in `localStorage`, not in character files:

- `arcane-ledger:*` — Mage section expansion, sphere sort, wheel toggle, temp Willpower dots
- `arcane-record:*` — appearance, global shell, per-game source defaults

**Transient:** active URL section, save status, Mage undo buffers.

---

## Local / browser / server / hybrid

**Primary mode:** browser-only, local-first. Fully usable offline with cached/bundled modules.

**Hybrid (optional):** if `VITE_ARCANE_REGISTRY_URL` is set at build time, `RegistryClient` GETs a public module catalog and downloads packages. Character data is not included in those requests (`credentials: 'omit'`).

**Deployed SPA (from `deploy/nginx/character.travelingwizard.net.conf`):** static files at `character.travelingwizard.net` with SPA fallback to `index.html`. Path still uses the legacy name `/opt/arcane-ledger/current`.

**Registry server:** implemented, bound to `127.0.0.1:4180` by default. Docs and AGENTS.md say public publication still needs explicit authorization.

---

## Import, export, validation, migration

**Export envelope** (`src/features/import-export/character-files.ts`):

- `format: "arcane-record-character"`
- `formatVersion: 1` — code-registry character (`systemId` + opaque `character`)
- `formatVersion: 2` — module character (`systemId: "arcane-module"` + `moduleRef`)

Catalogs, citations, and UI preferences are excluded. Build/Play layout order is included when it is character-owned.

**Import:** always a **copy** with a new UUID, new timestamps, and an `(Imported)` name suffix. Never silently overwrite. Legacy Mage files with `systemId === "mage-m20"` are detected and migrated. Burning Wheel may import Charred Black `.char` via `importLegacyCharacter`.

**Validation:** Zod at create/save/import for the envelope; per-game `characterSchema.parse` after `migrateCharacter`. Invalid IndexedDB rows are wrapped, not deleted (Dexie v10 `preserveAsEnvelope`).

**Mage schema** is at version **13** with a long migration chain in `src/systems/mage-m20/character-schema.ts`. Other games have their own `currentSchemaVersion` (Exalted 7, Torchbearer 5, many newer games 1).

---

## Features: complete, incomplete, duplicated, abandoned

### Complete (or deep) — confirmed from editors, catalogs, and tests

- Game-neutral library (search, filter, duplicate, export, confirmed delete)
- Mage 20 editor, catalogs, Combat/Do, Magick, Equipment, guided creator, XP ledger
- Exalted 1e Solar + Dragon-Blooded (large editor; some later pages historically deferred)
- Burning Wheel Gold + Codex burner, play sheet, `.char`, PDF
- Torchbearer 2e two-page adventurer record + creator
- Shared chrome: section rail, mobile Sections sheet, appearance, save badge copy

### Foundation / playable but thinner — **inferred** from schema version 1, editor size, and descriptions

- Earthdawn 4e, Shadowrun 1e, City of Mist (+ Crew), Legend in the Mist (+ Fellowship)
- Changeling 20, Vampire 20, Vampire Dark Ages 20, Werewolf 20, Wraith 20 (+ Shadow)
- Mouse Guard 2e (+ Patrol)

### Explicitly incomplete / preview

- Curseborne: definition text says “Editable sheet preview… Guided creation is in development.”
- Mage/Exalted **declarative module** path: bundled packages exist; production create still uses code editors. Overlay runtime is rejected (`deferred-overlay-runtime`).
- Hosted registry: implemented, not the player’s daily path

### Duplicated

- Two registries (`GameSystemRegistry` and `ModuleRegistry`)
- Two Mage identities (`mage20` envelope vs `mage-m20` inner model)
- Three autosave/editor patterns (Mage Zustand, `useLocalSheet`, custom loops in Exalted/BW/Torchbearer/Earthdawn)
- Parallel section-navigation hooks (`useCharacterSectionNavigation` vs `useSheetSectionNavigation`)
- Mage UI under `src/components/character/` plus shared `LocalSheet`

### Abandoned or stale

- `characterRepository` / `DexieCharacterRepository` singleton — exported, unused by `App`
- IndexedDB versions 6–9 skipped (historical)
- Charter/README/docs/16 list far fewer games than `src/games/registry.ts`
- `docs/00-project-charter.md` non-goals forbid a backend; AGENTS.md later authorizes the registry

---

## Likely future requirements

From AGENTS.md, module-builder docs, and recent git history:

1. More World of Darkness / Mist / Burning Wheel-family sheets (the last several commits add games, not infrastructure).
2. Eventual Mage/Exalted parity on the declarative module runtime (phased, gated).
3. Optional hosted module catalog — if the user explicitly deploys it.
4. Continued local-only character data; no cloud character sync.

**(inferred)** The realistic growth path is “more games on the existing envelope + `LocalSheet`,” not a distributed platform.

---

## Documented purpose vs actual implementation

| Documented claim | Actual code |
|---|---|
| README: Mage complete; Exalted, BW, Torchbearer called out | **19** registered systems including City of Mist, Curseborne, Earthdawn, Legend, Shadowrun, five WoD20 lines, Mouse Guard |
| Charter non-goal: no backend | `registry/server.ts` + deploy nginx + JWT auth |
| Charter: no empty future-game placeholders | Curseborne is a labeled preview; several foundations are thinner than Mage |
| docs/16 registered systems | Omits most games added after Shadowrun |
| docs/07 testing plan | Mage-centric; 33 e2e specs now exist for many newer games |
| AGENTS.md: Mage 20 complete first module; Exalted variants | True, but no longer the whole product |
| Dual interpreter coexistence | Implemented; Mage/Exalted still code-owned for creation |

**Conflict:** the **documented** product is a Mage-first local sheet with a few additional modules. The **implemented** product is a rapidly expanding multi-game workbench **plus** a module-publishing platform that the charter still treats as out of scope.

---

## Repository structure (inspected)

```
src/app/            History router, Character/Create/Settings pages
src/games/          16 game folders + shared/ + registry.ts (19 system IDs)
src/systems/mage-m20/  Legacy Mage domain, catalogs, schema v1–13
src/modules/        Declarative module runtime, rules engines, registry client
src/storage/        Dexie DB, repositories, envelope schema
src/state/          Mage Zustand editor store
src/features/       Library, Mage editor chrome, import/export, settings, module UI
src/components/     Shared chrome + Mage-first sheet widgets
registry/           Hosted Module Registry (Node)
scripts/            Catalog generators, BW packaging, registry build/CLI
tests/              unit (63), integration (21), e2e (33), registry (1)
docs/               Charter, PRD, architecture, per-game, module-builder
deploy/             nginx for character SPA, registry, and unrelated HEMA host
```

~347 files under `src/`, ~80k lines of TypeScript/TSX. Largest units: Torchbearer catalog (3489), Torchbearer editor (2155), Burning Wheel editor (1895), Mage `editor-store` (1643).

---

## Deployment model

- **Local:** `npm run dev` → Vite, documented as `http://localhost:5173/` (not pinned in `vite.config.ts`).
- **Production SPA:** static `vite build` output behind nginx SPA fallback.
- **Registry (optional):** `npm run build:registry` then `registry:start`; systemd/nginx assets exist under `deploy/`.

No CI configuration (`.github/` absent).

---

## Persistence language and safety posture (as implemented)

- Save badge: “Saved in this browser” / “Unsaved changes” / “Saving locally…” / “Local save failed” (`SaveStatusBadge.tsx`).
- Recoverable unavailable/invalid records can still export raw JSON.
- Import cannot overwrite the open record’s ID.
- Character data is not sent to the registry client.

These match the product’s stated trust model.
