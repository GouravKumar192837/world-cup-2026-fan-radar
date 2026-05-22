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
  usagePolicy: "data/data_usage_policy_v3.csv"
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
  selectedXiPlayer: null,
  xiShowList: false,
  xiShowRoles: true,
  xiShowClubs: true,
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

boot();

async function boot() {
  try {
    const [matches, teams, cities, stages, players, countryMap, freshness, keyPlayersV3, keyPlayersV4, countryStories, matchStorylines, expectedXi, clubMatchups, displayPolicy, teamProfiles, scoringRules, rivalryOverrides, usagePolicy] = await Promise.all([
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
      loadOptionalCsv(DATA.usagePolicy, "data policy")
    ]);
    const keyPlayers = keyPlayersV4.length ? keyPlayersV4 : keyPlayersV3;
    state.rows = { matches, teams, cities, stages, players, countryMap, freshness, keyPlayers, countryStories, matchStorylines, expectedXi, clubMatchups, displayPolicy, teamProfiles, scoringRules, rivalryOverrides, usagePolicy };
    buildCountryAliases(countryMap);
    teams.forEach((t) => state.teams.set(t.id, { ...t, real: isRealTeam(t) }));
    cities.forEach((c) => state.cities.set(c.id, c));
    stages.forEach((s) => state.stages.set(s.id, s));
    buildPlayers(players);
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
      name: pick(r, ["player_name", "display_name"]),
      slot: pick(r, ["position_slot"]),
      group: pick(r, ["position_group"]),
      role: pick(r, ["role_description"]),
      formation: pick(r, ["formation"]),
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
  const keyA = keyPlayersFor(match.homeCode);
  const keyB = keyPlayersFor(match.awayCode);
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
  const curated = [...keyPlayersFor(match.homeCode), ...keyPlayersFor(match.awayCode)].filter((p) => p.club === state.activeClub);
  if (curated.length) return curated;
  return state.worldCupPlayerPool.filter((p) => p.club === state.activeClub && (p.code === match.homeCode || p.code === match.awayCode)).slice(0, 2);
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
    const clubText = s.clubBoost ? `${state.activeClub} involvement adds an extra fan angle.` : "Choose a favourite club to add a supporter lens.";
    return `${curated.summary} ${clubText} ${s.match.window}${s.match.ist.weekend ? " weekend" : ""} watch in India.`;
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
  return (outfield.length ? outfield : players).slice(0, 3).map((p) => p.name);
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
  $("countryPlayerSearch").addEventListener("input", renderCountry);
  $("clubSearch").addEventListener("input", renderClub);
  ["playerSearch", "nationalityFilter", "clubFilter", "leagueFilter", "positionFilter", "ageFilter", "minutesFilter"].forEach((id) => $(id).addEventListener("input", () => { state.playerPage = 1; $("minutesValue").textContent = $("minutesFilter").value; renderPlayers(); }));
  document.querySelectorAll(".pill").forEach((btn) => btn.addEventListener("click", () => { document.querySelectorAll(".pill").forEach((p) => p.classList.remove("active")); btn.classList.add("active"); state.playerList = btn.dataset.list; state.playerPage = 1; renderPlayers(); }));
  ["plannerTeam", "plannerDate", "plannerStage", "watchabilityFilter", "plannerSearch", "plannerSortSelect", "plannerClubLens"].forEach((id) => $(id).addEventListener("input", () => { state.plannerLimit = 24; renderPlanner(); }));
  $("clearPlannerFilters").addEventListener("click", () => { ["plannerTeam", "plannerDate", "plannerStage", "watchabilityFilter", "plannerSearch"].forEach((id) => $(id).value = ""); $("plannerClubLens").checked = false; state.plannerLimit = 24; renderPlanner(); });
  $("showAllPlanner").addEventListener("click", () => { ["plannerTeam", "plannerDate", "plannerStage", "watchabilityFilter", "plannerSearch"].forEach((id) => $(id).value = ""); $("plannerClubLens").checked = false; $("plannerSortSelect").value = "date"; state.plannerSort = { key: "date", dir: "asc" }; state.plannerLimit = state.matches.length; renderPlanner(); });
  $("clearCompare").addEventListener("click", () => { state.compare.clear(); renderPlayers(); renderClub(); renderRadar(); });
  $("resetMatches").addEventListener("click", () => { state.activeClub = ""; $("hypeClubSelect").value = ""; state.playerSort = { key: "overall", dir: "desc" }; applyClubTheme(); renderMatches(); renderPlanner(); });
  $("clearMatchFilters").addEventListener("click", () => { state.activeClub = ""; $("hypeClubSelect").value = ""; applyClubTheme(); renderMatches(); renderPlanner(); });
  $("resetCountry").addEventListener("click", () => { $("countrySelect").selectedIndex = 0; $("countryView").value = "overview"; $("countryPlayerSearch").value = ""; state.countrySort = { key: "overall", dir: "desc" }; renderCountry(); });
  $("clearCountryFilters").addEventListener("click", () => { $("countryPlayerSearch").value = ""; renderCountry(); });
  $("resetPlayers").addEventListener("click", () => { ["playerSearch", "nationalityFilter", "clubFilter", "leagueFilter", "positionFilter", "ageFilter"].forEach((id) => $(id).value = ""); $("minutesFilter").value = 600; $("minutesValue").textContent = "600"; state.playerSort = { key: "overall", dir: "desc" }; state.compare.clear(); renderPlayers(); });
  $("clearPlayerFilters").addEventListener("click", () => { ["playerSearch", "nationalityFilter", "clubFilter", "leagueFilter", "positionFilter", "ageFilter"].forEach((id) => $(id).value = ""); $("minutesFilter").value = 600; $("minutesValue").textContent = "600"; renderPlayers(); });
  $("resetClub").addEventListener("click", () => { state.clubWatchClub = preferredClub(); $("clubWatchSelect").value = state.clubWatchClub; $("clubSearch").value = ""; state.clubSort = { key: "overall", dir: "desc" }; applyClubTheme(state.clubWatchClub); renderClub(); });
  $("clearClubFilters").addEventListener("click", () => { $("clubSearch").value = ""; renderClub(); });
  $("resetPlanner").addEventListener("click", () => { ["plannerTeam", "plannerDate", "plannerStage", "watchabilityFilter", "plannerSearch"].forEach((id) => $(id).value = ""); $("plannerClubLens").checked = false; $("plannerSortSelect").value = "date"; state.plannerSort = { key: "date", dir: "asc" }; state.plannerLimit = 24; renderPlanner(); });
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
  const clubOpts = state.clubs.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  $("hypeClubSelect").innerHTML = `<option value="">No favourite club lens</option>${clubOpts}`;
  $("clubWatchSelect").innerHTML = `<option value="">Choose a club</option>${clubOpts}`;
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
  return `<span class="hype-track" title="${esc(title)}"><span class="hype-fill ${hypeClass(score)}" style="--score:${clamp(score)}%"></span></span>`;
}

function hypeClass(score) {
  if (score < 40) return "low";
  if (score < 60) return "moderate";
  if (score < 80) return "high";
  return "must";
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
  $("shortlist").innerHTML = countryViewHtml(c);
  if ($("countryView").value === "stats") {
    const q = $("countryPlayerSearch").value.toLowerCase();
    renderSortableTable("countryPlayerTable", c.players.filter((p) => !q || `${p.name} ${p.club} ${p.pos}`.toLowerCase().includes(q)).slice(0, 80), state.countrySort, (sort) => state.countrySort = sort, false);
  } else {
    $("countryPlayerTable").innerHTML = "";
  }
  setTimeout(wireXiControls, 0);
}

function wireXiControls() {
  document.querySelectorAll(".xi-marker").forEach((btn) => btn.addEventListener("click", () => {
    const code = $("countrySelect").value || [...state.countries.keys()][0];
    state.selectedXiPlayer = (state.expectedXi.get(code) || []).find((p) => p.name === btn.dataset.xi) || null;
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
    const keys = keyPlayersFor(c.code);
    const groups = ["Goalkeeper", "Defender", "Midfielder", "Forward"].map((g) => {
      const list = keys.filter((p) => (p.position || p.roleGroup || p.role || "").includes(g) || (g === "Forward" && /winger|striker|forward/i.test(`${p.roleGroup} ${p.subRole}`)));
      return `<div class="guide-card"><h3>${g}s</h3>${list.length ? list.map((p) => `<div class="short-item"><strong>${esc(p.name)}</strong><span>${esc(p.club || "Club not listed")} · ${esc(p.subRole || p.role || "Key player")} · Importance ${fmt(p.star / 10)}</span></div>`).join("") : `<p class="chart-note">No curated ${g.toLowerCase()}s listed yet.</p>`}</div>`;
    }).join("");
    return `<div class="compact-item"><strong>Key Players</strong><span>Curated player guide. These are not official squad selections.</span></div><div class="overview-grid">${groups}</div>`;
  }
  if (view === "hybrid") {
    const statsByName = new Map(c.players.map((p) => [p.name.toLowerCase(), p]));
    const keys = keyPlayersFor(c.code);
    return `<div class="compact-item"><strong>Hybrid View</strong><span>Curated key players first, with club-form stats attached where names match.</span></div>` +
      (keys.length ? keys.slice(0, 12).map((kp) => {
        const stat = statsByName.get(kp.name.toLowerCase());
        return `<div class="short-item"><strong>${esc(kp.name)}</strong><span>${esc(kp.role || "Key player")} | ${esc(kp.club || "Club not listed")} ${stat ? `| Role Score ${fmt(stat.roleScore)} | Attack ${fmt(stat.attack)} | Creativity ${fmt(stat.creativity)}` : "| No matching stats row"}</span></div>`;
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
    <article class="guide-card"><h3>Players To Watch</h3><div class="chip-row">${(story?.players?.length ? story.players : keyPlayersFor(c.code).slice(0, 5).map((p) => p.name)).map((p) => `<span>${esc(p)}</span>`).join("") || "<span>Key player guide not available yet</span>"}</div></article>
    <article class="guide-card"><h3>Group Fixtures</h3>${fixtures.map((m) => `<p><strong>${esc(m.homeName)} vs ${esc(m.awayName)}</strong><br><span>${esc(m.ist.label)} IST · ${esc(m.city.city_name)}</span></p>`).join("")}</article>
  </div>`;
}

function expectedXiHtml(c) {
  const xi = state.expectedXi.get(c.code) || [];
  if (!xi.length) return `<div class="compact-item">Expected XI guide not available yet. Showing key players instead.</div>` + countryViewHtml({ ...c, forceKey: true }).replace('id="', 'data-old="');
  const formation = xi[0]?.formation || "Fan XI";
  const selected = state.selectedXiPlayer;
  return `<div class="xi-toolbar"><span class="stage-chip">${esc(formation)}</span><span>Fan-curated expected XI, not official starting XI.</span><button class="ghost-btn" id="resetXiSelection">Reset XI selection</button><label><input type="checkbox" id="xiListToggle" ${state.xiShowList ? "checked" : ""}> View as list</label><label><input type="checkbox" id="xiRolesToggle" ${state.xiShowRoles ? "checked" : ""}> Show roles</label><label><input type="checkbox" id="xiClubsToggle" ${state.xiShowClubs ? "checked" : ""}> Show club labels</label></div>
  ${state.xiShowList ? xiList(xi) : `<div class="pitch-layout"><div class="pitch">${xi.map((p, i) => xiMarker(p, i, selected)).join("")}</div><aside class="xi-side"><h3>${esc(c.name)} XI Guide</h3><p>${esc(state.countryStories.get(c.code)?.style || "Fan-curated expected XI.")}</p><div id="xiDetail">${selected ? xiDetail(selected, c) : "Click a player marker to see details."}</div></aside></div>`}`;
}

function xiList(xi) {
  return `<div class="compact-list">${xi.map((p) => `<div class="compact-item"><strong>${esc(p.name)}</strong><span>${esc(p.slot)} · ${esc(p.role)} · ${esc(p.confidence)} confidence</span></div>`).join("")}</div>`;
}

function xiMarker(p, i, selected) {
  const pos = pitchPosition(p.slot, i);
  const active = selected?.name === p.name ? " selected" : "";
  return `<button class="xi-marker ${roleClass(p.group)}${active}" data-xi="${esc(p.name)}" style="left:${pos.x}%;top:${pos.y}%;" title="${esc(p.name)} · ${esc(p.role)}"><strong>${shortName(p.name)}</strong>${state.xiShowRoles ? `<small>${esc(p.slot)}</small>` : ""}</button>`;
}

function pitchPosition(slot, i) {
  const map = { GK:[50,90], RB:[78,72], RCB:[62,72], CB:[50,72], LCB:[38,72], LB:[22,72], DM:[50,58], RCM:[66,50], CM:[50,48], LCM:[34,50], AM:[50,36], RW:[78,24], LW:[22,24], ST:[50,18], CF:[50,18] };
  const key = String(slot).toUpperCase();
  const p = map[key] || [20 + (i % 4) * 20, 70 - Math.floor(i / 4) * 18];
  return { x: p[0], y: p[1] };
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
  return `<div class="compact-item"><strong>${esc(p.name)}</strong><span>${esc(p.role)} · ${esc(p.confidence)} confidence<br>${esc(p.notes || "Why they matter: key role in the fan-curated XI.")}${stat ? `<br>Club-form support: Role Score ${fmt(stat.roleScore)}, Attack ${fmt(stat.attack)}, Creativity ${fmt(stat.creativity)}` : ""}</span></div>`;
}

function strongestXI(c) {
  const picks = [
    ...c.players.filter((p) => p.broad === "Goalkeeper").sort((a, b) => b.overall - a.overall).slice(0, 1),
    ...c.players.filter((p) => p.broad === "Defender").sort((a, b) => b.overall - a.overall).slice(0, 4),
    ...c.players.filter((p) => p.broad === "Midfielder").sort((a, b) => b.overall - a.overall).slice(0, 3),
    ...c.players.filter((p) => p.broad === "Forward").sort((a, b) => b.overall - a.overall).slice(0, 3)
  ];
  return `<div class="xi-card"><strong>Strongest XI-style visual</strong><span>Based on club-form data, not official squads.</span><div>${picks.map((p) => `<button class="player-token" data-player="${p.id}">${esc(p.name)}<small>${p.broad}</small></button>`).join("")}</div></div>`;
}

function filteredPlayers() {
  const q = $("playerSearch").value.toLowerCase();
  const min = num($("minutesFilter").value) || 0;
  return state.worldCupPlayerPool.filter((p) => p.min >= min && (!q || p.name.toLowerCase().includes(q)) && (!$("nationalityFilter").value || p.code === $("nationalityFilter").value) && (!$("clubFilter").value || p.club === $("clubFilter").value) && (!$("leagueFilter").value || p.league === $("leagueFilter").value) && (!$("positionFilter").value || p.broad === $("positionFilter").value) && (!$("ageFilter").value || ($("ageFilter").value === "u23" ? p.age < 23 : $("ageFilter").value === "prime" ? p.age >= 23 && p.age < 30 : p.age >= 30)));
}

function playerListRows() {
  if (state.playerList === "key") {
    return [...state.keyPlayers.values()].flat().map((kp, i) => {
      const exact = state.worldCupPlayerPool.filter((p) => p.name === kp.name);
      const normalized = exact.length ? exact : state.worldCupPlayerPool.filter((p) => normalizePlayerName(p.name) === normalizePlayerName(kp.name));
      const stat = normalized.sort((a, b) => (b.code === kp.countryCode) - (a.code === kp.countryCode) || (normalizePlayerName(b.club) === normalizePlayerName(kp.club)) - (normalizePlayerName(a.club) === normalizePlayerName(kp.club)))[0];
      return stat ? { ...stat, name: kp.name, roleScore: stat.roleScore, overall: kp.star, attack: stat.attack, creativity: stat.creativity, defense: stat.defense, goalkeeping: stat.goalkeeping } : {
        id: `k${i}`, name: kp.name, country: countryName(kp.countryCode), code: kp.countryCode, club: kp.club || "", pos: kp.roleGroup || kp.role || "Key player", broad: /goal/i.test(kp.roleGroup) ? "Goalkeeper" : /def/i.test(kp.roleGroup) ? "Defender" : /mid/i.test(kp.roleGroup) ? "Midfielder" : "Forward", age: null, min: null, goals: null, assists: null, attack: null, creativity: null, defense: null, goalkeeping: null, roleScore: null, overall: kp.star
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
  renderSortableTable("playerTable", playerListRows(), state.playerSort, (sort) => state.playerSort = sort, allowCompare);
  renderRadar();
}

function renderSortableTable(id, rows, sortState, setSort, allowCompare = false) {
  const columns = [
    ["name", "Player"], ["country", "Country"], ["club", "Club"], ["pos", "Role"], ["age", "Age"], ["min", "Minutes"], ["goals", "Goals"], ["assists", "Assists"], ["attack", "Attack"], ["creativity", "Creativity"], ["defense", "Defense"], ["goalkeeping", "Goalkeeping"], ["roleScore", "Role Score"]
  ];
  const sorted = [...rows].sort((a, b) => compareValue(a[sortState.key], b[sortState.key], sortState.dir));
  const pageSize = 18;
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  state.playerPage = Math.min(state.playerPage, pages);
  const pageRows = id === "playerTable" ? sorted.slice((state.playerPage - 1) * pageSize, state.playerPage * pageSize) : sorted;
  $(id).innerHTML = `<table><thead><tr>${allowCompare ? "<th>Compare</th>" : ""}${columns.map(([key, label]) => `<th><button class="sort-btn ${sortState.key === key ? "active-sort" : ""}" data-table="${id}" data-key="${key}">${label}${sortState.key === key ? (sortState.dir === "asc" ? " ↑" : " ↓") : ""}</button></th>`).join("")}</tr></thead><tbody>${pageRows.map((p) => rowHtml(p, allowCompare)).join("")}</tbody></table>${id === "playerTable" ? pagination(sorted.length, pages) : ""}`;
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

function rowHtml(p, allowCompare) {
  const checked = state.compare.has(p.id) ? "checked" : "";
  return `<tr>${allowCompare ? `<td><input class="compare-check" data-player="${p.id}" type="checkbox" ${checked}></td>` : ""}<td>${esc(p.name)}</td><td>${esc(p.country)}</td><td class="muted">${esc(p.club)}</td><td>${esc(p.pos)}</td><td>${fmt(p.age)}</td><td>${fmt(p.min)}</td><td>${fmt(p.goals)}</td><td>${fmt(p.assists)}</td><td>${fmt(p.attack)}</td><td>${fmt(p.creativity)}</td><td>${fmt(p.defense)}</td><td>${fmt(p.goalkeeping)}</td><td><strong>${fmt(p.roleScore ?? p.overall)}</strong></td></tr>`;
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
  $("radarCompare").innerHTML = players.length === 2 ? radarSvg(players) + comparisonSummary(players) : `<div class="empty-radar">${players.length ? "One player selected. Pick one more comparable player." : "No players selected yet."}</div>`;
}

function comparisonSummary(players) {
  const [a, b] = players;
  const aLead = a.attack > b.attack ? `${a.name} carries more direct goal threat` : `${b.name} carries more direct goal threat`;
  const cLead = a.creativity > b.creativity ? `${a.name} offers stronger creation` : `${b.name} offers stronger creation`;
  return `<p class="chart-note">${esc(aLead)}, while ${esc(cLead.toLowerCase())}. Radar scores are normalized against comparable ${esc(a.broad.toLowerCase())}s.</p>`;
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
    return;
  }
  const clubQ = $("clubSearch").value.toLowerCase();
  const shown = state.worldCupPlayerPool.filter((p) => p.club === club && (!clubQ || `${p.name} ${p.country} ${p.pos}`.toLowerCase().includes(clubQ))).sort((a, b) => b.overall - a.overall);
  const hidden = state.playersAll.filter((p) => p.club === club && !state.worldCupPlayerPool.includes(p));
  const curatedClub = [...state.keyPlayers.values()].flat().filter((p) => p.club === club).sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || b.star - a.star);
  const curatedNames = new Set(curatedClub.map((p) => p.name.toLowerCase()));
  const priorityShown = [...shown].sort((a, b) => (curatedNames.has(b.name.toLowerCase()) - curatedNames.has(a.name.toLowerCase())) || b.overall - a.overall);
  const curatedDefender = curatedClub.find((p) => /defender|centre-back|full-back|defensive midfielder/i.test(`${p.role} ${p.roleGroup} ${p.subRole}`));
  const cards = curatedClub.length ? [
    ["Top performer", curatedClub[0]?.name || "No qualified player rows"],
    ["Young player to watch", curatedClub.find((p) => /young|u23|prospect/i.test(`${p.role} ${p.roleGroup} ${p.subRole}`))?.name || priorityShown.filter((p) => p.age < 23).sort((a, b) => b.overall - a.overall)[0]?.name || "None in qualified pool"],
    ["Most creative", curatedClub.find((p) => /creator|attacking midfielder|midfielder|playmaker/i.test(`${p.role} ${p.roleGroup} ${p.subRole}`))?.name || priorityShown.sort((a, b) => b.creativity - a.creativity)[0]?.name || "None"],
    ["Defensive anchor", curatedDefender?.name || priorityShown.filter((p) => p.broad === "Defender" || /defensive midfielder/i.test(p.pos)).sort((a, b) => b.defense - a.defense)[0]?.name || "Not enough defender data"]
  ] : [
    ["Top performer", "Key-player guide unavailable"],
    ["Young player to watch", "Key-player guide unavailable"],
    ["Most creative", "Key-player guide unavailable"],
    ["Defensive anchor", "Not enough defender data"]
  ];
  $("clubSummary").innerHTML = cards.map(([k, v]) => clickableMini(k, v, "club insight")).join("");
  const byCountry = countBy(shown, (p) => p.country);
  const byPos = countBy(shown, (p) => p.broad);
  renderBars("clubCountryChart", Object.entries(byCountry).map(([label, value]) => ({ label, value })), Math.max(1, ...Object.values(byCountry)));
  renderBars("clubPositionChart", Object.entries(byPos).map(([label, value]) => ({ label, value })), Math.max(1, ...Object.values(byPos)));
  renderSortableTable("clubTable", shown, state.clubSort, (sort) => state.clubSort = sort, false);
  $("notShownList").innerHTML = hidden.length ? hidden.slice(0, 80).map((p) => `<div class="compact-item"><strong>${esc(p.name)}</strong><span>${esc(p.country)} | ${esc(p.pos)} | not in finalized qualified-country pool</span></div>`).join("") : `<div class="compact-item">Every matched ${esc(club)} player in the dataset belongs to a finalized qualified country.</div>`;
  renderClubMatchups(club, shown, curatedClub);
  renderRadar();
}

function renderClubMatchups(club, shown, curatedClub) {
  const rows = state.clubMatchups.get(club) || [];
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
  const clubLens = $("plannerClubLens").checked;
  const list = state.matches.filter((m) => (!team || m.homeCode === team || m.awayCode === team) && (!date || m.ist.dateOnly === date) && (!stage || m.stage.stage_name === stage) && (!watch || (watch === "Weekend" ? m.ist.weekend : watch === "Favourites" ? state.favourites.has(m.id) : m.window === watch)) && (!clubLens || clubHasFixtureAngle(m)) && (!q || `${m.homeName} ${m.awayName} ${m.city.city_name} ${m.stage.stage_name}`.toLowerCase().includes(q)));
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

function clubHasFixtureAngle(m) {
  if (!state.activeClub || !m.isFinalized) return false;
  return activeClubPlayers(m).length > 0;
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
  if (!list.length) return `<div class="compact-item">No matches fit those filters.</div>`;
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
  if (!state.activeClub) return "Choose a favourite club to add a supporter lens.";
  const players = activeClubPlayers(m);
  return players.length ? `${state.activeClub} angle: ${players.slice(0, 3).map((p) => p.name).join(", ")}` : "No selected-club player angle.";
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
