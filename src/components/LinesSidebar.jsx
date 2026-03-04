import { useState } from "react";
import ComparePanel from "./ComparePanel.jsx";

export default function LinesSidebar({
  lines,
  selectedLine,
  onSelectLine,
  onPickRandom,
  autoAdvance,
  onToggleAutoAdvance,
  playerColor,
}) {
  const [tab, setTab] = useState("lines");

  return (
    <div className={`lines-sidebar${tab === "compare" ? " sidebar-compare" : ""}`}>
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab${tab === "lines" ? " active" : ""}`}
          onClick={() => setTab("lines")}
        >
          Lines ({lines.length})
        </button>
        <button
          className={`sidebar-tab${tab === "compare" ? " active" : ""}`}
          onClick={() => setTab("compare")}
        >
          Compare
        </button>
      </div>

      {tab === "lines" && (
        <>
          <div className="sidebar-actions">
            <button className="btn btn-secondary" onClick={onPickRandom}>
              ⟳ Random
            </button>
            <label
              className="auto-advance-toggle"
              title="Automatically start next line when current line is complete"
            >
              <input type="checkbox" checked={autoAdvance} onChange={onToggleAutoAdvance} />
              Auto-advance
            </label>
          </div>
          <div className="lines-list">
            {lines.slice().sort((a, b) => a.moves.length - b.moves.length).map((line, i) => (
              <button
                key={i}
                className={`line-item ${selectedLine === line ? "selected" : ""}`}
                onClick={() => onSelectLine(line)}
              >
                {line.label}
              </button>
            ))}
          </div>
        </>
      )}

      {tab === "compare" && (
        <ComparePanel lines={lines} playerColor={playerColor} onSelectLine={onSelectLine} />
      )}
    </div>
  );
}
