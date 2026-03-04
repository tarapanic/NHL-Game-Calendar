import { useEffect, useMemo, useState } from "react";
import { getSeasons, getGames, getGameById, getTeams } from "./api";
import MonthGrid from "./components/MonthGrid";
import GameModal from "./components/GameModal";

function monthFullName(m) {
  return (
    {
      1: "January",
      2: "February",
      3: "March",
      4: "April",
      5: "May",
      6: "June",
      7: "July",
      10: "October",
      11: "November",
      12: "December",
    }[m] || ""
  );
}

const arrowBtnStyle = {
  border: "none",
  background: "#111827",
  color: "#fff",
  borderRadius: 999,
  width: 44,
  height: 44,
  cursor: "pointer",
  fontSize: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
};

const selectStyle = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "white",
  fontSize: 14,
};


function getSeasonStartYear(label) {
  // expects "2025-2026"
  const start = Number(String(label).slice(0, 4));
  return Number.isFinite(start) ? start : new Date().getFullYear();
}

function calcYearFromSeason(seasonLabel, month) {
  const startYear = getSeasonStartYear(seasonLabel);
  // Oct-Dec => start year, Jan-Apr => start year + 1
  return month >= 10 ? startYear : startYear + 1;
}

export default function App() {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [month, setMonth] = useState(10); // start at October
  const [games, setGames] = useState([]);

  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  const [error, setError] = useState("");

  const [modalGame, setModalGame] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState("");

  // pick the current season object
  const selectedSeason = useMemo(
    () => seasons.find((s) => String(s.id) === String(seasonId)),
    [seasons, seasonId]
  );

  // derive year from season + month
  const year = useMemo(() => {
    if (!selectedSeason) return new Date().getFullYear();
    return calcYearFromSeason(selectedSeason.label, month);
  }, [selectedSeason, month]);

  // select right team abbreviation
  const selectedTeamAbbrev = useMemo(() => {
  const t = teams.find((x) => String(x.id) === String(teamId));
  return t?.abbrev || "";
  }, [teams, teamId]);

const MONTHS = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7]; // including playoffs till july

const canPrev = month !== MONTHS[0];          // not october
const canNext = month !== MONTHS[MONTHS.length - 1]; // not july

  function goPrevMonth() {
  setMonth((m) => {
    const idx = MONTHS.indexOf(m);
    if (idx <= 0) return m;   // stop (no loop)
    return MONTHS[idx - 1];
  });
  }

  function goNextMonth() {
  setMonth((m) => {
    const idx = MONTHS.indexOf(m);
    if (idx === -1 || idx >= MONTHS.length - 1) return m; // stop (no loop)
    return MONTHS[idx + 1];
  });
  }

  // Load seasons once
  useEffect(() => {
    async function loadSeasons() {
      try {
        setError("");
        setLoadingSeasons(true);
        const data = await getSeasons();
        setSeasons(data);
        if (data.length > 0) setSeasonId(String(data[0].id));
      } catch (e) {
        setError(e.message || "Failed to load seasons");
      } finally {
        setLoadingSeasons(false);
      }
    }
    loadSeasons();
  }, []);

  // Load games when season/month/year changes
  useEffect(() => {
    if (!seasonId || !teamId) return;

    async function loadGames() {
      try {
        setError("");
        setLoadingGames(true);
        const data = await getGames({ seasonId, year, month, teamId });
        setGames(data);
      } catch (e) {
        setError(e.message || "Failed to load games");
      } finally {
        setLoadingGames(false);
      }
    }

    loadGames();
  }, [seasonId, year, month, teamId]);


  useEffect(() => {
  async function loadTeams() {
    try {
      const data = await getTeams();
      setTeams(data);

      // default to TOR if found, otherwise first team
      const tor = data.find(t => t.abbrev === "TOR");
      setTeamId(String((tor || data[0])?.id || ""));
    } catch (e) {
      setError(e.message || "Failed to load teams");
    }
  }
  loadTeams();
}, []);
  
return (
      <div
      style={{
        padding: 20,
        fontFamily: "system-ui, Arial",
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
    <h1>NHL Game Calendar</h1>

    {loadingSeasons && <p>Loading seasons…</p>}
    {error && <p style={{ color: "crimson" }}>{error}</p>}

    {!loadingSeasons && (
      <>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10 }}>
          <label>
            Season:{" "}
            <select style={selectStyle} value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Team:{" "}
            <select style={selectStyle} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.abbrev}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* calendar navigation header */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
            marginTop: 20,
            marginBottom: 30,
          }}
        >
<button 
  className="icon-btn"
  onClick={goPrevMonth} 
  style={arrowBtnStyle} 
  disabled={!canPrev}
  onMouseEnter={e => e.currentTarget.style.background = "#1f2937"}
  onMouseLeave={e => e.currentTarget.style.background = "#111827"}
>
  ◀
</button>

          <div
            style={{
              minWidth: 260,
              textAlign: "center",
              padding: "10px 20px",
              borderTop: "1px solid #ccc",
              borderBottom: "1px solid #ccc",
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: 1,
            }}
          >
            {monthFullName(month)} {year}
          </div>

<button 
  className="icon-btn"
  onClick={goNextMonth} 
  style={arrowBtnStyle} 
  disabled={!canNext}
  onMouseEnter={e => e.currentTarget.style.background = "#1f2937"}
  onMouseLeave={e => e.currentTarget.style.background = "#111827"}
>
  ▶
</button>
        </div>
      </>
    )}

    {loadingGames && <p>Loading games…</p>}

    <MonthGrid
      year={year}
      month={month}
      games={games}
      selectedTeamAbbrev={selectedTeamAbbrev}
      onGameClick={async (g) => {
        try {
          setModalLoading(true);
          const fullGame = await getGameById(g.id);
          setModalGame(fullGame);
        } catch (err) {
          console.error(err);
        } finally {
          setModalLoading(false);
        }
      }}
    />

    {modalLoading && <p>Loading game details...</p>}

    <GameModal game={modalGame} onClose={() => setModalGame(null)} />
  </div>
);
}