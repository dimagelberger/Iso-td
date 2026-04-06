import * as THREE from 'three';
import { LEVELS, TOTAL_LEVELS, TOTAL_WAVES } from './levels.js';

// ── Gameplay constants ────────────────────────────────────────────────────────
export const COLS         = 20;
export const ROWS         = 15;
export const VIEW         = 9;
export const HP_BAR_SCALE = 0.012;
export const PROJ_SPEED   = 8;
export const START_GOLD   = 1000;
export const START_LIVES  = 20;
export const PREP_SECS    = 8;
export { TOTAL_LEVELS, TOTAL_WAVES };
export const KICK_DUR          = 0.12;
export const KICK_SCALE        = 1.3;
export const TURRET_ROT_SPEED  = 8;
export const FLASH_FADE        = 0.10;
export const DEATH_DUR         = 0.20;
export const SELL_REFUND       = 0.60;
export const LASER_HEAT_MAX    = 4.0;
export const LASER_OVERHEAT_CD = 2.0;
export const HIT_FLASH_DUR     = 0.08;

// ── Upgrade tiers ─────────────────────────────────────────────────────────────
export const UPGRADE_TIERS = [
  { costMult: 0.8, dmgMult: 1.30, rngMult: 1.15, cdMult: 0.80 },  // base → tier 1
  { costMult: 1.2, dmgMult: 1.30, rngMult: 1.15, cdMult: 0.80 },  // tier 1 → tier 2
];
export const TIER_COLORS = [0xffaa00, 0xaa44ff];

// ── Enemy types ───────────────────────────────────────────────────────────────
// modelScale: uniform scale applied to the loaded GLTF model so sizes are
//   visually distinct (UFO models are all ~1 unit wide by default).
// h: HP-bar Y offset above the mesh origin (= model height × modelScale + gap).
export const ENEMY_TYPES = {
  normal: { hp:100,  speed:2.0, reward: 10, h:0.80, modelScale:1.00, color:0xE24B4A, modelKey:'enemy_normal' },
  fast:   { hp: 60,  speed:4.0, reward: 15, h:0.60, modelScale:0.75, color:0xEF9F27, modelKey:'enemy_fast'   },
  tank:   { hp:400,  speed:1.0, reward: 25, h:0.90, modelScale:1.35, color:0x534AB7, modelKey:'enemy_tank'   },
  boss:   { hp:3000, speed:0.7, reward:200, h:1.40, modelScale:2.20, color:0xcc00ff, modelKey:'enemy_tank'   },
};
export const HP_SCALE    = 1.20;
export const SPEED_SCALE = 1.04;

// ── Level data helpers ────────────────────────────────────────────────────
export function getCurrentLevel(levelIndex = 0) {
  return LEVELS[Math.max(0, Math.min(levelIndex, LEVELS.length - 1))];
}

export function getWaveDefs(levelIndex = 0) {
  return getCurrentLevel(levelIndex).waves;
}

export function getWaypoints(levelIndex = 0) {
  return getCurrentLevel(levelIndex).waypoints;
}

