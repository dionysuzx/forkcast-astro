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

`forkcast-data.snapshot.json` pins the canonical data-plane snapshot used by Astro. The `Snapshot Rebuild` GitHub Action runs every 30 minutes and also responds to `forkcast-data` repository dispatches. When the data-plane `/latest/manifest.json` changes, the workflow syncs the pin, verifies the static build, commits the pin update, and deploys Netlify. Scheduled and repository-dispatch runs deploy production by default; manual dispatch can choose preview.

Migration inventory, parity review, and benchmark artifacts are stored in `docs/migration/`.
