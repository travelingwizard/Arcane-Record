# 03. Data model

`MageCharacter` contains:

- `id`: UUID independent of name;
- `systemId`: literal `mage-m20`;
- `schemaVersion`: current integer schema version;
- ISO creation and update timestamps;
- `identity`: named string fields;
- `attributes`: grouped integer ratings;
- `spheres`: a record of integer ratings;
- `affinitySphere`: one Sphere ID or `null`;
- `repeatableEntries`: reserved typed arrays for later sections;
- `health`: a reserved typed health state.

Ratings are integers. Dot controls derive their filled presentation from the rating rather than persisting Boolean arrays.

Stored records are parsed with Zod when read. Invalid records fail at the storage boundary instead of silently entering editor state. Future schema migrations will be keyed by `schemaVersion`.