// ── Tower definitions ─────────────────────────────────────────────────────────
// kind      : 'basic' | 'sniper' | 'laser' | 'missile'  — drives Tower logic
// barrelHalf: half the barrel length used for barrel-tip/muzzle-flash offset
// projSpeed : projectile travel speed (units/s); 0 = no projectile (laser)
// projSize  : projectile sphere radius
export const TOWER_DEFS = [
  { name:'Basic',   stat:'Rng 3.5 · Dmg 20 · 1 s',     cost: 50, kind:'basic',
    range:3.5, damage:20, cooldown:1.0, barrelHalf:0.23, projSpeed:8,  projSize:0.10,
    baseColor:0x1e3a7a, turretColor:0x4488ff, projColor:0xaaddff, ghostColor:0x378add,
    splashR:0, slowMult:1, slowSec:0, modelKey:'tower_basic' },
  { name:'Splash',  stat:'Rng 2.5 · AoE 40 · 1.5 s',   cost: 80, kind:'basic',
    range:2.5, damage:40, cooldown:1.5, barrelHalf:0.23, projSpeed:8,  projSize:0.13,
    baseColor:0x7a1c0e, turretColor:0xff4411, projColor:0xff9955, ghostColor:0xd85a30,
    splashR:1.5, slowMult:1, slowSec:0, modelKey:'tower_splash' },
  { name:'Slow',    stat:'Rng 4 · ×0.4 · 2 s',          cost: 60, kind:'basic',
    range:4.0, damage:0,  cooldown:2.0, barrelHalf:0.23, projSpeed:8,  projSize:0.10,
    baseColor:0x0e3d4a, turretColor:0x22ddb8, projColor:0x77ffee, ghostColor:0x1d9e75,
    splashR:0, slowMult:0.4, slowSec:2.0, modelKey:'tower_slow' },
  { name:'Sniper',  stat:'Rng 7 · Dmg 80 · 3 s',        cost: 90, kind:'sniper',
    range:7.0, damage:80, cooldown:3.0, barrelHalf:0.35, projSpeed:14, projSize:0.08,
    baseColor:0x2a1a40, turretColor:0xaa66ff, projColor:0xddaaff, ghostColor:0x7744cc,
    splashR:0, slowMult:1, slowSec:0, modelKey:'tower_sniper' },
  { name:'Laser',   stat:'Rng 2.5 · 30/s · 4 s heat',  cost:100, kind:'laser',
    range:2.5, damage:30, cooldown:0,   barrelHalf:0.11, projSpeed:0,  projSize:0,
    baseColor:0x0a2a1a, turretColor:0x00ffcc, projColor:0x00ffcc, ghostColor:0x00aa88,
    splashR:0, slowMult:1, slowSec:0, modelKey:'tower_laser' },
  { name:'Missile', stat:'Rng 4 · AoE 60 · 4 s',        cost:120, kind:'missile',
    range:4.0, damage:60, cooldown:4.0, barrelHalf:0.24, projSpeed:5,  projSize:0.18,
    baseColor:0x3a2010, turretColor:0xff8833, projColor:0xff6600, ghostColor:0xcc5500,
    splashR:2.5, slowMult:1, slowSec:0, modelKey:'tower_missile' },
];

// ── Utilities ─────────────────────────────────────────────────────────────────
export const tileToWorld = (col, row, y=0) =>
  new THREE.Vector3(col - COLS/2 + 0.5, y, row - ROWS/2 + 0.5);

export const tileKey = (c, r) => `${c},${r}`;

// ── Waypoints & path helpers ──────────────────────────────────────────────
// Call buildPathData() after loading a level to compute WP_WORLD, WP_DISTS, PATH_TILES
export let WAYPOINTS = LEVELS[0].waypoints;  // default to level 0
export let WP_WORLD  = [];
export let WP_DISTS  = [];
export let PATH_TILES = new Set();

export function buildPathData(waypoints = WAYPOINTS) {
  WAYPOINTS = waypoints;
  WP_WORLD  = waypoints.map(([c,r]) => tileToWorld(c, r, 0));
  WP_DISTS  = WP_WORLD.slice(0,-1).map((v,i) => v.distanceTo(WP_WORLD[i+1]));

  PATH_TILES.clear();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [c1,r1] = waypoints[i], [c2,r2] = waypoints[i+1];
    if (c1 === c2) { for (let r = Math.min(r1,r2); r <= Math.max(r1,r2); r++) PATH_TILES.add(tileKey(c1,r)); }
    else           { for (let c = Math.min(c1,c2); c <= Math.max(c1,c2); c++) PATH_TILES.add(tileKey(c,r1)); }
  }
}

// Initialize with level 0
buildPathData();

// ── Save keys ─────────────────────────────────────────────────────────────────
export const SAVE_KEY = 'iso-td-v1';
export const BEST_KEY = 'iso-td-best';
