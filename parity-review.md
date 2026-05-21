# Parity Review

## Scope

This pass covers the user-reported polish gaps from the Astro migration parity review: homepage decisions/footer, calls search and breakout controls, EIP directory search and detail timeline spacing, schedule page flicker, Glamsterdam overview/sidebar/timeline/admonition/tabs, upgrade cards, and decisions page styling.

## Findings And Fixes

- [x] Homepage recent decisions were truncated to five rows. Restored the legacy behavior by rendering all latest-call decisions.
- [x] Stage-change decisions labeled `Proposed` as `PFI`. Restored the user-facing `Proposed` label so entries like EIP-8253 can read correctly.
- [x] Decisions page used raw decision text while the homepage used structured EIP links/badges. Updated `/decisions` to share the same `StructuredDecision` rendering, card chrome, hover, and filters.
- [x] Homepage footer used text for GitHub/X. Restored icon-only GitHub and X links with accessible labels.
- [x] Schedule used a client-only island with a full-page fallback, causing a route-load swap. Switched to SSR + `client:load` and moved browser storage reads after mount to avoid hydration flicker.
- [x] Calls index search was inline-only. Restored a popup search modal opened by click or `Cmd/Ctrl+K`.
- [x] Calls index Breakouts filter lacked the legacy dropdown selection. Restored the expanded Breakouts dropdown with All Breakouts, concrete breakout types, and one-off calls.
- [x] Call detail search should behave like the legacy call page without adding a visible desktop "Search" control to the video chrome. Removed the stray video-toolbar search buttons and hidden inline search input while keeping the floating mobile button and `Cmd/Ctrl+K` modal.
- [x] Call detail breakout selector could sit under the video stacking context. Raised the selector/menu z-index and preserved click selection.
- [x] Call detail bottom GitHub/previous-next strip did not match the legacy layout. Removed the extra bottom strip; the issue link remains in the video metadata as the agenda link.
- [x] EIP directory search was inline-only. Restored a popup search modal opened by click or `Cmd/Ctrl+K`, with fork/status/layer filters.
- [x] Glamsterdam overview diverged from the legacy visual structure. Restored the lighter header, shared horizontal tab shell, unboxed contents rail, proposal filtering controls, arrowed network timeline, `we are here` marker, detailed timeline section, and info icon in the overview admonition.
- [x] `/upgrades` in-progress upgrade cards used a two-column grid, making Glamsterdam/Hegotá feel different from the homepage cards. Aligned the index to the same three-column card layout and stable status ordering.
- [x] EIP detail timeline spacing was tightened against the legacy screenshot by increasing row gaps and inner padding.

## Verification

- [x] `pnpm astro check`
- [x] `pnpm biome check .`
- [x] Chrome interaction checks for homepage recent decisions/footer/upgrade cards, header Upgrades click dropdown, `/decisions` structured links, calls search/breakouts, call-detail search/breakouts, EIP index search/enhanced selects, EIP detail timeline/search, Glamsterdam tabs/sidebar/timeline/admonition/proposal filters, `/upgrades`, and schedule load: 16 checks, 0 failures, clean console
- [x] `pnpm verify`
