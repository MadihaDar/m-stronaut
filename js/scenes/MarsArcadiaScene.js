/* ============================================================
   FRONTIER: MISSION ACADEMY — Mars Campaign: Mission M02
   ARCADIA PLANITIA: SUBSURFACE GLACIER MINING & ISRU FUEL REFINERY
   (39.3°N, 189.7°E)
   - Vast flat northern permafrost plains with polygon ground
   - Automated In-Situ Resource Utilization (ISRU) Sabatier fuel rig
   - SWIM Radar Subsurface Ice Mapping dataset integration
   - Mandatory Tradeoff: Deep Thermal Melting vs. Shallow Dirt Scraping (80s timer, un-closeable)
   - Pressurized rover with blue route-tracking line
   - Giant 3D beacons & rewarding win state unlocking Mission 3
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../systems/CharacterController.js';
import { RoverController } from '../systems/RoverController.js';
import { SpaceshipLander } from '../systems/SpaceshipLander.js';
import { WaypointSystem } from '../systems/WaypointSystem.js';
import { MarsSimulationEngine, MARS_DATA } from '../data/mars/MarsSimulationEngine.js';

export class MarsArcadiaScene extends BaseScene {
  constructor(engine) {
    super(engine);

    this.sim = new MarsSimulationEngine(this.engine.save);
    this.currentStep = 1;
    this.mode = 'walk';
    this.completedSteps = new Set();
    this.missionStage = 'STAGE1_DEPLOY_ROVER';

    // Arcadia Planitia flat northern plains topography with subtle polygonal permafrost ridges
    this._getTerrainHeight = (x, z) => {
      const plains = Math.sin(x * 0.015) * 1.2 + Math.cos(z * 0.015) * 1.0;
      const polyRidges = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 0.45;
      return plains + polyRidges;
    };

    this._buildEnvironment();
    this._buildISRUPlant();

    // 1. Expedition Lander Craft
    this.lander = new SpaceshipLander(this.scene, this.engine, new THREE.Vector3(-28, 0, -22), this._getTerrainHeight);

    // 2. Guided 3D Waypoint System
    this.waypointSystem = new WaypointSystem(this.scene, this.engine, this._getTerrainHeight);

    // 3. Controllers
    this.character = new CharacterController(this.scene, this.engine, this._getTerrainHeight);
    this.character.setGravity(7.5, false); // Mars 0.38 Earth gravity
    this.lander.characterRef = this.character;

    // Rigid body colliders (ISRU refinery towers & nuclear generator)
    const isruCol = { type: 'cylinder', pos: { x: 25, z: 20 }, radius: 5.5 };
    const nukeCol = { type: 'cylinder', pos: { x: 42, z: 25 }, radius: 3.0 };
    this.character.setColliders([...this.lander.getColliders(), isruCol, nukeCol]);

    // 4. Pressurized Mars Rover
    this.rover = new RoverController(this.scene, this.engine, new THREE.Vector3(-20, 0, -14), this._getTerrainHeight);
    this.rover.setColliders([...this.lander.getColliders(), isruCol, nukeCol]);
    this.rover.setRouteTrailColor(0x38bdf8); // Blue route line tracking
    this.rover.setRouteTrailVisible(true);
    this._addRoverHeadlights();

    this.camera = this.character.getCamera();
  }

  _addRoverHeadlights() {
    this.headlights = new THREE.SpotLight(0xe0f2fe, 3.5, 48, Math.PI / 4, 0.4, 1.2);
    this.headlights.position.set(0, 1.6, 2.4);
    this.headlightsTarget = new THREE.Object3D();
    this.headlightsTarget.position.set(0, 0.5, 18);
    const targetRoverGroup = this.rover.mesh || this.rover.group;
    if (targetRoverGroup) {
      targetRoverGroup.add(this.headlights);
      targetRoverGroup.add(this.headlightsTarget);
    }
    this.headlights.target = this.headlightsTarget;
  }

  _buildEnvironment() {
    // Martian twilight / dusk lighting (cool peach sky, low sun, frost glints)
    this.skyColorDusk = new THREE.Color(0xb87360);
    this.scene.background = this.skyColorDusk.clone();
    this.scene.fog = new THREE.FogExp2(0xb87360, 0.0055);

    this.ambient = new THREE.AmbientLight(0x5a3225, 1.1);
    this.scene.add(this.ambient);

    // Low Sun Angle
    this.sun = new THREE.DirectionalLight(0xffccaa, 2.2);
    this.sun.position.set(140, 35, 90);
    this.sun.castShadow = true;
    this.scene.add(this.sun);

    // Cold blue rim light simulating atmospheric scattering
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(-100, 40, -100);
    this.scene.add(rimLight);

    // Terrain Mesh with frosty ochre tones
    const size = 340;
    const segments = 100;
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
      color: 0x9e482e,
      roughness: 0.92,
      metalness: 0.08,
      flatShading: true
    });

    this.terrain = new THREE.Mesh(geometry, terrainMat);
    this.scene.add(this.terrain);

    // Polygonal permafrost ground ice veins (subsurface frost highlights)
    const iceVeinGeo = new THREE.RingGeometry(12, 12.8, 6);
    const iceVeinMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    for (let i = 0; i < 28; i++) {
      const vein = new THREE.Mesh(iceVeinGeo, iceVeinMat);
      const vx = (Math.random() - 0.5) * 240;
      const vz = (Math.random() - 0.5) * 240;
      vein.rotation.x = -Math.PI * 0.5;
      vein.position.set(vx, this._getTerrainHeight(vx, vz) + 0.06, vz);
      this.scene.add(vein);
    }
  }

  _buildISRUPlant() {
    this.isruGroup = new THREE.Group();
    const isruBaseY = this._getTerrainHeight(25, 20);
    this.isruGroup.position.set(25, isruBaseY, 20);

    // 1. Sabatier Reactor Chemical Towers (CO2 + 4H2 -> CH4 + 2H2O)
    const towerGeo = new THREE.CylinderGeometry(1.6, 1.8, 9, 24);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.7 });
    const tower1 = new THREE.Mesh(towerGeo, towerMat);
    tower1.position.set(-2.5, 4.5, 0);
    this.isruGroup.add(tower1);

    const tower2 = new THREE.Mesh(towerGeo, towerMat);
    tower2.position.set(2.5, 4.5, 0);
    this.isruGroup.add(tower2);

    // 2. Cryogenic Methane & Oxygen Spherical Storage Tanks
    const tankGeo = new THREE.SphereGeometry(2.4, 24, 24);
    const tankMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3
    });
    const tankMethane = new THREE.Mesh(tankGeo, tankMat);
    tankMethane.position.set(0, 2.5, -4.5);
    this.isruGroup.add(tankMethane);

    // 3. Subsurface Glacier Thermal Melting Drill Rig
    const drillFrameGeo = new THREE.BoxGeometry(2.0, 7.5, 2.0);
    const drillFrameMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.4 });
    const drillFrame = new THREE.Mesh(drillFrameGeo, drillFrameMat);
    drillFrame.position.set(0, 3.75, 4.2);
    this.isruGroup.add(drillFrame);

    // Glowing Subsurface Water Pipe
    const pipeGeo = new THREE.CylinderGeometry(0.35, 0.35, 6.0, 16);
    const pipeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.drillPipe = new THREE.Mesh(pipeGeo, pipeMat);
    this.drillPipe.position.set(0, 0, 4.2);
    this.isruGroup.add(this.drillPipe);

    // 4. Compact Nuclear Surface Power Unit (Kilopower Reactor)
    const nukeGeo = new THREE.CylinderGeometry(1.2, 1.2, 4.2, 16);
    const nukeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    const nuke = new THREE.Mesh(nukeGeo, nukeMat);
    nuke.position.set(17, 2.1, 5);
    this.isruGroup.add(nuke);

    // Heat radiator cooling fins
    const finGeo = new THREE.ConeGeometry(2.8, 1.8, 16);
    const finMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5, emissive: 0x991b1b, emissiveIntensity: 0.4 });
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.set(17, 4.5, 5);
    this.isruGroup.add(fin);

    this.scene.add(this.isruGroup);
  }

  onEnter() {
    this.engine.showPanel('hud');
    this.engine.hud.setLocation('MARS: ARCADIA PLANITIA (GLACIER MINING)');
    this.engine.hud.setMode('EVA SUIT MODE');

    // Reset mission states
    this.missionStage = 'STAGE1_DEPLOY_ROVER';
    this.completedSteps.clear();

    // Check if player has persistent campaign consumables, otherwise initialize
    if (!this.engine.save.getCampaignResources()) {
      const initRes = { power: 90, oxygen: 100, water: 100, food: 100, roverEnergy: 100, crewCondition: 95 };
      this.engine.save.saveCampaignResources(initRes);
      if (this.engine.resources) this.engine.resources.initMissionLevels(initRes);
    } else if (this.engine.resources) {
      this.engine.resources.initMissionLevels();
    }

    // Teleport astronaut inside/beside lander
    this.character.teleport(new THREE.Vector3(-25, this._getTerrainHeight(-25, -20) + 0.5, -18));
    this.character.setControlEnabled(true);
    this.rover.setControlEnabled(true);
    this.rover.teleport(new THREE.Vector3(-20, this._getTerrainHeight(-20, -14) + 0.5, -14));

    // Show initial Step 1: Mount Rover
    this._startStage1MountRover();

    this.engine.showNotification('🧊 MISSION 2 ACTIVE: Subsurface glacier ice detected in Arcadia Planitia! Mount rover to begin radar survey.', 'info', 6000);
  }

  _startStage1MountRover() {
    this.missionStage = 'STAGE1_DEPLOY_ROVER';
    const roverPos = this.rover.getPosition();

    this.waypointSystem.setWaypoint({
      id: 'arcadia_mount_rover',
      name: 'MOUNT EXPLORATION ROVER [R]',
      position: roverPos,
      color: 0x38bdf8,
      colorName: 'CYAN GLACIAL',
      bullets: [
        'Approach the pressurized long-range exploration rover',
        'Press [R] to board the rover cockpit and activate life support',
        'Headlights and ground-penetrating radar will power on'
      ],
      funFact: 'Fact: Thick subsurface water ice sheets sit just centimeters beneath the dust in Arcadia Planitia!',
      onComplete: () => {
        // Enforce rover mounting
        if (this.mode === 'rover') {
          this._startStage2RadarSurvey();
        } else {
          this.engine.hud.showInteractionPrompt('🚜 MUST MOUNT ROVER [R] TO BEGIN SURVEY', 'R');
        }
      }
    });
  }

  _startStage2RadarSurvey() {
    this.missionStage = 'STAGE2_RADAR_SURVEY';
    const surveyPos = new THREE.Vector3(5, this._getTerrainHeight(5, 10), 10);

    this.engine.audio.playTone(660, 0.2, 'sine', 0.3);
    this.engine.showNotification('📡 GROUND RADAR ONLINE: Drive rover to the ice deposit boundary to measure glacier thickness!', 'success', 5000);

    this.waypointSystem.setWaypoint({
      id: 'arcadia_radar_survey',
      name: 'SWIM RADAR ICE SURVEY POINT',
      position: surveyPos,
      color: 0x00f0ff,
      colorName: 'ELECTRIC CYAN',
      bullets: [
        'Drive rover to the radar survey coordinate',
        'Radar measures ice consistency index (0.72 CI)',
        'Prepares automated Sabatier reactor drilling parameters'
      ],
      funFact: 'Fact: NASA\'s SWIM project combined radar, neutrons, and thermal cameras to map buried Martian ice!',
      onComplete: () => {
        if (this.mode !== 'rover') {
          this.engine.showNotification('⚠️ ROVER REQUIRED: Must remain inside pressurized rover during radar scan!', 'warning', 4000);
          return;
        }
        this._startStage3TradeoffDecision();
      }
    });
  }

  _startStage3TradeoffDecision() {
    this.missionStage = 'STAGE3_TRADEOFF';

    // Clear waypoint while tradeoff decision is active
    this.waypointSystem.clearWaypoint();

    // Trigger Mission 2 Tradeoff Dilemma: Deep Thermal Melt vs. Shallow Regolith Scrape
    (this.engine.tradeoffs || this.engine.tradeoff).presentMarsM2Tradeoff(() => {
      this._startStage4DrillISRU();
    });
  }

  _startStage4DrillISRU() {
    this.missionStage = 'STAGE4_DRILL_ISRU';
    const isruPlatformPos = new THREE.Vector3(25, this._getTerrainHeight(25, 20), 20);

    this.engine.audio.playTone(880, 0.25, 'triangle', 0.35);
    this.engine.showNotification('⚡ DRILL PARAMETERS LOCKED! Drive rover to the Automated Sabatier ISRU Rig!', 'success', 6000);

    this.waypointSystem.setWaypoint({
      id: 'arcadia_isru_platform',
      name: 'AUTOMATED SABATIER ISRU RIG (EXTRACTION)',
      position: isruPlatformPos,
      color: 0x4ade80,
      colorName: 'EMERALD GREEN',
      bullets: [
        'Dock rover alongside the Automated Sabatier Fuel Plant',
        'Melt pure subsurface glacier ice into water reserves',
        'Synthesize liquid methane & oxygen rocket propellant for Earth return'
      ],
      funFact: 'Fact: The Sabatier reaction combines Martian atmospheric CO₂ with melted ice hydrogen to brew rocket fuel!',
      onComplete: () => {
        if (this.mode !== 'rover') {
          this.engine.showNotification('⚠️ ROVER REQUIRED: Drive rover onto the refinery docking pad!', 'warning', 4000);
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
    this.engine.scoring.add(1800, 'Arcadia Planitia Glacier Mined & Sabatier Fuel Synthesized');
    const scoreData = this.engine.scoring.calculateFinalScore();

    // Record physical mission sample
    this.engine.save.recordMissionSample('mars_m2', {
      type: 'ARCADIA GLACIER ICE CORE',
      name: 'Subsurface Pure Water Ice & Sabatier Methane'
    });

    // Unlock Mars Mission 3 sequentially
    this.engine.save.completeMission('mars_m2');

    // Visual celebration modal routing back to Mars Operations Archive
    this.engine.showMissionCompletedModal({
      title: 'MISSION 2: GLACIER MINING ACCOMPLISHED',
      subtitle: 'Arcadia Planitia Subsurface Ice & Fuel Plant',
      points: 1800,
      resources: scoreData.resources,
      praise: 'Incredible engineering, Commander Alex Morgan! You utilized NASA SWIM radar to tap vast underground water ice, powered the Sabatier chemical plant, and synthesized precious methane rocket fuel for the voyage back to Earth!',
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

    // 1. Rover Mount / Dismount Toggle [R]
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
            this._startStage2RadarSurvey();
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

    // 2. Update Controllers & Physics
    if (this.mode === 'walk') {
      this.character.update(dt);
    } else {
      this.rover.update(dt);
    }

    // 3. Drill Pipe & Refinery Pulse Animation
    if (this.drillPipe) {
      this.drillPipe.rotation.y += 2.5 * dt;
    }

    // 4. Update 3D Waypoint System
    const playerPos = this.mode === 'walk' ? this.character.getPosition() : this.rover.getPosition();
    this.waypointSystem.update(dt, playerPos);

    // 5. Tactical Navigation Telemetry
    const playerHeading = this.mode === 'walk' ? this.character.getHeading() : this.rover.getHeading();
    this.engine.hud.updateNavigation({
      playerPos,
      playerHeading,
      basePos: { x: 25, z: 20 },
      distance: playerPos.distanceTo(new THREE.Vector3(25, 0, 20))
    });
  }
}
