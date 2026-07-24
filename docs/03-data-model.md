# 03. Data model

`MageCharacter` contains:

- `id`: UUID independent of name;
- `systemId`: literal `mage-m20`;
- `schemaVersion`: current integer schema version;
- ISO creation and update timestamps;
- `identity`: named string fields;
- `attributes`: grouped integer ratings;
- `abilities`: three groups of integer ratings;
- `spheres`: a record of integer ratings;
- `affinitySphere`: one Sphere ID or `null`;
- `enlightenment`: Arete, Willpower, temporary Willpower, Quintessence, and Paradox ratings;
- `repeatableEntries`: selected Backgrounds, Merits, and Flaws plus reserved arrays for later sections;
- `health`: an ordered array of typed damage marks.

Ratings are integers. Dot and box controls derive their filled presentation from the rating rather than persisting Boolean arrays.

Merit and Flaw selections contain a selection UUID, stable definition ID, chosen legal cost, notes, and addition timestamp. Catalog descriptions and citations remain in reference data. Unknown imported definition IDs remain visible and preserved so the player can remove or repair them later.

Background selections contain a selection UUID, stable definition ID, character-specific display name, integer rating, notes, addition timestamp, and local pooling flag. Known definitions validate rating, repeatability, and pooling rules. Unknown definitions remain visible and preserved but are excluded from point accounting until repaired.

Stored and imported records are parsed with Zod at their boundaries. Invalid records fail instead of silently entering editor state. Schema version 2 adds Abilities and Enlightenment; version 3 adds temporary Willpower initialized from the existing permanent rating; version 4 adds empty Merit and Flaw selections; version 5 replaces legacy Background rows with catalog-backed selections. Version-4 labels matching a known definition migrate to that definition when their rating is legal. Other legacy rows become unresolved selections without losing their IDs, labels, ratings, or order.
