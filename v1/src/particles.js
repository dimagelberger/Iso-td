import * as THREE from 'three';
import { state } from './state.js';

// ── Particle system ───────────────────────────────────────────────────────────
// Single THREE.Points mesh.  Dead particles removed by swap-with-last (no splice).
// Amber #EF9F27 fades linearly to transparent over each particle's lifetime.
export class ParticleSystem {
  constructor(max = 300) {
    this.max   = max;
    this.alive = 0;

    this.vx      = new Float32Array(max);
    this.vy      = new Float32Array(max);
    this.vz      = new Float32Array(max);
    this.life    = new Float32Array(max);   // remaining seconds
    this.maxLife = new Float32Array(max);   // initial lifetime (for opacity ratio)

    this.positions = new Float32Array(max * 3);
    this.colors    = new Float32Array(max * 3);

    const geo = new THREE.BufferGeometry();
    this._posAttr = new THREE.BufferAttribute(this.positions, 3);
    this._posAttr.setUsage(THREE.DynamicDrawUsage);
    this._colAttr = new THREE.BufferAttribute(this.colors, 3);
    this._colAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this._posAttr);
    geo.setAttribute('color',    this._colAttr);
    geo.setDrawRange(0, 0);
    this._geo = geo;

    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.25, vertexColors: true,
      transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, sizeAttenuation: true,
    }));
    state.scene.add(this.points);
  }

  // Appends at end, or recycles the particle with least remaining life when full.
  _alloc() {
    if(this.alive < this.max) return this.alive++;
    let slot = 0, minL = this.life[0];
    for(let k = 1; k < this.alive; k++) {
      if(this.life[k] < minL) { minL = this.life[k]; slot = k; }
    }
    return slot;
  }

  // Burst of 16 amber particles on enemy death.
  emitDeathBurst(worldPos) {
    for(let n = 0; n < 16; n++) {
      const i = this._alloc(), i3 = i * 3;
      this.positions[i3]   = worldPos.x;
      this.positions[i3+1] = worldPos.y;
      this.positions[i3+2] = worldPos.z;
      this.vx[i] = (Math.random() - 0.5) * 4;
      this.vy[i] = 2 + Math.random() * 2;
      this.vz[i] = (Math.random() - 0.5) * 4;
      this.life[i] = this.maxLife[i] = 0.6;
    }
  }

  // Radial ring on splash-tower impact.
  emitSplashRing(worldPos) {
    for(let n = 0; n < 12; n++) {
      const i = this._alloc(), i3 = i * 3;
      const a = (n / 12) * Math.PI * 2, s = 2.5 + Math.random() * 0.5;
      this.positions[i3]   = worldPos.x;
      this.positions[i3+1] = worldPos.y + 0.1;
      this.positions[i3+2] = worldPos.z;
      this.vx[i] = Math.cos(a) * s;
      this.vy[i] = 0.5 + Math.random() * 0.3;
      this.vz[i] = Math.sin(a) * s;
      this.life[i] = this.maxLife[i] = 0.4;
    }
  }

  update(dt) {
    const GRAVITY = 9.8;
    // #EF9F27 — amber base color (premultiplied by alpha each frame)
    const CR = 239/255, CG = 159/255, CB = 39/255;

    let i = 0;
    while(i < this.alive) {
      this.life[i] -= dt;

      if(this.life[i] <= 0) {
        const last = this.alive - 1;
        if(i !== last) {
          const i3 = i * 3, l3 = last * 3;
          this.positions[i3]   = this.positions[l3];
          this.positions[i3+1] = this.positions[l3+1];
          this.positions[i3+2] = this.positions[l3+2];
          this.vx[i] = this.vx[last];
          this.vy[i] = this.vy[last];
          this.vz[i] = this.vz[last];
          this.life[i]    = this.life[last];
          this.maxLife[i] = this.maxLife[last];
        }
        this.alive--;
        continue;
      }

      this.vy[i] -= GRAVITY * dt;
      const i3 = i * 3;
      this.positions[i3]   += this.vx[i] * dt;
      this.positions[i3+1] += this.vy[i] * dt;
      this.positions[i3+2] += this.vz[i] * dt;

      const alpha = this.life[i] / this.maxLife[i];
      this.colors[i3]   = CR * alpha;
      this.colors[i3+1] = CG * alpha;
      this.colors[i3+2] = CB * alpha;

      i++;
    }

    this._posAttr.needsUpdate = true;
    this._colAttr.needsUpdate = true;
    this._geo.setDrawRange(0, this.alive);
  }

  reset()   { this.alive = 0; this._geo.setDrawRange(0, 0); }
  destroy() { state.scene.remove(this.points); this._geo.dispose(); this.points.material.dispose(); }
}

// ── Muzzle-flash spheres ──────────────────────────────────────────────────────
// Each entry: { mesh, t } where t counts up from 0 to FLASH_FADE then removed.
export const flashes = [];
const _flashGeo = new THREE.SphereGeometry(0.15, 7, 7);   // shared geometry

export function emitMuzzleFlash(pos) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 1.0, depthWrite: false,
  });
  const mesh = new THREE.Mesh(_flashGeo, mat);
  mesh.position.copy(pos);
  state.scene.add(mesh);
  flashes.push({ mesh, t: 0 });
}

export function updateFlashes(dt) {
  const FLASH_FADE = 0.10;
  for(let i = flashes.length - 1; i >= 0; i--) {
    const f = flashes[i];
    f.t += dt;
    f.mesh.material.opacity = Math.max(0, 1 - f.t / FLASH_FADE);
    if(f.t >= FLASH_FADE) {
      state.scene.remove(f.mesh);
      f.mesh.material.dispose();
      flashes.splice(i, 1);
    }
  }
}
