# Phase 8: hosted Module Registry

## Implemented boundary

The separately built Module Registry stores publisher identity references,
namespace grants carried in signed claims, quarantined stages, immutable
validated module packages, SHA-256 checksums, review/deprecation metadata,
recommended-version pointers, token revocations, and append-only security audit
events. It never accepts or stores characters, local drafts, preferences,
appearance data, creation progress, analytics, telemetry, or usage events.

The character application remains static and local-first. Opening the hosted
catalog is an explicit action. Downloads omit credentials, are validated again
in the browser, and must match the registry checksum before IndexedDB install.
An outage leaves installed modules and every character usable.

## Authentication and authorization

The service verifies short-lived Ed25519-signed JWT access tokens against a
configured issuer and audience. Tokens declare the actor, roles, namespace
grants, authentication methods, expiration, and revocable token ID. Publisher,
reviewer, and registry-admin authorization is enforced on the server. Namespace
grants match the exact module ID or a dot-delimited child namespace.

Publication requires a reviewer other than the staging publisher and approval
of the exact staged checksum. Registry administration requires `webauthn` or a
hardware-key authentication claim. Mutations use bearer tokens rather than
cookies, so there is no ambient cookie/CSRF authority. Tokens and private keys
are environment/identity-provider inputs and never enter source, browser
storage, packages, logs, or command arguments.

## Package lifecycle

The registry independently runs the closed module validator, executable-content
scan, dependency resolution, structural budgets, rule/action/flow cycle checks,
license requirements, and asset restrictions. Uploads are capped at 5 MB and
stored outside the public package tree.

Published `(moduleId, moduleVersion)` files are created with exclusive writes
and are never replaced. Deprecation appends a reason without deleting bytes.
Rollback only moves a recommended-version pointer to an existing,
non-deprecated version. Metadata writes use atomic rename and mutations are
serialized to prevent same-version races.

Public endpoints expose health, catalog metadata, and immutable package bytes.
Authenticated endpoints stage, inspect, approve, reject, deprecate, roll back,
and revoke tokens. The CLI reads credentials from environment variables.

## Operational controls

The service includes per-client mutation/read rate limits, request/body limits,
generic authentication failures, strict CORS allowlists, HSTS/CSP/nosniff
headers, request IDs, and audit events containing actor/action/module/checksum/
outcome but no character data. The build emits a separate Node service bundle.

Tracked deployment assets define an isolated system user, read-only systemd
sandbox, dedicated writable data directory, separate Nginx virtual host, TLS,
5 MB proxy limit, environment configuration, 30-day backup rotation, and
restore/checksum guidance. The registry does not share the character static
root or HEMA upstream.

## Release status

Implementation and local verification are complete. The registry has not been
deployed or publicly opened because deployment/public publication were not part
of this authorization. Before launch, supply the chosen identity provider,
real issuer/audience/public key, DNS/TLS, retention owner, monitoring and alert
destination, security-reporting contact, and an independent review of the
deployed authorization and backup policy.
