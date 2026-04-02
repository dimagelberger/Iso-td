import * as THREE from 'three';
import {
  TOWER_DEFS, WAVE_DEFS, TOTAL_WAVES, UPGRADE_TIERS,
  LASER_HEAT_MAX, START_GOLD, START_LIVES,
  tileKey, tileToWorld, VIEW, SAVE_KEY, BEST_KEY,
} from './constants.js';
import { state, enemies, towers, projectiles, tileObjects, towerMeshMap, OCCUPIED } from './state.js';
import { Tower } from './towers.js';
import { flashes } from './particles.js';
import { assetManager } from './assetManager.js';

// ── DOM element refs ──────────────────────────────────────────────────────────
const hudLives    = document.getElementById('hud-lives');
const hudGold     = document.getElementById('hud-gold');
const hudWave     = document.getElementById('hud-wave');
const hudPrep     = document.getElementById('hud-prep');
const prepBadge   = document.getElementById('prep-badge');
const prepBar     = document.getElementById('prep-bar');
const waveBtnEl   = document.getElementById('wave-btn');
const waveSubEl   = document.getElementById('wave-sub');
const towerPanelEl = document.getElementById('tower-panel');
const infoPanelEl  = document.getElementById('info-panel');
const ipNameEl     = document.getElementById('ip-name');
const ipTierEl     = document.getElementById('ip-tier');
const ipStatsEl    = document.getElementById('ip-stats');
const ipNextEl     = document.getElementById('ip-next');
const ipUpgradeEl  = document.getElementById('ip-upgrade');
const ipSellEl     = document.getElementById('ip-sell');
const ipCloseEl    = document.getElementById('ip-close');
const announceEl   = document.getElementById('wave-announce');
const waWaveEl     = document.getElementById('wa-wave');
const waCompEl     = document.getElementById('wa-comp');
const endScreenEl  = document.getElementById('end-screen');
const endTitleEl   = document.getElementById('end-title');
const endMsgEl     = document.getElementById('end-msg');
const endStatsEl   = document.getElementById('end-stats');
const endBestEl    = document.getElementById('end-best');
const endRestartEl = document.getElementById('end-restart');
const infoEl       = document.getElementById('info');

// ── Hover colors for tile highlighting ───────────────────────────────────────
const C_HOVER      = new THREE.Color(0xf5c842);
const C_HOVER_PATH = new THREE.Color(0x7788bb);

// ── Range preview + ghost tower (created in initUI / selectTowerType) ────────
let rangeDisc, rangeEdge, ghostModel, ghostRings;

// ── Raycaster ────────────────────────────────────────────────────────────────
const raycaster  = new THREE.Raycaster();
const mouse      = new THREE.Vector2();
let   hoveredTile = null;

// ── HUD ───────────────────────────────────────────────────────────────────────
export function updateHUD() {
  hudLives.textContent = state.lives;
  hudLives.className   = 'tb-val' + (state.lives <= 5 ? ' danger' : '');
  hudGold.textContent  = state.gold;
  hudWave.textContent  = state.wm
    ? (state.wm.waveNum > 0 ? `${state.wm.waveNum} / ${TOTAL_WAVES}` : `— / ${TOTAL_WAVES}`)
    : `— / ${TOTAL_WAVES}`;
  updateTowerCards();
}

// ── Wave announce ─────────────────────────────────────────────────────────────
export function showAnnounce(n) {
  waWaveEl.textContent = `WAVE ${n}`;
  const def = WAVE_DEFS[n - 1];
  const compParts = def.map(g => {
    const label = g.type.charAt(0).toUpperCase() + g.type.slice(1);
    return `${g.count} ${label}`;
  });
  waCompEl.textContent = compParts.join(' · ') + (n === TOTAL_WAVES ? '  ·  FINAL WAVE' : '');
  announceEl.classList.remove('show');
  void announceEl.offsetWidth;   // force reflow to restart animation
  announceEl.classList.add('show');
}

export function setWaveSub(n) {
  waveSubEl.textContent = WAVE_DEFS[n - 1].map(g => `${g.count}× ${g.type}`).join(' · ');
}

