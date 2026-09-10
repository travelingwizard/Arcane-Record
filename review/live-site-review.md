# Live site review

**URL:** https://character.travelingwizard.net/  
**Reviewed:** 2026-09-08, Cursor browser + `curl`  
**Deployed assets:** `index-D7MqY36r.js`, `index-C1Zl9BwY.css`  
**`Last-Modified`:** 2026-09-08 22:39:48 GMT (nginx/1.30.2)

This is a production check of the player-facing SPA. It complements the repository review. Application code was not modified. A test Mage named “Reviewer Test Mage” was created in this browser’s IndexedDB only.

---

## Verdict

The live site **works as a local-first character record**. Create → edit → autosave → reload → library card all succeeded for Mage 20. Privacy copy is honest. HTTPS, SPA fallback, and asset hashing behave correctly. The parchment Mage editor matches the product identity.

The production deployment has **two clear hosting defects**: the 3.9 MB JavaScript file is served **without gzip/brotli**, and missing root files (`favicon.ico`, `robots.txt`) return **200 + `index.html`**. The live create list is also **ahead of git `main` at `d748ba0`** (Band of Blades, Blades in the Dark, Miseries & Misfortunes), so this clone is not a complete map of production.

Hosted registry is **not** configured on this build — correct for the current product.

---

## Flows exercised

| Flow | Result |
|---|---|
| `/` library empty then with one record | Empty state + “0 shown”; after create, Recent + All cards, Open/Rename/Duplicate/Preview module copy/Export/Delete |
| `/create` game picker | 18 game cards including three not in this git clone; every card labeled “Available game” |
| `/create/mage20` | Build Character / Open Blank Sheet / Import |
| Open blank Mage sheet | Route `/characters/<uuid>`, title “Untitled mage”, badge “Saved in this browser” |
| Name → wait ~900ms | Title became “Reviewer Test Mage”; status saved, not failed |
| Reload same URL | SPA fallback served `index.html`; “Opening character…” then the named sheet |
| Library return | Character listed as Mage 20 |
| `/settings` | Global appearance + many sheet themes/overlays + reduce motion + live sample |
| `/modules` | Bundled Mage 0.2.0 + Exalted 1.0.0; “No hosted registry URL is configured”; Browse published modules **disabled** |
| `/module-builder` | Empty drafts; “Drafts never leave this browser.” |
| `/not-a-real-page` | “Page not found” + Return to library |
| Mobile 390 / 320 CSS px | Sections control present; **no horizontal overflow** (`scrollWidth === 320`) |
| Delete | Not clicked (destructive); confirmation not verified live |

No third-party network requests were observed on the character page (`performance` resource list only `/assets/*.js` and `*.css`).

---

## Hosting and HTTP

| Check | Observed |
|---|---|
| `http://` → `https://` | 301 |
| HTTPS | HTTP/2 200, Let’s Encrypt (YE2), valid 2026-08-04 → 2026-11-02, SAN `character.travelingwizard.net` |
| HSTS | **Absent** |
| CSP | **Absent** (header and `index.html` meta) |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| SPA `/characters/:id` | 200 same `index.html` (559 bytes) |
| `/assets/does-not-exist.js` | **404** (correct) |
| `/favicon.ico` | **200 `text/html` index.html** (wrong) |
| `/robots.txt` | **200 `text/html` index.html** (wrong) |
| JS cache | `max-age=31536000, public, immutable` (good) |
| `Content-Encoding` with `Accept-Encoding: gzip, br` | **None** |
| JS size | 3,929,986 bytes on the wire (gzip of the file locally ≈ 1,003,853) |
| CSS size | 147,705 bytes uncompressed |
| `registry.travelingwizard.net` | **Does not resolve** |
| Server | nginx/1.30.2 |

Matches `deploy/nginx/character.travelingwizard.net.conf`: nosniff/frame/referrer, SPA `try_files`, hashed assets cached. Confirms missing HSTS/CSP and the overly broad `/` fallback.

---

## Findings

### [AR-058] Production JavaScript is ~3.9 MB uncompressed with no gzip/brotli

