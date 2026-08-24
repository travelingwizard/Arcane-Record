# Publishing registry security boundary

## Current authorization status

No publishing service is authorized or implemented by this specification.
`AGENTS.md` currently says never to add a backend or accounts. The requested
Phase 8 requires both authenticated publishers and server storage, so work must
stop at a client-side interface boundary until the user explicitly changes that
product constraint and approves a separate service/deployment architecture.

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

## Approval gates before Phase 8

1. Explicitly amend the no-backend/no-accounts product boundary.
2. Approve service ownership, hosting, domain, data flow, retention, backups,
   monitoring, and incident response.
3. Select an authentication provider and namespace-role administration model.
4. Complete threat modeling and independent security review.
5. Resolve safe assets and license/compliance enforcement.
6. Define API/version/support and registry disaster-recovery commitments.
7. Verify the HEMA virtual host and character static host remain isolated.

## Unresolved decisions and risks

- Identity provider, MFA, reviewer separation, and publisher onboarding.
- Hosting/database/object-store choices and costs.
- Package signing/key management beyond registry checksums.
- Moderation, takedown, copyright/license disputes, and malicious-but-valid
  content.
- Privacy/legal policy for publisher accounts and audit logs.
- Availability promises and how long deprecated immutable versions are retained.
