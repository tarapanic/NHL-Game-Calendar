// client/src/components/MonthGrid.jsx
import { teamLogoMap } from "../utils/teamLogos";

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatLocalTime(game_date, start_time) {
  if (!game_date || !start_time) return "TBD";

  const hhmm = String(start_time).slice(0, 5);
  const iso = `${String(game_date).slice(0, 10)}T${hhmm}:00Z`;
  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) return hhmm;

  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildCalendarCells(year, month) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startDayOfWeek = firstOfMonth.getDay(); // 0=Sun

  // grid starts on the Sunday before the 1st
  const gridStart = new Date(year, month - 1, 1 - startDayOfWeek);

  // days in month
  const lastOfMonth = new Date(year, month, 0);
  const daysInMonth = lastOfMonth.getDate();

  const needed = startDayOfWeek + daysInMonth;
  const totalCells = needed <= 35 ? 35 : 42;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  return cells;
}

export default function MonthGrid({
  year,
  month,
  games,
  onGameClick,
  selectedTeamAbbrev,
}) {
  const cells = buildCalendarCells(year, month);

  const gamesByDate = games.reduce((acc, g) => {
    const key = String(g.game_date).slice(0, 10);
    (acc[key] ||= []).push(g);
    return acc;
  }, {});

  const monthIndex = month - 1;

  const CELL_HEIGHT = 165;
  const MAX_VISIBLE_GAMES = 2;

  return (
    <div style={{ marginTop: 16, width: "100%" }}>
      {/*Weekday labels OUTSIDE the grid box */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          width: "100%",
          gap: 0,
          marginBottom: 10, // spacing between labels and the box
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            style={{
              fontWeight: 500,
              fontSize: 24,
              textAlign: "center",
              background: "transparent",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {}
      <div
        style={{
          width: "100%",
          border: "1px solid #1a1a1a",
          borderRadius: 6,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gridAutoRows: `${CELL_HEIGHT}px`,
            gap: 0,
            width: "100%",
          }}
        >
          {cells.map((dateObj, idx) => {
            const key = ymd(dateObj);
            const isCurrentMonth = dateObj.getMonth() === monthIndex;
            const dayGames = gamesByDate[key] || [];

            const visibleGames = dayGames.slice(0, MAX_VISIBLE_GAMES);
            const moreCount = Math.max(0, dayGames.length - visibleGames.length);

            const isLastCol = (idx + 1) % 7 === 0;
            const isLastRow = idx >= cells.length - 7;

            return (
              <div
                key={key}
                style={{
                  padding: 10,
                  borderRight: isLastCol ? "none" : "1px solid #1a1a1a",
                  borderBottom: isLastRow ? "none" : "1px solid #1a1a1a",
                  background: isCurrentMonth ? "#fff" : "#fafafa",
                  opacity: isCurrentMonth ? 1 : 0.55,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Day number */}
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    lineHeight: 1,
                    marginBottom: 10,
                  }}
                >
                  {dateObj.getDate()}
                </div>

                {/* Games list */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    overflow: "hidden",
                  }}
                >
                  {visibleGames.map((g) => {
                    const hasSelected = Boolean(selectedTeamAbbrev);
                    const isHome = hasSelected && g.home === selectedTeamAbbrev;

                    const opponent = hasSelected ? (isHome ? g.away : g.home) : g.away;
                    const vsAt = hasSelected ? (isHome ? "vs." : "@") : "@";
                    const homeAwayLabel = hasSelected ? (isHome ? "Home" : "Away") : "";

                    const logoFile = teamLogoMap[opponent];
                    const logoSrc = logoFile ? `/images/${logoFile}` : null;

                    return (
                      <button
                        key={g.id}
                        onClick={() => onGameClick?.(g)}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                        title={`${g.away} @ ${g.home} • ${formatLocalTime(
                          g.game_date,
                          g.start_time
                        )}`}
                      >
                        {logoSrc ? (
                          <img
                            src={logoSrc}
                            alt={`${opponent} logo`}
                            width={34}
                            height={34}
                            style={{ display: "block", margin: "0 auto 6px" }}
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        ) : (
                          <div style={{ height: 32 }} />
                        )}

                        <div style={{ fontWeight: 500, fontSize: 18 }}>
                          {vsAt} {opponent}
                        </div>

                        <div style={{ opacity: 0.75, fontSize: 14, marginTop: 2 }}>
                          {formatLocalTime(g.game_date, g.start_time)}
                          {homeAwayLabel ? ` • ${homeAwayLabel}` : ""}
                        </div>
                      </button>
                    );
                  })}

                  {moreCount > 0 && (
                    <div style={{ fontSize: 12, opacity: 0.7, textAlign: "center" }}>
                      +{moreCount} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}