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

| Family     | Source manifest                                                                                        | Inventory rows | Promoted | Certification                    |
| ---------- | ------------------------------------------------------------------------------------------------------ | -------------- | -------- | -------------------------------- |
| Lunar      | Created (Exalted: The Lunars + Exalted Players Guide + Savant and Sorcerer + Book of Three Circles)    | 561            | 0        | Locked, all dimensions `not-run` |
| Abyssal    | Created (Exalted: The Abyssals + Book of Bone and Ebony + Savant and Sorcerer + Exalted Players Guide) | 669            | 0        | Locked, all dimensions `not-run` |
| Sidereal   | Created (Exalted: The Sidereals + Savant and Sorcerer + Book of Three Circles)                         | 472            | 0        | Locked, all dimensions `not-run` |
| Alchemical | Created (Exalted: The Autochthonians + Exalted Players Guide)                                          | 277            | 0        | Locked, all dimensions `not-run` |
| Fair Folk  | Created (Exalted: The Fair Folk + Exalted Players Guide)                                               | 336            | 0        | Locked, all dimensions `not-run` |

Lunar's 561 rows cover the core innate powers, every Charm category in
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
in _Exalted: The Lunars_ itself (confirmed absent). That gap is filled by a
second source book: the _Exalted Players Guide_'s universal Chapter One,
"Merits and Flaws" (pp. 18-41/PDF 21-44), now fully transcribed as 88 rows
(44 merits + 44 flaws) applying across all five planned Exalted families,
with splat-specific eligibility/cost caveats (e.g. the Lunars-only Chimera
Flaw; the Celestial-Exalted-only Known Anathema, Permanent Caste Mark,
Greater Curse, and Throwback Flaws; the Abyssals-and-Ghosts-only Death-Taint
Flaw, not applicable to Lunars) captured verbatim in each row's notes.
**Exalted: The Lunars is inventoried cover-to-cover**, and its universal
Merits/Flaws gap is closed via the Players Guide — the second of the five
planned families to reach full primary-sourcebook parity. A later pass then
triaged the two cross-splat sorcery/artifice supplements this project's
Abyssal and Sidereal inventories had already covered, **Savant and
Sorcerer** and **Book of Three Circles**, and added them as third/fourth
source books (220 more rows), using Lunar's own `terrestrial-circle-sorcery`
and `celestial-circle-sorcery` Charms as the enabling prerequisites: the
complete Chapter Five Terrestrial and Celestial Circle spell catalog (84
selectable spells), a 102-entry Hearthstone catalog (15 Sample Hearthstones
from Savant and Sorcerer's Chapter Three plus 87 more from Book of Three
Circles' Chapter Six image-based "long roll"), a 13-row Artifice and
Enchantment catalog from Savant and Sorcerer Chapter Two (the
Artifact-rating framework, Drawback/creation-process rules, two named
Merits including the Moonsilver Initiate Merit whose cost the book itself
halves for Lunars, a Magical Materials reference, and 5 selectable Sample
Artifacts), a 13-row Warstriders appendix (the
overview/operation/benefits-limitations/maintenance framework, all five
warstrider design classes as selectable Artifact-rated equipment — Royal is
explicitly attested to a "scant handful" of First Age Lunar pilots in the
book's own text — weapon-catalog references, and the moonsilver-native
Proteus Gauntlet artifact), and an 8-row skim of Chapter One (Magical
Theory) and Chapter Four (Practical Summonings). Most of this pass's rows
were adapted from this project's already-verified Exalted: The Sidereals
transcription of the identical sourcebook prose (same citation, mechanics,
and cost; only compatibility text and cross-references were updated for
Lunar), with two wholly new Lunar-specific rows — "In-Game Creation: the
Lunar Exalted" (Savant and Sorcerer, Chapter Two) and "Lunar Sorcery
Initiation: the No Moon Monopoly" (Savant and Sorcerer, Chapter One's "No
Moons" sidebar) — read directly from the source PDF, since neither the
Abyssal nor Sidereal inventory had transcribed those splat-specific
sections. Per this project's Solar Circle Sorcery eligibility rule, Book of
Three Circles' Chapter Four (Solar Circle Sorcery) remains explicitly out
of scope, since Lunars do not have Solar Circle Sorcery access. **Exalted:
The Lunars' full four-source-book inventory (core book, Exalted Players
Guide, Savant and Sorcerer, and Book of Three Circles) is now complete**
for this pass; only the untriaged cross-splat supplements beyond these four
remain. See `docs/references/exalted1e/lunar/README.md`.

