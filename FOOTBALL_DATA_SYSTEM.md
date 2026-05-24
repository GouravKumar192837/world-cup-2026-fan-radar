# Football Data System

Public site:

`https://gouravkumar192837.github.io/world-cup-2026-fan-radar/`

## What Controls What

These are the football-critical files that drive what viewers actually see.

| File | Role | Used For | Update When |
| --- | --- | --- | --- |
| `data/worldcup_player_registry_v1.csv` | Authoritative | Official squad/player pool for announced or preliminary countries | A federation or clearly attributable source announces a squad/list/pool |
| `data/squad_collection_status_v1.csv` | Authoritative | Country-level squad status and registry count | Squad status changes, registry count changes, or source metadata changes |
| `data/expected_xi_curated_v4.csv` | Authoritative where rows exist | Display XI for curated countries and XI slot template | Football judgment changes, lineup quality is wrong, or a country needs manual XI coverage |
| `data/key_players_curated_v4.csv` | Supporting | Fan-facing key players, spotlight order, match summaries | Key-player context or storytelling needs correction |
| `data/players_data-2025_2026.csv` | Supporting | Stats Lens, roleScore, provisional XI support, Club Watch player pool | The underlying stats dataset is intentionally refreshed |
| `data/country_story_profiles_v4.csv` | Supporting | Country Radar overview summaries and storyline context | Team story/context needs correction |
| `data/match_storylines_curated_v4.csv` | Supporting | Match cards and matchup reasons | Match story/context needs correction |
| `data/club_matchup_watch_curated_v4.csv` | Supporting | Club Watch matchup cards | Add or correct curated club matchup coverage |
| `data/country_coverage_tracker.csv` | Generated tracker | Country-by-country readiness and XI mode overview | Regenerate after meaningful football-data changes |

Runtime policy:

- `data/` should contain only current app data plus the generated coverage tracker.
- Legacy or policy-only CSVs live in `data_archive/legacy_snapshots/`.
- `data/key_players_curated_v4.csv` is the only key-player runtime source; do not restore the old fallback unless the app code is intentionally changed.

## Expected XI Source Order

Country Radar should be read in this order:

1. `Registry-constrained XI`
   - use when `squad_collection_status_v1.csv` says `Announced squad`, `Announced list`, or `Preliminary squad`
   - and `worldcup_player_registry_v1.csv` has at least 11 usable `TRUE` rows
2. `Curated XI`
   - use when `expected_xi_curated_v4.csv` has a complete football-sensible 11 for that country
3. `Stats-assisted provisional XI`
   - use when there is no official pool and no curated XI, but the app has enough eligible stats rows to form a sensible XI
4. `Unavailable`
   - use only when the app cannot build a valid football XI honestly

## Club Watch Rule

Club Watch is now meant to be broad, not only curated.

Show all club players from `players_data-2025_2026.csv`, except:

- `country not qualified`
- `not in reported squad` when that country has an official captured squad/list/pool and the player is outside it

Curated key-player files still help with insights and storytelling, but they do not decide whether a club player appears at all.

## Change Matrix

| Scenario | Update These Files | Usually Do Not Touch |
| --- | --- | --- |
| Official squad announced | `worldcup_player_registry_v1.csv`, `squad_collection_status_v1.csv` | `players_data-2025_2026.csv` |
| Registry correction | `worldcup_player_registry_v1.csv`, maybe `squad_collection_status_v1.csv` | `expected_xi_curated_v4.csv` unless lineup policy also changes |
| Expected XI quality issue | `expected_xi_curated_v4.csv` | Registry/status files unless official squad status changed |
| Missing / wrong club player in Club Watch | Check `players_data-2025_2026.csv`, registry, qualification logic | `key_players_curated_v4.csv` unless insight copy is also wrong |
| Country story feels wrong | `country_story_profiles_v4.csv`, maybe `key_players_curated_v4.csv` | Registry/status files |
| Match card story feels wrong | `match_storylines_curated_v4.csv`, maybe `key_players_curated_v4.csv` | Registry/status files |
| Stats / roleScore realism issue | `app.js`, maybe `players_data-2025_2026.csv` if source data is wrong | Registry/status files |

## One-Command Update Workflow

Use a new chat in this same workspace and send one of:

- `scan for new squad announcements and update the active files`
- `refresh all football data from public sources`
- `check for any squad or expected XI updates and apply needed CSV changes`

The expected flow is:

1. Codex scans official-first public sources.
2. Codex identifies which countries changed.
3. Codex updates only the relevant authoritative CSVs.
4. Codex re-evaluates Expected XI mode for affected countries.
5. Codex regenerates `data/country_coverage_tracker.csv` after meaningful data changes.
6. Codex runs local static, data, desktop, and mobile smoke checks.
7. Codex reports exact file-level changes.
8. You review and push to GitHub.

## Every 2-3 Days: What You Do

When the app is live and you want to keep it fresh:

1. Open a new chat in this workspace.
2. Send:
   - `scan for new squad announcements and update the active files`
3. Read the summary:
   - if nothing changed, do nothing
   - if something changed, review the changed countries and files
4. Ask for a quick smoke check if needed.
5. Push the repo to GitHub so Pages updates.

Default rhythm:

- normal period: every `2-3 days`
- active squad-release period: `daily`
- after major news or before sharing widely: one extra same-day scan

## Coverage Tracker

Use `data/country_coverage_tracker.csv` as the quick operational dashboard.

It shows, per team:

- official squad status
- registry coverage
- expected XI mode
- curated XI presence
- key-player coverage
- country-story coverage
- stats-player depth
- Club Watch readiness
- overall readiness

This file is generated from the current live football dataset and should be refreshed whenever football-critical CSVs change materially.
