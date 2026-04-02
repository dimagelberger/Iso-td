import * as THREE from 'three';
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import {
  COLS, ROWS, VIEW, PATH_TILES, tileKey, tileToWorld, WP_WORLD,
} from './constants.js';
import { state, enemies, towers, projectiles, tileObjects } from './state.js';
import { assetManager, MODEL_MANIFEST } from './assetManager.js';
import { ParticleSystem, updateFlashes } from './particles.js';
import { WaveManager } from './waves.js';
import { initUI, updateHUD, tryLoadSave, clearSave, showEndScreen, updateTowerCardIcons } from './ui.js';

// ── Scene / camera / renderers ────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1117);

let aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-VIEW*aspect, VIEW*aspect, VIEW, -VIEW, -200, 200);
const ISO_D  = 40 / Math.sqrt(3);
camera.position.set(ISO_D, ISO_D, ISO_D);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.cssText = 'position:absolute;top:0';
document.body.appendChild(renderer.domElement);

const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.cssText = 'position:absolute;top:0;pointer-events:none';
document.body.appendChild(cssRenderer.domElement);

// Publish to shared state so all modules can access renderers
state.scene       = scene;
state.camera      = camera;
state.renderer    = renderer;
state.cssRenderer = cssRenderer;

// ── Lighting ──────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 20, 10);
sun.target.position.set(0, 0, 0);
scene.add(sun); scene.add(sun.target);

// ── Tile grid colours (used after preload) ───────────────────────────────────
const C_EVEN = new THREE.Color(0x3d6b50);
const C_ODD  = new THREE.Color(0x4f8c68);

const tileGeo = new THREE.PlaneGeometry(1, 1);
tileGeo.rotateX(-Math.PI / 2);

// Determine which tile model + Y-rotation to use for a given path tile.
// Checks which of the 4 cardinal neighbours are also path tiles.
function _pathTileType(col, row) {
  const N = PATH_TILES.has(tileKey(col, row - 1));
  const S = PATH_TILES.has(tileKey(col, row + 1));
  const E = PATH_TILES.has(tileKey(col + 1, row));
  const W = PATH_TILES.has(tileKey(col - 1, row));
  // Straight (N-S or endpoint with only vertical neighbours)
  if((N || S) && !E && !W) return { key:'tile_straight', rotY: 0 };
  // Straight (E-W or endpoint with only horizontal neighbours)
  if((E || W) && !N && !S) return { key:'tile_straight', rotY: Math.PI / 2 };
  if(N && S)               return { key:'tile_straight', rotY: 0 };
  if(E && W)               return { key:'tile_straight', rotY: Math.PI / 2 };
  // Corners — tile-corner-round default connects E+S (east + south openings)
  if(E && S) return { key:'tile_corner', rotY:  0 };
  if(N && E) return { key:'tile_corner', rotY:  Math.PI / 2 };
  if(N && W) return { key:'tile_corner', rotY:  Math.PI };
  if(W && S) return { key:'tile_corner', rotY: -Math.PI / 2 };
  return { key:'tile_straight', rotY: 0 };
}

// ── System singletons ─────────────────────────────────────────────────────────
state.particles = new ParticleSystem();
state.wm        = new WaveManager();

// ── UI ────────────────────────────────────────────────────────────────────────
initUI();

// ── Per-frame update helpers ──────────────────────────────────────────────────
function updateEnemies(dt) {
  for(let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.update(dt);
    if(e.exited) {
      e.destroy(); enemies.splice(i, 1);
      state.lives = Math.max(0, state.lives - 1);
      updateHUD();
      if(state.lives <= 0 && !state.gameOver) {
        state.gameOver = true;
        clearSave();
        showEndScreen(false);
      }
    } else if(e.dead) {
      e.destroy(); enemies.splice(i, 1);
    }
  }
}
function updateTowers(dt)      { for(const t of towers)      t.update(dt); }
function updateProjectiles(dt) {
  for(let i = projectiles.length - 1; i >= 0; i--) {
    projectiles[i].update(dt);
    if(projectiles[i].dead) projectiles.splice(i, 1);
  }
}

// ── Preload assets, then start the render loop ────────────────────────────────
const loadingScreenEl = document.getElementById('loading-screen');
const loadingBarEl    = document.getElementById('loading-bar');
const loadingStatusEl = document.getElementById('loading-status');

