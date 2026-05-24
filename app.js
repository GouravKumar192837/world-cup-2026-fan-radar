const DATA = {
  matches: "data/matches_updated.csv",
  teams: "data/teams_updated.csv",
  cities: "data/host_cities.csv",
  stages: "data/tournament_stages.csv",
  players: "data/players_data-2025_2026.csv",
  countryMap: "data/country_name_map.csv",
  freshness: "data/data_freshness_summary.csv",
  keyPlayers: "data/key_players_curated.csv",
  keyPlayersV4: "data/key_players_curated_v4.csv",
  countryStories: "data/country_story_profiles_v4.csv",
  matchStorylines: "data/match_storylines_curated_v4.csv",
  expectedXi: "data/expected_xi_curated_v4.csv",
  clubMatchups: "data/club_matchup_watch_curated_v4.csv",
  displayPolicy: "data/app_display_policy_v4.csv",
  teamProfiles: "data/team_hype_profiles.csv",
  scoringRules: "data/match_hype_scoring_rules.csv",
  rivalryOverrides: "data/match_rivalry_overrides.csv",
  usagePolicy: "data/data_usage_policy_v3.csv",
  playerRegistry: "data/worldcup_player_registry_v1.csv",
  squadStatus: "data/squad_collection_status_v1.csv"
};

const state = {
  rows: {},
  countryAliases: new Map(),
  keyPlayers: new Map(),
  teamProfiles: new Map(),
  rivalryOverrides: new Map(),
  countryStories: new Map(),
  matchStorylines: new Map(),
  expectedXi: new Map(),
  clubMatchups: new Map(),
  playerRegistry: new Map(),
  squadStatus: new Map(),
  selectedXiPlayer: null,
  xiShowList: false,
  xiShowRoles: true,
  xiShowClubs: false,
  missingV3: [],
  teams: new Map(),
  cities: new Map(),
  stages: new Map(),
  playersAll: [],
  worldCupPlayerPool: [],
  countries: new Map(),
  matches: [],
  clubs: [],
  activeClub: "",
  clubWatchClub: "",
  playerList: "key",
  playerPage: 1,
  playerSort: { key: "overall", dir: "desc" },
  clubSort: { key: "overall", dir: "desc" },
  countrySort: { key: "overall", dir: "desc" },
  countryUiSignature: "",
  plannerSort: { key: "date", dir: "asc" },
  plannerLimit: 24,
  highFormThreshold: 60,
  prioritizeClubLens: false,
  compare: new Map(),
  favourites: new Set(JSON.parse(localStorage.getItem("fanRadarFavourites") || "[]"))
};

const COUNTRY_NAMES = {
  USA: "United States", KOR: "South Korea", IRN: "Iran", TUR: "Turkey", CIV: "Ivory Coast",
  CZE: "Czech Republic", NED: "Netherlands", KVX: "Kosovo", KSA: "Saudi Arabia", RSA: "South Africa",
  ENG: "England", SCO: "Scotland", WAL: "Wales", NIR: "Northern Ireland", POR: "Portugal",
  ESP: "Spain", FRA: "France", GER: "Germany", BRA: "Brazil", ARG: "Argentina", MEX: "Mexico",
  MAR: "Morocco", ALG: "Algeria", TUN: "Tunisia", EGY: "Egypt", SEN: "Senegal", GHA: "Ghana",
  JPN: "Japan", AUS: "Australia", NZL: "New Zealand", CAN: "Canada", COL: "Colombia", URU: "Uruguay",
  PAR: "Paraguay", ECU: "Ecuador", CRO: "Croatia", BEL: "Belgium", AUT: "Austria", SUI: "Switzerland",
  NOR: "Norway", QAT: "Qatar", JOR: "Jordan", UZB: "Uzbekistan", PAN: "Panama", HAI: "Haiti",
  CPV: "Cabo Verde", CUW: "Curacao"
};

