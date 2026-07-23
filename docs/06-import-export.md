# 06. Import and export

JSON and YAML import/export are deferred.

The future boundary will:

1. serialize only character data, excluding view preferences and save status;
2. include `systemId` and `schemaVersion`;
3. validate imported data with Zod before any write;
4. assign a new UUID when importing as a copy;
5. surface validation errors without replacing an active character;
6. perform all parsing locally with no uploads.

`js-yaml` is reserved for YAML support. No current UI suggests import/export is complete.