// ── Tower info panel ──────────────────────────────────────────────────────────
function _fmtDmg(t, mult = 1) {
  if(t.def.kind === 'laser') return `DPS ${Math.round(t._damage * mult)}`;
  if(t.def.damage > 0)       return `Dmg ${Math.round(t._damage * mult)}`;
  return `Slow ×${t.def.slowMult}`;
}
function _fmtCd(t, mult = 1) {
  if(t.def.kind === 'laser') return `${LASER_HEAT_MAX}s heat`;
  return `Cd ${(t._cooldown * mult).toFixed(2)}s`;
}
function _refreshInfoPanel() {
  const t = state.activeTower; if(!t) return;
  const lbls = ['BASE','TIER 1','TIER 2'], cls = ['t0','t1','t2'];
  ipNameEl.textContent = t.def.name;
  ipTierEl.textContent = lbls[t.tier];
  ipTierEl.className   = cls[t.tier];
  ipNameEl.style.color = '#' + t.def.turretColor.toString(16).padStart(6, '0');
  ipStatsEl.innerHTML  = `${_fmtDmg(t)}<br>Rng ${t._range.toFixed(1)}<br>${_fmtCd(t)}`;
  if(t.tier < 2) {
    const upg  = UPGRADE_TIERS[t.tier];
    const cost = t.upgradeCost();
    ipNextEl.innerHTML =
      `▲ Tier ${t.tier + 1}: ${_fmtDmg(t, upg.dmgMult)}<br>`+
      `▲ Rng ${(t._range * upg.rngMult).toFixed(1)} · ${_fmtCd(t, upg.cdMult)}`;
    ipUpgradeEl.textContent = `Upgrade → Tier ${t.tier + 1}  (${cost}g)`;
    ipUpgradeEl.disabled    = (state.gold < cost);
    ipUpgradeEl.style.display = '';
    ipNextEl.style.display    = '';
  } else {
    ipUpgradeEl.style.display = 'none';
    ipNextEl.style.display    = 'none';
  }
  ipSellEl.textContent = `Sell  +${t.sellValue()}g`;
}

function showRangePreview(wx, wz, range, color) {
  const c = color || 0x4488ff;
  rangeDisc.position.set(wx, 0.01, wz); rangeEdge.position.set(wx, 0.01, wz);
  rangeDisc.scale.setScalar(range);     rangeEdge.scale.setScalar(range);
  rangeDisc.material.color.setHex(c);   rangeEdge.material.color.setHex(c);
  rangeDisc.visible = rangeEdge.visible = true;
}
function hideRangePreview() { rangeDisc.visible = rangeEdge.visible = false; }

export function showInfoPanel(tower) {
  state.activeTower = tower;
  _refreshInfoPanel();
  infoPanelEl.classList.add('show');
  showRangePreview(tower.baseMesh.position.x, tower.baseMesh.position.z, tower._range, tower.def.turretColor);
}
export function hideInfoPanel() {
  infoPanelEl.classList.remove('show');
  state.activeTower = null;
  hideRangePreview();
}

// ── Ghost tower (placement preview) ──────────────────────────────────────────
function showGhost(col, row) {
  if(!ghostModel) return;
  const pos = tileToWorld(col, row, 0);
  ghostModel.position.set(pos.x, 0, pos.z);
  ghostModel.visible = true;
  ghostRings.forEach((ring, i) => {
    ring.visible = (i === state.previewTypeIdx);
    if(i === state.previewTypeIdx) ring.position.set(pos.x, 0.01, pos.z);
  });
}
function hideGhost() {
  if(ghostModel) ghostModel.visible = false;
  if(ghostRings) ghostRings.forEach(r => { r.visible = false; });
}