const CLUB_THEMES = [
  { test: /manchester united/i, colors: ["#da291c", "#fbe122", "#111111"] },
  { test: /real madrid/i, colors: ["#f6f4ee", "#febd11", "#132257"] },
  { test: /bar[cç]elona/i, colors: ["#004d98", "#a50044", "#edbb00"] },
  { test: /liverpool/i, colors: ["#c8102e", "#ffffff", "#00b2a9"] },
  { test: /chelsea/i, colors: ["#034694", "#ffffff", "#dba111"] },
  { test: /arsenal/i, colors: ["#ef0107", "#dbb45a", "#063672"] },
  { test: /bayern/i, colors: ["#dc052d", "#0066b2", "#ffffff"] },
  { test: /inter/i, colors: ["#010e80", "#000000", "#a29161"] },
  { test: /psg|paris/i, colors: ["#004170", "#da291c", "#ffffff"] }
];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const num = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(/[+,%]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const avg = (arr) => {
  const vals = arr.filter(Number.isFinite);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
};
const fmt = (n, d = 0) => Number.isFinite(n) ? n.toFixed(d) : "-";

function normalizePlayerName(name = "") {
  const cleaned = String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’'`´.-]/g, " ")
    .replace(/[-‐‑‒–—]/g, " ")
    .replace(/\bjr\b/g, "junior")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const aliases = {
    "vinicius junior": ["vinicius junior", "vinicius jr"],
    "kylian mbappe": ["kylian mbappe"],
    "ousmane dembele": ["ousmane dembele"]
  };
  return Object.entries(aliases).find(([, names]) => names.includes(cleaned))?.[0] || cleaned;
}

function normalizeClubName(name = "") {
  return normalizePlayerName(name).replace(/\b(fc|cf|sc|club)\b/g, "").replace(/\s+/g, " ").trim();
}

boot();

async function boot() {
  try {
    const [matches, teams, cities, stages, players, countryMap, freshness, keyPlayersV3, keyPlayersV4, countryStories, matchStorylines, expectedXi, clubMatchups, displayPolicy, teamProfiles, scoringRules, rivalryOverrides, usagePolicy, playerRegistry, squadStatus] = await Promise.all([
      loadCsv(DATA.matches),
      loadCsv(DATA.teams),
      loadCsv(DATA.cities),
      loadCsv(DATA.stages),
      loadCsv(DATA.players),
      loadOptionalCsv(DATA.countryMap, "country guide"),
      loadOptionalCsv(DATA.freshness, "data coverage note"),
      loadOptionalCsv(DATA.keyPlayers, "key player guide"),
      loadOptionalCsv(DATA.keyPlayersV4, "key player guide"),
      loadOptionalCsv(DATA.countryStories, "country story guide"),
      loadOptionalCsv(DATA.matchStorylines, "fixture story guide"),
      loadOptionalCsv(DATA.expectedXi, "expected XI guide"),
      loadOptionalCsv(DATA.clubMatchups, "club matchup guide"),
      loadOptionalCsv(DATA.displayPolicy, "display policy"),
      loadOptionalCsv(DATA.teamProfiles, "team hype guide"),
      loadOptionalCsv(DATA.scoringRules, "hype scoring guide"),
      loadOptionalCsv(DATA.rivalryOverrides, "rivalry guide"),
      loadOptionalCsv(DATA.usagePolicy, "data policy"),
      loadOptionalCsv(DATA.playerRegistry, "player registry"),
      loadOptionalCsv(DATA.squadStatus, "squad status")
    ]);
    const keyPlayers = keyPlayersV4.length ? keyPlayersV4 : keyPlayersV3;
    state.rows = { matches, teams, cities, stages, players, countryMap, freshness, keyPlayers, countryStories, matchStorylines, expectedXi, clubMatchups, displayPolicy, teamProfiles, scoringRules, rivalryOverrides, usagePolicy, playerRegistry, squadStatus };
    buildCountryAliases(countryMap);
    teams.forEach((t) => state.teams.set(t.id, { ...t, real: isRealTeam(t) }));
    cities.forEach((c) => state.cities.set(c.id, c));
    stages.forEach((s) => state.stages.set(s.id, s));
    buildPlayers(players);
    buildEligibilityLayers(playerRegistry, squadStatus);
    buildV3HypeLayers(keyPlayers, teamProfiles, rivalryOverrides);
    buildV4GuideLayers(countryStories, matchStorylines, expectedXi, clubMatchups);
    buildCountries();
    buildMatches(matches);
    state.clubs = [...new Set(state.playersAll.map((p) => p.club).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    state.activeClub = "";
    wireUi();
    fillSelects();
    renderAll();
    $("loader").classList.add("hidden");
  } catch (err) {
    $("loader").classList.add("hidden");
    $("error").classList.remove("hidden");
    $("error").textContent = `Could not load app data: ${err.message}`;
  }
}

async function loadCsv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return parseCsv(await res.text());
}

async function loadOptionalCsv(url, label) {
  try {
    return await loadCsv(url);
  } catch {
    state.missingV3.push(label);
    return [];
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"' && quote && next === '"') { cell += '"'; i++; }
    else if (ch === '"') quote = !quote;
    else if (ch === "," && !quote) { row.push(cell); cell = ""; }
    else if ((ch === "\n" || ch === "\r") && !quote) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some((x) => x !== "")) rows.push(row);
      row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift().map((h) => h.trim());
  console.info("Full player/data columns inspected:", headers);
  return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

function pick(row, names) {
  const lower = Object.fromEntries(Object.keys(row).map((k) => [k.toLowerCase(), k]));
  for (const name of names) {
    const key = lower[name.toLowerCase()];
    if (key && row[key] !== "") return row[key];
  }
  return "";
}

function buildCountryAliases(rows) {
  rows.forEach((r) => {
    const code = normalizeCountryCode(pick(r, ["fifa_code", "code"]), pick(r, ["canonical_country", "country", "team_name"]));
    [pick(r, ["canonical_country", "country", "team_name"]), pick(r, ["alias"]), code].filter(Boolean).forEach((name) => {
      state.countryAliases.set(String(name).toLowerCase(), code);
    });
  });
}

function buildV3HypeLayers(keyRows, profileRows, rivalryRows) {
  keyRows.forEach((r, i) => {
    const code = normalizeCountryCode(pick(r, ["fifa_code", "country_code", "code"]), pick(r, ["country", "team", "nationality", "canonical_country"]));
    if (!code) return;
    const player = {
      name: pick(r, ["player_name", "player", "name"]),
      countryCode: code,
      country: countryName(code),
      position: pick(r, ["position", "pos"]),
      club: pick(r, ["club_reference", "club", "squad", "team_club"]),
      role: pick(r, ["role", "position", "pos"]),
      roleGroup: pick(r, ["role_group", "role", "position"]),
      subRole: pick(r, ["sub_role", "expected_role"]),
      priority: num(pick(r, ["priority", "rank", "star_rank", "sort_order"])) ?? i,
      tier: pick(r, ["priority_tier", "tier"]),
      star: (num(pick(r, ["fan_importance", "star_power", "star_score", "hype_score", "rating"])) ?? 7) * 10,
      avoidGk: pick(r, ["avoid_as_headline_unless_gk_context"]),
      useSummary: pick(r, ["use_in_match_summary"]),
      showFan: pick(r, ["show_in_fan_views"])
    };
    if (!player.name) return;
    if (!state.keyPlayers.has(code)) state.keyPlayers.set(code, []);
    state.keyPlayers.get(code).push(player);
  });
  state.keyPlayers.forEach((players) => players.sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || b.star - a.star || a.priority - b.priority));

  profileRows.forEach((r) => {
    const code = normalizeCountryCode(pick(r, ["fifa_code", "country_code", "code"]), pick(r, ["country", "team", "team_name", "canonical_country"]));
    if (!code) return;
    state.teamProfiles.set(code, {
      quality: num(pick(r, ["country_quality", "quality", "team_quality", "quality_score", "overall_quality"])) ?? null,
      depth: num(pick(r, ["squad_depth_score_10", "squad_depth", "depth", "depth_score"])) ?? null,
      attack: num(pick(r, ["attack", "attack_score"])) ?? null,
      defense: num(pick(r, ["defense", "defence", "defense_score"])) ?? null,
      starPower: num(pick(r, ["star_power_score_10", "star_power", "star_score"])) ?? null,
      fanInterest: num(pick(r, ["fan_interest_score_10", "fan_interest"])) ?? null,
      storyline: pick(r, ["tournament_storyline", "storyline"])
    });
  });

  rivalryRows.forEach((r) => {
    const a = normalizeCountryCode(pick(r, ["team_a_code", "home_code", "country_a_code", "fifa_code_a"]), pick(r, ["team_a", "country_a", "home_team"]));
    const b = normalizeCountryCode(pick(r, ["team_b_code", "away_code", "country_b_code", "fifa_code_b"]), pick(r, ["team_b", "country_b", "away_team"]));
    if (!a || !b) return;
    state.rivalryOverrides.set([a, b].sort().join("-"), num(pick(r, ["boost_10", "boost", "rivalry_boost", "fan_interest_boost", "score"])) ?? 0);
  });
}

function buildV4GuideLayers(countryRows, storylineRows, xiRows, matchupRows) {
  countryRows.forEach((r) => {
    const code = normalizeCountryCode("", pick(r, ["country"]));
    if (!code) return;
    state.countryStories.set(code, {
      players: pick(r, ["summary_players"]).split("|").map((x) => x.trim()).filter(Boolean),
      style: pick(r, ["style_summary"]),
      note: pick(r, ["not_official_note"])
    });
  });
  storylineRows.forEach((r) => {
    const n = pick(r, ["match_number"]);
    const home = normalizeCountryCode("", pick(r, ["home_team"]));
    const away = normalizeCountryCode("", pick(r, ["away_team"]));
    const story = {
      headline: pick(r, ["headline"]),
      summary: pick(r, ["main_storyline", "summary", "storyline"]),
      reason: pick(r, ["primary_reason"]),
      homePlayers: pick(r, ["home_key_players"]).split(",").map((x) => x.trim()).filter(Boolean),
      awayPlayers: pick(r, ["away_key_players"]).split(",").map((x) => x.trim()).filter(Boolean)
    };
    if (n) state.matchStorylines.set(`match:${n}`, story);
    if (home && away) state.matchStorylines.set([home, away].sort().join("-"), story);
  });
  xiRows.forEach((r) => {
    const code = normalizeCountryCode("", pick(r, ["country"]));
    if (!code) return;
    if (!state.expectedXi.has(code)) state.expectedXi.set(code, []);
    state.expectedXi.get(code).push({
      name: repairPlayerDisplayName(pick(r, ["player_name", "display_name"])),
      club: pick(r, ["club"]),
      slot: pick(r, ["position_slot"]),
      group: pick(r, ["position_group"]),
      role: pick(r, ["role_description"]),
      formation: normalizeFormation(pick(r, ["formation"])),
      confidence: pick(r, ["confidence"]),
      notes: pick(r, ["notes"])
    });
  });
  matchupRows.forEach((r) => {
    const club = pick(r, ["club"]);
    if (!club) return;
    if (!state.clubMatchups.has(club)) state.clubMatchups.set(club, []);
    state.clubMatchups.get(club).push({
      player: pick(r, ["player_name"]),
      playerCountry: pick(r, ["player_country"]),
      opponentCountry: pick(r, ["opponent_country"]),
      type: pick(r, ["matchup_type"]),
      role: pick(r, ["player_role"]),
      opponents: pick(r, ["opponent_names"]),
      summary: pick(r, ["display_summary"]),
      confidence: pick(r, ["confidence"])
    });
  });
}

function buildEligibilityLayers(registryRows, statusRows) {
  statusRows.forEach((r) => {
    const code = normalizeCountryCode("", pick(r, ["registry_country_name", "country"]));
    if (!code) return;
    const status = pick(r, ["squad_collection_status"]);
    state.squadStatus.set(code, { status, pending: /pending|not captured/i.test(status) });
  });
  registryRows.forEach((r) => {
    const code = normalizeCountryCode("", pick(r, ["country"]));
    if (!code) return;
    const row = {
      name: pick(r, ["player_name"]),
      nameKey: normalizePlayerName(pick(r, ["player_name"])),
      club: pick(r, ["club"]),
      clubKey: normalizeClubName(pick(r, ["club"])),
      positionGroup: pick(r, ["position_group"]),
      countryCode: code,
      include: /^true$/i.test(pick(r, ["include_in_worldcup_app"])),
      status: pick(r, ["squad_status"])
    };
    if (!state.playerRegistry.has(code)) state.playerRegistry.set(code, []);
    state.playerRegistry.get(code).push(row);
  });
}

function countrySquadPending(code) {
  const status = state.squadStatus.get(code);
  return !status || status.pending;
}

function registryMatch(playerName, country, club = "") {
  const code = /^[A-Z]{3}$/.test(String(country)) ? String(country) : normalizeCountryCode("", country);
  const nameKey = normalizePlayerName(playerName);
  const clubKey = normalizeClubName(club);
  const rows = (state.playerRegistry.get(code) || []).filter((r) => r.nameKey === nameKey);
  if (!rows.length) return null;
  return [...rows].sort((a, b) => (b.clubKey === clubKey) - (a.clubKey === clubKey))[0];
}

function isWorldCupEligiblePlayer(playerName, country, club = "") {
  return Boolean(registryMatch(playerName, country, club)?.include);
}

function playerEligibility(playerName, country, club = "") {
  const code = /^[A-Z]{3}$/.test(String(country)) ? String(country) : normalizeCountryCode("", country);
  const match = registryMatch(playerName, code, club);
  if (match?.include) return { eligible: true, pending: false, label: "" };
  if (countrySquadOpen(code)) return { eligible: false, pending: true, label: "squad not confirmed" };
  return { eligible: false, pending: false, label: "not in reported squad" };
}

function keyPlayersForDisplay(code) {
  return keyPlayersFor(code).filter((p) => {
    const status = playerEligibility(p.name, code, p.club);
    p.eligibilityLabel = status.label;
    return status.eligible || status.pending;
  });
}

function eligibleKeyPlayersFor(code) {
  return keyPlayersFor(code).filter((p) => isWorldCupEligiblePlayer(p.name, code, p.club));
}

function repairPlayerDisplayName(name = "") {
  return String(name)
    .replace(/Ã‰der MilitÃ£o/g, "Éder Militão")
    .replace(/Lucas PaquetÃ¡/g, "Lucas Paquetá")
    .replace(/VinÃ­cius JÃºnior/g, "Vinícius Júnior");
}

function normalizeFormation(value = "") {
  const text = String(value).trim();
  const parts = text.match(/\d+/g);
  if (!parts?.length) return text || "Fan XI";
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(text)) return `${Number(parts[0])}-${Number(parts[1])}-${Number(parts[2].slice(-1))}`;
  const normalized = parts.map((p) => Number(p)).filter(Boolean).join("-");
  return normalized || text || "Fan XI";
}

function tierRank(tier = "") {
  const t = String(tier).trim().toUpperCase();
  if (t === "A") return 1;
  if (t === "B") return 2;
  if (t === "C") return 3;
  return 9;
}

function isRealTeam(t) {
  if (!t || t.is_placeholder === "True") return false;
  return !/winner|runner|playoff|uefa|fifa|w\d+|ru\d+/i.test(`${t.team_name} ${t.fifa_code}`);
}

function qualifiedCodes() {
  return new Set([...state.teams.values()].filter((t) => t.real).map((t) => normalizeCountryCode(t.fifa_code, t.team_name)));
}

function normalizeCountryCode(code = "", name = "") {
  const alias = state.countryAliases.get(String(name || code).toLowerCase());
  if (alias) return alias;
  const text = `${code} ${name}`.toLowerCase();
  if (/usa|united states/.test(text)) return "USA";
  if (/korea republic|south korea|kor/.test(text)) return "KOR";
  if (/ir iran|iran|irn/.test(text)) return "IRN";
  if (/türkiye|turkiye|turkey|tur/.test(text)) return "TUR";
  if (/côte|cote|ivory coast|civ/.test(text)) return "CIV";
  if (/czechia|czech republic|cze/.test(text)) return "CZE";
  if (/netherlands|holland|ned/.test(text)) return "NED";
  if (/kosovo|kvx/.test(text)) return "KVX";
  if (/cabo verde|cape verde|cpv/.test(text)) return "CPV";
  if (/curaçao|curacao|cuw/.test(text)) return "CUW";
  return String(code || "").toUpperCase();
}

function countryName(code) {
  if (["USA", "KOR", "IRN", "TUR", "CZE", "NED", "KVX", "KSA", "RSA", "CPV", "CUW"].includes(code)) return COUNTRY_NAMES[code] || code;
  const team = [...state.teams.values()].find((t) => normalizeCountryCode(t.fifa_code, t.team_name) === code && t.real);
  return team?.team_name || COUNTRY_NAMES[code] || code;
}

function playerCountryCode(row) {
  const raw = row.Nation || row.Nation_stats_misc || row.Nation_stats_keeper || "";
  const parts = raw.trim().split(/\s+/);
  return normalizeCountryCode((parts[parts.length - 1] || "").toUpperCase(), raw);
}

function firstAvailable(row, names) {
  for (const n of names) {
    const v = num(row[n]);
    if (Number.isFinite(v)) return v;
  }
  return null;
}

function per90(row, names) {
  const total = firstAvailable(row, Array.isArray(names) ? names : [names]);
  const nineties = firstAvailable(row, ["90s", "90s_stats_standard", "90s_stats_playing_time", "90s_stats_misc", "90s_stats_shooting"]) || (num(row.Min) ? num(row.Min) / 90 : 0);
  return Number.isFinite(total) && nineties ? total / nineties : null;
}

function positionInfo(pos = "") {
  const s = pos.toUpperCase();
  const broad = s.includes("GK") ? "Goalkeeper" : s.includes("DF") ? "Defender" : s.includes("MF") ? "Midfielder" : s.includes("FW") ? "Forward" : "Outfield";
  let role = broad;
  if (s.includes("FW") && s.includes("MF")) role = "Winger or attacking midfielder";
  else if (s.includes("DF") && s.includes("MF")) role = "Full-back or defensive midfielder";
  else if (s.includes("DF")) role = "Defender";
  else if (s.includes("MF")) role = "Midfielder";
  else if (s.includes("FW")) role = "Forward";
  return { broad, label: role };
}

function buildPlayers(rows) {
  const base = rows.map((r, i) => {
    const pos = positionInfo(r.Pos || r.Pos_stats_misc || r.Pos_stats_keeper || "");
    return {
      id: `p${i}`,
      raw: r,
      name: r.Player,
      code: playerCountryCode(r),
      country: "",
      posRaw: r.Pos || "",
      pos: pos.label,
      broad: pos.broad,
      club: r.Squad || "",
      league: String(r.Comp || "").replace(/^[a-z]{2,3}\s+/i, ""),
      age: firstAvailable(r, ["Age", "Age_stats_playing_time", "Age_stats_misc"]),
      min: firstAvailable(r, ["Min", "Min_stats_playing_time", "Min_stats_keeper"]) || 0,
      goals: firstAvailable(r, ["Gls", "Gls_stats_shooting"]) || 0,
      assists: firstAvailable(r, ["Ast"]) || 0,
      xg: firstAvailable(r, ["xG", "npxG"]),
      xag: firstAvailable(r, ["xAG", "xA"]),
      gls90: per90(r, ["Gls", "Gls_stats_shooting"]),
      ast90: per90(r, ["Ast"]),
      sh90: firstAvailable(r, ["Sh/90"]),
      sot90: firstAvailable(r, ["SoT/90"]),
      crs90: per90(r, ["Crs"]),
      int90: per90(r, ["Int"]),
      tklw90: per90(r, ["TklW", "Tkl"]),
      fld90: per90(r, ["Fld"]),
      fls90: per90(r, ["Fls"]),
      ppm: firstAvailable(r, ["PPM"]),
      onG90: per90(r, ["onG"]),
      plus90: firstAvailable(r, ["+/-90"]),
      savePct: firstAvailable(r, ["Save%"]),
      csPct: firstAvailable(r, ["CS%"]),
      ga90: firstAvailable(r, ["GA90"]),
      saves90: per90(r, ["Saves"])
      ,
      prgP90: per90(r, ["PrgP", "Prog"]),
      prgC90: per90(r, ["PrgC"]),
      touchesAtt90: per90(r, ["Touches_Att 3rd", "Touches_Att Pen", "Att Pen"]),
      takeOns90: per90(r, ["Succ", "Take-Ons_Succ"]),
      passCmp: firstAvailable(r, ["Cmp%", "Pass_Cmp%"]),
      blocks90: per90(r, ["Blocks", "Blocks_Blocks"]),
      clr90: per90(r, ["Clr"]),
      aerial90: per90(r, ["Won", "Aerials_Won"]),
      recov90: per90(r, ["Recov"]),
      claims90: per90(r, ["Stp", "Crosses_Stp"]),
      longPass90: per90(r, ["Launches_Cmp"])
    };
  }).filter((p) => p.name && p.code);

  const metricNames = ["gls90", "ast90", "sh90", "sot90", "crs90", "int90", "tklw90", "fld90", "fls90", "ppm", "onG90", "plus90", "savePct", "csPct", "saves90", "prgP90", "prgC90", "touchesAtt90", "takeOns90", "passCmp", "blocks90", "clr90", "aerial90", "recov90", "claims90", "longPass90"];
  const scales = Object.fromEntries(metricNames.map((m) => [m, minMax(base, m)]));
  scales.ga90 = minMax(base, "ga90", true);
  const score = (p, metric) => normalize(p[metric], scales[metric]);

  base.forEach((p) => {
    p.country = countryName(p.code);
    p.attack = avg([score(p, "gls90") * 1.25, score(p, "sot90"), score(p, "sh90"), p.goals ? clamp(p.goals * 4) : null]);
    p.creativity = avg([score(p, "ast90") * 1.2, score(p, "crs90"), score(p, "fld90"), p.assists ? clamp(p.assists * 6) : null]);
    p.progression = avg([score(p, "onG90"), score(p, "plus90"), score(p, "ppm")]);
    p.defense = avg([score(p, "int90"), score(p, "tklw90"), 100 - score(p, "fls90")]);
    p.goalkeeping = avg([score(p, "savePct") * 1.3, score(p, "csPct"), score(p, "ga90"), score(p, "saves90")]);
    const roleScores = p.broad === "Goalkeeper" ? [p.goalkeeping * 1.4, p.progression]
      : p.broad === "Defender" ? [p.defense * 1.25, p.progression, p.creativity * .45]
      : p.broad === "Midfielder" ? [p.creativity * 1.15, p.progression, p.defense * .55, p.attack * .45]
      : [p.attack * 1.25, p.creativity, p.progression * .55];
    const reliability = Number.isFinite(p.min) && p.min > 0 ? Math.min(1, p.min / 900) : 0.65;
    p.roleScore = clamp(avg(roleScores) * (0.65 + 0.35 * reliability));
    p.overall = p.roleScore;
  });

  rankByPosition(base);
  state.playersAll = base;
  const q = qualifiedCodes();
  state.worldCupPlayerPool = base.filter((p) => q.has(p.code));
}

function minMax(rows, key, inverse = false) {
  const vals = rows.map((r) => r[key]).filter(Number.isFinite).sort((a, b) => a - b);
  if (!vals.length) return { empty: true, inverse, min: 0, max: 1 };
  const min = vals[Math.floor(vals.length * .05)];
  const max = vals[Math.floor(vals.length * .95)];
  return { min, max: max === min ? min + 1 : max, inverse, empty: false };
}

function normalize(value, scale) {
  if (!Number.isFinite(value) || scale.empty) return null;
  const base = clamp(((value - scale.min) / (scale.max - scale.min)) * 100);
  return scale.inverse ? 100 - base : base;
}

function rankByPosition(players) {
  ["Goalkeeper", "Defender", "Midfielder", "Forward", "Outfield"].forEach((pos) => {
    players.filter((p) => p.broad === pos).sort((a, b) => b.roleScore - a.roleScore).forEach((p, i) => p.posRank = i + 1);
  });
}

function buildCountries() {
  const q = qualifiedCodes();
  q.forEach((code) => {
    const players = state.worldCupPlayerPool.filter((p) => p.code === code);
    const top = players.filter((p) => p.min >= 450).sort((a, b) => b.overall - a.overall).slice(0, 22);
    state.countries.set(code, {
      code,
      name: countryName(code),
      players,
      top,
      strength: clamp(avg(top.map((p, i) => p.overall * (1 - i * .015))) + clamp(top.filter((p) => p.overall >= 75).length * 1.2, 0, 12)),
      attack: avg(top.map((p) => p.attack)),
      creativity: avg(top.map((p) => p.creativity)),
      progression: avg(top.map((p) => p.progression)),
      defense: avg(top.map((p) => p.defense)),
      goalkeeping: avg(top.filter((p) => p.broad === "Goalkeeper").map((p) => p.goalkeeping))
    });
  });
}

function parseKickoff(value) {
  return new Date(value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"));
}

function istParts(date) {
  const label = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).format(date);
  const dateOnly = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour: "numeric", hourCycle: "h23" }).format(date));
  const minute = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", minute: "2-digit" }).format(date));
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(date);
  return { label, dateOnly, hour, minute, minutes: hour * 60 + minute, weekend: ["Sat", "Sun"].includes(weekday) };
}

function watchWindow(parts) {
  const m = parts.minutes;
  if (m >= 19 * 60 && m <= 23 * 60 + 30) return "Prime Time";
  if (m > 23 * 60 + 30 || m <= 2 * 60 + 30) return "Late Night";
  if (m > 2 * 60 + 30 && m <= 6 * 60) return "Early Morning";
  return "Daytime";
}

function buildMatches(rows) {
  state.matches = rows.map((m) => {
    const home = state.teams.get(m.home_team_id);
    const away = state.teams.get(m.away_team_id);
    const city = state.cities.get(m.city_id) || {};
    const stage = state.stages.get(m.stage_id) || {};
    const date = parseKickoff(m.kickoff_at);
    const ist = istParts(date);
    const labelParts = (m.match_label || "").split(/\s+vs\s+/i);
    const isFinalized = Boolean(home?.real && away?.real);
    const bothUnknown = !home?.real && !away?.real;
    return {
      ...m,
      home,
      away,
      homeCode: home?.real ? normalizeCountryCode(home.fifa_code, home.team_name) : "",
      awayCode: away?.real ? normalizeCountryCode(away.fifa_code, away.team_name) : "",
      homeName: home?.real ? countryName(normalizeCountryCode(home.fifa_code, home.team_name)) : bothUnknown ? "Teams not finalized" : "Team not finalized",
      awayName: away?.real ? countryName(normalizeCountryCode(away.fifa_code, away.team_name)) : bothUnknown ? "Knockout path TBD" : "Team not finalized",
      isFinalized,
      city,
      stage,
      date,
      ist,
      window: watchWindow(ist)
    };
  });
}

