// Level definitions for Iso-TD  (15×15 grid, coords 0-14)
// Blue dot = entry (row 0, top edge)   Red dot = exit (row/col 14, bottom or right edge)

export const LEVELS = [
  // ── Level 1: Zigzag (Easy) ─── 3-run left→right→left sweep ──────────────
  {
    name: 'Zigzag',
    difficulty: 'Easy',
    waypoints: [[1,0],[1,4],[11,4],[11,8],[2,8],[2,12],[5,14]],
    waves: [
      [{ type:'normal', count:5, interval:1.4 }],
      [{ type:'fast',   count:5, interval:1.0 }],
      [{ type:'tank',   count:5, interval:2.0 }],
      [{ type:'normal', count:3, interval:1.2 }, { type:'fast', count:2, interval:0.9 }],
      [{ type:'boss',   count:1, interval:0 }],
      [{ type:'normal', count:4, interval:1.2 }, { type:'fast', count:2, interval:0.8 }],
      [{ type:'normal', count:4, interval:1.1 }, { type:'tank', count:3, interval:1.8 }],
      [{ type:'fast',   count:5, interval:0.7 }, { type:'tank', count:3, interval:1.8 }],
      [{ type:'normal', count:3, interval:1.0 }, { type:'fast', count:3, interval:0.7 }, { type:'tank', count:3, interval:1.8 }],
      [{ type:'boss',   count:2, interval:5.0 }],
    ],
  },

  // ── Level 2: S-Curve (Medium) ─── compact S, 3 turns ────────────────────
  {
    name: 'S-Curve',
    difficulty: 'Medium',
    waypoints: [[1,0],[1,2],[9,2],[9,7],[2,7],[2,11],[10,11],[10,14]],
    waves: [
      [{ type:'normal', count:6, interval:1.2 }],
      [{ type:'fast',   count:7, interval:0.9 }],
      [{ type:'tank',   count:4, interval:2.0 }],
      [{ type:'normal', count:4, interval:1.0 }, { type:'fast', count:3, interval:0.8 }],
      [{ type:'boss',   count:1, interval:0 }],
      [{ type:'fast',   count:5, interval:0.7 }, { type:'normal', count:3, interval:1.1 }],
      [{ type:'tank',   count:4, interval:1.8 }, { type:'normal', count:2, interval:1.3 }],
      [{ type:'normal', count:4, interval:0.9 }, { type:'fast', count:4, interval:0.7 }, { type:'tank', count:2, interval:2.0 }],
      [{ type:'fast',   count:6, interval:0.6 }, { type:'tank', count:4, interval:1.6 }],
      [{ type:'boss',   count:2, interval:6.0 }],
    ],
  },

  // ── Level 3: Long Wind (Medium) ─── longer path, more turns ─────────────
  {
    name: 'Long Wind',
    difficulty: 'Medium',
    waypoints: [[4,0],[4,3],[12,3],[12,7],[3,7],[3,11],[12,11],[12,14]],
    waves: [
      [{ type:'normal', count:6, interval:1.1 }],
      [{ type:'fast',   count:6, interval:1.0 }],
      [{ type:'tank',   count:3, interval:2.2 }],
      [{ type:'normal', count:5, interval:0.9 }, { type:'fast', count:2, interval:1.1 }],
      [{ type:'boss',   count:1, interval:0 }],
      [{ type:'fast',   count:6, interval:0.8 }, { type:'tank', count:2, interval:2.1 }],
      [{ type:'normal', count:6, interval:0.8 }, { type:'tank', count:3, interval:2.0 }],
      [{ type:'fast',   count:7, interval:0.7 }, { type:'normal', count:2, interval:1.2 }],
      [{ type:'normal', count:5, interval:0.8 }, { type:'fast', count:4, interval:0.6 }, { type:'tank', count:3, interval:1.8 }],
      [{ type:'boss',   count:2, interval:5.5 }],
    ],
  },

  // ── Level 4: Snake (Hard) ─── 3 horizontal sweeps filling the grid ───────
  {
    name: 'Snake',
    difficulty: 'Hard',
    waypoints: [[1,0],[1,3],[12,3],[12,7],[2,7],[2,11],[12,11],[12,14]],
    waves: [
      [{ type:'normal', count:7, interval:1.0 }],
      [{ type:'fast',   count:8, interval:0.9 }],
      [{ type:'tank',   count:4, interval:2.0 }],
      [{ type:'normal', count:5, interval:0.8 }, { type:'fast', count:4, interval:0.8 }],
      [{ type:'boss',   count:1, interval:0 }],
      [{ type:'fast',   count:7, interval:0.7 }, { type:'tank', count:3, interval:1.9 }],
      [{ type:'normal', count:6, interval:0.7 }, { type:'tank', count:4, interval:1.8 }],
      [{ type:'fast',   count:8, interval:0.6 }, { type:'normal', count:3, interval:1.0 }],
      [{ type:'normal', count:6, interval:0.7 }, { type:'fast', count:5, interval:0.6 }, { type:'tank', count:4, interval:1.7 }],
      [{ type:'boss',   count:2, interval:5.0 }],
    ],
  },

  // ── Level 5: Spiral (Hard) ─── entry top-right, spirals inward ───────────
  {
    name: 'Spiral',
    difficulty: 'Hard',
    waypoints: [[9,0],[9,2],[2,2],[2,7],[7,7],[7,11],[14,11]],
    waves: [
      [{ type:'normal', count:8, interval:0.9 }],
      [{ type:'fast',   count:8, interval:0.8 }],
      [{ type:'tank',   count:5, interval:1.9 }],
      [{ type:'normal', count:6, interval:0.7 }, { type:'fast', count:3, interval:0.9 }],
      [{ type:'boss',   count:1, interval:0 }],
      [{ type:'fast',   count:8, interval:0.7 }, { type:'tank', count:4, interval:1.8 }],
      [{ type:'normal', count:7, interval:0.6 }, { type:'tank', count:4, interval:1.8 }],
      [{ type:'fast',   count:9, interval:0.6 }, { type:'normal', count:2, interval:1.1 }],
      [{ type:'normal', count:7, interval:0.6 }, { type:'fast', count:6, interval:0.5 }, { type:'tank', count:4, interval:1.6 }],
      [{ type:'boss',   count:3, interval:4.0 }],
    ],
  },

  // ── Level 6: Hook (Expert) ─── entry top-right, wide C-shape left & back ─
  {
    name: 'Hook',
    difficulty: 'Expert',
    waypoints: [[11,0],[11,2],[2,2],[2,9],[12,9],[12,14]],
    waves: [
      [{ type:'normal', count:9, interval:0.8 }],
      [{ type:'fast',   count:9, interval:0.8 }],
      [{ type:'tank',   count:5, interval:1.8 }],
      [{ type:'normal', count:7, interval:0.6 }, { type:'fast', count:4, interval:0.7 }],
      [{ type:'boss',   count:1, interval:0 }],
      [{ type:'fast',   count:9, interval:0.6 }, { type:'tank', count:5, interval:1.7 }],
      [{ type:'normal', count:8, interval:0.6 }, { type:'tank', count:5, interval:1.7 }],
      [{ type:'fast',   count:10, interval:0.5 }, { type:'normal', count:3, interval:1.0 }],
      [{ type:'normal', count:8, interval:0.5 }, { type:'fast', count:7, interval:0.5 }, { type:'tank', count:5, interval:1.6 }],
      [{ type:'boss',   count:3, interval:4.0 }, { type:'normal', count:5, interval:1.0 }],
    ],
  },
];

export const TOTAL_LEVELS = LEVELS.length;
export const TOTAL_WAVES = 10;
