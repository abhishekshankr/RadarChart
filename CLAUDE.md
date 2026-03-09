# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build    # Compile TypeScript to code.js
npm run watch    # Watch mode for continuous compilation
```

There are no tests in this project.

## Architecture

This is a Figma Plugin with two distinct execution contexts that communicate via `postMessage`:

- **`code.js`** (plugin backend) — Runs in Figma's sandbox with access to the Figma API (`figma.*`). This is the **compiled output** of a TypeScript source file. It receives messages from the UI and calls `createRadarGraph()` to draw vector nodes onto the Figma canvas.

- **`ui.html`** — A self-contained HTML file (inline CSS + JS, no bundler) that renders the plugin UI in an iframe. It sends chart configuration to the backend via `parent.postMessage({ pluginMessage: ... }, '*')`.

- **`manifest.json`** — Declares plugin metadata. Key settings: `"documentAccess": "dynamic-page"` (required for accessing pages dynamically), `"editorType": ["figma", "figjam"]` (supports both editors).

### Data flow

1. User fills out the UI form (color, rounding, min/max range, data name/value pairs, toggles)
2. UI sends `{ type: 'submitData', data: { color, rounding, minValue, maxValue, dataSets, showDataValue, showDataPoints } }` to backend
3. `code.js` calls `createRadarGraph(input)` which:
   - Creates a 500×500 frame centered at the current viewport
   - Draws spider-web grid polygons (5 rings at 20% intervals)
   - Draws the data polygon (fill at 30% opacity + stroke layer)
   - Optionally draws data point circles and scale labels

### Important notes

- `code.js` is the **compiled output** — edit the TypeScript source if one exists, not `code.js` directly. Currently only `code.js` is tracked (no `.ts` source file in the repo), so edits must be made directly to `code.js`.
- FigJam support: the frame fill is set to empty (`[]`) for FigJam, white for Figma (`figma.editorType` check at `code.js:47`).
- Colors in the Figma API use normalized RGB (0–1 range), not hex — `hexToRgb()` handles conversion.
- The spider-web background color is hardcoded to `#F1F1F1`; the user-chosen color only applies to the data polygon and data point circles.
