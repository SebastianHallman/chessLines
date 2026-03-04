import { useState } from "react";
import SetupSidebar from "./components/SetupSidebar.jsx";
import BoardView from "./views/BoardView.jsx";

export default function App() {
  const [lines, setLines] = useState([]);
  const [currentPGN, setCurrentPGN] = useState("");
  const [selectedLine, setSelectedLine] = useState(null);
  const [playerColor, setPlayerColor] = useState("white");
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [selectionMode, setSelectionMode] = useState("sequential");
  const [savedPGNs, setSavedPGNs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chess-saved-pgns") || "[]");
    } catch {
      return [];
    }
  });
  const [saveName, setSaveName] = useState("");
  const [mobileTab, setMobileTab] = useState("setup");

  function handleParsed(extractedLines, pgnText) {
    setLines(extractedLines);
    setCurrentPGN(pgnText);
    setSelectedLine(null);
    setSaveName(extractedLines[0]?.label?.split(" ").slice(0, 4).join(" ") || "Opening");
    setMobileTab("lines");
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
    setMobileTab("board");
  }

  function handlePickRandom() {
    if (lines.length === 0) return;
    setSelectionMode("random");
    const idx = Math.floor(Math.random() * lines.length);
    setSelectedLine(lines[idx]);
    setMobileTab("board");
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

  function handleReset() {
    setLines([]);
    setSelectedLine(null);
    setMobileTab("setup");
  }

  const hasLines = lines.length > 0;

  return (
    <div className="app" data-tab={mobileTab}>
      <SetupSidebar
        hasLines={hasLines}
        onParsed={handleParsed}
        savedPGNs={savedPGNs}
        onDeleteSaved={handleDeleteSaved}
        playerColor={playerColor}
        onColorChange={setPlayerColor}
        saveName={saveName}
        onSaveNameChange={setSaveName}
        onSave={handleSave}
        onReset={handleReset}
      />
      <div className="main-area">
        {!hasLines ? (
          <p className="empty-state">Load a PGN to start drilling</p>
        ) : (
          <BoardView
            lines={lines}
            playerColor={playerColor}
            selectedLine={selectedLine}
            onSelectLine={handleSelectLine}
            onPickRandom={handlePickRandom}
            autoAdvance={autoAdvance}
            onToggleAutoAdvance={() => setAutoAdvance((a) => !a)}
            onLineComplete={handleLineComplete}
            onDeselectLine={() => { setSelectedLine(null); setMobileTab("lines"); }}
          />
        )}
      </div>

      <nav className="mobile-tab-bar">
        <button
          className={`mobile-tab-btn${mobileTab === "setup" ? " active" : ""}`}
          onClick={() => setMobileTab("setup")}
        >
          <span className="tab-icon">⚙</span>
          Setup
        </button>
        <button
          className={`mobile-tab-btn${mobileTab === "lines" ? " active" : ""}`}
          onClick={() => setMobileTab("lines")}
          disabled={!hasLines}
        >
          <span className="tab-icon">≡</span>
          Lines
        </button>
        <button
          className={`mobile-tab-btn${mobileTab === "board" ? " active" : ""}`}
          onClick={() => setMobileTab("board")}
          disabled={!hasLines}
        >
          <span className="tab-icon">♟</span>
          Board
        </button>
      </nav>
    </div>
  );
}
