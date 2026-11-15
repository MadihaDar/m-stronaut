/* ============================================================
   FRONTIER: MISSION ACADEMY — Physics Engine
   Lightweight rigid body collision checking & camera anti-clipping
   Supports Cylinders, AABBs, Spheres, Compound Objects & Raycasts
   ============================================================ */

import * as THREE from 'three';

export class PhysicsEngine {
  constructor() {
    this.colliders = [];
    this._raycaster = new THREE.Raycaster();
  }

  clear() {
    this.colliders = [];
  }

  addCollider(collider) {
    if (!collider) return;
    this.colliders.push(collider);
  }

  setColliders(colliders) {
    this.colliders = colliders || [];
  }

  /**
   * Resolves horizontal rigid body collisions for a moving sphere/cylinder character.
   * Returns corrected { x, z, hit, normal }
   */
  resolveCollision(posX, posZ, radius, velX = 0, velZ = 0) {
    let correctedX = posX;
    let correctedZ = posZ;
    let hadCollision = false;
    let normalX = 0;
    let normalZ = 0;

    for (let iter = 0; iter < 2; iter++) { // 2 relaxation passes for corner pinching
      for (const col of this.colliders) {
        if (!col) continue;

        // 1. Cylinder / Vertical Pillar Collider
        if (col.type === 'cylinder' || col.radius) {
          const cx = col.pos ? col.pos.x : (col.position ? col.position.x : 0);
          const cz = col.pos ? col.pos.z : (col.position ? col.position.z : 0);
          const cRadius = col.radius || 1.0;
          const minDist = cRadius + radius;

          const dx = correctedX - cx;
          const dz = correctedZ - cz;
          const distSq = dx * dx + dz * dz;

          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq);
            const nx = dist > 0.0001 ? dx / dist : 1;
            const nz = dist > 0.0001 ? dz / dist : 0;
            const overlap = minDist - dist;

            correctedX += nx * overlap;
            correctedZ += nz * overlap;
            hadCollision = true;
            normalX = nx;
            normalZ = nz;
          }
        }
        // 2. Axis-Aligned Box (AABB) Collider
        else if (col.type === 'box') {
          const minX = (col.min ? col.min.x : col.x - col.sizeX * 0.5) - radius;
          const maxX = (col.max ? col.max.x : col.x + col.sizeX * 0.5) + radius;
          const minZ = (col.min ? col.min.z : col.z - col.sizeZ * 0.5) - radius;
          const maxZ = (col.max ? col.max.z : col.z + col.sizeZ * 0.5) + radius;

          if (correctedX >= minX && correctedX <= maxX && correctedZ >= minZ && correctedZ <= maxZ) {
            const dLeft = Math.abs(correctedX - minX);
            const dRight = Math.abs(correctedX - maxX);
            const dBack = Math.abs(correctedZ - minZ);
            const dFront = Math.abs(correctedZ - maxZ);
            const minPush = Math.min(dLeft, dRight, dBack, dFront);

            if (minPush === dLeft) { correctedX = minX; normalX = -1; normalZ = 0; }
            else if (minPush === dRight) { correctedX = maxX; normalX = 1; normalZ = 0; }
            else if (minPush === dBack) { correctedZ = minZ; normalX = 0; normalZ = -1; }
            else { correctedZ = maxZ; normalX = 0; normalZ = 1; }

            hadCollision = true;
          }
        }
      }
    }

    return {
      x: correctedX,
      z: correctedZ,
      hit: hadCollision,
      normalX,
      normalZ
    };
  }

  /**
   * Raycasts from character center to ideal camera position to prevent wall clipping.
   * Returns safe distance (clamped in front of any obstructing geometry).
   */
  resolveCameraClip(targetPos, desiredCamPos, maxDist, targetObjects = []) {
    if (!targetObjects || targetObjects.length === 0) return maxDist;

    const dir = new THREE.Vector3().subVectors(desiredCamPos, targetPos);
    const fullDist = dir.length();
    if (fullDist < 0.1) return maxDist;
    dir.normalize();

    this._raycaster.set(targetPos, dir);
    this._raycaster.near = 0.2;
    this._raycaster.far = fullDist;

    const hits = this._raycaster.intersectObjects(targetObjects, true);
    if (hits.length > 0) {
      // Pull camera 0.35m in front of the hit point
      const safeHitDist = Math.max(1.8, hits[0].distance - 0.35);
      return Math.min(maxDist, safeHitDist);
    }

    return maxDist;
  }
}
