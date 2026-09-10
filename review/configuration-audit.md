# Configuration audit

Persona: configuration and consistency auditor.

No `.env` files exist in the tree. Client registry URL is build-time `VITE_ARCANE_REGISTRY_URL` only. Registry server reads process env at runtime.

---

## Configuration matrix

| Setting or concern | Locations | Current values | Consistent? | Actual source of truth | Recommended source of truth | Action |
|---|---|---|---|---|---|---|
| npm package name | `package.json`, `package-lock.json` | `arcane-record` | Yes | `package.json` | `package.json` | Keep |
| package version / core version | `package.json`; `src/modules/registry/module-validation.ts` `ARCANE_CORE_VERSION`; module `minimumCoreVersion` | `0.1.0` duplicated | Partial | Two strings | One constant + release checklist | Document bump; optional shared export |
| lockfile | `package-lock.json` | lockfileVersion 3; caret ranges resolved (e.g. react 19.2.x, vite 7.3.x) | Yes | lockfile for installs | lockfile | Keep |
| TS project graph | `tsconfig.json` references | `tsconfig.app.json`, `tsconfig.node.json` only — **not** `tsconfig.registry.json` | No | `npm run typecheck` vs `typecheck:registry` | Document split **or** add reference | Document; optional add |
| App TS target | `tsconfig.app.json` | ES2022 + DOM | — | that file | that file | Keep |
| Node TS target | `tsconfig.node.json` | ES2023 | Different by design | that file | that file | Keep |
| Registry TS | `tsconfig.registry.json` | ES2023, **lib DOM**, `types: ["node","vite/client"]` | Odd for a Node server | that file | Node libs only | Clean types |
| Module resolution | all tsconfigs | `ESNext` + `Bundler` | Yes | each file | optional base config | Optional DRY |
| Path aliases | vite + tsconfig | **None**; relative imports | Yes (absent) | n/a | keep relative | Do not add unless pain is real |
| Vite server/preview | `vite.config.ts` | plugin-react only; ports default | Silent defaults | Vite 7 defaults | Pin if ports are a contract | Pin or document |
| Dev URL | README, `docs/08-local-development.md` | `http://localhost:5173/` | Matches Vite default | Vite default | `vite.config.ts` `server.port` + docs | Pin 5173 or keep “whatever Vite prints” |
| Playwright baseURL / webServer | `playwright.config.ts` | `http://127.0.0.1:4173`; `npm run dev -- --host 127.0.0.1 --port 4173`; `reuseExistingServer: true` | Internal yes | playwright config | Dedicated E2E port | Move off 4173 |
| Vite preview port | Vite default (unconfigured) | **4173** | Collides with Playwright + HEMA | Vite default | Distinct preview port | Pin away from 4173 |
| HEMA upstream | `deploy/nginx/hema.*.conf`, `deploy/README.md` | `127.0.0.1:4173` | HEMA-internal yes | nginx | HEMA-only | Do not share with Arcane E2E |
| Registry port | `registry/server.ts`; `deploy/registry/arcane-record-registry.env.example`; nginx | `4180` / `ARCANE_REGISTRY_PORT` | Yes | env default 4180 | env example | Keep |
| E2E vs production | playwright webServer vs README `build` | E2E uses **dev** server | No vs prod-like testing | playwright command | Document **or** `vite preview` | Document or change |
| IndexedDB name | `src/storage/mage-database.ts`; e2e; docs/16 | `'arcane-ledger'` | Yes | constructor default | **Never rename** | Document frozen name |
| Dexie schema version | `mage-database.ts` | 1–5, then 10, 11 (skip 6–9) | Intentional gap | that class | that class | Document skip |
| Class alias | `mage-database.ts` | `MageDatabase` exported also as `ArcaneRecordDatabase` | Dual names | file | one public name | Prefer one |
| localStorage legacy prefix | Mage sheet prefs, section prefs | `arcane-ledger:…` | Internal yes | hard-coded | frozen keys + constants module | Deduplicate literals |
| localStorage new prefix | appearance, global, sources | `arcane-record:…` | Split vs ledger | hard-coded | document dual prefixes | Document; don’t migrate keys |
| Duplicate Mage keys | `mage-sheet-preferences.ts` and `mage20-phase2-module.ts` | same `arcane-ledger:sphere-sort` string | Duplicated | two files | shared constants | Deduplicate |
| Appearance store version | appearance preferences module | `2` | Local | that file | that file | Keep |
| Character file format | `character-files.ts` | `arcane-record-character` v1\|v2 | Yes | that module | that module | Keep |
| Module envelope | `module-envelope.ts` | `arcane-record-module` v1 | Yes | schema | schema | Keep |
| Local archive | `local-archive.ts` | `arcane-record-local-archive` v1 | Yes | that file | that file | Keep |
| Module package IDs | `mage20/module/id-map.ts`; `exalted1e/module/id-map.ts` | `net.travelingwizard.arcane-record.mage20` vs `org.travelingwizard.arcane-record.exalted1e` | **No** (`net` vs `org`) | per-module constants | one reverse-DNS policy going forward | Don’t rename published IDs |
| Module versions | id-maps | Mage `0.2.0`; Exalted `1.0.0` | Independent | per module | per module | Keep |
| Game system IDs | definitions / adapter | envelope `mage20`; inner `mage-m20`; modules `arcane-module` | Intentional dual Mage IDs | adapters | document mapping | Keep |
| Per-game schemaVersion | `*_SCHEMA_VERSION` / definitions | Mage 13, Exalted 7, Torchbearer 5, BW 2, others 1 or 4 | Per-game SoT | each game | each game | Keep |
| Feature flags | codebase | none | n/a | none | none | Do not add a flag system |
| Logging / telemetry | app vs registry | no client logger; registry stdout | Minimal | ad hoc | keep no client telemetry | Keep |
| Browser targets | no browserslist; Vite `build.target` unset; TS ES2022; eslint ecmaVersion 2022 | implicit | Soft yes | Vite + tsconfig | pin only if a support matrix exists | Optional |
| ESLint ignore | `eslint.config.js` | dist, coverage, playwright-report, test-results — **not** `registry-dist` | Gap | eslint | add `registry-dist` | Add |
| Prettier ignore | `.prettierignore` | similar; **not** `registry-dist` | Gap | prettierignore | add `registry-dist` | Add |
| `.gitignore` env | `.gitignore` | `*.local`; **no** `.env` | Risk if `.env` created | gitignore | ignore `.env`, allow `.env.example` | Tighten |
| Env examples | repo | **zero** `.env*` files | — | — | `.env.example` for Vite + pointer to registry env | Add when registry is used |
| Node version | `docs/08` vs `scripts/build-registry.mjs` | validated `v20.20.2`; esbuild `target: 'node22'` | **No** | docs vs script | `package.json` `engines` + matching target | Align |
| esbuild | `scripts/build-registry.mjs` | imported; **not** in `package.json` | Fragile (Vite transitive) | lockfile transitive | direct `devDependency` | Add direct dep |
| npm scripts vs README | `package.json` vs README / docs/08 | README lists format/typecheck/lint/test/e2e/build; omits `registry:*`, `generate:*`, `prebuild` | Incomplete | `package.json` | README + deploy README | Document |
| `prebuild` | `package.json` | always runs `package-burning-wheel-source.mjs` before `build` | Undocumented side effect | npm lifecycle | README | Document |
| Registry typecheck vs bundle | `typecheck:registry` (tsc noEmit) vs `build:registry` (esbuild) | two compilers | Easy to miss | two scripts | document both | Document |
| Prettier | `.prettierrc.json` | semi, singleQuote, trailingComma all | Yes | that file | that file | Keep |
| React plugin | `vite.config.ts` + `vitest.config.ts` | both register plugin-react | Duplicated | two files | optional mergeConfig | Optional |
| Theme id | appearance preferences | theme `arcane-ledger` / “Arcane Ledger” | Product is Arcane Record | appearance module | keep as theme name | Clarify in docs |
| Vitest globals | `tsconfig.app.json` types include `vitest/globals`; vitest config has **no** `globals: true`; tests import from `vitest` | Types vs runtime | No | actual: explicit imports | drop `vitest/globals` **or** enable globals | Align |
| JWT audience | env example vs `tests/registry/registry-security.test.ts` / smoke | `arcane-record-registry` vs `arcane-registry` | **No** | runtime env file | one canonical string | Align |
| JWT issuer fixtures | env example / smoke | trailing-slash differs in examples | Fixtures only | production env | real issuer | Note slash sensitivity |
| Client registry URL | `registry-client.ts`; deploy README | `VITE_ARCANE_REGISTRY_URL` | Yes when set; undefined locally | Vite env | `.env.example` | Document empty = UI disabled |
| CLI registry URL | `scripts/registry-cli.mjs` | `ARCANE_REGISTRY_URL` + `ARCANE_REGISTRY_TOKEN` | Different prefix from client | CLI env | document both | Document |
| Character deploy root | `deploy/nginx/character.*.conf` | `/opt/arcane-ledger/current` | Consistent, legacy name | nginx | keep until planned rename | Document |
| Registry deploy names | systemd, env, backup | mix `arcane-registry` and `arcane-record-registry` | Naming mix | unit + env | one scheme | Standardize docs |
| CORS / allowed origins | env example | `https://character.travelingwizard.net` | Matches character host | env | env | Keep |
| CI | `.github/` | absent | — | local scripts | optional later | Do not add until install+checks are routine |
| HEMA ACME webroot | `hema.travelingwizard.net.conf` | ACME root `/opt/arcane-ledger/current` | Suspicious coupling | nginx | HEMA-owned webroot | Verify intent |
| Autosave delay | `use-autosave.ts` vs `LocalSheet.tsx` | 550ms vs 400ms | **No** | two literals | one shared constant | Unify with autosave work |
| Save copy | `SaveStatusBadge.tsx`; AGENTS.md | “Saved in this browser” | Yes | component + AGENTS | that phrase | Keep |