function scoreMatch(match) {
  if (!match.isFinalized) return null;
  const c1 = state.countries.get(match.homeCode);
  const c2 = state.countries.get(match.awayCode);
  if (!c1 || !c2) return null;
  const p1 = profileFor(match.homeCode, c1);
  const p2 = profileFor(match.awayCode, c2);
  const combinedStrength = avg([p1.quality, p2.quality]);
  const depth = avg([p1.depth, p2.depth]);
  const balance = 100 - Math.abs((p1.quality ?? 50) - (p2.quality ?? 50));
  const keyA = keyPlayersForDisplay(match.homeCode);
  const keyB = keyPlayersForDisplay(match.awayCode);
  const starInputs = [keyA.length ? avg(keyA.slice(0, 5).map((p) => p.star)) : null, keyB.length ? avg(keyB.slice(0, 5).map((p) => p.star)) : null, p1.starPower, p2.starPower].filter(Number.isFinite);
  const starPower = starInputs.length ? avg(starInputs) : null;
  const highForm = keyA.slice(0, 6).length + keyB.slice(0, 6).length;
  const starCount = keyA.filter((p) => p.star >= 80).length + keyB.filter((p) => p.star >= 80).length;
  const stageOrder = num(match.stage.stage_order) || 1;
  const rivalryBoost = rivalry(match.homeCode, match.awayCode);
  const clubPlayers = activeClubPlayers(match);
  const stageRaw = stageOrder === 1 ? 5 : 8 + stageOrder * 3;
  const components = {
    country: Number.isFinite(combinedStrength) ? clamp(combinedStrength * .3, 0, 30) : null,
    stars: Number.isFinite(starPower) ? clamp(starPower * .25, 0, 25) : null,
    balance: Number.isFinite(balance) ? clamp(balance * .2, 0, 20) : null,
    story: clamp((avg([p1.fanInterest, p2.fanInterest].filter(Number.isFinite)) || 50) * .08 + rivalryBoost, 0, 15),
    stage: clamp(stageRaw, 0, 10),
    club: clubInvolvementScore(match, clubPlayers)
  };
  const score = clamp([components.country, components.stars, components.balance, components.story, components.stage].filter(Number.isFinite).reduce((a, b) => a + b, 0));
  const reason = naturalReason({ combinedStrength, highForm, starCount, stageOrder, rivalryBoost, clubBoost: components.club, clubPlayers, match, c1, c2, components, keyA, keyB });
  return { score, combinedStrength, highForm, starCount, stageBoost: components.stage, rivalryBoost, clubBoost: components.club, components, clubPlayers, reason };
}

function profileFor(code, country) {
  const profile = state.teamProfiles.get(code);
  if (profile) return {
    quality: profile.quality ? profile.quality * 10 : country.strength,
    depth: profile.depth ? profile.depth * 10 : country.players.length,
    starPower: profile.starPower ? profile.starPower * 10 : null,
    fanInterest: profile.fanInterest ? profile.fanInterest * 10 : null,
    storyline: profile.storyline
  };
  return { quality: country.strength, depth: clamp(country.players.length * 2), starPower: null };
}

function keyPlayersFor(code) {
  return state.keyPlayers.get(code) || [];
}

function rivalry(a, b) {
  const key = [a, b].sort().join("-");
  if (state.rivalryOverrides.has(key)) return state.rivalryOverrides.get(key);
  const pairs = new Set(["ARG-BRA", "ENG-SCO", "ESP-POR", "FRA-GER", "GER-NED", "MEX-USA", "KOR-JPN", "CIV-GHA", "ALG-MAR"]);
  return pairs.has(key) ? 8 : 0;
}

function activeClubPlayers(match) {
  if (!state.activeClub) return [];
  const curated = [...eligibleKeyPlayersFor(match.homeCode), ...eligibleKeyPlayersFor(match.awayCode)].filter((p) => p.club === state.activeClub);
  if (curated.length) return curated;
  return state.worldCupPlayerPool.filter((p) => p.club === state.activeClub && (p.code === match.homeCode || p.code === match.awayCode) && isWorldCupEligiblePlayer(p.name, p.code, p.club)).slice(0, 2);
}

function clubInvolvementScore(match, clubPlayers) {
  if (!state.activeClub || !clubPlayers.length) return 0;
  const sides = new Set(clubPlayers.map((p) => p.countryCode || p.code).filter(Boolean));
  if (sides.has(match.homeCode) && sides.has(match.awayCode)) return 10;
  return clamp(3 + clubPlayers.length * 1.5, 0, 7);
}

function clubRelevance(score) {
  if (!score) return "None";
  if (score >= 9) return "High";
  if (score >= 5) return "Medium";
  return "Low";
}

function clubRelevanceWeight(label) {
  return { None: 0, Low: 4, Medium: 8, High: 12 }[label] || 0;
}

function naturalReason(s) {
  const curated = state.matchStorylines.get(`match:${s.match.match_number}`) || state.matchStorylines.get([s.match.homeCode, s.match.awayCode].sort().join("-"));
  if (curated?.summary) {
    const excluded = [...keyPlayersFor(s.match.homeCode), ...keyPlayersFor(s.match.awayCode)].some((p) => {
      const status = playerEligibility(p.name, p.countryCode, p.club);
      return !status.eligible && !status.pending && curated.summary.includes(p.name);
    });
    if (!excluded) {
      const clubText = s.clubBoost ? `${state.activeClub} involvement adds an extra fan angle.` : "Choose a favourite club to add a supporter lens.";
      return `${curated.summary} ${clubText} ${s.match.window}${s.match.ist.weekend ? " weekend" : ""} watch in India.`;
    }
  }
  const a = headlinePlayers(s.keyA).join(", ");
  const b = headlinePlayers(s.keyB).join(", ");
  const missingKeys = !a || !b;
  const aText = a || "curated key-player data is unavailable";
  const bText = b || "curated key-player data is unavailable";
  const leader = (s.components.country ?? 0) >= 28 ? "country quality and squad depth" : (s.components.stars ?? 0) >= 16 ? "star power" : (s.components.balance ?? 0) >= 11 ? "competitive balance" : s.components.stage >= 10 ? "stage stakes" : "balanced tournament context";
  const clubText = s.clubBoost ? `${state.activeClub} involvement adds an extra fan angle.` : "Choose a favourite club to add a club-supporter lens.";
  const watchText = s.match.ist.weekend ? `${s.match.window} weekend watch in India` : `${s.match.window} watch in India`;
  if (missingKeys) return `${s.c1.name} vs ${s.c2.name} scores on ${leader}. Curated key-player data is not loaded, so this card avoids naming headline players from the stats dataset. ${clubText} It is a ${watchText}.`;
  return `${s.c1.name}'s appeal comes from ${aText}, while ${s.c2.name}'s key names include ${bText}. This fixture scores on ${leader}. ${clubText} It is a ${watchText}.`;
}

function headlinePlayers(players) {
  const outfield = players.filter((p) => !/goalkeeper/i.test(`${p.role} ${p.roleGroup} ${p.subRole}`) || String(p.avoidGk).toLowerCase() === "false");
  return (outfield.length ? outfield : players).slice(0, 3).map((p) => p.eligibilityLabel ? `${p.name} (${p.eligibilityLabel})` : p.name);
}

function preferredClub() {
  return state.clubs.find((c) => /manchester united/i.test(c)) || state.clubs.find((c) => /real madrid/i.test(c)) || state.clubs[0] || "";
}

function wireUi() {
  document.querySelectorAll(".tab").forEach((btn) => btn.addEventListener("click", () => {
    document.querySelectorAll(".tab,.panel").forEach((el) => el.classList.remove("active"));
    btn.classList.add("active");
    $(btn.dataset.tab).classList.add("active");
    applyClubTheme(btn.dataset.tab === "club" ? (state.clubWatchClub || preferredClub()) : state.activeClub);
  }));
  $("hypeClubSelect").addEventListener("change", (e) => { state.activeClub = e.target.value; applyClubTheme(); renderMatches(); renderPlanner(); });
  $("clubWatchSelect").addEventListener("change", (e) => { state.clubWatchClub = e.target.value; applyClubTheme(state.clubWatchClub); renderClub(); });
  $("clubLensToggle").addEventListener("input", () => { state.prioritizeClubLens = $("clubLensToggle").checked; renderMatches(); });
  $("countrySelect").addEventListener("change", renderCountry);
  $("countryView").addEventListener("input", renderCountry);
  $("countryView").addEventListener("change", renderCountry);
  window.renderCountry = renderCountry;
  setInterval(() => {
    if (!$("countries")?.classList.contains("active")) return;
    const signature = `${$("countrySelect").value}|${$("countryView").value}|${$("countryPlayerSearch").value}`;
    if (signature !== state.countryUiSignature) renderCountry();
  }, 250);
  $("countryPlayerSearch").addEventListener("input", renderCountry);
  $("clubSearch").addEventListener("input", renderClub);
  ["playerSearch", "nationalityFilter", "clubFilter", "leagueFilter", "positionFilter", "ageFilter"].forEach((id) => $(id).addEventListener("input", () => { state.playerPage = 1; renderPlayers(); }));
  document.querySelectorAll(".pill").forEach((btn) => btn.addEventListener("click", () => { document.querySelectorAll(".pill").forEach((p) => p.classList.remove("active")); btn.classList.add("active"); state.playerList = btn.dataset.list; state.playerPage = 1; renderPlayers(); }));
  ["plannerTeam", "plannerDate", "plannerStage", "watchabilityFilter", "plannerSearch", "plannerSortSelect", "plannerClubLens"].forEach((id) => $(id).addEventListener("input", () => { state.plannerLimit = 24; renderPlanner(); }));
  $("plannerClubSelect").addEventListener("input", () => { $("plannerClubLens").disabled = !$("plannerClubSelect").value; $("plannerClubLens").checked = Boolean($("plannerClubSelect").value); applyClubTheme($("plannerClubSelect").value || state.activeClub || state.clubWatchClub); state.plannerLimit = 24; renderPlanner(); });
  $("clearPlannerFilters").addEventListener("click", () => { ["plannerTeam", "plannerDate", "plannerStage", "watchabilityFilter", "plannerSearch", "plannerClubSelect"].forEach((id) => $(id).value = ""); $("plannerClubLens").checked = false; $("plannerClubLens").disabled = true; state.plannerLimit = 24; renderPlanner(); });
  $("showAllPlanner").addEventListener("click", () => { ["plannerTeam", "plannerDate", "plannerStage", "watchabilityFilter", "plannerSearch", "plannerClubSelect"].forEach((id) => $(id).value = ""); $("plannerClubLens").checked = false; $("plannerClubLens").disabled = true; $("plannerSortSelect").value = "date"; state.plannerSort = { key: "date", dir: "asc" }; state.plannerLimit = state.matches.length; renderPlanner(); });
  $("clearCompare").addEventListener("click", () => { state.compare.clear(); renderPlayers(); renderClub(); renderRadar(); });
  $("resetMatches").addEventListener("click", () => { state.activeClub = ""; $("hypeClubSelect").value = ""; state.playerSort = { key: "overall", dir: "desc" }; applyClubTheme(); renderMatches(); renderPlanner(); });
  $("clearMatchFilters").addEventListener("click", () => { state.activeClub = ""; $("hypeClubSelect").value = ""; applyClubTheme(); renderMatches(); renderPlanner(); });
  $("resetCountry").addEventListener("click", () => { $("countrySelect").selectedIndex = 0; $("countryView").value = "overview"; $("countryPlayerSearch").value = ""; state.countrySort = { key: "overall", dir: "desc" }; renderCountry(); });
  $("clearCountryFilters").addEventListener("click", () => { $("countryPlayerSearch").value = ""; renderCountry(); });
  $("resetPlayers").addEventListener("click", () => { ["playerSearch", "nationalityFilter", "clubFilter", "leagueFilter", "positionFilter", "ageFilter"].forEach((id) => $(id).value = ""); state.playerSort = { key: "overall", dir: "desc" }; state.compare.clear(); renderPlayers(); });
  $("clearPlayerFilters").addEventListener("click", () => { ["playerSearch", "nationalityFilter", "clubFilter", "leagueFilter", "positionFilter", "ageFilter"].forEach((id) => $(id).value = ""); renderPlayers(); });
  $("resetClub").addEventListener("click", () => { state.clubWatchClub = preferredClub(); $("clubWatchSelect").value = state.clubWatchClub; $("clubSearch").value = ""; state.clubSort = { key: "overall", dir: "desc" }; applyClubTheme(state.clubWatchClub); renderClub(); });
  $("clearClubFilters").addEventListener("click", () => { $("clubSearch").value = ""; renderClub(); });
  $("resetPlanner").addEventListener("click", () => { ["plannerTeam", "plannerDate", "plannerStage", "watchabilityFilter", "plannerSearch", "plannerClubSelect"].forEach((id) => $(id).value = ""); $("plannerClubLens").checked = false; $("plannerClubLens").disabled = true; $("plannerSortSelect").value = "date"; state.plannerSort = { key: "date", dir: "asc" }; state.plannerLimit = 24; renderPlanner(); });
}

function fillSelects() {
  const realTeams = [...state.teams.values()].filter((t) => t.real).sort((a, b) => countryName(normalizeCountryCode(a.fifa_code, a.team_name)).localeCompare(countryName(normalizeCountryCode(b.fifa_code, b.team_name))));
  $("countrySelect").innerHTML = realTeams.map((t) => {
    const code = normalizeCountryCode(t.fifa_code, t.team_name);
    return `<option value="${code}">${esc(countryName(code))}</option>`;
  }).join("");
  $("plannerTeam").innerHTML += realTeams.map((t) => {
    const code = normalizeCountryCode(t.fifa_code, t.team_name);
    return `<option value="${code}">${esc(countryName(code))}</option>`;
  }).join("");
  $("plannerStage").innerHTML += state.rows.stages.map((s) => `<option value="${esc(s.stage_name)}">${esc(s.stage_name)}</option>`).join("");
  const clubNames = [...new Set([...state.clubs, ...[...state.keyPlayers.values()].flat().map((p) => p.club).filter(Boolean)])].sort((a, b) => a.localeCompare(b));
  const clubOpts = clubNames.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  $("hypeClubSelect").innerHTML = `<option value="">No favourite club lens</option>${clubOpts}`;
  $("clubWatchSelect").innerHTML = `<option value="">Choose a club</option>${clubOpts}`;
  $("plannerClubSelect").innerHTML = `<option value="">Choose a club</option>${clubOpts}`;
  state.clubWatchClub = preferredClub();
  $("hypeClubSelect").value = state.activeClub;
  $("clubWatchSelect").value = state.clubWatchClub;
  uniqueOptions("nationalityFilter", [...new Set(state.worldCupPlayerPool.map((p) => p.code))].map((c) => [c, countryName(c)]));
  uniqueOptions("clubFilter", [...new Set(state.worldCupPlayerPool.map((p) => p.club).filter(Boolean))].sort().map((c) => [c, c]));
  uniqueOptions("leagueFilter", [...new Set(state.worldCupPlayerPool.map((p) => p.league).filter(Boolean))].sort().map((c) => [c, c]));
  uniqueOptions("positionFilter", ["Goalkeeper", "Defender", "Midfielder", "Forward", "Outfield"].map((p) => [p, p]));
}

function uniqueOptions(id, vals) {
  $(id).innerHTML += vals.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("");
}

function renderAll() {
  applyClubTheme();
  $("matchCount").textContent = `${state.matches.length} fixtures`;
  $("teamCount").textContent = `${[...state.teams.values()].filter((t) => t.real).length} qualified teams`;
  $("playerCount").textContent = `${state.worldCupPlayerPool.length.toLocaleString()} qualified player-pool rows`;
  renderMatches();
  renderCountry();
  renderPlayers();
  renderClub();
  renderPlanner();
}

