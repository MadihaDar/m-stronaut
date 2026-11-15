import * as THREE from 'three';
import { DESTINATIONS } from '../data/destinations.js';

export class Environment {
  constructor(scene, destinationId = 'moon') {
    this.scene = scene;
    this.destinationId = destinationId;
    this.group = new THREE.Group();

    this.terrainWidth = 140;
    this.terrainSegments = 90;

    this.buildTerrain();
    this.buildOutpostStructures();
    this.buildBoulders();
    this.buildSky();

    this.scene.add(this.group);
  }

  getHeightAt(x, z) {
    // Gentle rolling crater hills + flat landing zone near center (0,0)
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter < 12) {
      return 0; // Flat landing & base zone
    }

    // Procedural terrain height formula
    const h1 = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 1.5;
    const h2 = Math.sin(x * 0.03 + 1.2) * Math.sin(z * 0.03 + 0.8) * 3.0;

    // Crater rim depression at (30, 25)
    const dx = x - 28;
    const dz = z - 25;
    const craterDist = Math.sqrt(dx * dx + dz * dz);
    let craterH = 0;
    if (craterDist < 16) {
      craterH = -Math.cos((craterDist / 16) * (Math.PI / 2)) * 3.5;
    }

    return Math.max(-4.0, h1 + h2 + craterH);
  }

  buildTerrain() {
    const dest = DESTINATIONS[this.destinationId] || DESTINATIONS.moon;

    const geo = new THREE.PlaneGeometry(
      this.terrainWidth,
      this.terrainWidth,
      this.terrainSegments,
      this.terrainSegments
    );
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      pos.setY(i, this.getHeightAt(vx, vz));
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: dest.groundColor,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.group.add(this.terrainMesh);
  }

  buildOutpostStructures() {
    // 1. Central Habitat Dome
    const domeGeo = new THREE.SphereGeometry(6.5, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.3,
      metalness: 0.2
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(-14, 0, -12);
    dome.castShadow = true;
    dome.receiveShadow = true;
    this.group.add(dome);

    // Airlock Module
    const airlockGeo = new THREE.CylinderGeometry(1.4, 1.4, 3.8, 16);
    airlockGeo.rotateZ(Math.PI / 2);
    const airlockMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.4 });
    const airlock = new THREE.Mesh(airlockGeo, airlockMat);
    airlock.position.set(-9.5, 1.2, -12);
    airlock.castShadow = true;
    this.group.add(airlock);

    // 2. Solar Array Tower (Peak of Eternal Light on Moon or Jezero Power Hub)
    const towerGeo = new THREE.CylinderGeometry(0.2, 0.4, 7.5, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-8, 3.75, 12);
    tower.castShadow = true;
    this.group.add(tower);

    // Solar Wings
    const wingGeo = new THREE.BoxGeometry(4.5, 1.6, 0.1);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.2 });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(-8, 7.2, 12);
    wing.rotation.x = 0.4;
    this.group.add(wing);

    // 3. Landing Pad Circle
    const padGeo = new THREE.CylinderGeometry(7.0, 7.2, 0.2, 32);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0, 0.05, 0);
    pad.receiveShadow = true;
    this.group.add(pad);

    // Landing target cross ring
    const ringGeo = new THREE.RingGeometry(3.5, 4.0, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 0.16, 0);
    this.group.add(ring);
  }

  buildBoulders() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: this.destinationId === 'mars' ? 0x9a3412 : 0x52525b,
      roughness: 0.9,
      flatShading: true
    });

    const rockCoords = [
      [14, 8], [-18, 15], [22, -16], [-12, -26], [32, 10], [10, -22], [-28, -6], [25, 28]
    ];

    rockCoords.forEach(([x, z]) => {
      const scale = 0.8 + Math.random() * 1.5;
      const rockGeo = new THREE.DodecahedronGeometry(scale, 1);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const y = this.getHeightAt(x, z);
      rock.position.set(x, y + scale * 0.4, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    });
  }

  buildSky() {
    const dest = DESTINATIONS[this.destinationId] || DESTINATIONS.moon;

    // Starfield particles
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 250 + Math.random() * 50;

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)); // Above horizon
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.85 });
    const starField = new THREE.Points(starGeo, starMat);
    this.group.add(starField);

    // Earth (visible from Moon) or Phobos (visible from Mars)
    const planetDist = 180;
    const planetGeo = new THREE.SphereGeometry(dest.id === 'moon' ? 8 : 4, 24, 24);
    const planetMat = new THREE.MeshBasicMaterial({
      color: dest.id === 'moon' ? 0x38bdf8 : 0xd97706
    });
    const distantPlanet = new THREE.Mesh(planetGeo, planetMat);
    distantPlanet.position.set(80, 95, -planetDist);
    this.group.add(distantPlanet);
  }
}