---

## Findings

### [AR-013] Port 4173 is overloaded

- **Category:** Configuration
- **Severity:** High
- **Confidence:** Confirmed
- **Location:** `playwright.config.ts`; Vite preview default; `deploy/nginx/hema.*.conf`
- **Current behavior:** Playwright serves Vite **dev** on 4173 with `reuseExistingServer: true`. Vite preview and HEMA production upstream also use 4173.
- **Problem:** E2E can silently talk to HEMA or a leftover preview instead of Arcane Record.
- **Evidence:** playwright `baseURL` and webServer port 4173; HEMA proxy to 4173.
- **Recommendation:** Playwright on e.g. `4174` or `5174`; pin Vite `preview.port` to a third value; leave HEMA at 4173.
- **Alternative:** Disable `reuseExistingServer`.
- **Benefit:** Deterministic E2E.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** `npx playwright test` with HEMA bound on 4173 still hits Arcane.

### [AR-014] JWT audience strings disagree

- **Category:** Configuration
- **Severity:** High (if registry is deployed); Informational if registry stays local-only
- **Confidence:** Confirmed
- **Location:** `deploy/registry/arcane-record-registry.env.example`; `tests/registry/registry-security.test.ts`; smoke script
- **Current behavior:** Example audience `arcane-record-registry`; tests/smoke `arcane-registry`.
- **Problem:** A deploy copied from the example would reject tokens minted for the test audience (and vice versa).
- **Evidence:** string mismatch across those files.
- **Recommendation:** One audience string; update example and tests together.
- **Alternative:** Leave until first real deploy — still fix the example so it cannot lie.
- **Benefit:** Auth actually works.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Next (or Now if deploy is imminent)
- **Verification:** security tests + smoke against the env example values.

