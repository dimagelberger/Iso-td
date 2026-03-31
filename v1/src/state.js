// Mutable shared state — imported and mutated by all modules.
// Arrays are exported directly so callers can push/splice/clear in-place.
// Scalar values live on the `state` object so they can be updated by reference.

export const enemies      = [];   // Enemy instances currently in scene
export const towers       = [];   // Tower instances currently in scene
export const projectiles  = [];   // Projectile instances currently in scene
export const tileObjects  = [];   // THREE.Mesh tiles used by the raycaster
export const towerMeshMap = new Map();  // THREE mesh → Tower instance
export const OCCUPIED     = new Set(); // tileKey strings of built-on tiles

export const state = {
  // ── Gameplay scalars ─────────────────────────────────────────────────────
  lives:           20,
  gold:            1000,   // kept in sync with START_GOLD in constants.js
  gameOver:        false,
  killCount:       0,
  goldEarned:      0,
  gameSpeed:       1,
  // ── Selection / placement ────────────────────────────────────────────────
  activeTower:     null,   // Tower instance shown in info panel
  selectedTypeIdx: -1,     // index into TOWER_DEFS (-1 = nothing)
  previewTypeIdx:  0,      // ghost tower index (mirrors selectedTypeIdx when ≥0)
  // ── Three.js singletons (set by main.js before game starts) ─────────────
  scene:           null,
  camera:          null,
  renderer:        null,
  cssRenderer:     null,
  // ── System objects (set by main.js before game starts) ───────────────────
  wm:              null,   // WaveManager instance
  particles:       null,   // ParticleSystem instance
};
