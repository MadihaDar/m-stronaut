import * as THREE from 'three';

export class MarsEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    this.terrainWidth = 160;
    this.terrainSegments = 90;

    this.buildTerrain();
    this.buildBaseFacilities();
    this.buildBoulders();
    this.buildMarsSky();

    this.scene.add(this.group);
  }

  getHeightAt(x, z) {
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter < 14) {
      return 0; // Flat central base plaza
    }
    // Jezero crater delta hills & sedimentary ripples
    const h1 = Math.sin(x * 0.07) * Math.cos(z * 0.07) * 1.8;
    const h2 = Math.sin(x * 0.025 + 0.5) * Math.sin(z * 0.025 + 1.2) * 3.2;
    // Ancient river channel canyon at (35, -25)
    const dx = x - 35;
    const dz = z + 25;
    const canyonDist = Math.sqrt(dx * dx + dz * dz);
    let canyonH = 0;
    if (canyonDist < 20) {
      canyonH = -Math.cos((canyonDist / 20) * (Math.PI / 2)) * 4.0;
    }
    return Math.max(-5.0, h1 + h2 + canyonH);
  }

  buildTerrain() {
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

    // Mars rust-red & ochre material
    const mat = new THREE.MeshStandardMaterial({
      color: 0xb4481e,
      roughness: 0.92,
      metalness: 0.08,
      flatShading: true
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.group.add(this.terrainMesh);
  }

  buildBaseFacilities() {
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.2 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.1 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 });
    const regolithMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.95 });

    // 1. MAIN HABITAT DOME & AIRLOCK
    const habGeo = new THREE.SphereGeometry(7.0, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const hab = new THREE.Mesh(habGeo, whiteMat);
    hab.position.set(-16, 0, -10);
    hab.castShadow = true;
    hab.receiveShadow = true;
    this.group.add(hab);

    const airlockGeo = new THREE.CylinderGeometry(1.5, 1.5, 4.0, 16);
    airlockGeo.rotateZ(Math.PI / 2);
    const airlock = new THREE.Mesh(airlockGeo, darkMat);
    airlock.position.set(-11, 1.3, -10);
    airlock.castShadow = true;
    this.group.add(airlock);

    // 2. GREENHOUSE DOME
    const ghGeo = new THREE.SphereGeometry(5.0, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const greenhouse = new THREE.Mesh(ghGeo, glassMat);
    greenhouse.position.set(-16, 0, 12);
    this.group.add(greenhouse);

    // Green plant trays inside
    const trayGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.4, 16);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    tray.position.set(-16, 0.3, 12);
    this.group.add(tray);

    // 3. SOLAR PANEL FIELD (with dust accumulation)
    const panelBedGeo = new THREE.BoxGeometry(4.0, 0.1, 2.2);
    for (let i = 0; i < 4; i++) {
      const panel = new THREE.Mesh(panelBedGeo, solarMat);
      panel.position.set(-2 - i * 5, 1.2, -26);
      panel.rotation.x = 0.35;
      panel.castShadow = true;
      this.group.add(panel);
    }

    // 4. BATTERY & POWER STATION
    const batGeo = new THREE.BoxGeometry(3.2, 2.0, 2.0);
    const bat = new THREE.Mesh(batGeo, darkMat);
    bat.position.set(6, 1.0, -22);
    bat.castShadow = true;
    this.group.add(bat);

    // 5. WATER EXTRACTION STATION & DRILL RIG
    const drillDerrickGeo = new THREE.CylinderGeometry(0.2, 0.8, 5.5, 6);
    const drill = new THREE.Mesh(drillDerrickGeo, darkMat);
    drill.position.set(20, 2.75, 14);
    drill.castShadow = true;
    this.group.add(drill);

    // 6. WATER STORAGE TANK
    const tankGeo = new THREE.CylinderGeometry(1.6, 1.6, 3.2, 16);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(15, 1.6, 14);
    tank.castShadow = true;
    this.group.add(tank);

    // 7. COMMUNICATIONS DISH
    const commMastGeo = new THREE.CylinderGeometry(0.2, 0.3, 6.0, 8);
    const commMast = new THREE.Mesh(commMastGeo, darkMat);
    commMast.position.set(18, 3.0, -12);
    this.group.add(commMast);

    const commDishGeo = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.4);
    const commDish = new THREE.Mesh(commDishGeo, whiteMat);
    commDish.position.set(18, 6.2, -12);
    commDish.rotation.x = -Math.PI * 0.65;
    this.group.add(commDish);

    // 8. REGOLITH-SHIELDED RADIATION SHELTER BUNKER
    const bunkerGeo = new THREE.CylinderGeometry(5.0, 6.5, 3.2, 16);
    const bunker = new THREE.Mesh(bunkerGeo, regolithMat);
    bunker.position.set(-30, 1.6, 0);
    bunker.castShadow = true;
    this.group.add(bunker);

    // Heavy reinforced blast door
    const doorGeo = new THREE.BoxGeometry(1.6, 2.2, 0.3);
    const door = new THREE.Mesh(doorGeo, darkMat);
    door.position.set(-25, 1.1, 0);
    this.group.add(door);

    // 9. ROVER GARAGE & CHARGING DOCK
    const garageGeo = new THREE.BoxGeometry(6.0, 3.0, 5.0);
    const garage = new THREE.Mesh(garageGeo, darkMat);
    garage.position.set(4, 1.5, 8);
    garage.castShadow = true;
    this.group.add(garage);

    // 10. MARS ASCENT VEHICLE (RETURN ROCKET) ON LAUNCH PAD
    const padGeo = new THREE.CylinderGeometry(7.5, 8.0, 0.4, 32);
    const pad = new THREE.Mesh(padGeo, darkMat);
    pad.position.set(32, 0.2, -18);
    pad.receiveShadow = true;
    this.group.add(pad);

    // Rocket Body (MAV)
    const rocketBodyGeo = new THREE.CylinderGeometry(1.6, 2.0, 9.0, 16);
    const rocketBody = new THREE.Mesh(rocketBodyGeo, whiteMat);
    rocketBody.position.set(32, 4.8, -18);
    rocketBody.castShadow = true;
    this.group.add(rocketBody);

    const rocketNoseGeo = new THREE.ConeGeometry(1.6, 3.0, 16);
    const rocketNose = new THREE.Mesh(rocketNoseGeo, whiteMat);
    rocketNose.position.set(32, 10.8, -18);
    this.group.add(rocketNose);

    // Rocket Stage Accent
    const accentGeo = new THREE.CylinderGeometry(1.62, 1.62, 0.8, 16);
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c });
    const accentBand = new THREE.Mesh(accentGeo, orangeMat);
    accentBand.position.set(32, 6.5, -18);
    this.group.add(accentBand);
  }

  buildBoulders() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.95,
      flatShading: true
    });

    const rockCoords = [
      [12, 24], [-12, -35], [26, 8], [-28, 22], [38, -6], [-8, 28], [22, -32], [42, 18]
    ];

    rockCoords.forEach(([x, z]) => {
      const scale = 0.9 + Math.random() * 1.6;
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

  buildMarsSky() {
    // Starfield
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 260 + Math.random() * 40;

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta));
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffedd5, size: 1.0, transparent: true, opacity: 0.6 });
    const starField = new THREE.Points(starGeo, starMat);
    this.group.add(starField);

    // Phobos moon in sky
    const phobosGeo = new THREE.DodecahedronGeometry(2.5, 1);
    const phobosMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
    const phobos = new THREE.Mesh(phobosGeo, phobosMat);
    phobos.position.set(60, 90, -180);
    this.group.add(phobos);
  }
}
