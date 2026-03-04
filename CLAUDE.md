# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build
npm run preview   # Preview production build locally
```

No test framework is configured.

## Architecture

### File organisation convention
Each distinct UI phase/screen lives in its own file under `src/views/`. Shared sub-components (no routing logic) go under `src/components/`. **Always follow this split** — never embed a full view inline inside another file.

```
src/
  views/
    InputView.jsx    ← "input" phase
    SetupView.jsx    ← "setup" phase
    DrillView.jsx    ← "drilling" phase
  components/
    ColorPicker.jsx
    LinesSidebar.jsx
    DrillSession.jsx
  lib/
    pgnParser.js
    lineExtractor.js
```

### App phases
`App.jsx` controls a three-phase flow via `phase` state:
- `"input"` — user pastes or loads a saved PGN (`InputView`)
- `"setup"` — lines are extracted, user picks color and line (`SetupView`)
- `"drilling"` — active drill (`DrillView`)

Saved PGNs persist in `localStorage` under the key `"chess-saved-pgns"` as `[{ name, pgn }]`.

### PGN → lines pipeline
1. **`parsePGN(pgnText)`** (`src/lib/pgnParser.js`) — custom recursive descent tokenizer. Strips headers/comments/NAGs, returns a tree of `{ move: string|null, children: Node[] }`. Root has `move === null`. `children[0]` = main line; `children[1..]` = variations (siblings of the preceding move, not children of it).
2. **`extractLines(root)`** (`src/lib/lineExtractor.js`) — DFS over the tree; every leaf node produces one line as `{ moves: string[], label: string }`. Labels show the first 6 plies in numbered notation.

Do **not** use chess.js's built-in PGN parser — it doesn't support variations.

### DrillSession move validation
Move validation in `DrillSession.jsx` works by:
1. Calling `chess.js` `game.move({ from, to })` to get the canonical SAN string.
2. Comparing `moveResult.san` against `line.moves[moveIndex]` (the expected SAN from the parsed PGN).
3. Returning `false` from `onPieceDrop` (without updating state) on a mismatch — this causes the board to snap the piece back.
4. Triggering a red flash overlay (`flashWrong` state + CSS animation) for 600 ms on wrong moves.

Opponent moves auto-play after a 400 ms `setTimeout`. Line completion triggers `onLineComplete` in `App`, which either advances sequentially or picks a random line depending on `selectionMode`.

### `showCorrectMoves` dead state
`DrillSession` has a `showCorrectMoves` state that controls a move-list display, but no UI toggle currently sets it to `true`. The move list UI exists but is permanently hidden.
