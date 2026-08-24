# Phase 7: homebrew and local Module Library

The character library now links to a browser-local Module Library. It displays
bundled and imported package states, stages JSON/YAML before writing, shows
identity, version, authors, license, capabilities, diagnostics, and canonical
SHA-256 checksum, and requires explicit local approval.

Installed versions are immutable and coexist side by side. Users can enable or
disable a module, activate or roll back to an installed version, export the
validated package, compare the newest versions semantically, and create a full
isolated fork with exact `forkedFrom` provenance. Enabled installed sheet
templates appear in the ordinary two-step character creation experience.

Overlay conflict preview reports every target field claimed by more than one
overlay. Conflicts are deterministic and block any future activation workflow
until resolved. Character-owned custom definitions and definition overrides
are stored outside immutable module data, receive highest resolution
precedence, and round-trip in module-backed character JSON/YAML.

A distinct `arcane-record-local-archive` JSON format can contain characters and
exact package envelopes. It has a 25 MB input budget and verifies every module
checksum. The ordinary character importer does not accept it, so archive and
character restore semantics cannot be confused.
