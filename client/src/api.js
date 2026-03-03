const API_BASE = import.meta.env.VITE_API_BASE;

export async function getSeasons() {
  const res = await fetch(`${API_BASE}/api/seasons`);
  if (!res.ok) throw new Error("Failed to load seasons");
  return res.json();
}

export async function getGames({ seasonId, year, month, teamId }) {
  const url = new URL(`${API_BASE}/api/games`);
  url.searchParams.set("seasonId", seasonId);
  url.searchParams.set("year", year);
  url.searchParams.set("month", month);
  if (teamId) url.searchParams.set("teamId", teamId);

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load games");
  return res.json();
}

export async function getGameById(id) {
  const res = await fetch(`${API_BASE}/api/games/${id}`);
  if (!res.ok) throw new Error("Failed to load game details");
  return res.json();
}

export async function getTeams() {
  const res = await fetch(`${API_BASE}/api/teams`);
  if (!res.ok) throw new Error("Failed to load teams");
  return res.json();
}