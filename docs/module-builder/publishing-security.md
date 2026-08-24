# Publishing registry security boundary

## Current authorization status

On 2026-08-24 the user explicitly authorized the narrow `AGENTS.md` amendment
for a separate hosted Module Registry. Registry implementation and local
verification are authorized. Deployment and public publication still require
separate explicit authorization. Character data, drafts, preferences,
telemetry, analytics, and cloud character sync remain outside the service.

The local application continues to store characters, module drafts, imported
modules, overlays, forks, and preferences in the browser. Even after a registry
exists, none of those objects may be uploaded automatically.

## Intended service boundary

The future registry stores only:

- immutable validated module versions and canonical checksums;
- public module/publisher metadata, dependencies, compatibility and licenses;
- validation/publication/deprecation status and timestamps;
- a mutable catalog pointer to recommended versions and rollback history.

It never stores characters, local drafts, local module inventories, appearance
preferences, creation progress, analytics, telemetry, or usage events. Browse
and verified download are public. Staging, publish, deprecate, and rollback are
authenticated and server-authorized.

Prefer a separate registry service/repository and origin over adding API routes
to the static character application. This limits privilege and prevents a
registry failure from affecting offline character editing. The deployed client
must remain useful with the registry unreachable.

## Roles and permissions

Proposed roles:

- `viewer`: public browse/download; no account required;
- `publisher`: stage versions only for explicitly granted module namespaces;
- `reviewer`: view validation/diff and approve or reject staged versions;
- `registry-admin`: assign namespace roles, deprecate, and roll catalog pointers
  back; cannot rewrite immutable package bytes.

One person may hold multiple roles, but publication should require a separate
review event for official namespaces unless a documented emergency policy
applies. Every mutation verifies authorization on the server against the target
module namespace and action. UI visibility is never an authorization control.

## Authentication and sessions

Authentication provider, account lifecycle, MFA policy, and recovery are
unresolved. Minimum requirements are phishing-resistant MFA for admins,
short-lived secure sessions, `HttpOnly`/`Secure`/`SameSite` cookies or an equally
reviewed token design, CSRF protection for cookie-authenticated mutations,
session revocation, and no secrets in browser storage, module files, logs, Git,
or build output.

CORS permits only approved application/reviewer origins and does not replace
CSRF or authorization. All traffic uses trusted TLS and HSTS. Publisher identity
shown in packages comes from server authorization records, not an untrusted
manifest display name.

## Staging and validation pipeline

1. Authenticate and authorize namespace/version upload.
2. Stream into a strict byte limit outside any served/executable directory.
3. Parse as data with safe JSON/YAML constraints; reject archives until the
   asset threat model is approved.
4. Normalize canonical JSON and calculate checksum.
5. Reject duplicate ID/version, including same bytes, because versions are
   immutable publication identifiers.
6. Re-run the current server-side module schema, ID/reference, dependency,
   inheritance, formula/action/flow/migration, complexity, license, core-version,
   and asset validators. Never trust client validation.
7. Resolve dependencies only from immutable registry records by checksum.
8. Store staged bytes in non-public quarantine and produce stable diagnostics
   and a semantic diff from the prior version.
9. Reviewer approves the exact checksum.
10. Atomically copy/promote immutable bytes and append publication metadata;
    update the catalog pointer separately.

Module content is never evaluated, imported as source, rendered as HTML, or
processed by a browser with registry credentials. Validation workers receive no
outbound network permission where deployment infrastructure supports it.

## Package safety

Reject arbitrary JavaScript, CSS, HTML, executable plugins, remote URLs, unknown
top-level fields, invalid/prototype paths, circular dependencies/inheritance/
formulas, action loops, missing dependencies, incompatible core versions,
oversized structures, and unsafe media. MIME/content detection uses bytes, not
only filenames or submitted headers.

If assets are later accepted, store them by checksum with generated safe
serving headers, `Content-Disposition`, restrictive CSP, `X-Content-Type-Options:
nosniff`, size/dimension limits, decompression limits, and no SVG/HTML/script/
font support until independently reviewed. Published manifests never select
server filesystem paths.

## Immutability, deprecation, and rollback

The `(moduleId, moduleVersion)` key and canonical bytes are immutable. A bad
version is deprecated with a reason; it is not deleted or replaced while
characters may reference it. Rollback changes only a signed/audited catalog
pointer to an existing valid version. Clients with an exact installed version
continue to work and choose upgrades explicitly.

Object storage versioning/retention and database constraints should enforce
immutability independently. Backups include metadata, bytes, checksums,
authorization grants, and audit history, with tested restore procedures.

## Client trust and offline behavior

Downloads include package bytes, checksum, publication metadata, and exact
dependency checksums. The client verifies all checksums and performs the same
activation validation. A published label is provenance, not permission to run
more capabilities. Official, published, and local modules all use the same safe
runtime.

The client caches approved modules in IndexedDB. Network failure leaves cached
modules and characters usable. It never automatically updates an installed
module, migrates a character, enables an overlay, or overwrites a fork.

## Abuse and operations

Apply rate and concurrency limits by IP/account/namespace; cap staged storage;
scan repeated invalid submissions; protect search/download endpoints from
amplification; and return generic authentication errors. Logs record request ID,
actor ID, namespace, action, checksum, outcome, and security diagnostics, but no
module secrets or character data. Retention and access controls need an
operations policy before launch.

Provide a private security-reporting channel, dependency vulnerability updates,
key/session rotation, incident response, and the ability to suspend publication
without taking offline character editing down.

## Required security tests

- unauthenticated staging/publish/deprecate/rollback rejected;
- publisher denied outside granted namespace and denied admin role changes;
- reviewer approval bound to exact checksum;
- duplicate version and checksum mismatch rejected;
- schema, executable content, traversal/prototype key, circular graphs,
  dependency confusion, oversized/YAML bomb, and unsafe asset rejection;
- CSRF, CORS, session expiry/revocation, rate-limit, and audit-event coverage;
- immutable bytes cannot be updated through any API or storage path;
- rollback only selects a prior valid version;
- downloaded checksum verified by client and tampering detected;
- registry outage does not block cached character editing;
- no character or local draft fields occur in requests or logs.

Authorization tests must run against the deployed policy/database constraints,
not only mocked UI handlers.

## Phase 8 implementation gates

1. **Complete:** the product boundary has a registry-only exception.
2. **Implemented:** the service has isolated storage/hosting, audit, backup, and
   incident-response deployment requirements. Named operational owners remain
   a deployment input.
3. **Implemented interface:** Ed25519 OIDC-style claims provide roles,
   namespaces, revocation, expiry, and MFA evidence. The production identity
   provider remains a deployment input.
4. **Complete locally:** threat model and automated policy tests. Independent
   review of the deployed configuration remains a launch gate.
5. **Complete for this format:** assets remain rejected; licenses and
   provenance remain mandatory module data.
6. **Complete:** versioned `/v1` API, immutable retention, pointer rollback,
   backup, and restore/checksum procedures are documented.
7. **Complete in tracked configuration:** registry, character, and HEMA use
   separate virtual hosts, roots/upstreams, and service users.

## Deployment inputs and residual risks

- Production identity provider, publisher onboarding, and namespace-grant
  administration.
- Deployment ownership, monitoring destination, retention approval, and costs.
- Package signing/key management beyond registry checksums.
- Moderation, takedown, copyright/license disputes, and malicious-but-valid
  content.
- Privacy/legal policy for publisher accounts and audit logs.
- Availability promises and how long deprecated immutable versions are retained.