- **Category:** Performance
- **Severity:** High
- **Confidence:** Confirmed
- **Location:** Live `https://character.travelingwizard.net/assets/index-D7MqY36r.js`; nginx character vhost (`deploy/nginx/character.travelingwizard.net.conf`)
- **Current behavior:** One main chunk, `content-length: 3929986`. Browser `encodedBodySize` equals decoded size. `curl -H "Accept-Encoding: gzip, br"` still receives no `Content-Encoding`.
- **Problem:** First visit downloads about **4 MB** of JavaScript. Gzip of the same file is ~1.0 MB. On a phone or slow link this delays the library for no product reason. This also confirms the single-bundle architecture on production.
- **Evidence:** `curl -sI` content-length; browser Performance resource timing; local `gzip -c` size 1003853.
- **Recommendation:** Enable `gzip` and preferably `brotli` in nginx for `text/javascript` and `text/css` (and HTML). Then consider `React.lazy` per game if the decompressed parse cost is still high.
- **Alternative:** Pre-compress `.br`/`.gz` at build time and serve with `gzip_static` / `brotli_static`.
- **Benefit:** ~3× less bytes immediately, no app rewrite.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** `curl -I -H "Accept-Encoding: br, gzip"` shows `content-encoding` and a much smaller `content-length` (or chunked size). Library still loads.

### [AR-059] `favicon.ico` and `robots.txt` are the SPA HTML document

- **Category:** Configuration
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** Live `/favicon.ico`, `/robots.txt`; nginx `location / { try_files $uri $uri/ /index.html; }`
- **Current behavior:** Both URLs return HTTP 200, `content-type: text/html`, 559-byte index.
- **Problem:** Browsers request a favicon and get HTML. Crawlers get a fake robots.txt. Looks unfinished; wastes a document parse.
- **Evidence:** `curl -sI` as recorded above.
- **Recommendation:** Add exact locations that 404 (or serve a real favicon and a real `robots.txt`). Keep SPA fallback only for app routes.
- **Alternative:** Put a 1×1 icon in `public/favicon.ico` so `try_files` finds a real file.
- **Benefit:** Correct browser chrome; honest robots.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** `curl -sI /favicon.ico` is `image/*` or 404, not `text/html`. `/characters/x` still returns the SPA.

### [AR-037] No CSP or HSTS on the live character origin

- **Category:** Security
- **Severity:** Low (no HTML sink found; TLS is valid)
- **Confidence:** Confirmed (was previously inferred from nginx source)
- **Location:** Live response headers; `index.html`; character nginx conf
- **Current behavior:** HTTPS without `Strict-Transport-Security`. No CSP. nosniff / SAMEORIGIN / referrer are present.
- **Problem:** First-visit HTTP is redirected, but browsers will not remember HSTS. XSS, if introduced, can read IndexedDB on this origin.
- **Evidence:** `curl -sI https://character.travelingwizard.net/` has no HSTS or CSP.
- **Recommendation:** Add HSTS on the 443 server block (`max-age` modest at first). Add CSP after confirming custom background is color-only (Settings copy says “color behind a crisp white character sheet”).
- **Alternative:** HSTS only, defer CSP.
- **Benefit:** Transport and XSS defense-in-depth.
- **Cost:** Small
- **Risk:** Medium for CSP; Low for HSTS
- **Scope:** Next (HSTS can be Now)
- **Verification:** securityheaders-style check; app and Settings still work.

### [AR-061] Production create list is ahead of this git clone

- **Category:** Documentation
- **Severity:** Informational
- **Confidence:** Confirmed
- **Location:** Live `/create` vs `src/games/registry.ts` at `d748ba0`
- **Current behavior:** Live offers Band of Blades, Blades in the Dark, and Miseries & Misfortunes. This clone’s registry ends at Mouse Guard 2e (19 system IDs). JS `Last-Modified` is 2026-09-08 22:39 GMT.
- **Problem:** Code review of `main` at clone time understates the shipped surface. Docs/README lag is even larger in production.
- **Evidence:** Create-page buttons `Choose Band of Blades`, `Choose Blades`, `Choose Miseries & Misfortunes`; grep of clone `registry.ts` has no matches.
- **Recommendation:** Treat live as the product truth when prioritizing. Pull/deploy alignment before the next code change, or note in README that production may lead `main`.
- **Alternative:** —
- **Benefit:** Review and docs stay honest.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now (process)
- **Verification:** Clone HEAD matches live create list.

