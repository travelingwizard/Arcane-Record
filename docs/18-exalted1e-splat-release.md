# 18. Exalted First Edition — planned splat release model

## Status

**Source inventory in progress; no schema/catalog/creator yet.** Solar and
Dragon-Blooded (`docs/17-exalted-1e-foundation.md`) remain the only
implemented, playable Exalted 1e sheets. Lunar, Abyssal, Sidereal,
Alchemical, and Fair Folk all now have primary-source inventories checked in
under `docs/references/exalted1e/<family>/` (see the status table below),
but none of the five has a production schema, promoted catalog, creator
stage, editor, or passing rules/creator/migration/browser tests yet. This
document defines the process and release gate that governs the rest of that
work — it is a plan for what remains, not a record of a finished feature.

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
Abyssals_, _The Sidereals_, _The Autochthonians_, _Exalted: The Fair Folk_, or
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

| Family     | Source manifest                       | Inventory rows | Promoted | Certification                    |
| ---------- | ------------------------------------- | -------------- | -------- | -------------------------------- |
| Lunar      | Created (Exalted: The Lunars + Exalted Players Guide) | 341 | 0        | Locked, all dimensions `not-run` |
| Abyssal    | Created (Exalted: The Abyssals + Book of Bone and Ebony) | 440 | 0        | Locked, all dimensions `not-run` |
| Sidereal   | Created (Exalted: The Sidereals)      | 252            | 0        | Locked, all dimensions `not-run` |
| Alchemical | Created (Exalted: The Autochthonians) | 207            | 0        | Locked, all dimensions `not-run` |
| Fair Folk  | Created (Exalted: The Fair Folk)      | 263            | 0        | Locked, all dimensions `not-run` |

Lunar's 341 rows cover the core innate powers, every Charm category in
Chapter Five (Shapechanging I/II/III, Body Enhancement I/II, Unarmed Combat
I-V, Melee Combat I/II, Ranged Combat I/II, Defensive I/II/III, Survival and
Healing I/II/III/IV, Perception I/II/III/IV, Stealth, Interaction and
Knowledge/Presence I/II/III/IV, Spirit, and Sorcery-access Charms), and
**all of Chapter Four: Traits** — the altered/new Backgrounds (Artifact,
Backing, Followers, Manse, Mentor, Cult, Heart's Blood, Renown), all three
player Castes (Full Moon, Changing Moon, No Moon) plus Casteless (this
edition has three Castes, not the five from later editions), the Great
Curse (this splat's Limit-Trait analog) and its four Virtue-linked thralls,
and the Face/Renown social-rank system — all visually reviewed against
rendered pages of the supplied PDF (confirmed printed page = PDF page − 3).
No dedicated Lunar-specific Merits/Flaws subsection or Tribe write-up exists
in *Exalted: The Lunars* itself (confirmed absent). That gap is filled by a
second source book: the *Exalted Players Guide*'s universal Chapter One,
"Merits and Flaws" (pp. 18-41/PDF 21-44), now fully transcribed as 88 rows
(44 merits + 44 flaws) applying across all five planned Exalted families,
with splat-specific eligibility/cost caveats (e.g. the Lunars-only Chimera
Flaw; the Celestial-Exalted-only Known Anathema, Permanent Caste Mark,
Greater Curse, and Throwback Flaws; the Abyssals-and-Ghosts-only Death-Taint
Flaw, not applicable to Lunars) captured verbatim in each row's notes.
**Exalted: The Lunars is inventoried cover-to-cover**, and its universal
Merits/Flaws gap is closed via the Players Guide — the second of the five
planned families to reach full primary-sourcebook parity; only the
untriaged cross-splat supplements remain. See
`docs/references/exalted1e/lunar/README.md`.

Abyssal's 440 rows cover the Chapter Three character-creation overview, the
universal Anima Effect, all five Castes, the Abyssal Curse, the Virtues of
Death, the full Resonance mechanic (the Limit-Trait analog, including gain,
loss, and the 1-10 manifestation table), the-title, Useful Crafts, the
Cult-and-Abyssals exclusion, all eleven altered/new Backgrounds, all 228
Chapter Five Charm rows covering every Ability line for all five Castes
(Dusk, Midnight, Daybreak, Day, Moonshadow), Chapter Six's complete 26-spell
necromancy system across all three circles (Shadowlands 9, Labyrinth 9, Void
8), 4 of 5 Crafts of the Dead (Necrosurgery confirmed to have no dedicated
framework block anywhere in the book), and a confirmed absence of
Abyssal-specific Merits/Flaws, all visually reviewed against rendered pages
of the supplied (image-based) PDF. The long-standing `corpus-rending-blow`
prerequisite gap was also resolved (it was a mistranscription duplicate of
an existing Occult Charm), unblocking `ghost-warding-glyph`.
**Exalted: The Abyssals is now reviewed cover-to-cover for player-facing
mechanics (Chapters One through Six)** — the fifth and final of the five
planned families to reach full primary-sourcebook parity (Chapter Six's
ghost/NPC Arcanoi trees and Chapter Seven's Storytelling material are
GM-facing and intentionally out of scope). The supplement **The Book of
Bone and Ebony** has now also been triaged and added as a second source
book (153 rows): 77 new necromancy spells, a 69-entry small-artifact
catalog (Wonders of the Dead), 5 named artifacts plus 1 embedded spell from
Creations of Bone, and an excluded finding for its Arts of the Dead chapter
(ghost Arcanoi, not player Charms). That supplement's Chapter Four
nemissary/war-machine construction subsystem remains an open resume point;
see `docs/references/exalted1e/abyssal/README.md`.

Sidereal's 252 rows cover the Chapter Three character-creation overview, the
five Auspicious Ability groups, the universal anima effect, all five Castes
(Chosen of Journeys/Serenity/Battles/Secrets/Endings), the Arcane Fate
mechanic (the Limit-Trait analog — a passive forgetting/disguise effect
rather than a rated trait — plus its Paradox/visibility table), ten
new/altered Backgrounds, Chapter Five's general Charm framework (Manipulating
Fate, Restricted/Unusual Charms, Prayer Strips, and more), and now **all 25
of Chapter Five's Caste-and-Ability Charm trees in full** across all five
Castes (Journeys, Serenity, Battles, Secrets, Endings — 152 Charms total,
including the Endings Caste's dedicated Violet Bier of Sorrows Martial Arts
style), reviewed against the supplied PDF (confirmed printed page = PDF page
− 3, including through Chapter Five), the general secret Martial Arts
framework, and all three of the book's named secret Martial Arts styles in
full (Charcoal March of Spiders, 12 Charms; Prismatic Arrangement of
Creation, 16 Charms; Citrine Poxes of Contagion, 13 Charms), plus the full
Sidereal Astrology system closing Chapter Six (the rules framework,
Resplendent Destinies, and the complete named-College catalog: the Houses of
Journeys, Leisure, War, Secrets, and Endings plus the five Greater Signs of
the Maidens), and cross-referenced sorcery spells/a Specialized Prayer.
Merits/Flaws are confirmed genuinely absent from this book (re-verified via
its full alphabetical index). **Exalted: The Sidereals is now reviewed
cover-to-cover for Chapters One through Six** — the fourth of the five
planned families to reach full primary-sourcebook parity (Chapter Seven
onward is Storytelling/setting material and out of scope); see
`docs/references/exalted1e/sidereal/README.md`.

Alchemical's 207 rows cover the character-creation overview, the universal
Anima Banner effect, Artificial Metabolism, Life/Death/the Soulgem,
Refitting/Essence advancement, all five material-named Castes (Orichalcum,
Moonsilver, Jade, Starmetal, Soulsteel) plus the apocryphal sixth "Adamant"
legend, the Clarity trait (this splat's Limit-Trait analog, including its
Dissonance corruption and the 0-10 effects table), six new/altered
Backgrounds, the Chapter Three Charm-system framing (Charm Slots, Panoplies,
Submodules, Arrays), the two General Attribute-Augmentation Charms, all nine
of Chapter Three's Charm trees in full (Close Combat, Ranged Combat, Might
and Mobility, Social, Stealth and Disguise, Sensory and Spiritual, Medical,
Cognitive, and Essence and Weaving — completing Chapter Three), the complete
Chapter Four weaving-protocol catalog (49 rows) that the Man-Machine and
God-Machine Weaving Engine Charms run through, and now **the rest of
Chapter Four's character-facing material** (31 more rows): the three
Autochthonian-only alchemy formulae, the full Autochthonian Technology
artifact catalog (15 items), and the full Warfare and Transportation
sections — completing all of Chapter Four (Chapter Four's Storyteller-side
lore, NPC stat blocks, and setting flavor were reviewed and intentionally
excluded), reviewed against the supplied PDF's real text layer (printed page
= PDF page − 1) with spot-checked renders, plus a full triage of the
adventure-seed Chapters Five through Seven, which yielded exactly one more
player-facing item (the Steamcar, Refurbished expedition vehicle) and were
otherwise confirmed to be GM/NPC/plot content. **Alchemical is now reviewed
cover-to-cover** — the first of the five planned families to reach full
primary-sourcebook parity; see
`docs/references/exalted1e/alchemical/README.md`.

