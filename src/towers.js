import * as THREE from 'three';
import {
  TOWER_DEFS, UPGRADE_TIERS, TIER_COLORS,
  KICK_DUR, KICK_SCALE, TURRET_ROT_SPEED,
  LASER_HEAT_MAX, LASER_OVERHEAT_CD,
  tileToWorld,
} from './constants.js';
import { state, enemies, projectiles, towerMeshMap } from './state.js';
import { assetManager } from './assetManager.js';
import { Projectile } from './projectiles.js';
import { emitMuzzleFlash } from './particles.js';

// ── Tower ─────────────────────────────────────────────────────────────────────
export class Tower {
  constructor(col, row, typeIdx) {
    this.def        = TOWER_DEFS[typeIdx];
    this._col       = col;
    this._row       = row;
    this._typeIdx   = typeIdx;
    this.tier       = 0;
    this.totalSpent = this.def.cost;
    this._range     = this.def.range;
    this._damage    = this.def.damage;
    this._cooldown  = this.def.cooldown;
    this.cooldownTimer = 0;
    this._kickTimer    = 0;
    this._tierRings    = [];

    const pos = tileToWorld(col, row, 0);
    this.model = assetManager.get(this.def.modelKey);
    this.model.position.copy(pos);
    this.baseMesh   = this.model;  // alias: .position used for range & info panel
    this.turretMesh = this.model.getObjectByName('turret') ?? this.model;

    state.scene.add(this.model);
    this.model.updateMatrixWorld(true);
    this.model.traverse(o => { if(o.isMesh) towerMeshMap.set(o, this); });

    if(this.def.kind === 'laser') {
      this._heatTimer      = 0;
      this._overheatTimer  = 0;
      this._isOverheated   = false;
      this._laserBeam      = null;
      this._beamAttr       = null;
      this._beamPositions  = new Float32Array(6);
    }
  }

  // ── Upgrade / sell ────────────────────────────────────────────────────────
  _applyUpgradeMult() {
    const upg    = UPGRADE_TIERS[this.tier];
    this.tier++;
    this._range    *= upg.rngMult;
    this._damage   *= upg.dmgMult;
    this._cooldown *= upg.cdMult;
    const color  = TIER_COLORS[this.tier - 1];
    const radius = 0.30 + (this.tier - 1) * 0.09;
    const rGeo   = new THREE.TorusGeometry(radius, 0.032, 6, 22);
    rGeo.rotateX(Math.PI / 2);
    const rMesh  = new THREE.Mesh(rGeo, new THREE.MeshBasicMaterial({ color }));
    rMesh.position.copy(this.model.position);
    rMesh.position.y = 0.285;
    state.scene.add(rMesh);
    this._tierRings.push(rMesh);
  }
  upgradeCost() {
    if(this.tier >= 2) return 0;
    return Math.round(this.def.cost * UPGRADE_TIERS[this.tier].costMult);
  }
  upgrade() {
    if(this.tier >= 2) return;
    const c = this.upgradeCost();
    this._applyUpgradeMult();
    this.totalSpent += c;
  }
  sellValue() { return Math.round(this.totalSpent * 0.60); }

  // ── Target selection ──────────────────────────────────────────────────────
  _findTarget() {
    const tx = this.model.position.x, tz = this.model.position.z, r2 = this._range * this._range;
    let best = null, bestP = -1;
    for(const e of enemies) {
      if(e.dead || e.exited || e._dying) continue;
      const dx = e.mesh.position.x - tx, dz = e.mesh.position.z - tz;
      if(dx*dx + dz*dz <= r2 && e.progress > bestP) { bestP = e.progress; best = e; }
    }
    return best;
  }
  _findTargetLowHP() {
    const tx = this.model.position.x, tz = this.model.position.z, r2 = this._range * this._range;
    let best = null, bestHP = Infinity;
    for(const e of enemies) {
      if(e.dead || e.exited || e._dying) continue;
      const dx = e.mesh.position.x - tx, dz = e.mesh.position.z - tz;
      if(dx*dx + dz*dz <= r2 && e.hp < bestHP) { bestHP = e.hp; best = e; }
    }
    return best;
  }

  // ── Per-frame passive animations ──────────────────────────────────────────
  _animUpdate(dt) {
    const ring = this.model.getObjectByName('orbit_ring');
    if(ring) ring.rotation.y += 1.8 * dt;
    if(this.def.kind === 'laser') this.turretMesh.rotation.y += 0.8 * dt;
  }

  // ── Per-frame update ──────────────────────────────────────────────────────
  update(dt) {
    this._animUpdate(dt);
    if(this.def.kind === 'laser') { this._updateLaser(dt); return; }

    if(this._kickTimer > 0) {
      this._kickTimer = Math.max(0, this._kickTimer - dt);
      const s = 1 + (KICK_SCALE - 1) * (this._kickTimer / KICK_DUR);
      this.turretMesh.scale.set(s, s, s);
    } else {
      this.turretMesh.scale.set(1, 1, 1);
    }

    if(this.cooldownTimer > 0) this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);

    const t = (this.def.kind === 'sniper') ? this._findTargetLowHP() : this._findTarget();
    if(!t) return;

