# Exalted 1e — Lunar source intake

**Status: intake in progress.** *Exalted: The Lunars* (PDF, image-scan)
has been supplied and partially inventoried. See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory follows.

`inventory/exalted-the-lunars.json` currently has 54 reviewed rows. Every row
was visually compared against a rendered page of the source PDF before being
marked `reviewed` — none of this content came from OCR alone. It covers:

- The core innate powers: Lunar Shapechanging, the Tell, True Forms, Fixing
  the Caste/tattooing, A Lunar Without a Caste.
- The complete **Shapechanging I** tree (Hide of the Cunning Hunter, Masking
  the Brilliant Form, Finding the Spirit's Shape, Deadly Beastman
  Transformation, Calling Luna's Favor, Blossoming Gift of Luna, Towering
  Beast Form) with its Beastman Transformation gift table (10 gifts).
- The complete **Shapechanging II** tree (Humble Mouse Shape, Shaping the
  Ideal Form, Many-Faced Moon Transformation, Prey's Skin Disguise, Lunar
  Blood Reshaping Technique, Wondrous Lunar Transformation, Shaping the
  Once-Living Form) and **Shapechanging III** tree (Fish Tail Technique,
  Tool-Hand Technique, Rat-Head Technique).
- The complete **Body Enhancement I** tree (Ox-Body Technique, Crouching
  Tiger Exercise, Moonsilver Monkey Exercise, Regaining Breath Exercise,
  Breath-Drinking Executioner Attack) and **Body Enhancement II** tree
  (Predator Grace Method, Panther Stride Stance, Cat-Falling Attitude,
  Flying Tiger Technique, Tree-Dwelling Jaguar Claws, Cat Paw Climbing
  Style).
- The complete **Unarmed Combat I** tree (Body Weapon Technique, Sinuous
  Striking Grace, Tyrant Lizard Strike, Snake Body Technique, Coiled Cobra
  Stance, Hydra Head Attack, Deadly Claw Blow) and the first four Charms of
  **Unarmed Combat II** (Claws of the Silver Moon, Scimitar Claw Technique,
  Adder Fang Method, Burning Saliva Attack).

A few rows carry explicit `notes` flagging spots that need a closer look
before promotion (an illegible cost line on Cat-Falling Attitude, and an
awkward cap-formula sentence on Hydra Head Attack that may be OCR/print
damage in the original).

Still outstanding from *Exalted: The Lunars*: the rest of Unarmed Combat II,
Unarmed Combat III, the weapon-Charms cascades (Dance of the Living Blade
and its branches), sorcery, Backgrounds, Merits and Flaws, caste/tribe
character-creation options, and any Lunar-facing material in the cross-splat
supplements listed in the top-level intent (Blood and Salt, Book of Bone and
Ebony, Savage Seas, etc.) once their Lunar-relevant sections are identified.

Nothing here has been promoted to a production catalog yet (`promotedEntries`
stays `0` until rows are wired into schema/rules/UI, not merely inventoried).

## What needs to be added here, book by book

1. `source-manifest.json` — one entry per source book in scope (at minimum
   *Exalted: The Lunars*; supplements only if their Lunar-facing mechanics are
   complete), in the same shape as
   `docs/references/exalted1e/dragon-blooded/source-manifest.json`.
2. `inventory/<book-slug>.json` — one file per book, each an array of
   inventory rows (structured Tell, tattoos, Heart's Blood, forms/Traits,
   shapeshifting limitations, Charms, Backgrounds, Merits/Flaws, etc.) using
   the `InventoryRow` shape defined in `docs/18-exalted1e-splat-release.md`.

## Do not add yet

- Do not add a production catalog under `src/games/exalted1e/reference/` for
  this family — that only happens after inventory rows are visually reviewed
  against the rendered source page.
- Do not add `lunar` to `exaltedSheetTypes` in
  `src/games/exalted1e/definitions.ts` — that stays out of scope until all
  five planned families are certified together.
