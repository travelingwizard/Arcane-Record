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

| Family     | Source manifest                                                                                                                                                         | Inventory rows | Promoted                                                     | Certification                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Lunar      | Created (Exalted: The Lunars + Exalted Players Guide + Savant and Sorcerer + Book of Three Circles + Exalted Storyteller's Companion + Savage Seas + Blood and Salt)    | 598            | 0                                                            | Locked, all dimensions `not-run`                                                                                                       |
| Abyssal    | Created (Exalted: The Abyssals + Book of Bone and Ebony + Savant and Sorcerer + Exalted Players Guide + Exalted Storyteller's Companion + Savage Seas + Blood and Salt) | 700            | 505 of 505 promotable (catalog dimension complete, Phase 1e) | Locked; catalog/rules/creator/migration tests all pass, `browserTests` `not-run` and `certifiedAt` deliberately `null` pending Phase 6 |
| Sidereal   | Created (Exalted: The Sidereals + Savant and Sorcerer + Book of Three Circles + Exalted Storyteller's Companion + Savage Seas + Exalted Players Guide + Blood and Salt) | 583            | 360                                                          | Locked, all dimensions `not-run`                                                                                                       |
| Alchemical | Created (Exalted: The Autochthonians + Exalted Players Guide + Exalted Storyteller's Companion + Savage Seas + Blood and Salt)                                          | 305            | 0                                                            | Locked, all dimensions `not-run`                                                                                                       |
| Fair Folk  | Created (Exalted: The Fair Folk + Exalted Players Guide + Exalted Storyteller's Companion + Savage Seas + Blood and Salt)                                               | 365            | 0                                                            | Locked, all dimensions `not-run`                                                                                                       |

Lunar's 582 rows cover the core innate powers, every Charm category in
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
remain. A final pass then read the **Exalted Storyteller's Companion**'s
Chapter Two ("The Celestial Exalted") Lunar section and Chapter Four
("Further Wonders") universal artifact catalog, adding 12 rows as a fifth
source book: six Lunar-specific Charms embedded in otherwise-narrative
Chapter Two prose (Tentacles, Summon Wild Beasts, Acid Spit, Mighty Thews,
Strides of the Panther, and the Counting Coup debt-and-scar social custom)
and six universal cross-splat Sample Artifacts from Chapter Four (Ghost
Cestus, Sling Bow of Ice, The Golden Viper, Land Ship, Singing Staff, and
the Eye of Autochthon), transcribed into Lunar's inventory as the master
copy for later derivation into the other four families; the rest of the
book's Chapters One and Three were skimmed and confirmed to hold only
GM/NPC/setting material. A final pass then added 9 more rows (573 → 582)
freshly transcribed from a sixth source book, **Savage Seas**, whose
"Artifacts of the Waves" section (Chapter Four, printed pp. 123-127/PDF
124-128) is likewise a universal, non-splat-restricted naval-artifact
catalog, unlike that chapter's earlier Solar/Dragon-Blooded-only "Magics of
the Sea" Charms section, which remains correctly out of scope. Those 9
rows — Cargo Preservation Spindles, Armor of Aquatic Puissance, Steelsilk
Sails, Storm Sapphire, Cord of Winds, Wavecleaver Daiklaive, Light
Implosion Bow, Lightning Ballista, and a reference-only Artifact Ship
Weapons summary table — were adapted from this project's already-verified
Abyssal and Sidereal transcriptions of the identical sourcebook prose (same
citations, mechanics, and cost; only each row's `compatibility` text was
updated for Lunar), with the Storm Sapphire Effect Table and the Light
Implosion Bow/Lightning Ballista dot ratings specifically re-rendered and
re-read directly from the source PDF to confirm accuracy, matching the
brief's own flagged discrepancy check. No Autochthonia-style
setting-restriction caveat applies for Lunar, since Lunars are native
Creation-dwellers; Lunar's own existing Survival Charms (Whale-Breath
Technique, Gill-Breathing Technique, Sealskin Endurance) and the No Moon
caste's favored Totem Animals ("creatures of the deep ocean") already
establish a genuine thematic tie to the sea, so this catalog carries the
least-caveated `compatibility` text of any family's copy. A final
cross-splat supplement-triage pass then added 16 more rows (582 → 598)
from a seventh source book, **Exalted: Blood and Salt**, a regional
sourcebook about An-Teng and the Lintha Family. A full cover-to-cover read
confirmed the vast majority of its Background/Artifact/Charm/Sorcery/
Hearthstone keyword hits sit inside NPC/monster stat blocks (GM-only), but
a smaller genuinely player-facing set was transcribed as Lunar's master
copy for identical derivation into the other four families: a Lintha
Character Backgrounds reinterpretation sidebar and a Bluehaven
approach-navigation rule (both reference-only), a bundled regional
Character Concepts row, seven new Artifacts (Automaton Assassin,
Sailcutter Chakram, Ancestor Sash, the Seven Lotus Crown, the Masks That
Command the Animals, the Coral Crown, and the Talisman of the Cult of
Dukantha, which grants Infernal sorcery access independent of the bearer's
own normal sorcery Charms), one new Hearthstone (Jewel of Stability), three
mundane equipment items (Fire Arrow, Southern Fire Arrow, Water Shoes), and
two new Terrestrial Circle spells (Song of the Lintha, Water's Ally). Four
already-inventoried artifacts (Cord of Winds, Light Implosion Bow,
Steelsilk Sails, Storm Sapphire) plus the Gem of Desire Hearthstone and the
Calling the Wind's Kiss/Mast-Shattering Spell spells are reprinted verbatim
in Blood and Salt; each received a citation note on its existing row
instead of a duplicate. See `docs/references/exalted1e/lunar/README.md`.

Abyssal's 700 rows cover the Chapter Three character-creation overview, the
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
complete** for this pass — the fourth of the five planned families to close
its universal Merits/Flaws gap via the Players Guide (Sidereal's own
Players-Guide-filled gap is described further below), and the last of the
five planned families overall to reach full primary-sourcebook parity. A later pass added two small sets of
universal (non-splat-restricted) artifact catalog rows, bringing the total
to 684: 6 rows (`artifact-ghost-cestus`, `artifact-sling-bow-of-ice`,
`artifact-the-golden-viper`, `artifact-land-ship`, `artifact-singing-staff`,
`artifact-eye-of-autochthon`) derived from Lunar's already-verified
transcription of the **Exalted Storyteller's Companion**'s universal
"Further Wonders" artifact catalog — a fifth source book added to this
family's manifest — re-cited to the same pages with no independent
re-read, since none of the 6 rows carries splat-restricting text that would
exclude Abyssal; and 9 rows freshly transcribed from a sixth source book,
**Savage Seas**, whose "Artifacts of the Waves" section (Chapter Four,
printed pp. 123-127) is likewise a universal ship-artifact catalog, unlike
that chapter's earlier Solar/Dragon-Blooded-only "Magics of the Sea" Charms
section, which remains correctly out of scope. Those 9 rows — Cargo
Preservation Spindles, Armor of Aquatic Puissance, Steelsilk Sails, Storm
Sapphire, Cord of Winds, Wavecleaver Daiklaive, Light Implosion Bow,
Lightning Ballista, and a reference-only Artifact Ship Weapons summary
table — are 8 selectable and 1 reference-only: **Armor of Aquatic
Puissance** is marked reference-only specifically for Abyssal because the
source text states verbatim that "No Abyssal is known to own a suit of
this armor (unsurprisingly)," so it is catalogued in full for reference but
not offered as a normal selectable acquisition. A final cross-splat
supplement-triage pass then added 16 more rows (684 → 700) from a seventh
source book, **Exalted: Blood and Salt**: a Lintha Character Backgrounds
reinterpretation sidebar and a Bluehaven approach-navigation rule (both
reference-only), a bundled regional Character Concepts row, seven new
Artifacts (Automaton Assassin, Sailcutter Chakram, Ancestor Sash, the Seven
Lotus Crown, the Masks That Command the Animals, the Coral Crown, and the
Talisman of the Cult of Dukantha, which grants Infernal sorcery access
independent of Abyssal's own necromancy/sorcery Charms), one new
Hearthstone (Jewel of Stability, using this family's unprefixed
Hearthstone-id convention), three mundane equipment items, and two new
Terrestrial Circle spells (`song-of-the-lintha`, `waters-ally`). Four
already-inventoried artifacts are reprinted verbatim in Blood and Salt and
received citation notes on their existing rows rather than duplicates
(this family's inventory does not carry a Gem of Desire Hearthstone row, so
that particular Blood and Salt reprint had no row to annotate). See
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
(Chapter Seven onward is Storytelling/setting material and out of scope). A
further pass then read the entire Sidereal portion of the **Exalted
Storyteller's Companion**'s Chapter Two ("The Celestial Exalted," printed
pp. 34-41/PDF 35-42) — mostly narrative on post-Usurpation Sidereal society
(Castes, the Immaculate Order relationship, Loom of Fate culture) — and
confirmed its only mechanical content, four "Sample Charms" (Force
Decision, Absence, Wise Choice, Prior Warning), are exact verbatim reprints
of Charms already inventoried from Chapter Five of the core book, so no new
rows were added for that citation; each existing row's `notes` field was
updated to cite the reprint. This book was added to Sidereal's source list
for that citation trail. A quick skim of Chapter One ("The Scarlet Empire")
and Chapter Three ("Spirits and Spirit Courts") found only Dragon-Blooded
sample Charms and Spirit/NPC stat blocks — no player-facing Sidereal or
Lunar exceptions. A final pass then added 15 more rows (472 → 487): six rows
derived from Lunar's already-verified transcription of the **Exalted
Storyteller's Companion**'s universal, cross-splat Chapter Four artifact
catalog ("Further Wonders," printed pp. 77-80/PDF 78-81 — Ghost Cestus,
Sling Bow of Ice, The Golden Viper, Land Ship, Singing Staff, Eye of
Autochthon), each keeping the same id/name/mechanics/cost/citation as the
Lunar master row since no splat-specific restriction excludes Sidereal; and
eight named-artifact rows plus one reference-only summary table, freshly
transcribed from a new fifth source book, **Exalted: Savage Seas** (Cargo
Preservation Spindles, Armor of Aquatic Puissance, Steelsilk Sails, Storm
Sapphire, Cord of Winds, Wavecleaver Daiklaive, Light Implosion Bow,
Lightning Ballista, and the Artifact Ship Weapons summary table), covering
the entire universal, non-splat-restricted "Artifacts of the Waves" naval
catalog in that book's Chapter Four (printed pp. 123-127/PDF 124-128, ending
at the last content page before the back cover). Savage Seas' earlier
"Magics of the Sea" Charms section (printed pp. 114-122/PDF 115-123) is
explicitly Solar/Dragon-Blooded-only per the book's own text and remains out
of scope for Sidereal. A sixth pass then closed Sidereal's own universal
Merits/Flaws gap (confirmed genuinely absent from the core book itself, as
noted above) the same way it was already closed for Abyssal, Alchemical,
and Fair Folk: 80 of the **Exalted Players Guide**'s 88 universal
`pg-merit-*`/`pg-flaw-*` rows (Chapter One, "Merits and Flaws," printed
pp. 18-41/PDF 21-44) were derived from Lunar's already-verified
transcription of that chapter rather than an independent re-read, bringing
Sidereal's own source-book count to six and its inventory from 487 to 567
rows. 8 rows were excluded as inapplicable to a Sidereal Exalted: Chimera
and Limited Forms (Lunar Shapechanging-specific, and Sidereal has no
analogous shapeshifting power), Death Taint (Abyssals-and-Ghosts-only per
its own header), Legendary Breeding, Taint's Warning, Innocuous, and
Eternal Vow (each keyed to a Lunar-specific breeding/Tell/mate-bonding
mechanic with no Sidereal equivalent), and Past Lives (its header names
only Solar and Dragon-Blooded, unlike the textually broader Prescient
Dreamer Merit, which does name Sidereal explicitly and was kept in). Of the
remaining 80 rows, 57 transferred verbatim (unchanged id/name/mechanics/
cost/citation, using the shared `pg-merit-*`/`pg-flaw-*` id scheme already
used for Abyssal, Alchemical, and Fair Folk) and 23 needed a Sidereal-
specific reinterpretation flagged in that row's own `notes`: dropped
Lunar-shapeshifting-specific carve-outs for Ambidextrous, Double-Jointed,
Large Size, Small, and Disfigured; a textual-inclusion judgment call
including Prodigy (Sidereal is not among the header's named exclusions,
consistent with how Fair Folk's own derivation treated the same row);
genuinely Sidereal-central rows for Priest (all Sidereal Exalted are
automatic, free 1-pt. priests of their initiating astrological college),
Destiny (a Sidereal-specific Destiny 4+ pre-Exaltation threshold, one point
higher than Solar/Lunar's 3+, with a four-point post-Exaltation reduction
instead of three), Lucky (a bespoke Sidereal luck-pool formula and price
cap), Prescient Dreamer (a reduced 2-pt. cost tied to Sidereal's own
fate-based Exaltation), Alternative Divination (a doubled-rituals-per-
purchase benefit naming Sidereal explicitly), Disciple, and Greater Curse
(Sidereal's own Paradox-pool mechanic, cross-referenced to this family's
`sidereal-astrology-paradox` row in place of the Limit-pool version used by
Solar/Lunar); reinterpreted cross-references swapping in Sidereal's own
mechanics for Terrestrial Bloodline, Sworn Brotherhood, Brigid's Heir, and
Amnesia (whose dropped Past-Lives cross-reference was replaced with
Sidereal's own Savant Background as its thematic analog for recovering
First Age memory); and one especially notable eligibility caveat, Dark
Fate, kept selectable but flagged as normally **exempt** for ordinary
Sidereals, who serve the Bureau of Destiny — purchasable only by a renegade
Sidereal who has betrayed that role. No new Sidereal-specific Background or
mechanic needed to be invented from scratch. A final cross-splat
supplement-triage pass then added 16 more rows (567 → 583) from a seventh
source book, **Exalted: Blood and Salt**: a Lintha Character Backgrounds
reinterpretation sidebar and a Bluehaven approach-navigation rule (both
reference-only), a bundled regional Character Concepts row, seven new
Artifacts (Automaton Assassin, Sailcutter Chakram, Ancestor Sash, the Seven
Lotus Crown, the Masks That Command the Animals, the Coral Crown, and the
Talisman of the Cult of Dukantha), one new Hearthstone (Jewel of Stability),
three mundane equipment items, and two new Terrestrial Circle spells (Song
of the Lintha, Water's Ally). Four already-inventoried artifacts plus the
Gem of Desire Hearthstone and the Calling the Wind's Kiss/Mast-Shattering
Spell spells are reprinted verbatim in Blood and Salt; each received a
citation note on its existing row instead of a duplicate. See
`docs/references/exalted1e/sidereal/README.md`.

Alchemical's 291 rows cover the character-creation overview, the universal
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
parity. Two more small universal artifact catalogs were layered on after
that milestone: **six rows derived from the Exalted Storyteller's
Companion's universal Chapter Four, "Further Wonders"** (Ghost Cestus, Sling
Bow of Ice, The Golden Viper, Land Ship, Singing Staff, Eye of Autochthon),
copied unchanged (id/name/mechanics/cost/citation) from Lunar's
already-verified master transcription of that cross-splat chapter, since
none of it required independent re-reading; all six transfer essentially
cleanly to a construct body, with two flagged judgment calls (The Golden
Viper's flesh-to-gold bite is ambiguous for a vat-built frame that already
incorporates the Five Magical Materials; the Eye of Autochthon, despite
being literally created by Autochthon himself, is written in Creation-native
terms with no Autochthonian equivalent, so it is kept selectable but flagged
as only meaningful once a story reaches Creation). And **eight rows freshly
transcribed from Savage Seas' "Artifacts of the Waves" naval catalog**
(Cargo Preservation Spindles, Armor of Aquatic Puissance, Steelsilk Sails,
Storm Sapphire, Cord of Winds, Wavecleaver Daiklaive, Light Implosion Bow,
Lightning Ballista), read from rendered page images since that PDF has no
text layer, covering the catalog's full printed pp. 123-127 (PDF 124-128)
run to the end of the book's content; all eight are kept selectable but
flagged with an Autochthonia-has-no-Creation-style-oceans caveat mirroring
the Sun-Seared/Hidden Manse precedent above, since naval equipment has no
mechanical dependency on a biological body but is only obtainable once a
story reaches Creation's seas. A final cross-splat supplement-triage pass
then added 14 more rows (291 → 305) from **Exalted: Blood and Salt**: a
Lintha Character Backgrounds reinterpretation sidebar and a Bluehaven
approach-navigation rule (both reference-only), a bundled regional
Character Concepts row, seven new Artifacts (Automaton Assassin, Sailcutter
Chakram, Ancestor Sash, the Seven Lotus Crown, the Masks That Command the
Animals, the Coral Crown, and the Talisman of the Cult of Dukantha, which
grants Infernal sorcery access entirely independent of any splat's own
normal sorcery Charms), one new Hearthstone (Jewel of Stability, the first
Hearthstone row in this family's inventory), and three mundane equipment
items; no new Terrestrial Circle spells were added since Alchemicals do not
use standard sorcery. Four already-inventoried artifacts are reprinted
verbatim in Blood and Salt and received citation notes on their existing
rows rather than duplicates, and the naval-flavored new items (Sailcutter
Chakram, Fire Arrow, Southern Fire Arrow, Water Shoes) carry the same
Autochthonia caveat as the Savage Seas rows above; see
`docs/references/exalted1e/alchemical/README.md`.

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
Folk/raksha scope). A later pass added two small sets of universal
(non-splat-restricted) artifact catalog rows, bringing the total from 336 to
351: 6 rows (`artifact-ghost-cestus`, `artifact-sling-bow-of-ice`,
`artifact-the-golden-viper`, `artifact-land-ship`, `artifact-singing-staff`,
`artifact-eye-of-autochthon`) derived from Lunar's already-verified
transcription of the _Exalted Storyteller's Companion_'s universal "Further
Wonders" artifact catalog — a fifth source book added to this family's
manifest — re-cited to the same pages with no independent re-read, since a
raksha's own Essence rating and mote pool (Essence 2, pool Essence x 10, per
`fair-folk-creation-overview-common` / `-noble`) satisfy every
"Essence-manipulating wielder" requirement exactly as any Exalt's would; and
9 rows freshly transcribed from a sixth source book, _Savage Seas_, whose
"Artifacts of the Waves" section (Chapter Four, printed pp. 123-127) is
likewise a universal ship-artifact catalog, unlike that chapter's earlier
Solar/Dragon-Blooded-only "Magics of the Sea" Charms section, which remains
correctly out of scope. Those 9 rows — Cargo Preservation Spindles, Armor of
Aquatic Puissance, Steelsilk Sails, Storm Sapphire, Cord of Winds,
Wavecleaver Daiklaive, Light Implosion Bow, Lightning Ballista, and a
reference-only Artifact Ship Weapons summary table — are 8 selectable and 1
reference-only. **Light Implosion Bow** is the strongest fit in the batch:
its own text explicitly names "any Exalted type and also Fair Folk and
possibly others" as capable of channeling Essence into it. **Lightning
Ballista** carries the one flagged judgment call: the source calls it
"powerless in the hands of the unExalted," but its actual mechanical
requirement is only that "the firer must be able to manipulate Essence,"
which a raksha satisfies — interpreting the binding requirement rather than
the more pointed word choice. Two low-zoom transcription errors (the Storm
Sapphire Effect Table's Black Sapphire column, and the Lightning Ballista's
hearthstone-variant Artifact rating) were caught and corrected via high-zoom
re-renders before this pass was considered complete. A final cross-splat
supplement-triage pass then added 14 more rows (351 → 365) from a seventh
source book, **Exalted: Blood and Salt**: a Lintha Character Backgrounds
reinterpretation sidebar and a Bluehaven approach-navigation rule (both
reference-only), a bundled regional Character Concepts row, seven new
Artifacts (Automaton Assassin, Sailcutter Chakram, Ancestor Sash, the Seven
Lotus Crown, the Masks That Command the Animals, the Coral Crown, and the
Talisman of the Cult of Dukantha, which grants Infernal sorcery access
entirely independent of a raksha's own Glamour Sorcery), one new Hearthstone
(Jewel of Stability, the first Hearthstone row in this family's inventory),
and three mundane equipment items; no new Terrestrial Circle spells were
added since Fair Folk use Glamour Sorcery rather than core Exalted Sorcery.
Four already-inventoried artifacts are reprinted verbatim in Blood and Salt
and received citation notes on their existing rows rather than duplicates;
see `docs/references/exalted1e/fair-folk/README.md`.

All five families have now been reviewed cover-to-cover against their
primary source books for player-facing mechanics — Alchemical, Lunar, Fair
Folk, Sidereal, and Abyssal, in that order. Since then, all seven
identified cross-splat supplements have also been fully triaged for every
family that could use them: the _Exalted Players Guide_'s universal
Merits/Flaws chapter (transcribed once into Lunar as the master copy, since
each family's own core book was individually confirmed to have no
comparable system of its own, then derived for Abyssal, Alchemical, Fair
Folk, and finally Sidereal); _Savant and Sorcerer_ and _Book of Three
Circles_ (the sorcery/artifice corpus transcribed into Abyssal first, since
it has access to all three sorcery circles, then derived for Sidereal and
Lunar — Book of Three Circles' own Chapter Four, Solar Circle Sorcery,
correctly excluded for all three since none of them have that access, and
its Hearthstone "long roll" used only as a gap-fill catalog since Savant
and Sorcerer's own text says it does not reprint that list); _Book of Bone
and Ebony_ (Abyssal-exclusive by design, since it is a necromancy/Abyssal
sourcebook with no universal content for the other four — both its main
Charms/spells/artifacts content and its Chapter Four nemissary/war-machine
subsystem are now fully inventoried); the _Exalted Storyteller's
Companion_'s embedded Charms (Lunar and Sidereal, where they appear) and
its universal "Further Wonders" artifact catalog (Lunar as the master
transcription, then derived for Abyssal, Sidereal, Alchemical, and Fair
Folk); _Savage Seas_'s universal "Artifacts of the Waves" naval catalog
(freshly transcribed for Abyssal, Sidereal, Alchemical, and Fair Folk, then
derived for Lunar — its earlier "Magics of the Sea" Charms section
correctly excluded for all five as Solar/Dragon-Blooded-only); and
_Exalted: Blood and Salt_'s handful of genuinely player-facing rows (a
Lintha Character Backgrounds sidebar, a Bluehaven approach-navigation rule,
regional Character Concepts, seven new Artifacts, one new Hearthstone,
three mundane equipment items, and two new Terrestrial Circle spells for
the three splats with standard sorcery access — transcribed once into
Lunar as the master copy, then copied into all five families in the same
pass; the rest of that book's NPC/monster content was confirmed GM-only
and out of scope for all five). No further cross-splat supplements remain
identified for triage.

With full-parity inventory and supplement triage complete for all five
families, work has begun on the schema/code phase, family by family
(simplest core mechanic first). Abyssal Phase 1a is complete: its 16
Backgrounds and 80 Exalted Players Guide Merits/Flaws rows (86 catalog
entries total, since Eternal Vow needed separate merit/flaw variants) are
now real, Zod-validated production catalog entries — the Backgrounds in
`definitions.ts`, the Merits/Flaws folded additively into the existing
shared `dragonblooded-merits-flaws` catalog via each entry's `appliesTo`
field, plus 6 new Abyssal-only entries for rows with no Dragon-Blooded
equivalent. `'abyssal'` is now a legal _stored_ `sheetType` for schema and
test purposes, but it is still absent from `definition.tsx`'s selectable
`variants`, so the family remains fully locked in the app.

Abyssal Phase 1b is also complete: 225 of 227 promotable Chapter Five
Charm rows and 103 of 106 Necromancy spell rows (23 core book + 80 Book of
Bone and Ebony) are now real catalog entries in the new
`abyssal-charms.json`/`abyssal-necromancy.json` files (wrapped by
`abyssal-powers.ts`, mirroring `dragonblooded-powers.ts`'s shape), wired
into `schema.ts` in place of the two `TODO(abyssal-charms)` placeholders.
A new additive `caste` field (Dusk/Midnight/Daybreak/Day/Moonshadow) was
added, scoped to this catalog only. Two disposition-`unresolved` spell
rows (missing mote costs) and three disposition-`selectable`-but-
`unreviewed` rows (2 Charms, 1 spell) were deliberately excluded pending a
follow-up close read. `promotedEntries` is now 414.

Verifying Phase 1c's original scope ("promote Artifacts/Hearthstones/
Warstriders/nemissary rows into production catalogs") surfaced that Solar
and Dragon-Blooded never built a strict named-item catalog for these at
all -- they are free-text `possessions`/`manses`/`hearthstones` entries
with a generic metadata object (rating, material, attuned,
committedEssence, free-text `powers`/`source`), already fully splat-
agnostic with zero `sheetType` branching. Phase 1c for Abyssal is
therefore a no-op by design, matching that precedent exactly, not a
data-engineering effort.

That verification also surfaced that the certification gate itself was
unsatisfiable: it required `promotedEntries === totalInventoryRows`
exactly, but every family's inventory legitimately contains rows that can
never become a catalog entry (free-text possessions, plus
reference-only/gm-only/excluded/calculated/unresolved dispositions) --
no family could ever have certified. Fixed by introducing
`promotableEntries` (the honest target: just the rows meant to reach a
real catalog) and comparing against that instead. Abyssal's own value
(503) was computed precisely against the real built catalogs, which in
turn surfaced one more real gap: Abyssal's core-book Charm tree already
includes source-checked Terrestrial/Celestial Circle Sorcery-enabling
Charms (Daybreak Caste Occult tree) -- Abyssals get ordinary Sorcery in
addition to Necromancy, just not the Solar Circle -- but no matching
Sorcery-spell catalog exists yet, so a character with that Charm
currently has no legal spell to select. The other four families'
`promotableEntries` are preliminary keyword-based estimates pending their
own schema/catalog phases (zero unlock risk today, since every other
certification dimension keeps all five locked regardless).

Abyssal Phase 1c-2 closes the Sorcery-spell gap that Phase 1b's
`promotableEntries` math surfaced (Abyssal's own core-book Charm tree
already includes source-checked Terrestrial Circle Sorcery and Celestial
Circle Sorcery Charms, but no matching spell catalog existed). Of the 86
selectable Sorcery-spell inventory rows, 55 Terrestrial-circle names
already existed verbatim in `dragonblooded-sorcery.json` (reused, not
duplicated, via a new splat-agnostic `sharedSorcerySpellIds`/
`sharedSorcerySpellById` alias in `dragonblooded-powers.ts`); the other 31
are genuinely new Celestial-circle spells, appended to that same file
with `circle: 'celestial'`/`alternateCircleName: 'Sapphire Circle'`
(`TerrestrialSpellDefinition`'s `circle`/`alternateCircleName` fields were
widened from fixed literals to unions to fit, with a same-shape
`SorcerySpellDefinition` alias added for new code). `schema.ts`'s Abyssal
`powers.spells` branch now accepts either a Necromancy or a Sorcery spell
id; Dragon-Blooded's own spell validation is untouched, since
`dragonBloodedSpellIds` stays filtered to Terrestrial-only.
`promotedEntries` is now 500 (414 + 86).

Abyssal Phase 1d wires the editor UI: `Exalted1eEditor.tsx` and its two
shared sub-components (`ExaltedPowersSection`, `ExaltedMeritsFlawsSection`)
are generalized from a binary Solar/Dragon-Blooded branch to a three-way
branch that also renders Abyssal -- a Caste `<select>` constrained to the 5
canonical Castes (stored in the same generic `identity.caste` string field
Solar already uses), a Resonance tracker that reuses the existing
`limit.rating`/`virtueFlaw` schema field verbatim (relabeled, no schema
change), the full Charms/Necromancy/Sorcery catalog with an optional Caste
filter, the shared trait catalog's Abyssal subset with Abyssal's tighter
cost caps enforced live in the UI dropdown (not just at schema-validation
time), and its 16-entry Backgrounds list. There is no guided-creation
wizard for any splat in this module (Solar and Dragon-Blooded are both a
flat `variants` entry plus this one editor component, unlike Mage 20's
creation-stage engine), so this phase is editor support rather than a new
creation flow. This is UI, not a catalog dimension, so `promotedEntries`/
`promotableEntries`/`checksum`/`certifiedAt` are unchanged. `definition.tsx`
gained one fix (a latent `sheetLabel()` binary bug that mislabeled Abyssal
characters as "Dragon-Blooded"); its `variants` list and
`createInitialCharacter` default are otherwise untouched, so Abyssal
remains fully locked out of the user-facing create-character list.

Remaining Abyssal work before its certification record can flip: the 3
still-unreviewed Charm/spell rows, advancement/XP wiring (Charm/spell XP
costs specifically -- Abyssal's Charms & Spells editor branch deliberately
omits the buy-with-XP action for now, since the existing cost formula is
Dragon-Blooded's own favored-Aspect logic and has no Abyssal equivalent),
and the full migration/browser test evidence this project's certification
gate requires.

Sidereal Phase 2a combines what was Abyssal's initial schema-wiring step
with its own Phase 1a into a single pass, since Sidereal started this
phase with zero code/schema wiring at all (only a `plannedExaltedFamilies`
label, unlike Abyssal which already had Phase 1a's prerequisite schema
work done for it by an earlier pass). `'sidereal'` is now a legal _stored_
`sheetType` in `exaltedSheetTypes`, but -- exactly like Abyssal -- remains
absent from `definition.tsx`'s selectable `variants`, so the family stays
fully locked out of the user-facing create-character list. Its 12
Backgrounds (the shared Allies/Artifact/Backing/Familiar/Manse/Resources
ids, each re-flavored per Exalted: The Sidereals Chapter Four, plus the
six new Acquaintances/Celestial Manse/Connections/Salary/Savant/Sifu ids
that fully replace Solar's Contacts/Influence/Followers/Mentor ids for
this splat) and 82 Merits/Flaws rows (60 transferred verbatim, 19 extended
with a Sidereal-specific note, and 3 wholly new Sidereal-only entries --
Terrestrial Bloodline (Sidereal), Greater Curse (Sidereal), and Known
Anathema (Sidereal) -- for rows whose mechanics diverge too far from any
shared entry to extend in place) are now real, Zod-validated production
catalog entries, folded additively into `definitions.ts`'s
`siderealBackgrounds` export and the existing shared
`dragonblooded-merits-flaws` catalog respectively (`counts` grew from
`{ total: 86, merits: 42, flaws: 44 }` to `{ total: 89, merits: 43,
flaws: 46 }`). The formerly Abyssal-only `abyssalCostCapOverrides` cost-cap
map was generalized into a splat-agnostic `sharedCostOverrides` map, since
Sidereal introduced overrides (Permanent Caste Mark, Prescient Dreamer)
whose legal cost is not simply a narrower subset of the shared range, only
a wholesale replacement of it. `promotedEntries` is now 94 (12 + 82).
Sidereal's Charms, secret Martial Arts styles, and Astrology/Colleges
system remain entirely out of scope ("Phase 2b"): `charmIdsBySheetType` in
`schema.ts` carries only a placeholder empty `Set()` for `sidereal`, so a
blank Sidereal character validates with zero Charm/Combo/spell selections,
matching how Abyssal's own Charms were unimplemented before its later
Phase 1b. `definition.tsx` and `Exalted1eEditor.tsx` each gained one
`sidereal` entry in their respective `sheetTypeLabels`/`sheetTypeNames`
lookups purely to stay exhaustive over `ExaltedSheetType`; no Sidereal
editor UI (Caste select, Arcane Fate/Paradox tracker, Astrology UI) was
built in this phase.

Sidereal Phase 2b promotes the Charms and Sorcery spells that Phase 2a left
as placeholders. All 193 disposition-`selectable`, `verificationState:
'reviewed'` Chapter Five Charm rows -- the 152 Caste-and-Auspicious-Ability
Charms across all 25 trees (5 Castes x 5 Abilities each) plus the 41 Charms
of the three named secret Martial Arts styles (Charcoal March of Spiders 12,
Prismatic Arrangement of Creation 16, Citrine Poxes of Contagion 13) -- are
now real, Zod-validated entries in new files `sidereal-charms.json`/
`sidereal-powers.ts`, following `abyssal-powers.ts`'s Charm-shape precedent
field-for-field: the 25-tree Charms use a new `caste: SiderealCaste | null`
field (mirroring `abyssalCastes`) holding one of Journeys/Serenity/Battles/
Secrets/Endings with `style: null`, while the three Martial Arts styles use
`style: '<Style Name>'` (mirroring Dragon-Blooded's own Immaculate style
field) with `caste: null`. Every `prerequisiteCharms` reference was resolved
from its printed name to the real sibling Charm id within this same catalog
(a dedicated integrity test asserts a 100% round-trip), and `comboRules`
were derived strictly from explicit, self-referential "Combo" sentences in
each Charm's own mechanics text -- 9 Charms received an override (6 an
explicit cross-Ability Combo permission, 3 an explicit Combo prohibition);
Charms whose text merely _discusses_ Combos or other Charms' Combo rules at
length, without stating a rule about themselves, were deliberately left
with default rules, matching `abyssal-powers.ts`'s strict precedent. All 84
Sorcery spell rows in the Sidereal inventory were cross-checked against the
existing shared `dragonblooded-sorcery.json` catalog: the 73 reviewed rows
all matched an existing entry there exactly (Savant and Sorcerer is the
single canonical current-edition sorcery source for every splat, so full
overlap is the expected, good outcome), so no new spells were appended and
no Sidereal-only spell catalog file was created -- `sidereal-powers.ts`
instead exports a self-validating `siderealSorcerySpellIds` subset of the
shared `sharedSorcerySpellIds`. The remaining 13 rows are still
`verificationState: 'unreviewed'` and were excluded from promotion, tracked
in the new `siderealUnreviewedExcludedSpellIds` export (mirroring Abyssal's
own unreviewed-exclusion precedent). `schema.ts`'s `charmIdsBySheetType.
sidereal` placeholder empty `Set()` is now `siderealCharmIds`, and the
`powers.spells` sidereal branch now validates against
`siderealSorcerySpellIds` instead of hard-rejecting every selection.
`promotedEntries` is now 360 (94 + 193 + 73). Astrology/Colleges, the
editor UI, and advancement/XP wiring remain out of scope for this phase, and
`'sidereal'` remains absent from `definition.tsx`'s user-facing `variants`
list.

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
