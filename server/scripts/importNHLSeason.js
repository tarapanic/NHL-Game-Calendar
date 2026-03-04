import "dotenv/config";
import { pool } from "../src/db/pool.js";

const BASE = "https://api-web.nhle.com/v1";

// NHL season codes
const SEASON_LABEL = process.argv[2]; // e.g. "2024-2025"
const SEASON_CODE  = process.argv[3]; // e.g. "20242025"

if (!SEASON_LABEL || !SEASON_CODE) {
  console.error("Usage: node scripts/importNHLSeason.js <SEASON_LABEL> <SEASON_CODE>");
  process.exit(1);
}

function seasonStartYear(label) {
  return Number(String(label).slice(0, 4));
}

async function ensureSeason(label) {
  const startY = seasonStartYear(label);
  const start_date = `${startY}-10-01`;
  const end_date = `${startY + 1}-04-30`;

  const existing = await pool.query("SELECT id FROM seasons WHERE label=$1", [label]);
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await pool.query(
    "INSERT INTO seasons (label, start_date, end_date) VALUES ($1,$2,$3) RETURNING id",
    [label, start_date, end_date]
  );
  return inserted.rows[0].id;
}

async function upsertTeam(name, abbrev) {
  // teams.abbrev is UNIQUE in schema
  const q = `
    INSERT INTO teams (name, abbrev)
    VALUES ($1,$2)
    ON CONFLICT (abbrev) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;
  const { rows } = await pool.query(q, [name, abbrev]);
  return rows[0].id;
}

async function getTeamsAbbrevs() {
  // standings/now returns team abbreviations in practice for current season
  const res = await fetch(`${BASE}/standings/now`);
  if (!res.ok) throw new Error(`Failed standings/now: ${res.status}`);
  const data = await res.json();

  // this API structure can vary a bit
  const abbrevs = new Set();
  const rows = data?.standings || data?.standingsTable?.standings || [];

  for (const r of rows) {
    const a =
      r?.teamAbbrev?.default ||
      r?.teamAbbrev ||
      r?.team?.abbrev ||
      r?.team?.triCode;

    const name =
      r?.teamName?.default ||
      r?.teamName ||
      r?.team?.name?.default ||
      r?.team?.name;

    if (a) {
      abbrevs.add(String(a).toUpperCase());
      // optional: also upsert team name
      if (name) await upsertTeam(String(name), String(a).toUpperCase());
    }
  }

  if (abbrevs.size < 10) {
    throw new Error(
      "Could not parse team abbreviations from standings/now (API response shape may have changed)."
    );
  }
  return [...abbrevs];
}

function toTimeHHMM(startTimeUTC) {
  if (!startTimeUTC) return null;
  // example: "2025-10-10T23:00:00Z" -> "23:00"
  return String(startTimeUTC).slice(11, 16);
}

async function importTeamSeason(teamAbbrev, seasonId) {
  const url = `${BASE}/club-schedule-season/${teamAbbrev}/${SEASON_CODE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${teamAbbrev} schedule: ${res.status}`);

  const data = await res.json();
  const games = data?.games || data?.gameWeek?.flatMap((w) => w?.games || []) || [];

  for (const g of games) {
    const nhlGameId = g?.id ?? g?.gameId;
    const gameDate = g?.gameDate;
    const startTimeUTC = g?.startTimeUTC;

    const homeAbbrev = (g?.homeTeam?.abbrev || g?.homeTeam?.abbrev?.default || g?.homeTeam?.triCode || "").toUpperCase();
    const awayAbbrev = (g?.awayTeam?.abbrev || g?.awayTeam?.abbrev?.default || g?.awayTeam?.triCode || "").toUpperCase();

    const venue = g?.venue?.default || g?.venue || null;
    const status = g?.gameState || g?.status || "scheduled";

    if (!nhlGameId || !gameDate || !homeAbbrev || !awayAbbrev) continue;

    const homeId = await upsertTeam(homeAbbrev, homeAbbrev);
    const awayId = await upsertTeam(awayAbbrev, awayAbbrev);

        await pool.query(
        `
        INSERT INTO games (
            nhl_game_id, season_id, game_date, start_time,
            home_team_id, away_team_id, venue, status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT DO NOTHING
        `,
        [nhlGameId, seasonId, gameDate, toTimeHHMM(startTimeUTC), homeId, awayId, venue, status]
        );

  }
}

async function main() {
  const seasonId = await ensureSeason(SEASON_LABEL);

  const teams = await getTeamsAbbrevs();
  console.log(`Found ${teams.length} teams. Importing season ${SEASON_CODE}...`);

  for (const t of teams) {
    console.log(`Importing ${t}...`);
    await importTeamSeason(t, seasonId);
  }

  const count = await pool.query("SELECT COUNT(*)::int AS n FROM games WHERE season_id=$1", [seasonId]);
  console.log(`Done. Games in DB for ${SEASON_LABEL}: ${count.rows[0].n}`);

  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  try { await pool.end(); } catch {}
  process.exit(1);
});