Abyssal's 669 rows cover the Chapter Three character-creation overview, the
universal Anima Effect, all five Castes, the Abyssal Curse, the Virtues of
Death, the full Resonance mechanic (the Limit-Trait analog, including gain,
loss, and the 1-10 manifestation table), the-title, Useful Crafts, the
Cult-and-Abyssals exclusion, all eleven altered/new Backgrounds, all 228
Chapter Five Charm rows covering every Ability line for all five Castes
(Dusk, Midnight, Daybreak, Day, Moonshadow), Chapter Six's complete 26-spell
necromancy system across all three circles (Shadowlands 9, Labyrinth 9, Void
8), 4 of 5 Crafts of the Dead (Necrosurgery confirmed to have no dedicated
framework block anywhere in the book), and a confirmed absence of
Abyssal-specific Merits/Flaws in the core book itself (that gap is now
closed via a fourth source book, the Exalted Players Guide — see below),
all visually reviewed against rendered pages
of the supplied (image-based) PDF. The long-standing `corpus-rending-blow`
prerequisite gap was also resolved (it was a mistranscription duplicate of
an existing Occult Charm), unblocking `ghost-warding-glyph`.
**Exalted: The Abyssals is now reviewed cover-to-cover for player-facing
mechanics (Chapters One through Six)** — the fifth and final of the five
planned families to reach full primary-sourcebook parity (Chapter Six's
ghost/NPC Arcanoi trees and Chapter Seven's Storytelling material are
GM-facing and intentionally out of scope). The supplement **The Book of
Bone and Ebony** has now also been triaged and added as a second source
book (177 rows): 80 new necromancy spells, a 69-entry small-artifact
catalog (Wonders of the Dead), 5 named artifacts plus 1 embedded spell from
Creations of Bone, an excluded finding for its Arts of the Dead chapter
(ghost Arcanoi, not player Charms), and Chapter Four's remaining nemissary/
war-machine construction subsystem plus its preceding Armies of the Dead
troop-logistics material (24 rows: 5 selectable, 13 reference-only, 5
gm-only, 1 excluded — see `docs/references/exalted1e/abyssal/README.md`
for the full per-row disposition breakdown). **The Book of Bone and Ebony
supplement is now fully triaged, with no remaining resume points.**
A cross-splat supplement, **Savant and Sorcerer** — which explicitly
supersedes the older _Book of Three Circles_ as this edition's official
magic book — has now also been triaged and added as a third source book
(125 rows): the complete Chapter Five Terrestrial and Celestial Circle
spell catalog (84 selectable spells, cross-checked against the chapter's
own page-by-page spell-header count), that same chapter's Solar Circle
(Circle of Adamant) spells (9 rows, marked reference-only rather than
selectable — see below), the 15-entry Sample Hearthstones catalog (three
per level, Levels One through Five, including an Abyssal-themed Level Four
stone, The Ice Gem) plus its Hearthstone formation/Theme/Expression
framework, 5 Sample Artifacts (including Soul Mirror, a soulsteel grand
daiklave explicitly written to call out Abyssals) plus the artifact-creation
framework, and the Appendix: Warstriders (the general piloting/benefits/
limitations framework, all five warstrider classes — including the
explicitly Abyssal/Deathlord-flavored Royal-class soulsteel-and-Abyssal-iron
variant and the Juggernaut class favored by Abyssal deathknights — the
Proteus Gauntlet artifact, and a weapon-table summary), plus excluded/gm-only
findings for Chapter One (Magical Theory, pure lore) and Chapter Four
(Practical Summonings, a Storyteller-facing demon/elemental summoning
framework). This pass also resolved the open question of Abyssal Solar
Circle Sorcery access: _Book of Three Circles_ Chapter Four's intro sidebar
claims only, as flavor text, that "the Abyssal Exalted have recently
demonstrated the ability to practice this form of sorcery," but neither
book contains an enabling Charm or rule that actually grants player-facing
Solar Circle Sorcery access to Abyssal characters, so its spells are
catalogued as reference-only rather than selectable. **Exalted: The
Abyssals' full three-source-book inventory (core book, Book of Bone and
Ebony, and Savant and Sorcerer) is now complete** for this pass. A fourth
source book, the cross-splat **Exalted Players Guide**, has now also been
triaged and added to close the confirmed Merits/Flaws gap noted above (80
rows: 40 merits + 40 flaws). Since that chapter is explicitly universal
across all five planned Exalted families and Lunar's own inventory already
transcribed and verified all 88 `pg-merit-*`/`pg-flaw-*` rows (see Lunar's
paragraph above), this pass derived Abyssal's rows directly from that
verified transcription rather than independently re-reading the source
PDF, evaluating each row's own eligibility/cost notes plus Abyssal's
core-book framing (Resonance/the Abyssal Curse, the Virtues of Death, and
this splat's deathknight nature) to decide inclusion, exclusion, or
adaptation. 8 of the 88 were skipped as inapplicable (Prodigy, Terrestrial
Bloodline, Past Lives, and Legendary Breeding — scoped to other splats with
no Abyssal carve-out; Limited Forms and Chimera — Lunars-only; Known
Anathema and Greater Curse — "Celestial Exalted only," the latter also tied
to the Limit Trait this splat replaces with Resonance). Several rows carry
genuinely Abyssal-specific text straight from the source: Taint's Warning
(Solars/Abyssals only, opposite mechanics per splat), Eternal Vow
(Solars/Lunars/Abyssals only), the Abyssals-and-Ghosts-only Death-Taint
Flaw (directly modifying Resonance), Priest (a free grant for the Midnight
Caste), Destiny (Abyssal/Infernal Exaltation explicitly capped at 1-2
points), Dark Fate (the dead and Abyssals named explicitly), Sun-Seared
and Pain Tolerance (both name deathknights outright), Disfigured (an
explicit Abyssal rotted-visage variant), and Permanent Caste Mark and
Throwback (each headered "Celestial Exalted only" but with a separate
Abyssal variant defined in its own body text, included per the project
owner's instruction to trust body text over a header/body inconsistency).
**Exalted: The Abyssals' full four-source-book inventory (core book, Book
of Bone and Ebony, Savant and Sorcerer, and Exalted Players Guide) is now
complete** for this pass — the fourth (of the four families needing this
chapter; Sidereal's own Merits/Flaws are confirmed genuinely absent with no
Players-Guide-filled gap) to close its universal Merits/Flaws gap via the
Players Guide, and the last of the five planned families overall to reach
full primary-sourcebook parity; see
`docs/references/exalted1e/abyssal/README.md`.

Sidereal's core book contributes 252 rows covering the Chapter Three
character-creation overview, the five Auspicious Ability groups, the
universal anima effect, all five Castes (Chosen of
Journeys/Serenity/Battles/Secrets/Endings), the Arcane Fate mechanic (the
Limit-Trait analog — a passive forgetting/disguise effect rather than a
rated trait — plus its Paradox/visibility table), ten new/altered
Backgrounds, Chapter Five's general Charm framework (Manipulating Fate,
Restricted/Unusual Charms, Prayer Strips, and more), all 25 of Chapter
Five's Caste-and-Ability Charm trees in full across all five Castes
(Journeys, Serenity, Battles, Secrets, Endings — 152 Charms total, including
the Endings Caste's dedicated Violet Bier of Sorrows Martial Arts style),
reviewed against the supplied PDF (confirmed printed page = PDF page − 3,
including through Chapter Five), the general secret Martial Arts framework,
all three of the book's named secret Martial Arts styles in full (Charcoal
March of Spiders, 12 Charms; Prismatic Arrangement of Creation, 16 Charms;
Citrine Poxes of Contagion, 13 Charms), the full Sidereal Astrology system
closing Chapter Six (the rules framework, Resplendent Destinies, and the
complete named-College catalog: the Houses of Journeys, Leisure, War,
Secrets, and Endings plus the five Greater Signs of the Maidens), and
cross-referenced sorcery spells/a Specialized Prayer. Merits/Flaws are
confirmed genuinely absent from this book (re-verified via its full
alphabetical index). Two cross-splat sorcery/artifice supplements, **Savant
and Sorcerer** and **Book of Three Circles**, have now also been triaged and
added as second/third source books (220 more rows): the complete Chapter
Five Terrestrial and Celestial Circle spell catalog (84 selectable spells,
cross-checked against the chapter's own page-by-page spell-header count), a
102-entry Hearthstone catalog (15 Sample Hearthstones from Savant and
Sorcerer's Chapter Three plus 87 more from Book of Three Circles' Chapter
Six image-based 'long roll,' since Savant and Sorcerer's own intro sidebar
states it does not reprint that catalog), a 13-row Artifice and Enchantment
catalog from Savant and Sorcerer Chapter Two (the Artifact-rating framework,
Drawback/creation-process rules, Sidereal-specific creation notes, two named
Merits, a Magical Materials reference, and 5 selectable Sample Artifacts
including Soul Mirror), a 13-row Warstriders appendix (the
overview/operation/benefits-limitations/maintenance framework, all five
warstrider design classes as selectable Artifact-rated equipment, weapon-
catalog references, and the Proteus Gauntlet artifact), and an 8-row skim of
Chapter One (Magical Theory) and Chapter Four (Practical Summonings) that
surfaced only Storyteller-facing or setting-flavor content, bundled into
gm-only/reference-only rows rather than dozens of granular entries. Book of
Three Circles' Chapter Four (Solar Circle Sorcery) remains explicitly out of
scope, since Sidereals do not have Solar Circle Sorcery access. **Exalted:
The Sidereals' full three-source-book inventory (core book, Savant and
Sorcerer, and Book of Three Circles) is now complete** for this pass — the
fourth of the five planned families to reach full primary-sourcebook parity
(Chapter Seven onward is Storytelling/setting material and out of scope);
see `docs/references/exalted1e/sidereal/README.md`.

