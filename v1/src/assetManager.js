import * as THREE from 'three';
import { TOWER_DEFS } from './constants.js';

// ── Fallback model builders ───────────────────────────────────────────────────
// Each returns a THREE.Group whose child named 'turret' is the rotating part.
// Enemy groups have no named convention – all children are coloured together.
const _fb = (hex, extra={}) => new THREE.MeshToonMaterial({ color: hex, ...extra });

function _fbTowerBasic() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.44,0.28,8), _fb(TOWER_DEFS[0].baseColor));
  base.position.y = 0.14; g.add(base);
  const t = new THREE.Mesh(new THREE.BoxGeometry(0.30,0.30,0.46), _fb(TOWER_DEFS[0].turretColor));
  t.name = 'turret'; t.position.y = 0.46; g.add(t); return g;
}
function _fbTowerSplash() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.50,0.55,0.22,12), _fb(TOWER_DEFS[1].baseColor));
  base.position.y = 0.11; g.add(base);
  const dGeo = new THREE.SphereGeometry(0.32,12,8,0,Math.PI*2,0,Math.PI/2);
  const t = new THREE.Mesh(dGeo, _fb(TOWER_DEFS[1].turretColor));
  t.name = 'turret'; t.position.y = 0.22; g.add(t); return g;
}
function _fbTowerSlow() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.26,0.12,6), _fb(TOWER_DEFS[2].baseColor));
  base.position.y = 0.06; g.add(base);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.15,1.0,8), _fb(TOWER_DEFS[2].baseColor));
  spire.position.y = 0.62; g.add(spire);
  const t = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.14,0.40), _fb(TOWER_DEFS[2].turretColor));
  t.name = 'turret'; t.position.y = 0.68; g.add(t);
  const rGeo = new THREE.TorusGeometry(0.38,0.045,8,32); rGeo.rotateX(Math.PI/2);
  const ring = new THREE.Mesh(rGeo, _fb(TOWER_DEFS[2].turretColor, {transparent:true, opacity:0.85}));
  ring.name = 'orbit_ring'; ring.position.y = 0.55; g.add(ring); return g;
}
function _fbTowerSniper() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.24,0.20,6), _fb(TOWER_DEFS[3].baseColor));
  base.position.y = 0.10; g.add(base);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.12,0.90,6), _fb(TOWER_DEFS[3].baseColor));
  body.position.y = 0.65; g.add(body);
  const bGeo = new THREE.CylinderGeometry(0.04,0.05,0.70,6); bGeo.rotateX(Math.PI/2);
  const t = new THREE.Mesh(bGeo, _fb(TOWER_DEFS[3].turretColor));
  t.name = 'turret'; t.position.y = 1.10; g.add(t); return g;
}
function _fbTowerLaser() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.52,0.28,0.52), _fb(TOWER_DEFS[4].baseColor));
  base.position.y = 0.14; g.add(base);
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.22,0),
    _fb(TOWER_DEFS[4].turretColor, {emissive:TOWER_DEFS[4].turretColor, emissiveIntensity:0.3}));
  crystal.scale.y = 1.8; crystal.name = 'turret'; crystal.position.y = 0.55; g.add(crystal); return g;
}
function _fbTowerMissile() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.65,0.28,0.65), _fb(TOWER_DEFS[5].baseColor));
  base.position.y = 0.14; g.add(base);
  const lGeo = new THREE.CylinderGeometry(0.09,0.12,0.55,8); lGeo.rotateX(Math.PI/2);
  const t = new THREE.Mesh(lGeo, _fb(TOWER_DEFS[5].turretColor));
  t.name = 'turret'; t.position.y = 0.42; g.add(t); return g;
}
function _fbEnemyNormal() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25,0.40,4,8), _fb(0xE24B4A)); body.position.y = 0.45; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.20,8,8),        _fb(0xE24B4A)); head.position.y = 1.05; g.add(head);
  return g;
}
function _fbEnemyFast() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18,0.35,4,8), _fb(0xEF9F27)); body.position.y = 0.355; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16,8,8),        _fb(0xEF9F27)); head.position.y = 0.84;  g.add(head);
  g.rotation.x = -Math.PI/12; return g;
}
function _fbEnemyTank() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.70,0.50,0.70), _fb(0x534AB7)); body.position.y = 0.25; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22,8,8),    _fb(0x534AB7)); head.position.y = 0.78; g.add(head);
  const pm = _fb(0x3a3580);
  for(const sx of [-1,1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.30,0.72),pm); p.position.set(sx*0.42,0.25,0); g.add(p); }
  return g;
}

function _fbNull() { return new THREE.Group(); }

function _fbTileStraight() {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
  g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x8a7050 })));
  return g;
}

