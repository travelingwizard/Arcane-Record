# Recommended architecture

This is the synthesis recommendation for a **local-first, single-user, one-developer** application. It is not an enterprise target state.

---

## Should the existing stack be retained?

**Yes.** React 19, Vite, TypeScript (strict), Dexie/IndexedDB, Zod, and a tiny custom router are the right tools. They match the product: a browser-local character record with file import/export.

Zustand should stay **only** while the Mage editor store exists. Do not replace the stack.

The hosted Node registry is optional infrastructure. It should remain **optional and undeployed** until you explicitly want publishing. It is not required for the character app to succeed.

---

## Patterns to preserve

1. **Opaque `StoredCharacter` envelope** with game-owned `data`.
2. **`GameSystemDefinition` registry** — add games as adapters, not as forks of the shell.
3. **Zod at import/save/hydrate**, fail closed in the editor, preserve raw rows when migration fails.
4. **Catalogs outside character files**; unknown definition IDs remain visible.
5. **Import as copy** (new UUID, `(Imported)` suffix).
6. **Shared sheet chrome** (rail, mobile Sections, pencil order, appearance, save copy).
7. **`useLocalSheet` save contract** — queue, `saveIfUnchanged`, `beforeunload`.
8. **Recoverable unavailable records** with raw JSON export.
9. **No character telemetry / no character network**.
10. **Frozen IndexedDB name `arcane-ledger`.**

---

## Patterns to replace (incrementally)

| Replace | With | Why |
|---|---|---|
| Mage `useAutosave` + unqueued `put` | Shared LocalSheet-style helper | Flagship data integrity |
| Parallel section-nav hooks (when cheap) | One hook used by Mage and LocalSheet | Duplication |
| Production reliance on bundled Mage/Exalted **modules** | Code editors as SoT | Dual maintenance |
| Overlay/homebrew runtime work | Leave schema; no UI | Runtime rejects overlays |
| Ad hoc linked UUIDs | `prepareExport` / import bundle / delete warning | Portability |
| Character YAML `load()` | `{ json: true }` + size cap | Untrusted files |

---

## Is the application more complicated than necessary?

**The player app (envelope + registry + sheets) is reasonably complicated** for 19 games. Shared chrome and opaque data are earning their keep.

**The module platform (builder, rules DSL, hosted registry, bundled phase-2/3 modules) is more complicated than the current user need.** It is a second product. Keeping the code is fine; expanding it is not, until the sheet product’s save/import gaps are closed.

---

## Coupling

Too tightly coupled:

- `games/mage20` ↔ `systems/mage-m20`
- Mage UI living in `src/components/character/` used as if shared
- `App` boot knowing bundled Mage/Exalted module records

Appropriately coupled:

- Games → `GameSystemDefinition`
- Repository → Dexie
- Appearance → localStorage

---

## Source of truth

| Concern | Should be SoT |
|---|---|
| Which games exist | `src/games/registry.ts` (document from this file) |
| Character bytes | IndexedDB `characters` via `StoredCharacterRepository` |
| Game fields | That game’s Zod schema + `migrateCharacter` |
| View prefs | localStorage, never character files |
| Production Mage/Exalted editor | TypeScript `CharacterEditor`, not the bundled module, until a written parity gate |
| Installed third-party modules | ModuleRegistry + Dexie module tables |
| Hosted catalog | Registry server **if** deployed; otherwise unused |

---

## Persistence strategy

**Appropriate:** Dexie document store, one row per character, module tables beside it.

**Not appropriate:** Postgres, sync protocol, per-field stores.

**Fix:** one autosave implementation; linked-record export; do not rename the database.

---

## State management

- **Mage:** Zustand mega-store — understandable historically; migrate persistence first.
- **Everyone on LocalSheet:** React state + ref queue — correct for this scale.
- **Do not** introduce a global client store for the library list beyond React state.

---

## What can be removed (carefully)

- Export of `characterRepository` singleton [AR-010]
- Overlay UI / overlay runtime work
- Expanding hosted-registry features
- HEMA nginx from this repo **if** it does not belong (decision)

Do **not** remove YAML export, Dexie, or game modules the create screen already offers.

---

## Target architecture over the next iterations

```
Library / Create / Settings / Character page
        │
        ▼
GameSystemRegistry (production games)
        │
        ▼
useStoredCharacterSheet  ← one autosave + sections + import/export buttons
        │
        ▼
StoredCharacterRepository → Dexie "arcane-ledger"

Side path (advanced):
ModuleRegistry → ModuleCharacterEditor (installed packages only)
Optional RegistryClient → hosted catalog (modules only)
```

Iteration 1: shared autosave + Mage on it + import hardening + docs.  
Iteration 2: linked export hooks + create-list status labels.  
Iteration 3: lazy-load editors if measured bundle requires it; Mage folder merge.  
Iteration 4: module parity **only** if you still want third-party modules as the way new games ship.

---

## Option 1 — Minimal change (recommended)

**Do:**

- Unify Mage (then remaining custom editors) onto the LocalSheet persistence contract.
- Harden character import (YAML json mode, size cap).
- Shared linked `prepareExport` / delete warnings.
- Documentation and configuration hygiene (ports, `.env` gitignore, README game list, docs/16).
- One React error boundary on the character page.
- Stop exporting the dead Mage repository.
- Policy: GameSystemRegistry is production; ModuleRegistry is advanced/optional.

**Do not:** rewrite routing, replace Dexie, deploy the registry, convert Mage to the declarative module as the daily editor, add CI until local checks run.

**Why this option:** It raises reliability of the actual player workflow without asking one developer to finish a module platform.

**Migration difficulty:** Medium (Mage store).  
**Risk:** Medium, contained if persistence is swapped behind the existing Zustand UI first.

---

## Option 2 — Larger improvement (only if justified later)

Rebuild every game as a declarative module and delete code editors. Finish overlay/homebrew runtime. Deploy the hosted registry. Lazy-load everything. Merge mage-m20 away in one move.

**Benefit:** One interpreter, third-party modules, theoretically less TS per game.

**Cost:** Large. Mage conversion is already blocked when new development records exist (`docs/06-import-export.md`). You would maintain two worlds until the last game converts.

**Risk:** High — regressions in Mage, BW, Exalted, the sheets people actually use.

**When:** After Option 1 is done **and** you have a concrete third-party module author other than yourself.

---

## Which option this review recommends

**Option 1.**

The envelope and game registry already describe a clear architecture. The pain is **inconsistent application** (Mage saves, linked files, docs, import YAML), not the absence of a platform. Option 2 solves a publishing problem you have not taken to production.
