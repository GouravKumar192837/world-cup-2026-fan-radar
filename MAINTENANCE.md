# World Cup Fan Radar Maintenance Guide

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
- `data/key_players_curated.csv`
- `data/country_story_profiles_v4.csv`
- `data/match_storylines_curated_v4.csv`
- `data/expected_xi_curated_v4.csv`
- `data/club_matchup_watch_curated_v4.csv`
- `data/app_display_policy_v4.csv`
- `data/team_hype_profiles.csv`
- `data/match_hype_scoring_rules.csv`
- `data/match_rivalry_overrides.csv`
- `data/data_usage_policy_v3.csv`
- `data/worldcup_player_registry_v1.csv`
- `data/squad_collection_status_v1.csv`

`data/key_players_curated.csv` is still active as a fallback if `data/key_players_curated_v4.csv` is unavailable or empty. Do not archive it until the app stops referencing that fallback.

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

Default interpretation:

- full scan across relevant countries
- verify source quality
- update only the active files needed
- report exactly what changed and what was left unchanged

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

## Publishing

The app is designed to be published as a static GitHub Pages site.

Expected flow:

1. Push the repo to GitHub.
2. Keep the default branch as `main`.
3. Enable GitHub Pages with GitHub Actions as the deployment source.
4. Let `.github/workflows/deploy-pages.yml` publish the site.
5. Share the GitHub Pages URL with viewers.

Smoke-check before publishing:

- one registry-constrained country
- one curated non-registry country
- one unavailable country
- general tab navigation on desktop and mobile

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

## Local Tooling

Temporary local browser-testing helpers are not production data. Keep them out of the live data discussion and treat them as workspace tooling only.