// ── Tower panel (bottom bar) ──────────────────────────────────────────────────
// Render each tower to a tiny canvas and use it as the card icon.
// Called from main.js after assetManager.preload() completes.
export function updateTowerCardIcons() {
  const SZ = 80;
  const off = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  off.setSize(SZ, SZ);
  off.setPixelRatio(1);
  const iScene = new THREE.Scene();
  iScene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(2, 4, 2); iScene.add(sun);
  const iCam = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
  iCam.position.set(1.1, 1.4, 1.1);
  iCam.lookAt(0, 0.45, 0);
  TOWER_DEFS.forEach((def, i) => {
    const model = assetManager.get(def.modelKey);
    iScene.add(model);
    off.render(iScene, iCam);
    const url = off.domElement.toDataURL('image/png');
    iScene.remove(model);
    model.traverse(o => { if(o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    const icon = towerPanelEl.children[i]?.querySelector('.tc-icon');
    if(icon) {
      icon.style.background = '';
      icon.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:contain;border-radius:3px;display:block">`;
    }
  });
  off.dispose();
}

export function updateTowerCards() {
  towerPanelEl.querySelectorAll('.tc-card').forEach((card, i) => {
    const def = TOWER_DEFS[i];
    const sel = (state.selectedTypeIdx === i);
    const hex = '#' + def.turretColor.toString(16).padStart(6, '0');
    card.classList.toggle('tc-disabled', state.gold < def.cost);
    card.style.borderColor = sel ? hex : '';
    card.style.background  = sel ? `${hex}18` : '';
  });
}

export function selectTowerType(idx) {
  if(ghostModel) { state.scene.remove(ghostModel); ghostModel = null; }
  state.selectedTypeIdx = idx;
  state.previewTypeIdx  = Math.max(0, idx);
  if(idx >= 0) {
    ghostModel = assetManager.get(TOWER_DEFS[idx].modelKey);
    ghostModel.traverse(o => {
      if(o.isMesh) {
        o.material = o.material.clone();
        o.material.transparent = true;
        o.material.opacity = 0.45;
        o.material.depthWrite = false;
      }
    });
    ghostModel.visible = false;
    state.scene.add(ghostModel);
  }
  updateTowerCards();
  if(idx < 0) hideGhost();
}

export function placeTower(col, row) {
  if(state.selectedTypeIdx < 0 || state.gameOver) return;
  const def = TOWER_DEFS[state.selectedTypeIdx];
  if(state.gold < def.cost) return;
  state.gold -= def.cost;
  OCCUPIED.add(tileKey(col, row));
  towers.push(new Tower(col, row, state.selectedTypeIdx));
  updateHUD();
}

// ── Save / load ───────────────────────────────────────────────────────────────
export function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      gold:    state.gold,
      lives:   state.lives,
      waveNum: state.wm.waveNum,
      towers:  towers.map(t => ({ col:t._col, row:t._row, typeIdx:t._typeIdx, tier:t.tier, totalSpent:t.totalSpent })),
    }));
  } catch(e) {}
}
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch(e) {} }

export function recordBestWave(n) {
  try {
    const prev = parseInt(localStorage.getItem(BEST_KEY) || '0');
    if(n > prev) localStorage.setItem(BEST_KEY, n);
    return Math.max(prev, n);
  } catch(e) { return n; }
}
export function getBestWave() {
  try { return parseInt(localStorage.getItem(BEST_KEY) || '0'); } catch(e) { return 0; }
}

export function tryLoadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if(!raw) return;
    const s   = JSON.parse(raw);
    state.gold  = s.gold  ?? START_GOLD;
    state.lives = s.lives ?? START_LIVES;
    for(const td of (s.towers || [])) {
      const t = new Tower(td.col, td.row, td.typeIdx);
      const savedTier = td.tier || 0;
      while(t.tier < savedTier) t._applyUpgradeMult();
      t.totalSpent = td.totalSpent ?? t.def.cost;
      towers.push(t);
      OCCUPIED.add(tileKey(td.col, td.row));
    }
    const n = s.waveNum || 0;
    if(n > 0 && n < TOTAL_WAVES) {
      state.wm.waveNum      = n;
      waveBtnEl.textContent = `Start Wave ${n + 1}`;
      waveBtnEl.disabled    = false;
      setWaveSub(n + 1);
    }
    updateHUD();
  } catch(e) { clearSave(); }
}

// ── End screen ────────────────────────────────────────────────────────────────
export function showEndScreen(victory) {
  state.gameOver = true;
  const best = recordBestWave(state.wm.waveNum);
  endTitleEl.textContent = victory ? 'VICTORY' : 'GAME OVER';
  endTitleEl.className   = victory ? 'victory'  : 'gameover';
  endMsgEl.textContent   = victory
    ? `All ${TOTAL_WAVES} waves defeated!`
    : `Survived ${state.wm.waveNum} of ${TOTAL_WAVES} waves.`;
  endStatsEl.innerHTML =
    `Waves survived: <b>${state.wm.waveNum}</b><br>`+
    `Enemies killed: <b>${state.killCount}</b><br>`+
    `Gold earned: <b>${state.goldEarned}</b>`;
  endBestEl.textContent = best > 0 ? `PERSONAL BEST: WAVE ${best}` : '';
  endScreenEl.classList.add('show');
}

