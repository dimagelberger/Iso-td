import * as THREE from 'three';
import { CSS3DSprite } from 'three/addons/renderers/CSS3DRenderer.js';
import {
  ENEMY_TYPES, WP_WORLD, WP_DISTS, HP_BAR_SCALE, DEATH_DUR, HIT_FLASH_DUR,
} from './constants.js';
import { state } from './state.js';
import { assetManager } from './assetManager.js';
import { updateHUD } from './ui.js';

// ── Enemy ─────────────────────────────────────────────────────────────────────
export class Enemy {
  constructor(typeName, scaledHp, scaledSpeed, reward) {
    const def = ENEMY_TYPES[typeName];
    this.typeName  = typeName;
    this.hp        = scaledHp;
    this.maxHp     = scaledHp;
    this.reward    = reward;
    this.baseSpd   = scaledSpeed;
    this.slowMult  = 1;
    this.slowTimer = 0;
    this.wpIdx     = 0;
    this.segT      = 0;
    this.dead      = false;
    this.exited    = false;
    this._dying    = false;
    this._dyingT   = 0;
    this._hitTimer = 0;      // countdown for white damage flash
    this._wounded  = false;  // true once HP drops below 30 % (persistent)

    // Load model from AssetManager (falls back to procedural if no GLB).
    // modelScale differentiates enemy sizes visually (all UFOs are ~1 unit wide).
    this.mesh = assetManager.get(def.modelKey);
    this._initScale = def.modelScale ?? 1;
    if(this._initScale !== 1) this.mesh.scale.setScalar(this._initScale);
    this._mats = []; this._origColors = [];
    this.mesh.traverse(o => {
      if(o.isMesh && o.material) {
        const m = o.material;
        if(!this._mats.includes(m)) { this._mats.push(m); this._origColors.push(m.color.clone()); }
      }
    });
    this._mat = this._mats[0] || new THREE.MeshToonMaterial();
    this.mesh.position.copy(WP_WORLD[0]);
    this._yOff = def.h;
    state.scene.add(this.mesh);

    const track = document.createElement('div');
    track.style.cssText = 'width:70px;height:9px;background:#2a0000;border-radius:2px;overflow:hidden;outline:1px solid rgba(0,0,0,0.4)';
    this._fill = document.createElement('div');
    this._fill.style.cssText = 'width:100%;height:100%;background:linear-gradient(#ff5252,#bb1818);border-radius:2px';
    track.appendChild(this._fill);
    this.sprite = new CSS3DSprite(track);
    this.sprite.scale.setScalar(HP_BAR_SCALE);
    this._syncBar();
    state.scene.add(this.sprite);
  }

  // Pick the correct resting color based on current state flags.
  // Priority: slow (blue) > wounded (red) > normal type color.
  _restoreColor() {
    if(this.slowTimer > 0) {
      for(const m of this._mats) m.color.setHex(0x6699dd);
    } else if(this._wounded) {
      for(const m of this._mats) m.color.setHex(0xff4422);
    } else {
      this._mats.forEach((m, i) => m.color.copy(this._origColors[i]));
    }
  }

  _syncBar() {
    this.sprite.position.copy(this.mesh.position);
    this.sprite.position.y += this._yOff + 0.28;
  }

  get progress() { return this.wpIdx + this.segT; }

  update(dt) {
    if(this.dead || this.exited) return;

    // Death tween: scale → 0 from _initScale, then flag dead
    if(this._dying) {
      this._dyingT += dt;
      this.mesh.scale.setScalar(this._initScale * Math.max(0, 1 - this._dyingT / DEATH_DUR));
      if(this._dyingT >= DEATH_DUR) this.dead = true;
      return;
    }

    // Hit-flash countdown — restore resting color when it expires
    if(this._hitTimer > 0) {
      this._hitTimer -= dt;
      if(this._hitTimer <= 0) { this._hitTimer = 0; this._restoreColor(); }
    }

    // Slow-effect countdown
    if(this.slowTimer > 0) {
      this.slowTimer -= dt;
      if(this.slowTimer <= 0) { this.slowTimer = 0; this.slowMult = 1; this._restoreColor(); }
    }

    // Movement
    let budget = this.baseSpd * this.slowMult * dt;
    while(budget > 0) {
      if(this.wpIdx >= WP_WORLD.length - 1) { this.exited = true; return; }
      const seg = WP_DISTS[this.wpIdx], left = seg * (1 - this.segT);
      if(budget >= left) { budget -= left; this.wpIdx++; this.segT = 0; }
      else               { this.segT += budget / seg; budget = 0; }
    }
    if(this.wpIdx >= WP_WORLD.length - 1) { this.exited = true; return; }
    this.mesh.position.lerpVectors(WP_WORLD[this.wpIdx], WP_WORLD[this.wpIdx + 1], this.segT);
    this.mesh.position.y = 0;
    this._syncBar();
  }

  takeDamage(dmg) {
    if(this.dead || this._dying) return;
    this.hp = Math.max(0, this.hp - dmg);
    this._fill.style.width = (this.hp / this.maxHp * 100) + '%';

    // White hit-flash — overrides all other colors for HIT_FLASH_DUR seconds
    this._hitTimer = HIT_FLASH_DUR;
    for(const m of this._mats) m.color.setHex(0xffffff);

    // Wounded threshold: below 30 % HP switches to persistent red (shown after flash)
    if(!this._wounded && this.hp < this.maxHp * 0.3) this._wounded = true;

    if(this.hp <= 0) {
      this._dying = true; this._dyingT = 0;
      this.sprite.element.style.display = 'none';
      state.particles.emitDeathBurst(this.mesh.position);
      state.gold      += this.reward;
      state.goldEarned += this.reward;
      state.killCount++;
      updateHUD();
    }
  }

  // applySlow defers color selection to _restoreColor so the
  // slow-vs-wounded priority is respected.
  applySlow(mult, sec) {
    this.slowMult  = Math.min(this.slowMult, mult);
    this.slowTimer = Math.max(this.slowTimer, sec);
    if(this._hitTimer <= 0) this._restoreColor();
  }

  destroy() {
    state.scene.remove(this.mesh);
    state.scene.remove(this.sprite);
    if(this.sprite.element.parentNode) this.sprite.element.remove();
    this.mesh.traverse(obj => {
      if(obj.isMesh) { obj.geometry.dispose(); obj.material.dispose(); }
    });
  }
}
