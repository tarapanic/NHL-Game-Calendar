import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { pool } from "../src/db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ""));
    return row;
  });
}

async function ensureTeam(abbrev) {
  const { rows } = await pool.query("SELECT id FROM teams WHERE abbrev=$1", [abbrev]);
  if (rows[0]) return rows[0].id;

  // fallback name if not found
  const name = abbrev === "TOR" ? "Toronto Maple Leafs" : abbrev;

  const inserted = await pool.query(
    "INSERT INTO teams (name, abbrev) VALUES ($1,$2) RETURNING id",
    [name, abbrev]
  );
  return inserted.rows[0].id;
}

async function ensureSeason(label, start_date, end_date) {
  const { rows } = await pool.query("SELECT id FROM seasons WHERE label=$1", [label]);
  if (rows[0]) return rows[0].id;

  const inserted = await pool.query(
    "INSERT INTO seasons (label, start_date, end_date) VALUES ($1,$2,$3) RETURNING id",
    [label, start_date, end_date]
  );
  return inserted.rows[0].id;
}

async function main() {
  const seasonLabel = "2025-2026";
  const seasonId = await ensureSeason(seasonLabel, "2025-10-01", "2026-04-30");

  const csvPath = path.join(__dirname, "../db/leafs_2025_2026.csv");
  const text = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(text);

  let insertedCount = 0;

  for (const r of rows) {
    const homeId = await ensureTeam(r.home_abbrev);
    const awayId = await ensureTeam(r.away_abbrev);

    const result = await pool.query(
      `
      INSERT INTO games (season_id, game_date, start_time, home_team_id, away_team_id, venue)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT DO NOTHING
      `,
      [seasonId, r.game_date, r.start_time || null, homeId, awayId, r.venue || null]
    );

    // pg doesn't return affected rows count easily here
    insertedCount++;
  }

  console.log(`Imported ${insertedCount} rows (duplicates ignored).`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});