function renderMatches() {
  const ranked = state.matches.filter((m) => m.isFinalized).map((m) => ({ ...m, hype: scoreMatch(m) })).filter((m) => m.hype).sort((a, b) => {
    const base = b.hype.score - a.hype.score;
    if (!state.prioritizeClubLens) return base;
    return (b.hype.score + clubRelevanceWeight(clubRelevance(b.hype.clubBoost))) - (a.hype.score + clubRelevanceWeight(clubRelevance(a.hype.clubBoost)));
  }).slice(0, 10);
  renderFreshnessStats();
  renderHypeBars("hypeChart", ranked);
  $("topMatches").innerHTML = ranked.map(matchCard).join("") || `<div class="compact-item">No finalized matches available for watch ranking yet.</div>`;
}

function matchCard(m) {
  const c = m.hype.components;
  return `<article class="match-card" data-match="${m.id}">
    <div class="match-top"><div><span class="stage-chip">${esc(m.stage.stage_name)}</span><div class="teams">${esc(m.homeName)} vs ${esc(m.awayName)}</div></div><div class="hype-score"><strong>${fmt(m.hype.score)}</strong><span>Neutral Watch Score</span></div></div>
    ${scoreBar(m.hype.score, tooltipText(m))}
    <div class="meta"><span>${esc(m.ist.label)} IST</span><span>${esc(m.city.venue_name)}, ${esc(m.city.city_name)}</span><span class="time-chip">${m.window}${m.ist.weekend ? " + Weekend" : ""}</span></div>
    <div class="breakdown">
      ${componentPill("Country quality", c.country, 30)}
      ${componentPill("Recognisable player pull", c.stars, 25)}
      ${componentPill("Match closeness", c.balance, 20)}
      ${componentPill("Storyline value", c.story, 15)}
      ${componentPill("Stage importance", c.stage, 10)}
      <span class="component-pill club-pill"><b>Club Relevance</b>${clubRelevance(c.club)}</span>
      <span class="component-pill muted-pill">India watchability: ${esc(m.window)}${m.ist.weekend ? " + Weekend" : ""}</span>
    </div>
    <p class="reason">${esc(m.hype.reason)}</p>
  </article>`;
}

function renderFreshnessStats() {
  const finalized = state.matches.filter((m) => m.isFinalized).length;
  const placeholders = state.matches.length - finalized;
  $("freshnessStats").innerHTML = [
    ["Finalized fixtures", finalized],
    ["Placeholder fixtures", placeholders],
    ["Eligible for scoring", finalized],
    ["Excluded from scoring", placeholders]
  ].map(([k, v]) => `<div class="mini-card ${placeholders && k.includes("Placeholder") ? "warning-card" : ""}"><span>${k}</span><strong>${v}</strong></div>`).join("") +
  (placeholders ? `<div class="freshness-warning">The updated fixture guide contains expected knockout placeholders. Neutral Watch Scores are calculated only for fixtures with two finalized teams.</div>` : "") +
  (state.missingV3.length ? `<div class="freshness-warning">Some optional fan-guide layers are unavailable: ${esc(state.missingV3.join(", "))}. More curated names and story cards will appear when those layers are added.</div>` : "");
}

function renderHypeBars(id, matches) {
  $(id).innerHTML = matches.map((m) => `<div class="hype-row" title="${esc(tooltipText(m))}">
    <span class="bar-label">${esc(m.homeName)} vs ${esc(m.awayName)}</span>
    ${scoreBar(m.hype.score, tooltipText(m))}
    <strong>${fmt(m.hype.score)}</strong>
  </div>`).join("");
}

function scoreBar(score, title = "") {
  const [start, end] = scoreGradient(score);
  return `<span class="hype-track" title="${esc(title)}"><span class="hype-fill ${hypeClass(score)}" style="--score:${clamp(score)}%;--bar-start:${start};--bar-end:${end};"></span></span>`;
}

function hypeClass(score) {
  if (score < 40) return "low";
  if (score < 60) return "moderate";
  if (score < 80) return "high";
  return "must";
}

function scoreGradient(score) {
  if (score < 40) return ["#526273", "#8ba3bd"];
  if (score < 60) return ["#16b98d", "#78f0c6"];
  if (score < 80) {
    const hue = Math.round(52 - (score - 60) * 1.45);
    return [`hsl(${hue} 92% 56%)`, `hsl(${Math.max(18, hue - 12)} 95% 55%)`];
  }
  const hue = Math.round(344 - Math.min(18, score - 80));
  return [`hsl(${hue} 95% 60%)`, "#ffe06a"];
}

function componentPill(label, value, max) {
  return `<span class="component-pill"><b>${esc(label)}</b>${Number.isFinite(value) ? `${fmt(value)}/${max}` : "Not enough data"}</span>`;
}

function tooltipText(m) {
  const c = m.hype.components;
  return `Team quality ${fmt(c.country)}/30 | Player pull ${fmt(c.stars)}/25 | Closeness ${fmt(c.balance)}/20 | Story ${fmt(c.story)}/15 | Stage ${fmt(c.stage)}/10 | Club relevance ${clubRelevance(c.club)}`;
}

function renderCountry() {
  const code = $("countrySelect").value || [...state.countries.keys()][0];
  const c = state.countries.get(code);
  if (!c) return;
  const view = $("countryView").value;
  state.countryUiSignature = `${code}|${view}|${$("countryPlayerSearch").value}`;
  const pending = countrySquadOpen(code);
  const search = $("countryPlayerSearch");
  $("countryGuideBadge").textContent = pending ? "Fan guide" : "Squad-based fan guide";
  const xi = view === "xi" ? expectedPlayingXi(c) : null;
  const note = view === "xi" && xi?.officialNotAnnounced
    ? "Official squad not announced."
    : view === "xi" && xi?.unavailable
      ? "Expected Playing XI data unavailable for this team."
      : view === "xi" && xi?.incomplete
      ? "Expected Playing XI data incomplete."
      : "";
  $("countrySquadNote").textContent = note;
  $("countrySquadNote").classList.toggle("hidden", !note);
  search.classList.toggle("hidden", view !== "stats");
  $("clearCountryFilters").classList.toggle("hidden", view !== "stats");
  const rawCountryHtml = view === "overview"
    ? countryOverviewHtml(c)
    : view === "xi"
      ? expectedXiHtml(c)
      : countryViewHtml(c);
  const countryHtml = stripCountryPlayerStatusLabels(rawCountryHtml);
  $("shortlist").innerHTML = countryHtml;
  if (view === "stats") {
    const q = search.value.toLowerCase();
    renderSortableTable("countryPlayerTable", c.players.filter((p) => !q || `${p.name} ${p.club} ${p.pos}`.toLowerCase().includes(q)).slice(0, 80), state.countrySort, (sort) => state.countrySort = sort, false);
  } else {
    $("countryPlayerTable").innerHTML = "";
  }
  setTimeout(wireXiControls, 0);
}

function stripCountryPlayerStatusLabels(html) {
  return html
    .replace(/\s*[Â·|]\s*squad not confirmed/gi, "")
    .replace(/\s*[Â·|]\s*not in reported squad/gi, "");
}

function wireXiControls() {
  document.querySelectorAll(".xi-marker").forEach((btn) => btn.addEventListener("click", () => {
    const code = $("countrySelect").value || [...state.countries.keys()][0];
    const c = state.countries.get(code);
    state.selectedXiPlayer = (c ? expectedPlayingXi(c).players : []).find((p) => p.name === btn.dataset.xi) || null;
    renderCountry();
  }));
  const reset = $("resetXiSelection");
  if (reset) reset.addEventListener("click", () => { state.selectedXiPlayer = null; renderCountry(); });
  const list = $("xiListToggle");
  if (list) list.addEventListener("input", () => { state.xiShowList = list.checked; renderCountry(); });
  const roles = $("xiRolesToggle");
  if (roles) roles.addEventListener("input", () => { state.xiShowRoles = roles.checked; renderCountry(); });
  const clubs = $("xiClubsToggle");
  if (clubs) clubs.addEventListener("input", () => { state.xiShowClubs = clubs.checked; renderCountry(); });
}

function countryViewHtml(c) {
  const view = c.forceKey ? "key" : $("countryView").value;
  if (view === "overview") return countryOverviewHtml(c);
  if (view === "xi") return expectedXiHtml(c);
  if (view === "key") {
    const keys = keyPlayersForDisplay(c.code);
    const groups = ["Goalkeeper", "Defender", "Midfielder", "Forward"].map((g) => {
      const list = keys.filter((p) => (p.position || p.roleGroup || p.role || "").includes(g) || (g === "Forward" && /winger|striker|forward/i.test(`${p.roleGroup} ${p.subRole}`)));
      return `<div class="guide-card"><h3>${g}s</h3>${list.length ? list.map((p) => `<div class="short-item"><strong>${esc(p.name)}</strong><span>${esc(p.club || "Club not listed")} · ${esc(p.subRole || p.role || "Key player")} · Importance ${fmt(p.star / 10)}${p.eligibilityLabel ? ` · ${esc(p.eligibilityLabel)}` : ""}</span></div>`).join("") : `<p class="chart-note">No curated ${g.toLowerCase()}s listed yet.</p>`}</div>`;
    }).join("");
    const guideText = countrySquadPending(c.code) ? "Curated player guide. Squad status is noted above." : "Squad-based fan guide.";
    return `<div class="compact-item"><strong>Key Players</strong><span>${guideText}</span></div><div class="overview-grid">${groups}</div>`;
  }
  if (view === "hybrid") {
    const statsByName = new Map(c.players.map((p) => [p.name.toLowerCase(), p]));
    const keys = keyPlayersForDisplay(c.code);
    return `<div class="compact-item"><strong>Hybrid View</strong><span>Curated key players first, with club-form stats attached where names match.</span></div>` +
      (keys.length ? keys.slice(0, 12).map((kp) => {
        const stat = statsByName.get(kp.name.toLowerCase());
        return `<div class="short-item"><strong>${esc(kp.name)}</strong><span>${esc(kp.role || "Key player")} | ${esc(kp.club || "Club not listed")} ${kp.eligibilityLabel ? `| ${esc(kp.eligibilityLabel)}` : ""} ${stat ? `| Role Score ${fmt(stat.roleScore)} | Attack ${fmt(stat.attack)} | Creativity ${fmt(stat.creativity)}` : "| No matching stats row"}</span></div>`;
      }).join("") : `<div class="compact-item">Key-player guide is not available for this country yet.</div>`);
  }
  const leaders = ["Goalkeeper", "Defender", "Midfielder", "Forward"].map((pos) => {
    const names = c.players.filter((p) => p.broad === pos).sort((a, b) => b.roleScore - a.roleScore).slice(0, 5).map((p) => `${esc(p.name)} (${fmt(p.roleScore)})`).join(", ");
    return `<div class="short-item"><strong>${pos} Role Score Leaders</strong><span>${names || "No player rows in this role"}</span></div>`;
  }).join("");
  return `<div class="compact-item"><strong>Stats Lens</strong><span>Stats Lens uses available club-form data. It compares players only with similar roles and is not a squad prediction.</span></div>${leaders}`;
}

function countryOverviewHtml(c) {
  const story = state.countryStories.get(c.code);
  const profile = profileFor(c.code, c);
  const fixtures = state.matches.filter((m) => m.isFinalized && (m.homeCode === c.code || m.awayCode === c.code) && m.stage.stage_order === "1").slice(0, 3);
  return `<div class="overview-grid">
    <article class="guide-card hero-guide"><span class="eyebrow">${esc(c.name)}</span><h3>${esc(story?.style || "World Cup fan guide")}</h3><p>${esc(story?.style || "Qualified-team storyline and key-player watch.")}</p><div class="chip-row">${["Quality " + fmt(profile.quality), "Star power " + fmt(profile.starPower), "Depth " + fmt(profile.depth)].map((x) => `<span>${esc(x)}</span>`).join("")}</div></article>
    <article class="guide-card"><h3>Players To Watch</h3><div class="chip-row">${keyPlayersForDisplay(c.code).slice(0, 5).map((p) => `<span>${esc(p.name)}${p.eligibilityLabel ? ` · ${esc(p.eligibilityLabel)}` : ""}</span>`).join("") || "<span>Key player guide not available yet</span>"}</div></article>
    <article class="guide-card"><h3>Group Fixtures</h3>${fixtures.map((m) => `<p><strong>${esc(m.homeName)} vs ${esc(m.awayName)}</strong><br><span>${esc(m.ist.label)} IST · ${esc(m.city.city_name)}</span></p>`).join("")}</article>
  </div>`;
}

function expectedXiHtml(c) {
  const xiGuide = expectedPlayingXi(c);
  const xi = xiGuide.players;
  if (xiGuide.unavailable) return `<div class="compact-item">Expected Playing XI data unavailable.</div>`;
  if (!xi.length) return `<div class="compact-item">Expected Playing XI data unavailable.</div>`;
  const selected = xi.find((p) => p.name === state.selectedXiPlayer?.name) || null;
  return `<div class="xi-toolbar"><span class="stage-chip">${esc(xiGuide.formation)}</span><span>Expected Playing XI</span><button class="ghost-btn" id="resetXiSelection">Reset XI selection</button><label><input type="checkbox" id="xiListToggle" ${state.xiShowList ? "checked" : ""}> View as list</label><label><input type="checkbox" id="xiRolesToggle" ${state.xiShowRoles ? "checked" : ""}> Show roles</label><label><input type="checkbox" id="xiClubsToggle" ${state.xiShowClubs ? "checked" : ""}> Show club labels</label></div>
  ${state.xiShowList ? xiList(xi) : `<div class="pitch-layout"><div class="pitch">${pitchMarkers(xi, xiGuide.formation, selected)}</div><aside class="xi-side"><h3>${esc(c.name)} Expected Playing XI</h3><p><strong>Formation:</strong> ${esc(xiGuide.formation)}</p><p>${esc(state.countryStories.get(c.code)?.style || "Compact lineup guide.")}</p><div id="xiDetail">${selected ? xiDetail(selected, c) : "Click a player marker to see details."}</div></aside></div>`}`;
}

function expectedPlayingXi(c) {
  const curated = state.expectedXi.get(c.code) || [];
  const registryPlayers = registryPoolForXi(c.code);
  const registryConstrained = isRegistryConstrainedCountry(c.code, registryPlayers);
  const officialNotAnnounced = !registryConstrained && countrySquadOpen(c.code);
  if (registryConstrained) {
    const resolved = resolveRegistryConstrainedXi(c.code, curated, registryPlayers);
    return { ...resolved, officialNotAnnounced };
  }
  if (curated.length === 11) {
    const formation = normalizeFormation(curated[0]?.formation || "4-3-3");
    const players = xiSlots(curated, formation).map((slot) => toXiPlayer(slot, slot, c.code, formation));
    return { players, formation, source: "curated", unavailable: false, officialNotAnnounced };
  }
  const resolved = resolveOpenCountryXi(c.code);
  return { ...resolved, officialNotAnnounced };
}

function countrySquadOpen(code) {
  const status = state.squadStatus.get(code)?.status || "";
  return countrySquadPending(code) || /preliminary/i.test(status);
}

function isRegistryConstrainedCountry(code, rows = registryPoolForXi(code)) {
  const status = state.squadStatus.get(code)?.status || "";
  return /announced squad|announced list|preliminary squad/i.test(status) && rows.length >= 11;
}

function registryPoolForXi(code) {
  return (state.playerRegistry.get(code) || []).filter((p) => p.include).map((p) => {
    const stat = findCountryPlayerMatch(statsPlayersFor(code), p.name, code, { club: p.club, group: p.positionGroup });
    return {
      ...p,
      name: p.name,
      club: p.club || stat?.club || "",
      group: broadGroup(p.positionGroup),
      roleScore: stat?.roleScore ?? 0,
      stat
    };
  });
}

