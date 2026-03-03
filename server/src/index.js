import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db/pool.js";
import seasonsRouter from "./routes/seasons.js";
import gamesRouter from "./routes/games.js";
import teamsRouter from "./routes/teams.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// CORS: allow localhost in dev, and allow Render / others in production
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true, // true = allow all
  })
);

app.use(express.json());
app.use("/api/seasons", seasonsRouter);
app.use("/api/games", gamesRouter);
app.use("/api/teams", teamsRouter);

app.get("/health", (req, res) => {
  res.json({ status: "API running" });
});

// DB test route
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve the built React app
app.use(express.static(path.join(__dirname, "../../client/dist")));

// don’t swallow /api routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
