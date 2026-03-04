import { useState } from "react";
import { fetchGames } from "../lib/gamesFetcher.js";
import { compareLines } from "../lib/lineComparator.js";

function makePgnLabel(moves, maxPlies = 12) {
  let label = "";
  let moveNum = 1;
  const count = Math.min(moves.length, maxPlies);
  for (let i = 0; i < count; i++) {
    if (i % 2 === 0) label += `${moveNum}.`;
    label += moves[i];
    if (i % 2 === 1) moveNum++;
    if (i < count - 1) label += " ";
  }
  if (moves.length > maxPlies) label += " …";
  return label;
}

export default function ComparePanel({ lines, playerColor, onSelectLine }) {
  const [platform, setPlatform] = useState("chesscom");
  const [username, setUsername] = useState("");
  const [count, setCount] = useState(200);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [results, setResults] = useState([]);
  const [totalGames, setTotalGames] = useState(0);

  async function handleFetch() {
    if (!username.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    setResults([]);
    try {
      const games = await fetchGames(platform, username.trim(), count);
      const relevant = games.filter((g) => g.playerSide === playerColor);
      const comparison = compareLines(lines, games, playerColor);
      setTotalGames(relevant.length);
      setResults(comparison);
      setStatus("done");
    } catch (e) {
      setErrorMsg(e.message || "Network error. Check your username and try again.");
      setStatus("error");
    }
  }

  return (
    <div className="compare-panel">
      <div className="input-tabs">
        <button
          className={`input-tab${platform === "chesscom" ? " active" : ""}`}
          onClick={() => setPlatform("chesscom")}
        >
          chess.com
        </button>
        <button
          className={`input-tab${platform === "lichess" ? " active" : ""}`}
          onClick={() => setPlatform("lichess")}
        >
          lichess.org
        </button>
      </div>

      <div className="compare-form">
        <input
          className="yt-url-input"
          type="text"
          placeholder={platform === "chesscom" ? "chess.com username" : "lichess username"}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          disabled={status === "loading"}
        />
        <div className="compare-form-row">
          <select
            className="compare-count-select"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={status === "loading"}
          >
            <option value={100}>100 games</option>
            <option value={200}>200 games</option>
            <option value={500}>500 games</option>
            <option value={1000}>1000 games</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={handleFetch}
            disabled={status === "loading" || !username.trim()}
          >
            {status === "loading" ? "Fetching…" : "Fetch & Compare"}
          </button>
        </div>
      </div>

      {status === "error" && <p className="error">{errorMsg}</p>}

      {status === "done" && (
        <div className="compare-results">
          <p className="compare-summary">
            {totalGames} game{totalGames !== 1 ? "s" : ""} as {playerColor}
          </p>
          {results.length === 0 ? (
            <p className="compare-summary">No lines to compare.</p>
          ) : (
            <div className="compare-table-scroll">
              <table className="compare-results-table">
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Matched</th>
                    <th>Depth</th>
                    <th>Deviations</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const matchPct =
                      r.totalGames > 0 ? Math.round((r.matchCount / r.totalGames) * 100) : 0;
                    const depthPct =
                      r.lineLength > 0 ? Math.round((r.avgDepth / r.lineLength) * 100) : 0;
                    const label = makePgnLabel(r.line.moves, r.commonPrefixLength + 6);
                    return (
                      <tr
                        key={i}
                        className="compare-row-clickable"
                        onClick={() => onSelectLine(r.line)}
                        title="Drill this line"
                      >
                        <td className="compare-line-label" title={r.line.moves.join(" ")}>
                          {label}
                        </td>
                        <td>
                          {r.matchCount}/{r.totalGames}
                          <span className="compare-pct"> ({matchPct}%)</span>
                        </td>
                        <td>
                          {r.matchCount > 0 ? (
                            <>
                              {r.avgDepth.toFixed(1)}/{r.lineLength}
                              <span className="compare-pct"> ({depthPct}%)</span>
                            </>
                          ) : (
                            <span className="compare-pct">—</span>
                          )}
                        </td>
                        <td className="compare-deviations">
                          {r.deviations.length === 0 ? (
                            r.matchCount > 0 ? (
                              <span className="compare-pct">always followed</span>
                            ) : (
                              <span className="compare-pct">—</span>
                            )
                          ) : (
                            r.deviations.slice(0, 2).map((d) => (
                              <div key={d.ply} className="compare-deviation-row">
                                <span className="compare-deviation-move">m{d.moveNum}</span>{" "}
                                {d.alternatives.slice(0, 2).map((a, j) => (
                                  <span key={j}>
                                    {j > 0 && ", "}
                                    <span className="compare-played-move">{a.move}</span>
                                    <span className="compare-pct">×{a.count}</span>
                                  </span>
                                ))}
                              </div>
                            ))
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
