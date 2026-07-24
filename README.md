# Arcane Ledger

A local-first, responsive character-sheet editor for Mage: The Ascension 20th Anniversary Edition. Characters are saved only in IndexedDB in the current browser profile. There is no account, backend, telemetry, or online backup.

The long-form editor includes URL-addressable sections, a sticky desktop
section rail, and a mobile Sections sheet with independently collapsible
sections. Expansion preferences stay in browser-local interface storage and
are not included in character exports.

## Local development

Requirements: a current Node.js release compatible with the checked-in dependencies and npm.

```sh
npm install
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173/`.

## Verification

```sh
npm run format:check
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

The Playwright smoke test starts its own local Vite server. If the bundled browser is unavailable, install only the Playwright Chromium browser with `npx playwright install chromium`; no operating-system package installation is required for the rest of the project.

## Milestone scope

This milestone includes a local character library, create/open/rename/duplicate/delete flows, autosave, identity fields, Attributes, Abilities, Spheres, star-based affinity selection, Sphere sorting, an optional desktop Sphere wheel, Enlightenment traits, a searchable Background catalog with dot ratings and point accounting, Health, a searchable Merits & Flaws catalog with point accounting, and local JSON/YAML import and export. Focus, Wonders, and Rotes remain visible as deferred sections.

See [docs/00-project-charter.md](docs/00-project-charter.md) for goals and assumptions.
See [docs/12-section-navigation.md](docs/12-section-navigation.md) for the
section registry, anchors, responsive behavior, and preference boundary.