### [AR-015] Node 20 documented, registry built for Node 22; esbuild undeclared

- **Category:** Configuration
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** `docs/08-local-development.md`; `scripts/build-registry.mjs`; `package.json` (no `engines`, no `esbuild`)
- **Current behavior:** Docs validate Node v20.20.2. Registry esbuild `target: 'node22'`. `esbuild` comes from Vite transitively.
- **Problem:** Registry syntax/runtime may not match the documented Node. A Vite upgrade could change the esbuild major without this repo noticing.
- **Evidence:** `target: 'node22'`; `import { build } from 'esbuild'`; not in dependencies.
- **Recommendation:** Add `esbuild` as a direct devDependency; set `engines.node` to the real policy; match esbuild target to that policy (20 **or** 22, not both).
- **Alternative:** Drop hosted registry from default developer path.
- **Benefit:** Reproducible registry builds.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Next
- **Verification:** `npm run build:registry` on the documented Node.

### [AR-016] Dual localStorage prefixes and duplicated key literals

- **Category:** Configuration
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `arcane-ledger:*` vs `arcane-record:*`; `mage-sheet-preferences.ts`; `mage20-phase2-module.ts`
- **Current behavior:** Older Mage UI keys use `arcane-ledger`; newer prefs use `arcane-record`. Sphere sort key is duplicated as a string.
- **Problem:** Prefs look “lost” after a well-meaning rename. Two module copies can drift.
- **Evidence:** `SORT_PREFERENCE_KEY = 'arcane-ledger:sphere-sort'` and the same string in the phase-2 module.
- **Recommendation:** Centralize keys; document prefixes; **never migrate IndexedDB or existing keys**.
- **Alternative:** Leave duplication if Mage module path is frozen.
- **Benefit:** Safer refactors.
- **Cost:** Small
- **Risk:** Low if keys stay identical
- **Scope:** Next
- **Verification:** Appearance and Mage wheel/sort survive reload.