// ── Model manifest ────────────────────────────────────────────────────────────
// Each entry is assembled at load-time from one or more GLB parts.
// The part with name:'turret' becomes the child that the Tower class rotates.
//   round-build-a/b/c  h≈1.0  →  weapon at y=0.85
//   round-build-d      h≈1.79 →  weapon at y=1.55  (tall sniper)
//   round-build-e      h≈1.56 →  crystals at y=1.35 (laser tower)
//   square-build-a     h≈1.0  →  weapon at y=0.85
export const MODEL_MANIFEST = [
  { key:'tower_basic',   fallback:_fbTowerBasic,
    parts:[ {url:'models/tower-round-build-a.glb'},
            {url:'models/weapon-cannon.glb',   y:0.85, name:'turret'} ] },
  { key:'tower_splash',  fallback:_fbTowerSplash,
    parts:[ {url:'models/tower-round-build-b.glb'},
            {url:'models/weapon-catapult.glb', y:0.85, name:'turret'} ] },
  { key:'tower_slow',    fallback:_fbTowerSlow,
    parts:[ {url:'models/tower-round-build-c.glb'},
            {url:'models/weapon-turret.glb',   y:0.85, name:'turret'} ] },
  { key:'tower_sniper',  fallback:_fbTowerSniper,
    parts:[ {url:'models/tower-round-build-d.glb'},
            {url:'models/weapon-ballista.glb', y:1.55, name:'turret'} ] },
  { key:'tower_laser',   fallback:_fbTowerLaser,
    parts:[ {url:'models/tower-round-build-e.glb'},
            {url:'models/tower-round-crystals.glb', y:1.35, name:'turret'} ] },
  { key:'tower_missile', fallback:_fbTowerMissile,
    parts:[ {url:'models/tower-square-build-a.glb'},
            {url:'models/weapon-cannon.glb',   y:0.85, name:'turret'} ] },
  { key:'enemy_normal',  fallback:_fbEnemyNormal,
    parts:[ {url:'models/enemy-normal.glb'} ] },
  { key:'enemy_fast',    fallback:_fbEnemyFast,
    parts:[ {url:'models/enemy-fast.glb'} ] },
  { key:'enemy_tank',    fallback:_fbEnemyTank,
    parts:[ {url:'models/enemy-tank.glb'} ] },
  { key:'tile_straight', fallback:_fbTileStraight,
    parts:[ {url:'models/tile-straight.glb'} ] },
  { key:'tile_corner',   fallback:_fbTileStraight,
    parts:[ {url:'models/tile-corner.glb'} ] },
  { key:'detail_tree',  fallback:_fbNull, parts:[ {url:'models/detail-tree.glb'}  ] },
  { key:'detail_rocks', fallback:_fbNull, parts:[ {url:'models/detail-rocks.glb'} ] },
  { key:'detail_dirt',  fallback:_fbNull, parts:[ {url:'models/detail-dirt.glb'}  ] },
];

// ── AssetManager ──────────────────────────────────────────────────────────────
// Preloads all GLB files via GLTFLoader before the game starts.
// If a file is missing (404) the registered fallback factory is used instead,
// so the game is always playable without any model files present.
export class AssetManager {
  constructor() { this._cache = new Map(); }

  async preload(manifest, onProgress) {
    // v1: always use procedural fallback meshes — no GLTF loading
    const loader = null;

    // File cache: avoid fetching the same GLB twice (weapon-cannon.glb is shared
    // by tower_basic and tower_missile).
    const fileCache = new Map();
    const loadPart = async (url) => {
      if(fileCache.has(url)) {
        const src = fileCache.get(url);
        const node = src.clone(true);
        node.traverse(o => { if(o.isMesh) o.material = o.material.clone(); });
        return node;
      }
      // Serial fetch HEAD: local Python server responds to 404 in < 5 ms.
      const ok = await fetch(url, {method:'HEAD'}).then(r => r.ok).catch(() => false);
      if(!ok) throw new Error('not found: ' + url);
      const gltf = await new Promise((res, rej) => loader.load(url, res, undefined, rej));
      fileCache.set(url, gltf.scene);         // store original for cloning
      const node = gltf.scene.clone(true);
      node.traverse(o => { if(o.isMesh) o.material = o.material.clone(); });
      return node;
    };

    let loaded = 0;
    onProgress(0, manifest.length);
    for(const entry of manifest) {
      let model = null;
      if(loader) {
        try {
          const group = new THREE.Group();
          for(const p of entry.parts) {
            const node = await loadPart(p.url);
            if(p.y)    node.position.y = p.y;
            if(p.name) node.name       = p.name;
            group.add(node);
          }
          model = group;
        } catch(e) {
          console.info('AssetManager: assembly failed for', entry.key, '—', e?.message ?? e);
        }
      }
      if(!model) {
        try { model = entry.fallback(); }
        catch(fe) {
          console.error('AssetManager: fallback failed for', entry.key, fe);
          model = new THREE.Group();
        }
      }
      this._cache.set(entry.key, model);
      onProgress(++loaded, manifest.length);
    }
  }

  // Returns a deep-cloned instance with independent materials.
  get(key) {
    const src = this._cache.get(key);
    if(!src) { console.warn('AssetManager: missing', key); return new THREE.Group(); }
    const clone = src.clone();
    clone.traverse(o => { if(o.isMesh) o.material = o.material.clone(); });
    return clone;
  }
}

export const assetManager = new AssetManager();
