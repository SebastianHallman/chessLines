import { Chessboard } from "react-chessboard";
import LinesSidebar from "../components/LinesSidebar.jsx";
import DrillSession from "../components/DrillSession.jsx";
import { useBoardWidth } from "../lib/useBoardWidth.js";

export default function BoardView({
  lines,
  playerColor,
  selectedLine,
  onSelectLine,
  onPickRandom,
  autoAdvance,
  onToggleAutoAdvance,
  onLineComplete,
  onDeselectLine,
}) {
  const boardWidth = useBoardWidth();

  return (
    <div className="board-view">
      <div className="board-view-layout">
        <div className="board-area">
          {selectedLine ? (
            <DrillSession
              line={selectedLine}
              playerColor={playerColor}
              onBack={onDeselectLine}
              autoAdvance={autoAdvance}
              onLineComplete={onLineComplete}
              boardWidth={boardWidth}
            />
          ) : (
            <div className="board-idle">
              <div className="board-wrapper">
                <Chessboard
                  boardWidth={boardWidth}
                  arePiecesDraggable={false}
                  boardOrientation={playerColor}
                />
              </div>
              <div className="board-idle-hint">Pick a line to start drilling</div>
            </div>
          )}
        </div>

        <LinesSidebar
          lines={lines}
          selectedLine={selectedLine}
          onSelectLine={onSelectLine}
          onPickRandom={onPickRandom}
          autoAdvance={autoAdvance}
          onToggleAutoAdvance={onToggleAutoAdvance}
          playerColor={playerColor}
        />
      </div>
    </div>
  );
}
