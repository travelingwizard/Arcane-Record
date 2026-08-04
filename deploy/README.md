# VPS deployment

`character.travelingwizard.net` is served as a static Vite build from
`/opt/arcane-ledger/current` on the VPS. It does not need a database or a
Node/systemd runtime service: character data remains in each browser's
IndexedDB.

Deploy a fresh `dist/` directory to a timestamped release directory, update
the `current` symlink atomically, and reload Nginx only after `nginx -t`.
The tracked Nginx configurations document the initial HTTP host and final
HTTPS host.