### [AR-019] E2E does not exercise the production build

- **Category:** Configuration
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** `playwright.config.ts`; README verification list also runs `build` separately
- **Current behavior:** webServer is `npm run dev`.
- **Problem:** Minify, `try_files` SPA fallback, and hashed assets are not what Playwright hits.
- **Evidence:** `command: 'npm run dev -- --host 127.0.0.1 --port 4173'`.
- **Recommendation:** Keep a fast dev smoke if desired, but add one production-preview smoke (library load + create Mage).
- **Alternative:** Document “E2E is dev-only” in README (honest, cheaper).
- **Benefit:** Catch hosting-class bugs.
- **Cost:** Small–Medium
- **Risk:** Low
- **Scope:** Next
- **Verification:** Preview-based spec passes; refresh on `/characters/:id` works.

### [AR-021] Vitest globals types without globals runtime

- **Category:** Configuration
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `tsconfig.app.json` `types`; `vitest.config.ts`
- **Current behavior:** Types include `vitest/globals`; config does not set `globals: true`; tests import from `vitest`.
- **Problem:** Dead type surface; possible accidental global `describe` without imports.
- **Evidence:** tsconfig types vs vitest config.
- **Recommendation:** Remove `vitest/globals` from `types`.
- **Alternative:** Enable `globals: true` and stop importing — worse for grepability.
- **Benefit:** Honest types.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Next
- **Verification:** `npm run typecheck`.

### [AR-022] Module reverse-DNS `net` vs `org`

