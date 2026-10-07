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

| Family     | Source manifest                                                                                                                                                         | Inventory rows | Promoted                                                                                                                                                                                                               | Certification                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Lunar      | Created (Exalted: The Lunars + Exalted Players Guide + Savant and Sorcerer + Book of Three Circles + Exalted Storyteller's Companion + Savage Seas + Blood and Salt)    | 598            | 412 of 412 promotable (catalog dimension complete, `unreviewed_spells` follow-up)                                                                                                                                      | Locked; catalog/rules/creator/migration tests all pass, `browserTests` `not-run` and `certifiedAt` deliberately `null` pending Phase 6 |
| Abyssal    | Created (Exalted: The Abyssals + Book of Bone and Ebony + Savant and Sorcerer + Exalted Players Guide + Exalted Storyteller's Companion + Savage Seas + Blood and Salt) | 700            | 505 of 505 promotable (catalog dimension complete, Phase 1e)                                                                                                                                                           | Locked; catalog/rules/creator/migration tests all pass, `browserTests` `not-run` and `certifiedAt` deliberately `null` pending Phase 6 |
| Sidereal   | Created (Exalted: The Sidereals + Savant and Sorcerer + Book of Three Circles + Exalted Storyteller's Companion + Savage Seas + Exalted Players Guide + Blood and Salt) | 583            | 383 of 383 promotable (catalog dimension complete, `sidereal_unreviewed_spells` follow-up)                                                                                                                             | Locked; catalog/rules/creator/migration tests all pass, `browserTests` `not-run` and `certifiedAt` deliberately `null` pending Phase 6 |
| Alchemical | Created (Exalted: The Autochthonians + Exalted Players Guide + Exalted Storyteller's Companion + Savage Seas + Blood and Salt)                                          | 305            | 214 of 214 promotable (catalog dimension complete: Backgrounds + Merits/Flaws, Phase 1a; Charms, Phase 1b; Weaving Protocols + Alchemy Formulae, Phase 1c)                                                             | Locked, all dimensions `not-run`                                                                                                       |
| Fair Folk  | Created (Exalted: The Fair Folk + Exalted Players Guide + Exalted Storyteller's Companion + Savage Seas + Blood and Salt)                                               | 368            | 143 of 279 promotable (Backgrounds + Merits/Flaws, Phase 1a; Graces + Bedlam + Grace-Forging/Assumption Charms, Phase 1b; Glamour Charms + remaining Greater Arts of Glamour + Pox/Affliction/Blight Charms, Phase 1c) | Locked, all dimensions `not-run`                                                                                                       |

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

Sidereal Phase 2d wires the editor UI and advancement rules the same way
Abyssal's Phase 1d/1e did: `Exalted1eEditor.tsx`'s shared power-catalog
component (`ExaltedPowersSection`, formerly hardcoded to Abyssal's own Caste
enum for its optional Caste filter) is generalized to accept any family's
Caste list via a new `castes` prop, and a new Sidereal branch renders a
Caste `<select>` constrained to Sidereal's own five Castes (Journeys/
Serenity/Battles/Secrets/Endings, stored in the same generic
`identity.caste` string field every Caste-based family already uses), the
full 193-Charm/73-Sorcery-spell catalog with that Caste filter, the shared
trait catalog's Sidereal subset with Sidereal's own cost caps enforced live
in the UI dropdown, and its 12-entry Backgrounds list. `shared/advancement/
rules.ts` gained a new `isSiderealAbilityFavored`/
`getSiderealPowerExperienceCost` function pair (10 XP for a Charm/spell in
one of the character's Caste's five Auspicious Abilities or an explicitly
chosen Favored Ability, 12 XP otherwise -- Exalted: The Sidereals' own
Auspicious-Abilities text confirms both share one discount tier, and no
source text states a different Charm-purchase XP figure for Sidereal, so
this reuses the same 10/12 baseline Abyssal's own non-surcharge Charms use),
keyed to a new `siderealAbilityGroups` export in `definitions.ts` derived
directly from the promoted Charm catalog's own `caste`/`ability` fields
rather than guessed. New test coverage lands across
`exalted-shared-records.test.ts` (XP-cost rules), the shared guided-creation
integration test file (a new Sidereal describe block), a new
`sidereal-powers-editor.test.tsx` (Charms/Sorcery editor + XP-learn flow),
and `exalted1e-sidereal.test.ts` (schema migration), bringing Sidereal's
`rulesTests`/`creatorTests`/`migrationTests` to `pass`. This is UI/rules/
test work, not new catalog
promotion, so `promotedEntries`/`promotableEntries` are unchanged; only
`checksum` changes, from empty to a real value, since
`scripts/audit-exalted-sources.mjs`'s `catalogChecksum` feature (added
alongside Abyssal's Phase 1e) applies generically to any family with a
`<family>-*.json` catalog file, which Sidereal already had
(`sidereal-charms.json`) even before this phase. `definition.tsx`'s
`variants` list is untouched, so Sidereal remains fully locked out of the
user-facing create-character list. Remaining Sidereal work before its
certification record can flip: the 5 Astrology/Colleges catalog rows, the
13 still-unreviewed Savant and Sorcerer spell rows, and the full
browser-test evidence and Phase 6 all-five-together gate this project's
certification requires.

Sidereal Phase: Astrology/Colleges closes the last catalog-dimension gap
Phase 2d left open. A precise recount against the full inventory found
that "5 Astrology/Colleges rows" had undercounted: exactly 10
disposition-`calculated`, `verificationState: 'reviewed'` rows cover the
Astrology rules framework (Petitions, the Effect Roll, Blessings and
Curses, Scope/Duration/Power, Multiple and Canceling Effects, Censure,
Paradox, Pattern Bite, and Greater Signs) plus Resplendent Destinies, all
now promoted verbatim into a new `sidereal-astrology-rules.json` catalog
file. `promotableEntries` is corrected from 365 to 370 and
`promotedEntries` rises from 360 to 370, so `catalogDimensionPasses` now
returns `true` for Sidereal for the first time (matching Abyssal's own
catalog-complete state). Alongside that audited catalog, a richer,
Zod-validated reference module (`sidereal-astrology.ts`) derives the
complete named-College catalog from Exalted: The Sidereals Chapter Six --
5 astrological Houses (Journeys/Leisure/War/Secrets/Endings), 25 named
Colleges (5 per House, each mapped 1:1 to that House's Caste's five
Auspicious Abilities via the existing `siderealAbilityGroups` export, with
a runtime assertion that fails loudly on any drift between the two), 75
named Resplendent Effects (3 per College), 5 capstone Greater Signs, and 8
generic Blessing/Curse effect types -- and a new `SiderealAstrologyPanel.tsx`
editor component renders College dot-ratings, a Resplendent Destinies
manager, computed Greater Sign eligibility (Caste + Essence 4+ + all five
House Colleges at 3+), and a browsable rules reference. `schema.ts` gained
a `familyState.destinies[].collegeId` machine-id field (schema version
9 -> 10, with a migration that backfills `collegeId: null` onto
pre-existing destinies and drops any legacy `colleges` key that isn't a
real College id) and a `colleges` record validated against the real
College catalog. No dice-rolling automation was added: this app has no
dice engine for any family, so the Effect Roll/Paradox/Scope-Duration-Power
math stays reference text applied by hand, exactly like every other
family's own procedural-rules handling. Sidereal now passes every
per-family test dimension this project tracks (catalog/rules/creator/
migration); only `browserTests` (no user-facing creation route yet) and
Phase 6's all-five-families-together rule keep it locked.

A later `sidereal_unreviewed_spells` follow-up phase then closed Sidereal's
one remaining honestly-tracked gap: the 13 Savant and Sorcerer
Sorcery-spell rows that had sat in `siderealUnreviewedExcludedSpellIds`
since Phase 2b (excluded from `promotableEntries`/`promotedEntries`
entirely rather than counted as an open gap -- a different convention than
Lunar's own Phase 1d used for its identical 13-row gap). Sidereal's and
Lunar's inventory rows for these 13 spells were confirmed byte-for-byte
identical in mechanics/cost/citation, so the visual (rendered-page)
re-check already performed for Lunar's own `unreviewed_spells` phase
(zero discrepancies against the source PDF) applied directly to
Sidereal's rows without a second render/view pass. While moving these ids,
a pre-existing typo in `siderealUnreviewedExcludedSpellIds` was found and
fixed: one entry read `horse-that-travels-earth-and-water`, missing the
`the-` prefix the real shared-catalog id uses, which had never been
caught because that export (unlike `lunarUnreviewedExcludedSpellIds`) had
no module-load-time validation loop. Each row's `verificationState` was
flipped to `reviewed`, all 13 correct ids moved into
`siderealSorcerySpellIds` (86 total, up from 73) with the now-empty
exclusion export removed, and `promotableEntries`/`promotedEntries` both
rose from 370 to 383 -- also correcting this record's prior convention to
match Abyssal's/Lunar's practice of counting not-yet-reviewed-but-real
rows in the denominator. `catalogDimensionPasses` continues to return
`true` for Sidereal; it stays locked only on `browserTests`/`certifiedAt`,
exactly as before this phase.

With Abyssal and Sidereal's own catalog dimensions complete, work moved to
Lunar, the next family in the planned build order. Lunar Phase 1a added
`'lunar'` to `exaltedSheetTypes` (a legal stored `sheetType` for the first
time, still absent from `definition.tsx`'s selectable `variants`, exactly
like Abyssal/Sidereal before their own later UI phases) and promoted its
first two catalog dimensions: 13 Backgrounds (`lunarBackgrounds` in
definitions.ts — 5 shared ids with Lunar-specific flavor text, 5
confirmed-unaltered shared ids, and 3 wholly new ids: Cult, Heart's Blood,
Renown) and 87 of the shared Exalted Players Guide Merits/Flaws catalog's
92 entries (84 extended with `'lunar'` in `appliesTo` plus 3 wholly new
Lunar-only entries — Chimera, Limited Forms, and Greater Curse
(Solar/Lunar) — confirming Lunar's own inventory is the canonical original
transcription that Abyssal/Sidereal/Alchemical/Fair Folk's own Merits/
Flaws rows were all derived from). `sharedCostOverrides` gained two
genuine Lunar-specific discounts named directly in the source text:
Ambidextrous collapses to a flat 1 point, and Double-Jointed narrows to
1-2 points. `promotedEntries` rose from 0 to 100.

Lunar Phase 1b promoted its Charms catalog: 219 of the 229 raw Chapter
Five Charm-page rows (pp. 122-193), plus the Exalted Storyteller's
Companion's own 5 Sample Charms (Tentacles, Summon Wild Beasts, Acid
Spit, Mighty Thews, Strides of the Panther), are now a real, Zod-validated
`lunar-charms.json` catalog plus a `lunar-powers.ts` reference module
(mirroring `abyssal-powers.ts`/`sidereal-powers.ts`). The remaining 10 rows
(the Beastman Transformation "gift" sub-options — Horrifying Might,
Bestial Reflexes, Lightning Speed, Spider-Foot Climbing, Glue-Foot
Climbing, Gift of Hands, Arm-Array, Terrible Beast Claws, Savage Moonsilver
Talons, Resilience of Nature) are deliberately excluded: they are a menu
of passive options selected when purchasing Deadly Beastman Transformation
itself (which is promoted), not independently-purchasable Charms with
their own mote cost — a proper "select N gifts" mechanic is deferred to a
future Great Curse/Shapechanging-Forms subsystem phase. Since no single
Ability governs every Charm within a Lunar Charm-category (unlike Dragon-
Blooded/Abyssal/Sidereal), the catalog keeps `category`/`element`/
`ability`/`style` as fixed placeholders and adds one genuinely new field,
`charmCategory`, with 15 values derived from the source's own structure
(Sample Charms, Shapechanging I/II/III, Body Enhancement I/II, Unarmed
Combat, Melee Combat, Ranged Combat, Defensive, Survival and Healing,
Perception, Stealth, Interaction and Knowledge, and Spirit and Sorcery),
summing to exactly 219 rows with none fabricated or guessed. 21 Charms
carry explicit Combo restrictions or special rules (e.g. Coiled Cobra
Stance cannot combo with extra-action Charms; Terrestrial/Celestial Circle
Sorcery can never be part of a Combo), captured in a per-Charm
`explicitComboRules` override map derived from explicit source-text
sentences, matching Abyssal's own precedent. `charmIdsBySheetType.lunar`
in schema.ts now resolves to the real 219-entry `lunarCharmIds` set
(previously an empty placeholder); Sorcery spells remain a placeholder
rejection, since this phase promoted Charms only, not the 84 Terrestrial/
Celestial Circle spell rows already inventoried (a separate future
sub-phase). `promotedEntries` rose from 100 to 319.

Lunar Phase 1c built the Great Curse/Shapechanging-Forms subsystem. The
Great Curse's 5 rows (the overview plus the four Virtue-linked inner-beast
thralls -- Whipped Dog/Compassion, Heartless Weasel/Conviction, Drunken
Monkey/Temperance, Raging Bull/Valor) are now a promoted
`lunar-great-curse.json` catalog, and 2 of the Lunar Shapechanging rules
(the innate 3-mote Shapechanging power and The Tell) are now a promoted
`lunar-shapechanging-rules.json` catalog; the third rules row, a Regions
sidebar, was deliberately left unpromoted since its inventory disposition
is `reference-only` (GM guidance, not a selectable or calculated Trait),
which this project's own governance model forbids promoting --
`audit:exalted-sources` enforces this and failed loudly on the first
attempt, exactly as intended. Since the Great Curse is mechanically
identical to the Solar/Dragon-Blooded Limit Trait, it reuses the existing
generic `limit` field verbatim (matching Abyssal's own Resonance
precedent) rather than adding a new schema field; `Exalted1eEditor.tsx`'s
Traits section gained an `isLunar` branch relabeling the same Limit dots
and notes textarea "Great Curse"/"Great Curse notes". `familyState.lunar`
gained one genuinely new field, `primaryVirtueId` (nullable, one of the
four Virtue ids -- a player/Storyteller narrative declaration of which
Virtue governs the inner beast, not auto-derived from the highest Virtue
rating), requiring `EXALTED1E_SCHEMA_VERSION` to bump from 10 to 11 with a
migration backfilling `null` for pre-existing Lunar records. A new
`LunarShapechangingPanel.tsx` component (mirroring
`SiderealAstrologyPanel.tsx`) renders a Heart's Blood Forms manager (full
add/edit/remove CRUD for known animal forms, replacing the prior
placeholder-only active-form dropdown), a Great Curse card (primary-Virtue
selector plus all five Great Curse rows as browsable reference), and a
Shapechanging rules reference card. Per-species Heart's Blood Form stat
bonuses remain player-recorded free text, not a closed per-species stat
catalog, since the source imposes no fixed list of eligible animals -- an
honestly-labeled gap, not a silent omission. `promotedEntries` rose from
319 to 326.

Lunar Phase 1d promoted the Sorcery spell catalog. 73 of Lunar's 86
inventoried Sorcery spell rows (55 Terrestrial + 31 Celestial Circle,
reachable via the already-promoted `terrestrial-circle-sorcery`/
`celestial-circle-sorcery` enabling Charms) are now wired into
`schema.ts`'s `powers.spells` validation via a new `lunarSorcerySpellIds`
export in `lunar-powers.ts`. Every one of the 86 rows already existed,
name-for-name and mechanics-for-mechanics, in the existing shared
`dragonblooded-sorcery.json` catalog -- exactly the same good outcome
Sidereal's own Phase 2b found for its 73 spells -- so no new spell file
was created and no duplicate rows were added. 13 of the 86 rows (8
Terrestrial + 5 Celestial, all summon-type spells with embedded creature
stat blocks) are excluded from this pass and tracked in a new
`lunarUnreviewedExcludedSpellIds` export, because their inventory
`verificationState` is still `unreviewed`: their headers/costs/
prerequisites are confirmed but their full rules-text was not legibly
captured in the source pass. These are, row-for-row, the identical 13
spells Sidereal's own Phase 2b held back for the same reason, confirming
a genuine shared-source-legibility gap rather than a Lunar-specific
issue; promoting any of them now would fail
`audit:exalted-sources`'s visual-review gate, exactly as intended. This
phase also recomputed `promotableEntries` from the prior 390 preliminary
keyword-based estimate (flagged since Phase 1a as approximate) to a
precise 412 (13 Backgrounds + 87 Merits/Flaws + 219 Charms + 5 Great
Curse + 2 Shapechanging rules + 86 Sorcery spells, counting the 13
still-unreviewed spells in the denominator, matching Abyssal's own
precedent). `promotedEntries` rose from 326 to 399; the remaining 13-row
gap is honestly attributable to the unreviewed spells above, not further
Lunar-specific schema work.

Lunar's editor-UI phase wired every catalog promoted in Phases 1a-1d into
`Exalted1eEditor.tsx` for the first time. The Identity section gained an
`isLunar` branch rendering a constrained Caste `<select>` (Full Moon/
Changing Moon/No Moon/Casteless, sourced from
`getExaltedCreationRules('lunar').castes`, writing to the same generic
`identity.caste` field Abyssal/Sidereal already use) -- no "Tribe" field was
added, since 1st-edition Lunars have no such mechanic (confirmed absent
from _Exalted: The Lunars_ itself, not merely unreviewed). The Backgrounds
picker now shows the real 13-entry `lunarBackgrounds` catalog instead of an
empty list, and the Merits & Flaws section wires `ExaltedMeritsFlawsSection`
to `lunarOnlyTraits` with the same shared cost-policy/repeat-limit/search/
approval helpers Abyssal and Sidereal already use (all generic across sheet
types since Phase 1a). The Charms & Sorcery section gained a new
`lunarPowerDefinitions` constant (219 Charms + 73 reachable Sorcery spells,
mirroring `abyssalPowerDefinitions`/`siderealPowerDefinitions`'s own
module-scope pattern) and an `isLunar` branch rendering
`ExaltedPowersSection` with Caste filtering off (Lunar Charms are organized
by `charmCategory`, not Caste); the shared `ExaltedPowerDefinition` union
was widened to include `LunarCharmDefinition` for the first time, and a new
"Charm category" detail row replaces the blank "Ability / Style" row
Lunar's null `ability`/`style` fields would otherwise have produced.
Deliberately **not** wired this phase: `character`/`onLearnWithExperience`
(XP-based direct purchase). `getPowerExperienceCost` in
`DragonBloodedPowersSection.tsx` dispatches every non-Abyssal `exaltType` to
`getSiderealPowerExperienceCost`, which would have silently applied
Sidereal's favored-Auspicious-Ability discount math to Lunar Charms; a
defensive `'lunar'` branch now throws there instead (it should never
execute, since Lunar's own call site omits `character`/
`onLearnWithExperience` entirely) pending a real
`getLunarPowerExperienceCost` in a dedicated future XP-rules phase. "Add
Without Spending XP" remains fully available for Lunar in the meantime.
This phase added no new catalog rows, so `promotableEntries`/
`promotedEntries` are unchanged at 412/399. Remaining Lunar work: Lunar
XP-cost rules (favored-Charm/Caste-Attribute discount logic), the 13
still-unreviewed Sorcery spells, and the full rules/creator/migration/
browser test evidence this project's certification gate requires.

Lunar's XP-rules phase then implemented the real `getLunarPowerExperienceCost`/
`isLunarAbilityFavored` functions in `shared/advancement/rules.ts` and wired
`character`/`onLearnWithExperience` into the Charms & Sorcery section's
`isLunar` branch, replacing the defensive placeholder from the prior phase.
No Lunar-specific numeric override to the standard core-rulebook Charm-cost
table (10 XP Favored, 12 XP Unfavored) exists in _Exalted: The Lunars_ --
the same situation Abyssal's and Sidereal's own books left their cost
functions in -- so this reuses those base figures; Lunar has no
Immaculate-Martial-Art-style surcharge tier. Determining "favored" required
a genuine design decision, since Lunar Charms carry no single governing
Ability (`ability: null` on every `LunarCharmDefinition`; Charms are
organized by `charmCategory` instead, and `minimumRequirements` freely mix
Attributes and Abilities within the same category) and Lunar's three
Castes are Attribute-linked rather than Ability-linked (so there is no
Caste-Ability fallback the way Abyssal/Sidereal have). Absent any source
text describing a Lunar-specific Charm-cost framework, this gap was
surfaced directly to the project owner rather than guessed at; the
approved design is: a Charm is Favored if ANY of its `minimumRequirements`
traits matches one of the character's own 5 chosen Favored Abilities (the
same `favoredAbilities` field every splat already uses), via the same
`normalizedAbilityId` label-matching helper every other family's
`isXAbilityFavored` already relies on. Charms whose requirements are
Attribute-only (e.g. "Manipulation 2") naturally resolve to Unfavored,
since Attribute labels never match a real Ability id in
`favoredAbilities` -- no separate Attribute-only branch was needed.
Sorcery spells are keyed off Occult, the same convention
Dragon-Blooded/Abyssal/Sidereal already use. A pre-existing architectural
quirk in `getPowerExperienceCost` was discovered but deliberately left
unfixed as out of scope: the shared `TerrestrialSpellDefinition` type used
by every family's Sorcery spells has no `exaltType` field, so shared
spells (Abyssal's, Sidereal's, and now Lunar's) actually fall through to
`getDragonBloodedPowerExperienceCost` rather than their own family's cost
function; for Lunar specifically this produces a mathematically identical
result to `getLunarPowerExperienceCost` (Lunar's `identity.aspect` is
always empty, collapsing the DB fallback to a pure
`favoredAbilities.includes('occult')` check), so
`getLunarPowerExperienceCost`'s own spell-handling branch, while
technically unreachable via this dispatcher path today, was kept for
structural consistency with Abyssal's/Sidereal's own cost functions, which
have the identical dead-code situation. Test coverage added: a new unit
test exercising `isLunarAbilityFavored`/`getLunarPowerExperienceCost`
directly against real catalog Charms and a shared Sorcery spell, and a new
4-test "Learning Charms with XP" block in the Lunar powers-editor
integration test (mirroring Sidereal's own `XpHarness` pattern). This
phase added no new catalog rows, so `promotableEntries`/`promotedEntries`
remain unchanged at 412/399. Full verification passed: typecheck, lint (0
errors), format check, the full unit+integration suite (871 tests, up from
867), the Exalted e2e smoke specs, `audit:exalted-sources` (unchanged), and
a production build. Lunar remains fully locked out of `definition.tsx`'s
user-facing `variants` list.

A follow-up "rules_creator_tests" phase then closed Lunar's remaining
test-dimension gap. `tests/unit/exalted1e-lunar.test.ts` turned out to
already have comprehensive rules-and-migration coverage dating back to
Phases 1a-1d; the only genuinely new gap was the "creator tests" dimension
(guided-creation UI coverage), closed by a new Lunar `describe` block in
`tests/integration/exalted-creation-panel.test.tsx` (mirroring the existing
Abyssal/Sidereal blocks) covering the Casteless creation profile, all four
Caste identities, unresolved-requirement surfacing, the creation-source
citation, the Casteless variant's narrower powers budget, and the
manual-sheet no-render case. `rulesTests`/`creatorTests`/`migrationTests`
were flipped from `'not-run'` to `'pass'` in `certification/lunar.json`;
the catalog dimension (399/412 promoted) and `browserTests`/`certifiedAt`
were unchanged, so Lunar remained locked.

A later "unreviewed_spells" phase closed that remaining catalog gap. The
13 Sorcery spell rows held back since Phase 1d (8 Terrestrial + 5 Celestial
Circle summon-type spells from _Savant and Sorcerer_, all with embedded
creature stat blocks) were visually re-checked against the source PDF --
each cited page was rendered and compared line-by-line against the
existing transcribed mechanics text, confirming an exact match with zero
discrepancies. Each row's `verificationState` was flipped from
`'unreviewed'` to `'reviewed'`, and all 13 ids moved from the now-removed
`lunarUnreviewedExcludedSpellIds` export into `lunarSorcerySpellIds` in
`lunar-powers.ts` (mirroring Abyssal's own Phase 1e precedent of deleting
an exclusion-list export once empty). `promotedEntries` rose from 399 to
412, now exactly matching `promotableEntries`; `checksum` was populated for
the first time with the real value from `scripts/audit-exalted-sources.mjs`
(unchanged by this phase's own edits, since Sorcery spells reuse the shared
`dragonblooded-sorcery.json` catalog file rather than a `lunar-*.json` file
the audit script's glob can see). With all three test dimensions and the
catalog dimension now passing, Lunar's situation is identical in kind to
Abyssal's and Sidereal's: it stays locked solely because `browserTests`
cannot run before the family is unlocked and because `certifiedAt`
deliberately stays null pending the rule that all five planned families
reach `certifiedAt !== null` together. Full verification passed: typecheck,
lint (0 errors), format check, the full unit+integration suite (878 tests),
the Exalted e2e smoke specs, `audit:exalted-sources` (0 issues), and a
production build. Lunar remains fully locked out of `definition.tsx`'s
user-facing `variants` list. Sidereal's own identical 13-row gap
(`siderealUnreviewedExcludedSpellIds`, same source pages) was left
untouched this phase as a separate family's scope.

With Lunar, Abyssal, and Sidereal's own catalog dimensions all complete,
work then moved to Alchemical's own Phase 1a (schema wiring plus Backgrounds
and Merits/Flaws catalog promotion), mirroring each of those three families'
own starting phase. `'alchemical'` was added to `exaltedSheetTypes` in
`definitions.ts`, making it a legal, schema-validated stored `sheetType` for
the first time, without adding it to `definition.tsx`'s `variants` -- it
remains unreachable through the character-creation UI. Six Background ids
were promoted into a new `alchemicalBackgrounds` export: the two wholly new
ids Class and Vats from Exalted: The Autochthonians' Chapter Two "Expanded
Backgrounds," plus the four altered shared ids Artifact, Backing, Familiar,
and Manse. Followers, Influence, and Resources were deliberately left out,
since that same chapter explicitly states they are subsumed into Class for
ordinary Autochthonians. Allies, Contacts, and Mentor were also left out --
not because the source excludes them, but because it never mentions them in
either direction at all, unlike Lunar's own Background section, which
affirmatively confirms its unaltered shared ids remain available; absent a
source that actually settles the question, this project's rule against
fabricating unconfirmed mechanics holds them back as an explicit open
blocker rather than guessing. Separately, 71 shared `dragonblooded-merits-flaws.json`
catalog entries were extended with `'alchemical'` in `appliesTo`, resolving
70 of the universal Exalted Players Guide `pg-merit-*`/`pg-flaw-*` rows the
Alchemical inventory had already cross-checked against this family's
construct nature one-for-one (the lone exception, the single inventoried
"Favor" row, maps onto the catalog's existing `favor-merit`/`favor-flaw`
split pair, accounting for the 70-rows-to-71-entries difference). No wholly
new Alchemical-only catalog entries were needed: every row the inventory's
own judgment-call notes adapted for this family (chassis damage instead of
flesh scarring, Class instead of Resources, a benefactor instead of
parents, and so on) kept its underlying mechanic and point cost unchanged,
reframing flavor text only -- confirmed directly for the Destiny Merit,
whose own "Destiny and Exaltation" sidebar names Alchemical Exalted as
uncapped, meaning it correctly falls through to the shared Dragon-Blooded
1-5 point range with no `sharedCostOverrides` entry required, unlike
Abyssal's and Sidereal's own narrower overrides for the same Merit.
`certification/alchemical.json`'s `promotedEntries` rose from 0 to 77 (6
Backgrounds + 71 Merits/Flaws); `promotableEntries` (207) is unchanged, a
still-approximate estimate pending later phases that promote Alchemical's
Charms (94 rows), Weaving Protocols (49 rows), and Alchemy Formulae.
`rulesTests`/`creatorTests`/`migrationTests`/`browserTests` and
`certifiedAt` all remain untouched (`'not-run'`/`null`), exactly matching
how Lunar's, Abyssal's, and Sidereal's own Phase 1a/2a left those same
fields alone. A new `tests/unit/exalted1e-alchemical.test.ts` suite covers
the blank-character shape, Backgrounds (including the three deliberately
excluded ids), the shared Merits/Flaws catalog (including the Favor
split-pair and the Destiny no-override case), the Charms/spells
placeholder rejections, and schema migration, mirroring Lunar's own
Phase 1a test file structure. Full verification passed: typecheck, lint,
format check, the full unit+integration suite, the Exalted e2e smoke
specs, `audit:exalted-sources`, and a production build. Alchemical remains
fully locked out of `definition.tsx`'s user-facing `variants` list; Fair
Folk's own equivalent Phase 1a remains unstarted.

Alchemical's Phase 1b (Charms catalog promotion) then promoted all 96 of
the Chapter Three Charm rows (pp. 89-141/PDF 90-142) -- the 94 Charms
spread across the nine named trees (General 2, Close Combat 15, Ranged
Combat 11, Might and Mobility 14, Social 12, Stealth and Disguise 9,
Sensory and Spiritual 10, Medical 11, Cognitive 9, Essence and Weaving 3)
plus confirming the General Charms count already included above -- into a
new `src/games/exalted1e/reference/alchemical-charms.json` catalog and an
`alchemical-powers.ts` reference module, mirroring `lunar-powers.ts`. The
5 "framing" rows under the same Chapter Three heading pattern that
describe systems rather than purchasable Charms (Charm Slots/Panoplies/
Submodules/Arrays, Designing New Charms, Limitations and Effect,
Alchemical Martial Artists, Identifying Charms) were deliberately
excluded, matching this project's rule against promoting reference-
only/calculated rows into a selectable catalog. Unlike every other
already-promoted splat, Alchemical Charms are each keyed to a governing
**Attribute** rather than an Ability -- confirmed directly from the Charm
Slots framing row's own text, which states that "Dedicated" Charm Slots
(the ones carrying a Caste/Favored installation discount) only accept
Charms tied to a Favored or Caste _Attribute_, never an Ability. The
catalog's `minimumRequirements` field therefore names the governing
Attribute directly (e.g. `{ trait: 'Dexterity', rating: 3 }`) and `ability`
stays `null` throughout, exactly like Lunar's own nullable `ability` field;
a new `charmCategory` field records each Charm's tree. The sole exception,
Perfected Lotus Matrix, is explicitly keyed to the Martial Arts Ability
instead -- its own text states this is exactly why it can never be
Favored/Caste for any Alchemical and must occupy a General Slot -- captured
without any schema change by simply naming `'Martial Arts'` as the
`minimumRequirements` trait. Two Charms (Transitory/Sustained Augmentation
of (Attribute)) are each really nine separately-purchased Charms, one per
Attribute, and one (Synthesis Wave Emitter) is really six Charms in one
family (five Magical Materials plus adamant); all three are kept as single
templated catalog rows rather than fabricating near-duplicate rows the
source never actually tabulates separately, matching how the source itself
presents them. Alchemicals do not build ad hoc Combos the way other splats
do; instead, per the Charm Slots framing row, any Attribute-based Charm may
be bundled with others into a permanently surgically-installed "Array" at
a reduced combined installation cost, granting automatic access to every
legal Combo among its members. `comboRules.eligible` therefore represents
Array-eligibility (this family's real Combo-analog) rather than ordinary
ad hoc Combo-eligibility, defaulting to `true` for every Charm except the
four explicitly barred by their own text or by the framing row's blanket
exclusion of supernatural martial arts Charms from Arrays (Perfected Lotus
Matrix, Auxiliary Essence Storage Unit, Man-Machine Weaving Engine,
God-Machine Weaving Engine); the Array mechanic itself (reduced-cost
calculation, unit install/remove) is deferred to a future phase, exactly
like Lunar's own deferred Great Curse/Shapechanging-Forms subsystem. The
two Essence and Weaving "engine" Charms are promoted here as the gateway
Charms into the still-out-of-scope Weaving Protocol subsystem (each
Charm's own description cross-references the catalog directly); installing
either permanently grants 1 dot of Clarity and neither can ever be removed,
captured verbatim in text rather than a new schema field, since this phase
does not yet model Clarity mechanically. `charmIdsBySheetType.alchemical`
in `schema.ts` now resolves to the real 96-entry `alchemicalCharmIds` set
(was an empty placeholder); Sorcery spells remain correctly rejected since
Alchemical has no Sorcery access by design. `certification/alchemical.json`'s
`promotedEntries` rose from 77 to 173 (77 Phase 1a + 96 Phase 1b Charms),
and its `checksum` was populated for the first time with the real value
from `scripts/audit-exalted-sources.mjs` (`9006867c`), since
`alchemical-charms.json` is the first `alchemical-`-prefixed catalog file
this family has ever had. A new 14-test `alchemical-charms-catalog.test.ts`
suite covers catalog shape, category distribution, prerequisite
resolution, the templated-Attribute-row/Martial-Arts-exception cases, and
Array-eligibility; `exalted1e-alchemical.test.ts` gained real Charm
accept/reject coverage replacing the old placeholder-rejection test. Full
verification passed: typecheck, lint, format check, the full
unit+integration suite, the Exalted e2e smoke specs,
`audit:exalted-sources`, and a production build. `Exalted1eEditor.tsx`
remains untouched this phase, exactly as Phase 1a left it; Alchemical
stays fully locked out of `definition.tsx`'s user-facing `variants` list.

Alchemical's Phase 1c (Weaving Protocol/Alchemy Formulae promotion) closed
its remaining catalog gap, adding `src/games/exalted1e/reference/alchemical-weaving-protocols.json`
(38 rows) and `alchemical-formulae.json` (3 rows), both validated through
new Zod schemas added to the existing `alchemical-powers.ts` module rather
than new standalone files, mirroring `lunar-powers.ts`'s single-module
convention. Of the 49 total Chapter Four Weaving Protocol rows (printed
pp. 142-159/PDF 143-160), only the 38 `disposition: 'selectable'` rows were
promoted: excluded are 5 reference-only framing rows describing the
subsystem itself and 6 `gm-only` full NPC/creature stat blocks for the
elemental Golems/automata summoned exclusively by the single selectable
protocol "The Maker's Instantaneous Forge" -- both exclusions matching
this project's established rule against promoting framing/sidebar text or
GM-only creature stat blocks into a player-facing selectable catalog.
Unlike every other already-promoted splat's spell system, Weaving
Protocols are gated by a fixed **Minimum Clarity** rating (parsed directly
from each row's own "Minimum Clarity N" sentence into a new
`minimumClarity` field) rather than Essence + an Ability, with one row
(Incarnation of Bestial Malice) also carrying a Maximum Clarity 7 cap
captured in a parallel `maximumClarity` field, and Transcendent Pattern
Weaving Protocol requiring Minimum Clarity 10, the highest gate in the
catalog (and the one protocol confirmed to work only in the Wyld). Any
extra non-Clarity requirement text (Vats-Background-with-Charms-on-
retainer, Backing 4+, one-day-advance-preparation, and similar cases) is
preserved verbatim in a new `requirementsText` field rather than
discarded. A new `echelon` field (`'man-machine'`/`'god-machine'`) records
which of the two Weaving Engine Charms (promoted in Phase 1b) is needed,
splitting 23 Man-Machine and 15 God-Machine Protocols, matching the
inventory's own Chapter Four structure.

Because every Weaving Protocol has the same fixed-cost/fixed-gate/
discrete-effect shape as an ordinary Sorcery spell (unlike Sidereal's
fully freeform Astrology Resplendent Effects, which stay an unautomated
`sidereal-astrology.ts` reference panel), Weaving Protocols are validated
as real, schema-checked selections through the same `powers.spells`
bucket Sorcery/Necromancy spells already use, via a new
`alchemicalWeavingProtocolIds` Set checked in `schema.ts` -- replacing the
prior shared Alchemical/Fair-Folk placeholder branch (which incorrectly
claimed Alchemical "has no Sorcery/spell system at all... expected to
remain permanent") with a real Alchemical-specific branch, while leaving
Fair Folk's own placeholder branch intact and correctly labeled. Several
protocols explicitly defer their full cost/target/duration to a named
Sorcery spell rather than restating it; cross-checked every such name
against the shared `dragonblooded-sorcery.json` catalog and captured the
match in a new `equivalentSorcerySpellId` field (asserted at module load
time to resolve to a real shared-catalog id, exactly like
`lunarSorcerySpellIds`'s own load-time assertion): Crystal Lotus of Repose
(Sleep of Stony Safety), Lightning Elemental Concatenation Protocol
(Lightning Spider), Sonic Hammer Vocalization (Thunder Wolf's Howl),
Summon Autochthonian Elemental (Summon Elemental), Vision-Transmitting
Protocol (Infallible Messenger), Machine-Soul Essence Baffle (Mercury's
Deliverance), Pattern Suspension Protocol (Eternal Crystalline
Encasement), and Plague of Bronze Snakes (Plague of Bronze Snakes -- same
name, same Savant and Sorcerer p. 112 citation as the shared catalog's
existing entry; a genuine confirmed match, not an id collision, even
though the two rows happen to share the same literal id string -- each
stays a fully independent catalog entry with its own id/name/summary).
Left `null` for two further protocols that likewise name a specific spell
they defer to (Maser Palm Technique to "Blood of Boiling Oil",
Instantaneous Transfer Protocol to "Travel Without Distance") because
neither spell exists in the shared catalog today, apparently drawn from
the Exalted core rulebook's own spell list rather than Savant and
Sorcerer/Book of Three Circles; rather than guess at an id or fabricate a
new spell entry, these two keep their deferred-mechanics text in
`description` only. Also left `null` for Summon Machine Spirit despite it
naming Summon Elemental, since its own text says it only "functions like"
that spell while summoning a genuinely different kind of being -- a
narrative comparison, not a true mechanical defer like the 8 confirmed
matches.

The 3 Alchemy Formulae rows (Sweet Sleep Surrogate Syrup, Friction-
Banishing Preparation, The Maker's Inertial Bile, printed p. 161/PDF 162)
are each gated by an "Alchemy" dot rating plus a Minimum Backing rating
plus an Intelligence + Occult roll -- none of which this app's character
schema models as a trait anywhere, and this app has no dice-rolling engine
to automate the roll either way. Building a dedicated new trait field to
validate purchase of just 3 rows would be overengineering relative to
every other family's precedent, so `alchemicalFormulae` stays a small
browsable reference catalog (Zod-validated for shape, but never wired
into `powers.spells` or any other character-selection schema), matching
`sidereal-astrology-rules.json`'s own precedent of counting toward
`promotedEntries` via the audit script's `${family}-*.json` glob despite
being unautomated reference text.

`certification/alchemical.json`'s `promotableEntries` is recomputed this
phase from the prior 207 preliminary keyword-based estimate (flagged since
Phase 1a as approximate) to a precise 214 (6 Backgrounds + 71 Merits/Flaws

- 96 Charms + 38 Weaving Protocols + 3 Alchemy Formulae), now exactly
  matching `promotedEntries`, which rose from 173 to 214; `checksum` was
  recomputed to `1d839847` now that `alchemical-weaving-protocols.json` and
  `alchemical-formulae.json` have joined `alchemical-charms.json` under the
  family's own `alchemical-*.json` glob -- closing Alchemical's catalog
  dimension (214 of 214), same as Abyssal/Sidereal/Lunar's own fully-closed
  catalogs. Even with the catalog dimension fully satisfied, `certifiedAt`
  stays null and Alchemical stays fully locked: all four test dimensions are
  still `'not-run'`, and Phase 6's rule requires all five planned families to
  reach `certifiedAt !== null` together. A new 13-test
  `alchemical-weaving-protocols-catalog.test.ts` suite covers catalog shape,
  the Man-Machine/God-Machine split, Clarity-gate parsing (including the
  Minimum/Maximum pair and the highest-gate row), preserved extra
  requirement text, and the `equivalentSorcerySpellId` cross-references
  (both confirmed and deliberately-`null` cases); `exalted1e-alchemical.test.ts`
  gained real Weaving Protocol accept/reject coverage through `powers.spells`,
  replacing the old blanket spell-rejection placeholder test. Full
  verification passed: typecheck, lint, format check, the full
  unit+integration suite (952 tests), the Exalted e2e smoke specs,
  `audit:exalted-sources`, and a production build. `Exalted1eEditor.tsx`
  remains untouched this phase too; Alchemical stays fully locked out of
  `definition.tsx`'s user-facing `variants` list. The Clarity Trait,
  Charm-Slot/Panoply/Array installation tracking, and any editor UI wiring
  for this family all remain out of scope, deferred to a future phase.

**Correction to the "`Exalted1eEditor.tsx` remains untouched" claim repeated
across Phases 1a-1c:** that statement was accurate only for _creating_ a new
Alchemical character, never for _editing_ one that already exists.
`ExaltedFamilyStatePanel.tsx`, a shared component `Exalted1eEditor.tsx`
renders unconditionally for every Exalted character regardless of
`sheetType`, already had a full (if stale-catalog-referencing) Alchemical
branch wired in before any of these phases began, built against the
unverified OCR draft in `./reference/family-powers` instead of the real
`alchemical-powers.ts` catalog and referencing a non-existent
`installationCost` field. This had to be fixed in the phase below
regardless, since that phase's `familyState` field renames would otherwise
have left the file non-compiling.

Alchemical's next phase (Clarity Trait plus Charm-Slot/Panoply/Array
installation tracking) redesigns `familyState`'s Alchemical shape from a
single flat `clarity: number` (0-10) and a single `charmSlots: number`
(0-99) into five fields: `clarityPermanent` (0-10, described in _Exalted:
The Autochthonians_ p. 69 as effectively irreversible, gained only from
Essence above 5 or certain installed Charms) and `clarityTemporary` (0-10,
fluctuating via Virtue-suppression gains and human-contact/embracing-
Virtue losses -- session-level trigger events this app cannot observe or
automate), replacing the single ambiguous `clarity` number; and
`dedicatedSlots` (0-99) and `generalSlots` (0-99), replacing the single
`charmSlots` number, modeling the source's real distinction that Dedicated
Slots only accept Charms tied to a Favored/Caste Attribute while General
Slots accept any Charm. New invariants enforced in `schema.ts`'s main
`superRefine`: `clarityPermanent + clarityTemporary` may never exceed 10
(the Trait's real fixed maximum); `clarityPermanent` must be at least
`max(0, essence.rating - 5)`, the one Clarity rule precise enough to
enforce as fixed arithmetic off an already-stored field (Inhuman Essence,
p. 69) without simulating the unobservable Virtue/human-contact triggers;
every `installedCharmIds` entry must resolve to a real `alchemicalCharmIds`
id with no duplicates; and `installedCharmIds.length` may never exceed
`dedicatedSlots + generalSlots`. Deliberately out of scope, matching this
project's anti-overengineering stance: the Dedicated-Slot Favored/Caste-
Attribute eligibility restriction itself (would require cross-referencing
`creation.favoredAttributeIds`/`identity.caste` against each Charm's
governing Attribute, a creator-phase feature Alchemical does not have
yet); Submodule reduced-installation-cost bookkeeping; and the Panoply
(owned-but-uninstalled reserve Charms) concept, since this app has no
separate Panoply-inventory UI anywhere.

`EXALTED1E_SCHEMA_VERSION` bumped 11 -> 12 with a guarded migration step
(skipped if `clarityPermanent` already exists on the record, so an
already-migrated record is never silently clobbered back to defaults):
legacy `clarity` maps to the new `clarityTemporary`, leaving
`clarityPermanent` at a safe default of 0 (there is no way to know after
the fact which part of an old flat number was meant to be the irreversible
share); legacy `charmSlots` maps to the new `generalSlots`, the more
permissive slot type, leaving `dedicatedSlots` at 0 (there is no way to
verify after the fact whether an already-recorded installed Charm would
have legally occupied a Dedicated Slot). `profiles.ts`'s
`createDefaultFamilyState` for `'alchemical'` was updated to the new
five-field shape; a blank character still starts all four numeric fields
at 0 (not the canonical starting 4+4 Slots), matching this project's "no
false choices until a real creator phase exists" convention used
elsewhere (e.g. Sidereal's blank `colleges: {}`).

Fixing the pre-existing `ExaltedFamilyStatePanel.tsx` Alchemical branch was
done by extracting a new, catalog-accurate `AlchemicalInstallationPanel.tsx`
component, following the same per-family sub-panel pattern already
established by `LunarShapechangingPanel.tsx` and
`SiderealAstrologyPanel.tsx`: two mutually-clamped `DotRating` controls for
Permanent/Temporary Clarity (each passes `max={10 - theOtherRating}` so
their sum can never visually or functionally exceed 10), Dedicated/General
Slot number inputs (disabled outside build mode; Clarity dots stay
editable in Play mode since both its gain and loss are explicitly session-
driven per the source text), a slot/mote usage summary, and an
owned-Charms-only checkbox list (sourced from the real `alchemicalCharmById`
map, not the stale OCR draft) that disables further installs once
`dedicatedSlots + generalSlots` capacity is reached.

Full verification passed: a cache-busted clean `tsc -b --force` (a plain
`tsc --noEmit -p .` was returning false-positive clean results against a
stale `node_modules/.tmp/*.tsbuildinfo` cache after the `familyState` field
renames), `npm run lint`, the full unit+integration suite (970 tests; 2
unrelated pre-existing test-runner timeouts in `ars-magica-editor.test.tsx`
and `mage20-module-editor.test.tsx`, neither touched this phase, both
confirmed passing in isolation -- a resource-contention artifact of
running the full suite in parallel, not a regression), the full 87-spec
Playwright e2e suite, `audit:exalted-sources` (0 issues; its own narrower
promoted-row count rose 96 -> 137, the same already-established gap
against `certification/alchemical.json`'s `promotedEntries` seen on every
other certified-catalog-dimension family), and a production build. New
coverage: 9 new tests in `exalted1e-alchemical.test.ts` (7 for the
Clarity-sum/Inhuman-Essence/installed-Charm-id invariants, 2 for the
version-12 migration's real-legacy-data mapping and its already-migrated
guard) plus a new 8-test `tests/integration/alchemical-installation-panel.test.tsx`
exercising the extracted panel directly. Alchemical remains locked exactly
as before: `certifiedAt` stays null, and Phase 6's all-five-families-
together rule still prohibits adding Alchemical to `definition.tsx`'s
`variants` list on its own.

Fair Folk's Phase 1a (Backgrounds plus Merits/Flaws catalog promotion)
mirrors Lunar/Abyssal/Sidereal/Alchemical's own starting phase exactly.
Unlike those four families, `'fair-folk'` was already a legal,
schema-validated stored `sheetType` before this phase -- it was added
when this project's five-family schema foundation was first scaffolded,
rather than by any later per-family promotion phase, so this phase did
not need to touch `exaltedCharacterTypes`. `fairFolkBackgrounds` in
`definitions.ts` (13 ids) resolves the inventory's own determination:
five wholly new ids (Birth, Freehold, Gossamer, Retinue, Style, from
Chapter Four's "New Backgrounds" section); six altered shared ids kept
with raksha-specific mechanics (Artifact, Familiar, Manse, Backing,
Contacts, Influence -- the last three explicitly described as rare but
not excluded, scoped only to standing among mortals in Creation rather
than among the Fair Folk themselves); and two unaltered shared ids,
Allies and Mentor, **included** rather than held back, since the Common
Raksha Character Creation summary affirmatively names "a dot of Allies,
Contacts or Mentor" as a real option a commoner's zero free Background
dots make hard-won -- the same kind of textual confirmation Lunar's own
Background section relies on, unlike Alchemical's silence-based exclusion
of the same three ids. Followers and Resources are excluded outright per
the source's own "Raksha do not use these Backgrounds" instruction.
`backgroundIdsBySheetType['fair-folk']` in `schema.ts` now resolves to
this real 13-entry set (was an empty placeholder).

For Merits/Flaws, `dragonblooded-merits-flaws.ts`'s `appliesTo` enum was
widened to include `'fair-folk'`, added to 75 shared catalog entries (73
inventoried `pg-merit-*`/`pg-flaw-*` rows resolving one-for-one, except
the two dual merit/flaw split pairs -- `mutation-merit`/`mutation-flaw`
and `favor-merit`/`favor-flaw` -- each counted twice at the catalog-entry
level); a new `fairFolkOnlyTraits` export mirrors `alchemicalOnlyTraits`.
No new Fair-Folk-only entries or `sharedCostOverrides` were needed -- every
applicable row keeps its underlying shared cost unchanged, confirmed
directly for Destiny (the source's "Destiny and Exaltation" sidebar caps
only Celestial/Abyssal/Infernal Exaltation, a process raksha never
undergo, so Destiny correctly falls through to the uncapped 1-5 shared
range). Several included rows required reinterpretation for a raksha's
own non-Exalted framework, each judgment call documented verbatim in that
row's own `notes` field in the Fair Folk inventory rather than duplicated
into the shared catalog file (matching Alchemical's own precedent): Large
Size/Small keyed to the universal Assumption-type shapeshifting Charm
tree instead of Lunar forms; Cache/Debt keyed to the Gossamer
Background's own documented "effective Resources" dot table instead of
the excluded Resources Background; Vice/Callous cross-referenced to
Bedlam (this splat's Limit-Trait analog) instead of the Great Curse;
Unskilled's floor reframed around Caste Abilities instead of Favored
Abilities; Prodigy included by analogy to Dragon-Blooded/Sidereal (whose
Caste/Favored Ability structure closely parallels a raksha's own) despite
being excluded for Solar/Abyssal/Lunar by name and for Alchemical by a
separate, Attribute-favoring rationale; Destiny/Dark Fate/Unbidden Oracle
included as selectable despite a flagged Loom-of-Fate conceptual tension,
since raksha are canonically native to the Wyld outside Creation's Loom
of Fate and the source text itself states no eligibility restriction; and
Mutation/Weak Essence flagged as unusually strong, barely-adapted fits,
since raksha are literally Wyld-stuff given shape and every raksha starts
at Essence 2 exactly as Weak Essence's own "other magical beings" clause
requires.

`promotedEntries` grew from 0 to 88 (13 Backgrounds + 75 Merits/Flaws);
`checksum` stays empty, matching Alchemical's own Phase 1a precedent
exactly -- neither Backgrounds (which live in `definitions.ts`) nor
Merits/Flaws (a subset of the shared `dragonblooded-merits-flaws.json`)
live in a `fair-folk-`-prefixed catalog file this project's
`scripts/audit-exalted-sources.mjs` glob would hash; the checksum will
only become non-empty once a future phase adds a real `fair-folk-*.json`
catalog file (e.g. Charms or Graces). Fair Folk's Charms/spells remain
correctly rejected via the existing placeholder branches in `schema.ts`'s
`powers.spells`/`charmIdsBySheetType` (out of scope this phase).

**Correction to this document's and the certification record's prior
framing:** `Exalted1eEditor.tsx`'s shared `ExaltedFamilyStatePanel.tsx`
component already renders a basic Fair Folk Graces/Active-Assumption/
Feeding-Notes/Oaths panel unconditionally for any Fair-Folk-typed
character record (the implicit final branch of that component's
`sheetType` switch, predating this phase) -- "unreachable through the
character-creation UI" is and was only ever true for _creating_ a
brand-new Fair Folk record via `definition.tsx`'s `variants` list, never
for _editing_ one that already exists, exactly the same nuance already
corrected for Alchemical above.

Full verification passed: typecheck, lint, format check, the full
unit+integration suite (including a new 48-test
`exalted1e-fair-folk.test.ts` and the extended
`dragonblooded-merits-flaws-catalog.test.ts`), the Exalted e2e smoke
specs, `audit:exalted-sources` (0 issues; its own narrower promoted-row
count stays 0 for Fair Folk, matching Alchemical's own Phase 1a -- neither
family's Backgrounds/Merits-Flaws promotion lives in a file-glob-scanned
catalog file), and a production build. Fair Folk remains locked exactly
as before: `certifiedAt` stays null, and Phase 6's all-five-families-
together rule still prohibits adding Fair Folk to `definition.tsx`'s
`variants` list on its own.

Fair Folk's Phase 1b (Graces, Bedlam, and the Grace-Forging/Assumption
Charm trees) promotes 30 more entries (88 -> 118) across three new
`fair-folk-`-prefixed catalog files -- the family's first, so its
`checksum` is no longer empty. `fair-folk-graces.json` (6 rows:
`graces-overview` plus one row each for Cup/Ring/Staff/Sword/Heart)
transcribes each Grace's full rating table verbatim. A new
`fairFolkGraces` export in `definitions.ts` documents the four Virtue
Graces' feeding mapping (Cup feeds Compassion, Ring feeds Temperance,
Staff feeds Conviction, Sword feeds Valor); Heart has no feeding Virtue
and its rating is status-fixed by a raksha's standing (common/heroic
common/noble/powerful noble/unshaped), not freely raised with bonus
points. Major/Minor Grace-count enforcement (one Major Grace for a common
raksha, two for a noble) and the noble/common creation-track split remain
unenforced this phase.

`fair-folk-bedlam.json` (5 rows: `bedlam-overview` plus one row per
Virtue-specific Curse) required splitting the inventory's own single
compound `virtue-bedlam-curses` row into four real per-Virtue inventory
rows (`curse-of-hubris`/`curse-of-namelessness`/`curse-of-alienation`/
`curse-of-meekness`, all still citing p. 113/PDF 114) before promotion,
mirroring Lunar's own `the-great-curse`/`curse-of-the-*` inventory-level
split precedent exactly -- no new mechanics text was invented, only the
original's own per-Virtue paragraph breaks used as the split points, and
every inventory row that cross-referenced the old compound id was
rewired to the new split ids. That rewiring surfaced an important,
independently cross-verified finding: **the Curse a broken Grace
inflicts does not match that Grace's own feeding Virtue** -- breaking Cup
inflicts the Curse of Alienation (Temperance's Curse, not Compassion's),
breaking Ring inflicts the Curse of Meekness (Valor's, not Temperance's),
breaking Staff inflicts the Curse of Hubris (Compassion's, not
Conviction's), and breaking Sword inflicts the Curse of Namelessness
(Conviction's, not Valor's) -- confirmed independently from both the
Curses' own row text and each `forging-the-(grace)-grace` Charm's own
cross-reference text. In `schema.ts`, `familyState`'s fair-folk branch
adds a `bedlamVirtueId` field (nullable Virtue id) that tracks only the
resulting _state_ of which Curse, if any, is currently active --
Bedlam's own channel-counting trigger mechanic is explicitly
session/scene-tracked play-table bookkeeping this app cannot observe,
matching the established precedent (Alchemical's Clarity gain/loss
triggers) of leaving such mechanics unmodeled rather than fabricating a
way to track them.

`fair-folk-charms.json` (19 rows) promotes two real, page-cited,
Zod-validated Charm trees: "Grace Forging" (11 entries -- the six
"Forging the (Grace) Grace" Charms, including the exotic sixth Way/
shinma-Nirupadhika Grace, plus five parallel Freehold-anchor Charms --
Arcane Redoubt, Stronghold, Glory, Fountainhead, Throne Room) and
"Assumption" (8 entries -- the universal, Grace-independent gateway
Charms rooted in shinma Nirakara that let a raksha exist as a shaped
creature at all). `forging-the-heart-grace`'s own real prerequisite,
Shape-Forged Servant, falls outside this phase's 19-entry scope, so it is
kept honestly in `prerequisiteText` and a `reviewFlags` note rather than
fabricated into `prerequisiteCharms` -- mirroring Alchemical's own
`superRefine` enforcement, which requires every `prerequisiteCharms` id
to resolve within the same catalog. Every Charm also carries a
`comboRules` field, matching the field every other Exalted family's
Charm schema requires: all 19 default to Combo-eligible with no
restrictions, since this phase's own source review found no explicit
per-Charm Combo-restriction sentence in any of their transcribed text --
an honest reflection of what was found, not an assumption that no such
restriction exists anywhere in the book.

`charmIdsBySheetType['fair-folk']` in `schema.ts` now resolves to the
real 19-entry set (was an empty placeholder); `familyState`'s `graces`
field is now restricted to the five real Grace ids (was an unrestricted
string-keyed record); spells remain correctly rejected (no Glamour
Sorcery catalog exists yet). A new `fromVersion < 13` migration cleans
any stray non-Grace keys out of an existing character's `graces` record
and backfills `bedlamVirtueId: null`, mirroring Sidereal's/Lunar's/
Alchemical's own prior field-addition migration precedents exactly;
`EXALTED1E_SCHEMA_VERSION` bumped 12 -> 13. A new
`FairFolkGracesPanel.tsx` component (mirroring
`LunarShapechangingPanel.tsx`'s structure) renders a Bedlam Virtue
selector bound to the new `bedlamVirtueId` field plus collapsible
reference entries for all five Graces and all four Curses, wired into
`ExaltedFamilyStatePanel.tsx` alongside its existing bare Graces-dots/
Active-Assumption/Feeding-Notes/Oaths panel -- still reachable only by
_editing_ an already-existing Fair-Folk-typed record, not by _creating_
one, exactly as Phase 1a's own correction already established. No
dedicated Charms-browsing UI branch was added to `Exalted1eEditor.tsx`'s
shared `ExaltedPowersSection`, matching Alchemical's own identical,
already-accepted precedent of deferring that UI even after its own
Charms catalog was promoted.

Full verification passed: typecheck, lint, format check, the full
unit+integration suite (including a new 13-test
`fair-folk-charms-catalog.test.ts`, the extended 87-test
`exalted1e-fair-folk.test.ts` -- including Phase 1b's own
`fromVersion < 13` migration coverage -- and a new 5-test
`tests/integration/fair-folk-graces-panel.test.tsx` exercising the new
panel directly), `scripts/audit-exalted-sources.mjs` (0 issues; its own
narrower promoted-row count is now 30 for Fair Folk, counting only the
three new `fair-folk-*.json` catalog files, not the Backgrounds/
Merits-Flaws that live outside its file glob), the Exalted e2e smoke
specs, and a production build. Fair Folk remains locked exactly as
before: `certifiedAt` stays null, and Phase 6's all-five-families-
together rule still prohibits adding Fair Folk to `definition.tsx`'s
`variants` list on its own.

Fair Folk's Phase 1c (Glamour Charms, the remaining "Greater Arts of
Glamour" tail, and Pox/Affliction/Blight Charms) promotes 25 more entries
(118 -> 143) into the same `fair-folk-charms.json`, extending it from 19
to 44 rows. `fairFolkCharmCategories` gains two new categories matching
the book's own section names: "Glamour Charms" (14 entries, pp. 181-185
-- crafting Charms rooted in two parallel trees, Essence-Forging Art and
Gossamer-Forging Art, converging toward Glamour, Monstrous Conceit, and
Burden Ghost Glamour) and "Mutation Charms" (just the 3 independently
purchasable, prerequisite-free Charms -- Pox, Affliction, Blight, pp.
202-203; the section's other roughly 12 rows form a separate branching
combat-Charm tree and remain unpromoted this phase). The existing "Grace
Forging" category grows from 11 to 19 entries, completing the "Greater
Arts of Glamour" tail (pp. 187-192) that Phase 1b's own "Forging the
(Grace) Grace" Charms were themselves drawn from: Gaping Virtue Mouth
(gated on owning all four of Forging the Cup/Ring/Staff/Sword Grace
simultaneously) and its three branches (Iron Nightmare Muzzle, Ecstatic
Reproduction Style, Akshata Sexual Methodology), the consolidated
four-variant Great Works of the (Grace)/Unshaped (Grace) Transformation
pair, the Ring tree's own capstone Extinction of Desire, and
Behemoth-Forging Meditation, a Sword-crossover capstone requiring both
Shape-Forged Servant and Unshaped (Sword) Transformation.

Three Charms (Tainted Creature Command, Monstrous Conceit, Akshata Sexual
Methodology) are diagrammed under the Ring's own trees but explicitly
gate on Minimum Staff instead, per the source's own repeated cross-Grace
crossover pattern (also flagged elsewhere in the inventory for
Beguilement, Spite-Summoning Malediction, Prince and Pauper Approach, and
Undetectable Lie, none of which are promoted yet); each one's
`minimumRequirements` reflects only the trait actually named in its own
requirements text, and each carries a `reviewFlags` note documenting the
crossover. This phase finally resolves Phase 1b's own flagged gap:
`forging-the-heart-grace`'s real prerequisite, Shape-Forged Servant, is
now promoted in this same catalog, so its `prerequisiteCharms` was
updated from `[]` to `['shape-forged-servant']` and its `reviewFlags`
note removed. One new, unrelated prerequisite gap was found and flagged
the same honest way: Monstrous Conceit's own requirements name two
prerequisites, Undetectable Lie and Glamour; Undetectable Lie belongs to
the still-unpromoted "Ring Combat Charms" section, so it stays out of
`prerequisiteCharms` (mirroring Alchemical's own `superRefine`
enforcement) and is kept honestly in `prerequisiteText`/`reviewFlags`
instead, while Glamour (in scope this phase) resolves normally.

Two further rows, Great Works of the (Grace) and Unshaped (Grace)
Transformation, are each consolidated four-variant single-header Charms,
following the inventory's own established precedent for this pattern
(e.g. Assumption of Elemental Shape, Bastion of the Self). Great Works of
the (Grace)'s own text references Glamour Sorcery, Wyld Artifacts,
Adjurations, and Behemoths as the artifact types it creates, none of
which (besides Behemoth-Forging Meditation itself) has a promoted catalog
yet, so those remain descriptive text only, not fabricated
cross-references. None of this phase's 25 Charms' own transcribed text
contains an explicit Combo-restriction sentence, so all default to
Combo-eligible with no restrictions, exactly like Phase 1b's own 19.

Full verification passed: typecheck, lint, format check, the full
unit+integration suite (including the rewritten 18-test
`fair-folk-charms-catalog.test.ts` and the extended 112-test
`exalted1e-fair-folk.test.ts`, plus updated expectations in
`exalted1e-source-audit.test.ts` and `exalted1e-verification.test.ts`),
`scripts/audit-exalted-sources.mjs` (0 issues; its own narrower
promoted-row count is now 55 for Fair Folk, counting only the three
`fair-folk-*.json` catalog files -- `fair-folk-charms.json` now grown to
44 rows, plus the unchanged `fair-folk-graces.json`/`fair-folk-bedlam.json`
-- not the Backgrounds/Merits-Flaws that live outside its file glob), the
Exalted e2e smoke specs, and a production build. Fair Folk remains
locked exactly as before:
`certifiedAt` stays null, and Phase 6's all-five-families-together rule
still prohibits adding Fair Folk to `definition.tsx`'s `variants` list on
its own.

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
