import {
  getWaveDefs, TOTAL_WAVES, PREP_SECS, ENEMY_TYPES, HP_SCALE, SPEED_SCALE,
} from './constants.js';
import { state, enemies } from './state.js';
import { Enemy } from './enemies.js';
import { updateHUD, showAnnounce, setWaveSub, clearSave, saveGame, showEndScreen } from './ui.js';

// DOM refs needed by WaveManager methods
const waveBtnEl = document.getElementById('wave-btn');
const waveSubEl = document.getElementById('wave-sub');
const prepBadge = document.getElementById('prep-badge');
const prepBar   = document.getElementById('prep-bar');
const hudPrep   = document.getElementById('hud-prep');

// ── WaveRunner — owns spawning + enemy-count for one wave ────────────────────
class WaveRunner {
  constructor(n, waves = getWaveDefs()) {
    this.waveNum      = n;
    this.groups       = waves[n - 1].map(g => ({ ...g }));
    this.groupTimer   = 0;
    this.groupCount   = 0;
    this._curGroup    = null;
    this.spawning     = true;
    this.enemiesAlive = 0;
  }

  // True once all spawned enemies are gone
  get done() { return !this.spawning && this.enemiesAlive === 0; }

  // Called by Enemy.destroy() via the _waveRunner reference
  onEnemyGone() { this.enemiesAlive = Math.max(0, this.enemiesAlive - 1); }

  tickSpawn(dt) {
    if(!this.spawning) return;
    // Load the next sub-group when current one is exhausted
    while(this.groupCount === 0 && this.groups.length > 0) {
      const g = this.groups.shift();
      this.groupCount = g.count;
      this.groupTimer = 0;
      this._curGroup  = g;
    }
    if(this.groupCount === 0) { this.spawning = false; return; }
    this.groupTimer -= dt;
    if(this.groupTimer <= 0) {
      this._spawnOne(this._curGroup.type);
      this.groupCount--;
      this.groupTimer = this._curGroup.interval;
    }
  }

  _spawnOne(typeName) {
    const idx  = this.waveNum - 1;
    const base = ENEMY_TYPES[typeName];
    const hp   = Math.round(base.hp   * Math.pow(HP_SCALE,    idx));
    const spd  = base.speed            * Math.pow(SPEED_SCALE, idx);
    const rwd  = base.reward;
    const e = new Enemy(typeName, hp, spd, rwd);
    e._waveRunner = this;
    this.enemiesAlive++;
    enemies.push(e);
  }
}

// ── WaveManager ───────────────────────────────────────────────────────────────
export class WaveManager {
  constructor(levelIndex = 0) {
    this.levelIndex  = levelIndex;
    this.waves       = getWaveDefs(levelIndex);
    this.runners     = [];     // active WaveRunner instances (max 2)
    this.nextWaveNum = 1;      // next wave number to be launched
    this.waveNum     = 0;      // last launched wave (for HUD display)
    this.prepTimer   = 0;
    this.phase       = 'idle'; // 'idle' | 'prep' | 'done'
  }

  // True when the Start button should be enabled
  get canStart() {
    return this.nextWaveNum <= TOTAL_WAVES && this.runners.length < 2;
  }

  // ── Start a wave immediately (called by button or auto-start from prep) ────
  startWave() {
    if(!this.canStart) return;
    const n          = this.nextWaveNum++;
    this.waveNum     = n;
    this.phase       = 'idle';
    this.prepTimer   = 0;
    prepBadge.style.display = 'none';
    waveSubEl.textContent   = '';
    const runner = new WaveRunner(n, this.waves);
    this.runners.push(runner);
    showAnnounce(n);
    updateHUD();
    this._updateBtn();
  }

  // ── Begin the 5-second countdown before auto-starting the next wave ────────
  beginPrep() {
    if(this.nextWaveNum > TOTAL_WAVES) return;
    this.phase     = 'prep';
    this.prepTimer = PREP_SECS;
    prepBadge.style.display = 'flex';
    prepBar.style.width     = '100%';
    setWaveSub(this.nextWaveNum);
    this._updateBtn();
  }

  // ── Update button text + enabled state ────────────────────────────────────
  _updateBtn() {
    if(this.phase === 'done') {
      waveBtnEl.disabled    = true;
      waveBtnEl.textContent = 'Complete!';
      return;
    }
    const can = this.canStart;
    waveBtnEl.disabled = !can;
    if(this.phase === 'prep' && can) {
      const t = Math.ceil(Math.max(0, this.prepTimer));
      waveBtnEl.textContent = `Wave ${this.nextWaveNum} in ${t}s`;
    } else if(can) {
      waveBtnEl.textContent = `Start Wave ${this.nextWaveNum}`;
    } else if(this.nextWaveNum > TOTAL_WAVES) {
      waveBtnEl.textContent = 'Clearing…';
      waveBtnEl.disabled    = true;
    } else {
      // 2 waves active — wait for a slot
      waveBtnEl.textContent = `2 waves active`;
      waveBtnEl.disabled    = true;
    }
  }

  // ── Per-frame update (called from main.js animate loop) ───────────────────
  update(dt) {
    // Advance each runner's spawn sequence
    for(const r of this.runners) r.tickSpawn(dt);

    // Remove runners whose enemies are all gone
    const prevLen = this.runners.length;
    this.runners  = this.runners.filter(r => !r.done);
    const cleared = prevLen - this.runners.length;

    if(cleared > 0) {
      saveGame();
      // All waves defeated → victory
      if(this.nextWaveNum > TOTAL_WAVES && this.runners.length === 0) {
        this.phase = 'done';
        clearSave();
        showEndScreen(true);
        return;
      }
      // Start prep countdown if not already counting and waves remain
      if(this.phase === 'idle' && this.nextWaveNum <= TOTAL_WAVES) {
        this.beginPrep();
        return; // beginPrep calls _updateBtn
      }
    }

    // Tick prep countdown
    if(this.phase === 'prep') {
      this.prepTimer -= dt;
      const t = Math.max(0, this.prepTimer);
      hudPrep.textContent = `${Math.ceil(t)}s`;
      prepBar.style.width = (t / PREP_SECS * 100) + '%';
      if(this.prepTimer <= 0) {
        if(this.canStart) {
          this.startWave(); // auto-start
          return;
        }
        this.prepTimer = 0; // 2 waves still active — hold until a slot opens
      }
    }

    this._updateBtn();
  }

  reset() {
    this.runners     = [];
    this.nextWaveNum = 1;
    this.waveNum     = 0;
    this.phase       = 'idle';
    this.prepTimer   = 0;
    prepBadge.style.display = 'none';
    waveBtnEl.disabled      = false;
    waveBtnEl.textContent   = 'Start Wave 1';
    setWaveSub(1);
    updateHUD();
  }
}