- **Category:** Configuration
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `src/games/mage20/module/id-map.ts`; `src/games/exalted1e/module/id-map.ts`
- **Current behavior:** Mage `net.travelingwizard.arcane-record.mage20`; Exalted `org.travelingwizard.arcane-record.exalted1e`.
- **Problem:** Two policies for “the same publisher.” Renaming would break `moduleRef`.
- **Evidence:** constants above.
- **Recommendation:** Pick one prefix for **new** modules; never rename these two without a migration.
- **Alternative:** Ignore; IDs are opaque.
- **Benefit:** Less confusion.
- **Cost:** Small (policy)
- **Risk:** High if renamed
- **Scope:** Later for new IDs only
- **Verification:** Existing module-backed characters still resolve.

### [AR-023] README scripts lag `package.json`; `prebuild` is silent

- **Category:** Documentation
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `README.md`; `docs/08-local-development.md`; `package.json` scripts
- **Current behavior:** README omits registry, generate, and `prebuild` (BW source packaging on every `build`).
- **Problem:** Developers do not know why `build` touches Burning Wheel source or how to run the registry.
- **Evidence:** `prebuild`: `node scripts/package-burning-wheel-source.mjs`.
- **Recommendation:** One paragraph in README/08.
- **Alternative:** Remove `prebuild` if the artifact is committed.
- **Benefit:** Predictable builds.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** Docs mention `prebuild` and registry scripts.

### [AR-024] `registry-dist` not ignored by ESLint/Prettier

- **Category:** Configuration
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `eslint.config.js`; `.prettierignore`; `.gitignore` already has `registry-dist/`
- **Current behavior:** Generated registry bundle can be linted/formatted if present.
- **Problem:** Noise or accidental format of generated JS.
- **Evidence:** eslint ignores list omits `registry-dist`.
- **Recommendation:** Add the ignore.
- **Alternative:** None needed.
- **Benefit:** Clean checks.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** `npm run lint` with `registry-dist` present.

### [AR-025] HEMA deploy config lives in this repo and shares identity with Arcane paths

- **Category:** Configuration
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** `deploy/nginx/hema.*.conf`; ACME root `/opt/arcane-ledger/current`
- **Current behavior:** Unrelated host configs are stored next to the character SPA. ACME webroot is the Arcane deploy path.
- **Problem:** Port and path coupling; accidental nginx edits can affect the wrong product. **Needs verification** whether ACME sharing is intentional.
- **Evidence:** HEMA conf files under `deploy/nginx/`; ACME `root /opt/arcane-ledger/current`.
- **Recommendation:** Confirm intent; if accidental, give HEMA its own webroot. Do not let Playwright use HEMA’s port.
- **Alternative:** Split deploy repos.
- **Benefit:** Safer ops.
- **Cost:** Small–Medium
- **Risk:** Medium (certs)
- **Scope:** Next
- **Verification:** HEMA and character TLS still renew; E2E isolated.

### [AR-039] `.gitignore` does not ignore `.env`

- **Category:** Configuration
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** `.gitignore` (`*.local` only)
- **Current behavior:** A `.env` with `VITE_ARCANE_REGISTRY_URL` or tokens could be committed.
- **Problem:** Classic secret leak for a repo that otherwise avoids secrets.
- **Evidence:** `.gitignore` listing.
- **Recommendation:** Ignore `.env`, `.env.*` except `.env.example`.
- **Alternative:** Rely on discipline — weaker.
- **Benefit:** Safer defaults.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** `git check-ignore .env`.

---

## Scripts documented vs actual

**README / docs/08:** `dev`, `format`, `format:check`, `typecheck`, `lint`, `test`, `test:e2e`, `build`, `preview`.

**Also in `package.json`:** `prebuild`, `build:registry`, `typecheck:registry`, `registry:start`, `registry:cli`, `test:registry-http`, `test:watch`, `generate:magick-reference`, `generate:equipment`, `generate:maneuvers`, `generate:burning-wheel`, `package:burning-wheel-source`.

**Scripts without npm entries (manual):** `scripts/backup-registry.sh`, `generate-backgrounds.mjs`, `generate-merits-flaws.mjs`, `generate-mage-source-manifest.mjs`, `audit-character-source-index.py`.
