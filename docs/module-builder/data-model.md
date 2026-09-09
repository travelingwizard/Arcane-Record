# Module Builder data model

Stable `DataPath` values use the `character` root and immutable path segments. Labels, layout, and component position are presentation and may change without moving stored data.

The module envelope distinguishes schema defaults, explicit character values, calculated displays, and recorded overrides. Catalog definitions remain in packages; characters store definition IDs, instance IDs, chosen values, notes, and unresolved/custom markers.

Path changes require an explicit `rename-path` migration. Deletion never silently removes character data: unresolved values remain available to migration/recovery tooling. Duplicate bindings are diagnosed unless the component explicitly provides an alternate view of the same path. Draft history, appearance preferences, builder selection, and preview viewport are not character data and are excluded from character exports.

Package format and schema versions advance independently. Immutable published versions cannot change bytes; upgrades install a new version and execute only closed, schema-declared migration operations.
