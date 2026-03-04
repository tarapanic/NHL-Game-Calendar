import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

// GET /api/months?seasonId=1&teamId=5
// returns something like: [10,11,12,1,2,3,4,5,6,7]
router.get("/", async (req, res) => {
  try {
    const seasonId = Number(req.query.seasonId);
    const teamId = Number(req.query.teamId);

    if (!seasonId || !teamId) {
      return res.status(400).json({ error: "seasonId and teamId are required" });
    }

    const { rows } = await pool.query(
      `
      SELECT DISTINCT EXTRACT(MONTH FROM g.game_date)::int AS m
      FROM games g
      JOIN teams ht ON ht.id = g.home_team_id
      JOIN teams at ON at.id = g.away_team_id
      WHERE g.season_id = $1
        AND ($2::int IS NULL OR g.home_team_id = $2 OR g.away_team_id = $2)
      ORDER BY m ASC
      `,
      [seasonId, teamId]
    );

    // convert months to your NHL “season order” (Oct..Jul)
    const order = [10,11,12,1,2,3,4,5,6,7];
    const months = rows.map(r => r.m).filter(m => order.includes(m));
    months.sort((a, b) => order.indexOf(a) - order.indexOf(b));

    res.json(months);
  } catch (err) {
    console.error("GET /api/months error:", err);
    res.status(500).json({ error: "Failed to load months" });
  }
});

export default router;