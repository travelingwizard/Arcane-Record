# Data and persistence review

Persona: data and persistence specialist.

The envelope + opaque `data` + Zod-at-boundaries design is **appropriate** for a local-first single-user app. Catalogs stay out of character files. Invalid rows are preserved. Import copies rather than overwrites. Those are the right defaults.

Gaps are **uneven application** of that design: Mage saves like an older app; linked sheets are not a graph; module v2 import trusts the payload when the module is missing.

---

## Models

### StoredCharacter (`src/storage/stored-character.ts`)

| Field | Role |
|---|---|
| `id` | Stable UUID |
| `systemId` | Registry id or `arcane-module` |
| `systemVersion` | Game or template version |
| `name` | Denormalized display |
| `createdAt` / `updatedAt` | ISO timestamps |
| `data` | `z.unknown()` game payload |
| `moduleRef?` | Exact package + template + lock |
| `homebrew?` | Character-owned overrides |

Invariant: `moduleRef` implies `systemId === 'arcane-module'`.

### IndexedDB `arcane-ledger` (`src/storage/mage-database.ts`)

| Dexie version | Effect |
|---|---|
| 1 | `characters: id, systemId, updatedAt, createdAt` |
| 2–5 | Same indexes; in-place `migrateMageCharacter` (errors swallowed) |
| 6–9 | Not defined (jump) |
| 10 | `name` index; wrap rows via `preserveAsEnvelope` |
| 11 | Module tables; no character rewrite |

### Mage dual model

- Envelope `systemId`: `mage20`
- Inner `systemId`: `mage-m20`
- Schema version: **13**
- Payload strips envelope fields via `mageCharacterDataSchema`

### Preferences (not in exports)

See configuration matrix. Section expansion is localStorage; Build/Play `sheetLayout` is character data.

---

## Findings

### [AR-026] Mage autosave has no optimistic concurrency or save queue

- **Category:** Data
- **Severity:** High
- **Confidence:** Confirmed
- **Location:** `src/features/character-editor/use-autosave.ts`; `src/storage/dexie-character-repository.ts`; contrast `src/games/shared/LocalSheet.tsx`; `src/storage/dexie-stored-character-repository.ts` `saveIfUnchanged`
- **Current behavior:** After 550ms, Mage calls `save`/`put`. Overlapping timers can complete out of order. LocalSheet queues and CAS-compares `data`.
- **Problem:** Multi-tab or fast edits can persist an older draft. This is the flagship sheet.
- **Evidence:** `useAutosave` has no queue and no `saveIfUnchanged`. Dexie `put` last-write-wins.
- **Recommendation:** Same save contract as LocalSheet.
- **Alternative:** Disable opening the same Mage character in two tabs (weaker).
- **Benefit:** Fewer silent lost updates.
- **Cost:** Medium
- **Risk:** Medium
- **Scope:** Now
- **Verification:** Two overlapping saves; assert last acknowledged revision wins or conflict surfaces.

### [AR-027] Mage editor has no `beforeunload` guard

- **Category:** Data
- **Severity:** High
- **Confidence:** Confirmed
- **Location:** `LocalSheet.tsx` lines ~100–109; Mage `useAutosave` / `CharacterEditor.tsx`
- **Current behavior:** LocalSheet warns on leave if status ≠ `saved`. Mage library return can flush; closing the tab during the debounce window does not warn.
- **Problem:** Up to ~550ms of Mage edits can vanish on tab close. Contradicts “trustworthy local record.”
- **Evidence:** `beforeunload` only in `useLocalSheet`.
- **Recommendation:** Add the same guard; optionally flush save on `visibilitychange`/`pagehide`.
- **Alternative:** Immediate save (no debounce) — more IDB writes.
- **Benefit:** Matches user expectation.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** Unsaved Mage edit + close attempt triggers the browser prompt.

### [AR-028] Format-v2 import skips character Zod when the module is missing

