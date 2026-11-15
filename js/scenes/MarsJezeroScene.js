/* ============================================================
   FRONTIER: MISSION ACADEMY — Mars Campaign: Mission M01
   JEZERO DELTA: ANCIENT RIVERBED & INGENUITY DRONE SCOUT
   (18.4°N, 77.5°E)
   - Daytime lighting (dusty salmon/butterscotch sky, warm sunlight)
   - Rover-drone scout team across dried-up river delta in Jezero Crater
   - Core drill sampling of ancient lakebed clay mudstones
   - Mandatory Tradeoff: Ingenuity Drone Flight vs. Rover Battery (80s timer, un-closeable)
   - Enforced rover mounting for surface expedition & blue route-tracking line
   - Giant 3D beacons & rewarding win state unlocking Mission 2
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../systems/CharacterController.js';
import { RoverController } from '../systems/RoverController.js';
import { SpaceshipLander } from '../systems/SpaceshipLander.js';
import { WaypointSystem } from '../systems/WaypointSystem.js';
import { MarsSimulationEngine, MARS_DATA } from '../data/mars/MarsSimulationEngine.js';

export class MarsJezeroScene extends BaseScene {
  constructor(engine) {
    super(engine);

    this.sim = new MarsSimulationEngine(this.engine.save);
    this.mode = 'walk';
    this.missionStage = 'STAGE1_DEPLOY_ROVER';

    // Jezero Crater dried-up river delta fan topography
    this._getTerrainHeight = (x, z) => {
      const deltaFan = Math.sin(x * 0.025) * 2.8 + Math.cos(z * 0.025) * 2.2;
      const craters = Math.sin((x - z) * 0.06) * 0.8;
      return deltaFan + craters;
    };

    this._buildEnvironment();
    this._buildJezeroOutpost();
    this._buildIngenuityDrone();

    // 1. Mars Exploration Lander Craft
    this.lander = new SpaceshipLander(this.scene, this.engine, new THREE.Vector3(-25, 0, -20), this._getTerrainHeight);
    this.lander.isOccupied = false; // Player spawns outside on Martian surface

    // 2. Guided 3D Waypoint System
    this.waypointSystem = new WaypointSystem(this.scene, this.engine, this._getTerrainHeight);

    // 3. Controllers
    this.character = new CharacterController(this.scene, this.engine, this._getTerrainHeight);
    this.character.setGravity(7.5, false); // Mars 0.38 Earth gravity
    this.lander.characterRef = this.character;

    // Rigid body colliders
    const outpostCol = { type: 'cylinder', pos: { x: 0, z: 0 }, radius: 5.5 };
    const stationCol = { type: 'cylinder', pos: { x: 18, z: 32 }, radius: 2.2 };
    this.character.setColliders([...this.lander.getColliders(), outpostCol, stationCol]);

    // 4. Pressurized Mars Rover
    this.rover = new RoverController(this.scene, this.engine, new THREE.Vector3(-18, 0, -12), this._getTerrainHeight);
    this.rover.setColliders([...this.lander.getColliders(), outpostCol, stationCol]);
    this.rover.setRouteTrailColor(0x38bdf8); // Blue route tracking line
    this.rover.setRouteTrailVisible(true);
    this._addRoverHeadlights();

    this.camera = this.character.getCamera();
  }

  _addRoverHeadlights() {
    this.headlights = new THREE.SpotLight(0xffedd5, 3.8, 52, Math.PI / 4, 0.35, 1.2);
    this.headlights.position.set(0, 1.6, 2.4);
    this.headlightsTarget = new THREE.Object3D();
    this.headlightsTarget.position.set(0, 0.5, 20);
    const targetRoverGroup = this.rover.mesh || this.rover.group;
    if (targetRoverGroup) {
      targetRoverGroup.add(this.headlights);
      targetRoverGroup.add(this.headlightsTarget);
    }
    this.headlights.target = this.headlightsTarget;
  }

  _buildEnvironment() {
    // Daytime lighting: dusty salmon/butterscotch sky & warm sunlight
    this.skyColorDay = new THREE.Color(0xb56545); // Butterscotch salmon
    this.scene.background = this.skyColorDay.clone();
    this.scene.fog = new THREE.FogExp2(0xb56545, 0.005);

    this.ambient = new THREE.AmbientLight(0x733621, 1.2);
    this.scene.add(this.ambient);

    this.sun = new THREE.DirectionalLight(0xffeedd, 2.5);
    this.sun.position.set(120, 65, 80);
    this.sun.castShadow = true;
    this.scene.add(this.sun);

    // Rust-red & Ochre Terrain Mesh
    const size = 320;
    const segments = 110;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI * 0.5);

    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this._getTerrainHeight(x, z));
    }
    geometry.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0xaa4422,
      roughness: 0.94,
      metalness: 0.06,
      flatShading: true
    });

    this.terrain = new THREE.Mesh(geometry, terrainMat);
    this.scene.add(this.terrain);

    // Riverbed boulders & clay mudstone slabs
    const rockGeo = new THREE.DodecahedronGeometry(1.4, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x5a2d1a, roughness: 0.9 });
    for (let i = 0; i < 40; i++) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const rx = (Math.random() - 0.5) * 220;
      const rz = (Math.random() - 0.5) * 220;
      const ry = this._getTerrainHeight(rx, rz);
      const scale = 0.6 + Math.random() * 2.2;
      rock.position.set(rx, ry + scale * 0.35, rz);
      rock.scale.set(scale, scale * 0.7, scale);
      this.scene.add(rock);
    }
  }

  _buildJezeroOutpost() {
    this.outpost = new THREE.Group();
    const groundY = this._getTerrainHeight(0, 0);
    this.outpost.position.set(0, groundY, 0);

    // Central Habitat Dome
    const habGeo = new THREE.SphereGeometry(6.5, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const habMat = new THREE.MeshStandardMaterial({ color: 0xededed, roughness: 0.3, metalness: 0.3 });
    const hab = new THREE.Mesh(habGeo, habMat);
    this.outpost.add(hab);

    // Hydroponic Greenhouse Tube
    const ghGeo = new THREE.CylinderGeometry(2.2, 2.2, 5.5, 16);
    const ghMat = new THREE.MeshStandardMaterial({ color: 0x225533, transparent: true, opacity: 0.8, roughness: 0.2 });
    const gh = new THREE.Mesh(ghGeo, ghMat);
    gh.rotation.z = Math.PI * 0.5;
    gh.position.set(8.5, 2.2, 0);
    this.outpost.add(gh);

    // Solar Panel Array (MEDA monitoring station)
    const panelGeo = new THREE.BoxGeometry(6.0, 0.1, 3.0);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(-9, 1.8, 0);
    panel.rotation.z = Math.PI * 0.15;
    this.outpost.add(panel);

    this.scene.add(this.outpost);
  }

  _buildIngenuityDrone() {
    // 3D Ingenuity Helicopter Model
    this.droneGroup = new THREE.Group();
    const droneY = this._getTerrainHeight(18, 32);
    this.droneGroup.position.set(18, droneY + 1.2, 32);

    // Fuselage Box
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.7, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.droneGroup.add(body);

    // Solar Panel Topper
    const solarGeo = new THREE.BoxGeometry(1.1, 0.05, 0.9);
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });
    const solar = new THREE.Mesh(solarGeo, solarMat);
    solar.position.y = 0.45;
    this.droneGroup.add(solar);

    // Dual Counter-Rotating Rotor Blades
    const bladeGeo = new THREE.BoxGeometry(2.4, 0.04, 0.18);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });
    this.rotorTop = new THREE.Mesh(bladeGeo, bladeMat);
    this.rotorTop.position.y = 0.65;
    this.droneGroup.add(this.rotorTop);

    this.rotorBottom = new THREE.Mesh(bladeGeo, bladeMat);
    this.rotorBottom.position.y = 0.55;
    this.droneGroup.add(this.rotorBottom);

    // Carbon-fiber landing legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x374151 });
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(legGeo, legMat);
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      leg.position.set(Math.cos(angle) * 0.55, -0.4, Math.sin(angle) * 0.55);
      leg.rotation.z = Math.cos(angle) * 0.35;
      leg.rotation.x = Math.sin(angle) * 0.35;
      this.droneGroup.add(leg);
    }

    this.scene.add(this.droneGroup);
  }

  onEnter() {
    this.engine.showPanel('hud');
    this.engine.hud.setLocation('MARS: JEZERO CRATER DELTA (ANCIENT RIVERBED)');
    this.engine.hud.setMode('EVA SUIT MODE');

    this.missionStage = 'STAGE1_DEPLOY_ROVER';
    if (this.lander) this.lander.isOccupied = false;

    if (!this.engine.save.getCampaignResources()) {
      const initRes = { power: 100, oxygen: 100, water: 95, food: 100, roverEnergy: 100, crewCondition: 100 };
      this.engine.save.saveCampaignResources(initRes);
      if (this.engine.resources) this.engine.resources.initMissionLevels(initRes);
    } else if (this.engine.resources) {
      this.engine.resources.initMissionLevels();
    }

    this.character.teleport(new THREE.Vector3(-22, this._getTerrainHeight(-22, -16) + 0.5, -16));
    this.character.setControlEnabled(true);
    this.rover.setControlEnabled(true);
    this.rover.teleport(new THREE.Vector3(-18, this._getTerrainHeight(-18, -12) + 0.5, -12));

    this._startStage1MountRover();

    this.engine.showNotification('🔴 MISSION 1 ACTIVE: Jezero Delta riverbed clay scout! Mount rover to join Ingenuity drone team.', 'info', 6500);
  }

  _startStage1MountRover() {
    this.missionStage = 'STAGE1_DEPLOY_ROVER';
    const roverPos = this.rover.getPosition();

    this.waypointSystem.setWaypoint({
      id: 'jezero_mount_rover',
      name: 'MOUNT EXPLORATION ROVER [R]',
      position: roverPos,
      color: 0xff8c42,
      colorName: 'MARTIAN ORANGE',
      bullets: [
        'Approach the pressurized long-range exploration rover',
        'Press [R] to board the rover cockpit and activate life support',
        'Rover battery and robotic drill arm are powered on'
      ],
      funFact: 'Fact: Billions of years ago, a mighty river rushed into Jezero Crater, forming a 250-meter deep lake!',
      onComplete: () => {
        if (this.mode === 'rover') {
          this._startStage2DeltaScout();
        } else {
          this.engine.hud.showInteractionPrompt('🚜 MUST MOUNT ROVER [R] TO BEGIN MISSION', 'R');
        }
      }
    });
  }

  _startStage2DeltaScout() {
    this.missionStage = 'STAGE2_DELTA_SCOUT';
    const deltaOverlookPos = new THREE.Vector3(18, this._getTerrainHeight(18, 32), 32);

    this.engine.audio.playTone(660, 0.2, 'sine', 0.35);
    this.engine.showNotification('🏞️ RIVERBED DELTA FAN: Drive rover to meet the Ingenuity scout drone at the clay overlook (~60m)!', 'info', 6000);

    this.waypointSystem.setWaypoint({
      id: 'jezero_delta_overlook',
      name: 'INGENUITY DRONE SCOUT STATION',
      position: deltaOverlookPos,
      triggerRadius: 12.0,
      color: 0xfacc15,
      colorName: 'SOLAR GOLD',
      bullets: [
        'Drive rover to the Ingenuity helicopter launch deck (~60m)',
        'Survey ancient layered clay mudstones in the delta fan',
        'Press [E] to launch Ingenuity drone reconnaissance flight'
      ],
      funFact: 'Fact: Ingenuity was humanity\'s first powered flight on another planet!',
      onComplete: () => {
        if (this.mode !== 'rover') {
          this.engine.showNotification('⚠️ ROVER REQUIRED: Must be inside rover for life support!', 'warning', 4000);
          return;
        }
        this._startStage3TradeoffDecision();
      }
    });
  }

  _startStage3TradeoffDecision() {
    if (this.missionStage === 'STAGE3_TRADEOFF') return;
    this.missionStage = 'STAGE3_TRADEOFF';
    if (this.waypointSystem.clearWaypoint) {
      this.waypointSystem.clearWaypoint();
    } else {
      this.waypointSystem.setWaypoint(null);
    }

    this.engine.audio.playTone(880, 0.25, 'sine', 0.4);
    this.engine.showNotification('🚁 INGENUITY DRONE READY: Choose flight power configuration...', 'info', 5000);

    // Trigger Mission 1 Tradeoff Dilemma: Drone Aerial Recon vs. Rover Battery (80s timer, uncloseable)
    (this.engine.tradeoffs || this.engine.tradeoff).presentMarsM1Tradeoff(() => {
      this._startStage4CoreDrill();
    });
  }

  _startStage4CoreDrill() {
    this.missionStage = 'STAGE4_CORE_DRILL';
    this.coreDrilled = false;
    const drillSitePos = new THREE.Vector3(26, this._getTerrainHeight(26, 60), 60);

    this.engine.audio.playTone(880, 0.25, 'triangle', 0.4);
    this.engine.showNotification('⚡ FLIGHT DATA SECURED! Drive rover to the ancient lakebed clay outcrop (~40m) to drill core samples!', 'success', 6000);

    this.waypointSystem.setWaypoint({
      id: 'jezero_core_drill_site',
      name: 'ANCIENT LAKEBED CLAY CORING SITE',
      position: drillSitePos,
      triggerRadius: 12.0,
      color: 0x38bdf8,
      colorName: 'CYAN BEACON',
      bullets: [
        'Drive rover alongside the stratified clay mudstone layer (~40m)',
        'Press [E] to drill chalk-sized rock core into ultra-clean titanium tube',
        'Search for ancient microbial biosignatures preserved in lake mud'
      ],
      funFact: 'Fact: Clay minerals act like a natural trap, locking in microscopic fossil evidence for billions of years!',
      onComplete: () => {
        if (this.mode !== 'rover') {
          this.engine.showNotification('⚠️ ROVER REQUIRED: Pilot rover to operate robotic drill!', 'warning', 4000);
          return;
        }
        this.engine.showNotification('🔬 CLAY OUTCROP REACHED: Press [E] to deploy robotic coring drill!', 'info', 6000);
      }
    });
  }

  drillCoreSample() {
    if (this.coreDrilled) return;
    this.coreDrilled = true;

    this.engine.audio.playTone(740, 0.3, 'sawtooth', 0.35);
    this.engine.showNotification('⚙️ ROBOTIC CORING DRILL ENGAGED: Drilling 6 cm into ancient delta mudstone...', 'info', 4000);

    setTimeout(() => {
      this.engine.audio.playSuccess();
      this.engine.save.recordMissionSample('mars_m1', {
        type: 'DELTA CLAY CORE',
        name: 'Jezero Delta Ancient River Mudstone Core',
        isSample: true
      });
      this.engine.scoring.add(400, 'Titanium Sample Tube Sealed & Hermetically Cached');
      this.engine.showNotification('💎 CORE SEALED IN TITANIUM TUBE! Ready to return to basecamp!', 'success', 5000);
      this._startStage5ReturnOutpost();
    }, 1800);
  }

  _startStage5ReturnOutpost() {
    this.missionStage = 'STAGE5_RETURN_OUTPOST';
    const outpostPos = new THREE.Vector3(0, this._getTerrainHeight(0, 0), 0);

    this.engine.audio.playTone(720, 0.25, 'sine', 0.35);
    this.engine.showNotification('🚀 CORE SECURED: Drive rover back to Jezero Basecamp airlock (~65m) to complete expedition!', 'success', 7000);

    this.waypointSystem.setWaypoint({
      id: 'jezero_return_outpost',
      name: 'JEZERO OUTPOST AIRLOCK (CACHE & COMPLETE)',
      position: outpostPos,
      triggerRadius: 12.0,
      color: 0x00ff88,
      colorName: 'EMERALD GREEN',
      bullets: [
        'Drive rover onto the base airlock docking apron (~65m)',
        'Cache titanium rock core for future Mars Sample Return to Earth',
        'Press [E] at the airlock to complete Mission 1!'
      ],
      funFact: 'Fact: NASA\'s Mars Sample Return mission is designed to bring these exact tubes back to Earth laboratories!',
      onComplete: () => {
        if (this.mode !== 'rover') {
          this.engine.showNotification('⚠️ ROVER REQUIRED: Drive rover to airlock to dock!', 'warning', 4000);
          return;
        }
        this._completeMissionSuccess();
      }
    });
  }

  _completeMissionSuccess() {
    if (this.missionStage === 'MISSION_COMPLETE') return;
    this.missionStage = 'MISSION_COMPLETE';

    if (this.character) this.character.setControlEnabled(false);
    if (this.rover) this.rover.setControlEnabled(false);

    this.engine.audio.playSuccess();
    this.engine.scoring.add(1600, 'Jezero Delta Riverbed Mapped & Core Cached');
    const scoreData = this.engine.scoring.calculateFinalScore();

    // Record physical mission sample
    this.engine.save.recordMissionSample('mars_m1', {
      type: 'DELTA CLAY CORE',
      name: 'Jezero Delta Ancient River Mudstone Core',
      isSample: true
    });

    // Unlock Mars Mission 2 sequentially
    this.engine.save.completeMission('mars_m1');

    // Visual celebration modal routing back to Mars Operations Archive
    this.engine.showMissionCompletedModal({
      title: 'MISSION 1: RIVERBED DELTA SCOUT ACCOMPLISHED',
      subtitle: 'Jezero Crater Delta Fan',
      points: 1600,
      resources: scoreData.resources,
      praise: 'Outstanding scientific expedition, Commander Alex Morgan! You partnered with the Ingenuity drone team, drilled layered mudstones on the dried-up river delta, and sealed precious rock cores in titanium tubes for future return to Earth!',
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

    // 1. Rover Toggle
    if (input.isActionPressed('roverToggle')) {
      const charPos = this.character.getPosition();
      const roverPos = this.rover.getPosition();
      const dist = charPos.distanceTo(roverPos);

      if (this.mode === 'walk') {
        if (dist < 5.5) {
          this.mode = 'rover';
          this.character.setVisible(false);
          this.rover.activate();
          this.camera = this.rover.getCamera();
          this.engine.hud.setMode('ROVER COCKPIT MODE');
          if (this.missionStage === 'STAGE1_DEPLOY_ROVER') {
            this._startStage2DeltaScout();
          }
        }
      } else {
        this.mode = 'walk';
        this.rover.deactivate();
        this.character.position.copy(this.rover.position).add(new THREE.Vector3(2.5, 0, 0));
        this.character.setVisible(true);
        this.camera = this.character.getCamera();
        this.engine.hud.setMode('EVA SUIT MODE');
      }
    }

    // 2. Controller updates
    if (this.mode === 'walk') {
      this.character.update(dt);
    } else {
      this.rover.update(dt);
    }

    // 3. Ingenuity Drone Rotors Animation
    if (this.rotorTop && this.rotorBottom) {
      this.rotorTop.rotation.y += 18.0 * dt;
      this.rotorBottom.rotation.y -= 18.0 * dt;
    }

    // 4. Waypoint system update
    const playerPos = this.mode === 'walk' ? this.character.getPosition() : this.rover.getPosition();
    this.waypointSystem.update(dt, playerPos);

    // 5. Interactive HUD Prompts per Stage (Rover Enforced)
    const outpostPos = new THREE.Vector3(0, this._getTerrainHeight(0, 0), 0);
    const dronePos = new THREE.Vector3(18, this._getTerrainHeight(18, 32), 32);
    const drillSitePos = new THREE.Vector3(26, this._getTerrainHeight(26, 60), 60);

    if (this.missionStage === 'STAGE1_DEPLOY_ROVER') {
      const distToRover = this.character.getPosition().distanceTo(this.rover.getPosition());
      if (this.mode === 'walk') {
        if (distToRover < 5.5) {
          this.engine.hud.showInteractionPrompt('BOARD PRESSURIZED MARS ROVER [R]', 'R');
        } else {
          this.engine.hud.showInteractionPrompt('WALK TO MARS ROVER [W, A, S, D]', 'W');
        }
      }
    } else if (this.missionStage === 'STAGE2_DELTA_SCOUT') {
      const distToDrone = Math.hypot(playerPos.x - dronePos.x, playerPos.z - dronePos.z);
      if (distToDrone < 14.0) {
        if (this.mode === 'rover') {
          this.engine.hud.showInteractionPrompt('INSPECT INGENUITY DRONE & PLAN FLIGHT [E]', 'E');
          if (input.isActionPressed('interact')) {
            this._startStage3TradeoffDecision();
          }
        } else {
          this.engine.hud.showInteractionPrompt('🚜 ROVER REQUIRED: MUST DRIVE ROVER TO DRONE', 'R');
        }
      } else {
        this.engine.hud.showInteractionPrompt(`🚜 DRIVE ROVER TO INGENUITY DRONE (${Math.round(distToDrone)}m ahead)`, '');
      }
    } else if (this.missionStage === 'STAGE4_CORE_DRILL') {
      const distToDrill = Math.hypot(playerPos.x - drillSitePos.x, playerPos.z - drillSitePos.z);
      if (distToDrill < 14.0) {
        if (this.mode === 'rover') {
          this.engine.hud.showInteractionPrompt('DEPLOY ROBOTIC CORING DRILL [E]', 'E');
          if (input.isActionPressed('interact')) {
            this.drillCoreSample();
          }
        } else {
          this.engine.hud.showInteractionPrompt('🚜 ROVER REQUIRED: PILOT ROVER TO DRILL SITE', 'R');
        }
      } else {
        this.engine.hud.showInteractionPrompt(`🚜 DRIVE ROVER TO CLAY OUTCROP (${Math.round(distToDrill)}m ahead)`, '');
      }
    } else if (this.missionStage === 'STAGE5_RETURN_OUTPOST') {
      const distToOutpost = Math.hypot(playerPos.x - outpostPos.x, playerPos.z - outpostPos.z);
      if (distToOutpost < 12.0) {
        this.engine.hud.showInteractionPrompt('CACHE TITANIUM CORE / DOCK AT AIRLOCK [E]', 'E');
        if (input.isActionPressed('interact') || distToOutpost < 5.0) {
          this._completeMissionSuccess();
          return;
        }
      } else {
        // Player travels the full return distance back across the delta!
        this.engine.hud.showInteractionPrompt(`🚜 DRIVE ROVER BACK TO JEZERO BASECAMP (${Math.round(distToOutpost)}m ahead)`, '');
        // NO early completion shortcut!
      }
    }

    // 6. Tactical Navigation Telemetry
    const playerHeading = this.mode === 'walk' ? this.character.getHeading() : this.rover.getHeading();
    let navTarget;
    if (this.missionStage === 'STAGE2_DELTA_SCOUT') {
      navTarget = { id: 'jezero_drone', name: 'Ingenuity Drone Station', pos: { x: 18, z: 32 }, isWaypoint: true, color: 0xfacc15 };
    } else if (this.missionStage === 'STAGE4_CORE_DRILL') {
      navTarget = { id: 'jezero_drill', name: 'Ancient Clay Outcrop', pos: { x: 26, z: 60 }, isWaypoint: true, color: 0x38bdf8 };
    } else if (this.missionStage === 'STAGE5_RETURN_OUTPOST') {
      navTarget = { id: 'jezero_outpost', name: 'Jezero Outpost Airlock', pos: { x: 0, z: 0 }, isWaypoint: true, color: 0x00ff88 };
    } else {
      navTarget = { id: 'jezero_rover', name: 'Mars Rover Cockpit', pos: this.rover.getPosition(), isWaypoint: true, color: 0xff8c42 };
    }

    this.engine.hud.updateNavigation({
      playerPos,
      playerHeading,
      basePos: { x: 0, z: 0 },
      baseName: 'Jezero Delta Basecamp',
      activeTarget: navTarget,
      terrainSize: 320,
      sectorName: 'JEZERO CRATER DELTA (18.4°N, 77.5°E)',
      zoomLevel: 1.0
    });
  }
}
