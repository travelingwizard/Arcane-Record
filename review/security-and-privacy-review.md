# Security and privacy review

Persona: security and privacy reviewer. Threat model is a **local-first, single-user browser app** plus an **optional undeployed module registry**. No enterprise SSO, WAF, or zero-trust mesh is recommended.

Realistic threats: malicious character/module files, XSS against same-origin IndexedDB, accidental telemetry, committing env secrets, path traversal on the registry file store, confusing a public registry into accepting garbage packages.

---

## What is already in good shape

- **No character upload.** `RegistryClient` only GETs catalog/packages (`src/modules/registry/registry-client.ts`). `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`.
- **No analytics/telemetry** in dependencies or `src/` (AGENTS.md prohibition matches code).
- **No `dangerouslySetInnerHTML`**, no `eval` / `new Function`, no markdown HTML renderer.
- Catalog and sheet text render as React text nodes.
- Import assigns a **new UUID** (cannot clobber by id).
- Module interchange: 5 MB cap, depth/node/key limits, `load(..., { json: true })`, checksum on registry install.
- Registry server: loopback bind, `safePart()` path filter, EdDSA JWT, body limit, rate limits, CSP `default-src 'none'`, CORS allowlist, audit log.
- No private keys or `.env` committed.

---

## Findings

### [AR-035] Character YAML parsing is weaker than module YAML parsing

- **Category:** Security
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** `src/features/import-export/character-files.ts` `parseContents`; contrast `src/modules/interchange/module-files.ts`
- **Current behavior:** Character files: `load(contents)` with full YAML features. Modules: `load(contents, { json: true })`.
- **Problem:** js-yaml can construct non-plain objects via tags. After parse, Zod usually rejects odd shapes, but the extra surface is unnecessary. Prototype-pollution-style payloads are a standard import worry.
- **Evidence:** `/\.ya?ml$/i.test(fileName) ? load(contents) : JSON.parse(contents)`.
- **Recommendation:** Use `{ json: true }` (or JSON-only import). Same limits as modules (size/depth).
- **Alternative:** Drop YAML import; keep YAML export only.
- **Benefit:** Untrusted file handling matches the module path you already trust more.
- **Cost:** Small
- **Risk:** Low (exported YAML of plain envelopes should still parse)
- **Scope:** Now
- **Verification:** Unit test: YAML with a custom tag is rejected; a file exported as YAML still imports.

### [AR-036] Character import has no size or complexity cap

- **Category:** Security
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `character-files.ts`; library/create file inputs
- **Current behavior:** Entire file is read and parsed in memory. Modules cap at 5 MB plus graph limits.
- **Problem:** A huge YAML/JSON can freeze the tab (availability), not steal data. Proportional issue for a local app, still easy to copy from modules.
- **Evidence:** no length check before `load`/`JSON.parse`.
- **Recommendation:** e.g. 2–5 MB cap and max depth on parsed objects.
- **Alternative:** Rely on browser OOM — poor UX.
- **Benefit:** Predictable failure.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** Oversized fixture fails with a clear message; normal Mage export succeeds.

### [AR-037] Character SPA has no Content-Security-Policy

- **Category:** Security
- **Severity:** Low
- **Confidence:** Confirmed (live headers 2026-09-08)
- **Location:** `index.html`; `deploy/nginx/character.travelingwizard.net.conf`
- **Current behavior:** Live `https://character.travelingwizard.net/` returns nosniff / SAMEORIGIN / referrer only. **No CSP, no HSTS.** Registry Node (undeployed) would set CSP `default-src 'none'`. Settings custom background is described as a **color**, not a remote image (reduces CSP risk).
- **Problem:** XSS (if introduced later) can read IndexedDB on the character origin. There is no HTML sink today, so this is defense-in-depth, not an active exploit.
- **Evidence:** nginx character server block; empty index head aside from description/theme-color.
- **Recommendation:** CSP allowing `'self'` for scripts/styles (Vite hashed assets) + `connect-src 'self'` and optionally the registry origin. Add HSTS on the HTTPS server block. Do not allow `unsafe-inline` long-term; Vite can emit nonces or hashes if you outgrow inline.
- **Alternative:** Skip until an HTML sink exists.
- **Benefit:** Shrinks future XSS impact on character data.
- **Cost:** Small
- **Risk:** Medium (CSP can break fonts/backgrounds if custom appearance loads `blob:`/`data:`)
- **Scope:** Next — **verify** custom background URLs before locking CSP
- **Verification:** App loads; appearance custom background still works; registry fetch still works when configured.

### [AR-038] Custom appearance backgrounds are a CSP/`connect-src` footgun

- **Category:** Security
- **Severity:** Low
- **Confidence:** Needs verification
- **Location:** appearance settings (custom background); `docs/15-appearance-settings.md`
- **Current behavior:** Users can set custom sheet backgrounds (browser-local). **Assumption:** may be `data:` or blob URLs rather than remote http.
- **Problem:** A naive CSP could break a documented feature, or a remote URL could become the first character-origin network read besides the registry.
- **Evidence:** Product supports custom backgrounds; this review did not fully trace URL schemes.
- **Recommendation:** Allow only `blob:`/`data:`/`local` backgrounds; never fetch remote images for sheets.
- **Alternative:** Keep http(s) backgrounds and document `connect-src`/`img-src`.
- **Benefit:** Privacy + simpler CSP.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Next
- **Verification:** Inspect stored appearance prefs; confirm no remote image fetch in Network panel.

### [AR-039] `.gitignore` does not ignore `.env`

See [configuration-audit.md](configuration-audit.md). Severity Medium for secret hygiene; not an active leak (no `.env` in tree).

### [AR-014] JWT audience mismatch

See configuration audit. Only material if the registry is deployed.

---

## Network requests

| Client | Destination | Payload |
|---|---|---|
| SPA | Optional registry `/v1/catalog`, `/v1/modules/...` | None of the character DB |
| Registry | publishers via JWT | Module packages, metadata, audit — **must not** include characters (design; service has no character tables) |

**Confirmed:** no `sendBeacon`, gtag, Sentry, or similar in `src/`.

## File and path handling (registry)

`registry/store.ts` `safePart()` restricts to `[a-zA-Z0-9._-]`. Bind address is loopback. This is proportional and good.

## Permission boundaries

The SPA has no user accounts. The registry has publisher/reviewer/admin. Admin MFA (`webauthn`/`hwk`) is **heavy** for a single operator — over-engineering, not a vulnerability. Do not add SPA login “for consistency.”

## Supply chain

Dependencies are few and purposeful (see [dependency-review.md](dependency-review.md)). `js-yaml` is the highest-sensitivity parser. Pin via lockfile; keep it updated. No `postinstall` scripts spotted in direct deps **(needs verification after npm install)**.

## Publishing / admin functions

Module builder + registry approve/deprecate are powerful. They do not touch character tables. Risk is installing a malicious **module** that later executes in the interpreter (rules DSL / renderer). Mitigations already: validate envelope, checksum, no `eval`. Continue to treat modules as untrusted code-equivalent data: keep the interpreter incapable of network and DOM HTML.

---

## What not to do

- Do not add Auth0/Cognito for the character app.
- Do not send crash reports containing character JSON.
- Do not “fix” privacy by moving characters to a server.
