# 18. Exalted First Edition — planned splat release model

## Status

**Not started.** Solar and Dragon-Blooded (`docs/17-exalted-1e-foundation.md`)
remain the only implemented Exalted 1e sheets. Lunar, Abyssal, Sidereal,
Alchemical, and Fair Folk have no schema, catalog, creator, editor, or tests.
This document defines the process and release gate that will apply once
source material starts arriving for those five splats — it is a plan for
future work, not a record of work already done.

All five families ship together, or not at all. No family unlocks in the
create list ahead of the other four.

## Why this document exists

An earlier attempt to scope this work assumed several artifacts already
existed in the repository — a manually maintained verification gate, an
`audit:exalted-sources` script, and per-family OCR candidate counts (Lunar
175, Abyssal 19, Sidereal 151, Alchemical 87, Fair Folk 201). None of that
was present. This document, `src/games/exalted1e/verification.ts`, and
`scripts/audit-exalted-sources.mjs` are the actual infrastructure, built from
scratch, that those artifacts are expected to become as real source material
arrives.

**Critical constraint:** nothing in this repository, and no tool available to
an agent working in it, can source the text of _Exalted: The Lunars_, _The
Abyssals_, _The Sidereals_, _The Alchemicals_, _Exalted: The Fair Folk_, or
their supplements. Those are commercial White Wolf/Onyx Path products. Every
count and catalog in this document is supplied by the project owner —
scanned pages, OCR text, or transcriptions — the same way the Dragon-Blooded
import in `docs/references/exalted1e/dragon-blooded/` was built. Work on a
given book cannot start before its source material is supplied.

## The inventory / disposition model

For each source book contributing to a family, create one machine-readable
inventory file under:

```
docs/references/exalted1e/<family>/inventory/<book-slug>.json
```

Each file is an array of rows. Every row has this shape:

```ts
interface InventoryRow {
  id: string; // stable kebab-case ID, unique across the whole family
  name: string;
  aliases?: string[];
  disposition:
    | 'selectable' // a player-facing choice; candidate for promotion
    | 'calculated' // a derived value/formula, not a discrete choice
    | 'reference-only' // player-facing text with no mechanical effect
    | 'unresolved' // OCR/legibility problem, not yet readable
    | 'gm-only' // Storyteller-side material, never selectable
    | 'excluded'; // deliberately out of scope (see notes)
  summary: string; // concise original summary, not copied verbatim
  requirements?: string; // prerequisites, in plain text
  mechanics?: string; // cost/effect text, in plain text
  cost?: string;
  compatibility?: string; // which sheet types/castes/auras can take this
  verificationState: 'unreviewed' | 'reviewed'; // set 'reviewed' only after
  // visual comparison against
  // the rendered source page
  citation: {
    bookId: string; // must exist in this family's source-manifest.json
    printedPage?: number | string;
    pdfPage?: number | string;
  };
  crossReferences?: string[]; // other row ids this row's rules depend on
  notes?: string;
}
```

OCR (or any other extraction aid) only produces `unreviewed` rows. A row's
`verificationState` becomes `reviewed` only after someone visually compares
it against the actual rendered source page. **OCR output is never
verification by itself.**

Each family also gets `docs/references/exalted1e/<family>/source-manifest.json`
listing every source book in scope for that family, in the same shape as
`docs/references/exalted1e/dragon-blooded/source-manifest.json` (`bookId`,
`bookLabel`, `role`). `citation.bookId` values in inventory rows must appear
in this manifest — the audit script rejects unknown book IDs.

## Promotion: inventory row → production catalog

A row is eligible for promotion into a real catalog file
(`src/games/exalted1e/reference/<family>-*.json`, following the existing
`solar-charms.json` / `dragonblooded-charms.json` shape) only when:

- `disposition` is `selectable` or `calculated`;
- `verificationState` is `reviewed`;
- it has a unique stable `id`, a citation, and resolved (non-placeholder)
  cost/requirement/prerequisite text.

Promoting a row that is `unresolved`, `reference-only`, `gm-only`, or
`excluded` is a defect the audit script flags as an error.

## `audit:exalted-sources`

`scripts/audit-exalted-sources.mjs` (run via `npm run audit:exalted-sources`)
reads every family's inventory directory and, if present, its source manifest
and any already-promoted catalog files, and fails (non-zero exit) when it
finds:

- duplicate inventory IDs within a family;
- a missing or unrecognized `disposition`;
- a missing source citation, or a citation whose `bookId` is not in that
  family's `source-manifest.json`;
- a `crossReferences` entry pointing at an ID that does not exist in the
  family's inventory (an unresolved or invalid cross-reference);
