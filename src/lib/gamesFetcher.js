import { parsePGN } from "./pgnParser.js";
import { extractLines } from "./lineExtractor.js";

/**
 * @typedef {{ playerSide: "white"|"black", moves: string[] }} NormalizedGame
 */

/**
 * @param {"chesscom"|"lichess"} platform
 * @param {string} username
 * @param {string} playerColor - "white"|"black"
 * @param {number} count - max number of games to fetch
 * @returns {Promise<NormalizedGame[]>}
 */
export async function fetchGames(platform, username, count = 100) {
  if (platform === "chesscom") return fetchChessComGames(username, count);
  if (platform === "lichess") return fetchLichessGames(username, count);
  throw new Error("Unknown platform");
}

async function fetchChessComGames(username, count) {
  const archivesRes = await fetch(
    `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`
  );
  if (archivesRes.status === 404) throw new Error("Chess.com user not found");
  if (!archivesRes.ok) throw new Error("Chess.com request failed");

  const { archives } = await archivesRes.json();
  if (!archives || archives.length === 0) return [];

  // Fetch archives from newest to oldest, stopping once we have enough raw games
  const allGames = [];
  for (let i = archives.length - 1; i >= 0 && allGames.length < count; i--) {
    const res = await fetch(archives[i]);
    const data = await res.json();
    allGames.push(...(data.games || []));
  }

  const normalized = [];
  for (const game of allGames.slice(0, count)) {
    try {
      const playerSide =
        (game.white?.username || "").toLowerCase() === username.toLowerCase()
          ? "white"
          : "black";
      const tree = parsePGN(game.pgn || "");
      const lines = extractLines(tree);
      if (lines.length === 0) continue;
      normalized.push({ playerSide, moves: lines[0].moves });
    } catch {
      // skip malformed game PGNs
    }
  }
  return normalized;
}

async function fetchLichessGames(username, count) {
  const res = await fetch(
    `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=${count}&moves=true&opening=false`,
    { headers: { Accept: "application/x-ndjson" } }
  );
  if (res.status === 404) throw new Error("Lichess user not found");
  if (!res.ok) throw new Error("Lichess request failed");

  const text = await res.text();
  const normalized = [];

  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const game = JSON.parse(line);
      const whiteName = game.players?.white?.user?.name || "";
      const playerSide = whiteName.toLowerCase() === username.toLowerCase() ? "white" : "black";
      const moves = game.moves ? game.moves.split(" ").filter(Boolean) : [];
      if (moves.length === 0) continue;
      normalized.push({ playerSide, moves });
    } catch {
      // skip malformed lines
    }
  }
  return normalized;
}
