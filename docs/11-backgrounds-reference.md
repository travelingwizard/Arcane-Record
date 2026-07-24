# 11. Background reference data

## Source and conversion

`docs/references/mage-m20/backgrounds.md` is the only catalog source. `scripts/generate-backgrounds.mjs` converts its 33 entries into reviewed static JSON. Runtime Zod validation checks stable IDs, names and aliases, rating metadata, one- or two-point multipliers, restrictions, repeatability, pooling, citations, and duplicate IDs.

The catalog contains nine definitions marked `1–5+`, three definitions costing two points per dot, three restricted definitions, eight definitions configured for multiple instances, and one poolable definition. `Mage 20, p. page` and `OpD, p. page` citations remain visible in collapsed catalog and selected cards.

Slash-separated entries preserve the full source name and expose each part as an alias. The source does not explicitly label every half as mystic or Technocratic; the reviewed data follows the source ordering for those optional fields without changing the visible combined name.

## Ratings and point calculations

Standard entries accept ratings 1–5. Entries marked `1–5+` accept ratings through an interface safety maximum of ten and display a Storyteller-approval notice above five. Ten is not presented as a universal Mage rule.

Creation cost is `rating × creationPointCostPerDot`. Enhancement, Sanctum / Laboratory, and Totem cost two points per dot; all other supplied definitions cost one. The standard allowance is seven Background points with warning-only enforcement:

- `pointsSpent` is the sum of known selection creation costs.
- `pointsRemaining` is the greater of zero and seven minus points spent.
- `pointsOver` is the greater of zero and points spent minus seven.

Unresolved imported definitions have no trustworthy multiplier, so they remain visible but are excluded from totals until repaired.

## Selection behavior

Allies, Alternate Identity, Contacts, Mentor, Patron, Retainers, Sanctum / Laboratory, and Wonder support multiple instances based on the task's explicit examples. The source itself does not define repeatability, so all other definitions conservatively prevent accidental duplicates.

Each instance stores its own UUID, character label, rating, notes, addition timestamp, and pooling flag. Only Chantry / Construct can be marked as pooled. Pooling is local descriptive state; there is no campaign or cross-character synchronization.

Technocracy-only and shamanic-character restrictions are informational warnings. They do not block editing, saving, or import. Unknown references may be removed or repaired with a compatible catalog definition.