    // Rotate toward target
    const tx = this.model.position.x, tz = this.model.position.z;
    const dx = t.mesh.position.x - tx, dz = t.mesh.position.z - tz;
    const want = Math.atan2(dx, dz);
    let diff = want - this.turretMesh.rotation.y;
    diff -= Math.round(diff / (2 * Math.PI)) * (2 * Math.PI);
    this.turretMesh.rotation.y += Math.sign(diff) * Math.min(Math.abs(diff), TURRET_ROT_SPEED * dt);

    if(this.cooldownTimer <= 0) {
      // Barrel tip in world space
      const ry  = this.turretMesh.rotation.y;
      const twx = this.model.position.x + this.turretMesh.position.x;
      const twy = this.model.position.y + this.turretMesh.position.y;
      const twz = this.model.position.z + this.turretMesh.position.z;
      const barrelTip = new THREE.Vector3(
        twx + Math.sin(ry) * this.def.barrelHalf,
        twy + 0.12,
        twz + Math.cos(ry) * this.def.barrelHalf
      );

      const eff = {
        damage:    this._damage,
        splashR:   this.def.splashR,
        slowMult:  this.def.slowMult,
        slowSec:   this.def.slowSec,
        projColor: this.def.projColor,
        projSpeed: this.def.projSpeed,
        projSize:  this.def.projSize,
        isMissile: this.def.kind === 'missile',
      };
      projectiles.push(new Projectile(barrelTip.clone(), t, eff));

      emitMuzzleFlash(barrelTip);
      this._kickTimer = KICK_DUR;
      this.turretMesh.scale.set(KICK_SCALE, KICK_SCALE, KICK_SCALE);
      this.cooldownTimer = this._cooldown;
    }
  }

  // ── Laser continuous-beam state machine ───────────────────────────────────
  _updateLaser(dt) {
    if(this._isOverheated) {
      this._hideLaserBeam();
      this.turretMesh.traverse(o => { if(o.isMesh) o.material.color.setHex(0xff3333); });
      this._overheatTimer -= dt;
      if(this._overheatTimer <= 0) {
        this._isOverheated = false;
        this._heatTimer    = 0;
        this.turretMesh.traverse(o => { if(o.isMesh) o.material.color.setHex(this.def.turretColor); });
      }
      return;
    }
    const t = this._findTarget();
    if(!t) { this._hideLaserBeam(); this._heatTimer = Math.max(0, this._heatTimer - dt * 2); return; }

    const dx = t.mesh.position.x - this.model.position.x;
    const dz = t.mesh.position.z - this.model.position.z;
    const want = Math.atan2(dx, dz);
    let diff = want - this.turretMesh.rotation.y;
    diff -= Math.round(diff / (2 * Math.PI)) * (2 * Math.PI);
    this.turretMesh.rotation.y += Math.sign(diff) * Math.min(Math.abs(diff), TURRET_ROT_SPEED * dt);

    t.takeDamage(this._damage * dt);

    const laserFrom = new THREE.Vector3(
      this.model.position.x + this.turretMesh.position.x,
      this.model.position.y + this.turretMesh.position.y,
      this.model.position.z + this.turretMesh.position.z
    );
    this._showLaserBeam(laserFrom, t.mesh.position);

    const h = this._heatTimer / LASER_HEAT_MAX;
    this.turretMesh.traverse(o => { if(o.isMesh) o.material.color.setRGB(h, 1 - h * 0.55, 1 - h); });

    this._heatTimer += dt;
    if(this._heatTimer >= LASER_HEAT_MAX) {
      this._isOverheated   = true;
      this._overheatTimer  = LASER_OVERHEAT_CD;
      this._hideLaserBeam();
    }
  }

  _showLaserBeam(from, to) {
    if(!this._laserBeam) {
      const geo  = new THREE.BufferGeometry();
      const attr = new THREE.BufferAttribute(this._beamPositions, 3);
      attr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', attr);
      this._beamAttr  = attr;
      this._laserBeam = new THREE.Line(geo,
        new THREE.LineBasicMaterial({ color:0x00ffcc, transparent:true, opacity:0.9, depthWrite:false }));
      state.scene.add(this._laserBeam);
    }
    this._beamPositions[0] = from.x; this._beamPositions[1] = from.y + 0.05; this._beamPositions[2] = from.z;
    this._beamPositions[3] = to.x;   this._beamPositions[4] = to.y + 0.35;   this._beamPositions[5] = to.z;
    this._beamAttr.needsUpdate = true;
    this._laserBeam.visible = true;
  }
  _hideLaserBeam() { if(this._laserBeam) this._laserBeam.visible = false; }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  destroy() {
    this.model.traverse(o => {
      if(o.isMesh) { towerMeshMap.delete(o); o.geometry.dispose(); o.material.dispose(); }
    });
    state.scene.remove(this.model);
    for(const r of this._tierRings) { state.scene.remove(r); r.geometry.dispose(); r.material.dispose(); }
    if(this._laserBeam) {
      state.scene.remove(this._laserBeam);
      this._laserBeam.geometry.dispose();
      this._laserBeam.material.dispose();
    }
  }
}
