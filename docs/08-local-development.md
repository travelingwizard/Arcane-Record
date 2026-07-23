# 08. Local development

## Install and start

```sh
npm install
npm run dev
```

Vite binds to the normal local loopback development host. The expected URL is `http://localhost:5173/`, but use the exact URL Vite prints if that port is occupied.

This milestone was validated locally with Node.js `v20.20.2` and npm `10.8.2`.

## Checks

```sh
npm run format
npm run format:check
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
npm run preview
```

`npm run test` runs Vitest unit and integration tests once. `npm run test:e2e` starts a local server for the Playwright smoke test. `npm run preview` locally serves the production build for inspection.

No Docker, Nginx, firewall change, public binding, backend, or cloud service is required or configured.
