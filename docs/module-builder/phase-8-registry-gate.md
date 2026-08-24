# Phase 8: hosted registry gate

Phase 8 cannot be activated under the current project boundary. `AGENTS.md`
prohibits a backend, accounts, telemetry, cloud sync, and external runtime
assets. A hosted registry requires authenticated namespace ownership,
server-side immutable package storage, authorization, moderation, retention,
backup, incident response, and network security testing. Implementing or
simulating those capabilities locally would misrepresent their security.

The safe prerequisites are complete locally: deterministic canonical package
files, SHA-256 checksums, size/structure budgets, staged review, immutable
versions, dependency locks, explicit activation, side-by-side upgrades,
semantic comparison, disable/deprecation behavior, pointer rollback, and clear
offline behavior. The Module Library says “Hosted publishing is unavailable”
and offers no fake publish button or trust badge.

Unblocking the hosted portion requires an explicit revision to `AGENTS.md` and
a separately approved service threat model covering authentication,
authorization, CSRF/CORS, malicious packages, denial-of-service budgets,
storage, backups, audit records, deprecation, rollback, and incident response.
Characters must remain browser-local even after such approval.
