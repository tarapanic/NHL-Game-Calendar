export async function getSeasons() {
  const res = await fetch(`/api/seasons`);
  if (!res.ok) throw new Error("Failed to load seasons");
  return res.json();
}

export async function getGames({ seasonId, year, month, teamId }) {
  const url = new URL(`/api/games`, window.location.origin);
  url.searchParams.set("seasonId", seasonId);
  url.searchParams.set("year", year);
  url.searchParams.set("month", month);
  if (teamId) url.searchParams.set("teamId", teamId);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load games");
  return res.json();
}

export async function getMonths({ seasonId, teamId }) {
  const url = new URL(`/api/months`, window.location.origin);
  url.searchParams.set("seasonId", seasonId);
  if (teamId) url.searchParams.set("teamId", teamId);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load months");
  return res.json();
}

export async function getGameById(id) {
  const res = await fetch(`/api/games/${id}`);
  if (!res.ok) throw new Error("Failed to load game details");
  return res.json();
}

export async function getTeams() {
  const res = await fetch(`/api/teams`);
  if (!res.ok) throw new Error("Failed to load teams");
  return res.json();
}