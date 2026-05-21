# Baseline Benchmark

Generated: see `migration/baseline-benchmark.json`.

## Method

- Built the legacy Vite/React app with `npm run build`.
- Served `dist/` through `npm run preview -- --host 127.0.0.1 --port 4173`.
- Loaded every generated route and legacy alias route in Chrome through `migration/benchmark-site.mjs`.
- Used a fresh browser context per route at a `1440x1100` viewport.
- Blocked YouTube/Google media iframe hosts so embedded video transfer did not dominate the app-size comparison; blocked request counts are recorded.

## Route Inventory

- Routes hit: 966
- Includes home, indexes, upgrade pages, Glamsterdam tab routes, all EIP pages, all call pages, issue aliases, call-type aliases, devnet pages, and legacy redirect routes.

## Aggregate Results

- Total requests: 10,338
- Total transferred: 1,801,497.9 KB
- Blocked third-party media requests: 348

## Average Cold Route

- Requests: 11
- Total transferred: 1,864.9 KB
- JavaScript: 1,362.4 KB
- CSS: 150.1 KB
- HTML: 6.1 KB
- Data/API payload: 33.6 KB
- Image/font assets: 312.7 KB
- Useful raw HTML text before hydration: 161 characters
- Rendered body text after hydration: 24,672 characters

## Notable Problems

- Every route pays for the heavy SPA bundle; the largest generated JS chunk is about 1.32 MB minified.
- Static route files mostly contain a shell, not the page content users, crawlers, or AI agents need.
- Many EIP pages fetch markdown at runtime from `/eips/*.md`.
- Call pages fetch artifacts at runtime from `/artifacts/**`.
- Calls and EIP pages fetch GitHub PM issue data at runtime for upcoming calls.
- Devnet and complexity pages fetch external metadata from EthPandaOps and GitHub at runtime.

## Largest Same-Origin Routes

- `/feedback`: 9,728.1 KB
- `/eips/7643`: 2,175.6 KB
- `/eips/8182`: 2,136.2 KB
- `/eips/999`: 2,122.4 KB
- `/eips/1474`: 2,100.3 KB

## Largest Data/API Routes

- `/calls/1971`: 198.8 KB
- `/calls/one-off-1971/001`: 198.8 KB
- `/calls/1610`: 177.7 KB
- `/calls/acde/216`: 177.7 KB
- `/calls/1970`: 176.0 KB
