# Executive summary

**Verdict:** Arcane Record **does accomplish its intended purpose** for a local-first, single-user character record. Mage 20, the library, IndexedDB persistence, and interchange are real and carefully designed. The architecture of the **character envelope + game registry** is appropriate for this scale.

The application is **less effective than it could be** because it is now two products sharing one repo: a player-facing multi-game sheet, and a module-publishing platform. The sheet product grew to 19 systems faster than documentation, editor consistency, and linked-record interchange. The module platform is **ahead of need**. Mage, the flagship sheet, still uses a weaker autosave path than newer games.

A live pass of https://character.travelingwizard.net/ confirmed the player loop works (create Mage, name it, autosave, reload, library card). Production nginx serves a **3.9 MB uncompressed JS bundle** with **no gzip/brotli**, and `/favicon.ico` / `/robots.txt` return the SPA HTML. The live create list includes games not in this git clone (`d748ba0`). See [live-site-review.md](live-site-review.md).

**Recommended direction:** keep the existing stack (React, Vite, Dexie, Zod, Zustand-for-Mage-until-migrated). Do **not** introduce enterprise infrastructure. Unify on `StoredCharacterRepository` + `useLocalSheet` (or an equivalent shared autosave). Freeze hosted-registry expansion. Treat additional games as `GameSystemDefinition`s until a module parity gate is actually required.

See [recommended-architecture.md](recommended-architecture.md) and [backlog.md](backlog.md).

---

## Overall assessment

| Question | Answer |
|---|---|
| Does it solve the stated problem? | **Yes**, for Mage and the deep modules (Exalted, Burning Wheel, Torchbearer). **Partially** for newer/foundation sheets. |
| Is the stack appropriate? | **Yes.** React + IndexedDB + Zod is the right size. |
| Is the design more complicated than necessary? | **Yes, in the module/runtime/registry layer.** The envelope + registry is not. |
| Biggest risk to players | Mage unsaved-close / overlapping saves; linked sheets that do not round-trip; YAML import weaker than module import. |
| Biggest risk to the maintainer | Dual interpreters + 19 editors + outdated docs. |
| Tests/build in this review | **Not run** locally (`node_modules/` absent). **Live site** was reviewed in the browser. |

---

## Five most important findings

1. **[AR-006] Three editor/autosave runtimes** — Mage Zustand (`useAutosave`, 550ms, no CAS, no `beforeunload`) vs `useLocalSheet` (400ms, queued `saveIfUnchanged`, unload guard) vs custom loops. The flagship game has the weakest save path.
2. **[AR-004 / AR-029] Linked records do not travel** — Wraith/Shadow, Mouse Guard/Patrol, Legend/Fellowship keep foreign UUIDs. City of Mist has a transfer snapshot; the others do not. Export → import (or delete) can strand companions.
3. **[AR-001] Documented product ≠ implemented product** — README/charter/docs/16 describe a Mage-first app with a few modules; `registry.ts` registers 19 systems plus a module builder and hosted registry.
4. **[AR-008] Dual interpreters without a shared boundary type** — `GameSystemRegistry` and `ModuleRegistry` coexist via if/else. Bundled Mage/Exalted modules duplicate production editors.
5. **[AR-058] Live JS is 3.9 MB with no compression** — `index-D7MqY36r.js` is served uncompressed; gzip of the same file is ~1.0 MB. First paint on a slow link is worse than it needs to be.

---

## Five highest-value recommendations

1. **Bring Mage (and remaining custom editors) onto the LocalSheet save contract** — queue, `saveIfUnchanged`, `beforeunload`. Highest player-data value, medium effort.
2. **Define a shared linked-record export hook** (generalize City of Mist `prepareExport`) for Wraith, Mouse Guard, Legend. High value for actual multi-sheet games.
3. **Update README, charter, and docs/16** to match registered systems and the authorized registry exception. Cheap, prevents wrong architectural decisions.
4. **Harden character import** to match module import (`json: true`, size/depth limits). Small, security-relevant.
5. **Enable gzip/brotli on the character nginx host, and stop SPA-fallback for favicon/robots.** Immediate production win; no app rewrite.

---

## Architecture and stack

