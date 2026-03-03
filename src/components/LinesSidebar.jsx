export default function LinesSidebar({
  lines,
  selectedLine,
  onSelectLine,
  onPickRandom,
  autoAdvance,
  onToggleAutoAdvance,
}) {
  return (
    <div className="lines-sidebar">
      <h3>Lines ({lines.length})</h3>
      <div className="sidebar-actions">
        <button className="btn btn-secondary" onClick={onPickRandom}>
          ⟳ Random
        </button>
        <label className="auto-advance-toggle" title="Automatically start next line when current line is complete">
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={onToggleAutoAdvance}
          />
          Auto-advance
        </label>
      </div>
      <div className="lines-list">
        {lines.map((line, i) => (
          <button
            key={i}
            className={`line-item ${selectedLine === line ? "selected" : ""}`}
            onClick={() => onSelectLine(line)}
            title={line.moves.join(" ")}
          >
            {line.label}
          </button>
        ))}
      </div>
    </div>
  );
}
