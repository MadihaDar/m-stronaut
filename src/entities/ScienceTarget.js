import * as THREE from 'three';

export class ScienceTarget {
  constructor(scene, data, position) {
    this.scene = scene;
    this.data = data; // from scienceData.js
    this.position = position.clone();

    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.interactionRadius = 3.6;
    this.time = Math.random() * 10;
    this.isRecorded = false;

    this.buildModel();
    this.scene.add(this.group);
  }

  buildModel() {
    // 1. Base pedestal
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.7, 0.4, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.2;
    this.group.add(base);

    // 2. Holographic pulsing beacon ring
    const ringGeo = new THREE.TorusGeometry(0.85, 0.04, 8, 24);
    ringGeo.rotateX(Math.PI / 2);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85
    });
    this.ring = new THREE.Mesh(ringGeo, this.ringMat);
    this.ring.position.y = 0.6;
    this.group.add(this.ring);

    // 3. Floating crystal / data beacon
    const crystalGeo = new THREE.OctahedronGeometry(0.32, 0);
    this.crystalMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.4
    });
    this.crystal = new THREE.Mesh(crystalGeo, this.crystalMat);
    this.crystal.position.y = 1.3;
    this.group.add(this.crystal);

    // 4. Point light for atmospheric night glow
    this.light = new THREE.PointLight(0x38bdf8, 0.8, 6);
    this.light.position.y = 1.3;
    this.group.add(this.light);
  }

  setRecorded(recorded) {
    this.isRecorded = recorded;
    if (recorded) {
      this.ringMat.color.setHex(0x22c55e); // Green when scanned
      this.crystalMat.color.setHex(0x4ade80);
      this.crystalMat.emissive.setHex(0x15803d);
      this.light.color.setHex(0x22c55e);
    }
  }

  getDistanceTo(pos) {
    return this.position.distanceTo(pos);
  }

  update(delta) {
    this.time += delta;
    // Animate crystal rotation and hover bob
    this.crystal.rotation.y += delta * 1.5;
    this.crystal.position.y = 1.3 + Math.sin(this.time * 2.5) * 0.12;

    // Pulse ring opacity
    this.ringMat.opacity = 0.5 + Math.sin(this.time * 3.0) * 0.35;
    this.ring.rotation.z += delta * 0.5;
  }
}