assetManager.preload(MODEL_MANIFEST, (loaded, total) => {
  loadingBarEl.style.width    = (total > 0 ? (loaded / total) * 100 : 0) + '%';
  loadingStatusEl.textContent = `${loaded} / ${total}`;
}).then(() => {
  // ── Build tile grid (path tiles use GLTF models) ────────────────────────────
  for(let row = 0; row < ROWS; row++) for(let col = 0; col < COLS; col++) {
    const onPath = PATH_TILES.has(tileKey(col, row));
    const px = col - COLS/2 + 0.5, pz = row - ROWS/2 + 0.5;

    if(onPath) {
      // Invisible flat plane — handles raycasting and hover
      const plane = new THREE.Mesh(
        tileGeo,
        new THREE.MeshBasicMaterial({ visible: false })
      );
      plane.position.set(px, 0.01, pz);
      plane.userData.tileX  = col;
      plane.userData.tileZ  = row;
      plane.userData.onPath = true;
      scene.add(plane);
      tileObjects.push(plane);

      // GLTF tile model — purely visual
      const { key, rotY } = _pathTileType(col, row);
      const model = assetManager.get(key);
      model.position.set(px, 0, pz);
      model.rotation.y = rotY;
      scene.add(model);

      // Capture original material colors so hover can restore them exactly
      const origColors = new Map();
      model.traverse(o => { if(o.isMesh) origColors.set(o, o.material.color.clone()); });
      plane.userData.setHoverColor   = hex => model.traverse(o => { if(o.isMesh) o.material.color.setHex(hex); });
      plane.userData.clearHoverColor = ()  => model.traverse(o => { if(o.isMesh) o.material.color.copy(origColors.get(o)); });

    } else {
      // Grass tile — plain coloured plane (raycasting + hover work as normal)
      const even = ((row + col) % 2 === 0);
      const base = even ? C_EVEN : C_ODD;
      const mesh = new THREE.Mesh(tileGeo, new THREE.MeshBasicMaterial({ color: base.clone() }));
      mesh.position.set(px, 0, pz);
      mesh.userData.tileX     = col;
      mesh.userData.tileZ     = row;
      mesh.userData.onPath    = false;
      mesh.userData.baseColor = base.clone();
      scene.add(mesh);
      tileObjects.push(mesh);
    }
  }

  // ── Scatter decorative detail models on grass tiles ────────────────────────
  const DETAIL_KEYS = ['detail_tree', 'detail_rocks', 'detail_dirt'];
  const _hash = (c, r) => (((c * 73856093) ^ (r * 19349663)) >>> 0);
  for(let row = 0; row < ROWS; row++) for(let col = 0; col < COLS; col++) {
    if(PATH_TILES.has(tileKey(col, row))) continue;
    const h = _hash(col, row);
    if((h % 10) > 2) continue;  // ~30% of non-path tiles
    const key = DETAIL_KEYS[h % DETAIL_KEYS.length];
    const dm  = assetManager.get(key);
    if(!dm || dm.children.length === 0) continue;
    const px = col - COLS/2 + 0.5, pz = row - ROWS/2 + 0.5;
    dm.position.set(px, 0, pz);
    dm.rotation.y = (h % 4) * Math.PI / 2;
    scene.add(dm);
  }

  loadingScreenEl.classList.add('hidden');
  updateTowerCardIcons();
  tryLoadSave();
  updateHUD();

  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1) * state.gameSpeed;
    if(!state.gameOver) {
      updateEnemies(dt);
      updateTowers(dt);
      updateProjectiles(dt);
      state.wm.update(dt);
    }
    state.particles.update(dt);
    updateFlashes(dt);
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
  })();
}).catch(err => {
  console.error('Preload failed:', err);
  const sub = document.getElementById('loading-sub');
  if(sub) sub.textContent = 'Error: ' + (err?.message ?? err);
});

// ── Touch camera controls: 1-finger pan, 2-finger pinch-zoom ─────────────────
const ZOOM_MIN = 0.4, ZOOM_MAX = 2.2;
const PAN_LIMIT = 8;   // max world-unit offset from centre

// Camera right and screen-up projected onto ground plane (45° isometric)
const _camRight    = new THREE.Vector3( 1, 0, -1).normalize();
const _camUp       = new THREE.Vector3(-1, 0, -1).normalize();
const _panOffset   = new THREE.Vector3();
const _basePos     = camera.position.clone();

let _touch1X = 0, _touch1Y = 0;
let _pinchDist = 0;
let _dragMoved = false;

function _applyCamera() {
  const asp = window.innerWidth / window.innerHeight;
  const z   = state.cameraZoom;
  camera.left   = -VIEW * asp * z;  camera.right  = VIEW * asp * z;
  camera.top    =  VIEW * z;        camera.bottom = -VIEW * z;
  camera.updateProjectionMatrix();
  camera.position.copy(_basePos).add(_panOffset);
  camera.lookAt(_panOffset.x, 0, _panOffset.z);
}

renderer.domElement.addEventListener('touchstart', e => {
  if(e.touches.length === 1) {
    _touch1X   = e.touches[0].clientX;
    _touch1Y   = e.touches[0].clientY;
    _dragMoved = false;
    state.touchDragging = false;
  } else if(e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    _pinchDist = Math.sqrt(dx*dx + dy*dy);
    state.touchDragging = true;
  }
}, { passive: true });

renderer.domElement.addEventListener('touchmove', e => {
  if(e.touches.length === 2) {
    // Pinch zoom
    const dx   = e.touches[0].clientX - e.touches[1].clientX;
    const dy   = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    state.cameraZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, state.cameraZoom * (_pinchDist / dist)));
    _pinchDist = dist;
    _applyCamera();
  } else if(e.touches.length === 1) {
    const cx = e.touches[0].clientX, cy = e.touches[0].clientY;
    const ddx = cx - _touch1X, ddy = cy - _touch1Y;
    if(!_dragMoved && Math.sqrt(ddx*ddx + ddy*ddy) < 8) return;
    _dragMoved = true;
    state.touchDragging = true;

    // Screen pixels → world units
    const unitsPerPx = (2 * VIEW * state.cameraZoom) / window.innerHeight;
    const wx = (-ddx + ddy) / Math.SQRT2 * unitsPerPx;
    const wz = ( ddx + ddy) / Math.SQRT2 * unitsPerPx;
    _panOffset.x = Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, _panOffset.x + wx));
    _panOffset.z = Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, _panOffset.z + wz));
    _touch1X = cx; _touch1Y = cy;
    _applyCamera();
  }
}, { passive: true });

renderer.domElement.addEventListener('touchend', () => {
  // Reset drag flag after a short delay so ui.js touchend can read it
  setTimeout(() => { state.touchDragging = false; }, 50);
}, { passive: true });
