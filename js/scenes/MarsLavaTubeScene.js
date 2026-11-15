/* ============================================================
   FRONTIER: MISSION ACADEMY — Mars Campaign: Mission M04
   OLYMPUS MONS & THARSIS: SUBTERRANEAN LAVA TUBE BASECAMP
   - Flank of 22 km high shield volcano Olympus Mons
   - 60-meter circular skylight collapse pit & crane winch elevator
   - Night / pitch-dark cave illuminated by rover high-beams & neon LiDAR
   - MSL RAD radiation dosimetry dataset integration
   - Mandatory Tradeoff: Deep Lava Vault vs. 3D-Printed Dome (80s timer, un-closeable)
   - Rover exploration with blue route-tracking line
   - Giant 3D beacons & rewarding win state unlocking Mission 5
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../systems/CharacterController.js';
import { RoverController } from '../systems/RoverController.js';
import { SpaceshipLander } from '../systems/SpaceshipLander.js';
import { WaypointSystem } from '../systems/WaypointSystem.js';
import { MarsSimulationEngine, MARS_DATA } from '../data/mars/MarsSimulationEngine.js';

export class MarsLavaTubeScene extends BaseScene {
  constructor(engine) {
    super(engine);

    this.sim = new MarsSimulationEngine(this.engine.save);
    this.mode = 'walk';
    this.missionStage = 'STAGE1_WINCH_DESCENT';
    this.lidarDeployed = false;

    // Underground basalt lava tube topography:
    // Floor sits at Y = -28.0m beneath the volcanic surface.
    // Long cavern corridor stretching along the Z axis from +30 to -80m.
    this._getTerrainHeight = (x, z) => {
      if (Math.abs(x) > 16) return -28.0;
      const corridorFloor = -28.0 + Math.sin(z * 0.04) * 0.8 + Math.cos(x * 0.1) * 0.4;
      return corridorFloor;
    };

    this._buildStarryNightSky();
    this._buildSubterraneanEnvironment();
    this._buildLidarLaserSystem();

    // 1. Surface Crane Winch Platform (Lander structure)
    this.lander = new SpaceshipLander(this.scene, this.engine, new THREE.Vector3(0, -28.0, 25), this._getTerrainHeight);

    // 2. Guided 3D Waypoint System
    this.waypointSystem = new WaypointSystem(this.scene, this.engine, this._getTerrainHeight);

    // 3. Astronaut Controller
    this.character = new CharacterController(this.scene, this.engine, this._getTerrainHeight);
    this.character.setGravity(7.5, false); // Mars 0.38g
    this.lander.characterRef = this.character;

    // Colliders (Crane platform & basalt cave pillars)
    const winchCol = { type: 'cylinder', pos: { x: 0, z: 25 }, radius: 1.5 };
    const pillarCol = { type: 'cylinder', pos: { x: -8, z: -40 }, radius: 3.5 };
    this.character.setColliders([...this.lander.getColliders(), winchCol, pillarCol]);

    // 4. Pressurized Mars Rover
    this.rover = new RoverController(this.scene, this.engine, new THREE.Vector3(0, -28.0, -2), this._getTerrainHeight);
    this.rover.setColliders([...this.lander.getColliders(), winchCol, pillarCol]);
    this.rover.setRouteTrailColor(0x38bdf8); // Blue route trail
    this.rover.setRouteTrailVisible(true);
    this._addRoverHeadlights();

    this.camera = this.character.getCamera();
  }

  _addRoverHeadlights() {
    this.headlights = new THREE.SpotLight(0xf0fdf4, 4.5, 65, Math.PI / 4, 0.3, 1.2);
    this.headlights.position.set(0, 1.6, 2.4);
    this.headlightsTarget = new THREE.Object3D();
    this.headlightsTarget.position.set(0, 0.5, 25);
    const targetRoverGroup = this.rover.mesh || this.rover.group;
    if (targetRoverGroup) {
      targetRoverGroup.add(this.headlights);
      targetRoverGroup.add(this.headlightsTarget);
    }
    this.headlights.target = this.headlightsTarget;
  }

  _buildStarryNightSky() {
    // Night sky looking up through skylight hole: cool dark purple/indigo
    this.nightSky = new THREE.Color(0x0c0714);
    this.scene.background = this.nightSky.clone();
    this.scene.fog = new THREE.FogExp2(0x0a0512, 0.015);

    // Ambient light inside cave is very dim to create suspense and emphasize rover spotlights
    this.ambient = new THREE.AmbientLight(0x1a0f1e, 0.45);
    this.scene.add(this.ambient);

    // High skylight opening moonlight beam
    this.skylightBeam = new THREE.DirectionalLight(0xa78bfa, 0.9);
    this.skylightBeam.position.set(0, 45, 25);
    this.scene.add(this.skylightBeam);
  }

  _buildSubterraneanEnvironment() {
    // 1. Underground Cavern Floor Mesh
    const floorGeo = new THREE.PlaneGeometry(80, 220, 40, 90);
    floorGeo.rotateX(-Math.PI * 0.5);

    const pos = floorGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this._getTerrainHeight(x, z));
    }
    floorGeo.computeVertexNormals();

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x24141c, // Dark volcanic basalt
      roughness: 0.92,
      metalness: 0.15,
      flatShading: true
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.scene.add(this.floorMesh);

    // 2. Arched Volcanic Cave Ceiling (inverted tube)
    const roofGeo = new THREE.CylinderGeometry(18, 18, 220, 24, 1, true, 0, Math.PI);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x180b12,
      roughness: 0.95,
      metalness: 0.1,
      side: THREE.BackSide
    });
    this.roofMesh = new THREE.Mesh(roofGeo, roofMat);
    this.roofMesh.rotation.z = Math.PI * 0.5;
    this.roofMesh.position.set(0, -14.0, -10);
    this.scene.add(this.roofMesh);

    // 3. Basalt Rock Pillars
    const pillarGeo = new THREE.CylinderGeometry(2.4, 3.8, 26, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1f0e16, roughness: 0.95 });
    const p1 = new THREE.Mesh(pillarGeo, pillarMat);
    p1.position.set(-8, -15, -40);
    this.scene.add(p1);

    const p2 = new THREE.Mesh(pillarGeo, pillarMat);
    p2.position.set(9, -15, -65);
    this.scene.add(p2);

    // 4. Skylight Opening Rim at Z = 25
    const rimGeo = new THREE.TorusGeometry(8.5, 1.8, 16, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x451a24, roughness: 0.9 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI * 0.5;
    rim.position.set(0, -0.5, 25);
    this.scene.add(rim);
  }

  _buildLidarLaserSystem() {
    this.lidarGroup = new THREE.Group();
    this.lidarGroup.position.set(0, -28.0, -50);

    // LiDAR Laser Scanner Tower
    const towerGeo = new THREE.CylinderGeometry(0.5, 0.8, 4.2, 16);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 2.1;
    this.lidarGroup.add(tower);

    // Rotating LiDAR Optical Head
    const headGeo = new THREE.SphereGeometry(0.75, 16, 16);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    this.lidarHead = new THREE.Mesh(headGeo, headMat);
    this.lidarHead.position.y = 4.2;
    this.lidarGroup.add(this.lidarHead);

    // 3D Laser Fan Cone
    const fanGeo = new THREE.ConeGeometry(18, 14, 32, 1, true);
    this.fanMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    this.laserFan = new THREE.Mesh(fanGeo, this.fanMat);
    this.laserFan.rotation.x = Math.PI * 0.5;
    this.laserFan.position.y = 4.2;
    this.lidarGroup.add(this.laserFan);

    // Point Cloud Matrix of Cavern Geometry
    const ptCount = 900;
    const ptGeo = new THREE.BufferGeometry();
    const ptPos = new Float32Array(ptCount * 3);
    for (let i = 0; i < ptCount; i++) {
      const angle = Math.random() * Math.PI;
      const radius = 12 + Math.random() * 6;
      const zOffset = (Math.random() - 0.5) * 60;
      ptPos[i * 3]     = Math.cos(angle) * radius;
      ptPos[i * 3 + 1] = 4.2 + Math.sin(angle) * radius * 0.75;
      ptPos[i * 3 + 2] = zOffset;
    }
    ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3));
    this.ptMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.35, transparent: true, opacity: 0.3 });
    this.pointCloud = new THREE.Points(ptGeo, this.ptMat);
    this.lidarGroup.add(this.pointCloud);

    this.scene.add(this.lidarGroup);
  }

  onEnter() {
    this.engine.showPanel('hud');
    this.engine.hud.setLocation('MARS: OLYMPUS MONS (LAVA TUBE BASECAMP)');
    this.engine.hud.setMode('EVA SUIT MODE');

    this.missionStage = 'STAGE1_WINCH_DESCENT';
    this.lidarDeployed = false;

    if (!this.engine.save.getCampaignResources()) {
      const initRes = { power: 90, oxygen: 100, water: 95, food: 100, roverEnergy: 100, crewCondition: 100 };
      this.engine.save.saveCampaignResources(initRes);
      if (this.engine.resources) this.engine.resources.initMissionLevels(initRes);
    } else if (this.engine.resources) {
      this.engine.resources.initMissionLevels();
    }

    // Teleport player beside the Winch Elevator platform at Z = 20
    this.character.teleport(new THREE.Vector3(0, -28.0 + 0.5, 20));
    this.character.setControlEnabled(true);
    this.rover.setControlEnabled(true);
    this.rover.teleport(new THREE.Vector3(0, -28.0 + 0.5, -2));

    this._startStage1MountRover();

    this.engine.showNotification('🌋 MISSION 4 ACTIVE: Skylight descent into Olympus Mons lava tube! Mount rover to map subterranean sanctuary.', 'info', 6500);
  }

  _startStage1MountRover() {
    this.missionStage = 'STAGE1_WINCH_DESCENT';
    const roverPos = this.rover.getPosition();

    this.waypointSystem.setWaypoint({
      id: 'mars_tube_mount_rover',
      name: 'MOUNT SPELUNKING ROVER [R]',
      position: roverPos,
      color: 0xa855f7,
      colorName: 'PURPLE NEON',
      bullets: [
        'Board the subterranean exploration rover [R]',
        'Engage high-beam spotlights to pierce total underground darkness',
        'Cave ceiling blocks 100% of solar cosmic radiation (MSL RAD data)'
      ],
      funFact: 'Fact: Lava tubes on Mars are wide enough to shelter entire city blocks inside!',
      onComplete: () => {
        if (this.mode === 'rover') {
          this._startStage2DeepCaveTraverse();
        } else {
          this.engine.hud.showInteractionPrompt('🚜 MUST MOUNT ROVER [R] TO EXPLORE CAVE', 'R');
        }
      }
    });
  }

  _startStage2DeepCaveTraverse() {
    this.missionStage = 'STAGE2_DEEP_TRAVERSE';
    const deepCavePos = new THREE.Vector3(0, -28.0, -30);

    this.engine.audio.playTone(660, 0.25, 'triangle', 0.35);
    this.engine.showNotification('🔦 HEADLIGHTS ACTIVE: Drive down the basalt lava tube corridor toward the mapping station!', 'info', 5000);

    this.waypointSystem.setWaypoint({
      id: 'mars_tube_traverse',
      name: 'BASALT CORRIDOR SURVEY WAYPOINT',
      position: deepCavePos,
      color: 0x38bdf8,
      colorName: 'CYAN BEACON',
      bullets: [
        'Drive down the dark volcanic tube past basalt pillars',
        'Verify natural cosmic ray and micrometeorite shielding',
        'Prepare 3D LiDAR mapping scan of cavern vault'
      ],
      funFact: 'Fact: Basalt lava tubes maintain an ultra-stable temperature around -20°C year-round!',
      onComplete: () => {
        if (this.mode !== 'rover') {
          this.engine.showNotification('⚠️ ROVER REQUIRED: Cavern terrain forbids walking on foot!', 'warning', 4000);
          return;
        }
        this._startStage3TradeoffDecision();
      }
    });
  }

  _startStage3TradeoffDecision() {
    this.missionStage = 'STAGE3_TRADEOFF';
    this.waypointSystem.clearWaypoint();

    // Trigger Mission 4 Tradeoff Dilemma: Deep Lava Vault vs 3D Regolith Dome
    (this.engine.tradeoffs || this.engine.tradeoff).presentMarsM4Tradeoff(() => {
      this._startStage4DeployLidar();
    });
  }

  _startStage4DeployLidar() {
    this.missionStage = 'STAGE4_DEPLOY_LIDAR';
    const lidarPos = new THREE.Vector3(0, -28.0, -50);

    this.engine.audio.playTone(880, 0.25, 'sine', 0.4);
    this.engine.showNotification('⚡ TRADEOFF RESOLVED! Drive rover to the LiDAR mapping station to scan cavern geometry!', 'success', 6000);

    this.waypointSystem.setWaypoint({
      id: 'mars_tube_lidar_station',
      name: '3D LIDAR CAVERN MAPPING RIG',
      position: lidarPos,
      color: 0x00ffff,
      colorName: 'ELECTRIC CYAN',
      bullets: [
        'Park rover on the LiDAR calibration pad',
        'Deploy 360° laser fan to map subterranean cavern volume',
        'Transmit 3D point cloud telemetry for Artemis habitat design'
      ],
      funFact: 'Fact: 3D LiDAR pulses millions of light beams per second to create digital cave maps!',
      onComplete: () => {
        if (this.mode !== 'rover') {
          this.engine.showNotification('⚠️ ROVER REQUIRED: Must pilot rover to trigger laser mapping scan!', 'warning', 4000);
          return;
        }
        this._deployLidarAndActivateExtraction();
      }
    });
  }

  _deployLidarAndActivateExtraction() {
    this.lidarDeployed = true;
    this.fanMat.opacity = 0.65;
    this.ptMat.opacity = 0.95;

    this.engine.audio.playTone(720, 0.3, 'sine', 0.4);
    this.engine.showNotification('📡 3D LIDAR ACTIVE: Cavern mapped! Return rover to Crane Winch Elevator to extract!', 'success', 8000);

    const extractionPos = new THREE.Vector3(0, -28.0, 25);
    this.missionStage = 'STAGE5_EXTRACTION_WINCH';

    this.waypointSystem.setWaypoint({
      id: 'mars_tube_extraction',
      name: 'CRANE WINCH ELEVATOR (EXTRACTION)',
      position: extractionPos,
      color: 0x00ff88,
      colorName: 'EMERALD GREEN',
      bullets: [
        'Drive rover back to the heavy winch elevator platform',
        'Telemetry secured: Olympus Mons lava tube verified as 100% radiation-safe',
        'Board elevator [E] to return to surface'
      ],
      funFact: 'Fact: Thick basalt roofs reduce astronaut cosmic radiation exposure by over 95%!',
      onComplete: () => {
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
    this.engine.scoring.add(2200, 'Olympus Mons Subterranean Lava Vault Mapped');
    const scoreData = this.engine.scoring.calculateFinalScore();

    this.engine.save.recordMissionSample('mars_m4', {
      type: 'OLYMPUS LAVA BASALT',
      name: 'Tharsis Subterranean Ilmenite Core Sample'
    });

    this.engine.save.completeMission('mars_m4');

    this.engine.showMissionCompletedModal({
      title: 'MISSION 4: LAVA TUBE SCOUT ACCOMPLISHED',
      subtitle: 'Olympus Mons Subterranean Vault',
      points: 2200,
      resources: scoreData.resources,
      praise: 'Outstanding spelunking, Commander Alex Morgan! You explored the volcanic cavern on Olympus Mons, mapped 3D cave geometry with LiDAR lasers, and proved underground lava tubes offer 100% natural shelter from cosmic rays and dust storms!',
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
          if (this.missionStage === 'STAGE1_WINCH_DESCENT') {
            this._startStage2DeepCaveTraverse();
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
      // Enforce no walking far on foot
      if (this.character.position.z < -8.0 && this.missionStage === 'STAGE1_WINCH_DESCENT') {
        this.character.position.z = -8.0;
        this.engine.hud.showInteractionPrompt('🚜 MUST MOUNT ROVER [R] TO EXPLORE DEEP CAVE', 'R');
      }
    } else {
      this.rover.update(dt);
    }

    // 3. LiDAR Fan & Point Cloud Animation
    if (this.lidarHead) {
      this.lidarHead.rotation.y += 2.2 * dt;
    }
    if (this.laserFan && this.lidarDeployed) {
      this.laserFan.rotation.z += 1.5 * dt;
    }

    // 4. Extraction check
    if (this.missionStage === 'STAGE5_EXTRACTION_WINCH') {
      const playerPos = this.mode === 'walk' ? this.character.getPosition() : this.rover.getPosition();
      const distToWinch = playerPos.distanceTo(new THREE.Vector3(0, -28.0, 25));
      if (distToWinch < 8.5) {
        this.engine.hud.showInteractionPrompt('ENTER CRANE WINCH / COMPLETE EXPEDITION [E]', 'E');
        if (input.isActionPressed('interact')) {
          this._completeMissionSuccess();
        }
      }
    }

    // 5. Waypoints & Telemetry
    const playerPos = this.mode === 'walk' ? this.character.getPosition() : this.rover.getPosition();
    this.waypointSystem.update(dt, playerPos);

    const playerHeading = this.mode === 'walk' ? this.character.getHeading() : this.rover.getHeading();
    this.engine.hud.updateNavigation({
      playerPos,
      playerHeading,
      basePos: { x: 0, z: 25 },
      distance: playerPos.distanceTo(new THREE.Vector3(0, -28.0, 25))
    });
  }
}