- **Category:** Data
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** `src/features/import-export/character-files.ts` `prepareImportedRecord` (`formatVersion === 2`)
- **Current behavior:** If `moduleRegistry.get(...)` is missing, `character` is `structuredClone`d into IndexedDB without `characterSchema.parse`.
- **Problem:** Corrupt module payloads become stored “characters.” Recovery UI may still open them as unavailable, but the library now holds invalid `data`.
- **Evidence:** Parse runs only inside `if (installed && moduleRegistry)`.
- **Recommendation:** Always store, but mark `systemVersion`/flag invalid; or require a sidecar checksum. Minimum: try parse when installed; when not, still reject non-object / oversized payloads.
- **Alternative:** Refuse v2 import until the module is installed (worse UX, safer).
- **Benefit:** Malformed files cannot poison IDB as easily.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** Import v2 with garbage `character` and missing module — either reject or quarantine with raw export only.

### [AR-029] Linked records are not portable (except City of Mist)

- **Category:** Data
- **Severity:** High
- **Confidence:** Confirmed
- **Location:** `src/games/city-of-mist/crew-service.ts`; `src/games/wraith20/schema.ts`; `src/games/mouse-guard2e/schema.ts`; `src/games/legend-in-the-mist/schema.ts`; library delete in `ArcaneRecordLibrary.tsx`
- **Current behavior:** Import always mints a new character UUID. City of Mist `prepareExport` snapshots crew transfer. Wraith keeps `shadowId` / `psycheCharacterId`. Mouse Guard keeps `patrolId`. Legend keeps `fellowshipId` / `memberIds`. Delete removes appearance override only; no cascade.
- **Problem:** Export/import or delete breaks companion sheets. The user did not get a portable “pack.”
- **Evidence:** City of Mist hook exists; other schemas store raw foreign UUIDs; delete path has no graph walk.
- **Recommendation:** A shared optional `prepareExport` / `prepareImport` / `getDeleteWarning` used by all linked games. Export a bundle or embed a snapshot (City of Mist pattern).
- **Alternative:** Document “export each sheet in the same browser only” — honest but poor.
- **Benefit:** Multi-sheet games actually round-trip.
- **Cost:** Medium
- **Risk:** Medium (must not duplicate crews accidentally)
- **Scope:** Now (Wraith/Mouse Guard/Legend)
- **Verification:** Export psyche+shadow; import on empty DB; both records exist and link. Delete warns.

### [AR-030] `saveIfUnchanged` compares only `data` JSON

- **Category:** Data
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `src/storage/dexie-stored-character-repository.ts`
- **Current behavior:** Conflict if `JSON.stringify(current.data) !== expectedData`. Envelope `name`, `moduleRef`, `homebrew`, `systemVersion` are not in the compare. Key order in `data` matters.
- **Problem:** Rare envelope-only races; stringify sensitivity if two writers canonicalize differently.
- **Evidence:** implementation as written; then `save` refreshes `updatedAt`.
- **Recommendation:** Compare a canonical envelope hash (data + name + moduleRef + homebrew) or a monotonic `updatedAt`/`revision`.
- **Alternative:** Keep data-only compare; document limitation.
- **Benefit:** Correct CAS.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Next
- **Verification:** Concurrent name vs data edit.

### [AR-031] Section-preference keys orphaned on delete

- **Category:** Data
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `ArcaneRecordLibrary.tsx` delete; `use-character-section-preferences.ts`
- **Current behavior:** Delete removes the IDB row and appearance override. `arcane-ledger:section-preferences:<id>` remains.
- **Problem:** localStorage grows; not character loss.
- **Evidence:** no `removeItem` for section keys on delete.
- **Recommendation:** Delete known pref keys with the character.
- **Alternative:** Ignore (tiny).
- **Benefit:** Hygiene.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Next
- **Verification:** Delete character; key gone.

### [AR-032] Docs disagree whether section expansion is character data