Fair Folk's 263 rows cover both character-creation tracks (common and noble
raksha), the four Castes (Diplomat/Entertainer/Warrior/Worker) and their
twelve noble hybrid archetypes, the five Grace traits that Charms key off
instead of Attributes/Abilities, the Bedlam mechanic (this splat's
Limit-Trait analog, split into four per-Virtue Curses rather than a single
universal trait), nine new/altered Backgrounds, all of Chapter Five:
Raksha Magic end to end (all five per-Grace Charm trees — 194 Charms — the
universal Assumption-type Charm tree, the Vexing/Questing rules, and
Glamour Sorcery/Wyld Artifacts/Adjurations/Behemoths plus the
narrowly-scoped sixth shinma Nirupadhika), and now a triage pass across
Chapters One, Two, Six, and Seven that added the two remaining
genuinely player-facing items (the Gossamer Manta vehicle and the
post-creation Experience and Training Time table) and definitively
confirmed, via an exhaustive book-wide text search, that Fair Folk has no
Merits/Flaws section anywhere in the book. **Exalted: The Fair Folk is now
reviewed cover to cover** — the third of the five planned families to
reach full primary-sourcebook parity (Chapter Six's Mountain Folk, a
wholly separate playable-adjacent race, was deliberately not inventoried
as out of Fair Folk/raksha scope); see
`docs/references/exalted1e/fair-folk/README.md`.

All five families have now been reviewed cover-to-cover against their
primary source books for player-facing mechanics — Alchemical, Lunar, Fair
Folk, Sidereal, and Abyssal, in that order. The project owner's remaining
cross-splat supplements (Blood and Salt, Book of Bone and Ebony, Book of
Three Circles, Savage Seas, Savant and Sorcerer, the Players Guide, and the
Storyteller's Companion) are still untriaged, and no family has anything
promoted to a production catalog yet.

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
