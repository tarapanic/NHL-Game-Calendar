import { useEffect } from "react";

function formatLocalTime(game_date, start_time) {
  if (!game_date || !start_time) return "TBD";

  // start_time could be "00:30:00" or "00:30"
  const hhmm = String(start_time).slice(0, 5);

  // Build UTC datetime
  const iso = `${String(game_date).slice(0, 10)}T${hhmm}:00Z`;

  const d = new Date(iso);

  // If date is invalid, fallback
  if (Number.isNaN(d.getTime())) return hhmm;

  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function GameModal({ game, onClose }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!game) return null;

  return (
    <div
      onClick={() => onClose?.()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          background: "white",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              {(game.away ?? game.away_abbrev ?? game.away_name ?? "TBD")} @{" "}
              {(game.home ?? game.home_abbrev ?? game.home_name ?? "TBD")}
            </div>
            <div style={{ marginTop: 6, opacity: 0.75 }}>
              {String(game.game_date).slice(0, 10)} • {formatLocalTime(game.game_date, game.start_time)}
            </div>
          </div>

          <button
            onClick={() => onClose?.()}
            aria-label="Close"
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              background: "white",
              cursor: "pointer",
              padding: "6px 10px",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <InfoRow label="Venue" value={game.venue || "TBD"} />
          <InfoRow label="Status" value={game.status || "scheduled"} />
        </div>

        <div style={{ marginTop: 16, display: "flex", justifyContent: "end" }}>
          <button
            onClick={() => onClose?.()}
            style={{
              border: "none",
              borderRadius: 12,
              padding: "10px 14px",
              cursor: "pointer",
              background: "#111",
              color: "white",
              fontWeight: 700,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 10,
        padding: 10,
        border: "1px solid #eee",
        borderRadius: 12,
      }}
    >
      <div style={{ fontWeight: 700, opacity: 0.8 }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}