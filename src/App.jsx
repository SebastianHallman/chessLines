import { useState } from "react";
import PGNInput from "./components/PGNInput.jsx";
import ColorPicker from "./components/ColorPicker.jsx";
import LinesSidebar from "./components/LinesSidebar.jsx";
import DrillSession from "./components/DrillSession.jsx";

export default function App() {
  const [phase, setPhase] = useState("input"); // "input" | "setup" | "drilling"
  const [lines, setLines] = useState([]);
  const [currentPGN, setCurrentPGN] = useState("");
  const [selectedLine, setSelectedLine] = useState(null);
  const [playerColor, setPlayerColor] = useState("white");
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [selectionMode, setSelectionMode] = useState("sequential"); // "sequential" | "random"
  const [savedPGNs, setSavedPGNs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chess-saved-pgns") || "[]");
    } catch {
      return [];
    }
  });
  const [saveName, setSaveName] = useState("");

  function handleParsed(extractedLines, pgnText) {
    setLines(extractedLines);
    setCurrentPGN(pgnText);
    setSelectedLine(null);
    setSaveName(extractedLines[0]?.label?.split(" ").slice(0, 4).join(" ") || "Opening");
    setPhase("setup");
  }

  function handleSave() {
    const name = saveName.trim();
    if (!name) return;
    const updated = [...savedPGNs, { name, pgn: currentPGN }];
    setSavedPGNs(updated);
    localStorage.setItem("chess-saved-pgns", JSON.stringify(updated));
  }

  function handleDeleteSaved(index) {
    const updated = savedPGNs.filter((_, i) => i !== index);
    setSavedPGNs(updated);
    localStorage.setItem("chess-saved-pgns", JSON.stringify(updated));
  }

  function handleSelectLine(line) {
    setSelectionMode("sequential");
    setSelectedLine(line);
    setPhase("drilling");
  }

  function handlePickRandom() {
    if (lines.length === 0) return;
    setSelectionMode("random");
    const idx = Math.floor(Math.random() * lines.length);
    setSelectedLine(lines[idx]);
    setPhase("drilling");
  }

  function handleLineComplete() {
    if (selectionMode === "random") {
      handlePickRandom();
    } else {
      const idx = lines.indexOf(selectedLine);
      const next = lines[(idx + 1) % lines.length];
      setSelectedLine(next);
    }
  }

  function handleBack() {
    setPhase("setup");
  }

  function handleReset() {
    setLines([]);
    setSelectedLine(null);
    setPhase("input");
  }

  return (
    <div className="app">
      <h1 className="app-title">ChessLines</h1>

      {phase === "input" && (
        <PGNInput onParsed={handleParsed} savedPGNs={savedPGNs} onDeleteSaved={handleDeleteSaved} />
      )}

      {phase === "setup" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: "900px" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button className="btn btn-secondary" onClick={handleReset}>
              ← New PGN
            </button>
            <input
              className="save-name-input"
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Entry name…"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <button className="btn btn-secondary" onClick={handleSave} disabled={!saveName.trim()}>
              Save
            </button>
            <span style={{ color: "#808090", fontSize: "0.85rem" }}>
              {lines.length} line{lines.length !== 1 ? "s" : ""} extracted
            </span>
          </div>
          <div className="setup-layout">
            <ColorPicker value={playerColor} onChange={setPlayerColor} />
            <LinesSidebar
              lines={lines}
              selectedLine={selectedLine}
              onSelectLine={handleSelectLine}
              onPickRandom={handlePickRandom}
              autoAdvance={autoAdvance}
              onToggleAutoAdvance={() => setAutoAdvance((a) => !a)}
            />
          </div>
        </div>
      )}

      {phase === "drilling" && selectedLine && (
        <div className="drill-layout">
          <DrillSession
            line={selectedLine}
            playerColor={playerColor}
            onBack={handleBack}
            autoAdvance={autoAdvance}
            onLineComplete={handleLineComplete}
          />
          <LinesSidebar
            lines={lines}
            selectedLine={selectedLine}
            onSelectLine={handleSelectLine}
            onPickRandom={handlePickRandom}
            autoAdvance={autoAdvance}
            onToggleAutoAdvance={() => setAutoAdvance((a) => !a)}
          />
        </div>
      )}
    </div>
  );
}
