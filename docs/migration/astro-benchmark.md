# Astro Benchmark

Generated: `2026-05-09T22:40:56.882Z`

## Method

- Built the Astro app with `pnpm verify`.
- Served the pre-promotion Astro build from `astro/dist/` through `pnpm preview -- --host 127.0.0.1 --port 4321`; after promotion the same app builds to root `dist/`.
- Loaded the route inventory from `astro/dist/sitemap.xml` plus static HTML files in `astro/dist/` through `migration/benchmark-site.mjs --dist-dir astro/dist`.
- Used a fresh browser context per route at a `1440x1100` viewport.
- Blocked YouTube/Google media iframe hosts so embedded video transfer did not dominate the app-size comparison; blocked request counts are recorded.

## Route Inventory

- Routes hit: 973
- Includes home, indexes, upgrade pages, Glamsterdam tab routes, EIP pages, call pages, issue aliases, call-type aliases, devnet pages, devnet series aliases, active network-only devnet pages, and legacy redirect routes.
- HTTP route failures: 0
- Unexpected request failures: 0 after excluding intentionally blocked YouTube embeds and benign aborted icon requests during redirect/navigation churn.

## Aggregate Results

- Total requests: 7,590
- Total transferred: 769,078.9 KB
- JavaScript transferred: 24,983.4 KB
- CSS transferred: 176,487.5 KB
- HTML transferred: 236,879.7 KB
- Data/API payload transferred: 0.5 KB
- Image/font assets transferred: 330,727.9 KB
- Blocked third-party media requests: 522

## Average Cold Route

| Metric | Legacy Vite/React | Astro static | Change |
| --- | ---: | ---: | ---: |
| Requests | 11 | 8 | 27.3% lower |
| Total transferred | 1,864.9 KB | 790.4 KB | 57.6% lower |
| JavaScript | 1,362.4 KB | 25.7 KB | 98.1% lower |
| CSS | 150.1 KB | 181.4 KB | 20.8% higher |
| HTML | 6.1 KB | 243.5 KB | higher by design |
| Data/API payload | 33.6 KB | 0.0 KB | 100.0% lower |
| Image/font assets | 312.7 KB | 339.9 KB | 8.7% higher |
| Useful raw HTML text | 161 chars | 27,712 chars | much higher |
| Rendered body text | 24,672 chars | 24,971 chars | 1.2% higher |

## Largest Routes

- `/feedback`: 8,446.2 KB
- `/calls/1610`: 2,358.2 KB
- `/calls/1971`: 2,315.9 KB
- `/calls/1825`: 2,311.5 KB
- `/calls/1462`: 2,260.5 KB

`/feedback` is an external redirect to Ethereum Magicians, so its payload is the redirected Discourse page rather than app-owned Astro code. The large call routes are large because the new pages render useful transcript, chat, and summary HTML statically instead of shipping a SPA shell and fetching the content after hydration.

## Remaining Runtime Fetches

- No app-owned data/API fetches were recorded.
- The 0.5 KB data/API payload is from the external Ethereum Magicians `/feedback` redirect target.
- Remaining runtime fetches are EIP markdown image assets hosted by the upstream EIPs repository or related forum/research hosts.
- Call video embeds are still present, but YouTube/Google media requests were blocked during the benchmark to keep the comparison focused on the app payload.

## Readability Result

The old app averaged 161 characters of useful raw HTML before hydration. The Astro build averages 27,712 characters of useful raw HTML, so routes are directly readable by users, crawlers, and AI agents without executing the SPA.
