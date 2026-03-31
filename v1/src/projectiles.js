import * as THREE from 'three';
import { PROJ_SPEED } from './constants.js';
import { state, enemies } from './state.js';

// ── Projectile ────────────────────────────────────────────────────────────────
// All projectiles re-compute direction to target every frame (homing).
// Missile projectiles are just slower + larger — no extra code needed.
export class Projectile {
  constructor(pos, target, def) {
    this.target = target;
    this.def    = def;
    this.dead   = false;

    const r = def.projSize || 0.10;
    let geo;
    if(def.isMissile) {
      geo = new THREE.ConeGeometry(r * 0.8, r * 2.5, 8);
      geo.rotateX(Math.PI / 2);   // tip points along +Z
    } else {
      geo = new THREE.SphereGeometry(r, 7, 7);
    }
    this.mesh = new THREE.Mesh(geo, new THREE.MeshToonMaterial({
      color: def.projColor, emissive: def.projColor, emissiveIntensity: 0.5,
    }));
    this.mesh.position.copy(pos);
    state.scene.add(this.mesh);
  }

  update(dt) {
    if(this.dead) return;
    if(this.target.dead || this.target.exited || this.target._dying) { this._remove(); return; }
    const tPos = new THREE.Vector3(this.target.mesh.position.x, this.mesh.position.y, this.target.mesh.position.z);
    const dir  = new THREE.Vector3().subVectors(tPos, this.mesh.position);
    const dist = dir.length(), step = (this.def.projSpeed || PROJ_SPEED) * dt;
    if(this.def.isMissile && dist > 0.01) this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    if(dist <= step) { this._onHit(); this._remove(); return; }
    this.mesh.position.addScaledVector(dir.normalize(), step);
  }

  _onHit() {
    const d = this.def, hp = this.mesh.position;
    if(d.splashR > 0) {
      const ix = hp.x, iz = hp.z, r2 = d.splashR * d.splashR;
      for(const e of enemies) {
        if(e.dead || e.exited || e._dying) continue;
        const dx = e.mesh.position.x - ix, dz = e.mesh.position.z - iz;
        if(dx*dx + dz*dz <= r2) e.takeDamage(d.damage);
      }
      state.particles.emitSplashRing(hp);
    } else if(d.slowMult < 1) {
      if(!this.target.dead && !this.target.exited && !this.target._dying)
        this.target.applySlow(d.slowMult, d.slowSec);
    } else {
      if(!this.target.dead && !this.target.exited && !this.target._dying)
        this.target.takeDamage(d.damage);
    }
  }

  _remove() {
    state.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.dead = true;
  }
}
