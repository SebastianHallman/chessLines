import { useState, useEffect, useCallback, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

export default function DrillSession({ line, playerColor, onBack, autoAdvance, onLineComplete, boardWidth = 480 }) {
  const [game, setGame] = useState(new Chess());
  const [moveIndex, setMoveIndex] = useState(0);
  // status: "playing" | "wrong" | "complete" | "opponent"
  const [status, setStatus] = useState("playing");
  const [flashWrong, setFlashWrong] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);

  const wrongTimerRef = useRef(null);
  const opponentTimerRef = useRef(null);
  const autoAdvanceTimerRef = useRef(null);
  const onLineCompleteRef = useRef(onLineComplete);
  onLineCompleteRef.current = onLineComplete;

  // Reset when line or playerColor changes
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line, playerColor]);

  function reset() {
    clearTimeout(wrongTimerRef.current);
    clearTimeout(opponentTimerRef.current);
    clearTimeout(autoAdvanceTimerRef.current);
    const fresh = new Chess();
    setGame(fresh);
    setMoveIndex(0);
    setStatus("playing");
    setFlashWrong(false);
    setSelectedSquare(null);
  }

  // Auto-advance to next line after completion
  useEffect(() => {
    if (status === "complete" && autoAdvance) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        onLineCompleteRef.current();
      }, 1500);
    }
    return () => clearTimeout(autoAdvanceTimerRef.current);
  }, [status, autoAdvance]);

  // Auto-play opponent moves
  const playOpponentMove = useCallback(
    (currentGame, idx) => {
      if (idx >= line.moves.length) {
        setStatus("complete");
        return;
      }
      // Is it the opponent's turn?
      const isPlayerTurn =
        (playerColor === "white" && currentGame.turn() === "w") ||
        (playerColor === "black" && currentGame.turn() === "b");

      if (!isPlayerTurn) {
        // Auto-play this move for the opponent
        setStatus("opponent");
        opponentTimerRef.current = setTimeout(() => {
          const gameCopy = new Chess(currentGame.fen());
          const moveSAN = line.moves[idx];
          const result = gameCopy.move(moveSAN);
          if (!result) {
            // Shouldn't happen with a valid PGN, but be safe
            setStatus("playing");
            return;
          }
          setGame(gameCopy);
          const nextIdx = idx + 1;
          setMoveIndex(nextIdx);
          if (nextIdx >= line.moves.length) {
            setStatus("complete");
          } else {
            setStatus("playing");
          }
        }, 400);
      }
    },
    [line, playerColor]
  );

  // On mount / reset: if player is Black, auto-play first move
  useEffect(() => {
    if (line && line.moves.length > 0) {
      const fresh = new Chess();
      playOpponentMove(fresh, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line, playerColor]);

  function onPieceDrop(sourceSquare, targetSquare, piece) {
    if (status !== "playing") return false;
    if (moveIndex >= line.moves.length) return false;

    const gameCopy = new Chess(game.fen());

    // Determine promotion piece (works for both drag and click-to-move)
    const pieceOnSource = game.get(sourceSquare);
    const isPromotion =
      pieceOnSource &&
      pieceOnSource.type === "p" &&
      ((pieceOnSource.color === "w" && targetSquare[1] === "8") ||
        (pieceOnSource.color === "b" && targetSquare[1] === "1"));

    let moveResult;
    try {
      moveResult = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: isPromotion ? "q" : undefined,
      });
    } catch {
      // Illegal move
      triggerWrong();
      return false;
    }

    if (!moveResult) {
      triggerWrong();
      return false;
    }

    const expected = line.moves[moveIndex];
    if (moveResult.san !== expected) {
      triggerWrong();
      return false;
    }

    // Correct move
    setSelectedSquare(null);
    setGame(gameCopy);
    const nextIdx = moveIndex + 1;
    setMoveIndex(nextIdx);

    if (nextIdx >= line.moves.length) {
      setStatus("complete");
    } else {
      // Schedule opponent response
      playOpponentMove(gameCopy, nextIdx);
    }

    return true;
  }

  function onSquareClick(square) {
    if (status !== "playing") return;

    if (selectedSquare === null) {
      // Select only if there's a piece belonging to the player on that square
      const piece = game.get(square);
      if (
        piece &&
        ((playerColor === "white" && piece.color === "w") ||
          (playerColor === "black" && piece.color === "b"))
      ) {
        setSelectedSquare(square);
      }
    } else if (selectedSquare === square) {
      // Deselect
      setSelectedSquare(null);
    } else {
      // Try to move from selectedSquare to square
      const moved = onPieceDrop(selectedSquare, square, null);
      setSelectedSquare(moved ? null : null);
      if (!moved) {
        // Maybe they're clicking a different piece of their own
        const piece = game.get(square);
        if (
          piece &&
          ((playerColor === "white" && piece.color === "w") ||
            (playerColor === "black" && piece.color === "b"))
        ) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    }
  }

  function triggerWrong() {
    setSelectedSquare(null);
    setStatus("wrong");
    setFlashWrong(true);
    clearTimeout(wrongTimerRef.current);
    wrongTimerRef.current = setTimeout(() => {
      setFlashWrong(false);
      setStatus("playing");
    }, 600);
  }

  const boardOrientation = playerColor === "white" ? "white" : "black";

  const isPlayerTurn =
    status === "playing" &&
    ((playerColor === "white" && game.turn() === "w") ||
      (playerColor === "black" && game.turn() === "b"));

  return (
    <div className="drill-session">
      <div className="drill-info">
        <span className="line-label">{line.label}</span>
        <span className="move-progress">
          Move {Math.min(moveIndex + 1, line.moves.length)} / {line.moves.length}
        </span>
      </div>

      <div className="board-wrapper">
        <Chessboard
          position={game.fen()}
          onPieceDrop={onPieceDrop}
          onSquareClick={onSquareClick}
          boardOrientation={boardOrientation}
          boardWidth={boardWidth}
          arePiecesDraggable={isPlayerTurn}
          customSquareStyles={
            selectedSquare
              ? { [selectedSquare]: { background: "rgba(255, 255, 0, 0.5)" } }
              : {}
          }
        />
        <div className={`board-overlay${flashWrong ? " flash-wrong" : ""}`} />
      </div>

      <div className="drill-status">
        <StatusMessage
          status={status}
          playerColor={playerColor}
          game={game}
        />
        <div className="status-actions">
          {status === "complete" && (
            <>
              <button className="btn btn-primary" onClick={reset}>
                Retry
              </button>
            </>
          )}
          <button className="btn btn-secondary mobile-hide" onClick={onBack}>
            ← Lines
          </button>
        </div>
      </div>

    </div>
  );
}

function StatusMessage({ status, playerColor, game }) {
  const isMyTurn =
    (playerColor === "white" && game.turn() === "w") ||
    (playerColor === "black" && game.turn() === "b");

  if (status === "complete") {
    return <span className="status-msg complete">✓ Line complete!</span>;
  }
  if (status === "wrong") {
    return <span className="status-msg wrong">✗ Wrong move — try again</span>;
  }
  if (status === "opponent") {
    return <span className="status-msg waiting">Opponent is moving…</span>;
  }
  if (isMyTurn) {
    return <span className="status-msg correct">Your move</span>;
  }
  return <span className="status-msg waiting">Waiting…</span>;
}
