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
- `repeatableEntries`: selected Merits and Flaws plus reserved arrays for later sections;
- `health`: an ordered array of typed damage marks.

Ratings are integers. Dot and box controls derive their filled presentation from the rating rather than persisting Boolean arrays.

Merit and Flaw selections contain a selection UUID, stable definition ID, chosen legal cost, notes, and addition timestamp. Catalog descriptions and citations remain in reference data. Unknown imported definition IDs remain visible and preserved so the player can remove or repair them later.

Stored and imported records are parsed with Zod at their boundaries. Invalid records fail instead of silently entering editor state. Schema version 2 adds Abilities and Enlightenment; version 3 adds temporary Willpower initialized from the existing permanent rating; version 4 adds empty Merit and Flaw selections. Older valid records migrate during database upgrade or file import.
