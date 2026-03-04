/**
 * Extracts all leaf-to-root lines from a parsed PGN tree.
 *
 * Returns: Array<{ moves: string[], label: string }>
 *
 * `moves` is the full sequence of SAN moves for the line.
 * `label` is a human-readable prefix (first 4 plies in numbered notation).
 */
export function extractLines(root) {
  const lines = [];
  dfs(root, [], 0, lines);
  return lines;
}

// branchIdx = ply index where this line last diverged from siblings
function dfs(node, path, branchIdx, lines) {
  const newPath = node.move ? [...path, node.move] : path;

  if (node.children.length === 0) {
    if (newPath.length > 0) {
      lines.push({ moves: newPath, label: makeLabel(newPath, branchIdx) });
    }
    return;
  }

  const nextBranchIdx = node.children.length > 1 ? newPath.length : branchIdx;
  for (const child of node.children) {
    dfs(child, newPath, nextBranchIdx, lines);
  }
}

/**
 * Labels a line from its deviation point (last branch in path).
 * e.g. deviation at ply 4 (0-based) → "3.Bb5 a6 …"
 * Starts with "N..." notation when the deviation begins on a black move.
 */
function makeLabel(moves, branchIdx) {
  const slice = moves.slice(branchIdx, branchIdx + 4);
  const parts = [];
  for (let i = 0; i < slice.length; i++) {
    const ply = branchIdx + i;
    const moveNum = Math.floor(ply / 2) + 1;
    if (ply % 2 === 0) {
      parts.push(`${moveNum}.${slice[i]}`);
    } else if (i === 0) {
      parts.push(`${moveNum}...${slice[i]}`);
    } else {
      parts.push(slice[i]);
    }
  }
  return parts.join(" ") + (moves.length - branchIdx > 4 ? " …" : "");
}