function resolveRegistryConstrainedXi(code, curated, registryPlayers) {
  if (curated.length === 11) {
    const formation = normalizeFormation(curated[0]?.formation || "4-3-3");
    const slots = xiSlots(curated, formation);
    const matched = resolveCuratedTemplateXi(code, slots, formation, registryPlayers);
    if (matched) return { ...matched, source: "registry_curated_hybrid", unavailable: false };
  }
  const synthetic = resolveFormationFromPool(code, registryPlayers, {
    formations: ["4-3-3", "4-2-3-1", "4-4-2"],
    fallbackPool: []
  });
  if (!synthetic) return { players: [], formation: "4-3-3", source: "unavailable", unavailable: true, reason: "registry-insufficient" };
  return { ...synthetic, source: "registry_synth", unavailable: false };
}

function resolveOpenCountryXi(code) {
  const statsPool = statsPoolForXi(code);
  const keyPool = keyPlayerPoolForXi(code);
  const synthetic = resolveFormationFromPool(code, statsPool, {
    formations: ["4-3-3", "4-2-3-1", "4-4-2"],
    fallbackPool: keyPool
  });
  if (!synthetic) return { players: [], formation: "4-3-3", source: "unavailable", unavailable: true, reason: "no-valid-xi" };
  return { ...synthetic, source: synthetic.usedFallback ? "stats_key_synth" : "stats_synth", unavailable: false };
}

function resolveCuratedTemplateXi(code, slots, formation, registryPlayers) {
  const used = new Set();
  const assigned = Array(slots.length).fill(null);
  slots.forEach((slot, i) => {
    const match = findCountryPlayerMatch(registryPlayers, slot.name, code, {
      club: slot.club,
      group: slot.group || positionGroupFromSlot(slot.slot)
    }, used);
    if (match) {
      used.add(normalizePlayerName(match.name));
      assigned[i] = toXiPlayer(match, slot, code, formation);
    }
  });
  const filled = fillXiSlotsFromPool(code, slots, registryPlayers, used, assigned, formation);
  if (!filled || !xiIsValid(filled, slots, code)) return null;
  return { players: filled, formation };
}

function resolveFormationFromPool(code, primaryPool, opts = {}) {
  const formations = opts.formations || ["4-3-3", "4-2-3-1", "4-4-2"];
  const fallbackPool = opts.fallbackPool || [];
  const attempts = [
    { formationSet: formations, fallback: [], usedFallback: false },
    { formationSet: formations, fallback: fallbackPool, usedFallback: fallbackPool.length > 0 }
  ];
  for (const attempt of attempts) {
    const best = bestXiFormation(code, primaryPool, attempt.fallback, attempt.formationSet);
    if (best) return { ...best, usedFallback: attempt.usedFallback };
  }
  return null;
}

function bestXiFormation(code, primaryPool, fallbackPool, formations) {
  const candidates = formations.map((formation) => {
    const slots = defaultSlotsForFormation(formation);
    const built = buildXiFromPools(code, slots, formation, primaryPool, fallbackPool);
    if (!built) return null;
    return {
      formation,
      players: built.players,
      score: built.score
    };
  }).filter(Boolean).sort((a, b) => b.score - a.score || formationPriority(a.formation) - formationPriority(b.formation));
  return candidates[0] || null;
}

function buildXiFromPools(code, slots, formation, primaryPool, fallbackPool = []) {
  const used = new Set();
  const assigned = Array(slots.length).fill(null);
  const withPrimary = fillXiSlotsFromPool(code, slots, primaryPool, used, assigned, formation);
  if (!withPrimary && !fallbackPool.length) return null;
  const finalPlayers = withPrimary && withPrimary.length === slots.length ? withPrimary : fillXiSlotsFromPool(code, slots, fallbackPool, used, assigned, formation);
  if (!finalPlayers || !xiIsValid(finalPlayers, slots, code)) return null;
  const score = finalPlayers.reduce((sum, p) => sum + (Number.isFinite(p.selectionScore) ? p.selectionScore : 0), 0);
  return { players: finalPlayers, score };
}

function fillXiSlotsFromPool(code, slots, pool, used, assigned, formation) {
  if (!pool.length) return assigned.every(Boolean) ? assigned : null;
  const unresolved = slots.map((slot, index) => ({ slot, index })).filter(({ index }) => !assigned[index]).sort((a, b) => {
    const aCount = availableXiCandidates(pool, a.slot, code, used).length;
    const bCount = availableXiCandidates(pool, b.slot, code, used).length;
    return aCount - bCount || slotSpecificity(a.slot) - slotSpecificity(b.slot);
  });
  unresolved.forEach(({ slot, index }) => {
    const choice = availableXiCandidates(pool, slot, code, used)[0];
    if (!choice) return;
    used.add(normalizePlayerName(choice.name));
    const player = toXiPlayer(choice, slot, code, formation);
    player.selectionScore = xiCandidateScore(choice, slot);
    assigned[index] = player;
  });
  return assigned.every(Boolean) ? assigned : null;
}

function availableXiCandidates(pool, slot, code, used) {
  return pool.filter((p) => !used.has(normalizePlayerName(p.name)) && roleCompatible(p, slot, code)).sort((a, b) => xiCandidateScore(b, slot) - xiCandidateScore(a, slot));
}

function xiCandidateScore(candidate, slot) {
  return (Number(candidate.roleScore) || Number(candidate.star) || 0) * 100 + slotFitScore(candidate, slot);
}

function slotFitScore(candidate, slot) {
  const slotCode = String(slot.slot || "").toUpperCase();
  const text = `${candidate.pos || ""} ${candidate.role || ""} ${candidate.subRole || ""}`.toLowerCase();
  if (!slotCode) return 0;
  if (slotCode === "GK") return /goalkeeper|\bgk\b/.test(text) ? 12 : 0;
  if (slotCode === "LB" || slotCode === "LWB" || slotCode === "LW" || slotCode === "LM") return /\bleft\b|\blb\b|\blw\b|left-back|left wing|left winger/.test(text) ? 10 : 0;
  if (slotCode === "RB" || slotCode === "RWB" || slotCode === "RW" || slotCode === "RM") return /\bright\b|\brb\b|\brw\b|right-back|right wing|right winger/.test(text) ? 10 : 0;
  if (slotCode === "CB") return /centre-back|center-back|\bcb\b/.test(text) ? 10 : 0;
  if (slotCode === "DM") return /defensive midfield|\bdm\b|holding midfield|anchor/.test(text) ? 10 : 0;
  if (slotCode === "AM") return /attacking midfield|\bam\b|creator|playmaker/.test(text) ? 10 : 0;
  if (slotCode === "CM") return /central midfield|\bcm\b|box-to-box|midfield/.test(text) ? 8 : 0;
  if (slotCode === "ST" || slotCode === "CF") return /striker|\bst\b|centre-forward|center-forward|forward/.test(text) ? 10 : 0;
  return 0;
}

function slotSpecificity(slot) {
  const slotCode = String(slot.slot || "").toUpperCase();
  if (/^(GK|LB|RB|LW|RW|DM|AM|LWB|RWB)$/.test(slotCode)) return 0;
  if (/^(CB|CM|ST|CF)$/.test(slotCode)) return 1;
  return 2;
}

function formationPriority(formation) {
  return { "4-3-3": 0, "4-2-3-1": 1, "4-4-2": 2 }[normalizeFormation(formation)] ?? 9;
}

function statsPoolForXi(code) {
  return dedupeXiPool(statsPlayersFor(code)
    .filter((p) => p.code === code || p.country === countryName(code))
    .map((p) => ({ ...p, group: broadGroup(p.broad || p.pos), roleScore: p.roleScore || 0 })));
}

function keyPlayerPoolForXi(code) {
  return dedupeXiPool(keyPlayersFor(code).map((p) => ({
    ...p,
    name: p.name,
    club: p.club || p.club_reference || "",
    group: broadGroup(p.roleGroup || p.position || p.role || p.subRole) || "Midfielder",
    roleScore: num(p.star) || 0,
    pos: p.subRole || p.roleGroup || p.role || p.position || "",
    role: p.expectedRole || p.role || p.subRole || p.roleGroup || "",
    star: num(p.star) || 0
  })));
}

function dedupeXiPool(rows) {
  const byKey = new Map();
  rows.forEach((row) => {
    const key = compactPlayerName(row.name || row.Player || row.player_name || "");
    if (!key) return;
    const current = byKey.get(key);
    if (!current || (Number(row.roleScore) || Number(row.star) || 0) > (Number(current.roleScore) || Number(current.star) || 0)) {
      byKey.set(key, row);
    }
  });
  return [...byKey.values()];
}

function compactPlayerName(name = "") {
  return normalizePlayerName(name).replace(/\s+/g, "");
}

