# World Cup 2026 Fan Radar

A static World Cup fan dashboard for exploring:

- Must-Watch matches
- Country Radar
- Player Watchlist
- Club Watch
- India Planner

## For Friends

Open the public link in your browser and explore the app:

`https://gouravkumar192837.github.io/world-cup-2026-fan-radar/`

What you can do inside the app:

- find the most interesting matches to watch
- explore team-by-team Country Radar
- check expected XIs, key players, and fan storylines
- browse player and club watch views
- use the India-friendly planner for match timings

You do not need to install anything or edit any files.

If you spot a data issue, send it back to the project owner instead of editing the app directly.

## Public Link

The live GitHub Pages site is:

`https://gouravkumar192837.github.io/world-cup-2026-fan-radar/`

If a custom domain is added later, that can become the main public link.

## Owner Quick Start

### 1. Publish the app

1. Do day-to-day work on a branch and push that branch to GitHub first.
2. Merge to `main` only when you want the public GitHub Pages site updated.
3. GitHub Pages deploys automatically from `main` through the included workflow.
4. Share the same public URL with friends after `main` updates.

### 2. Maintain the app

Use chat-first maintenance commands in this workspace, for example:

- `scan for new squad announcements and update the active files`
- `refresh all squad data from public sources`
- `check Spain and update the registry if their squad is officially announced`
- `check for any squad or expected XI updates and apply needed CSV changes`

After important data changes:

1. Run a quick smoke pass on the app.
2. Confirm one registry country, one curated non-registry country, and one unavailable country still behave correctly.
3. Push your working branch for backup and review.
4. Merge or push to `main` only when you want GitHub Pages to reflect the latest data.

For the full football-data operating model, including:

- which CSV controls what
- which file to update for each scenario
- how Expected XI mode should be interpreted
- what to do every `2-3 days`

see [FOOTBALL_DATA_SYSTEM.md](./FOOTBALL_DATA_SYSTEM.md).

### 3. Share the app

For a ready-to-send share message, use [SHARE_MESSAGE.md](./SHARE_MESSAGE.md).

### 4. Know where the live data lives

The production dataset lives in `data/`.

Archived or superseded files live in `data_archive/`.

Detailed maintenance rules are documented in [MAINTENANCE.md](./MAINTENANCE.md).
