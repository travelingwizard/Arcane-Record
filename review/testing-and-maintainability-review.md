# Testing and maintainability review

Persona: testing and maintainability reviewer.

The project already has a **serious** automated suite for a single-developer local app: ~120 test files (63 unit, 21 integration, 33 e2e, 1 registry, plus a couple of outliers). Mage-era behavior is clearly the best covered. Newer games mostly get Playwright smoke. That is a reasonable pyramid **if** the shared `LocalSheet` path is trusted — which is why Mage still being off that path is a testing smell, not only an architecture smell.

Commands were **not executed** (no `node_modules`).

---

## Layout

```
tests/unit/           schemas, catalogs, engines, routing
tests/integration/    Dexie + React editors (Mage-heavy)
tests/e2e/            33 Playwright specs
tests/registry/       auth/store security
tests/games/          mouse-guard rules (one file)
tests/curseborne-rules.test.ts   orphan at tests/ root
tests/fixtures/       golden / synthetic modules
```

Plan doc `docs/07-testing-plan.md` is still Mage-centric (catalog counts, Magick/Equipment/Maneuvers scenarios). It does not inventory Vampire/Werewolf/Wraith/Mouse Guard/etc.

---

## Smallest effective testing strategy (recommendation)

Keep:

1. **Zod + migration unit tests** per game that you actually ship.
2. **One persistence integration** for the shared autosave helper (once Mage uses it).
3. **One Playwright smoke per registered system:** create → edit one distinctive field → reload → still there → JSON export exists.
4. **Deeper e2e only for Mage** (catalogs, Magick, equipment, maneuvers, section nav, 320px) plus City of Mist crew concurrency (already special).
5. **Import/export unit tests** including linked bundles and YAML `{ json: true }`.
6. **Registry security unit tests** if the server stays in-repo; HTTP smoke only when touching `registry/`.

Do **not**: aim for equal e2e depth on 19 games; snapshot entire HTML; add Cypress; stand up CI before `npm install` + local checks are routine.

---

## Findings

### [AR-050] Testing plan and docs lag the suite and the games

- **Category:** Testing
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** `docs/07-testing-plan.md`; `README.md`; 33 e2e specs vs plan’s Mage scenarios
- **Current behavior:** Plan describes Mage acceptance in detail. Many specs exist that the plan does not list. Charter/README omit games that have e2e files.
- **Problem:** Maintainers cannot see what “done” means for a new game.
- **Evidence:** e2e files for changeling20, vampire20, werewolf20, wraith20, mouse-guard2e, etc.; docs/07 does not mention them.
- **Recommendation:** Replace docs/07 inventory with a table: game → unit → e2e smoke → deep e2e. Point README at it.
- **Alternative:** Delete docs/07 and rely on spec filenames — worse for humans.
- **Benefit:** Honest coverage map.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** Every `src/games/*` folder except `shared` appears in the table.

### [AR-051] Critical shared persistence is unevenly tested because Mage is a special case

- **Category:** Testing
- **Severity:** High
- **Confidence:** Strong evidence
- **Location:** `use-autosave.ts` vs `LocalSheet.tsx`; e2e `local-persistence.spec.ts` (Mage-oriented by plan)
- **Current behavior:** Mage persistence e2e exists. LocalSheet CAS/queue/`beforeunload` is the better implementation and is not the Mage path.
- **Problem:** Tests can pass while the flagship save path still loses data on overlap/close.
- **Evidence:** architecture/data findings; Mage-specific autosave module.
- **Recommendation:** Unit-test the save helper (fake repo): overlapping saves, stale `expectedData`, unsaved unload flag. Then put Mage on that helper.
- **Alternative:** Duplicate those tests against `useAutosave` — wasted once you unify.
- **Benefit:** Tests match the real risk.
- **Cost:** Medium
- **Risk:** Low
- **Scope:** Now
- **Verification:** Failing test without CAS; passing after Mage migration.

### [AR-052] Linked interchange and adversarial YAML lack tests

