# World Cup Fan Radar Maintenance Guide

Public site:

`https://gouravkumar192837.github.io/world-cup-2026-fan-radar/`

Detailed football-data ownership, update rules, and the 2-3 day operating routine now live in [FOOTBALL_DATA_SYSTEM.md](./FOOTBALL_DATA_SYSTEM.md).

## Active App Dataset

These files are the live data contract for the current app:

- `data/matches_updated.csv`
- `data/teams_updated.csv`
- `data/host_cities.csv`
- `data/tournament_stages.csv`
- `data/players_data-2025_2026.csv`
- `data/country_name_map.csv`
- `data/data_freshness_summary.csv`
- `data/key_players_curated_v4.csv`
- `data/country_story_profiles_v4.csv`
- `data/match_storylines_curated_v4.csv`
- `data/expected_xi_curated_v4.csv`
- `data/club_matchup_watch_curated_v4.csv`
- `data/team_hype_profiles.csv`
- `data/match_rivalry_overrides.csv`
- `data/worldcup_player_registry_v1.csv`
- `data/squad_collection_status_v1.csv`
- `data/country_coverage_tracker.csv`

The runtime key-player source is now `data/key_players_curated_v4.csv`. Older policy, scoring, and legacy key-player CSVs are archived in `data_archive/legacy_snapshots/` and are not loaded by the app.

## File Responsibilities

- `data/squad_collection_status_v1.csv`
  Authoritative squad-status table for country-level release state, registry counts, and source metadata.

- `data/worldcup_player_registry_v1.csv`
  Authoritative player pool for announced or preliminary squads. This is the source of truth for registry-constrained countries.

- `data/expected_xi_curated_v4.csv`
  Curated expected XI and formation template for countries where a fan-curated XI is maintained.

- `data/key_players_curated_v4.csv`
  Fan-facing key-player layer. Update only when the spotlight players or summaries need revision.

- `data/players_data-2025_2026.csv`
  Supporting stats and ranking layer. Do not edit during normal squad-news refreshes unless the stats dataset itself is being intentionally refreshed.

- `data/country_coverage_tracker.csv`
  Generated country-by-country readiness tracker. Refresh after meaningful football-data changes so you can see which teams are registry-backed, curated, provisional, or still weak.

## Chat-Driven Update Workflow

Default maintenance flow:

1. Ask for a full scan in this workspace chat.
2. The assistant checks public attributable sources only:
   official federation sites, official federation or team social accounts, or strong reporting that directly cites the official announcement.
3. The assistant identifies which countries changed.
4. The assistant updates only the active files needed for those countries.
5. The assistant reports:
   countries checked, sources used, files changed, and any countries skipped due to weak or missing sourcing.

Example commands:

- `scan for new squad announcements and update the active files`
- `refresh all squad data from public sources`
- `check for new World Cup squad news and update the registry`
- `scan for new squad announcements and update the active files`
- `check for any squad or expected XI updates and apply needed CSV changes`

Default interpretation:

- full scan across relevant countries
- verify source quality
- update only the active files needed
- report exactly what changed and what was left unchanged

The decision matrix for which file should change in which scenario is documented in [FOOTBALL_DATA_SYSTEM.md](./FOOTBALL_DATA_SYSTEM.md).

## Owner Scenarios

- `No new squad news`
  Do nothing except optional smoke checks.

- `New official squad announcement`
  Update `data/squad_collection_status_v1.csv` and `data/worldcup_player_registry_v1.csv`, then verify that country in Country Radar.

- `Curated XI adjustment without official squad release`
  Update `data/expected_xi_curated_v4.csv`, and update `data/key_players_curated_v4.csv` only if the fan-facing story also changed.

- `Fan-summary or key-player refresh`
  Update `data/key_players_curated_v4.csv` only.

- `Stats refresh`
  Update `data/players_data-2025_2026.csv` only when intentionally refreshing the stats dataset.

- `Public release prep`
  Confirm the live files are still in `data/`, confirm archived duplicates remain outside `data/`, run a quick smoke pass, then publish the repo.

## Owner Operating Loop

Use this as the normal cycle:

1. Share the public link.
2. Collect viewer feedback in plain language.
3. Refresh only the active data files that need changes.
4. Smoke-check one registry country, one curated non-registry country, one unavailable country, and tab navigation.
5. Push to GitHub so Pages updates automatically.
6. Keep sharing the same public link.

Common feedback buckets:

- data corrections
- usability confusion
- feature requests

Practical cadence:

- normal period: every `2-3 days`
- active squad announcement period: `daily`
- after major football news or before wider sharing: run an extra same-day scan

If the scan reports no real changes, do nothing. If it reports changed countries, review the summary and push once satisfied.

For a ready-to-send viewer message, use [SHARE_MESSAGE.md](./SHARE_MESSAGE.md).

## Publishing

The app is designed to be published as a static GitHub Pages site.

Expected flow:

1. Push the repo to GitHub.
2. Keep the default branch as `main`.
3. Enable GitHub Pages with GitHub Actions as the deployment source.
4. Let `.github/workflows/deploy-pages.yml` publish the runtime artifact: `index.html`, `app.js`, `styles.css`, and `data/`.
5. Share the GitHub Pages URL with viewers:
   `https://gouravkumar192837.github.io/world-cup-2026-fan-radar/`

Smoke-check before publishing:

- one registry-constrained country
- one curated non-registry country
- one unavailable country
- general tab navigation on desktop and mobile
- startup performance: first screen appears quickly and no Google Fonts request is present

## Release Checklist

Before every push:

1. Update only the relevant active data files.
2. Parse edited CSVs and confirm required fields are present.
3. Run local desktop and mobile smoke checks.
4. Confirm startup performance locally.
5. Push only after the release files are staged intentionally.
6. Verify the GitHub Pages deployment and public URL after push.

## Archive Policy

- Keep `data/` as the live app dataset only.
- Move validated inactive or superseded files into `data_archive/legacy_snapshots/`.
- Archive first; do not delete by default.
- Before archiving any file, confirm the app does not currently load it.

## Current Archived Candidates

These files were identified as unused by the current app and are safe archive candidates once validated:

- `matches.csv`
- `teams.csv`
- `players_data_light-2025_2026.csv`
- `squad_collection_status_updated.csv`
- `squad_status.csv`
- `key_players_curated.csv`
- `app_display_policy_v4.csv`
- `data_usage_policy_v3.csv`
- `match_hype_scoring_rules.csv`
- `change_log.csv`
- `player_data_policy.csv`

## Local Tooling

Temporary local browser-testing helpers are not production data. Keep them out of the live data discussion and treat them as workspace tooling only.
