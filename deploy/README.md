# VPS deployment

`character.travelingwizard.net` is served as a static Vite build from
`/opt/arcane-ledger/current` on the VPS. It does not need a database or a
Node/systemd runtime service: character data remains in each browser's
IndexedDB.

Deploy a fresh `dist/` directory to a timestamped release directory, update
the `current` symlink atomically, and reload Nginx only after `nginx -t`.
The tracked Nginx configurations document the initial HTTP host and final
HTTPS host.

`hema.travelingwizard.net` has its own explicit reverse-proxy host to keep it
isolated from the character site. It proxies HTTP and WebSocket traffic to the
existing HEMA service on `127.0.0.1:4173`; the IP-address host remains in the
HEMA repository's original Nginx configuration.

## Module Registry deployment

The optional Phase 8 service is built with `npm run build:registry` and runs as
the isolated `arcane-registry` system user on `127.0.0.1:4180`. The tracked
systemd unit permits writes only beneath `/var/lib/arcane-record-registry`.
Nginx serves it separately as `registry.travelingwizard.net`; it does not share
the character static root or the HEMA upstream.

Copy the environment example to `/etc/arcane-record-registry.env`, supply the
real OIDC issuer/audience and Ed25519 JWT public key, and never place a private
key or access token in the repository. Publisher and reviewer tokens are
issued out of band by the selected identity provider. Admin claims require a
`webauthn` or hardware-key authentication method.

Set `VITE_ARCANE_REGISTRY_URL=https://registry.travelingwizard.net` when
building the character client. Public browsing remains explicit and cached
installed modules continue working during registry outages.

Back up `/var/lib/arcane-record-registry` with `scripts/backup-registry.sh`.
Test restores into a separate directory and verify every package checksum
before changing the service data path. Keep the registry, character app, and
HEMA virtual hosts and service users isolated.