Alchemical's 277 rows cover the character-creation overview, the universal
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
God-Machine Weaving Engine Charms run through, the rest of Chapter Four's
character-facing material (31 more rows): the three Autochthonian-only
alchemy formulae, the full Autochthonian Technology artifact catalog (15
items), and the full Warfare and Transportation sections — completing all of
Chapter Four (Chapter Four's Storyteller-side lore, NPC stat blocks, and
setting flavor were reviewed and intentionally excluded), reviewed against
the supplied PDF's real text layer (printed page = PDF page − 1) with
spot-checked renders, and a full triage of the adventure-seed Chapters Five
through Seven, which yielded exactly one more player-facing item (the
Steamcar, Refurbished expedition vehicle) and were otherwise confirmed to be
GM/NPC/plot content — completing a cover-to-cover review of _Exalted: The
Autochthonians_ itself, the first of the five planned families to reach that
milestone. No dedicated Alchemical Merits/Flaws chapter exists in that book
beyond the Alchemical-exclusive Gremlin Syndrome/Dissonance Flaw (confirmed
absent, not merely unreviewed). That universal gap is now filled by a second
source book, the _Exalted Players Guide_'s Chapter One, "Merits and Flaws"
(pp. 18-41/PDF 19-42) — **70 more rows (35 merits + 35 flaws)**, derived
from Lunar's already-verified transcription of that chapter's full 88
`pg-merit-*`/`pg-flaw-*` rows rather than an independent re-read, since the
chapter is explicitly universal across all five planned families and each
Lunar row's own notes already capture splat-specific eligibility/cost
caveats verbatim. 18 of the 88 were skipped as inapplicable to a soulless,
vat-built construct Exalt with no blood lineage, no reincarnation cycle, and
no Sorcery access (e.g. the Dragon-Blooded-only Legendary Breeding, the
Celestial-Exalted-only Known Anathema/Permanent Caste Mark/Greater
Curse/Throwback, the Abyssals-and-Ghosts-only Death-Taint, and Alchemicals'
own explicit exclusion from Prodigy); several included rows were adapted for
Alchemical's construct nature and setting (Large Size/Small reframed around
Essence-linked size growth instead of Lunar shapechanging, Cache/Debt
reframed around the Class Background instead of Resources, Vice/Derangement
cross-referenced to Clarity instead of the Great Curse, and Sun-Seared/
Hidden Manse flagged as only fully relevant once a story reaches Creation),
each judgment call flagged verbatim in that row's own notes. **Alchemical is
now reviewed cover-to-cover, including the universal Merits/Flaws gap** —
the first of the five planned families to reach full primary-sourcebook
parity; see `docs/references/exalted1e/alchemical/README.md`.

