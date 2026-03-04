import { useState } from "react";
import { parsePGN } from "../lib/pgnParser.js";
import { extractLines } from "../lib/lineExtractor.js";

const EXAMPLE_PGN = `1. e4 e5 2. Nf3 (2. d4 d5 3. c4) 2... Nc6 3. Bb5 a6 (3... Nf6 4. O-O)`;

function extractVideoId(url) {
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractPgnFromText(text) {
  const moveStart = /1\.{1,3}\s*[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQK])?[+#]?/;
  const match = text.match(moveStart);
  if (!match) return null;
  const slice = text.slice(match.index);
  const stop = slice.search(/\n\n/);
  return (stop === -1 ? slice : slice.slice(0, stop)).trim();
}

export default function InputView({ onParsed, savedPGNs, onDeleteSaved }) {
  const [tab, setTab] = useState("manual"); // "manual" | "youtube"
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState("");

  function tryParse(input) {
    try {
      const tree = parsePGN(input);
      const lines = extractLines(tree);
      if (lines.length === 0) {
        setError("No lines found. Check your PGN.");
        return;
      }
      setError("");
      onParsed(lines, input);
    } catch (e) {
      setError(`Parse error: ${e.message}`);
    }
  }

  function handleParse() {
    tryParse(text.trim() || EXAMPLE_PGN);
  }

  function handleExample() {
    setText(EXAMPLE_PGN);
  }

  function handleLoadSaved(pgn) {
    setText(pgn);
    tryParse(pgn);
  }

  async function handleYtImport() {
    const id = extractVideoId(ytUrl.trim());
    if (!id) {
      setYtError("Could not find a valid YouTube video ID in that URL.");
      return;
    }
    setYtLoading(true);
    setYtError("");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let html;
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`;
        const res = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) {
          setYtError(`Proxy returned HTTP ${res.status}`);
          return;
        }
        html = await res.text();
      } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === "AbortError") {
          setYtError("Request timed out — try again or paste the PGN directly.");
          return;
        }
        throw e;
      }

      if (!html) {
        setYtError("Empty response from proxy.");
        return;
      }

      let description = null;

      // Try ytInitialData shortDescription
      const sdMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
      if (sdMatch) {
        try {
          description = JSON.parse('"' + sdMatch[1] + '"');
        } catch {
          description = sdMatch[1];
        }
      }

      // Fallback: og:description meta tag
      if (!description) {
        const metaMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/);
        if (metaMatch) description = metaMatch[1];
      }

      if (!description) {
        setYtError("Could not extract description from the YouTube page.");
        return;
      }

      const pgn = extractPgnFromText(description);
      if (!pgn) {
        setYtError("No PGN found in the video description.");
        return;
      }

      setText(pgn);
      tryParse(pgn);
    } catch (e) {
      setYtError(`Fetch error: ${e.message}`);
    } finally {
      setYtLoading(false);
    }
  }

  return (
    <div className="pgn-input-card">
      <div className="input-tabs">
        <button
          className={`input-tab${tab === "manual" ? " active" : ""}`}
          onClick={() => setTab("manual")}
        >
          Manual PGN
        </button>
        <button
          className={`input-tab${tab === "youtube" ? " active" : ""}`}
          onClick={() => setTab("youtube")}
        >
          PGN from YouTube Video
        </button>
      </div>

      {tab === "manual" && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={EXAMPLE_PGN}
            spellCheck={false}
          />
          {error && <p className="error">{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-primary" onClick={handleParse}>
              Load Lines
            </button>
            <button className="btn btn-secondary" onClick={handleExample}>
              Use Example
            </button>
          </div>
        </>
      )}

      {tab === "youtube" && (
        <>
          <div className="yt-import-row">
            <input
              className="yt-url-input"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !ytLoading && ytUrl.trim() && handleYtImport()}
              disabled={ytLoading}
            />
            <button
              className="btn btn-secondary"
              onClick={handleYtImport}
              disabled={ytLoading || !ytUrl.trim()}
            >
              {ytLoading ? "Fetching…" : "Import"}
            </button>
          </div>
          {ytError && <p className="error">{ytError}</p>}
        </>
      )}
      {savedPGNs && savedPGNs.length > 0 && (
        <div className="saved-entries">
          <h3>Saved</h3>
          <div className="saved-entries-grid">
            {savedPGNs.map((entry, i) => (
              <div key={i} className="saved-entry">
                <button className="saved-entry-load" onClick={() => handleLoadSaved(entry.pgn)}>
                  {entry.name}
                </button>
                <button className="saved-entry-delete" onClick={() => onDeleteSaved(i)} title="Delete">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
