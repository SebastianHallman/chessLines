/**
 * Lightweight recursive descent PGN parser.
 *
 * Returns a tree of nodes:
 *   { move: string | null, children: Node[] }
 *
 * The root node has move === null.
 * Each node's children[0] is the main continuation; children[1..] are variations.
 */
export function parsePGN(pgnText) {
  const tokens = tokenize(pgnText);
  const root = { move: null, children: [] };
  const pos = { i: 0 };
  parseInto(tokens, pos, root);
  return root;
}

// ---------------------------------------------------------------------------
// Tokeniser — strips headers, comments, move numbers, NAGs, results
// ---------------------------------------------------------------------------
function tokenize(text) {
  const stripped = text.replace(/\[.*?\]\s*/gs, "");
  const tokens = [];
  let i = 0;

  while (i < stripped.length) {
    const ch = stripped[i];

    if (/\s/.test(ch)) { i++; continue; }

    // Comment in braces
    if (ch === "{") {
      const end = stripped.indexOf("}", i);
      i = end === -1 ? stripped.length : end + 1;
      continue;
    }

    // Comment starting with ;
    if (ch === ";") {
      const end = stripped.indexOf("\n", i);
      i = end === -1 ? stripped.length : end + 1;
      continue;
    }

    if (ch === "(" || ch === ")") { tokens.push(ch); i++; continue; }

    // NAG
    if (ch === "$") {
      while (i < stripped.length && !/[\s(){}]/.test(stripped[i])) i++;
      continue;
    }

    // Word token
    let j = i;
    while (j < stripped.length && !/[\s(){}]/.test(stripped[j])) j++;
    const word = stripped.slice(i, j);
    i = j;

    if (!word) continue;

    // Skip result tokens
    if (["1-0", "0-1", "1/2-1/2", "*"].includes(word)) continue;

    // Strip leading move-number prefix (handles "1.", "2...", and concatenated "2...Nc6")
    const move = word.replace(/^\d+\.+/, "");
    if (!move) continue;

    tokens.push(move);
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Recursive tree builder
//
// Invariant: after each move token, `parent` = the parent of `current`,
// so that when we see "(" we know to attach the variation to `parent`
// (making it a sibling of `current`).
// ---------------------------------------------------------------------------
function parseInto(tokens, pos, startParent) {
  let parent = startParent;
  let current = null;

  while (pos.i < tokens.length && tokens[pos.i] !== ")") {
    const tok = tokens[pos.i];

    if (tok === "(") {
      pos.i++; // consume "("
      // Variation: alternative to `current`, so it branches FROM `parent`
      parseInto(tokens, pos, parent);
      if (pos.i < tokens.length && tokens[pos.i] === ")") pos.i++;
      continue;
    }

    pos.i++;
    const node = { move: tok, children: [] };

    if (current !== null) {
      // Advance: current becomes the new parent for this move
      parent = current;
    }
    parent.children.push(node);
    current = node;
  }
}
