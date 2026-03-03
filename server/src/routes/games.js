import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

// GET /api/games?seasonId=1&year=2025&month=10
router.get("/", async (req, res) => {
  try {
    const seasonId = Number(req.query.seasonId);
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const teamId = req.query.teamId ? Number(req.query.teamId) : null;

    if (!seasonId || !year || !month) {
      return res.status(400).json({ error: "seasonId, year, month are required" });
    }

    const start = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
    const end = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);

        let sql = `
    SELECT g.id, g.game_date, g.start_time, g.venue, g.status,
            ht.abbrev AS home, at.abbrev AS away
    FROM games g
    JOIN teams ht ON ht.id = g.home_team_id
    JOIN teams at ON at.id = g.away_team_id
    WHERE g.season_id = $1
        AND g.game_date >= $2::date
        AND g.game_date <  $3::date
    `;

    const params = [seasonId, start, end];

    if (teamId) {
    params.push(teamId);
    sql += `
        AND (g.home_team_id = $4 OR g.away_team_id = $4)
    `;
    }

    sql += `
    ORDER BY g.game_date ASC, g.start_time ASC NULLS LAST
    `;

    const { rows } = await pool.query(sql, params);

    res.json(rows);
  } catch (err) {
    console.error("GET /api/games error:", err);
    res.status(500).json({ error: "Failed to load games" });
  }
});

// GET /api/games/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { rows } = await pool.query(
      `
      SELECT g.*, 
             ht.name AS home_name, 
             at.name AS away_name,
             ht.abbrev AS home_abbrev,
             at.abbrev AS away_abbrev
      FROM games g
      JOIN teams ht ON ht.id = g.home_team_id
      JOIN teams at ON at.id = g.away_team_id
      WHERE g.id = $1
      `,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("GET /api/games/:id error:", err);
    res.status(500).json({ error: "Failed to load game" });
  }
});

export default router;