function findCountryPlayerMatch(rows, targetName, code, prefs = {}, used = new Set()) {
  const targetNorm = normalizePlayerName(targetName);
  const targetCompact = compactPlayerName(targetName);
  const targetTokens = targetNorm.split(" ").filter(Boolean);
  const scored = rows.filter((row) => !used.has(normalizePlayerName(row.name || row.Player || row.player_name || ""))).map((row) => {
    const name = row.name || row.Player || row.player_name || "";
    const score = countryMatchScore(targetNorm, targetCompact, targetTokens, name);
    const clubBoost = prefs.club && normalizeClubName(row.club || row.Squad || "") === normalizeClubName(prefs.club) ? 5 : 0;
    const groupBoost = prefs.group && broadGroup(row.positionGroup || row.group || row.broad || row.roleGroup || row.role || row.pos) === broadGroup(prefs.group) ? 3 : 0;
    return { row, score: score + clubBoost + groupBoost };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || (Number(b.row.roleScore) || 0) - (Number(a.row.roleScore) || 0));
  if (!scored.length) return null;
  if (scored.length > 1 && scored[0].score < 250 && scored[0].score === scored[1].score) return null;
  return scored[0].row;
}

function countryMatchScore(targetNorm, targetCompact, targetTokens, candidateName) {
  const candNorm = normalizePlayerName(candidateName);
  const candCompact = compactPlayerName(candidateName);
  const candTokens = candNorm.split(" ").filter(Boolean);
  if (!candNorm) return 0;
  if (targetNorm === candNorm) return 300;
  if (targetCompact && targetCompact === candCompact) return 275;
  const targetLast = targetTokens[targetTokens.length - 1] || "";
  const candLast = candTokens[candTokens.length - 1] || "";
  const targetFirst = targetTokens[0] || "";
  const candFirst = candTokens[0] || "";
  if (targetLast && targetLast === candLast) {
    if (targetFirst === candFirst) return 220;
    if (targetFirst.startsWith(candFirst) || candFirst.startsWith(targetFirst)) return 205;
    if (targetNorm.includes(candNorm) || candNorm.includes(targetNorm)) return 190;
  }
  if (targetNorm.includes(candNorm) || candNorm.includes(targetNorm)) return 150;
  const overlap = targetTokens.filter((token) => candTokens.includes(token)).length;
  const minTokens = Math.min(targetTokens.length, candTokens.length);
  if (overlap >= Math.max(2, minTokens - 1)) return 120 + overlap * 5;
  return 0;
}

function xiSlots(curated, formation) {
  const base = curated.map((p) => ({ ...p, group: p.group || positionGroupFromSlot(p.slot), formation }));
  const defaults = defaultSlotsForFormation(formation);
  for (let i = base.length; i < 11; i++) base.push(defaults[i] || defaults[defaults.length - 1]);
  return base.slice(0, 11);
}

function defaultSlotsForFormation(formation) {
  const lines = normalizeFormation(formation || "4-3-3").split("-").map(Number).filter(Boolean);
  const slots = [{ slot: "GK", group: "Goalkeeper", role: "Goalkeeper", formation }];
  lines.forEach((count, i) => {
    const group = i === 0 ? "Defender" : i === lines.length - 1 ? "Forward" : "Midfielder";
    const row = lineSlots(group, count);
    for (let n = 0; n < count; n++) slots.push({ slot: row[n], group, role: group, formation });
  });
  return slots.slice(0, 11);
}

function lineSlots(group, count) {
  const sets = {
    Defender: { 2: ["CB", "CB"], 3: ["LB", "CB", "RB"], 4: ["LB", "CB", "CB", "RB"], 5: ["LB", "CB", "CB", "CB", "RB"] },
    Midfielder: { 1: ["CM"], 2: ["DM", "CM"], 3: ["DM", "CM", "AM"], 4: ["DM", "CM", "CM", "AM"], 5: ["DM", "CM", "CM", "AM", "AM"] },
    Forward: { 1: ["ST"], 2: ["ST", "ST"], 3: ["LW", "ST", "RW"] }
  };
  const fallback = group === "Defender" ? "CB" : group === "Midfielder" ? "CM" : "ST";
  return sets[group]?.[count] || Array.from({ length: count }, () => fallback);
}

function bestRegistryFit(code, slot, used) {
  return bestByGroup((state.playerRegistry.get(code) || []).filter((p) => p.include && !used.has(p.nameKey)), slot, code);
}

function bestStatsFit(code, slot, used) {
  return bestByGroup(statsPlayersFor(code).filter((p) => !used.has(normalizePlayerName(p.name))).sort((a, b) => (b.roleScore || 0) - (a.roleScore || 0)), slot, code);
}

function bestKeyPlayerFit(code, slot, used) {
  return bestByGroup(keyPlayersFor(code).filter((p) => !used.has(normalizePlayerName(p.name))).sort((a, b) => (b.star || 0) - (a.star || 0)), slot, code);
}

function rebuildStrictXi(code, slots, formation, officialNotAnnounced) {
  const used = new Set();
  const pools = strictXiPools(code, officialNotAnnounced);
  return slots.map((slot) => {
    const target = broadGroup(slot.group || slot.slot);
    const candidate = pools.find((p) => !used.has(normalizePlayerName(p.name)) && inferredPlayerGroup(p, code) === target);
    if (!candidate) return null;
    used.add(normalizePlayerName(candidate.name));
    return toXiPlayer(candidate, slot, code, formation);
  }).filter(Boolean);
}

function strictXiPools(code, officialNotAnnounced) {
  const curated = keyPlayersFor(code).sort((a, b) => (b.star || 0) - (a.star || 0));
  const stats = statsPlayersFor(code).sort((a, b) => (b.roleScore || 0) - (a.roleScore || 0));
  const registry = (state.playerRegistry.get(code) || []).filter((p) => p.include);
  return officialNotAnnounced ? [...stats, ...curated] : [...registry, ...stats, ...curated];
}

function statsPlayersFor(code) {
  const name = countryName(code);
  const byKey = new Map();
  [...state.worldCupPlayerPool, ...state.playersAll, ...rawStatsPlayersFor(code)].forEach((p) => {
    if (p.code === code || p.country === name) byKey.set(normalizePlayerName(p.name), p);
  });
  return [...byKey.values()];
}

function rawStatsPlayersFor(code) {
  return (state.rows.players || []).filter((r) => playerCountryCode(r) === code).map((r) => {
    const info = positionInfo(r.Pos || r.Pos_stats_misc || r.Pos_stats_keeper || "");
    return {
      name: r.Player,
      code,
      country: countryName(code),
      club: r.Squad || "",
      Squad: r.Squad || "",
      broad: info.broad,
      pos: info.label,
      roleScore: firstAvailable(r, ["Min", "Min_stats_playing_time", "Min_stats_keeper"]) || 0
    };
  }).filter((p) => p.name);
}

function bestByGroup(rows, slot, code) {
  const target = broadGroup(slot.group || slot.slot);
  return rows.find((p) => inferredPlayerGroup(p, code) === target) || null;
}

function roleCompatible(player, slot, code) {
  return inferredPlayerGroup(player, code) === broadGroup(slot.group || slot.slot);
}

function xiIsValid(players, slots, code) {
  if (players.length !== 11) return false;
  const names = players.map((p) => normalizePlayerName(p.name));
  if (new Set(names).size !== 11) return false;
  if (players.filter((p) => inferredPlayerGroup(p, code) === "Goalkeeper").length !== 1) return false;
  return players.every((p, i) => roleCompatible(p, slots[i], code));
}

function inferredPlayerGroup(p, code) {
  const direct = broadGroup(p.positionGroup || p.group || p.broad || p.roleGroup || p.role || p.pos);
  if (direct) return direct;
  const key = normalizePlayerName(p.name);
  const stat = state.worldCupPlayerPool.find((x) => x.code === code && normalizePlayerName(x.name) === key);
  const curated = keyPlayersFor(code).find((x) => normalizePlayerName(x.name) === key);
  return broadGroup(stat?.broad || stat?.pos || curated?.roleGroup || curated?.role);
}

function broadGroup(value = "") {
  const text = String(value).toLowerCase().trim();
  if (!text) return "";
  if (/\bgk\b|goalkeeper/.test(text)) return "Goalkeeper";
  if (/midfielder|\bmf\b|\bdm\b|\bcm\b|\bam\b/.test(text)) return "Midfielder";
  if (/defender|defence|defense|\bdf\b|\bcb\b|\blb\b|\brb\b|full-back|centre-back|center-back/.test(text)) return "Defender";
  if (/forward|\bfw\b|\blw\b|\brw\b|\bst\b|winger|striker/.test(text)) return "Forward";
  return "";
}

function toXiPlayer(source, slot, code, formation) {
  const name = source.name || source.Player || source.player_name;
  const group = broadGroup(slot.group || slot.slot);
  return {
    name,
    club: clubForXiPlayer({ ...slot, name, club: source.club || source.Squad || slot.club }, code),
    slot: slot.slot || source.slot || group,
    group,
    role: slot.role || source.role || source.pos || group,
    formation,
    confidence: slot.confidence || "",
    notes: slot.notes || source.notes || "Expected Playing XI role.",
    selectionScore: source.selectionScore ?? source.roleScore ?? source.star ?? 0
  };
}

function clubForXiPlayer(p, code) {
  const registry = findCountryPlayerMatch(state.playerRegistry.get(code) || [], p.name, code, { club: p.club, group: p.group });
  const stat = findCountryPlayerMatch(statsPlayersFor(code), p.name, code, { club: p.club, group: p.group });
  const key = findCountryPlayerMatch(keyPlayersFor(code), p.name, code, { club: p.club, group: p.group });
  return p.club || registry?.club || stat?.club || key?.club || "";
}

function displayClubName(club = "") {
  return String(club)
    .replace(/^Manchester United$/i, "Man United")
    .replace(/^Manchester City$/i, "Man City")
    .replace(/^Paris Saint-Germain$/i, "PSG")
    .replace(/^Bayern Munich$/i, "Bayern")
    .replace(/^Newcastle United$/i, "Newcastle")
    .replace(/^Tottenham Hotspur$/i, "Tottenham")
    .replace(/^Nottingham Forest$/i, "Nott'm Forest")
    .replace(/^Inter Milan$/i, "Inter")
    .replace(/^Internazionale$/i, "Inter");
}

function positionGroupFromSlot(slot = "") {
  const s = String(slot).toUpperCase();
  if (s === "GK") return "Goalkeeper";
  if (/B$|CB|^D/.test(s)) return "Defender";
  if (/M$|DM|CM|AM/.test(s)) return "Midfielder";
  return "Forward";
}

function xiList(xi) {
  return `<div class="compact-list">${xi.map((p) => `<div class="compact-item"><strong>${esc(p.name)}</strong><span>${esc(p.slot)} | ${esc(p.role)}${state.xiShowClubs && p.club ? ` | ${esc(displayClubName(p.club))}` : ""}</span></div>`).join("")}</div>`;
  return `<div class="compact-list">${xi.map((p) => `<div class="compact-item"><strong>${esc(p.name)}</strong><span>${esc(p.slot)} · ${esc(p.role)} · ${esc(p.confidence)} confidence</span></div>`).join("")}</div>`;
}

function pitchMarkers(xi, formation, selected) {
  const positions = formationPositions(xi, formation);
  return xi.map((p, i) => xiMarker(p, positions[i], selected)).join("");
}

function xiMarker(p, pos, selected) {
  const active = selected?.name === p.name ? " selected" : "";
  const club = state.xiShowClubs && p.club ? `<small class="xi-club">${esc(displayClubName(p.club))}</small>` : "";
  return `<button class="xi-marker ${roleClass(p.group)}${active}" data-xi="${esc(p.name)}" style="left:${pos.x}%;top:${pos.y}%;" title="${esc(p.name)} | ${esc(p.role)}${p.club ? ` | ${esc(p.club)}` : ""}"><strong>${esc(p.name)}</strong>${state.xiShowRoles ? `<small>${esc(p.slot)}</small>` : ""}${club}</button>`;
  return `<button class="xi-marker ${roleClass(p.group)}${active}" data-xi="${esc(p.name)}" style="left:${pos.x}%;top:${pos.y}%;" title="${esc(p.name)} | ${esc(p.role)}"><strong>${esc(p.name)}</strong>${state.xiShowRoles ? `<small>${esc(p.slot)}</small>` : ""}</button>`;
  const label = playerEligibility(p.name, p.countryCode || $("countrySelect").value, "").label;
  return `<button class="xi-marker ${roleClass(p.group)}${active}" data-xi="${esc(p.name)}" style="left:${pos.x}%;top:${pos.y}%;" title="${esc(p.name)} · ${esc(p.role)}${label ? ` · ${esc(label)}` : ""}"><strong>${esc(p.name)}</strong>${state.xiShowRoles ? `<small>${esc(p.slot)}${label ? ` · ${esc(label)}` : ""}</small>` : ""}</button>`;
}

function formationPositions(xi, formation) {
  const lines = normalizeFormation(formation).split("-").map(Number).filter(Boolean);
  const out = Array(xi.length);
  const gk = xi.findIndex((p) => slotGroup(p) === "gk");
  if (gk >= 0) out[gk] = { x: 50, y: 90 };
  const outfield = xi.map((p, i) => ({ p, i })).filter(({ i }) => i !== gk);
  const grouped = [
    outfield.filter(({ p }) => slotGroup(p) === "def"),
    outfield.filter(({ p }) => slotGroup(p) === "mid"),
    outfield.filter(({ p }) => slotGroup(p) === "att")
  ];
  const counts = lines.length >= 2 ? lines : grouped.map((g) => g.length).filter(Boolean);
  const yLines = counts.length === 4 ? [72, 58, 42, 22] : counts.length === 2 ? [68, 28] : [72, 52, 24];
  let cursor = 0;
  counts.forEach((count, lineIndex) => {
    const linePlayers = outfield.slice(cursor, cursor + count).sort((a, b) => slotOrder(a.p.slot) - slotOrder(b.p.slot));
    cursor += count;
    const xs = spreadX(linePlayers.length);
    linePlayers.forEach(({ i }, n) => out[i] = { x: xs[n], y: yLines[lineIndex] ?? 50 });
  });
  outfield.slice(cursor).forEach(({ i }, n) => out[i] = { x: spreadX(outfield.length - cursor)[n], y: 36 });
  return out.map((p, i) => p || { x: 20 + (i % 4) * 20, y: 70 - Math.floor(i / 4) * 18 });
}

function slotGroup(p) {
  const slot = String(p.slot).toUpperCase();
  if (slot === "GK") return "gk";
  if (/B$|CB|^D/.test(slot) || /def/i.test(p.group)) return "def";
  if (/M$|DM|CM|AM/.test(slot) || /mid/i.test(p.group)) return "mid";
  return "att";
}

function slotOrder(slot = "") {
  const order = { LW: 1, LM: 1, LB: 1, LWB: 1, LCM: 2, LCB: 2, CM: 3, CB: 3, DM: 3, AM: 3, ST: 4, CF: 4, RCM: 5, RCB: 5, RW: 6, RM: 6, RB: 6, RWB: 6 };
  return order[String(slot).toUpperCase()] ?? 4;
}

function spreadX(count) {
  if (count <= 1) return [50];
  if (count === 2) return [35, 65];
  if (count === 3) return [25, 50, 75];
  if (count === 4) return [18, 39, 61, 82];
  return Array.from({ length: count }, (_, i) => 14 + i * (72 / Math.max(1, count - 1)));
}

function roleClass(group) {
  if (/goal/i.test(group)) return "gk";
  if (/def/i.test(group)) return "df";
  if (/mid/i.test(group)) return "mf";
  return "fw";
}

function shortName(name) {
  const parts = String(name).split(" ");
  return parts.length > 1 ? `${parts[0][0]}. ${parts.slice(-1)[0]}` : name;
}

function xiDetail(p, c) {
  const stat = state.worldCupPlayerPool.find((x) => x.name.toLowerCase() === p.name.toLowerCase() && x.code === c.code);
  const clubLine = p.club || stat?.club ? `<br>Club: ${esc(p.club || stat.club)}` : "";
  if (/goal/i.test(`${p.group} ${p.role} ${p.slot}`)) {
    return `<div class="compact-item"><strong>${esc(p.name)}</strong><span>Role: ${esc(p.role || p.slot)}${clubLine}<br>${esc(p.notes || "Goalkeeper role in the Expected Playing XI.")}</span></div>`;
  }
  return `<div class="compact-item"><strong>${esc(p.name)}</strong><span>Role: ${esc(p.role || p.slot)}${clubLine}<br>${esc(p.notes || "Key role in the Expected Playing XI.")}</span></div>`;
  const status = playerEligibility(p.name, c.code, stat?.club || "");
  const statusText = status.label ? `<br>Status: ${esc(status.label)}` : "";
  const club = stat?.club ? `<br>Club: ${esc(stat.club)}` : "";
  if (/goal/i.test(`${p.group} ${p.role} ${p.slot}`)) {
    return `<div class="compact-item"><strong>${esc(p.name)}</strong><span>${esc(p.role)} · ${esc(p.confidence)} confidence${club}${statusText}<br>${esc(p.notes || "Goalkeeper role in the fan-curated XI.")}</span></div>`;
  }
  return `<div class="compact-item"><strong>${esc(p.name)}</strong><span>${esc(p.role)} · ${esc(p.confidence)} confidence${club}${statusText}<br>${esc(p.notes || "Why they matter: key role in the fan-curated XI.")}${stat ? `<br>Club-form support: Role Score ${fmt(stat.roleScore)}, Attack ${fmt(stat.attack)}, Creativity ${fmt(stat.creativity)}` : ""}</span></div>`;
}

function strongestXI(c) {
  const picks = [
    ...c.players.filter((p) => p.broad === "Goalkeeper").sort((a, b) => b.overall - a.overall).slice(0, 1),
    ...c.players.filter((p) => p.broad === "Defender").sort((a, b) => b.overall - a.overall).slice(0, 4),
    ...c.players.filter((p) => p.broad === "Midfielder").sort((a, b) => b.overall - a.overall).slice(0, 3),
    ...c.players.filter((p) => p.broad === "Forward").sort((a, b) => b.overall - a.overall).slice(0, 3)
  ].filter(([key]) => id !== "playerTable" || key !== "age");
  return `<div class="xi-card"><strong>Strongest XI-style visual</strong><span>Based on club-form data, not official squads.</span><div>${picks.map((p) => `<button class="player-token" data-player="${p.id}">${esc(p.name)}<small>${p.broad}</small></button>`).join("")}</div></div>`;
}

function filteredPlayers() {
  const q = $("playerSearch").value.toLowerCase();
  return state.worldCupPlayerPool.filter((p) => (!q || p.name.toLowerCase().includes(q)) && (!$("nationalityFilter").value || p.code === $("nationalityFilter").value) && (!$("clubFilter").value || p.club === $("clubFilter").value) && (!$("leagueFilter").value || p.league === $("leagueFilter").value) && (!$("positionFilter").value || p.broad === $("positionFilter").value) && (!$("ageFilter").value || ($("ageFilter").value === "u23" ? p.age < 23 : $("ageFilter").value === "prime" ? p.age >= 23 && p.age < 30 : p.age >= 30)));
}

const STAT_HELP = {
  min: "Club minutes in the uploaded club-form data. Bigger samples usually make comparisons more reliable.",
  goals: "Goals recorded in the available club-form row.",
  assists: "Assists recorded in the available club-form row.",
  attack: "Role-aware attacking signal from goals, expected threat, shots and related available output.",
  creativity: "Chance creation and ball-progression signal from assists, expected assisted goals, key passes and similar data where available.",
  defense: "Defensive contribution signal from tackles, interceptions, blocks, clearances and similar actions where available.",
  goalkeeping: "Goalkeeper-specific signal from save rate, saves, clean sheets, goals-against control and distribution where available.",
  roleScore: "A role-relative club-form index. A high score means this player grades strongly against similar-role players in the available data, with minutes reliability considered."
};

function playerStatusClass(label = "") {
  if (/squad not confirmed/i.test(label)) return "pending";
  if (/not in reported squad/i.test(label)) return "unavailable";
  return "eligible";
}

function playerStatusDot(label = "") {
  return label ? `<span class="status-dot ${playerStatusClass(label)}" title="${esc(label)}"></span>` : "";
}

function playerModeCopy() {
  if (state.playerList === "key") {
    return statusLegend();
  }
  return `<span>Stats Lens and comparison use available club-form rows, mainly top-five-league coverage. Stars outside that coverage may not appear here.</span>`;
}

function statusLegend() {
  return `<span class="status-legend"><span class="status-dot pending"></span> Squad status not confirmed <span class="status-dot unavailable"></span> Not in reported squad</span>`;
}

function playerListRows() {
  if (state.playerList === "key") {
    return [...state.keyPlayers.values()].flat().filter((kp) => {
      const status = playerEligibility(kp.name, kp.countryCode, kp.club);
      kp.eligibilityLabel = status.label;
      return status.eligible || status.pending;
    }).map((kp, i) => {
      const exact = state.worldCupPlayerPool.filter((p) => p.name === kp.name);
      const normalized = exact.length ? exact : state.worldCupPlayerPool.filter((p) => normalizePlayerName(p.name) === normalizePlayerName(kp.name));
      const stat = normalized.sort((a, b) => (b.code === kp.countryCode) - (a.code === kp.countryCode) || (normalizePlayerName(b.club) === normalizePlayerName(kp.club)) - (normalizePlayerName(a.club) === normalizePlayerName(kp.club)))[0];
      return stat ? { ...stat, name: kp.name, eligibilityLabel: kp.eligibilityLabel, roleScore: stat.roleScore, overall: kp.star, attack: stat.attack, creativity: stat.creativity, defense: stat.defense, goalkeeping: stat.goalkeeping } : {
        id: `k${i}`, name: kp.name, country: countryName(kp.countryCode), code: kp.countryCode, club: kp.club || "", pos: kp.roleGroup || kp.role || "Key player", broad: /goal/i.test(kp.roleGroup) ? "Goalkeeper" : /def/i.test(kp.roleGroup) ? "Defender" : /mid/i.test(kp.roleGroup) ? "Midfielder" : "Forward", age: null, min: null, goals: null, assists: null, attack: null, creativity: null, defense: null, goalkeeping: null, roleScore: null, overall: kp.star, eligibilityLabel: kp.eligibilityLabel
      };
    });
  }
  if (state.playerList === "comparison") return filteredPlayers();
  const sorters = {
    attackers: (p) => p.broad === "Forward" || p.pos.includes("attacking") ? p.attack : -1,
    creators: (p) => p.creativity,
    u23: (p) => p.age < 23 ? p.roleScore : -1,
    defenders: (p) => p.broad === "Defender" ? p.defense : -1,
    keepers: (p) => p.broad === "Goalkeeper" ? p.goalkeeping : -1,
    underrated: (p) => p.min < 1200 && p.min >= 300 ? p.roleScore + avg([p.attack, p.creativity, p.defense]) / 3 : -1
  };
  return filteredPlayers().map((p) => ({ ...p, listScore: sorters[state.playerList]?.(p) ?? p.roleScore })).filter((p) => p.listScore >= 0);
}

function renderPlayers() {
  const allowCompare = state.playerList === "comparison";
  const rows = playerListRows();
  $("playerFilters").classList.toggle("hidden", state.playerList === "key");
  $("comparisonCard").classList.toggle("hidden", !allowCompare);
  $("playerModeNote").innerHTML = playerModeCopy();
  const q = $("playerSearch").value.trim();
  const missingSearch = state.playerList !== "key" && q && !rows.length;
  $("playerSearchNote").classList.toggle("hidden", !missingSearch);
  $("playerSearchNote").textContent = missingSearch ? `No club-form row found for "${q}". The player may be outside the covered leagues or absent from the uploaded club-form data.` : "";
  renderSortableTable("playerTable", rows, state.playerSort, (sort) => state.playerSort = sort, allowCompare);
  renderRadar();
}

function renderSortableTable(id, rows, sortState, setSort, allowCompare = false) {
  const columns = [
    ["name", "Player"], ["country", "Country"], ["club", "Club"], ["pos", "Role"], ["age", "Age"], ["min", "Minutes"], ["goals", "Goals"], ["assists", "Assists"], ["attack", "Attack"], ["creativity", "Creativity"], ["defense", "Defense"], ["goalkeeping", "Goalkeeping"], ["roleScore", "Role Score"]
  ].filter(([key]) => id !== "playerTable" || key !== "age");
  const sorted = [...rows].sort((a, b) => compareValue(a[sortState.key], b[sortState.key], sortState.dir));
  const pageSize = 18;
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  state.playerPage = Math.min(state.playerPage, pages);
  const pageRows = id === "playerTable" ? sorted.slice((state.playerPage - 1) * pageSize, state.playerPage * pageSize) : sorted;
  $(id).innerHTML = `<table><thead><tr>${allowCompare ? "<th>Compare</th>" : ""}${columns.map(([key, label]) => `<th><button class="sort-btn ${sortState.key === key ? "active-sort" : ""}" data-table="${id}" data-key="${key}">${label}${sortState.key === key ? (sortState.dir === "asc" ? " ↑" : " ↓") : ""}</button></th>`).join("")}</tr></thead><tbody>${pageRows.map((p) => rowHtml(p, allowCompare)).join("")}</tbody></table>${id === "playerTable" ? pagination(sorted.length, pages) : ""}`;
  const headers = columns.map(([key, label]) => {
    const arrow = sortState.key === key ? (sortState.dir === "asc" ? " &uarr;" : " &darr;") : "";
    return `<th><button class="sort-btn ${sortState.key === key ? "active-sort" : ""}" data-table="${id}" data-key="${key}" title="${esc(STAT_HELP[key] || `Sort by ${label}`)}">${label}${arrow}</button></th>`;
  }).join("");
  $(id).innerHTML = `<table><thead><tr>${allowCompare ? "<th>Compare</th>" : ""}${headers}</tr></thead><tbody>${pageRows.map((p) => rowHtml(p, allowCompare, id)).join("")}</tbody></table>${id === "playerTable" ? pagination(sorted.length, pages) : ""}`;
  $(id).querySelectorAll(".sort-btn").forEach((btn) => btn.addEventListener("click", () => {
    const dir = sortState.key === btn.dataset.key && sortState.dir === "desc" ? "asc" : "desc";
    setSort({ key: btn.dataset.key, dir });
    if (id === "clubTable") renderClub();
    else if (id === "countryPlayerTable") renderCountry();
    else renderPlayers();
  }));
  $(id).querySelectorAll(".compare-check").forEach((box) => box.addEventListener("change", () => toggleCompare(box.dataset.player, box.checked)));
  $(id).querySelectorAll(".page-btn").forEach((btn) => btn.addEventListener("click", () => { state.playerPage = Number(btn.dataset.page); renderPlayers(); }));
}

function compareValue(a, b, dir) {
  const av = a instanceof Date ? a.getTime() : Number.isFinite(a) ? a : String(a || "").toLowerCase();
  const bv = b instanceof Date ? b.getTime() : Number.isFinite(b) ? b : String(b || "").toLowerCase();
  return (av > bv ? 1 : av < bv ? -1 : 0) * (dir === "asc" ? 1 : -1);
}

function rowHtml(p, allowCompare, tableId = "") {
  const checked = state.compare.has(p.id) ? "checked" : "";
  const status = p.eligibilityLabel || (allowCompare ? playerEligibility(p.name, p.code, p.club).label : "");
  const ageCell = tableId === "playerTable" ? "" : `<td>${fmt(p.age)}</td>`;
  const scoreText = tableId === "playerTable" ? fmt(p.roleScore) : fmt(p.roleScore ?? p.overall);
  return `<tr>${allowCompare ? `<td><input class="compare-check" data-player="${p.id}" type="checkbox" ${checked}></td>` : ""}<td><span class="player-name-cell">${playerStatusDot(status)}<span>${esc(p.name)}</span></span></td><td>${esc(p.country)}</td><td class="muted">${esc(p.club)}</td><td>${esc(p.pos)}</td>${ageCell}<td>${fmt(p.min)}</td><td>${fmt(p.goals)}</td><td>${fmt(p.assists)}</td><td>${fmt(p.attack)}</td><td>${fmt(p.creativity)}</td><td>${fmt(p.defense)}</td><td>${fmt(p.goalkeeping)}</td><td><strong>${scoreText}</strong></td></tr>`;
}

function pagination(total, pages) {
  return `<div class="pagination"><span>${total} players</span><button class="page-btn" data-page="${Math.max(1, state.playerPage - 1)}">Previous</button><strong>Page ${state.playerPage} of ${pages}</strong><button class="page-btn" data-page="${Math.min(pages, state.playerPage + 1)}">Next</button></div>`;
}

function toggleCompare(id, checked) {
  const p = state.worldCupPlayerPool.find((x) => x.id === id);
  if (!p) return;
  if (checked) {
    const existingRole = [...state.compare.values()][0]?.broad;
    if (existingRole && existingRole !== p.broad) {
      alert("Choose players from the same role group for a fair comparison.");
      renderPlayers();
      renderClub();
      return;
    }
    if (state.compare.size >= 2 && !state.compare.has(id)) {
      alert("Select up to two players for a clear comparison.");
      renderPlayers();
      return;
    }
    state.compare.set(id, p);
  } else state.compare.delete(id);
  renderRadar();
}

function renderRadar() {
  const players = [...state.compare.values()];
  $("compareNotice").textContent = players.length === 2 ? `Comparing two ${players[0].broad.toLowerCase()} profiles.` : players.length === 1 ? "Select one more player from the same role group for a fair comparison." : "Select two players with the checkboxes to compare role-appropriate strengths.";
  $("radarCompare").innerHTML = players.length === 2 ? `<div class="radar-comparison-layout">${radarSvg(players)}${comparisonSummary(players)}</div>` : `<div class="empty-radar">${players.length ? "One player selected. Pick one more comparable player." : "No players selected yet."}</div>`;
}

function comparisonSummary(players) {
  const [a, b] = players;
  const role = a.broad;
  const minuteGap = Math.abs((a.min || 0) - (b.min || 0));
  const sampleText = minuteGap > 900 ? `${(a.min || 0) > (b.min || 0) ? a.name : b.name} has the safer minutes sample; read the smaller sample with more caution.` : "The minutes samples are close enough for a fair profile read.";
  let text;
  if (role === "Goalkeeper") {
    text = `${sampleText} This is a keeper profile check: shot-stopping security, workload handling, goals-against control and distribution context matter more than a single winner.`;
  } else if (role === "Defender") {
    text = `${sampleText} Use the shape to separate front-foot defenders from deeper box defenders, then check whether progression or pure defending is the better fit.`;
  } else if (role === "Midfielder") {
    text = `${sampleText} The useful read is role balance: control and progression versus final-third creation and ball-winning support.`;
  } else if (/winger/i.test(`${a.pos} ${b.pos}`)) {
    text = `${sampleText} Treat this as a style split between direct threat, carrying volume, chance creation and defensive work rate.`;
  } else {
    text = `${sampleText} The radar helps separate penalty-box force from broader forward link play and chance involvement.`;
  }
  return `<aside class="comparison-summary-card"><h4>What this means</h4><p>${esc(text)} Radar scores are normalized against comparable ${esc(role.toLowerCase())}s.</p></aside>`;
}

function radarAxes(role) {
  if (role === "Goalkeeper") return [["Save percentage", "savePct", "goalkeeping"], ["Saves", "saves90", "goalkeeping"], ["Clean sheets", "csPct", "goalkeeping"], ["Goals against control", "ga90", "goalkeeping"], ["Cross claims", "claims90", "goalkeeping"], ["Long passing", "longPass90", "progression"]];
  if (role === "Defender") return [["Tackles", "tklw90", "defense"], ["Interceptions", "int90", "defense"], ["Blocks", "blocks90", "defense"], ["Clearances", "clr90", "defense"], ["Aerial strength", "aerial90", "defense"], ["Progressive passing", "prgP90", "progression"]];
  if (role === "Midfielder") return [["Creativity", "creativity", "ast90"], ["Progressive passes", "prgP90", "progression"], ["Progressive carries", "prgC90", "progression"], ["Pass completion", "passCmp", "progression"], ["Ball recoveries", "recov90", "defense"], ["Defensive actions", "defense", "tklw90"]];
  return [["Goal threat", "gls90", "attack"], ["Expected goal threat", "xg", "attack"], ["Assists/creation", "ast90", "creativity"], ["Shot volume", "sh90", "attack"], ["Progressive carries", "prgC90", "progression"], ["Crosses/key passes", "crs90", "creativity"]];
}

function radarSvg(players) {
  const axes = radarAxes(players[0].broad);
  const size = 360, c = size / 2, r = 128;
  const colors = ["var(--green)", "var(--gold)", "var(--blue)", "var(--red)", "var(--lime)"];
  const comparable = state.worldCupPlayerPool.filter((p) => p.broad === players[0].broad);
  const axisKey = (p, axis) => axis.find((key, i) => i > 0 && Number.isFinite(p[key]));
  const scales = Object.fromEntries(axes.flatMap((axis) => axis.slice(1).map((key) => [key, minMax(comparable, key)])));
  const point = (i, val = 100) => { const angle = -Math.PI / 2 + i * Math.PI * 2 / axes.length; const rr = r * val / 100; return [c + Math.cos(angle) * rr, c + Math.sin(angle) * rr]; };
  const grid = [25, 50, 75, 100].map((v) => `<polygon points="${axes.map((_, i) => point(i, v).join(",")).join(" ")}" class="radar-grid"/>`).join("");
  const spokes = axes.map((a, i) => { const p = point(i); const lp = point(i, 116); return `<line x1="${c}" y1="${c}" x2="${p[0]}" y2="${p[1]}" class="radar-line"/><text x="${lp[0]}" y="${lp[1]}" text-anchor="middle">${a[0]}</text>`; }).join("");
  const polys = players.map((p, pi) => {
    const values = axes.map((axis, i) => {
      const key = axisKey(p, axis);
      const normalized = key ? normalize(p[key], scales[key]) : 0;
      return { axis, key, normalized, raw: key ? p[key] : null, pt: point(i, normalized) };
    });
    const pts = values.map((v) => v.pt.join(",")).join(" ");
    const dots = values.map((v) => `<circle cx="${v.pt[0]}" cy="${v.pt[1]}" r="4" style="--radar:${colors[pi % colors.length]}" class="radar-dot"><title>${esc(p.name)} | ${esc(v.axis[0])}: ${fmt(v.normalized)} normalized${Number.isFinite(v.raw) ? ` | raw ${fmt(v.raw, 2)}` : ""}</title></circle>`).join("");
    return `<polygon points="${pts}" style="--radar:${colors[pi % colors.length]}" class="radar-poly"/><polyline points="${pts}" style="--radar:${colors[pi % colors.length]}" class="radar-stroke"/>${dots}`;
  }).join("");
  const legend = players.map((p, i) => `<span style="--dot:${colors[i % colors.length]}">${esc(p.name)}</span>`).join("");
  return `<div class="radar-card"><svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Player radar comparison">${grid}${spokes}${polys}</svg><div class="radar-legend">${legend}</div></div>`;
}

function clubMatches(a = "", b = "") {
  const ak = normalizeClubName(a);
  const bk = normalizeClubName(b);
  return Boolean(ak && bk && (ak === bk || ak.includes(bk) || bk.includes(ak)));
}

function statForKeyPlayer(kp) {
  const candidates = state.worldCupPlayerPool.filter((p) => normalizePlayerName(p.name) === normalizePlayerName(kp.name) && p.code === kp.countryCode);
  return candidates.sort((a, b) => (clubMatches(b.club, kp.club) - clubMatches(a.club, kp.club)) || b.min - a.min)[0] || null;
}

function clubRoleGroup(p = {}) {
  return broadGroup(p.roleGroup || p.role || p.subRole || p.position || p.pos || p.broad) || "Midfielder";
}

function clubWatchRowFromKey(kp, stat = statForKeyPlayer(kp)) {
  const broad = clubRoleGroup(kp);
  return {
    ...(stat || {}),
    id: stat?.id || `club-key-${normalizePlayerName(kp.countryCode)}-${normalizePlayerName(kp.name)}`,
    name: kp.name,
    country: countryName(kp.countryCode),
    code: kp.countryCode,
    club: kp.club || stat?.club || "",
    pos: kp.subRole || kp.roleGroup || kp.role || broad,
    broad,
    age: stat?.age ?? null,
    min: stat?.min ?? null,
    goals: stat?.goals ?? null,
    assists: stat?.assists ?? null,
    attack: stat?.attack ?? null,
    creativity: stat?.creativity ?? null,
    defense: stat?.defense ?? null,
    goalkeeping: stat?.goalkeeping ?? null,
    roleScore: stat?.roleScore ?? null,
    overall: kp.star || stat?.overall || 0,
    star: kp.star || 0,
    tier: kp.tier,
    subRole: kp.subRole,
    eligibilityLabel: playerEligibility(kp.name, kp.countryCode, kp.club).label,
    keyPlayer: true
  };
}

function clubWatchShownPlayers(club) {
  const rows = [];
  const seen = new Set();
  const add = (p) => {
    const key = `${p.code}:${normalizePlayerName(p.name)}`;
    if (!seen.has(key)) {
      seen.add(key);
      rows.push(p);
    }
  };
  [...state.keyPlayers.values()].flat()
    .filter((kp) => clubMatches(kp.club, club))
    .filter((kp) => {
      const status = playerEligibility(kp.name, kp.countryCode, kp.club);
      return status.eligible || status.pending;
    })
    .sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || b.star - a.star || a.priority - b.priority)
    .forEach((kp) => add(clubWatchRowFromKey(kp)));
  state.playerRegistry.forEach((players, code) => {
    players.filter((p) => p.include && clubMatches(p.club, club)).forEach((p) => {
      const stat = state.worldCupPlayerPool.find((x) => x.code === code && normalizePlayerName(x.name) === p.nameKey);
      add({
        ...(stat || {}),
        id: stat?.id || `club-reg-${code}-${p.nameKey}`,
        name: p.name,
        country: countryName(code),
        code,
        club: p.club || stat?.club || club,
        pos: p.positionGroup || stat?.pos || "",
        broad: broadGroup(p.positionGroup || stat?.broad || stat?.pos) || "Midfielder",
        age: stat?.age ?? null,
        min: stat?.min ?? null,
        goals: stat?.goals ?? null,
        assists: stat?.assists ?? null,
        attack: stat?.attack ?? null,
        creativity: stat?.creativity ?? null,
        defense: stat?.defense ?? null,
        goalkeeping: stat?.goalkeeping ?? null,
        roleScore: stat?.roleScore ?? null,
        overall: stat?.overall || 0,
        star: 0,
        eligibilityLabel: ""
      });
    });
  });
  return rows;
}

