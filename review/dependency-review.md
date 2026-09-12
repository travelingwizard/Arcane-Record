# Dependency review

Static review of `package.json` vs imports. `npm ls` / `depcheck` were **not** run (no install).

---

## Direct runtime dependencies

| Package | Role | Used? | Fit for this app |
|---|---|---|---|
| `react` / `react-dom` | UI | Yes | Appropriate |
| `dexie` | IndexedDB | Yes (`mage-database.ts`, repositories) | Appropriate |
| `zod` | Boundary validation | Yes | Appropriate |
| `zustand` | Mage editor store only | Yes (`src/state/editor-store.ts`) | Appropriate **until** Mage uses LocalSheet; then re-evaluate removal |
| `js-yaml` | JSON/YAML interchange | Yes | Appropriate; tighten usage [AR-035] |
| `pdf-lib` | Burning Wheel PDF | Yes (`src/games/burning-wheel/pdf.ts`) | Appropriate; do not generalize to every game unless asked |

No HTTP client library, no router package, no UI kit, no analytics, no auth SDK in the SPA. That is the right weight.

---

## Direct devDependencies

ESLint 9 flat config, typescript-eslint, react-hooks, react-refresh, Prettier, TypeScript ~5.8, Vite 7, Vitest 3, Playwright, Testing Library, jsdom, fake-indexeddb, `@types/*`.

All appear referenced by config or tests.

**Overlap (expected):** Vite + Vitest both load `@vitejs/plugin-react`. Optional `mergeConfig`; not required.

---

## Findings

### [AR-015] `esbuild` used but not declared

See [configuration-audit.md](configuration-audit.md). `scripts/build-registry.mjs` imports `esbuild`; it is only a transitive dependency of Vite.

- **Category:** Configuration
- **Severity:** Medium
- **Confidence:** Confirmed
- **Recommendation:** Add `esbuild` to `devDependencies` at a pinned range you intend to run.
- **Scope:** Next
- **Cost:** Small

### [AR-057] Zustand may become unused after Mage persistence unification

- **Category:** Architecture
- **Severity:** Informational
- **Confidence:** Strong evidence
- **Location:** `package.json`; `src/state/editor-store.ts`
- **Current behavior:** Zustand is justified by the Mage mega-store (ratings, undo buffers, save status).
- **Problem:** None today. After a LocalSheet migration, keeping Zustand for one store is still fine; adding a second store library would not be.
- **Recommendation:** Do not add Redux/Jotai/TanStack Query. Revisit removing Zustand only after Mage field updates live in React state.
- **Scope:** Later
- **Cost:** Large if forced early — **do not pursue now**

### No unused direct dependencies found (static)

Import scan of `src/`, `registry/`, `scripts/`, `tests/` configs matched every `dependencies` and `devDependencies` entry except the undeclared `esbuild` (used, missing).

**Needs verification after install:** `npx depcheck` or `npm ls --depth=0`.

---

## Lockfile

`package-lock.json` v3 is present and should remain the install source of truth. Caret ranges in `package.json` vs resolved versions (React 19.2.x, Vite 7.3.x, Zod 4.4.x) are normal. Do not delete the lockfile.

## Supply chain notes

- Few direct deps → small audit surface.
- Highest sensitivity: `js-yaml`, `dexie`, `zod`, React.
- Registry JWT crypto is in `registry/` (Node). Keep that code’s dependencies explicit when you declare `esbuild`.

## Do not add

- React Router
- Redux
- Axios (fetch is enough)
- IndexedDB wrappers besides Dexie
- CSS frameworks that fight the parchment design
- Telemetry SDKs
- Module federations / microfrontends
