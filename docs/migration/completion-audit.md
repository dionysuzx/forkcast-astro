# Completion Audit

Generated: `2026-05-09`

## Objective

Migrate the existing Forkcast site to a greenfield Astro 6 project with feature and visual parity, improved static performance and domain modeling, baseline/final benchmarks, Biome verification, a pre-commit hook, and root promotion only after parity and checks are confirmed.

## Prompt-To-Artifact Checklist

| Requirement | Evidence | Status |
| --- | --- | --- |
| Create a greenfield project in a subdirectory before mutating the root | `astro/` exists as the rebuild project; legacy root remained intact through audit | Complete |
| Use Astro 6 | `package.json` depends on `astro` `^6.3.1`; `pnpm verify` builds 973 static pages | Complete |
| Use pnpm | `pnpm-lock.yaml`, pnpm scripts, `.npmrc`, and CI workflows use pnpm | Complete |
| Use React only where interactivity is needed | `@astrojs/react` integration and React components under `src/components/*` are used for schedule, rank, Glamsterdam tables, and other islands | Complete |
| Use Tailwind | `astro.config.mjs` installs `@tailwindcss/vite`; `src/styles/global.css` imports Tailwind | Complete |
| Use shadcn/ui as the component foundation without default visual replacement | `components.json`, `src/components/ui`, `shadcn/tailwind.css`, and custom Forkcast theme tokens in `src/styles/global.css` | Complete |
| Use lucide icons | `@lucide/astro`, `lucide-react`, and `components.json` `iconLibrary: "lucide"` | Complete |
| Use Biome | `biome.jsonc`; `pnpm biome check .` passes through `pnpm verify` | Complete |
| Provide `pnpm astro check`, `pnpm biome check .`, and `pnpm verify` scripts | `package.json` scripts include `astro`, `biome:check`, and `verify`; `verify` runs Astro check, Biome check, and build | Complete |
| Block commits unless verification passes | `.husky/pre-commit` runs `pnpm verify` | Complete |
| Record route/page/component/feature/domain inventory | `docs/migration/inventory.md` | Complete |
| Baseline benchmark current site | `docs/migration/baseline-benchmark.json` and `docs/migration/baseline-benchmark.md` | Complete |
| Final benchmark Astro site with same route inventory/method | `docs/migration/astro-benchmark.json` and `docs/migration/astro-benchmark.md` | Complete |
| Migrate every legacy route | Benchmark route-set comparison: 966 baseline routes, 973 Astro routes, 0 missing baseline routes | Complete |
| Preserve visual/UX parity route family by route family | `docs/migration/parity-review.md` plus screenshots under `docs/migration/screenshots/` | Complete with representative review |
| Preserve markdown-heavy EIP rendering | `src/content.config.ts`, `src/content/eip-specs`, EIP detail pages, and markdown rewrite plugin in `astro.config.mjs` | Complete |
| Improve static performance and reduce runtime fetches | Final benchmark: average JavaScript `1,362.4 KB -> 25.7 KB`; app-owned data/API fetches `33.6 KB -> 0.0 KB`; raw HTML `161 -> 27,712` chars | Complete |
| Improve domain modeling | Domain-centered folders under `src/domain` for agenda, calls, devnets, proposals, ranking, schedule, test complexity, and upgrades | Complete |
| Include `llms.txt` | `public/llms.txt` and generated `dist/llms.txt` | Complete |
| Keep final site static by default | Astro build output is `static`; final build emits 973 pages | Complete |
| Use official setup docs | Checked Astro install, Lucide Astro, shadcn Astro, and Biome official docs during final audit; local setup matches their package-manager/config guidance | Complete |
| Promote only after parity and checks are confirmed | This audit recorded parity evidence and clean verification before promotion; the Astro project was then promoted to the repository root | Complete |

## Final Verification Evidence

- `pnpm verify` in `astro/` passed on `2026-05-09` with 0 Astro errors, 0 Astro warnings, 0 Biome issues, and a 973-page static build.
- `pnpm verify` from the promoted repository root passed on `2026-05-09` with 0 Astro errors, 0 Astro warnings, 0 Astro hints, no Biome issues, and a 973-page static build.
- The final Astro benchmark completed 973/973 routes before promotion and is recorded in `docs/migration/astro-benchmark.json`.
- Baseline route comparison showed no missing legacy routes in the Astro benchmark route set.

## Residual Notes

- The EIP upcoming-call path depends on upstream snapshot data; the current snapshot has no mapped upcoming ePBS/BAL/FOCIL issue, so that specific future-data state remains documented in `docs/migration/parity-review.md`.
- The visual review is representative across route families rather than an exhaustive screenshot of every generated EIP and call page.
