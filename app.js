const DATA = {
  matches: "data/matches_updated.csv",
  teams: "data/teams_updated.csv",
  cities: "data/host_cities.csv",
  stages: "data/tournament_stages.csv",
  players: "data/players_data-2025_2026.csv",
  countryMap: "data/country_name_map.csv",
  freshness: "data/data_freshness_summary.csv",
  keyPlayers: "data/key_players_curated_v4.csv",
  countryStories: "data/country_story_profiles_v4.csv",
  matchStorylines: "data/match_storylines_curated_v4.csv",
  expectedXi: "data/expected_xi_curated_v4.csv",
  clubMatchups: "data/club_matchup_watch_curated_v4.csv?v=phase2",
  teamProfiles: "data/team_hype_profiles.csv",
  rivalryOverrides: "data/match_rivalry_overrides.csv",
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
  clubCountryPlayerIndex: new Map(),
  matchNeutralScores: new Map(),
  renderTimings: {},
  selectedXiPlayer: null,
  xiShowList: false,
  xiShowRoles: true,
  xiShowClubs: true,
  missingV3: [],
  fullHydrated: false,
  hydrationPromise: null,
  bootTimings: {},
  teams: new Map(),
  cities: new Map(),
  stages: new Map(),
  playersAll: [],
  worldCupPlayerPool: [],
  countries: new Map(),
  matches: [],
  clubs: [],
  clubWatchClubs: [],
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
  playerFiltersOpen: false,
  plannerFiltersOpen: false,
  infoSheet: null,
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

const CLUB_CANONICAL_NAMES = {
  "manchester utd": "Manchester United",
  "manchester united": "Manchester United",
  "man utd": "Manchester United",
  "man united": "Manchester United",
  "juventus next gen": "Juventus",
  "juventus": "Juventus",
  "wolves": "Wolverhampton Wanderers",
  "wolverhampton": "Wolverhampton Wanderers",
  "wolverhampton wanderers": "Wolverhampton Wanderers",
  "psg": "Paris Saint-Germain",
  "paris st germain": "Paris Saint-Germain",
  "paris saint germain": "Paris Saint-Germain",
  "paris saint-germain": "Paris Saint-Germain",
  "inter": "Inter Milan",
  "inter milan": "Inter Milan",
  "internazionale": "Inter Milan",
  "gladbach": "Borussia Mönchengladbach",
  "borussia monchengladbach": "Borussia Mönchengladbach",
  "bayern": "Bayern Munich",
  "bayern munich": "Bayern Munich",
  "spurs": "Tottenham Hotspur",
  "tottenham": "Tottenham Hotspur",
  "tottenham hotspur": "Tottenham Hotspur",
  "newcastle": "Newcastle United",
  "newcastle united": "Newcastle United",
  "atletico madrid": "Atlético Madrid",
  "atletico": "Atlético Madrid",
  "paris fc": "Paris FC",
  "ac milan": "Milan",
  "milan": "Milan",
  "mainz": "Mainz 05",
  "mainz 05": "Mainz 05",
  "olympique lyonnais": "Lyon",
  "ol lyon": "Lyon",
  "lyon": "Lyon"
};

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function recordBootTiming(name, value) {
  state.bootTimings[name] = Math.round(value);
  if (typeof window !== "undefined") {
    window.__fanRadarBootTimings = { ...state.bootTimings };
    window[`__fanRadar${name[0].toUpperCase()}${name.slice(1)}`] = state.bootTimings[name];
  }
}

const CLUB_DISPLAY_SHORT = {
  "Manchester United": "Man United",
  "Manchester City": "Man City",
  "Paris Saint-Germain": "PSG",
  "Bayern Munich": "Bayern",
  "Newcastle United": "Newcastle",
  "Tottenham Hotspur": "Tottenham",
  "Nottingham Forest": "Nott'm Forest",
  "Inter Milan": "Inter",
  "Wolverhampton Wanderers": "Wolves",
  "Atlético Madrid": "Atlético"
};

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

const ROLE_SCORE_FAMILY_META = {
  "Goalkeeper": "0.58*goalkeeping + 0.18*shot-stopping + 0.12*distribution + 0.12*claims",
  "Centre-back": "0.34*defense + 0.18*aerial + 0.18*distribution + 0.14*recovery + 0.10*progression + 0.06*pass completion",
  "Full-back / Wing-back": "0.22*progression + 0.18*carrying + 0.18*defense + 0.14*creativity + 0.12*recovery + 0.08*crossing + 0.08*take-ons",
  "Defensive midfielder": "0.22*defense + 0.24*distribution + 0.18*progression + 0.16*recovery + 0.12*pass completion + 0.05*creativity + 0.03*attack",
  "Central midfielder": "0.24*progression + 0.22*distribution + 0.16*creativity + 0.14*defense + 0.10*recovery + 0.14*attack",
  "Attacking midfielder": "0.28*creativity + 0.18*chance creation + 0.20*attack + 0.14*carrying + 0.14*progression + 0.06*defense",
  "Winger": "0.24*attack + 0.20*creativity + 0.22*carrying + 0.16*progression + 0.10*chance creation + 0.08*take-ons",
  "Striker": "0.42*attack + 0.24*finishing + 0.10*advanced touches + 0.08*progression + 0.08*creativity + 0.08*aerials"
};

const METRIC_DETAILS = {
  attack: {
    title: "Attack",
    eyebrow: "Player Watchlist / Club Watch metric",
    summary: "A role-aware attacking signal built from club-form output and normalized against the wider player pool.",
    bullets: [
      "Starts from normalized goals per 90, shots on target per 90, shots per 90, and advanced attacking touches per 90.",
      "Adds a capped raw-goals bump so strong season totals still matter.",
      "Formula in code: average(goals/90 * 1.25, shots on target/90, shots/90, advanced touches/90, capped raw goals)."
    ]
  },
  creativity: {
    title: "Creativity",
    eyebrow: "Player Watchlist / Club Watch metric",
    summary: "A chance-creation and ball-carrying signal using club-form creation and dribble data.",
    bullets: [
      "Uses normalized assists per 90, crosses per 90, fouls drawn per 90, and successful take-ons per 90.",
      "Adds a capped raw-assists bump so final production still matters.",
      "Formula in code: average(assists/90 * 1.2, crosses/90, fouls drawn/90, take-ons/90, capped raw assists)."
    ]
  },
  defense: {
    title: "Defense",
    eyebrow: "Player Watchlist / Club Watch metric",
    summary: "A defensive contribution signal using ball-winning, shot prevention, and recovery actions.",
    bullets: [
      "Uses normalized interceptions per 90, tackles won per 90, blocks per 90, and recoveries per 90.",
      "Uses an inverted fouls-per-90 term so cleaner defending is rewarded.",
      "Formula in code: average(interceptions/90, tackles won/90, blocks/90, recoveries/90, inverted fouls/90)."
    ]
  },
  goalkeeping: {
    title: "Goalkeeping",
    eyebrow: "Player Watchlist / Club Watch metric",
    summary: "A goalkeeper-only signal built from shot stopping, clean sheets, goals-against control, and handling volume.",
    bullets: [
      "Uses normalized save percentage, clean-sheet percentage, inverted goals against per 90, saves per 90, and claims per 90.",
      "Save percentage is weighted slightly heavier inside the base goalkeeping component.",
      "Formula in code: average(save% * 1.3, clean-sheet%, inverted GA/90, saves/90, claims/90)."
    ]
  },
  roleScore: {
    title: "Role Score",
    eyebrow: "Subrole-family club-form index",
    summary: "A family-specific weighted score for how strong a player looks against similar-role players in the available club-form dataset.",
    bullets: [
      "Players are first classified into one family: Goalkeeper, Centre-back, Full-back / Wing-back, Defensive midfielder, Central midfielder, Attacking midfielder, Winger, or Striker.",
      "Each family uses a different weighted blend of attack, creativity, progression, defense, and role-specific supporting stats.",
      "The final role score is multiplied by a minutes reliability factor: 0.65 + 0.35 * min(1, minutes / 900)."
    ]
  }
};

const CLUB_CARD_META = {
  top: {
    title: "Top performer",
    eyebrow: "Club Watch card logic",
    summary: "Chooses the strongest all-round World Cup-linked club player with both football context and data support.",
    bullets: [
      "Starts from eligible club-linked players only.",
      "Balances curated importance, curated tier, role score, and club minutes.",
      "Role Score is a role-relative club-form index, not a generic fame score."
    ]
  },
  young: {
    title: "Young player to watch",
    eyebrow: "Club Watch card logic",
    summary: "Picks the strongest younger profile after excluding the top-performer winner where possible.",
    bullets: [
      "Looks for age <= 26 so the card still has a credible pick when a club has no U23 World Cup-linked player.",
      "Balances age, role fit, club minutes, curated importance, and role score.",
      "Underrated picks are allowed when the age and role story is clear."
    ]
  },
  creative: {
    title: "Most creative",
    eyebrow: "Club Watch card logic",
    summary: "Finds the best creator or attacker profile among the eligible club-linked players.",
    bullets: [
      "Filters toward midfielder, winger, attacking, creator, and forward-style roles.",
      "Balances creativity score, role score, attack score, curated tier, and importance.",
      "Creativity is based on creation and ball-progression inputs from the available club-form data."
    ]
  },
  defender: {
    title: "Defensive anchor",
    eyebrow: "Club Watch card logic",
    summary: "Finds the clearest defensive-stability story among eligible defenders, goalkeepers, and defensive midfielders.",
    bullets: [
      "Filters toward defenders, goalkeepers, full-backs, centre-backs, and defensive-midfield style profiles.",
      "Balances defense or goalkeeping score, role score, minutes, curated tier, and importance.",
      "The card is about defensive stability, so goalkeepers can qualify when that is the strongest local story."
    ]
  },
  matchup: {
    title: "World Cup Matchup Watch",
    eyebrow: "Club Watch matchup logic",
    summary: "Shows curated matchup notes when they exist, otherwise builds a softer club-linked fallback from current eligible internationals and finalized fixtures.",
    bullets: [
      "Curated rows from the matchup guide win whenever they exist for the club and player.",
      "Fallback rows use the strongest visible club-linked internationals and their best finalized stage-one opponent test.",
      "Fallback notes are fan-watch guidance, not official tactical reports."
    ]
  }
};

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

function stripReserveClubSuffix(name = "") {
  return String(name)
    .replace(/\bnext gen\b/gi, "")
    .replace(/\bu-?23\b/gi, "")
    .replace(/\bu-?21\b/gi, "")
    .replace(/\bb team\b/gi, "")
    .replace(/\breserves?\b/gi, "")
    .replace(/\bacademy\b/gi, "")
    .replace(/\bii\b/gi, "")
    .replace(/\s*[-–—]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function clubNameParts(name = "") {
  const raw = String(name || "").trim();
  if (!raw) return [];
  const parts = raw
    .split(/\s*(?:\/|\||;|,|->|=>)\s*/g)
    .map((part) => stripReserveClubSuffix(part))
    .filter(Boolean);
  return [...new Set([raw, ...parts])];
}

function simplifyClubKey(name = "") {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(next gen|u-?23|u-?21|b team|reserves?|academy|ii|fc|cf|sc|club)\b/g, "")
    .replace(/\bman\b/g, "manchester")
    .replace(/\butd\b/g, "united")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeClubName(name = "") {
  const simplified = simplifyClubKey(stripReserveClubSuffix(name));
  return normalizePlayerName(CLUB_CANONICAL_NAMES[simplified] || simplified).replace(/\b(fc|cf|sc|club)\b/g, "").replace(/\s+/g, " ").trim();
}

function resolveClubDisplayName(name = "", knownClubs = state.clubsRaw || state.clubs || []) {
  const raw = String(name).trim();
  if (!raw) return "";
  const knownPool = [...new Set((knownClubs || []).filter(Boolean))];
  const normalizedKnown = new Map(knownPool.map((club) => [normalizeClubName(club), club]));
  const candidates = clubNameParts(raw);
  for (const candidate of [...candidates].reverse()) {
    const simplified = simplifyClubKey(candidate);
    const canonical = CLUB_CANONICAL_NAMES[simplified];
    if (canonical) return canonical;
    const known = normalizedKnown.get(normalizeClubName(candidate));
    if (known) return CLUB_CANONICAL_NAMES[simplifyClubKey(known)] || stripReserveClubSuffix(known);
  }
  const stripped = stripReserveClubSuffix(raw);
  const simplified = simplifyClubKey(stripped);
  return CLUB_CANONICAL_NAMES[simplified] || stripped || raw;
}

function canonicalClubList(clubs = [], knownClubs = clubs) {
  const byKey = new Map();
  clubs.filter(Boolean).forEach((club) => {
    const display = resolveClubDisplayName(club, knownClubs);
    const key = normalizeClubName(display);
    if (!key || byKey.has(key)) return;
    byKey.set(key, display);
  });
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

function canonicalizeClubFields(rows = [], knownClubs = state.clubsRaw || []) {
  rows.forEach((row) => {
    if (row?.club) row.club = resolveClubDisplayName(row.club, knownClubs);
  });
}

boot();

async function boot() {
  const started = nowMs();
  state.bootTimings.startedAt = started;
  $("loader").classList.add("hidden");
  try {
    const [matches, teams, cities, stages, countryMap, freshness, keyPlayers, teamProfiles, rivalryOverrides] = await Promise.all([
      loadCsv(DATA.matches),
      loadCsv(DATA.teams),
      loadCsv(DATA.cities),
      loadCsv(DATA.stages),
      loadOptionalCsv(DATA.countryMap, "country guide"),
      loadOptionalCsv(DATA.freshness, "data coverage note"),
      loadOptionalCsv(DATA.keyPlayers, "key player guide"),
      loadOptionalCsv(DATA.teamProfiles, "team hype guide"),
      loadOptionalCsv(DATA.rivalryOverrides, "rivalry guide")
    ]);
    state.rows = { matches, teams, cities, stages, countryMap, freshness, keyPlayers, teamProfiles, rivalryOverrides, players: [] };
    buildCountryAliases(countryMap);
    teams.forEach((t) => state.teams.set(t.id, { ...t, real: isRealTeam(t) }));
    cities.forEach((c) => state.cities.set(c.id, c));
    stages.forEach((s) => state.stages.set(s.id, s));
    buildV3HypeLayers(keyPlayers, teamProfiles, rivalryOverrides);
    buildLightweightCountries();
    buildMatches(matches);
    buildNeutralScoreCache();
    recordBootTiming("criticalFetchMs", nowMs() - started);
    state.activeClub = "";
    wireUi();
    fillSelects(false);
    renderInitial();
    recordBootTiming("firstMustWatchRenderMs", nowMs() - started);
    recordBootTiming("initialBootMs", nowMs() - started);
    window.__fanRadarInitialBootMs = state.bootTimings.initialBootMs;
    $("loader").classList.add("hidden");
    scheduleFullHydration();
  } catch (err) {
    $("loader").classList.add("hidden");
    $("error").classList.remove("hidden");
    $("error").textContent = `Could not load app data: ${err.message}`;
  }
}

function scheduleFullHydration() {
  const run = () => {
    if (!state.hydrationPromise) state.hydrationPromise = hydrateFullData();
  };
  recordBootTiming("fullHydrationScheduledMs", nowMs() - (state.bootTimings.startedAt || nowMs()));
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 2000 });
    return;
  }
  setTimeout(run, 1200);
}

async function hydrateFullData() {
  const started = nowMs();
  try {
    const [players, countryStories, matchStorylines, expectedXi, clubMatchups, playerRegistry, squadStatus] = await Promise.all([
      loadCsv(DATA.players),
      loadOptionalCsv(DATA.countryStories, "country story guide"),
      loadOptionalCsv(DATA.matchStorylines, "fixture story guide"),
      loadOptionalCsv(DATA.expectedXi, "expected XI guide"),
      loadOptionalCsv(DATA.clubMatchups, "club matchup guide"),
      loadOptionalCsv(DATA.playerRegistry, "player registry"),
      loadOptionalCsv(DATA.squadStatus, "squad status")
    ]);
    state.rows = { ...state.rows, players, countryStories, matchStorylines, expectedXi, clubMatchups, playerRegistry, squadStatus };
    buildEligibilityLayers(playerRegistry, squadStatus);
    buildPlayers(players);
    buildV4GuideLayers(countryStories, matchStorylines, expectedXi, clubMatchups);
    finalizeFullData();
    state.fullHydrated = true;
    fillSelects(true);
    renderAll(false);
    recordBootTiming("fullHydrationMs", nowMs() - started);
    recordBootTiming("fullHydrationReadyMs", nowMs() - (state.bootTimings.startedAt || started));
    window.__fanRadarFullHydrationMs = state.bootTimings.fullHydrationMs;
  } catch (err) {
    state.missingV3.push(`full data hydration failed: ${err.message}`);
    document.querySelectorAll(".deferred-loading").forEach((el) => {
      el.textContent = "This section could not finish loading. Refresh the page and try again.";
    });
  }
}

function finalizeFullData() {
  const clubFormClubs = canonicalClubList([
    ...state.playersAll.map((p) => p.club).filter(Boolean),
    ...state.worldCupPlayerPool.map((p) => p.club).filter(Boolean)
  ]);
  state.clubsRaw = canonicalClubList([
    ...clubFormClubs,
    ...[...state.keyPlayers.values()].flat().map((p) => p.club).filter(Boolean),
    ...[...state.expectedXi.values()].flat().map((p) => p.club).filter(Boolean),
    ...[...state.playerRegistry.values()].flat().map((p) => p.club).filter(Boolean),
    ...[...state.clubMatchups.keys()]
  ], clubFormClubs);
  canonicalizeClubFields(state.playersAll, state.clubsRaw);
  canonicalizeClubFields(state.worldCupPlayerPool, state.clubsRaw);
  state.keyPlayers.forEach((players) => canonicalizeClubFields(players, state.clubsRaw));
  state.expectedXi.forEach((players) => canonicalizeClubFields(players, state.clubsRaw));
  state.playerRegistry.forEach((players) => canonicalizeClubFields(players, state.clubsRaw));
  const canonicalClubMatchups = new Map();
  state.clubMatchups.forEach((rows, club) => {
    const displayClub = resolveClubDisplayName(club, state.clubsRaw);
    const cleanRows = rows.map((row) => ({ ...row, club: displayClub }));
    canonicalClubMatchups.set(displayClub, [...(canonicalClubMatchups.get(displayClub) || []), ...cleanRows]);
  });
  state.clubMatchups = canonicalClubMatchups;
  buildCountries();
  buildClubCountryPlayerIndex();
  buildNeutralScoreCache();
  state.clubs = canonicalClubList([
    ...state.playersAll.map((p) => p.club).filter(Boolean),
    ...[...state.keyPlayers.values()].flat().map((p) => p.club).filter(Boolean),
    ...[...state.expectedXi.values()].flat().map((p) => p.club).filter(Boolean),
    ...[...state.playerRegistry.values()].flat().map((p) => p.club).filter(Boolean),
    ...[...state.clubMatchups.keys()]
  ], state.clubsRaw);
  state.clubWatchClubs = state.clubs.filter((club) => clubHasRenderableWatchRows(club));
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
  const broad = s.includes("GK")
    ? "Goalkeeper"
    : s.includes("DF")
      ? "Defender"
      : (s.includes("FW") && s.includes("MF"))
        ? "Forward"
        : s.includes("MF")
          ? "Midfielder"
          : s.includes("FW")
            ? "Forward"
            : "Outfield";
  let role = broad;
  if (s.includes("FW") && s.includes("MF")) role = "Winger or attacking forward";
  else if (s.includes("DF") && s.includes("MF")) role = "Full-back or defensive midfielder";
  else if (s.includes("DF")) role = "Defender";
  else if (s.includes("MF")) role = "Midfielder";
  else if (s.includes("FW")) role = "Forward";
  return { broad, label: role };
}

function weightedAverage(pairs) {
  const valid = pairs.filter(([value, weight]) => Number.isFinite(value) && Number.isFinite(weight) && weight > 0);
  if (!valid.length) return null;
  const totalWeight = valid.reduce((sum, [, weight]) => sum + weight, 0);
  if (!totalWeight) return null;
  return valid.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight;
}

function classifySubroleFamily(p, metric) {
  const raw = String(p.posRaw || "").toUpperCase();
  if (p.broad === "Goalkeeper") return "Goalkeeper";
  if (p.broad === "Defender") {
    if (raw.includes("MF")) return "Full-back / Wing-back";
    if ((p.crs90 || 0) >= 1.5 || (p.ast90 || 0) >= 0.18 || (p.takeOns90 || 0) >= 0.9) return "Full-back / Wing-back";
    const wideLean = avg([metric("crs90"), metric("prgC90"), metric("prgP90"), metric("takeOns90"), metric("touchesAtt90"), metric("ast90")]);
    const centralLean = avg([metric("blocks90"), metric("clr90"), metric("aerial90"), metric("int90"), metric("passCmp")]);
    return (wideLean || 0) >= (centralLean || 0) ? "Full-back / Wing-back" : "Centre-back";
  }
  if (p.broad === "Midfielder") {
    if (/\bAM\b/.test(raw) || raw.includes("FW")) return "Attacking midfielder";
    if (/\bDM\b/.test(raw)) return "Defensive midfielder";
    const dmLean = avg([metric("int90"), metric("tklw90"), metric("recov90"), metric("passCmp"), metric("prgP90")]);
    const amLean = avg([metric("ast90"), metric("crs90"), metric("takeOns90"), metric("touchesAtt90"), metric("sh90"), p.creativity, p.attack]);
    if ((p.ast90 || 0) >= 0.28 || (p.sh90 || 0) >= 2.0 || (p.crs90 || 0) >= 2.5) return "Attacking midfielder";
    if ((p.int90 || 0) >= 1.0 && (p.tklw90 || 0) >= 1.4 && (p.sh90 || 0) < 1.5 && (p.ast90 || 0) < 0.22) return "Defensive midfielder";
    if ((amLean || 0) >= (dmLean || 0) + 10) return "Attacking midfielder";
    if ((dmLean || 0) >= (amLean || 0) + 12) return "Defensive midfielder";
    return "Central midfielder";
  }
  if (p.broad === "Forward") {
    if (raw.includes("MF")) return "Winger";
    const wingerLean = avg([metric("ast90"), metric("crs90"), metric("takeOns90"), metric("touchesAtt90"), p.progression, p.creativity]);
    const strikerLean = avg([metric("gls90"), metric("sot90"), metric("sh90"), p.attack, p.goals ? clamp(p.goals * 4) : null]);
    if ((p.ast90 || 0) >= 0.28 || (p.crs90 || 0) >= 2.2 || (p.takeOns90 || 0) >= 1.2) return "Winger";
    if ((p.sh90 || 0) >= 3.3 && (p.sot90 || 0) >= 1.2 && (p.crs90 || 0) < 2.0) return "Striker";
    return (wingerLean || 0) >= (strikerLean || 0) - 4 ? "Winger" : "Striker";
  }
  return p.broad || "Outfield";
}

function familyRoleScore(p, family, metric) {
  const distribution = avg([metric("prgP90"), metric("passCmp"), metric("ppm"), metric("plus90"), metric("longPass90")]);
  const carrying = avg([metric("prgC90"), metric("takeOns90"), metric("touchesAtt90")]);
  const aerial = avg([metric("aerial90"), metric("clr90"), metric("blocks90")]);
  const recovery = avg([metric("recov90"), metric("int90"), metric("tklw90")]);
  const chanceCreation = avg([metric("ast90"), metric("crs90"), metric("fld90"), metric("touchesAtt90")]);
  const finishing = avg([metric("gls90"), metric("sot90"), metric("sh90"), p.attack]);
  const shotStopping = avg([metric("savePct"), metric("csPct"), metric("ga90"), metric("saves90")]);
  const claims = avg([metric("claims90"), metric("longPass90"), metric("passCmp")]);
  const score = {
    "Goalkeeper": weightedAverage([[p.goalkeeping, 0.58], [shotStopping, 0.18], [distribution, 0.12], [claims, 0.12]]),
    "Centre-back": weightedAverage([[p.defense, 0.34], [aerial, 0.18], [distribution, 0.18], [recovery, 0.14], [p.progression, 0.10], [metric("passCmp"), 0.06]]),
    "Full-back / Wing-back": weightedAverage([[p.progression, 0.22], [carrying, 0.18], [p.defense, 0.18], [p.creativity, 0.14], [recovery, 0.12], [metric("crs90"), 0.08], [metric("takeOns90"), 0.08]]),
    "Defensive midfielder": weightedAverage([[p.defense, 0.22], [distribution, 0.24], [p.progression, 0.18], [recovery, 0.16], [metric("passCmp"), 0.12], [p.creativity, 0.05], [p.attack, 0.03]]),
    "Central midfielder": weightedAverage([[p.progression, 0.24], [distribution, 0.22], [p.creativity, 0.16], [p.defense, 0.14], [recovery, 0.10], [p.attack, 0.14]]),
    "Attacking midfielder": weightedAverage([[p.creativity, 0.28], [chanceCreation, 0.18], [p.attack, 0.20], [carrying, 0.14], [p.progression, 0.14], [p.defense, 0.06]]),
    "Winger": weightedAverage([[p.attack, 0.24], [p.creativity, 0.20], [carrying, 0.22], [p.progression, 0.16], [chanceCreation, 0.10], [metric("takeOns90"), 0.08]]),
    "Striker": weightedAverage([[p.attack, 0.42], [finishing, 0.24], [metric("touchesAtt90"), 0.10], [p.progression, 0.08], [p.creativity, 0.08], [aerial, 0.08]])
  }[family];
  return Number.isFinite(score) ? score : avg([p.attack, p.creativity, p.progression, p.defense, p.goalkeeping]) || 0;
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
    const metric = (name) => score(p, name);
    p.country = countryName(p.code);
    p.attack = avg([metric("gls90") * 1.25, metric("sot90"), metric("sh90"), metric("touchesAtt90"), p.goals ? clamp(p.goals * 4) : null]);
    p.creativity = avg([metric("ast90") * 1.2, metric("crs90"), metric("fld90"), metric("takeOns90"), p.assists ? clamp(p.assists * 6) : null]);
    p.progression = avg([metric("onG90"), metric("plus90"), metric("ppm"), metric("prgP90"), metric("prgC90")]);
    p.defense = avg([metric("int90"), metric("tklw90"), metric("blocks90"), metric("recov90"), 100 - metric("fls90")]);
    p.goalkeeping = avg([metric("savePct") * 1.3, metric("csPct"), metric("ga90"), metric("saves90"), metric("claims90")]);
    p.subroleFamily = classifySubroleFamily(p, metric);
    p.pos = p.subroleFamily;
    const reliability = Number.isFinite(p.min) && p.min > 0 ? Math.min(1, p.min / 900) : 0.65;
    p.roleScore = clamp(familyRoleScore(p, p.subroleFamily, metric) * (0.65 + 0.35 * reliability));
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
  state.countries.clear();
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

function buildLightweightCountries() {
  state.countries.clear();
  qualifiedCodes().forEach((code) => {
    const profile = state.teamProfiles.get(code);
    state.countries.set(code, {
      code,
      name: countryName(code),
      players: [],
      top: [],
      strength: profile?.quality ? profile.quality * 10 : 50,
      attack: null,
      creativity: null,
      progression: null,
      defense: null,
      goalkeeping: null
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

function buildNeutralScoreCache() {
  state.matchNeutralScores = new Map();
  state.matches.filter((m) => m.isFinalized).forEach((m) => {
    const score = scoreMatchNeutral(m);
    if (score) state.matchNeutralScores.set(m.id, score);
  });
}

function neutralScoreFor(match) {
  if (!match?.isFinalized) return null;
  if (!state.matchNeutralScores.has(match.id)) {
    const score = scoreMatchNeutral(match);
    if (score) state.matchNeutralScores.set(match.id, score);
  }
  return state.matchNeutralScores.get(match.id) || null;
}

function scoreMatchNeutral(match) {
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
  const stageRaw = stageOrder === 1 ? 5 : 8 + stageOrder * 3;
  const components = {
    country: Number.isFinite(combinedStrength) ? clamp(combinedStrength * .3, 0, 30) : null,
    stars: Number.isFinite(starPower) ? clamp(starPower * .25, 0, 25) : null,
    balance: Number.isFinite(balance) ? clamp(balance * .2, 0, 20) : null,
    story: clamp((avg([p1.fanInterest, p2.fanInterest].filter(Number.isFinite)) || 50) * .08 + rivalryBoost, 0, 15),
    stage: clamp(stageRaw, 0, 10)
  };
  const score = clamp([components.country, components.stars, components.balance, components.story, components.stage].filter(Number.isFinite).reduce((a, b) => a + b, 0));
  return { score, combinedStrength, highForm, starCount, stageBoost: components.stage, rivalryBoost, components, keyA, keyB, c1, c2 };
}

function scoreMatch(match, club = state.activeClub) {
  const neutral = neutralScoreFor(match);
  if (!neutral) return null;
  const lens = clubLensForMatch(match, club);
  const components = { ...neutral.components, club: lens.boost };
  const reasonBullets = matchReasonBullets({ ...neutral, match, components, clubBoost: lens.boost, clubPlayers: lens.players, club });
  const combined = {
    ...neutral,
    components,
    clubBoost: lens.boost,
    clubPlayers: lens.players,
    supporterScore: supporterScore({ score: neutral.score, clubBoost: lens.boost }),
    reasonBullets
  };
  combined.reason = reasonBullets.join(" ");
  return combined;
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

function clubCountryIndexKey(club = "", code = "") {
  return `${normalizeClubName(club)}|${code}`;
}

function addIndexedClubPlayer(index, source, code, sourceType = "") {
  const name = source?.name || source?.Player || source?.player_name;
  const playerClub = source?.club || source?.Squad || source?.club_reference || "";
  if (!name || !playerClub || !code) return;
  const status = playerEligibility(name, code, playerClub);
  if (!(status.eligible || status.pending || source?.include)) return;
  const club = resolveClubDisplayName(playerClub);
  const key = clubCountryIndexKey(club, code);
  if (!index.has(key)) index.set(key, new Map());
  const rowKey = `${code}:${normalizePlayerName(name)}`;
  const rows = index.get(key);
  const candidate = {
    name,
    countryCode: code,
    code,
    country: countryName(code),
    club,
    sourceType,
    star: source.star || 0,
    roleScore: source.roleScore || source.selectionScore || 0,
    min: source.min || 0
  };
  const current = rows.get(rowKey);
  if (!current || clubPlayerRank(candidate) > clubPlayerRank(current)) rows.set(rowKey, candidate);
}

function clubPlayerRank(p) {
  const source = { "key player": 40, "expected XI": 30, "squad registry": 20, "club form": 10 }[p.sourceType] || 0;
  return source + (p.star || 0) / 10 + (p.roleScore || 0) / 100 + Math.min(1, (p.min || 0) / 2500);
}

function buildClubCountryPlayerIndex() {
  const index = new Map();
  state.keyPlayers.forEach((rows, code) => rows.forEach((p) => addIndexedClubPlayer(index, p, code, "key player")));
  state.expectedXi.forEach((rows, code) => rows.forEach((p) => addIndexedClubPlayer(index, p, code, "expected XI")));
  state.playerRegistry.forEach((rows, code) => rows.filter((p) => p.include).forEach((p) => addIndexedClubPlayer(index, p, code, "squad registry")));
  state.worldCupPlayerPool.forEach((p) => addIndexedClubPlayer(index, p, p.code, "club form"));
  state.clubCountryPlayerIndex = new Map([...index.entries()].map(([key, rows]) => [
    key,
    [...rows.values()].sort((a, b) => clubPlayerRank(b) - clubPlayerRank(a) || a.name.localeCompare(b.name))
  ]));
}

function clubHasRenderableWatchRows(club = "") {
  return clubWatchShownPlayers(club).length > 0;
}

function activeClubPlayers(match) {
  return clubPlayersForMatch(match, state.activeClub);
}

function clubPlayersForMatch(match, club = state.activeClub) {
  return clubLensForMatch(match, club).players;
}

function clubLensForMatch(match, club = state.activeClub) {
  if (!club || !match?.isFinalized) return { players: [], boost: 0 };
  const seen = new Set();
  const players = [];
  [match.homeCode, match.awayCode].filter(Boolean).forEach((code) => {
    (state.clubCountryPlayerIndex.get(clubCountryIndexKey(club, code)) || []).forEach((p) => {
      const key = `${p.countryCode}:${normalizePlayerName(p.name)}`;
      if (seen.has(key)) return;
      seen.add(key);
      players.push(p);
    });
  });
  const sorted = players.sort((a, b) => clubPlayerRank(b) - clubPlayerRank(a) || a.name.localeCompare(b.name));
  return { players: sorted, boost: clubInvolvementScore(match, sorted, club) };
}

function clubInvolvementScore(match, clubPlayers, club = state.activeClub) {
  if (!club || !clubPlayers.length) return 0;
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

function supporterScore(hype) {
  if (!hype) return 0;
  return hype.score + clubRelevanceWeight(clubRelevance(hype.clubBoost));
}

function clubRelevanceText(hype) {
  return clubRelevance(hype?.clubBoost);
}

function clubLensText(club, clubPlayers = []) {
  if (!club || !clubPlayers.length) return "";
  return `${club}: ${clubPlayers.slice(0, 3).map((p) => `${p.name} (${countryName(p.countryCode || p.code)})`).join(", ")}`;
}

function naturalReason(s) {
  return matchReasonBullets(s).join(" ");
}

function matchReasonBullets(s) {
  const bullets = [matchHookText(s)];
  const clubText = clubLensText(s.club, s.clubPlayers);
  if (clubText) bullets.push(`Club angle: ${clubText}.`);
  bullets.push(`India watch: ${s.match.window}${s.match.ist.weekend ? " + weekend" : ""}.`);
  return bullets;
}

function matchHookText(s) {
  const a = headlinePlayers(s.keyA).join(", ");
  const b = headlinePlayers(s.keyB).join(", ");
  const leader = watchDriverText(s);
  if (a && b) return `Match hook: ${s.c1.name} vs ${s.c2.name} rates well for ${leader}, with ${a} against ${b}.`;
  return `Match hook: ${s.c1.name} vs ${s.c2.name} rates well for ${leader}.`;
}

function watchDriverText(s) {
  if ((s.components.country ?? 0) >= 28) return "country quality and squad depth";
  if ((s.components.stars ?? 0) >= 16) return "star power";
  if ((s.components.balance ?? 0) >= 11) return "competitive balance";
  if ((s.components.stage ?? 0) >= 10) return "stage stakes";
  return "balanced tournament context";
}

function headlinePlayers(players) {
  const outfield = players.filter((p) => !/goalkeeper/i.test(`${p.role} ${p.roleGroup} ${p.subRole}`) || String(p.avoidGk).toLowerCase() === "false");
  return (outfield.length ? outfield : players).slice(0, 2).map((p) => p.name);
}

function preferredClub() {
  const options = state.clubWatchClubs?.length ? state.clubWatchClubs : state.clubs;
  return options.find((c) => /manchester united/i.test(c)) || options.find((c) => /real madrid/i.test(c)) || options[0] || "";
}

function isMobileViewport() {
  return window.innerWidth <= 720;
}

function setActiveTab(tabId) {
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
  document.querySelectorAll(".tab[data-tab]").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabId));
  if (!state.fullHydrated && tabId !== "matches") showDeferredSectionLoading(tabId);
  const activeMobileTab = document.querySelector(".tabs-mobile .tab.active");
  if (activeMobileTab && isMobileViewport()) activeMobileTab.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  applyClubTheme(tabId === "club" ? (state.clubWatchClub || preferredClub()) : state.activeClub);
}

function showDeferredSectionLoading(tabId) {
  if (tabId === "countries") {
    if ($("shortlist")) $("shortlist").innerHTML = `<div class="compact-item deferred-loading">Finishing this section's player data...</div>`;
    if ($("countryPlayerTable")) $("countryPlayerTable").innerHTML = "";
    return;
  }
  const targets = {
    players: "playerTable",
    club: "clubSummary",
    planner: "plannerList"
  };
  const id = targets[tabId];
  if (!id || !$(id)) return;
  $(id).innerHTML = `<div class="compact-item deferred-loading">Finishing this section's player data...</div>`;
}

function wireUi() {
  document.querySelectorAll(".tab[data-tab]").forEach((btn) => btn.addEventListener("click", () => setActiveTab(btn.dataset.tab)));
  window.addEventListener("resize", () => {
    updateControlVisibility();
  });
  $("hypeClubSelect").addEventListener("change", (e) => { state.activeClub = e.target.value; state.prioritizeClubLens = Boolean(state.activeClub); applyClubTheme(); renderMatches(); renderPlanner(); });
  $("clubWatchSelect").addEventListener("change", (e) => { state.clubWatchClub = e.target.value; applyClubTheme(state.clubWatchClub); renderClub(); });
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
  ["plannerTeam", "plannerDate", "plannerStage", "watchabilityFilter", "plannerSearch", "plannerSortSelect"].forEach((id) => $(id).addEventListener("input", () => { state.plannerLimit = 24; renderPlanner(); }));
  $("plannerClubSelect").addEventListener("input", () => { applyClubTheme($("plannerClubSelect").value || state.activeClub || state.clubWatchClub); state.plannerLimit = 24; renderPlanner(); });
  $("showAllPlanner").addEventListener("click", () => { ["plannerTeam", "plannerDate", "plannerStage", "watchabilityFilter", "plannerSearch", "plannerClubSelect"].forEach((id) => $(id).value = ""); $("plannerSortSelect").value = "date"; state.plannerSort = { key: "date", dir: "asc" }; state.plannerLimit = state.matches.length; renderPlanner(); });
  $("clearCompare").addEventListener("click", () => { state.compare.clear(); renderPlayers(); renderClub(); renderRadar(); });
  $("playerMobileFilterToggle").addEventListener("click", () => { state.playerFiltersOpen = !state.playerFiltersOpen; updateControlVisibility(); });
  $("plannerMobileFilterToggle").addEventListener("click", () => { state.plannerFiltersOpen = !state.plannerFiltersOpen; updateControlVisibility(); });
  $("resetMatches").addEventListener("click", () => { state.activeClub = ""; state.prioritizeClubLens = false; $("hypeClubSelect").value = ""; applyClubTheme(); renderMatches(); renderPlanner(); });
  $("resetCountry").addEventListener("click", () => { $("countrySelect").selectedIndex = 0; $("countryView").value = "overview"; $("countryPlayerSearch").value = ""; state.countrySort = { key: "overall", dir: "desc" }; renderCountry(); });
  $("clearCountryFilters").addEventListener("click", () => { $("countryPlayerSearch").value = ""; renderCountry(); });
  $("resetPlayers").addEventListener("click", () => { ["playerSearch", "nationalityFilter", "clubFilter", "leagueFilter", "positionFilter", "ageFilter"].forEach((id) => $(id).value = ""); state.playerSort = { key: "overall", dir: "desc" }; state.compare.clear(); state.playerFiltersOpen = false; renderPlayers(); });
  $("resetClub").addEventListener("click", () => { state.clubWatchClub = preferredClub(); $("clubWatchSelect").value = state.clubWatchClub; $("clubSearch").value = ""; state.clubSort = { key: "overall", dir: "desc" }; applyClubTheme(state.clubWatchClub); renderClub(); });
  $("clearClubFilters").addEventListener("click", () => { $("clubSearch").value = ""; renderClub(); });
  $("resetPlanner").addEventListener("click", () => { ["plannerTeam", "plannerDate", "plannerStage", "watchabilityFilter", "plannerSearch", "plannerClubSelect"].forEach((id) => $(id).value = ""); $("plannerSortSelect").value = "date"; state.plannerSort = { key: "date", dir: "asc" }; state.plannerLimit = 24; state.plannerFiltersOpen = false; renderPlanner(); });
  $("closeInfoSheet")?.addEventListener("click", closeInfoSheet);
  $("infoOverlay")?.addEventListener("click", (e) => {
    if (e.target?.id === "infoOverlay") closeInfoSheet();
  });
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".info-trigger");
    if (!trigger) return;
    const family = trigger.dataset.playerFamily || "";
    const playerName = trigger.dataset.playerName || "";
    const signals = (trigger.dataset.cardSignals || "").split("||").map((x) => x.trim()).filter(Boolean);
    openInfoSheet(trigger.dataset.infoKind, trigger.dataset.infoKey, {
      playerFamily: family,
      playerName,
      cardReason: trigger.dataset.cardReason || "",
      cardSignals: signals,
      cardRole: trigger.dataset.cardRole || ""
    });
  });
}

function fillSelects(full = state.fullHydrated) {
  const realTeams = [...state.teams.values()].filter((t) => t.real).sort((a, b) => countryName(normalizeCountryCode(a.fifa_code, a.team_name)).localeCompare(countryName(normalizeCountryCode(b.fifa_code, b.team_name))));
  $("countrySelect").innerHTML = realTeams.map((t) => {
    const code = normalizeCountryCode(t.fifa_code, t.team_name);
    return `<option value="${code}">${esc(countryName(code))}</option>`;
  }).join("");
  $("plannerTeam").innerHTML = `<option value="">All teams</option>` + realTeams.map((t) => {
    const code = normalizeCountryCode(t.fifa_code, t.team_name);
    return `<option value="${code}">${esc(countryName(code))}</option>`;
  }).join("");
  $("plannerStage").innerHTML = `<option value="">All stages</option>` + state.rows.stages.map((s) => `<option value="${esc(s.stage_name)}">${esc(s.stage_name)}</option>`).join("");
  if (!full) {
    $("hypeClubSelect").innerHTML = `<option value="">Club lens loading...</option>`;
    $("hypeClubSelect").disabled = true;
    $("clubWatchSelect").innerHTML = `<option value="">Club Watch loading...</option>`;
    $("clubWatchSelect").disabled = true;
    $("plannerClubSelect").innerHTML = `<option value="">Club lens loading...</option>`;
    $("plannerClubSelect").disabled = true;
    ["nationalityFilter", "clubFilter", "leagueFilter", "positionFilter"].forEach((id) => {
      const label = $(id)?.querySelector("option")?.textContent || "All";
      $(id).innerHTML = `<option value="">${esc(label)}</option>`;
    });
    return;
  }
  $("hypeClubSelect").disabled = false;
  $("clubWatchSelect").disabled = false;
  $("plannerClubSelect").disabled = false;
  const allClubNames = canonicalClubList(state.clubs, state.clubsRaw);
  state.clubs = allClubNames;
  state.clubWatchClubs = canonicalClubList(state.clubWatchClubs, state.clubsRaw).filter((club) => clubHasRenderableWatchRows(club));
  const clubOpts = allClubNames.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  const clubWatchOpts = state.clubWatchClubs.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  $("hypeClubSelect").innerHTML = `<option value="">No favourite club lens</option>${clubOpts}`;
  $("clubWatchSelect").innerHTML = state.clubWatchClubs.length
    ? `<option value="">Choose a club</option>${clubWatchOpts}`
    : `<option value="">No club data available</option>`;
  $("plannerClubSelect").innerHTML = `<option value="">Choose a club</option>${clubOpts}`;
  state.clubWatchClub = state.clubWatchClubs.includes(state.clubWatchClub) ? state.clubWatchClub : preferredClub();
  $("hypeClubSelect").value = state.activeClub;
  $("clubWatchSelect").value = state.clubWatchClub;
  uniqueOptions("nationalityFilter", [...new Set(state.worldCupPlayerPool.map((p) => p.code))].map((c) => [c, countryName(c)]), "All nationalities");
  uniqueOptions("clubFilter", canonicalClubList(state.worldCupPlayerPool.map((p) => p.club).filter(Boolean), state.clubsRaw).map((c) => [c, c]), "All clubs");
  uniqueOptions("leagueFilter", [...new Set(state.worldCupPlayerPool.map((p) => p.league).filter(Boolean))].sort().map((c) => [c, c]), "All leagues");
  uniqueOptions("positionFilter", ["Goalkeeper", "Defender", "Midfielder", "Forward", "Outfield"].map((p) => [p, p]), "All positions");
}

function uniqueOptions(id, vals, placeholder = "") {
  $(id).innerHTML = `${placeholder ? `<option value="">${esc(placeholder)}</option>` : ""}${vals.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("")}`;
}

function renderInitial() {
  applyClubTheme();
  $("matchCount").textContent = `${state.matches.length} fixtures`;
  $("teamCount").textContent = `${[...state.teams.values()].filter((t) => t.real).length} qualified teams`;
  $("playerCount").textContent = "Loading player pool";
  renderMatches();
  setActiveTab("matches");
}

function renderAll(resetActive = true) {
  applyClubTheme();
  $("matchCount").textContent = `${state.matches.length} fixtures`;
  $("teamCount").textContent = `${[...state.teams.values()].filter((t) => t.real).length} qualified teams`;
  $("playerCount").textContent = `${state.worldCupPlayerPool.length.toLocaleString()} qualified player-pool rows`;
  renderMatches();
  renderCountry();
  renderPlayers();
  renderClub();
  renderPlanner();
  if (resetActive) setActiveTab("matches");
}

function hasPlayerFilters() {
  return ["playerSearch", "nationalityFilter", "clubFilter", "leagueFilter", "positionFilter", "ageFilter"].some((id) => $(id)?.value);
}

function hasPlannerFilters() {
  return ["plannerTeam", "plannerDate", "plannerStage", "watchabilityFilter", "plannerSearch", "plannerClubSelect"].some((id) => $(id)?.value);
}

function updateControlVisibility() {
  const mobile = isMobileViewport();
  const playerFiltersVisible = state.playerList !== "key";
  $("playerFilters").classList.toggle("hidden", !playerFiltersVisible);
  $("playerFilters").classList.toggle("open", playerFiltersVisible && (!mobile || state.playerFiltersOpen || hasPlayerFilters()));
  $("playerMobileFilterToggle").classList.toggle("hidden", !playerFiltersVisible);
  $("playerMobileFilterToggle").textContent = playerFiltersVisible && mobile && (state.playerFiltersOpen || hasPlayerFilters()) ? "Hide filters" : "Show filters";
  $("playerMobileFilterToggle").setAttribute("aria-expanded", String(playerFiltersVisible && (state.playerFiltersOpen || hasPlayerFilters())));
  $("playerFiltersIntro").classList.toggle("hidden", !mobile || state.playerList === "key");
  $("resetPlayers").textContent = hasPlayerFilters() || state.compare.size ? "Reset filters" : "Reset page";
  $("clearClubFilters").classList.toggle("hidden", !$("clubSearch").value);
  $("resetMatches").textContent = state.activeClub ? "Clear club lens" : "Reset page";
  $("plannerFilters")?.classList.toggle("open", !mobile || state.plannerFiltersOpen || hasPlannerFilters());
  $("plannerMobileFilterToggle").textContent = mobile && (state.plannerFiltersOpen || hasPlannerFilters()) ? "Hide filters" : "Show filters";
  $("plannerMobileFilterToggle").setAttribute("aria-expanded", String(state.plannerFiltersOpen || hasPlannerFilters()));
  $("resetPlanner").textContent = hasPlannerFilters() ? "Reset filters" : "Reset page";
  $("showAllPlanner").classList.toggle("hidden", !["plannerTeam", "plannerDate", "plannerStage", "watchabilityFilter", "plannerSearch", "plannerClubSelect"].some((id) => $(id)?.value));
}

function renderMatches() {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  state.prioritizeClubLens = Boolean(state.activeClub);
  const ranked = state.matches.filter((m) => m.isFinalized).map((m) => {
    const hype = scoreMatch(m);
    return hype ? { ...m, hype } : null;
  }).filter(Boolean).sort((a, b) => {
    const base = b.hype.score - a.hype.score;
    if (!state.prioritizeClubLens) return base;
    return b.hype.supporterScore - a.hype.supporterScore || base;
  }).slice(0, 10);
  const headingEyebrow = state.prioritizeClubLens ? `${state.activeClub} supporter lens` : "Neutral watch guide";
  const headingSummary = state.prioritizeClubLens
    ? `${state.activeClub} mode ranks matches by how strong the club-linked World Cup angle feels.`
    : "Neutral ranking first; club lens stays off until you choose a club.";
  const chartNote = state.prioritizeClubLens
    ? "Bars and cards now use the selected club-lens score only."
    : "Bars and cards use the neutral watch score.";
  const scoreExplain = state.prioritizeClubLens
    ? `Club-lens mode starts from the neutral football context, then adds a supporter boost based on how many meaningful ${state.activeClub} World Cup links the match carries.`
    : "Neutral score combines team quality, player pull, closeness, story, and stage importance.";
  const hypeLabel = state.prioritizeClubLens ? "Selected club" : "No club lens";
  const resetText = state.prioritizeClubLens ? "Clear club lens" : "Reset page";
  const infoTitle = state.prioritizeClubLens ? "How club-lens mode works" : "How the score works";
  if ($("matchesEyebrow")) $("matchesEyebrow").textContent = headingEyebrow;
  if ($("matchesSummary")) $("matchesSummary").textContent = headingSummary;
  if ($("matchesChartNote")) $("matchesChartNote").textContent = chartNote;
  if ($("matchesScoreInfo")) $("matchesScoreInfo").textContent = scoreExplain;
  if ($("hypeClubLabel")) $("hypeClubLabel").textContent = hypeLabel;
  if ($("resetMatches")) $("resetMatches").textContent = resetText;
  if ($("matchesInfoTitle")) $("matchesInfoTitle").textContent = infoTitle;
  renderFreshnessStats();
  renderHypeBars("hypeChart", ranked);
  $("topMatches").innerHTML = ranked.map(matchCard).join("") || `<div class="compact-item">No finalized matches available for watch ranking yet.</div>`;
  updateControlVisibility();
  state.renderTimings.matches = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - started);
  window.__fanRadarLastRenderMatchesMs = state.renderTimings.matches;
}

function matchCard(m) {
  const c = m.hype.components;
  const primaryScore = state.prioritizeClubLens ? (m.hype.supporterScore ?? supporterScore(m.hype)) : m.hype.score;
  const primaryLabel = state.prioritizeClubLens ? `${state.activeClub} Lens Score` : "Neutral Watch Score";
  const supporter = state.activeClub ? `<span class="component-pill club-pill"><b>${esc(state.activeClub)} Lens</b>${fmt(m.hype.supporterScore)}</span>` : "";
  return `<article class="match-card" data-match="${m.id}">
    <div class="match-top"><div><span class="stage-chip">${esc(m.stage.stage_name)}</span><div class="teams">${esc(m.homeName)} vs ${esc(m.awayName)}</div></div><div class="hype-score"><strong>${fmt(primaryScore)}</strong><span>${esc(primaryLabel)}</span></div></div>
    ${scoreBar(primaryScore, tooltipText(m))}
    <div class="meta"><span>${esc(m.ist.label)} IST</span><span>${esc(m.city.venue_name)}, ${esc(m.city.city_name)}</span><span class="time-chip">${m.window}${m.ist.weekend ? " + Weekend" : ""}</span></div>
    <div class="breakdown">
      ${componentPill("Country quality", c.country, 30)}
      ${componentPill("Recognisable player pull", c.stars, 25)}
      ${componentPill("Match closeness", c.balance, 20)}
      ${componentPill("Storyline value", c.story, 15)}
      ${componentPill("Stage importance", c.stage, 10)}
      <span class="component-pill club-pill"><b>Club Relevance</b>${esc(clubRelevanceText(m.hype))}</span>
      ${supporter}
    </div>
    ${matchReasonHtml(m.hype.reasonBullets)}
  </article>`;
}

function matchReasonHtml(items = []) {
  const clean = items.filter(Boolean).slice(0, 3);
  return clean.length ? `<ul class="match-reasons">${clean.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : "";
}

function renderFreshnessStats() {
  const finalized = state.matches.filter((m) => m.isFinalized).length;
  const placeholders = state.matches.length - finalized;
  const scoreName = state.prioritizeClubLens ? `${state.activeClub} lens score` : "Neutral Watch Score";
  $("freshnessStats").innerHTML = [
    ["Finalized fixtures", finalized],
    ["Placeholder fixtures", placeholders],
    ["Eligible for scoring", finalized],
    ["Excluded from scoring", placeholders]
  ].map(([k, v]) => `<div class="mini-card ${placeholders && k.includes("Placeholder") ? "warning-card" : ""}"><span>${k}</span><strong>${v}</strong></div>`).join("") +
  (placeholders ? `<div class="freshness-warning">The updated fixture guide contains expected knockout placeholders. ${esc(scoreName)} is calculated only for fixtures with two finalized teams.</div>` : "") +
  (state.missingV3.length ? `<div class="freshness-warning">Some optional fan-guide layers are unavailable: ${esc(state.missingV3.join(", "))}. More curated names and story cards will appear when those layers are added.</div>` : "");
}

function renderHypeBars(id, matches) {
  const sorted = [...matches].sort((a, b) => hypeBarScore(b) - hypeBarScore(a) || `${a.homeName} ${a.awayName}`.localeCompare(`${b.homeName} ${b.awayName}`));
  $(id).innerHTML = sorted.map((m) => `<div class="hype-row" title="${esc(tooltipText(m))}">
    <span class="bar-label">${esc(m.homeName)} vs ${esc(m.awayName)}</span>
    ${scoreBar(hypeBarScore(m), tooltipText(m))}
    <strong>${fmt(hypeBarScore(m))}</strong>
  </div>`).join("");
}

function hypeBarScore(m) {
  return state.prioritizeClubLens ? (m.hype.supporterScore ?? supporterScore(m.hype)) : m.hype.score;
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
  const scoreLabel = state.prioritizeClubLens ? `${state.activeClub} lens ${fmt(m.hype.supporterScore ?? supporterScore(m.hype))}` : `Neutral score ${fmt(m.hype.score)}`;
  return `${scoreLabel} | Team quality ${fmt(c.country)}/30 | Player pull ${fmt(c.stars)}/25 | Closeness ${fmt(c.balance)}/20 | Story ${fmt(c.story)}/15 | Stage ${fmt(c.stage)}/10 | Club relevance ${clubRelevanceText(m.hype)}`;
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
  updateControlVisibility();
  setTimeout(wireXiControls, 0);
}

function stripCountryPlayerStatusLabels(html) {
  return html
    .replace(/\s*(?:\u00c2?\u00b7|\|)\s*squad not confirmed/gi, "")
    .replace(/\s*(?:\u00c2?\u00b7|\|)\s*not in reported squad/gi, "");
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
    const importanceNote = "Importance is a 1-10 curated fan relevance score: 10 means headline-level, 8-9 means major story or role-defining player, and lower scores are supporting tournament storylines. It is not an official squad-certainty score.";
    const groups = ["Goalkeeper", "Defender", "Midfielder", "Forward"].map((g) => {
      const list = keys.filter((p) => (p.position || p.roleGroup || p.role || "").includes(g) || (g === "Forward" && /winger|striker|forward/i.test(`${p.roleGroup} ${p.subRole}`)));
      if (list.length) {
        const items = list.map((p) => `<div class="short-item" title="${esc(importanceNote)}"><strong>${esc(p.name)}</strong><span>${esc(p.club || "Club not listed")} | ${esc(p.subRole || p.role || "Key player")} | Importance ${fmt(p.star / 10)}/10${p.eligibilityLabel ? ` | ${esc(p.eligibilityLabel)}` : ""}</span></div>`).join("");
        return `<div class="guide-card"><h3>${g}s</h3>${items}</div>`;
      }
      return `<div class="guide-card"><h3>${g}s</h3><p class="chart-note">No curated ${g.toLowerCase()}s listed yet.</p></div>`;
      return `<div class="guide-card"><h3>${g}s</h3>${list.length ? list.map((p) => `<div class="short-item"><strong>${esc(p.name)}</strong><span>${esc(p.club || "Club not listed")} · ${esc(p.subRole || p.role || "Key player")} · Importance ${fmt(p.star / 10)}${p.eligibilityLabel ? ` · ${esc(p.eligibilityLabel)}` : ""}</span></div>`).join("") : `<p class="chart-note">No curated ${g.toLowerCase()}s listed yet.</p>`}</div>`;
    }).join("");
    const guideText = countrySquadPending(c.code) ? "Curated player guide. Squad status is noted above." : "Squad-based fan guide.";
    return `<div class="compact-item"><strong>Key Players</strong><span>${guideText}</span></div><div class="compact-item"><strong>Importance score</strong><span>${importanceNote}</span></div><div class="overview-grid">${groups}</div>`;
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
  return `<div class="xi-toolbar"><div class="xi-toolbar__meta"><span class="stage-chip">${esc(xiGuide.formation)}</span><span class="xi-toolbar__title">Expected Playing XI</span></div><div class="xi-toolbar__actions"><button class="ghost-btn" id="resetXiSelection">Reset selection</button><label class="toggle-chip"><input type="checkbox" id="xiListToggle" ${state.xiShowList ? "checked" : ""}> <span>View as list</span></label><label class="toggle-chip"><input type="checkbox" id="xiRolesToggle" ${state.xiShowRoles ? "checked" : ""}> <span>Show roles</span></label><label class="toggle-chip"><input type="checkbox" id="xiClubsToggle" ${state.xiShowClubs ? "checked" : ""}> <span>Club labels</span></label></div></div>
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
  const canonical = resolveClubDisplayName(club);
  return CLUB_DISPLAY_SHORT[canonical] || canonical;
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
  const grouped = {
    def: outfield.filter(({ p }) => slotGroup(p) === "def"),
    mid: outfield.filter(({ p }) => slotGroup(p) === "mid"),
    att: outfield.filter(({ p }) => slotGroup(p) === "att")
  };
  const counts = lines.length >= 2 ? lines : [grouped.def.length, grouped.mid.length, grouped.att.length].filter(Boolean);
  const yLines = counts.length === 4 ? [72, 58, 42, 22] : counts.length === 2 ? [68, 28] : [72, 52, 24];
  const linePlayers = Array.from({ length: counts.length }, () => []);
  const ordered = outfield.slice().sort((a, b) => slotOrder(a.p.slot) - slotOrder(b.p.slot));

  ordered.forEach((candidate) => {
    const prefs = preferredLineIndexes(candidate.p, counts.length);
    const target = prefs.find((lineIndex) => linePlayers[lineIndex] && linePlayers[lineIndex].length < counts[lineIndex]);
    const fallback = counts.findIndex((count, lineIndex) => linePlayers[lineIndex].length < count);
    const lineIndex = target ?? fallback;
    if (lineIndex >= 0) linePlayers[lineIndex].push(candidate);
  });

  linePlayers.forEach((players, lineIndex) => {
    const sortedPlayers = players.sort((a, b) => slotOrder(a.p.slot) - slotOrder(b.p.slot));
    const xs = spreadX(sortedPlayers.length);
    sortedPlayers.forEach(({ i }, n) => out[i] = { x: xs[n], y: yLines[lineIndex] ?? 50 });
  });
  return out.map((p, i) => p || { x: 20 + (i % 4) * 20, y: 70 - Math.floor(i / 4) * 18 });
}

function slotGroup(p) {
  const slot = String(p.slot).toUpperCase();
  if (slot === "GK") return "gk";
  if (["DM", "CM", "AM", "LCM", "RCM", "CAM", "LM", "RM"].includes(slot) || /mid/i.test(p.group)) return "mid";
  if (["LB", "RB", "CB", "LCB", "RCB", "LWB", "RWB"].includes(slot) || /def/i.test(p.group)) return "def";
  return "att";
}

function slotOrder(slot = "") {
  const order = { LW: 1, LM: 1, LB: 1, LWB: 1, LCM: 2, LCB: 2, CM: 3, CB: 3, DM: 3, AM: 3, ST: 4, CF: 4, RCM: 5, RCB: 5, RW: 6, RM: 6, RB: 6, RWB: 6 };
  return order[String(slot).toUpperCase()] ?? 4;
}

function preferredLineIndexes(p, lineCount) {
  const slot = String(p.slot).toUpperCase();
  const group = slotGroup(p);
  if (lineCount === 2) return group === "def" ? [0, 1] : [1, 0];
  if (lineCount === 4) {
    if (group === "def") return [0, 1, 2, 3];
    if (["DM", "CM", "LCM", "RCM"].includes(slot)) return [1, 2, 0, 3];
    if (["AM", "CAM", "LW", "RW", "LM", "RM", "LAM", "RAM"].includes(slot)) return [2, 3, 1, 0];
    if (["ST", "CF", "SS"].includes(slot)) return [3, 2, 1, 0];
    return group === "mid" ? [1, 2, 3, 0] : [3, 2, 1, 0];
  }
  if (group === "def") return [0, 1, 2];
  if (group === "mid") return [1, 2, 0];
  return [2, 1, 0];
}

function spreadX(count) {
  if (count <= 1) return [50];
  const spacing = count === 2 ? 30 : count === 3 ? 26 : count === 4 ? 22 : Math.max(14, 78 / Math.max(1, count - 1));
  const start = 50 - (spacing * (count - 1)) / 2;
  return Array.from({ length: count }, (_, i) => +(start + i * spacing).toFixed(2));
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

function infoTrigger(kind, key, label = "i") {
  return `<button class="info-trigger" type="button" data-info-kind="${esc(kind)}" data-info-key="${esc(key)}" aria-label="Explain ${esc(key)}">${esc(label)}</button>`;
}

function formulaCardHtml(title, value) {
  return `<div class="formula-card"><strong>${esc(title)}</strong><p><code>${esc(value)}</code></p></div>`;
}

function metricInfoHtml(key, playerFamily = "") {
  const meta = METRIC_DETAILS[key];
  if (!meta) return `<p class="muted-note">No explainer available.</p>`;
  const familyCards = key === "roleScore"
    ? Object.entries(ROLE_SCORE_FAMILY_META)
        .map(([family, formula]) => formulaCardHtml(family, formula))
        .join("")
    : "";
  const familyNote = key === "roleScore" && playerFamily
    ? `<div class="formula-card"><strong>Current player family</strong><p>${esc(playerFamily)}</p></div>`
    : "";
  return `
    <p>${esc(meta.summary)}</p>
    <ul>${meta.bullets.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
    ${key === "roleScore" ? `<div class="formula-grid">${familyNote}${familyCards}</div>` : ""}
    ${key !== "roleScore" ? `<p class="muted-note">All inputs are normalized against the available club-form dataset before this display score is shown.</p>` : ""}
  `;
}

function cardInfoHtml(key, context = {}) {
  const meta = CLUB_CARD_META[key];
  if (!meta) return `<p class="muted-note">No explainer available.</p>`;
  const playerName = context.playerName || "";
  const reason = context.cardReason || "";
  const signals = (context.cardSignals || []).slice(0, 4);
  return `
    <p>${esc(reason || meta.summary)}</p>
    ${playerName ? `<div class="formula-card"><strong>Current winner</strong><p>${esc(playerName)}</p></div>` : ""}
    ${signals.length ? `<div class="formula-card"><strong>What mattered</strong><ul>${signals.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>` : ""}
  `;
}

function openInfoSheet(kind, key, context = {}) {
  const overlay = $("infoOverlay");
  const title = $("infoSheetTitle");
  const eyebrow = $("infoSheetEyebrow");
  const body = $("infoSheetBody");
  if (!overlay || !title || !eyebrow || !body) return;
  if (kind === "metric") {
    const meta = METRIC_DETAILS[key];
    title.textContent = meta?.title || "Metric explainer";
    eyebrow.textContent = meta?.eyebrow || "Metric explainer";
    body.innerHTML = metricInfoHtml(key, context.playerFamily || "");
  } else {
    const meta = CLUB_CARD_META[key];
    title.textContent = meta?.title || "Club Watch explainer";
    eyebrow.textContent = meta?.eyebrow || "Club Watch explainer";
    body.innerHTML = cardInfoHtml(key, context);
  }
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

function closeInfoSheet() {
  const overlay = $("infoOverlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

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

function clubStatusLegend(rows = []) {
  return rows.some((row) => /squad not confirmed/i.test(row?.eligibilityLabel || ""))
    ? `<span class="status-legend"><span class="status-dot pending"></span> Squad status not confirmed</span>`
    : "";
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
  $("comparisonCard").classList.toggle("hidden", !allowCompare);
  $("playerModeNote").innerHTML = playerModeCopy();
  const q = $("playerSearch").value.trim();
  const missingSearch = state.playerList !== "key" && q && !rows.length;
  $("playerSearchNote").classList.toggle("hidden", !missingSearch);
  $("playerSearchNote").textContent = missingSearch ? `No club-form row found for "${q}". The player may be outside the covered leagues or absent from the uploaded club-form data.` : "";
  renderSortableTable("playerTable", rows, state.playerSort, (sort) => state.playerSort = sort, allowCompare);
  renderRadar();
  updateControlVisibility();
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
  const headers = columns.map(([key, label]) => {
    const arrow = sortState.key === key ? (sortState.dir === "asc" ? " &uarr;" : " &darr;") : "";
    const explainable = ["attack", "creativity", "defense", "goalkeeping", "roleScore"].includes(key);
    return `<th><span class="th-label"><button class="sort-btn ${sortState.key === key ? "active-sort" : ""}" data-table="${id}" data-key="${key}" title="${esc(STAT_HELP[key] || `Sort by ${label}`)}">${label}${arrow}</button>${explainable ? infoTrigger("metric", key) : ""}</span></th>`;
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
    if (state.compare.size >= 4 && !state.compare.has(id)) {
      alert("Select up to four players for a clear comparison.");
      renderPlayers();
      return;
    }
    state.compare.set(id, p);
  } else state.compare.delete(id);
  renderRadar();
}

function renderRadar() {
  const players = [...state.compare.values()];
  $("compareNotice").textContent = players.length >= 2
    ? `Comparing ${players.length} ${players[0].broad.toLowerCase()} profiles.`
    : players.length === 1
      ? "Select more players from the same role group to build the comparison."
      : "Select up to four players from the same role group to compare.";
  $("radarCompare").innerHTML = players.length >= 2
    ? `<div class="radar-comparison-layout">${radarSvg(players)}${comparisonStoryPanel(players)}</div>`
    : `<div class="empty-radar">${players.length ? "One player selected. Select more players from the same role group to build the comparison." : "Select up to four players from the same role group to compare."}</div>`;
}

function radarAxes(role) {
  if (role === "Goalkeeper") return [["Save percentage", "savePct", "goalkeeping"], ["Saves", "saves90", "goalkeeping"], ["Clean sheets", "csPct", "goalkeeping"], ["Goals against control", "ga90", "goalkeeping"], ["Cross claims", "claims90", "goalkeeping"], ["Long passing", "longPass90", "progression"]];
  if (role === "Defender") return [["Tackles", "tklw90", "defense"], ["Interceptions", "int90", "defense"], ["Blocks", "blocks90", "defense"], ["Clearances", "clr90", "defense"], ["Aerial strength", "aerial90", "defense"], ["Progressive passing", "prgP90", "progression"]];
  if (role === "Midfielder") return [["Creativity", "creativity", "ast90"], ["Progressive passes", "prgP90", "progression"], ["Progressive carries", "prgC90", "progression"], ["Pass completion", "passCmp", "progression"], ["Ball recoveries", "recov90", "defense"], ["Defensive actions", "defense", "tklw90"]];
  return [["Goal threat", "gls90", "attack"], ["Expected goal threat", "xg", "attack"], ["Assists/creation", "ast90", "creativity"], ["Shot volume", "sh90", "attack"], ["Progressive carries", "prgC90", "progression"], ["Crosses/key passes", "crs90", "creativity"]];
}

function radarComparisonData(players) {
  const axes = radarAxes(players[0].broad);
  const comparable = state.worldCupPlayerPool.filter((p) => p.broad === players[0].broad);
  const axisKey = (p, axis) => axis.find((key, i) => i > 0 && Number.isFinite(p[key]));
  const scales = Object.fromEntries(axes.flatMap((axis) => axis.slice(1).map((key) => [key, minMax(comparable, key)])));
  const series = players.map((player) => ({
    player,
    axes: axes.map((axis) => {
      const key = axisKey(player, axis);
      const normalized = key ? normalize(player[key], scales[key]) : 0;
      return {
        label: axis[0],
        key,
        normalized,
        raw: key ? player[key] : null
      };
    })
  }));
  const axisSummaries = axes.map((axis, idx) => {
    const values = series.map((entry) => ({
      player: entry.player,
      label: axis[0],
      normalized: entry.axes[idx].normalized,
      raw: entry.axes[idx].raw
    })).sort((a, b) => b.normalized - a.normalized || a.player.name.localeCompare(b.player.name));
    const spread = (values[0]?.normalized ?? 0) - (values.at(-1)?.normalized ?? 0);
    const topGap = (values[0]?.normalized ?? 0) - (values[1]?.normalized ?? 0);
    return {
      label: axis[0],
      values,
      spread,
      topGap
    };
  });
  return { axes, series, axisSummaries };
}

function comparisonStoryBullets(players) {
  const { axisSummaries, series } = radarComparisonData(players);
  const bullets = [];
  const usedAxis = new Set();
  const strongestAxis = [...axisSummaries].sort((a, b) => b.topGap - a.topGap || b.spread - a.spread)[0];
  if (strongestAxis && strongestAxis.topGap >= 8) {
    bullets.push(`${strongestAxis.values[0].player.name} owns the clearest edge in ${strongestAxis.label}.`);
    usedAxis.add(strongestAxis.label);
  }
  const widestAxis = [...axisSummaries]
    .filter((axis) => !usedAxis.has(axis.label))
    .sort((a, b) => b.spread - a.spread || b.topGap - a.topGap)[0];
  if (widestAxis && widestAxis.spread >= 14) {
    bullets.push(`${widestAxis.values[0].player.name} opens the biggest gap on ${widestAxis.label}.`);
    usedAxis.add(widestAxis.label);
  }
  const closestAxis = [...axisSummaries]
    .filter((axis) => axis.values.length >= 2 && !usedAxis.has(axis.label))
    .sort((a, b) => a.topGap - b.topGap || a.spread - b.spread)[0];
  if (closestAxis && closestAxis.topGap <= 5) {
    bullets.push(`${closestAxis.label} is the tightest race here between ${closestAxis.values[0].player.name} and ${closestAxis.values[1].player.name}.`);
    usedAxis.add(closestAxis.label);
  }
  const balanceScores = series.map((entry) => {
    const values = entry.axes.map((axis) => axis.normalized);
    const avgScore = avg(values);
    const spread = Math.max(...values) - Math.min(...values);
    return { player: entry.player, avgScore, spread };
  }).sort((a, b) => a.spread - b.spread || b.avgScore - a.avgScore);
  if (balanceScores.length) {
    const mostBalanced = balanceScores[0];
    const nextBalanced = balanceScores[1];
    if (!nextBalanced || nextBalanced.spread - mostBalanced.spread >= 4) {
      bullets.push(`${mostBalanced.player.name} looks the most balanced all-round across this role map.`);
    }
  }
  const trailingAxis = [...axisSummaries]
    .filter((axis) => axis.values.length >= 2)
    .map((axis) => ({
      ...axis,
      trailingGap: axis.values[axis.values.length - 2].normalized - axis.values[axis.values.length - 1].normalized
    }))
    .sort((a, b) => b.trailingGap - a.trailingGap || b.spread - a.spread)[0];
  if (trailingAxis && trailingAxis.trailingGap >= 10) {
    bullets.push(`${trailingAxis.values.at(-1).player.name} falls furthest behind on ${trailingAxis.label}.`);
  }
  return bullets.filter(Boolean).slice(0, 5);
}

function comparisonStoryPanel(players) {
  const bullets = comparisonStoryBullets(players);
  if (!bullets.length) {
    return `<aside class="comparison-story-card"><h4>Comparison story</h4><ul><li>The selected players are tightly packed across these axes, so the radar itself is the clearest read here.</li></ul></aside>`;
  }
  return `<aside class="comparison-story-card"><h4>Comparison story</h4><ul>${bullets.map((bullet) => `<li>${esc(bullet)}</li>`).join("")}</ul></aside>`;
}

function radarSvg(players) {
  const { axes, series } = radarComparisonData(players);
  const size = 360, c = size / 2, r = 128;
  const colors = ["var(--green)", "var(--gold)", "var(--blue)", "var(--red)", "var(--lime)"];
  const dotRadius = players.length >= 4 ? 3 : players.length === 3 ? 3.5 : 4;
  const point = (i, val = 100) => { const angle = -Math.PI / 2 + i * Math.PI * 2 / axes.length; const rr = r * val / 100; return [c + Math.cos(angle) * rr, c + Math.sin(angle) * rr]; };
  const grid = [25, 50, 75, 100].map((v) => `<polygon points="${axes.map((_, i) => point(i, v).join(",")).join(" ")}" class="radar-grid"/>`).join("");
  const spokes = axes.map((a, i) => { const p = point(i); const lp = point(i, 116); return `<line x1="${c}" y1="${c}" x2="${p[0]}" y2="${p[1]}" class="radar-line"/><text x="${lp[0]}" y="${lp[1]}" text-anchor="middle">${a[0]}</text>`; }).join("");
  const polys = series.map((entry, pi) => {
    const values = entry.axes.map((axis, i) => ({ ...axis, pt: point(i, axis.normalized) }));
    const pts = values.map((v) => v.pt.join(",")).join(" ");
    const dots = values.map((v) => `<circle cx="${v.pt[0]}" cy="${v.pt[1]}" r="${dotRadius}" style="--radar:${colors[pi % colors.length]}" class="radar-dot"><title>${esc(entry.player.name)} | ${esc(v.label)}: ${fmt(v.normalized)} normalized${Number.isFinite(v.raw) ? ` | raw ${fmt(v.raw, 2)}` : ""}</title></circle>`).join("");
    return `<polygon points="${pts}" style="--radar:${colors[pi % colors.length]}" class="radar-poly"/><polyline points="${pts}" style="--radar:${colors[pi % colors.length]}" class="radar-stroke"/>${dots}`;
  }).join("");
  const legend = players.map((p, i) => `<span style="--dot:${colors[i % colors.length]}">${esc(p.name)}</span>`).join("");
  return `<div class="radar-card compare-${players.length}"><svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Player radar comparison">${grid}${spokes}${polys}</svg><div class="radar-legend">${legend}</div></div>`;
}

function clubMatches(a = "", b = "") {
  const ak = normalizeClubName(a);
  const bk = normalizeClubName(b);
  return Boolean(ak && bk && ak === bk);
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
  state.playersAll
    .filter((p) => clubMatches(p.club, club))
    .filter((p) => {
      const q = qualifiedCodes();
      if (!q.has(p.code)) return false;
      const status = playerEligibility(p.name, p.code, p.club);
      return status.eligible || status.pending;
    })
    .sort((a, b) => (b.roleScore || 0) - (a.roleScore || 0) || (b.min || 0) - (a.min || 0))
    .forEach((p) => {
      const kp = keyPlayersFor(p.code).find((x) => normalizePlayerName(x.name) === normalizePlayerName(p.name) && clubMatches(x.club || p.club, club));
      const registry = registryMatch(p.name, p.code, p.club);
      const status = playerEligibility(p.name, p.code, p.club);
      add({
        ...p,
        club: p.club || registry?.club || kp?.club || club,
        country: countryName(p.code),
        pos: kp?.subRole || kp?.roleGroup || registry?.positionGroup || p.subroleFamily || p.pos || p.broad,
        broad: broadGroup(registry?.positionGroup || kp?.roleGroup || kp?.role || p.broad || p.pos) || p.broad || "Midfielder",
        overall: kp?.star || p.overall || p.roleScore || 0,
        star: kp?.star || 0,
        tier: kp?.tier,
        subRole: kp?.subRole || p.subroleFamily,
        eligibilityLabel: status.label,
        keyPlayer: Boolean(kp)
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

function clubCardImportance(p) {
  return Number.isFinite(p?.star) && p.star > 0 ? p.star / 10 : null;
}

function clubCardTierBonus(p) {
  const rank = tierRank(p?.tier);
  if (rank === 1) return 12;
  if (rank === 2) return 7;
  if (rank === 3) return 3;
  return 0;
}

function clubCardMinutesSignal(p) {
  return Number.isFinite(p?.min) ? clamp(p.min / 1800 * 100) : null;
}

function clubCardMetric(p, key) {
  if (key === "creative") return Number.isFinite(p.creativity) ? p.creativity : avg([p.attack, p.roleScore]);
  if (key === "defender") return p.broad === "Goalkeeper" ? p.goalkeeping : avg([p.defense, /defensive midfielder/i.test(p.pos || "") ? p.roleScore : null]);
  return p.roleScore;
}

function clubCardScore(p, key) {
  const importance = clubCardImportance(p);
  const starSignal = Number.isFinite(importance) ? importance * 10 : 0;
  const roleScore = Number.isFinite(p.roleScore) ? p.roleScore : 0;
  const minutes = clubCardMinutesSignal(p) ?? 45;
  const metric = clubCardMetric(p, key) || 0;
  const tier = clubCardTierBonus(p);
  if (key === "young") {
    const ageLift = Number.isFinite(p.age) ? clamp((26 - p.age) * 7, 0, 35) : 0;
    return metric * 0.25 + roleScore * 0.25 + starSignal * 0.25 + minutes * 0.10 + ageLift + tier;
  }
  if (key === "creative") return metric * 0.45 + starSignal * 0.25 + roleScore * 0.20 + (p.attack || 0) * 0.10 + tier;
  if (key === "defender") return metric * 0.50 + starSignal * 0.20 + roleScore * 0.20 + minutes * 0.10 + tier;
  return starSignal * 0.45 + roleScore * 0.35 + minutes * 0.12 + (p.keyPlayer ? 8 : 0) + tier;
}

function bestClubCardCandidate(rows, key, predicate, used) {
  const eligible = rows.filter(predicate);
  const unused = eligible.filter((p) => !used.has(normalizePlayerName(p.name)));
  const pool = unused.length ? unused : eligible;
  return [...pool].sort((a, b) => clubCardScore(b, key) - clubCardScore(a, key) || (b.star || 0) - (a.star || 0) || (b.roleScore || 0) - (a.roleScore || 0))[0] || null;
}

function isClubCreativeProfile(p) {
  const text = `${p.pos || ""} ${p.broad || ""} ${p.subRole || ""}`;
  if (/goalkeeper|centre-back|center-back|defensive midfielder|full-back|wing-back/i.test(text)) return false;
  if (/creator|playmaker|winger|attacking|forward|striker|wide/i.test(text)) return true;
  return p.broad === "Midfielder" && Number.isFinite(p.creativity) && p.creativity >= 45;
}

function clubCardSignals(p, key) {
  if (!p) return [];
  const signals = [
    `In the current squad-linked player pool for ${p.country}`,
    `Role: ${p.pos || p.broad || "key player"}`
  ];
  const importance = clubCardImportance(p);
  if (Number.isFinite(importance)) signals.push(`Fan importance ${fmt(importance)}/10`);
  if (Number.isFinite(p.roleScore)) signals.push(`Club-form role score ${fmt(p.roleScore)}/100`);
  if (Number.isFinite(p.min)) signals.push(`${fmt(p.min)} club minutes`);
  if (key === "young" && Number.isFinite(p.age)) signals.push(`Age ${fmt(p.age)}`);
  if (key === "creative" && Number.isFinite(p.creativity)) signals.push(`Creativity signal ${fmt(p.creativity)}/100`);
  if (key === "defender" && p.broad === "Goalkeeper" && Number.isFinite(p.goalkeeping)) signals.push(`Goalkeeping signal ${fmt(p.goalkeeping)}/100`);
  if (key === "defender" && p.broad !== "Goalkeeper" && Number.isFinite(p.defense)) signals.push(`Defensive signal ${fmt(p.defense)}/100`);
  return signals;
}

function clubCardRoleStory(p, key) {
  const importance = clubCardImportance(p);
  if (key === "young") return Number.isFinite(p.age) && p.age <= 23 ? "young breakout profile" : "younger player with a strong role case";
  if (key === "creative") return "best creator fit";
  if (key === "defender") return p.broad === "Goalkeeper" ? "goalkeeping anchor" : "defensive anchor";
  if (Number.isFinite(importance) && importance >= 9) return "headline player";
  if (p.keyPlayer) return "key-player pick";
  return "form-backed pick";
}

function clubCardReason(p, key, label) {
  if (!p) return "";
  const role = p.pos || p.broad || "key player";
  if (key === "young") {
    const ageText = Number.isFinite(p.age) ? ` at age ${fmt(p.age)}` : "";
    return `${p.name} gets this card as a ${role}${ageText} with the best mix of role fit, minutes, and upside among this club's squad-linked players.`;
  }
  if (key === "creative") {
    return `${p.name} gets this card because his ${role} profile is the clearest creator story from this club for ${p.country}.`;
  }
  if (key === "defender") {
    return `${p.name} gets this card because his ${role} role gives this club its clearest defensive-stability story.`;
  }
  return `${p.name} gets this card as the strongest overall ${role} story from this club, balancing fan relevance, role fit, and recent club-form support.`;
}

function clubCardObject(key, label, player, fallback) {
  if (!player) return { key, label, value: fallback, player: null, reason: "", shortReason: "", signals: [] };
  const signals = clubCardSignals(player, key);
  const roleStory = clubCardRoleStory(player, key);
  return {
    key,
    label,
    player,
    value: `${player.name} | ${player.country}`,
    roleStory,
    reason: clubCardReason(player, key, label),
    shortReason: `${roleStory}; ${signals.slice(2, 4).join("; ")}`.replace(/; $/, ""),
    signals
  };
}

function clubInsightCards(rows) {
  const used = new Set();
  const addUsed = (p) => { if (p) used.add(normalizePlayerName(p.name)); };
  const all = (p) => Boolean(p);
  const top = bestClubCardCandidate(rows, "top", all, used);
  addUsed(top);
  const young = bestClubCardCandidate(rows, "young", (p) => Number.isFinite(p.age) && p.age <= 26, used)
    || bestClubCardCandidate(rows, "young", all, used);
  addUsed(young);
  const creative = bestClubCardCandidate(rows, "creative", isClubCreativeProfile, used)
    || bestClubCardCandidate(rows, "creative", (p) => Number.isFinite(p.creativity) && p.creativity >= 55, used);
  addUsed(creative);
  const defender = bestClubCardCandidate(rows, "defender", (p) => p.broad === "Goalkeeper" || p.broad === "Defender" || /defensive midfielder|centre-back|center-back|full-back|wing-back|goalkeeper/i.test(`${p.pos} ${p.subRole}`), used);
  return [
    clubCardObject("top", "Top performer", top, "No World Cup-linked player"),
    clubCardObject("young", "Young player to watch", young, "No young profile found"),
    clubCardObject("creative", "Most creative", creative, "No creator profile found"),
    clubCardObject("defender", "Defensive anchor", defender, "Not enough defender data")
  ];
}

function renderClub() {
  const club = state.clubWatchClub || preferredClub();
  if ($("clubWatchSelect").value !== club) $("clubWatchSelect").value = club;
  $("clubTitle").textContent = `${club || "Club"} World Cup Watch`;
  if (!club || !state.clubWatchClubs.includes(club)) {
    $("clubSummary").innerHTML = `<div class="mini-card"><span>Choose a club</span><strong>Club Watch</strong></div>`;
    $("clubCountryChart").innerHTML = `<div class="compact-item">Club Watch only shows clubs with renderable World Cup-linked player rows.</div>`;
    $("clubPositionChart").innerHTML = `<div class="compact-item">Club Watch only shows clubs with renderable World Cup-linked player rows.</div>`;
    $("clubTable").innerHTML = `<div class="compact-item">No valid club is available for this view right now.</div>`;
    $("clubMatchups").innerHTML = `<div class="compact-item">No curated matchup view is available without renderable club data.</div>`;
    $("notShownList").innerHTML = `<div class="compact-item">No hidden players to show.</div>`;
    $("clubStatusLegend").innerHTML = "";
    return;
  }
  const clubQ = $("clubSearch").value.toLowerCase();
  const shown = clubWatchShownPlayers(club).filter((p) => !clubQ || `${p.name} ${p.country} ${p.pos}`.toLowerCase().includes(clubQ)).sort((a, b) => (b.star || 0) - (a.star || 0) || (b.roleScore || 0) - (a.roleScore || 0));
  const hidden = clubHiddenPlayers(club);
  const cards = clubInsightCards(shown);
  $("clubSummary").innerHTML = cards.map((card) => clickableMini(card, "club insight")).join("");
  $("clubStatusLegend").innerHTML = clubStatusLegend(shown);
  const byCountry = countBy(shown, (p) => p.country);
  const byPos = countBy(shown, (p) => p.broad);
  renderBars("clubCountryChart", Object.entries(byCountry).map(([label, value]) => ({ label, value })), Math.max(1, ...Object.values(byCountry)));
  renderBars("clubPositionChart", Object.entries(byPos).map(([label, value]) => ({ label, value })), Math.max(1, ...Object.values(byPos)));
  renderSortableTable("clubTable", shown, state.clubSort, (sort) => state.clubSort = sort, false);
  $("notShownList").innerHTML = hidden.length ? hidden.slice(0, 80).map((p) => `<div class="compact-item"><strong>${esc(p.name)}</strong><span>${esc(p.country)} | ${esc(p.pos)} | ${esc(p.reason)}</span></div>`).join("") : `<div class="compact-item">No hidden players for this club under the current World Cup-linked rules.</div>`;
  renderClubMatchups(club, shown);
  renderRadar();
  updateControlVisibility();
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
  const clubLens = Boolean(plannerClub);
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
  updateControlVisibility();
}

function plannerClubPlayers(m) {
  const club = $("plannerClubSelect")?.value;
  return clubPlayersForMatch(m, club);
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
  if (!list.length) return `<div class="compact-item">${$("plannerClubSelect").value ? "No fixtures found for this club lens." : "No matches fit those filters."}</div>`;
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
  if (!$("plannerClubSelect").value) return "Choose a club lens to add a supporter angle.";
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
  const sorted = [...data].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0) || String(a.label).localeCompare(String(b.label)));
  $(id).innerHTML = sorted.length ? sorted.map((d) => {
    const pct = clamp(d.value / max * 100);
    return `<div class="bar-row" title="${esc(d.label)}: ${fmt(d.value)}"><span class="bar-label">${esc(d.label)}</span><span class="bar-track"><span class="bar-fill ${hypeClass(pct)}" style="--score:${pct}%"></span></span><strong>${fmt(d.value)}</strong></div>`;
  }).join("") : `<div class="compact-item">Not enough matched player data for this view.</div>`;
}

function clickableMini(card, label) {
  const reason = card.reason || "";
  const signals = (card.signals || []).join("||");
  const info = card.player ? `<button class="info-trigger" type="button" data-info-kind="club-card" data-info-key="${esc(card.key)}" data-player-name="${esc(card.player.name)}" data-card-role="${esc(card.roleStory || "")}" data-card-reason="${esc(reason)}" data-card-signals="${esc(signals)}" aria-label="Explain ${esc(card.label)}">i</button>` : "";
  const value = card.player
    ? `<strong class="mini-card__value"><span class="mini-card__name">${esc(card.player.name)}</span><span class="mini-card__country">${esc(card.player.country)}</span></strong>`
    : `<strong>${esc(card.value)}</strong>`;
  return `<article class="mini-card" aria-label="${esc(label)}" title="${card.player ? `Open ${esc(card.label)} explanation` : ""}"><div class="mini-card__head"><span>${esc(card.label)}</span>${info}</div>${value}</article>`;
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
