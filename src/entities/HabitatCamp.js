import * as THREE from 'three';
import { audio } from '../engine/AudioManager.js';
import { storage } from '../engine/StorageManager.js';

export class HabitatCamp {
  constructor(scene, destinationId = 'mars') {
    this.scene = scene;
    this.destinationId = destinationId;
    this.group = new THREE.Group();

    this.interactiveObjects = [];
    this.solarPanels = [];
    this.cropPlants = [];
    this.foodItems = [];

    this.isWaterDrillRunning = true;
    this.drillRotation = 0;

    this.buildCamp();
    this.scene.add(this.group);
  }

  buildCamp() {
    this.buildHabitatExterior();
    this.buildHabitatInterior();
    this.buildGreenhouse3DCrops();
    this.buildGalleyFood();
    this.buildRadiationShelter();
    this.buildInteractiveSolarPanels();
    this.buildWaterDrillRig();
    this.buildCommsDish();
    this.buildRoverChargingStation();
  }

  buildHabitatExterior() {
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.35,
      metalness: 0.25,
      side: THREE.DoubleSide
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.5
    });

    // Main Geodesic Dome Exterior (Cutout for entrance)
    const domeGeo = new THREE.SphereGeometry(7.5, 32, 20, 0, Math.PI * 1.85, 0, Math.PI * 0.5);
    this.mainDome = new THREE.Mesh(domeGeo, whiteMat);
    this.mainDome.position.set(-16, 0, -10);
    this.mainDome.rotation.y = 0.25;
    this.mainDome.castShadow = true;
    this.mainDome.receiveShadow = true;
    this.group.add(this.mainDome);

    // Exterior Airlock Tunnel connecting outside to inside
    const tunnelGeo = new THREE.CylinderGeometry(1.6, 1.6, 4.5, 20, 1, true);
    tunnelGeo.rotateZ(Math.PI / 2);
    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.6,
      side: THREE.DoubleSide
    });
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.position.set(-10.5, 1.4, -10);
    tunnel.castShadow = true;
    this.group.add(tunnel);

    // Airlock Door Frame & Portal Indicator
    const frameGeo = new THREE.TorusGeometry(1.6, 0.15, 8, 24);
    frameGeo.rotateY(Math.PI / 2);
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(-8.5, 1.4, -10);
    this.group.add(frame);

    // Exterior Foundation Ring
    const baseGeo = new THREE.CylinderGeometry(7.8, 8.0, 0.4, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const basePlaza = new THREE.Mesh(baseGeo, baseMat);
    basePlaza.position.set(-16, 0.2, -10);
    basePlaza.receiveShadow = true;
    this.group.add(basePlaza);
  }

  buildHabitatInterior() {
    // Interior Floor with futuristic metal deck plates
    const floorGeo = new THREE.CircleGeometry(7.4, 32);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.7
    });
    const interiorFloor = new THREE.Mesh(floorGeo, floorMat);
    interiorFloor.position.set(-16, 0.22, -10);
    interiorFloor.receiveShadow = true;
    this.group.add(interiorFloor);

    // Interior Warm Lighting
    const interiorLight = new THREE.PointLight(0x93c5fd, 1.5, 14);
    interiorLight.position.set(-16, 4.5, -10);
    this.group.add(interiorLight);

    // Central Command Holo-Table
    const tableBaseGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.9, 16);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const holoTable = new THREE.Mesh(tableBaseGeo, tableMat);
    holoTable.position.set(-16, 0.65, -10);
    holoTable.castShadow = true;
    this.group.add(holoTable);

    // Holographic Rotating Wireframe Globe
    const globeGeo = new THREE.SphereGeometry(0.55, 14, 10);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });
    this.holoGlobe = new THREE.Mesh(globeGeo, globeMat);
    this.holoGlobe.position.set(-16, 1.5, -10);
    this.group.add(this.holoGlobe);

    // Computer Console Banks with Glowing Screens
    const consoleGeo = new THREE.BoxGeometry(2.4, 1.1, 0.8);
    const consoleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 });
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    const screenGeo = new THREE.PlaneGeometry(2.0, 0.7);

    // Console 1 (Comms & Life Support)
    const console1 = new THREE.Mesh(consoleGeo, consoleMat);
    console1.position.set(-19.5, 0.75, -10);
    console1.rotation.y = Math.PI / 2;
    this.group.add(console1);

    const screen1 = new THREE.Mesh(screenGeo, screenMat);
    screen1.position.set(-19.05, 1.1, -10);
    screen1.rotation.y = -Math.PI / 2;
    screen1.rotation.x = -0.2;
    this.group.add(screen1);

    // Console 2 (Navigation & Science Radar)
    const console2 = new THREE.Mesh(consoleGeo, consoleMat);
    console2.position.set(-16, 0.75, -6.5);
    this.group.add(console2);

    const screen2 = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    screen2.position.set(-16, 1.1, -6.95);
    screen2.rotation.x = 0.2;
    this.group.add(screen2);
  }

  buildGreenhouse3DCrops() {
    // Greenhouse Wing Connecting Corridor
    const corrGeo = new THREE.BoxGeometry(2.2, 2.2, 5.0);
    const corrMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
    const corridor = new THREE.Mesh(corrGeo, corrMat);
    corridor.position.set(-16, 1.3, 1);
    this.group.add(corridor);

    // Greenhouse Transparent Bio-Dome
    const ghGeo = new THREE.SphereGeometry(5.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const ghGlassMat = new THREE.MeshStandardMaterial({
      color: 0x86efac,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    this.greenhouseDome = new THREE.Mesh(ghGeo, ghGlassMat);
    this.greenhouseDome.position.set(-16, 0, 7);
    this.group.add(this.greenhouseDome);

    // Biological Violet/Magenta Grow Light
    const bioLight = new THREE.PointLight(0xa855f7, 2.0, 10);
    bioLight.position.set(-16, 3.5, 7);
    this.group.add(bioLight);

    // Raised Soil/Nutrient Planting Beds
    const bedGeo = new THREE.BoxGeometry(4.0, 0.5, 1.5);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.95 });

    // Left Bed: Martian Potatoes
    const bedLeft = new THREE.Mesh(bedGeo, bedMat);
    bedLeft.position.set(-18, 0.35, 7);
    this.group.add(bedLeft);

    // Right Bed: Hydroponic Tomatoes
    const bedRight = new THREE.Mesh(bedGeo, bedMat);
    bedRight.position.set(-14, 0.35, 7);
    this.group.add(bedRight);

    // Spawn 3D Potato Plants (Leafy Green Bushes)
    for (let i = 0; i < 4; i++) {
      const zOffset = 5.8 + i * 0.8;
      const stemGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.6, 6);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(-18, 0.7, zOffset);

      const leafGeo = new THREE.DodecahedronGeometry(0.25, 0);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
      const leaves = new THREE.Mesh(leafGeo, leafMat);
      leaves.position.set(0, 0.3, 0);
      stem.add(leaves);

      this.group.add(stem);
      this.cropPlants.push(stem);
    }

    // Spawn 3D Tomato Plants (Vines with Bright Red Tomatoes)
    for (let i = 0; i < 4; i++) {
      const zOffset = 5.8 + i * 0.8;
      const vineGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.9, 6);
      const vineMat = new THREE.MeshStandardMaterial({ color: 0x166534 });
      const vine = new THREE.Mesh(vineGeo, vineMat);
      vine.position.set(-14, 0.85, zOffset);

      // Red Tomatoes
      const tomatoGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const tomatoMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.4
      });
      const t1 = new THREE.Mesh(tomatoGeo, tomatoMat);
      t1.position.set(0.1, 0.2, 0.1);
      vine.add(t1);

      const t2 = new THREE.Mesh(tomatoGeo, tomatoMat);
      t2.position.set(-0.1, 0.0, -0.1);
      vine.add(t2);

      this.group.add(vine);
      this.cropPlants.push(vine);
    }
  }

  buildGalleyFood() {
    // Kitchen / Galley Table inside habitat
    const tableGeo = new THREE.BoxGeometry(2.0, 0.8, 1.2);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
    const kitchenTable = new THREE.Mesh(tableGeo, tableMat);
    kitchenTable.position.set(-13.5, 0.6, -12);
    kitchenTable.castShadow = true;
    this.group.add(kitchenTable);

    // 1. 3D Space Apple / Nutrient Fruit
    const fruitGeo = new THREE.SphereGeometry(0.15, 12, 10);
    const fruitMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
    const fruit = new THREE.Mesh(fruitGeo, fruitMat);
    fruit.position.set(-14.0, 1.15, -12);
    this.group.add(fruit);
    this.foodItems.push({ mesh: fruit, type: 'fruit' });

    // 2. 3D Hydration Flask
    const flaskGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.35, 12);
    const flaskMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x083344,
      metalness: 0.4,
      roughness: 0.2
    });
    const flask = new THREE.Mesh(flaskGeo, flaskMat);
    flask.position.set(-13.5, 1.18, -12.2);
    this.group.add(flask);
    this.foodItems.push({ mesh: flask, type: 'drink' });

    // 3. 3D Space Energy Protein Bar (Gold Foil)
    const barGeo = new THREE.BoxGeometry(0.28, 0.06, 0.12);
    const barMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(-13.1, 1.05, -11.9);
    this.group.add(bar);
    this.foodItems.push({ mesh: bar, type: 'bar' });
  }

  buildRadiationShelter() {
    // Reinforced Regolith & Polyethylene Bunker Room inside habitat
    const bunkerWallMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.4
    });
    const bunkerDoorMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.7,
      roughness: 0.3
    });

    // Shelter Room Walls at (-16, 0, -15)
    const bunkerGeo = new THREE.BoxGeometry(3.6, 2.6, 3.2);
    const bunker = new THREE.Mesh(bunkerGeo, bunkerWallMat);
    bunker.position.set(-16, 1.3, -14.8);
    bunker.castShadow = true;
    this.group.add(bunker);

    // Heavy Shielded Vault Door
    const doorGeo = new THREE.BoxGeometry(1.2, 2.0, 0.25);
    const door = new THREE.Mesh(doorGeo, bunkerDoorMat);
    door.position.set(-16, 1.1, -13.1);
    this.group.add(door);

    // Radiation Trefoil Sign
    const signGeo = new THREE.CircleGeometry(0.35, 16);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(-16, 1.8, -12.95);
    this.group.add(sign);
  }

  buildInteractiveSolarPanels() {
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      metalness: 0.9,
      roughness: 0.15
    });
    const dustMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      roughness: 0.98,
      transparent: true,
      opacity: 0.75
    });

    const panelBedGeo = new THREE.BoxGeometry(3.8, 0.12, 2.2);
    const dustLayerGeo = new THREE.BoxGeometry(3.7, 0.04, 2.1);

    for (let i = 0; i < 4; i++) {
      const panelGroup = new THREE.Group();
      panelGroup.position.set(-2 - i * 4.8, 1.2, -26);
      panelGroup.rotation.x = 0.35;

      // Base Support Mast
      const mastGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.6, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = -0.7;
      mast.rotation.x = -0.35;
      panelGroup.add(mast);

      // Shiny Solar Photovoltaic Surface
      const panel = new THREE.Mesh(panelBedGeo, solarMat);
      panel.castShadow = true;
      panelGroup.add(panel);

      // Martian Dust Layer (Removable by sweeping)
      const dust = new THREE.Mesh(dustLayerGeo, dustMat);
      dust.position.y = 0.08;
      panelGroup.add(dust);

      this.group.add(panelGroup);
      this.solarPanels.push({ group: panelGroup, dustMesh: dust, isClean: false, index: i });
    }
  }

  buildWaterDrillRig() {
    this.drillGroup = new THREE.Group();
    this.drillGroup.position.set(20, 0, 14);

    // Tripod Frame
    const legGeo = new THREE.CylinderGeometry(0.1, 0.15, 4.2, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });

    const l1 = new THREE.Mesh(legGeo, legMat);
    l1.position.set(-1.2, 1.9, -1.0);
    l1.rotation.z = -0.3;
    this.drillGroup.add(l1);

    const l2 = new THREE.Mesh(legGeo, legMat);
    l2.position.set(1.2, 1.9, -1.0);
    l2.rotation.z = 0.3;
    this.drillGroup.add(l2);

    const l3 = new THREE.Mesh(legGeo, legMat);
    l3.position.set(0, 1.9, 1.2);
    l3.rotation.x = -0.3;
    this.drillGroup.add(l3);

    // Motor Housing Head
    const motorGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.9, 16);
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5 });
    const motor = new THREE.Mesh(motorGeo, motorMat);
    motor.position.y = 3.4;
    this.drillGroup.add(motor);

    // Rotating Auger Drill Bit
    const augerGeo = new THREE.CylinderGeometry(0.18, 0.05, 3.2, 10);
    const augerMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.2 });
    this.drillBit = new THREE.Mesh(augerGeo, augerMat);
    this.drillBit.position.y = 1.6;
    this.drillGroup.add(this.drillBit);

    // Blue Subsurface Ice Tank
    const tankGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.8, 16);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.3 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(2.4, 0.9, 0);
    this.drillGroup.add(tank);

    this.group.add(this.drillGroup);
  }

  buildCommsDish() {
    this.dishGroup = new THREE.Group();
    this.dishGroup.position.set(-18, 0, -8);

    // Support Mast
    const mastGeo = new THREE.CylinderGeometry(0.2, 0.3, 5.0, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 2.5;
    this.dishGroup.add(mast);

    // Parabolic Dish
    const dishGeo = new THREE.SphereGeometry(1.6, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.4);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    this.dish = new THREE.Mesh(dishGeo, dishMat);
    this.dish.position.set(0, 5.0, 0);
    this.dish.rotation.x = 0.5;
    this.dishGroup.add(this.dish);

    // Central Feed Horn
    const hornGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8);
    const horn = new THREE.Mesh(hornGeo, mastMat);
    horn.position.set(0, 5.0, 0.6);
    horn.rotation.x = Math.PI / 2;
    this.dishGroup.add(horn);

    this.group.add(this.dishGroup);
  }

  buildRoverChargingStation() {
    // Charging pad on ground
    const padGeo = new THREE.BoxGeometry(4.5, 0.15, 6.0);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0, 0.1, 0);
    pad.receiveShadow = true;
    this.group.add(pad);

    // Charging Terminal Tower
    const towerGeo = new THREE.BoxGeometry(0.6, 2.0, 0.6);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(2.4, 1.0, 0);
    this.group.add(tower);

    // Glowing Charge Status LED
    const ledGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(2.4, 1.8, 0.32);
    this.group.add(led);
  }

  update(delta) {
    // Animate rotating holographic globe
    if (this.holoGlobe) {
      this.holoGlobe.rotation.y += delta * 0.8;
      this.holoGlobe.rotation.x += delta * 0.3;
    }

    // Animate subsurface ice drill
    if (this.drillBit && this.isWaterDrillRunning) {
      this.drillBit.rotation.y += delta * 12.0;
      this.drillBit.position.y = 1.6 + Math.sin(Date.now() * 0.01) * 0.15;
    }

    // Slowly orient comms dish
    if (this.dish) {
      this.dish.rotation.y = Math.sin(Date.now() * 0.0005) * 0.3;
    }
  }

  sweepPanel(index) {
    const panel = this.solarPanels[index];
    if (panel && !panel.isClean) {
      panel.isClean = true;
      panel.dustMesh.visible = false;
      audio.playClick();
      return true;
    }
    return false;
  }

  harvestCrops() {
    audio.playSuccess();
    // Replenish food in storage
    storage.state.marsState.food = Math.min(100, storage.state.marsState.food + 25);
    storage.state.marsState.greenhouseHealth = 100;
    storage.save();
    return true;
  }

  consumeFood() {
    audio.playEat();
    storage.state.marsState.crewHealth = Math.min(100, storage.state.marsState.crewHealth + 20);
    storage.state.marsState.food = Math.max(0, storage.state.marsState.food - 5);
    storage.save();
    return true;
  }
}
