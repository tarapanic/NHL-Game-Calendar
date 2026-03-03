import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

// GET /api/seasons
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, label, start_date, end_date FROM seasons ORDER BY start_date DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /api/seasons error:", err);
    res.status(500).json({ error: "Failed to load seasons" });
  }
});

export default router;