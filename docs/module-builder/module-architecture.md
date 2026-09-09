# Module architecture

The authoritative package is the strict, versioned `ArcaneModuleEnvelope`. It contains one root game node, optional child character-type nodes, sheet templates, creation flows, reusable components, catalogs, formulas, validation, dice/actions, themes, sources, and explicit migrations.

Runtime flow is: staged JSON/YAML -> plain-data normalization -> Zod envelope validation -> semantic cross-reference/type validation -> immutable package checksum -> explicit local installation -> dependency resolution -> trusted component registry -> character schema boundary -> repository persistence.

Modules never contain React components, callbacks, HTML, CSS, JavaScript, network endpoints, or executable expressions. Component type IDs map to trusted application renderers. Game and child nodes compose additions and targeted overrides; they do not copy whole parents. Sheets and creation workflows reference the same component IDs and stable character data paths.

Local drafts may be temporarily invalid and autosave independently from installed immutable packages. A package must validate before export, installation, activation, or registry staging. Character records pin module/template versions and retain unknown data during migration review.
