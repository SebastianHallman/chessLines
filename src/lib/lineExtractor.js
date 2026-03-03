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
  dfs(root, [], lines);
  return lines;
}

function dfs(node, path, lines) {
  const newPath = node.move ? [...path, node.move] : path;

  if (node.children.length === 0) {
    // Leaf node — only record if there are actual moves
    if (newPath.length > 0) {
      lines.push({ moves: newPath, label: makeLabel(newPath) });
    }
    return;
  }

  for (const child of node.children) {
    dfs(child, newPath, lines);
  }
}

/**
 * Generates a human-readable label from the first few moves.
 * e.g. ["e4","e5","Nf3","Nc6"] → "1.e4 e5 2.Nf3 Nc6"
 */
function makeLabel(moves) {
  const prefix = moves.slice(0, 6);
  const parts = [];
  for (let i = 0; i < prefix.length; i++) {
    const moveNum = Math.floor(i / 2) + 1;
    if (i % 2 === 0) {
      parts.push(`${moveNum}.${prefix[i]}`);
    } else {
      parts.push(prefix[i]);
    }
  }
  return parts.join(" ") + (moves.length > 6 ? " …" : "");
}