- a promoted production catalog entry with no matching inventory row, an
  inventory row that is not `reviewed`, or a disposition that should not
  have been promoted.

A family with **no inventory directory yet** is reported as
`pending-source-material` and is **not** an error — that is the correct,
expected state today for all five planned families. Running the script now
prints exactly that for Lunar, Abyssal, Sidereal, Alchemical, and Fair Folk,
with zero errors.

The script's checking functions (`auditInventoryRows`, `auditPromotedCatalog`,
`computeChecksum`) are plain exported functions so they are unit-testable
directly (`tests/unit/exalted1e-source-audit.test.ts`) without needing real
book content.

## Certification and the availability gate

`src/games/exalted1e/certification/<family>.json` holds one checked-in
evidence record per planned family, validated by
`src/games/exalted1e/certification/schema.ts`:

```ts
interface SplatCertificationRecord {
  family: 'lunar' | 'abyssal' | 'sidereal' | 'alchemical' | 'fair-folk';
  catalog: {
    totalInventoryRows: number;
    promotedEntries: number;
    unresolvedEntries: number;
    checksum: string; // hash of the promoted catalog file(s); '' until any exist
  };
  rulesTests: 'not-run' | 'pass' | 'fail';
  creatorTests: 'not-run' | 'pass' | 'fail';
  migrationTests: 'not-run' | 'pass' | 'fail';
  browserTests: 'not-run' | 'pass' | 'fail';
  certifiedAt: string | null; // ISO datetime, set only once every dimension passes
  notes: string;
}
```

`src/games/exalted1e/verification.ts` exports `isFamilyAvailable(family)`,
which returns `true` only when:

1. every inventoried row for the family has been promoted
   (`promotedEntries === totalInventoryRows`) with zero `unresolvedEntries`,
   and a non-empty `catalog.checksum`;
2. `rulesTests`, `creatorTests`, `migrationTests`, and `browserTests` are all
   `'pass'`;
3. `certifiedAt` is set.

`getFamilyCertificationStatus(family)` / `getAllFamilyCertificationStatuses()`
produce the human-readable status strings consumed by
`src/games/exalted1e/definition.tsx`, which builds the "Unavailable" create-page
cards for each locked family directly from this evidence (see the
`unavailableSheetChoices` pattern already used by Call of Cthulhu 7E's Keeper
workspace card). Today every family is locked with every field at its honest
default (`not-run` / `0` / `null`), which is why every card reads "Locked
pending certification" with `not-run`/`0` status text instead of a hand-written
sentence.

**Design note on the checksum:** `verification.ts` trusts the checksum stored
in the certification record; it does not recompute catalog hashes inside the
browser bundle. `scripts/audit-exalted-sources.mjs` is the tool responsible
for recomputing `computeChecksum()` over a family's promoted catalog files and
cross-checking it against the checked-in certification record once both
exist — a future addition to the script, once there is a catalog to check.

Removing "Locked pending certification" for a family means editing that
family's certification JSON with real evidence (test results, catalog
counts, a real checksum) — never flipping a hand-maintained boolean in code.
No family may be partially unlocked; all five certification records must
independently reach `certifiedAt !== null` before any of the five sheet
types are added to `exaltedSheetTypes` in `definitions.ts` and exposed as a
real, creatable sheet.

## Status per family

| Family     | Source manifest | Inventory rows | Promoted | Certification                    |
| ---------- | --------------- | -------------- | -------- | -------------------------------- |
| Lunar      | Not created     | 0              | 0        | Locked, all dimensions `not-run` |
| Abyssal    | Not created     | 0              | 0        | Locked, all dimensions `not-run` |
| Sidereal   | Not created     | 0              | 0        | Locked, all dimensions `not-run` |
| Alchemical | Not created     | 0              | 0        | Locked, all dimensions `not-run` |
| Fair Folk  | Not created     | 0              | 0        | Locked, all dimensions `not-run` |

## Next steps (require source material per book)

1. Project owner supplies scanned pages, OCR text, or transcriptions for one
   book at a time, starting with whichever family's core book is available
   first.
2. Create/extend that family's `source-manifest.json` and one inventory file
   per book under `inventory/`.
3. Run `npm run audit:exalted-sources` and fix reported issues.
4. Visually review each `unreviewed` row against the rendered source page;
   set `verificationState: 'reviewed'` only after that comparison.
5. Promote reviewed, `selectable`/`calculated` rows into a production
   catalog file, following the existing `reference/*.json` + `.ts` wrapper
   pattern.
6. Only after **all five families** have complete schemas, rules, creation
   stages, advancement wiring, and passing rules/creator/migration/browser
   tests, update every certification record with real evidence and set
   `certifiedAt`. Update this document's status table at the same time.
