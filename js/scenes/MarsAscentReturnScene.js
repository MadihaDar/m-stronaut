/* ============================================================
   FRONTIER: MISSION ACADEMY — Mars Campaign: Mission M05
   PHOBOS RELAY: DEEP-SPACE COMMS & INTERPLANETARY EARTH RETURN
   - Deep space orbit near Mars's potato-shaped moon Phobos
   - Giant curved Mars globe rotating below & craggy 3D Phobos asteroid
   - Interplanetary transfer ship with docking ring & laser comms dish
   - DONKI Space Weather & light-speed delay (4 to 22 minutes)
   - Mandatory Tradeoff: Rock Core Payload vs. Emergency Fuel Buffer (80s timer, un-closeable)
   - Rewarding Grand Mars Campaign Accomplished Celebration Flow
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../systems/CharacterController.js';
import { WaypointSystem } from '../systems/WaypointSystem.js';
import { MarsSimulationEngine, MARS_DATA } from '../data/mars/MarsSimulationEngine.js';

export class MarsAscentReturnScene extends BaseScene {
  constructor(engine) {
    super(engine);

    this.sim = new MarsSimulationEngine(this.engine.save);
    this.mode = 'walk';
    this.missionStage = 'STAGE1_ORBITAL_APPROACH';
    this.laserAligned = false;

    // Flat floor for orbital spacecraft cabin
    this._getInteriorHeight = (x, z) => 0.1;

    this._buildStarfield();
    this._buildMarsCurvedGlobe();
    this._buildPhobosMoon();
    this._buildTransferShip();

    // 1. Guided 3D Waypoint System
    this.waypointSystem = new WaypointSystem(this.scene, this.engine, this._getInteriorHeight);

    // 2. Character Controller inside spacecraft bridge
    this.character = new CharacterController(this.scene, this.engine, this._getInteriorHeight);
    this.character.position.set(0, 0.15, -2.5);
    this.character.setGravity(0.0, false); // Microgravity
    this.character.walkSpeed = 4.2;

    this.camera = this.character.getCamera();
  }

  _buildStarfield() {
    const starCount = 4500;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 260 + Math.random() * 260;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      pos[i3]     = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = radius * Math.cos(phi);

      const b = 0.75 + Math.random() * 0.25;
      colors[i3]     = b * (Math.random() > 0.4 ? 1.0 : 0.85);
      colors[i3 + 1] = b * (Math.random() > 0.4 ? 0.95 : 1.0);
      colors[i3 + 2] = b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({ size: 1.2, vertexColors: true, transparent: true, opacity: 0.9 });
    this.starfield = new THREE.Points(geo, mat);
    this.scene.add(this.starfield);
  }

  _buildMarsCurvedGlobe() {
    this.marsGroup = new THREE.Group();
    this.marsGroup.position.set(0, -95, -70);

    const marsRadius = 65;
    const marsGeo = new THREE.SphereGeometry(marsRadius, 48, 48);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#b84424';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#5c2214';
    ctx.beginPath();
    ctx.arc(380, 220, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(600, 260, 140, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    const marsMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 });
    this.marsGlobe = new THREE.Mesh(marsGeo, marsMat);
    this.marsGroup.add(this.marsGlobe);

    // Atmospheric limb glow
    const atmoGeo = new THREE.SphereGeometry(marsRadius * 1.02, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({ color: 0xef7a55, transparent: true, opacity: 0.22, side: THREE.BackSide });
    this.marsGroup.add(new THREE.Mesh(atmoGeo, atmoMat));

    this.scene.add(this.marsGroup);

    // Sunlight
    this.sun = new THREE.DirectionalLight(0xfff3e0, 2.5);
    this.sun.position.set(150, 60, 100);
    this.scene.add(this.sun);

    this.ambientLight = new THREE.AmbientLight(0x181014, 0.7);
    this.scene.add(this.ambientLight);
  }

  _buildPhobosMoon() {
    // Craggy potato-shaped deformed asteroid moon Phobos
    this.phobosGroup = new THREE.Group();
    this.phobosGroup.position.set(48, 12, -45);

    const phobosGeo = new THREE.DodecahedronGeometry(9, 2);
    const pos = phobosGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Deform sphere into elongated lumpy potato shape (13 x 11 x 9 km ratio)
      x *= 1.35 + Math.sin(y * 0.4) * 0.15;
      y *= 0.95;
      z *= 0.82;
      pos.setXYZ(i, x, y, z);
    }
    phobosGeo.computeVertexNormals();

    const phobosMat = new THREE.MeshStandardMaterial({
      color: 0x474240, // Dark carbonaceous chondrite asteroid tone
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true
    });

    this.phobosMesh = new THREE.Mesh(phobosGeo, phobosMat);
    this.phobosGroup.add(this.phobosMesh);

    // Stickney Impact Crater
    const stickneyGeo = new THREE.CylinderGeometry(2.8, 0.5, 1.8, 16);
    const stickneyMat = new THREE.MeshStandardMaterial({ color: 0x2d2a29, roughness: 0.98 });
    const stickney = new THREE.Mesh(stickneyGeo, stickneyMat);
    stickney.position.set(7.5, 2.2, 0);
    stickney.rotation.z = -Math.PI * 0.4;
    this.phobosGroup.add(stickney);

    this.scene.add(this.phobosGroup);
  }

  _buildTransferShip() {
    this.shipGroup = new THREE.Group();
    this.shipGroup.position.set(0, 0, 0);

    // 1. Spacecraft Flight Deck Cabin (circular walkable bridge)
    const floorGeo = new THREE.CylinderGeometry(5.2, 5.2, 0.25, 32);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1820, roughness: 0.4, metalness: 0.6 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.125;
    this.shipGroup.add(floor);

    // Viewport Window ring facing Phobos and Mars
    const windowRingGeo = new THREE.TorusGeometry(3.8, 0.25, 16, 48, Math.PI);
    const windowRingMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8 });
    const windowRing = new THREE.Mesh(windowRingGeo, windowRingMat);
    windowRing.position.set(0, 1.8, -5.0);
    windowRing.rotation.z = Math.PI * 0.5;
    this.shipGroup.add(windowRing);

    // Transparent glass
    const glassGeo = new THREE.PlaneGeometry(6.5, 3.4);
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, transparent: true, opacity: 0.15, transmission: 0.85 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.8, -5.02);
    this.shipGroup.add(glass);

    // 2. High-Gain Optical Laser Comms Dish & Green Laser Beam towards Earth
    this.commsDishGroup = new THREE.Group();
    this.commsDishGroup.position.set(0, 2.5, -12);

    const dishGeo = new THREE.CylinderGeometry(2.4, 0.4, 0.8, 24);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.rotation.x = Math.PI * 0.5;
    this.commsDishGroup.add(dish);

    // Optical Laser Beam cylinder extending towards deep space (distant Earth)
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.12, 120, 16);
    this.laserBeamMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e, // Emerald green interplanetary laser
      transparent: true,
      opacity: 0.25
    });
    this.laserBeam = new THREE.Mesh(beamGeo, this.laserBeamMat);
    this.laserBeam.position.set(0, 0, -60);
    this.laserBeam.rotation.x = Math.PI * 0.5;
    this.commsDishGroup.add(this.laserBeam);

    this.shipGroup.add(this.commsDishGroup);

    // Interior cabin light
    const cabinLight = new THREE.PointLight(0xe0f2fe, 1.8, 14);
    cabinLight.position.set(0, 3.2, 0);
    this.shipGroup.add(cabinLight);

    this.scene.add(this.shipGroup);
  }

  onEnter() {
    this.engine.showPanel('hud');
    this.engine.hud.setLocation('PHOBOS ORBIT (6,000 KM) • EARTH RETURN');
    this.engine.hud.setMode('INTERPLANETARY FLIGHT');

    this.missionStage = 'STAGE1_ORBITAL_APPROACH';
    this.laserAligned = false;

    if (!this.engine.save.getCampaignResources()) {
      const initRes = { power: 90, oxygen: 100, water: 95, food: 100, roverEnergy: 100, crewCondition: 100 };
      this.engine.save.saveCampaignResources(initRes);
      if (this.engine.resources) this.engine.resources.initMissionLevels(initRes);
    } else if (this.engine.resources) {
      this.engine.resources.initMissionLevels();
    }

    this.character.teleport(new THREE.Vector3(0, 0.15, -2.5));
    this.character.setControlEnabled(true);

    this._startStage1ApproachPhobos();

    this.engine.showNotification('🚀 MISSION 5 ACTIVE: Mars Ascent Vehicle docked near Phobos! Align optical laser relay for Earth return.', 'info', 6500);
  }

  _startStage1ApproachPhobos() {
    this.missionStage = 'STAGE1_ORBITAL_APPROACH';
    const navConsolePos = new THREE.Vector3(0, 1.2, -4.2);

    this.waypointSystem.setWaypoint({
      id: 'phobos_approach_console',
      name: 'PHOBOS ORBITAL NAVIGATION CONSOLE',
      position: navConsolePos,
      color: 0x38bdf8,
      colorName: 'CYAN ORBITAL',
      bullets: [
        'Approach the flight computer navigation console [E]',
        'Lock orbital coordinates with potato-shaped moon Phobos',
        'Prepare cargo audit before Trans-Earth Injection burn'
      ],
      funFact: 'Fact: Phobos orbits so fast it circles Mars three times every single day!',
      onComplete: () => {
        this._startStage2TradeoffDecision();
      }
    });
  }

  _startStage2TradeoffDecision() {
    this.missionStage = 'STAGE2_TRADEOFF';
    this.waypointSystem.clearWaypoint();

    // Trigger Mission 5 Tradeoff Dilemma: Rock Core Payload vs. Emergency Fuel Safety Buffer
    (this.engine.tradeoffs || this.engine.tradeoff).presentMarsM5Tradeoff(() => {
      this._startStage3LaserAlignment();
    });
  }

  _startStage3LaserAlignment() {
    this.missionStage = 'STAGE3_LASER_ALIGN';
    const laserConsolePos = new THREE.Vector3(1.8, 1.2, -4.2);

    this.engine.audio.playTone(720, 0.25, 'triangle', 0.4);
    this.engine.showNotification('⚡ PAYLOAD CERTIFIED! Align the Deep-Space Optical Laser Relay towards Earth!', 'success', 6000);

    this.waypointSystem.setWaypoint({
      id: 'phobos_laser_alignment',
      name: 'HIGH-GAIN OPTICAL LASER RELAY DISH',
      position: laserConsolePos,
      color: 0x22c55e,
      colorName: 'EMERALD LASER',
      bullets: [
        'Align high-gain laser optical transmitter towards Earth (225 million km)',
        'Transmit collected science telemetry and core sample catalogs',
        'Overcome 4 to 22-minute light-speed radio time delay'
      ],
      funFact: 'Fact: Laser communications transmit high-definition science video across the solar system!',
      onComplete: () => {
        this._alignLaserAndCompleteCampaign();
      }
    });
  }

  _alignLaserAndCompleteCampaign() {
    this.laserAligned = true;
    if (this.laserBeamMat) this.laserBeamMat.opacity = 0.95;

    this.engine.audio.playTone(880, 0.4, 'sine', 0.5);
    this.engine.showNotification('📡 LASER LINK ESTABLISHED WITH NASA EARTH GROUND STATION! Trans-Earth Injection burn engaged!', 'success', 8000);

    const injectionBurnPos = new THREE.Vector3(0, 1.2, -4.2);
    this.missionStage = 'STAGE4_INJECTION_BURN';

    this.waypointSystem.setWaypoint({
      id: 'phobos_trans_earth_burn',
      name: 'TRANS-EARTH INJECTION BURN (COMPLETION)',
      position: injectionBurnPos,
      color: 0xfacc15,
      colorName: 'GOLDEN VICTORY',
      bullets: [
        'Engage main rocket engines for 9-month voyage to Earth',
        'All Martian objectives achieved across Jezero, Arcadia, Valles Marineris & Olympus Mons',
        'Press [E] to complete the Mars Campaign!'
      ],
      funFact: 'Fact: Earth and Mars align for this fuel-efficient trajectory once every 26 months!',
      onComplete: () => {
        this._completeGrandCampaignSuccess();
      }
    });
  }

  _completeGrandCampaignSuccess() {
    if (this.missionStage === 'MISSION_COMPLETE') return;
    this.missionStage = 'MISSION_COMPLETE';

    if (this.character) this.character.setControlEnabled(false);

    this.engine.audio.playSuccess();
    this.engine.scoring.add(3000, 'Mars Interplanetary Campaign Triumph');
    const scoreData = this.engine.scoring.calculateFinalScore();

    // Record final grand sample
    this.engine.save.recordMissionSample('mars_m5', {
      type: 'PHOBOS LASER RELAY',
      name: 'Interplanetary Telemetry & Jezero Rock Core Archive'
    });

    this.engine.save.completeMission('mars_m5');

    // Grand Mars Campaign Accomplished Celebration Modal
    this.engine.showMissionCompletedModal({
      title: '🌟 MARS CAMPAIGN ACCOMPLISHED! 🌟',
      subtitle: 'Phobos Relay • Interplanetary Earth Return',
      points: 3000,
      resources: scoreData.resources,
      praise: 'COMMANDER ALEX MORGAN: You have achieved the pinnacle of human space exploration! From Jezero Delta riverbed clays and Arcadia Planitia glacier mining to the storms of Valles Marineris and Olympus Mons lava tubes, you solved every real-world NASA operational trade-off and safeguarded your crew for the triumphant journey home to Earth!',
      onSelectNext: () => {
        this.engine.setState('DESTINATION');
        this.engine.showPanel('mars-mission-modal');
      }
    });
  }

  restartMission() {
    this.onEnter();
  }

  update(dt) {
    const input = this.engine.input;

    // 1. Slow orbital rotations
    if (this.marsGlobe) {
      this.marsGlobe.rotation.y += 0.008 * dt;
    }
    if (this.phobosMesh) {
      this.phobosMesh.rotation.y += 0.02 * dt;
      this.phobosMesh.rotation.x += 0.01 * dt;
    }
    if (this.starfield) {
      this.starfield.rotation.y += 0.001 * dt;
    }

    // 2. Pulse laser beam when active
    if (this.laserAligned && this.laserBeamMat) {
      this.laserBeamMat.opacity = 0.75 + Math.sin(Date.now() * 0.012) * 0.25;
    }

    // 3. Character movement inside bridge
    this.character.update(dt);

    const p = this.character.getPosition();
    const distFromCenter = Math.hypot(p.x, p.z);
    if (distFromCenter > 4.6) {
      const angle = Math.atan2(p.z, p.x);
      p.x = Math.cos(angle) * 4.6;
      p.z = Math.sin(angle) * 4.6;
      this.character.position.copy(p);
    }

    // Proximity interact prompt
    if (this.missionStage === 'STAGE4_INJECTION_BURN' && p.distanceTo(new THREE.Vector3(0, 0, -4.2)) < 3.5) {
      this.engine.hud.showInteractionPrompt('ENGAGE TRANS-EARTH INJECTION BURN [E]', 'E');
      if (input.isActionPressed('interact')) {
        this._completeGrandCampaignSuccess();
      }
    }

    // 4. Waypoint system update
    this.waypointSystem.update(dt, p);

    // 5. Tactical Navigation Telemetry
    const playerHeading = this.character.getHeading();
    this.engine.hud.updateNavigation({
      playerPos: p,
      playerHeading,
      basePos: { x: 0, z: -4.2 },
      distance: p.distanceTo(new THREE.Vector3(0, 0, -4.2))
    });
  }
}