- **Category:** Testing
- **Severity:** Medium
- **Confidence:** Confirmed (no dedicated tests found in exploration)
- **Location:** expected near `tests/unit/*import*` / wraith / mouse-guard; `character-files.ts`
- **Current behavior:** JSON/YAML round-trip tests exist for Mage-shaped files (plan). Linked UUID rewrite and YAML tags are not first-class.
- **Problem:** [AR-029] and [AR-035] can regress silently.
- **Evidence:** City of Mist has crew concurrency e2e in `new-sheet-previews.spec.ts`; Wraith/Mouse Guard/Legend lack bundle import tests **(inferred from spec names; Needs verification of file contents)**.
- **Recommendation:** Fixtures: psyche+shadow export/import; YAML custom tag rejected.
- **Alternative:** Manual test checklist — weaker.
- **Benefit:** Protects data portability.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** New unit/e2e files named for those cases.

### [AR-053] No CI

- **Category:** Testing
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** no `.github/` workflows
- **Current behavior:** Verification is local scripts.
- **Problem:** Fine for a private single-developer repo; regressions land only when you remember to run the suite.
- **Evidence:** glob of `.github` absent.
- **Recommendation:** Optional later: one GitHub Action `npm ci && npm run typecheck && npm run lint && npm run test`. Playwright in CI needs the browser install — add only if you want it.
- **Alternative:** Stay local — acceptable.
- **Benefit:** Safety net.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Later
- **Verification:** Action runs on push.

### [AR-054] Orphan and uneven test placement

- **Category:** Testing
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `tests/curseborne-rules.test.ts`; `tests/games/mouse-guard2e/rules.test.ts`
- **Current behavior:** Most unit tests live in `tests/unit/`. Two games sit elsewhere. Vitest include is `tests/**/*.{test,spec}.{ts,tsx}` excluding e2e, so they still run.
- **Problem:** Easy to miss when grepping `tests/unit`.
- **Evidence:** paths above; `vitest.config.ts` include.
- **Recommendation:** Move to `tests/unit/` for consistency.
- **Alternative:** Leave; they still run.
- **Benefit:** Discoverability.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Next
- **Verification:** `npm run test` file list.

### [AR-019] E2E against Vite dev

See configuration audit. Maintainability: production hosting bugs escape.

### [AR-055] Dead Mage repository still compilable

See [AR-010](architecture-review.md). Maintainability footgun.

### [AR-056] Comments/docs vs behavior

Examples: docs/16 vs expansion prefs [AR-032]; charter no-backend vs `registry/`; Phase-1 “no module library UI” vs `/modules`.

- **Category:** Documentation
- **Severity:** Medium
- **Confidence:** Confirmed
- **Recommendation:** Documentation pass in the first implementation phase. Do not rewrite AGENTS.md’s local-first rules.

---

## Weak typing / dead code / complexity

- `as any` in `src/`: **0** (exploration).
- `Record<string, unknown>` / `z.unknown` used at interchange — appropriate.
- Dead: unused `characterRepository` singleton; overlay runtime.
- Large functions/files: Torchbearer catalog/editor, BW editor, Mage store — high change cost. Prefer not to split until a behavior change requires it.
- Repeated business rules: point-accounting and linked-sheet integrity should live in game modules (already) plus **shared** save/import hooks (missing).

## Developer setup

README is clear: `npm install && npm run dev`. This clone had **no** `node_modules`, so a new machine cannot verify until install. Playwright Chromium note is present. Registry scripts are under-documented [AR-023].

`docs/08` says no Docker/nginx required for app work — true. `deploy/` existing may confuse.

---

## Validation commands (this review)

| Command | Succeeded? | Notes |
|---|---|---|
| `npm run format:check` | Not run | `node_modules` missing; install not approved |
| `npm run typecheck` | Not run | same |
| `npm run lint` | Not run | same |
| `npm run test` | Not run | same |
| `npm run test:e2e` | Not run | same; also Playwright browser |
| `npm run build` | Not run | would also run `prebuild` BW packaging |
| `npm run typecheck:registry` | Not run | same |
| `npm run test:registry-http` | Not run | same |

**Failure classification:** environment/pre-existing to this worktree (fresh clone), not a test assertion failure.

**Suggested resolution:** `npm install` (user approval) then the README verification block. Record output in a follow-up; do not “fix” failures silently.
