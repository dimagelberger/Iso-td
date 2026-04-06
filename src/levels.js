// Level definitions for Iso-TD
// Each level has waypoints (the path enemies follow) and wave compositions

export const LEVELS = [
  // ── Level 1: Zigzag (Easy) ────────────────────────────────────────────────
  {
    name: 'Zigzag',
    difficulty: 'Easy',
    waypoints: [[0,2],[16,2],[16,7],[3,7],[3,12],[19,12]],
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

  // ── Level 2: Spiral (Medium) ──────────────────────────────────────────────
  {
    name: 'Spiral',
    difficulty: 'Medium',
    waypoints: [[10,2],[18,2],[18,10],[2,10],[2,5],[14,5]],
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

  // ── Level 3: Winding Path (Medium) ────────────────────────────────────────
  {
    name: 'Winding Path',
    difficulty: 'Medium',
    waypoints: [[1,7],[7,1],[13,7],[7,13],[19,7]],
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

  // ── Level 4: Tight Maze (Hard) ────────────────────────────────────────────
  {
    name: 'Tight Maze',
    difficulty: 'Hard',
    waypoints: [[2,2],[2,12],[18,12],[18,3],[9,3],[9,10]],
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

  // ── Level 5: Long Road (Hard) ─────────────────────────────────────────────
  {
    name: 'Long Road',
    difficulty: 'Hard',
    waypoints: [[0,7],[5,2],[10,7],[15,2],[19,7]],
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

  // ── Level 6: Crossroads (Expert) ──────────────────────────────────────────
  {
    name: 'Crossroads',
    difficulty: 'Expert',
    waypoints: [[10,0],[10,8],[2,8],[2,14],[18,14]],
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
