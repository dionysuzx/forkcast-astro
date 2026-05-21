# Migration Inventory

## Routes

- `/`
- `/upgrades`
- `/upgrade/pectra`
- `/upgrade/fusaka`
- `/upgrade/glamsterdam`
- `/upgrade/glamsterdam/stakeholders`
- `/upgrade/glamsterdam/devnet-inclusion`
- `/upgrade/glamsterdam/client-priority`
- `/upgrade/glamsterdam/test-complexity`
- `/upgrade/hegota`
- `/rank`
- `/calls`
- `/calls/[type]/[number]`
- `/calls/[github-issue]`
- `/calls/[type]`
- `/agenda`
- `/feedback`
- `/eips`
- `/eips/[id]`
- `/devnets`
- `/devnets/[id]`
- `/decisions`
- Legacy redirects: `/planner`, `/glamsterdam`, `/glamsterdam/priority`, `/glamsterdam/complexity`, `/priority`, `/complexity`, and legacy Glamsterdam tab URLs.

## Domain Concepts

- Network upgrades: status, activation date, activation details, meta threads, client perspectives.
- Proposals: EIP/RIP identity, layer, status, fork relationships, inclusion stage, headliner state, stakeholder impacts, benefits, tradeoffs, specification markdown, proposal search records, proposal-to-call links, and mapped upcoming-call snapshots.
- Test complexity: STEEL assessment snapshots, score tiers, anchor scores, source links, and proposal-to-assessment joins.
- Protocol calls: call series, call number, date, GitHub issue alias, one-off calls, artifacts, transcript entries, chat entries, timestamp deep links, TLDR highlights, key decisions, action items, targets, ACDT breakout sub-calls, upcoming GitHub issue snapshots, agenda items, and live-stream links.
- Devnets: devnet series, active-network snapshots, EIP inclusion rows, client support matrices, spec references.
- Agenda planning: agenda suggestions, series URL state, next scheduled call snapshots, open action items, resolved action rollups, deferred/revisited decisions, EIP discussion threads, pending upgrade scope, and recent call outcomes.
- Schedule planning: fork planning state, phase duration assumptions, calculated fork dates, known milestone preservation, lock cascade state, devnet count overrides, and Gantt milestones.
- Headliner ranking: rankable Hegota proposals, pending proposal entries, S/A/B/C/D tiers, tier assignment state, local persistence, and share-image generation.
- Navigation state: theme, banner dismissal, mobile nav, upgrade menu, search/filter controls.

## User-Facing Features And States

- Home overview with upgrade cards, recently updated EIPs, recent calls, recent decisions, planning tools, and Protocol Support footer.
- EIP directory with search, status/fork/layer/headliner filters, desktop table, mobile cards, and count updates.
- EIP detail pages with analysis/spec views, author metadata, copyable author handles, stage timeline, benefits, tradeoffs, stakeholder impacts, North Star alignment, markdown spec rendering, discussion/spec links, opt-in search modal, breakout call links, mapped upcoming-call links where a snapshot exists, and previous/next keyboard navigation.
- Calls calendar with search, call-series filters, type badges, static upcoming-call section, upcoming agenda/live links, date grouping, and canonical call links.
- Call detail pages with video embed, expandable timestamped summary sections, transcript/chat entry rendering, transcript hash links, chat query links, ACDT breakout video/chat query switching, inline search-within-call, Cmd/Ctrl+K current-call search modal, issue links, and previous/next navigation.
- Upgrade index/detail pages with status badges, activation metadata, proposal lists, Glamsterdam tabs, and client perspective links.
- Devnet index/detail pages with devnet cards, EIP lists, source/spec links, announcements, and series navigation.
- Decisions page with call-grouped key decisions.
- Schedule and agenda planning pages with editable date planning, prerendered default schedule projections, static agenda artifacts, next-call cards, pending scope, action/deferred-decision rollups, and recent call summaries.
- Rank page with S/A/B/C/D ranking rows, EL/CL proposal groups, drag-and-drop assignment, click/keyboard/touch assignment fallback, localStorage persistence, reset, proposal tooltips, and share-image generation.
- Legacy routes remain present as redirect pages.

## Runtime Fetches To Remove Or Reduce

- `/eips/*.md` runtime markdown fetches should become build-time rendered content.
- `/artifacts/**` runtime call artifact fetches should become build-time rendered call content where practical. Main call transcripts/chats and ACDT breakout chats are now parsed into static call-detail HTML.
- GitHub PM issue/comment fetches for upcoming calls are now captured by `pnpm data:upcoming-calls` into a static Astro domain snapshot.
- EthPandaOps active-network metadata is now captured by `pnpm data:devnets` into the Astro domain snapshot.
- STEEL GitHub complexity assessments are now captured by `pnpm data:complexity` into the Astro domain snapshot.
- Search corpora should not be loaded on initial page view; search should be opt-in or DOM/static-index based. EIP detail search now uses static `/eip-search-index.json` metadata after the modal opens and static `/eip-spec-search-index.json` term mappings only after a text query needs spec-content matches.
