/**
 * Returns how many leading moves all lines share with each other.
 */
export function computeCommonPrefixLength(lines) {
  if (lines.length <= 1) return 0;
  const first = lines[0].moves;
  let len = 0;
  for (let i = 0; i < first.length; i++) {
    if (lines.every((l) => l.moves[i] === first[i])) len++;
    else break;
  }
  return len;
}

/**
 * @param {Array<{moves: string[], label: string}>} preparedLines
 * @param {Array<{playerSide: string, moves: string[]}>} games
 * @param {"white"|"black"} playerColor
 * @returns {Array<{line, matchCount, avgDepth, lineLength, totalGames, commonPrefixLength, deviations}>}
 *
 * deviations: Array<{ ply, moveNum, preparedMove, alternatives: [{move, count}] }>
 *   — only for plies where it was the user's own move that diverged
 */
export function compareLines(preparedLines, games, playerColor) {
  const relevant = games.filter((g) => g.playerSide === playerColor);
  const totalGames = relevant.length;

  const commonPrefixLength = computeCommonPrefixLength(preparedLines);
  const minDepth = commonPrefixLength + 1;

  return preparedLines
    .map((line) => {
      let matchCount = 0;
      let totalDepth = 0;
      // ply -> playedMove -> count  (only when it was the user's move)
      const deviationMap = new Map();

      for (const game of relevant) {
        const depth = longestCommonPrefix(line.moves, game.moves);
        if (depth < minDepth) continue;

        matchCount++;
        totalDepth += depth;

        // Record what the user actually played if they deviated from the line
        if (depth < line.moves.length) {
          const ply = depth;
          if (isUserMove(ply, playerColor) && game.moves[ply]) {
            if (!deviationMap.has(ply)) deviationMap.set(ply, new Map());
            const moveCounts = deviationMap.get(ply);
            const played = game.moves[ply];
            moveCounts.set(played, (moveCounts.get(played) || 0) + 1);
          }
        }
      }

      const deviations = [...deviationMap.entries()]
        .map(([ply, moveCounts]) => ({
          ply,
          moveNum: Math.floor(ply / 2) + 1,
          preparedMove: line.moves[ply],
          alternatives: [...moveCounts.entries()]
            .map(([move, count]) => ({ move, count }))
            .sort((a, b) => b.count - a.count),
        }))
        // Sort by how many games deviated here (most impactful first)
        .sort(
          (a, b) =>
            b.alternatives.reduce((s, x) => s + x.count, 0) -
            a.alternatives.reduce((s, x) => s + x.count, 0)
        );

      return {
        line,
        matchCount,
        avgDepth: matchCount > 0 ? totalDepth / matchCount : 0,
        lineLength: line.moves.length,
        totalGames,
        commonPrefixLength,
        deviations,
      };
    })
    .sort((a, b) => b.matchCount - a.matchCount);
}

// moves array alternates white/black starting at ply 0 (white's first move)
function isUserMove(ply, playerColor) {
  return playerColor === "white" ? ply % 2 === 0 : ply % 2 === 1;
}

function longestCommonPrefix(lineMoves, gameMoves) {
  const limit = Math.min(lineMoves.length, gameMoves.length);
  let depth = 0;
  for (let i = 0; i < limit; i++) {
    if (lineMoves[i] === gameMoves[i]) depth++;
    else break;
  }
  return depth;
}