function clubHiddenPlayers(club) {
  const q = qualifiedCodes();
  const seen = new Set();
  return state.playersAll.filter((p) => clubMatches(p.club, club)).map((p) => {
    if (!q.has(p.code)) return { ...p, reason: "country not qualified" };
    if (!countrySquadOpen(p.code) && !isWorldCupEligiblePlayer(p.name, p.code, p.club)) return { ...p, reason: "not in reported squad" };
    return null;
  }).filter(Boolean).filter((p) => {
    const key = `${p.code}:${normalizePlayerName(p.name)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clubInsightCards(rows) {
  const curated = rows.filter((p) => p.keyPlayer);
  const byPriority = [...rows].sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || (b.star || 0) - (a.star || 0) || (b.roleScore || 0) - (a.roleScore || 0));
  const top = byPriority[0];
  const used = new Set(top ? [normalizePlayerName(top.name)] : []);
  const unused = (p) => !used.has(normalizePlayerName(p.name));
  const young = [...rows].filter((p) => unused(p) && Number.isFinite(p.age) && p.age <= 23).sort((a, b) => a.age - b.age || tierRank(a.tier) - tierRank(b.tier) || (b.star || 0) - (a.star || 0))[0] || curated.find((p) => unused(p) && /young|u23|prospect/i.test(`${p.subRole} ${p.pos}`));
  if (young) used.add(normalizePlayerName(young.name));
  const creative = [...rows].filter((p) => unused(p) && /midfielder|creator|winger|attacking|forward/i.test(`${p.pos} ${p.broad}`)).sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || (b.star || 0) - (a.star || 0) || (b.creativity || 0) - (a.creativity || 0))[0];
  if (creative) used.add(normalizePlayerName(creative.name));
  const defender = [...rows].filter((p) => unused(p) && (p.broad === "Defender" || /defensive midfielder|centre-back|center-back|full-back/i.test(p.pos))).sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || (b.star || 0) - (a.star || 0) || (b.defense || 0) - (a.defense || 0))[0];
  const label = (p, fallback) => p ? `${p.name} · ${p.country}` : fallback;
  return [
    ["Top performer", label(top, "No World Cup-linked player")],
    ["Young player to watch", label(young, "No U23 profile found")],
    ["Most creative", label(creative, "No creator profile found")],
    ["Defensive anchor", label(defender, "Not enough defender data")]
  ];
}

function renderClub() {
  const club = state.clubWatchClub || preferredClub();
  if ($("clubWatchSelect").value !== club) $("clubWatchSelect").value = club;
  $("clubTitle").textContent = `${club || "Club"} World Cup Watch`;
  if (!club) {
    $("clubSummary").innerHTML = `<div class="mini-card"><span>Choose a club</span><strong>Club Watch</strong></div>`;
    $("clubCountryChart").innerHTML = `<div class="compact-item">Choose a club to see World Cup representation.</div>`;
    $("clubPositionChart").innerHTML = `<div class="compact-item">Choose a club to see position distribution.</div>`;
    $("clubTable").innerHTML = `<div class="compact-item">Choose a club to inspect qualified-country players.</div>`;
    $("clubMatchups").innerHTML = `<div class="compact-item">Choose a club to see World Cup matchup watch.</div>`;
    $("notShownList").innerHTML = `<div class="compact-item">Choose a club to see players not shown.</div>`;
    $("clubStatusLegend").innerHTML = "";
    return;
  }
  const clubQ = $("clubSearch").value.toLowerCase();
  const shown = clubWatchShownPlayers(club).filter((p) => !clubQ || `${p.name} ${p.country} ${p.pos}`.toLowerCase().includes(clubQ)).sort((a, b) => (b.star || 0) - (a.star || 0) || (b.roleScore || 0) - (a.roleScore || 0));
  const hidden = clubHiddenPlayers(club);
  const cards = clubInsightCards(shown);
  $("clubSummary").innerHTML = cards.map(([k, v]) => clickableMini(k, v, "club insight")).join("");
  $("clubStatusLegend").innerHTML = shown.some((p) => p.eligibilityLabel) ? statusLegend() : "";
  const byCountry = countBy(shown, (p) => p.country);
  const byPos = countBy(shown, (p) => p.broad);
  renderBars("clubCountryChart", Object.entries(byCountry).map(([label, value]) => ({ label, value })), Math.max(1, ...Object.values(byCountry)));
  renderBars("clubPositionChart", Object.entries(byPos).map(([label, value]) => ({ label, value })), Math.max(1, ...Object.values(byPos)));
  renderSortableTable("clubTable", shown, state.clubSort, (sort) => state.clubSort = sort, false);
  $("notShownList").innerHTML = hidden.length ? hidden.slice(0, 80).map((p) => `<div class="compact-item"><strong>${esc(p.name)}</strong><span>${esc(p.country)} | ${esc(p.pos)} | ${esc(p.reason)}</span></div>`).join("") : `<div class="compact-item">No hidden players for this club under the current World Cup-linked rules.</div>`;
  renderClubMatchups(club, shown);
  renderRadar();
}

function renderClubMatchups(club, shown) {
  const shownNames = new Set(shown.map((p) => normalizePlayerName(p.name)));
  const rows = (state.clubMatchups.get(club) || []).filter((m) => shownNames.has(normalizePlayerName(m.player)));
  if (!rows.length) {
    $("clubMatchups").innerHTML = `<div class="compact-item">No major curated matchup available for this club yet.</div>`;
    return;
  }
  $("clubMatchups").innerHTML = `<div class="matchup-rail">${rows.map((m) => `<article class="matchup-card"><span class="stage-chip">${esc(m.confidence || "Curated")}</span><h3>${esc(m.player)}</h3><p>${esc(m.type || m.role)}</p><div class="chip-row"><span>${esc(m.playerCountry)} vs ${esc(m.opponentCountry)}</span><span>${esc(m.opponents)}</span></div><p>${esc(m.summary)}</p></article>`).join("")}</div>`;
}

function countBy(rows, fn) {
  return rows.reduce((acc, row) => { const key = fn(row) || "Unknown"; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
}

function renderPlanner() {
  const team = $("plannerTeam").value, date = $("plannerDate").value, stage = $("plannerStage").value, watch = $("watchabilityFilter").value, q = $("plannerSearch").value.toLowerCase();
  state.plannerSort = { key: $("plannerSortSelect").value || "date", dir: "asc" };
  const plannerClub = $("plannerClubSelect").value;
  $("plannerClubLens").disabled = !plannerClub;
  if (!plannerClub) $("plannerClubLens").checked = false;
  const clubLens = $("plannerClubLens").checked && plannerClub;
  const list = state.matches.filter((m) => (!team || m.homeCode === team || m.awayCode === team) && (!date || m.ist.dateOnly === date) && (!stage || m.stage.stage_name === stage) && (!watch || (watch === "Weekend" ? m.ist.weekend : watch === "Favourites" ? state.favourites.has(m.id) : m.window === watch)) && (!clubLens || plannerClubPlayers(m).length) && (!q || `${m.homeName} ${m.awayName} ${m.city.city_name} ${m.stage.stage_name}`.toLowerCase().includes(q)));
  const defs = [["Prime Time", "7:00 PM to 11:30 PM IST"], ["Late Night", "11:30 PM to 2:30 AM IST"], ["Early Morning", "2:30 AM to 6:00 AM IST"], ["Weekend", "Saturday and Sunday IST"]];
  $("watchBuckets").innerHTML = defs.map(([k, help]) => `<button class="mini-card watch-bucket ${watch === k ? "active-filter" : ""}" data-window="${k}"><span>${help}</span><strong>${watch === k ? "✓ " : ""}${k}</strong><em>${watch === k ? "Active filter | " : ""}${state.matches.filter((m) => k === "Weekend" ? m.ist.weekend : m.window === k).length} matches</em></button>`).join("");
  $("watchBuckets").querySelectorAll(".watch-bucket").forEach((b) => b.addEventListener("click", () => { $("watchabilityFilter").value = b.dataset.window; renderPlanner(); }));
  renderSavedMatches();
  const sorted = sortPlanner(list);
  const visible = sorted.slice(0, state.plannerLimit);
  $("plannerList").innerHTML = renderPlannerTableHeader(sorted.length) + groupPlannerCards(visible) + (sorted.length > visible.length ? `<button class="ghost-btn show-more" id="showMorePlanner">Show more matches</button>` : "");
  const more = $("showMorePlanner");
  if (more) more.addEventListener("click", () => { state.plannerLimit += 24; renderPlanner(); });
  document.querySelectorAll(".fav").forEach((btn) => btn.addEventListener("click", () => { state.favourites.has(btn.dataset.id) ? state.favourites.delete(btn.dataset.id) : state.favourites.add(btn.dataset.id); localStorage.setItem("fanRadarFavourites", JSON.stringify([...state.favourites])); renderPlanner(); }));
}

function plannerClubPlayers(m) {
  const club = $("plannerClubSelect")?.value;
  if (!club || !m.isFinalized) return [];
  return [...eligibleKeyPlayersFor(m.homeCode), ...eligibleKeyPlayersFor(m.awayCode)].filter((p) => p.club === club);
}

function sortPlanner(list) {
  return [...list].sort((a, b) => {
    const key = state.plannerSort.key;
    const av = key === "hype" ? (scoreMatch(a)?.score ?? -1) : key === "match" ? `${a.homeName} ${a.awayName}` : key === "window" ? a.window : a.date;
    const bv = key === "hype" ? (scoreMatch(b)?.score ?? -1) : key === "match" ? `${b.homeName} ${b.awayName}` : key === "window" ? b.window : b.date;
    return compareValue(av, bv, state.plannerSort.dir);
  });
}

function renderPlannerTableHeader(total) {
  return `<div class="planner-tools"><span>${total} fixtures · sorted by ${esc($("plannerSortSelect").selectedOptions[0]?.textContent || "kickoff time")}</span></div>`;
}

function groupPlannerCards(list) {
  if (!list.length) return `<div class="compact-item">${$("plannerClubLens").checked && $("plannerClubSelect").value ? "No fixtures found for this club lens." : "No matches fit those filters."}</div>`;
  let last = "";
  return list.map((m) => {
    const date = m.ist.dateOnly;
    const header = date !== last ? `<div class="date-header">${esc(new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", month: "short", day: "numeric" }).format(m.date))}</div>` : "";
    last = date;
    return header + plannerCard(m);
  }).join("");
}

function renderSavedMatches() {
  const saved = state.matches.filter((m) => state.favourites.has(m.id)).sort((a, b) => a.date - b.date);
  $("savedMatches").innerHTML = `<h3>My Watchlist</h3>${saved.length ? saved.map((m) => {
    const hype = scoreMatch(m);
    const note = m.isFinalized ? `Neutral Watch Score ${fmt(hype?.score)}` : "Teams not finalized in this fixture guide. Update the fixture data when final matchups are available.";
    return `<div class="saved-item"><span><strong>${esc(m.homeName)} vs ${esc(m.awayName)}</strong><small>${esc(m.ist.label)} IST | ${esc(m.city.venue_name)}, ${esc(m.city.city_name)} | ${m.window} | ${note} | ${countdown(m.date)}</small></span><button class="fav active" data-id="${m.id}" aria-label="Remove favourite">★</button></div>`;
  }).join("") : `<p class="chart-note">Star a match to build your personal World Cup watchlist.</p>`}`;
}

function plannerCard(m) {
  const hype = scoreMatch(m);
  const active = state.favourites.has(m.id) ? " active" : "";
  const note = m.isFinalized ? `Neutral Watch Score ${fmt(hype?.score)} | ${esc(clubAngleText(m))}` : "Teams not finalized in this fixture guide. Update the fixture data when final matchups are available.";
  return `<article class="planner-card ${m.isFinalized ? "" : "placeholder-fixture"}"><div><strong>${esc(m.homeName)} vs ${esc(m.awayName)}</strong><div class="meta"><span>${esc(m.stage.stage_name)}</span><span>${esc(m.ist.label)} IST</span><span>${esc(m.city.venue_name)}, ${esc(m.city.city_name)}</span><span>${m.window}${m.ist.weekend ? " + Weekend" : ""}</span></div><p class="reason">${note}</p></div><button class="fav${active}" data-id="${m.id}" aria-label="Save favourite">★</button></article>`;
}

function clubAngleText(m) {
  if (!$("plannerClubLens").checked || !$("plannerClubSelect").value) return "Choose a club lens to add a supporter angle.";
  const players = plannerClubPlayers(m);
  return players.length ? `Club angle: ${players.slice(0, 3).map((p) => `${p.name} represents ${countryName(p.countryCode)}`).join("; ")}` : "No selected-club player angle.";
}

function countdown(date) {
  const diff = date - new Date();
  if (diff <= 0) return "Kickoff passed";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return `${days}d ${hours}h until kickoff`;
}

function renderBars(id, data, max = 100) {
  $(id).innerHTML = data.length ? data.map((d) => {
    const pct = clamp(d.value / max * 100);
    return `<div class="bar-row" title="${esc(d.label)}: ${fmt(d.value)}"><span class="bar-label">${esc(d.label)}</span><span class="bar-track"><span class="bar-fill ${hypeClass(pct)}" style="--score:${pct}%"></span></span><strong>${fmt(d.value)}</strong></div>`;
  }).join("") : `<div class="compact-item">Not enough matched player data for this view.</div>`;
}

function clickableMini(k, v, label) {
  return `<div class="mini-card" aria-label="${esc(label)}"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`;
}

function applyClubTheme(club = state.activeClub) {
  const theme = CLUB_THEMES.find((t) => t.test.test(club || "")) || { colors: ["#20e083", "#ffd35a", "#53b7ff"] };
  document.documentElement.style.setProperty("--green", theme.colors[0]);
  document.documentElement.style.setProperty("--gold", theme.colors[1]);
  document.documentElement.style.setProperty("--blue", theme.colors[2]);
}

function countryControlChanged(e) {
  if (["countrySelect", "countryView", "countryPlayerSearch"].includes(e.target?.id)) renderCountry();
}

window.renderCountry = renderCountry;
document.addEventListener("change", countryControlChanged);
document.addEventListener("input", countryControlChanged);
window.addEventListener("fanRadarCountryViewChange", renderCountry);
setInterval(() => {
  if (!$("countries")?.classList.contains("active")) return;
  const signature = `${$("countrySelect")?.value}|${$("countryView")?.value}|${$("countryPlayerSearch")?.value}`;
  if (signature !== state.countryUiSignature) renderCountry();
}, 300);