**Retain:** React 19, Vite, TypeScript strict, Dexie/`arcane-ledger`, Zod, opaque `StoredCharacter`, `GameSystemRegistry`, shared section chrome, appearance prefs outside character files, recoverable invalid records, no character telemetry.

**Replace over time:** Mage Zustand mega-store and `mage-m20` circular split; parallel nav hooks; production dependence on declarative Mage/Exalted modules.

**Do not add:** Kubernetes, microservices, cloud character sync, complex SPA auth, extra state libraries.

**Recommended option:** minimal-change (see [recommended-architecture.md](recommended-architecture.md)). The larger “everything is a module” option is only justified after code-owned games share one editor runtime.

---

## Most significant configuration inconsistencies

| Issue | Why it matters |
|---|---|
| Playwright, Vite preview default, and HEMA nginx all use **port 4173**, with `reuseExistingServer: true` | E2E can attach to the wrong process |
| **`arcane-ledger` vs `arcane-record`** in DB name, localStorage, deploy path, theme id | Dual product identity; easy to “fix” the DB name and wipe data |
| JWT audience **`arcane-record-registry`** (env example) vs **`arcane-registry`** (tests/smoke) | Registry auth would fail in a real deploy |
| Docs Node **20** vs registry esbuild **`node22`**; `esbuild` not a direct dependency | Fragile registry builds |
| E2E runs **`vite dev`**, not production `build`/`preview` | SPA fallback and minified behavior untested |
| Module IDs `net.travelingwizard…` vs `org.travelingwizard…` | Two reverse-DNS policies |
| Live nginx: **no gzip/brotli**, no HSTS/CSP; `/favicon.ico` is `index.html` | ~4 MB first JS download; fake favicon |

Full matrix: [configuration-audit.md](configuration-audit.md).

---

## Tests and commands

`node_modules/` is not present in this clone. Per review rules, dependencies were **not** installed.

| Command | Result |
|---|---|
| `npm run format:check` | Not run — requires install |
| `npm run typecheck` | Not run |
| `npm run lint` | Not run |
| `npm run test` | Not run |
| `npm run test:e2e` | Not run |
| `npm run build` | Not run |
| `npm run typecheck:registry` / `test:registry-http` | Not run |
| Dependency analysis | Static only (imports vs `package.json`) |

**Assumption:** the lockfile and 120 test files suggest the project is set up to pass locally after `npm install`. That is unverified in this session.

---

## Documents created

All under `review/`:

- `application-understanding.md`
- `executive-summary.md`
- `architecture-review.md`
- `configuration-audit.md`
- `data-and-persistence-review.md`
- `security-and-privacy-review.md`
- `performance-and-reliability-review.md`
- `ui-ux-accessibility-review.md`
- `testing-and-maintainability-review.md`
- `dependency-review.md`
- `recommended-architecture.md`
- `backlog.md`
- `live-site-review.md`

---

## Questions requiring a decision

1. **Install dependencies and run the verification suite** in a follow-up? This review could not execute lint/typecheck/tests/build.
2. **Is the hosted Module Registry in scope for the next few months**, or should player-sheet quality (Mage save, linked export, remaining games) take all attention?
3. **Should foundation games stay in the create list as-is**, or should the library distinguish Complete / Foundation / Preview more strongly than Curseborne’s description string?
4. **HEMA nginx configs** in `deploy/` — keep in this repo or move? They share port 4173 with Playwright.
5. **Mage `mage-m20` inner ID** — keep forever for legacy files, or plan a one-time inner-schema rename after a backup/export reminder?

---

## Recommended first implementation phase

After approval, in this order:

1. Production nginx: gzip/brotli + real favicon/robots (BL-26, BL-27).
2. Mage autosave parity with `useLocalSheet` (queue + `saveIfUnchanged` + `beforeunload`) and a persistence test for overlapping saves.
2. Character YAML `load(..., { json: true })` plus a modest size cap; tests for rejected custom tags / oversized files.
3. Documentation pass: README game list, charter registry exception, docs/16 registered systems, docs/07 test inventory.
4. Shared `prepareExport` for linked companions (Wraith, Mouse Guard, Legend), modeled on City of Mist.
5. Pin Playwright to a dedicated port; document `arcane-ledger` as a frozen persistence name.

Do **not** start registry deployment, module-builder features, or a Mage rewrite onto the declarative runtime in this phase.