export function resetGame() {
  state.gameOver   = false;
  state.lives      = START_LIVES;
  state.gold       = START_GOLD;
  state.killCount  = 0;
  state.goldEarned = 0;

  [...enemies].forEach(e => e.destroy());     enemies.length     = 0;
  [...towers].forEach(t => t.destroy());      towers.length      = 0;
  [...projectiles].forEach(p => p._remove()); projectiles.length = 0;
  OCCUPIED.clear();
  towerMeshMap.clear();

  state.particles.reset();
  hideRangePreview();
  hideGhost();

  for(const f of flashes) { state.scene.remove(f.mesh); f.mesh.material.dispose(); }
  flashes.length = 0;

  hideInfoPanel();
  clearSave();

  state.wm.reset();
  prepBadge.style.display = 'none';
  endScreenEl.classList.remove('show');
  announceEl.classList.remove('show');

  state.gameSpeed = 1;
  document.querySelectorAll('.spd-btn').forEach(b => b.classList.toggle('active', b.dataset.speed === '1'));
  waveBtnEl.disabled    = false;
  waveBtnEl.textContent = 'Start Wave 1';

  selectTowerType(-1);
  setWaveSub(1);
  updateHUD();
}

// ── initUI — call once from main.js after state.scene is set ─────────────────
export function initUI() {
  // Range preview (solid disc + edge ring)
  const _rdGeo = new THREE.CircleGeometry(1, 48); _rdGeo.rotateX(-Math.PI / 2);
  const _reGeo = new THREE.RingGeometry(0.95, 1.0, 48); _reGeo.rotateX(-Math.PI / 2);
  rangeDisc = new THREE.Mesh(_rdGeo, new THREE.MeshBasicMaterial({
    color: 0x4488ff, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide,
  }));
  rangeEdge = new THREE.Mesh(_reGeo, new THREE.MeshBasicMaterial({
    color: 0x4488ff, transparent: true, opacity: 0.50, depthWrite: false, side: THREE.DoubleSide,
  }));
  rangeDisc.visible = rangeEdge.visible = false;
  state.scene.add(rangeDisc); state.scene.add(rangeEdge);

  // One ring per tower type for placement range preview
  ghostRings = TOWER_DEFS.map(def => {
    const geo = new THREE.RingGeometry(def.range - 0.05, def.range, 80);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: def.ghostColor, transparent: true, opacity: 0.9,
      side: THREE.DoubleSide, depthWrite: false,
    }));
    mesh.position.y = 0.01;
    mesh.visible = false;
    state.scene.add(mesh);
    return mesh;
  });

  // Tower cards (bottom bar)
  TOWER_DEFS.forEach((d, i) => {
    const card = document.createElement('div');
    card.className   = 'tc-card';
    card.dataset.type = String(i);
    const hex = '#' + d.turretColor.toString(16).padStart(6, '0');
    card.innerHTML =
      `<div class="tc-key">${i + 1}</div>`+
      `<div class="tc-icon" style="background:${hex}"></div>`+
      `<div class="tc-name">${d.name}</div>`+
      `<div class="tc-cost">⬡ ${d.cost}g</div>`;
    card.addEventListener('click', () => {
      if(state.gameOver) return;
      selectTowerType(state.selectedTypeIdx === i ? -1 : i);
    });
    towerPanelEl.appendChild(card);
  });
  updateTowerCards();

  // Wave announce animation end cleanup
  announceEl.addEventListener('animationend', () => announceEl.classList.remove('show'));

  // Game speed buttons
  document.querySelectorAll('.spd-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.gameSpeed = Number(btn.dataset.speed);
      document.querySelectorAll('.spd-btn').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  // Wave button
  waveBtnEl.addEventListener('click', () => {
    if(state.gameOver || state.wm.phase !== 'idle') return;
    hideInfoPanel();
    if(state.wm.waveNum === 0) state.wm.startWave(1); else state.wm.beginPrep();
  });
  setWaveSub(1);

  // Info panel
  infoPanelEl.addEventListener('click', e => e.stopPropagation());
  ipCloseEl.addEventListener('click', hideInfoPanel);

  ipUpgradeEl.addEventListener('click', () => {
    if(!state.activeTower || state.activeTower.tier >= 2) return;
    const cost = state.activeTower.upgradeCost();
    if(state.gold < cost) return;
    state.gold -= cost;
    state.activeTower.upgrade();
    showRangePreview(
      state.activeTower.baseMesh.position.x,
      state.activeTower.baseMesh.position.z,
      state.activeTower._range,
      state.activeTower.def.turretColor
    );
    updateHUD();
    _refreshInfoPanel();
  });

  ipSellEl.addEventListener('click', () => {
    if(!state.activeTower) return;
    state.gold += state.activeTower.sellValue();
    updateHUD();
    const { _col, _row } = state.activeTower;
    OCCUPIED.delete(tileKey(_col, _row));
    towers.splice(towers.indexOf(state.activeTower), 1);
    state.activeTower.destroy();
    hideInfoPanel();
  });

  // In-game restart button
  document.getElementById('in-game-restart').addEventListener('click', resetGame);

  // End screen restart
  endRestartEl.addEventListener('click', resetGame);

  // Keyboard shortcuts: 1–6 select tower type, Escape deselects
  window.addEventListener('keydown', e => {
    if(state.gameOver) return;
    if(e.key === 'Escape') { selectTowerType(-1); return; }
    const n = parseInt(e.key);
    if(n >= 1 && n <= TOWER_DEFS.length)
      selectTowerType(state.selectedTypeIdx === n - 1 ? -1 : n - 1);
  });

  // ── Shared pointer helpers (used by both mouse and touch) ────────────────
  function _updatePointer(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth)  *  2 - 1;
    mouse.y = (clientY / window.innerHeight) * -2 + 1;
    raycaster.setFromCamera(mouse, state.camera);

    if(hoveredTile) {
      if(hoveredTile.userData.clearHoverColor) hoveredTile.userData.clearHoverColor();
      else hoveredTile.material.color.copy(hoveredTile.userData.baseColor);
      hoveredTile = null;
    }
    const hits = raycaster.intersectObjects(tileObjects);
    if(hits.length > 0) {
      const t = hits[0].object;
      if(t.userData.setHoverColor) t.userData.setHoverColor(t.userData.onPath ? 0x7788bb : 0xf5c842);
      else t.material.color.copy(t.userData.onPath ? C_HOVER_PATH : C_HOVER);
      hoveredTile = t;
      const { tileX: x, tileZ: z, onPath } = t.userData;
      const buildable = !onPath && !OCCUPIED.has(tileKey(x, z));
      infoEl.textContent = `(${x},${z}) — ${onPath ? 'path' : buildable ? 'tap to build' : 'occupied'}`;
      if(buildable && !state.activeTower && state.selectedTypeIdx >= 0) showGhost(x, z);
      else if(!state.activeTower) hideGhost();
    } else {
      infoEl.textContent = '—';
      if(!state.activeTower) hideGhost();
    }
  }

  function _handleTap(target) {
    if(towerPanelEl.contains(target) || infoPanelEl.contains(target)) return;
    hideInfoPanel();
    if(!state.gameOver) {
      const towerHits = raycaster.intersectObjects([...towerMeshMap.keys()]);
      if(towerHits.length > 0) {
        const tw = towerMeshMap.get(towerHits[0].object);
        if(tw) { showInfoPanel(tw); return; }
      }
    }
    if(!hoveredTile || state.gameOver) return;
    const { tileX: col, tileZ: row, onPath } = hoveredTile.userData;
    if(!onPath && !OCCUPIED.has(tileKey(col, row))) placeTower(col, row);
  }

  // Mousemove + click
  // Mouse hover (desktop)
  window.addEventListener('mousemove', e => _updatePointer(e.clientX, e.clientY));

  // Click / tap — browser synthesises a click from touch automatically.
  // On mobile, _updatePointer runs first so the raycaster is current.
  window.addEventListener('click', e => {
    if(state.touchDragging) return;  // swipe/pan ended — not a tap
    // For touch: update pointer position before raycasting
    _updatePointer(e.clientX, e.clientY);
    _handleTap(e.target);
  });

  // Resize
  window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    const z = state.cameraZoom;
    state.camera.left   = -VIEW * aspect * z;
    state.camera.right  =  VIEW * aspect * z;
    state.camera.top    =  VIEW * z;
    state.camera.bottom = -VIEW * z;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.cssRenderer.setSize(window.innerWidth, window.innerHeight);
  });
}