Fair Folk's 263 core-book rows cover both character-creation tracks (common
and noble raksha), the four Castes (Diplomat/Entertainer/Warrior/Worker) and
their twelve noble hybrid archetypes, the five Grace traits that Charms key
off instead of Attributes/Abilities, the Bedlam mechanic (this splat's
Limit-Trait analog, split into four per-Virtue Curses rather than a single
universal trait), nine new/altered Backgrounds, all of Chapter Five:
Raksha Magic end to end (all five per-Grace Charm trees — 194 Charms — the
universal Assumption-type Charm tree, the Vexing/Questing rules, and
Glamour Sorcery/Wyld Artifacts/Adjurations/Behemoths plus the
narrowly-scoped sixth shinma Nirupadhika), and a triage pass across
Chapters One, Two, Six, and Seven that added the two remaining
genuinely player-facing items (the Gossamer Manta vehicle and the
post-creation Experience and Training Time table) and definitively
confirmed, via an exhaustive book-wide text search, that _Exalted: The Fair
Folk_ has no Merits/Flaws section of its own anywhere in the book. That
universal gap is now filled by a second source book, the _Exalted Players
Guide_'s Chapter One, "Merits and Flaws" (pp. 18-41/PDF 19-42) — **73 more
rows (37 merits + 36 flaws)**, derived from Lunar's already-verified
transcription of that chapter's full 88 `pg-merit-*`/`pg-flaw-*` rows
rather than an independent re-read, since the chapter is explicitly
universal across all five planned families and each Lunar row's own notes
already capture splat-specific eligibility/cost caveats verbatim. 15 of the
88 were skipped as inapplicable to a raksha — a being of pure Wyld/chaos
that is not Exalted at all, has no Essence-reincarnation cycle, no anima or
Caste Mark, and no access to core Exalted Sorcery (e.g. the
Dragon-Blooded-only Legendary Breeding, the Celestial-Exalted-only Known
Anathema/Permanent Caste Mark/Greater Curse/Throwback, the
Abyssals-and-Ghosts-only Death-Taint, the Lunars-only Chimera/Limited Forms,
and the Exalted-only Sworn Brotherhood/Beacon of Power); several included
rows were reinterpreted for the raksha's own framework (Large Size/Small
reframed around a raksha's Assumption-type shapeshifting Charms instead of
Lunar forms; Cache/Debt reframed around the Gossamer Background instead of
Resources, using Gossamer's own documented "effective Resources" dot table;
Vice/Callous cross-referenced to Bedlam instead of the Great Curse; and
Mutation and Weak Essence flagged as unusually strong fits, since raksha are
Wyld-stuff given shape and every raksha starts with Essence 2 exactly as
the Weak Essence Flaw's own "other magical beings" clause requires), each
judgment call flagged verbatim in that row's own notes. **Exalted: The Fair
Folk is now reviewed cover to cover, including the universal Merits/Flaws
gap** — the third of the five planned families to reach full
primary-sourcebook parity (Chapter Six's Mountain Folk, a wholly separate
playable-adjacent race, was deliberately not inventoried as out of Fair
Folk/raksha scope); see `docs/references/exalted1e/fair-folk/README.md`.

All five families have now been reviewed cover-to-cover against their
primary source books for player-facing mechanics — Alchemical, Lunar, Fair
Folk, Sidereal, and Abyssal, in that order. Since then, several cross-splat
supplements have also been triaged for the families that need them: the
_Exalted Players Guide_'s universal Merits/Flaws chapter (Alchemical,
Lunar, Fair Folk, and Abyssal — every family except Sidereal, whose own
Merits/Flaws are confirmed genuinely absent with no gap to fill), _Savant
and Sorcerer_ (Sidereal and Abyssal), _Book of Three Circles_ (Sidereal,
consulted for Abyssal only to resolve the Solar Circle Sorcery access
question), and _Book of Bone and Ebony_ (Abyssal). The project owner's
remaining cross-splat supplements (Blood and Salt, Savage Seas, and the
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
