import {
  WAVE_DEFS, TOTAL_WAVES, PREP_SECS, ENEMY_TYPES, HP_SCALE, SPEED_SCALE,
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

// ── WaveManager ───────────────────────────────────────────────────────────────
export class WaveManager {
  constructor() {
    this.waveNum    = 0;
    this.phase      = 'idle';
    this.prepTimer  = 0;
    this.groups     = [];
    this.groupTimer = 0;
    this.groupCount = 0;
    this._curGroup  = null;
  }

  beginPrep() {
    if(this.waveNum >= TOTAL_WAVES) return;
    this.phase = 'prep';
    this.prepTimer = PREP_SECS;
    waveBtnEl.disabled    = true;
    waveBtnEl.textContent = `Wave ${this.waveNum + 1} in ${Math.ceil(this.prepTimer)}s`;
    prepBadge.style.display = 'flex';
    prepBar.style.width     = '100%';
    waveSubEl.textContent   = '';
  }

  startWave(n) {
    this.waveNum    = n;
    this.phase      = 'spawning';
    this.groups     = WAVE_DEFS[n - 1].map(g => ({ ...g }));
    this.groupTimer = 0;
    this.groupCount = 0;
    prepBadge.style.display = 'none';
    waveBtnEl.disabled      = true;
    waveBtnEl.textContent   = `Wave ${n} in progress`;
    updateHUD();
    showAnnounce(n);
  }

  tickSpawn(dt) {
    while(this.groupCount === 0 && this.groups.length > 0) {
      const g = this.groups.shift();
      this.groupCount = g.count;
      this.groupTimer = 0;
      this._curGroup  = g;
    }
    if(this.groupCount === 0) { this.phase = 'clearing'; return; }
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
    const hp   = Math.round(base.hp * Math.pow(HP_SCALE, idx));
    const spd  = base.speed * Math.pow(SPEED_SCALE, idx);
    const rwd  = base.reward;
    enemies.push(new Enemy(typeName, hp, spd, rwd));
  }

  tickClearing() {
    if(enemies.length > 0) return;
    if(this.waveNum >= TOTAL_WAVES) {
      this.phase = 'done';
      clearSave();
      showEndScreen(true);
    } else {
      this.phase = 'idle';
      waveBtnEl.disabled    = false;
      waveBtnEl.textContent = `Start Wave ${this.waveNum + 1}`;
      setWaveSub(this.waveNum + 1);
      saveGame();   // auto-save after each wave clears
    }
  }

  tickPrep(dt) {
    this.prepTimer -= dt;
    const t = Math.max(0, this.prepTimer);
    hudPrep.textContent   = `${Math.ceil(t)}s`;
    prepBar.style.width   = (t / PREP_SECS * 100) + '%';
    waveBtnEl.textContent = `Wave ${this.waveNum + 1} in ${Math.ceil(t)}s`;
    if(this.prepTimer <= 0) this.startWave(this.waveNum + 1);
  }

  update(dt) {
    if     (this.phase === 'spawning') this.tickSpawn(dt);
    else if(this.phase === 'clearing') this.tickClearing();
    else if(this.phase === 'prep')     this.tickPrep(dt);
  }

  reset() {
    this.waveNum    = 0;
    this.phase      = 'idle';
    this.prepTimer  = 0;
    this.groups     = [];
    this.groupTimer = 0;
    this.groupCount = 0;
    this._curGroup  = null;
  }
}