- **Category:** Documentation
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `docs/03-data-model.md` (localStorage only); `docs/16-multi-game-architecture.md` (“section expansion/order” under character data)
- **Current behavior:** Expansion prefs are localStorage. `sheetLayout.groupOrders` / mode are in character data and exported.
- **Problem:** A later change might export expansion by mistake.
- **Evidence:** docs conflict; code matches docs/03 for expansion.
- **Recommendation:** Fix docs/16 wording: expansion = view pref; order/mode = character data.
- **Alternative:** — 
- **Benefit:** Correct future edits.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** Export JSON has no expansion map; has groupOrders if used.

### [AR-033] Module `dependencyLockId` remapped on import

- **Category:** Data
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `character-files.ts` format v2 return (`localLock?.id ?? envelope...`)
- **Current behavior:** Import substitutes a local compatible lock id.
- **Problem:** Round-trip is not bit-identical for `moduleRef`. Usually what you want on a second machine; surprising if locks differ.
- **Evidence:** assignment in `prepareImportedRecord`.
- **Recommendation:** Keep remap; mention in docs/06.
- **Alternative:** Fail import without a matching lock.
- **Benefit:** Honest interchange docs.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Next
- **Verification:** Docs + import test with missing lock.

### [AR-034] Dexie v2–5 upgrades swallow Mage migration errors

- **Category:** Data
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `mage-database.ts` `tryMigrateLegacyMageInPlace`
- **Current behavior:** Empty `catch`. v10 then wraps raw content.
- **Problem:** Incomplete upgrades are silent; recovery envelope is the safety net (good). Debugging old DBs is harder.
- **Evidence:** empty catch comment pointing at v10.
- **Recommendation:** Keep preservation; optional `console.warn` in dev only. Do not delete rows.
- **Alternative:** None.
- **Benefit:** Slightly better diagnostics.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Later
- **Verification:** Fixture DB with junk Mage row still opens as recoverable.

### [AR-005 dual IDs] See [AR-007](architecture-review.md)

Load-bearing and documented. Not a defect by itself; a maintenance cost.

---

## Normalization vs simplicity

Document-per-character is correct. Soft links without FK tables are correct **if** export/import/delete hooks exist. They do not, except City of Mist.

## Validation boundaries

| Boundary | Behavior |
|---|---|
| Envelope create/save | Zod shell only; `data` unknown |
| `list` / `get` | Raw Dexie rows |
| Open | `resolveCharacter` migrate+parse |
| Import v1 | migrate+parse per system |
| Import v2 | parse only if module installed |
| Mage inner save | `mageCharacterSchema` |

Fail-closed at editor hydrate is good. List showing unverified rows is acceptable if unavailable cards work.

## Defaults / nullability

Mage uses Zod defaults (source preferences, development, arrays). `affinitySphere` nullable. Unknown catalog IDs preserved — correct.

## Interrupted writes

Single IndexedDB `put` is atomic. Mage in-flight overlap is the real gap [AR-026]. LocalSheet is better [with AR-030 caveat].

## Temporary UI vs persisted

Undo buffers are memory-only (good). Build/Play mode persisted (product choice). Mouse Guard `conflict` / `rollHistory` persisted (**inferred** session-ish; confirm if that is desired). LocalSheet section open/closed is React-only; Mage expansion is per-character localStorage — inconsistent UX, not data loss.

## Reference vs user data

Strong separation. Homebrew on the envelope is character-owned. Catalog JSON is not copied into exports (docs/06).

## Can exported data be imported without loss?

| Case | Result |
|---|---|
| Single Mage/Exalted/etc. sheet, same app version | Yes, as a **copy** (new id, `(Imported)` name) |
| Preferences | Intentionally excluded |
| Module lock | May remap [AR-033] |
| Linked companions | **No**, except City of Mist snapshot |
| Format v2 without module | Stored unvalidated [AR-028] |
| Homebrew | Format v2 only |

---

## Accidental data-loss summary

| Risk | Severity |
|---|---|
| Mage overlapping save / tab close | High |
| Linked UUID after import/delete | High for those games |
| Invalid module payload stored | Medium |
| Orphan localStorage | Low |
| Dexie name rename | Critical if someone “fixes” `arcane-ledger` — **do not** |
