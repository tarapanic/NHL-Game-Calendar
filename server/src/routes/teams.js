import express from "express";
import { pool } from "../db/pool.js";

const router = express.Router();

// GET /api/teams
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, abbrev FROM teams ORDER BY name"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /api/teams error:", err);
    res.status(500).json({ error: "Failed to load teams" });
  }
});

export default router;