### [AR-062] Player library exposes “Preview module copy” and first-class Module Builder

- **Category:** Product / UX
- **Severity:** Medium
- **Confidence:** Confirmed
- **Location:** Live `/` hero (Module Builder, Module Library); Mage card action “Preview module copy”; `/modules` bundled Mage/Exalted packages
- **Current behavior:** A new player sees Module Builder next to Settings. After creating a Mage, a fourth action is “Preview module copy” (dual interpreter). Module Library copy discusses forks and overlays.
- **Problem:** Daily character work is mixed with an unfinished publishing platform. “Preview” is labeled, but it still occupies the primary library card.
- **Evidence:** Accessibility snapshot of `/` and Mage card actions; `/modules` status “No hosted registry URL is configured for this build.”
- **Recommendation:** Move Module Builder/Library under Settings → Advanced. Keep “Preview module copy” only if Mage module conversion is a supported player path; otherwise hide it behind the same Advanced area.
- **Alternative:** Leave links; add “Advanced” grouping on the home hero.
- **Benefit:** Clearer first-use IA.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Next
- **Verification:** New empty profile: home has Create/Import/Settings only.

### [AR-001] Create cards do not distinguish completeness

- **Category:** Product
- **Severity:** Medium
- **Confidence:** Confirmed (live)
- **Location:** Live `/create` — every card eyebrow is “Available game”
- **Current behavior:** Curseborne description still says guided creation is in development. Band of Blades sits beside Mage with the same “Available game” label.
- **Problem:** A player cannot tell Mage from a preview without reading the paragraph.
- **Evidence:** Snapshot of `/create`.
- **Recommendation:** Complete / Foundation / Preview badges (backlog BL-09).
- **Alternative:** Sort complete games first.
- **Benefit:** Honest picker.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Now
- **Verification:** Curseborne marked Preview; Mage Complete.

### [AR-063] Minor copy defects on live create/settings

- **Category:** UX
- **Severity:** Low
- **Confidence:** Confirmed
- **Location:** `/create/mage20` “Open an Arcane Record JSON or YAML Mage 20 character file .”; `/settings` “all character sheets .”
- **Current behavior:** Extra space before periods.
- **Problem:** Polish only.
- **Evidence:** Accessibility snapshot text.
- **Recommendation:** Trim the strings.
- **Alternative:** Ignore.
- **Benefit:** Cleaner writing.
- **Cost:** Small
- **Risk:** Low
- **Scope:** Next
- **Verification:** Visual check of those two sentences.

---

## What the live site confirms from the code review

| Prior finding | Live result |
|---|---|
| Local-only character data | No registry hostname; no third-party resources; privacy sentence on library |
| “Saved in this browser” | Exact badge on Mage sheet after save |
| SPA fallback required | Deep character URL reload works |
| No CSP/HSTS | Confirmed on the wire |
| Module registry optional | Disabled browse + explicit “no URL configured” |
| Dual Mage/Exalted modules | Bundled packages listed on `/modules` with `net.` vs `org.` IDs |
| Theme id Arcane Ledger | Settings default selected |
| Reduce motion | Global + sheet toggles present |
| 320px no page overflow | Confirmed for Mage editor |
| Empty and loading states | Library empty; “Opening character…” |
| Unknown route | Dedicated not-found page |

---

## What was not verified live

- Guided Mage creator (Build Character)
- Import/export file round-trip
- Linked Wraith/Mouse Guard/Legend packs
- Delete confirmation dialog (click blocked as destructive)
- Contrast ratios / screen reader beyond the accessibility snapshot
- Multi-tab Mage save race
- Custom background as anything other than a color (copy says color)

---

## Recommended production fixes (order)

1. Enable gzip/brotli on JS/CSS/HTML (**AR-058**).
2. Real favicon + robots, or 404 those paths (**AR-059**).
3. Add HSTS (**AR-037**).
4. Align git `main` with what `/create` actually ships (**AR-061**).
5. Demote Module Builder on the home hero (**AR-062**).
