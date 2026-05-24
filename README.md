# World Cup 2026 Fan Radar

A static World Cup fan dashboard for exploring:

- Must-Watch matches
- Country Radar
- Player Watchlist
- Club Watch
- India Planner

## For Friends

Open the public GitHub Pages link in your browser and explore the app.

You do not need to install anything or edit any files.

If you spot a data issue, send it back to the project owner instead of editing the app directly.

## Public Link

Once this repo is pushed to GitHub and GitHub Pages is enabled, the app can be shared at:

`https://<github-username>.github.io/<repo-name>/`

If a custom domain is added later, that can become the main public link.

## Owner Quick Start

### 1. Publish the app

1. Create a GitHub repository for this project.
2. Push the repo contents to GitHub.
3. In GitHub, enable Pages for the repository and allow GitHub Actions deployment.
4. Let the included Pages workflow publish the static site.
5. Share the resulting public URL with friends.

### 2. Maintain the app

Use chat-first maintenance commands in this workspace, for example:

- `scan for new squad announcements and update the active files`
- `refresh all squad data from public sources`
- `check Spain and update the registry if their squad is officially announced`

After important data changes:

1. Run a quick smoke pass on the app.
2. Confirm one registry country, one curated non-registry country, and one unavailable country still behave correctly.
3. Publish the updated repo so GitHub Pages reflects the latest data.

### 3. Know where the live data lives

The production dataset lives in `data/`.

Archived or superseded files live in `data_archive/`.

Detailed maintenance rules are documented in [MAINTENANCE.md](./MAINTENANCE.md).
