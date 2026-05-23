# Forkcast

Forkcast is a static-first Ethereum upgrade tracker built with Astro 6. The site renders protocol upgrade pages, EIP pages, call artifacts, devnet status, planning tools, and ranking tools as useful HTML by default, with React islands only where interaction is needed.

## Commands

```sh
pnpm install
pnpm dev
pnpm verify
```

`pnpm verify` runs:

- `pnpm astro check`
- `pnpm biome check .`
- `pnpm build`

The pre-commit hook also runs `pnpm verify`.

## Data Snapshots

The app avoids runtime product-data fetches by keeping build-time snapshots in the domain layer:

- `pnpm data:upcoming-calls`
- `pnpm data:devnets`
- `pnpm data:complexity`
- `pnpm data:forkcast-snapshot`

`forkcast-data.snapshot.json` is the local development baseline for the canonical data-plane snapshot used by Astro. The `Snapshot Rebuild` GitHub Action runs every 12 hours and also responds immediately to `forkcast-data` repository dispatches. When the deployed Astro site is behind the data-plane `/latest/manifest.json`, the workflow syncs the requested snapshot inside the Actions workspace, verifies the static build, uploads the resolved snapshot metadata as an Actions artifact, and deploys GitHub Pages without committing generated snapshot pins back to `main`.

Each deploy exposes `/_snapshot.json`, so the exact deployed data snapshot remains machine-readable without using the application branch as deploy state. Scheduled and repository-dispatch runs deploy GitHub Pages by default; manual dispatch can choose an artifact-only run.

Migration inventory, parity review, and benchmark artifacts are stored in `docs/migration/`.
