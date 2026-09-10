# Performance and reliability review

Persona: performance and reliability engineer. Local `npm run build` was not run. **Production was measured** on 2026-09-08 at https://character.travelingwizard.net/ (see [live-site-review.md](live-site-review.md)).

---

## Demonstrated or strongly evidenced issues

### [AR-040] The SPA is a single graph of every game

- **Category:** Performance
- **Severity:** High (on the live host, because the 3.9 MB file is also uncompressed)
- **Confidence:** Confirmed
- **Location:** `src/games/registry.ts`; `src/app/App.tsx`; live `/assets/index-D7MqY36r.js`
- **Current behavior:** One JS chunk, 3,929,986 bytes. Browser transfer size ≈ encoded size (no gzip). Local gzip of that file ≈ 1,003,853 bytes. Opening the library therefore downloads every game editor.
- **Problem:** First visit is far heavier than a local-first sheet needs. Parse cost remains after compression.
- **Evidence:** Live Performance timing; `curl -sI` content-length; no `React.lazy` in `src/`.
- **Recommendation:** Enable gzip/brotli **now** (AR-058). Then lazy-load editors if parse cost is still high.
- **Alternative:** Split “complete” vs “foundation” packages — too much tooling for one developer.
- **Benefit:** Faster first paint as games accrue.
- **Cost:** Small for gzip; Medium for lazy-load
- **Risk:** Low / Medium
- **Scope:** Now (compression); Next (code splitting)
- **Verification:** Encoded transfer << 2 MB with compression; library still opens Mage.

### [AR-041] App boot checksums every installed module package

- **Category:** Performance
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `src/app/App.tsx` startup `useEffect`
- **Current behavior:** `listPackages()` then `calculateModuleChecksum` for each row before `moduleRegistry.replaceInstalled`.
- **Problem:** Cheap today (few packages). Linear cost on every load if the user installs many modules.
- **Evidence:** `Promise.all(packages.map(... checksum ...))`.
- **Recommendation:** Keep checksums; cache by stored checksum+id or verify lazily when opening a module character.
- **Alternative:** Verify only on install (weaker tamper detection after IDB edit).
- **Benefit:** Faster startup later.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Later
- **Verification:** Boot with 0 vs N dummy packages.

### [AR-042] Autosave debounce mismatch and Mage unqueued writes

See [AR-026](data-and-persistence-review.md). Reliability issue more than performance: 400 vs 550 ms; Mage can overlap IndexedDB `put`s.

### [AR-043] No React error boundary

See [AR-009](architecture-review.md). Reliability: one throw loses the session UI though data remains.

### [AR-044] Monolithic editors and Zustand Mage store

- **Category:** Performance
- **Severity:** Low
- **Confidence:** Strong evidence (file sizes); rerender cost **needs verification** in profiler
- **Location:** `Torchbearer2eEditor.tsx` (2155), `BurningWheelEditor.tsx` (1895), `editor-store.ts` (1643), `Exalted1eEditor.tsx` (1332)
- **Current behavior:** Large components subscribe broadly. Mage store is a single character blob.
- **Problem:** Typing in one field may rerender large trees. Fine for one character; painful on low-end phones.
- **Evidence:** line counts; Zustand selector usage in `useAutosave` selects whole `character`.
- **Recommendation:** Do not rewrite. When touching Mage persistence, avoid selecting the entire character in autosave if a `revision` is enough (already partially done). Split Torchbearer catalog from the editor component.
- **Alternative:** Virtualize long catalogs (already searchable lists — check if they render all rows).
- **Benefit:** Smoother typing.
- **Cost:** Medium if done as a rewrite — **do not**
- **Risk:** High for a cosmetic split
- **Scope:** Later, only if profiling shows jank
- **Verification:** React profiler on Mage attribute clicks.

---

## Likely-fine at current scale

- IndexedDB for dozens-to-hundreds of characters is appropriate.
- Zod parse on save is cheap relative to disk.
- No chatty network on the character path.
- Library search is in-memory filter of resolved summaries — fine until thousands of rows (**future**, not now).
- Playwright `fullyParallel: false` is reliability-oriented, not a product issue.

---

## Loading, empty, failure, recovery

| State | Behavior |
|---|---|
| Library loading | “Opening your browser-local records…” |
| Empty library | Create/import |
| Save error | “Local save failed” |
| Missing character | Not found |
| Unknown system / bad module | Recoverable record + raw export |
| Module registry boot failure | Caught; legacy editors continue (`App.tsx`) |

These are honest and match the product language. Mage tab-close is the missing recovery path [AR-027].

## Large / corrupted data

- v10 envelope preserves raw unreadable rows — good.
- Character import unlimited size — [AR-036].
- Unknown catalog IDs remain visible — good, not a perf issue.

## Subscriptions / listeners

- Router: `popstate` cleaned up.
- LocalSheet `beforeunload` cleaned up.
- Appearance + section prefs: standard localStorage; Mage expansion per character id.

No leaked intervals found in the autosave hooks (timeout cleared). **Needs verification** for game-specific `setInterval` (Mouse Guard conflict tools, etc.).

## Network

Registry catalog fetch only when URL configured. Offline: app must remain usable (AGENTS.md). Boot does not require network. **Confirmed** for character path.

## Bundle size

**Not measured.** After `npm run build`, inspect `dist/assets/*.js`. If the main chunk exceeds what you find acceptable on phone hardware, then [AR-040] becomes Now rather than Next.

---

## Recommendations that should not be pursued

- Service workers / PWA “for performance” without an offline-cache design review (IndexedDB already is the source of truth; SW can stale-cache the wrong SPA).
- Redis, CDN for characters, pagination infrastructure.
- Rewriting catalogs to a database.
