# Module Builder testing plan

Unit tests cover schemas, path typing, component serialization, migrations, formulas and cycles, conditions, actions, dice, flow graphs, builder commands, undo/redo, and sanitization. Integration tests cover draft autosave/recovery, staged import, checksums, immutable conflicts, dependencies, activation, and local installation. Registry tests cover anonymous denial and publisher/reviewer/admin boundaries.

Playwright covers component insertion, drag/reorder and keyboard equivalents, cross-section movement, section width/reordering, inspector changes, undo/redo, preview, workflow branching, import review, mobile layout, focus, and the Mage parity proof.

Release commands are `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build`, and `git diff --check`.
