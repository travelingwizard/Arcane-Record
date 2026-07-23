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
- `repeatableEntries`: reserved typed arrays for later sections;
- `health`: an ordered array of typed damage marks.

Ratings are integers. Dot and box controls derive their filled presentation from the rating rather than persisting Boolean arrays.

Stored and imported records are parsed with Zod at their boundaries. Invalid records fail instead of silently entering editor state. Schema version 2 adds Abilities and Enlightenment; version 3 adds temporary Willpower initialized from the existing permanent rating. Older valid records migrate during database upgrade or file import.
