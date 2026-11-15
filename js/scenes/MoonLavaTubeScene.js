/* ============================================================
   FRONTIER: MISSION ACADEMY — Moon Campaign: Mission 03
   MARIUS HILLS LAVA TUBE — THE SUBTERRANEAN SANCTUARY
   Real NASA Data: LROC NAC 65m Pit Skylight, GRAIL Subsurface Cavity & Diviner
   Stage 1: Drive Rover down the Crane Winch into the Subsurface Cavern
   Stage 2: Traverse Basalt Lava Vault with Dual Headlights & Umbilical Cable
   Stage 3: Deploy 3D LiDAR Scanner to map Cave Vault for Artemis Base
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../systems/CharacterController.js';
import { RoverController } from '../systems/RoverController.js';
import { SpaceshipLander } from '../systems/SpaceshipLander.js';
import { WaypointSystem } from '../systems/WaypointSystem.js';

export class MoonLavaTubeScene extends BaseScene {
  constructor(engine) {
    super(engine);

    this.mode = 'walk'; // 'walk' | 'rover'
    this.missionStage = 'STAGE1_WINCH_DESCENT';
    this.lidarDeployed = false;
    this.tetherLength = 0;
    this.maxTether = 150; // meters

    // Marius Hills Terrain: Subterranean cave floor spanning entrance winch to deep basalt corridor
    this._getTerrainHeight = (x, z) => {
      // Subterranean lava tube floor (spanning pit opening, winch platform, and underground corridor)
      if (z <= 32 && z >= -95 && Math.abs(x) <= 25) {
        return -28.0;
      }
      const distToPit = Math.hypot(x, z);
      // Pit skylight hole at (0, 0)
      if (distToPit < 20) {
        return -28.0; // Cave floor
      } else if (distToPit < 32) {
        // Pit steep cliff rim
        const t = (distToPit - 20) / 12;
        return -28.0 + t * 29.5;
      }
      // Surface undulating volcanic plain
      const mareWwell = Math.sin(x * 0.03) * 1.8 + Math.cos(z * 0.03) * 1.5;
      return 1.5 + mareWwell;
    };

    this.lidarPos = new THREE.Vector3(18, -28.0, -55);
    this.winchPos = new THREE.Vector3(0, 1.8, 25);

    this._buildEnvironment();
    this._buildLavaTubeVault();
    this._buildLidarScanSite();
    this._buildTetherSpline();

    // 1. Artemis Exploration Lander (Surface Camp)
    this.lander = new SpaceshipLander(this.scene, this.engine, new THREE.Vector3(-18, 0, 35), this._getTerrainHeight);

    // 2. Guided Waypoint System
    this.waypointPos = this.lidarPos;
    this.waypointSystem = new WaypointSystem(this.scene, this.engine, this._getTerrainHeight);

    // 3. Controllers
    this.character = new CharacterController(this.scene, this.engine, this._getTerrainHeight);
    this.character.setGravity(3.2, true);
    this.lander.characterRef = this.character;

    // Rigid body colliders (pit cliff rims & cave pillars)
    const winchCol = { type: 'cylinder', pos: { x: 0, z: 25 }, radius: 1.5 };
    const pillarCol = { type: 'cylinder', pos: { x: -8, z: -40 }, radius: 3.5 };
    this.character.setColliders([...this.lander.getColliders(), winchCol, pillarCol]);

    // 4. Lunar Rover parked on cave floor platform with high-beam spotlights
    this.rover = new RoverController(this.scene, this.engine, new THREE.Vector3(0, -28.0, -2), this._getTerrainHeight);
    this.rover.setColliders([...this.lander.getColliders(), winchCol, pillarCol]);
    this.rover.setRouteTrailColor(0xffd700); // Yellow route line mapping valley path driven by player
    this.rover.setRouteTrailVisible(true);
    this._addRoverHeadlights();

    this.camera = this.character.getCamera();
  }

  _buildEnvironment() {
    this.ambientLight = new THREE.AmbientLight(0x040812, 0.35);
    this.scene.add(this.ambientLight);

    // Sun light slicing into the pit skylight
    this.sun = new THREE.DirectionalLight(0xfff5e0, 2.8);
    this.sun.position.set(45, 120, 60);
    this.sun.castShadow = true;
    this.scene.add(this.sun);

    // Volumetric sunbeam cone piercing down into the skylight
    const coneGeo = new THREE.ConeGeometry(24, 45, 32, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff0aa,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sunCone = new THREE.Mesh(coneGeo, coneMat);
    sunCone.position.set(0, -5, 0);
    this.scene.add(sunCone);

    // Surface Terrain with pit cutout
    const size = 300;
    const segments = 120;
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
      color: 0x3a3f48,
      roughness: 0.88,
      metalness: 0.12,
      flatShading: true
    });
    this.terrain = new THREE.Mesh(geometry, terrainMat);
    this.scene.add(this.terrain);

    // Starfield in open sky above pit
    this._buildStarfield();
  }

  _buildStarfield() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 650;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 800;
      starPos[i + 1] = 80 + Math.random() * 400;
      starPos[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, transparent: true, opacity: 0.85 });
    this.starfield = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starfield);
  }

  _buildLavaTubeVault() {
    this.caveGroup = new THREE.Group();

    // Subterranean arched basalt roof (spanning over z: -10 to -90)
    const roofGeo = new THREE.CylinderGeometry(28, 28, 80, 24, 1, true, 0, Math.PI);
    roofGeo.rotateZ(Math.PI * 0.5);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x1f232b,
      roughness: 0.92,
      metalness: 0.15,
      side: THREE.BackSide
    });
    this.roofMesh = new THREE.Mesh(roofGeo, roofMat);
    this.roofMesh.position.set(0, -14, -50);
    this.caveGroup.add(this.roofMesh);

    // Basalt Pillars & Mineral Veins
    const pillarGeo = new THREE.CylinderGeometry(2.4, 3.2, 28, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x272c35, roughness: 0.85, metalness: 0.2 });
    const p1 = new THREE.Mesh(pillarGeo, pillarMat);
    p1.position.set(-10, -14, -40);
    this.caveGroup.add(p1);

    const p2 = new THREE.Mesh(pillarGeo, pillarMat);
    p2.position.set(12, -14, -65);
    this.caveGroup.add(p2);

    // Glowing Mineral Veins (Titanium Ilmenite)
    const veinMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 6; i++) {
      const vein = new THREE.Mesh(new THREE.BoxGeometry(0.3, 8.0, 0.4), veinMat);
      vein.position.set(-14 + Math.random() * 28, -20 + Math.random() * 8, -30 - i * 8);
      vein.rotation.z = (Math.random() - 0.5) * 0.8;
      this.caveGroup.add(vein);
    }

    this.scene.add(this.caveGroup);
  }

  _buildLidarScanSite() {
    this.lidarGroup = new THREE.Group();
    this.lidarGroup.position.copy(this.lidarPos);

    // Tripod Mount
    const mountGeo = new THREE.CylinderGeometry(0.5, 0.9, 1.4, 8);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.y = 0.7;
    this.lidarGroup.add(mount);

    // Spinning LiDAR Head
    const headGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.6, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x005588, emissiveIntensity: 0.6 });
    this.lidarHead = new THREE.Mesh(headGeo, headMat);
    this.lidarHead.position.y = 1.6;
    this.lidarGroup.add(this.lidarHead);

    // Teal Laser Scanning Fan Cone
    const fanGeo = new THREE.ConeGeometry(16, 22, 16, 1, true);
    fanGeo.rotateX(Math.PI * 0.5);
    this.fanMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.laserFan = new THREE.Mesh(fanGeo, this.fanMat);
    this.laserFan.position.set(0, 1.6, -11);
    this.lidarGroup.add(this.laserFan);

    // Holographic Point Cloud Particles
    const ptCount = 75;
    const ptGeo = new THREE.BufferGeometry();
    const ptPositions = new Float32Array(ptCount * 3);
    for (let i = 0; i < ptCount * 3; i += 3) {
      ptPositions[i] = (Math.random() - 0.5) * 26;
      ptPositions[i + 1] = Math.random() * 18;
      ptPositions[i + 2] = (Math.random() - 0.5) * 35;
    }
    ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPositions, 3));
    this.ptMat = new THREE.PointsMaterial({ color: 0x00ffcc, size: 0.35, transparent: true, opacity: 0.0 });
    this.pointCloud = new THREE.Points(ptGeo, this.ptMat);
    this.lidarGroup.add(this.pointCloud);

    this.scene.add(this.lidarGroup);
  }

  _buildTetherSpline() {
    const points = [
      this.winchPos.clone(),
      new THREE.Vector3(0, -10, 10),
      new THREE.Vector3(0, -28, -2)
    ];
    this.tetherCurve = new THREE.CatmullRomCurve3(points);
    const tetherGeo = new THREE.BufferGeometry().setFromPoints(this.tetherCurve.getPoints(24));
    this.tetherMat = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 3 });
    this.tetherLine = new THREE.Line(tetherGeo, this.tetherMat);
    this.tetherLine.visible = false; // Hidden on surface until cave winch is deployed
    this.scene.add(this.tetherLine);
  }

  _addRoverHeadlights() {
    this.headlightL = new THREE.SpotLight(0xddf0ff, 4.5, 45, Math.PI * 0.22, 0.45);
    this.headlightL.position.set(-1.2, 1.4, 2.0);
    this.rover.mesh.add(this.headlightL);

    this.headlightR = new THREE.SpotLight(0xddf0ff, 4.5, 45, Math.PI * 0.22, 0.45);
    this.headlightR.position.set(1.2, 1.4, 2.0);
    this.rover.mesh.add(this.headlightR);

    const targetL = new THREE.Object3D();
    targetL.position.set(-1.2, 0, 20);
    this.rover.mesh.add(targetL);
    this.headlightL.target = targetL;

    const targetR = new THREE.Object3D();
    targetR.position.set(1.2, 0, 20);
    this.rover.mesh.add(targetR);
    this.headlightR.target = targetR;
  }

  onEnter() {
    this.engine.showPanel('hud');
    this.engine.hud.setLocation('MOON: MARIUS HILLS LAVA TUBE (14.2°N, 56.8°W)');
    if (this.engine.resources) {
      this.engine.resources.initMissionLevels();
    }

    // Mission Intro Dialogue for 7-12 year olds
    setTimeout(() => {
      if (this.engine.dialogue) {
        this.engine.dialogue.play('moon_m3_intro');
      }
    }, 450);

    // Start outside standing on the subterranean cave floor next to the rover
    this.character.position.set(4, -28.0, -2);
    this.character.heading = Math.PI;
    this.character.setVisible(true);
    this.lander.isOccupied = false;

    // Underground Natural Radiation Shielding: Radiation is blocked by 30m basalt roof!
    if (this.engine.radiation) {
      this.engine.radiation.instantRate = 0.01;
      this.engine.radiation.isInsideShelter = true;
    }

    this.engine.showNotification('🕳️ TOUCHDOWN: Marius Hills Pit! Natural basalt vault absorbs 100% of cosmic radiation! Mount Rover [R] to explore!', 'info', 8500);

    // Educational dialogue explaining rover's purpose for 7-12 age group
    setTimeout(() => {
      this.engine.showNotification('🚜 ROVER TUTORIAL: The Lunar Rover travels far, crosses tough terrain, and carries heavy tools to save astronaut oxygen!', 'info', 7500);
    }, 1500);

    // Stage 1 Waypoint: Traverse cave tunnel to the deep mineral fissure (Rover Required)
    this._startStage1();

    // Trigger Outpost Power & Tether Dilemma 3.5s after touchdown (Kid-Friendly)
    setTimeout(() => {
      if (this.engine.tradeoff && this.missionStage === 'STAGE1_WINCH_DESCENT') {
        this.engine.tradeoff.presentDecision({
          id: 'marius_tether_tradeoff',
          title: '🔌 Underground Power Cable Choice',
          contextBadge: '🌋 MARIUS HILLS • UNDERGROUND MOON CAVE',
          scenario: 'The thick stone cave roof protects you from space radiation! But no sunlight reaches here. Your rover is connected to a 150m power cord from the surface crane. How do you want to explore?',
          scientificBasis: 'Lava tubes are huge underground tunnels on the Moon. They are super safe from radiation, but rovers need power cords or batteries to explore the dark.',
          choices: [
            {
              title: 'Stay Plugged into 150m Cable (Safe Endless Power)',
              description: 'Keep the power cord plugged in. You have endless electricity, but you can only drive 150 meters away from the crane!',
              icon: '🔌',
              style: 'safe',
              impacts: [
                { label: 'Endless Cable Power', type: 'reward' },
                { label: 'Must Stay Within 150m', type: 'warning' },
                { label: 'Zero Radiation Exposure', type: 'reward' }
              ],
              applyResources: { power: 15, roverEnergy: 20 },
              sciencePoints: 400,
              outcome: 'Umbilical power line locked! Base power stays healthy while exploring the near cavern.',
              onSelected: () => {
                this.tetherCapped = true;
                this.maxTether = 150;
                this.engine.showNotification('🔌 150M TETHER LOCKED: Do not drive further than 150m or the cable will snap!', 'warning', 6000);
              }
            },
            {
              title: 'Unplug Cable for Deep Cave Driving (Drive Anywhere)',
              description: 'Unplug the power cord and drive deep into the cave on rover batteries! You can go as far as you want, but watch your battery clock!',
              icon: '🔋',
              style: 'warning',
              impacts: [
                { label: 'Drive Anywhere in Cave', type: 'reward' },
                { label: '-30% Battery Drain', type: 'cost' },
                { label: 'Watch Your Battery Clock', type: 'warning' }
              ],
              applyResources: { roverEnergy: -30, power: -10 },
              sciencePoints: 650,
              outcome: 'Tether detached! Rover is autonomous, but internal battery clock is ticking.'
            }
          ]
        });
      }
    }, 3500);
  }

  restartMission() {
    if (this.engine && this.engine.save) {
      this.engine.save.set('progress.moonM3', null);
    }
    this.missionStage = 'STAGE1_WINCH_DESCENT';
    this.lidarDeployed = false;
    if (this.lidarMesh) this.lidarMesh.visible = false;
    this.mode = 'walk';
    this.character.position.set(4, -28.0, -2);
    this.character.heading = Math.PI;
    this.character.setVisible(true);
    this.character.setControlEnabled(true);
    if (this.rover) {
      this.rover.position.set(0, -28.0, -2);
      this.rover.heading = Math.PI;
      this.rover.isOccupied = false;
      this.rover.setControlEnabled(true);
      this.rover.speed = 0;
    }
    this._startStage1();
    this.engine.showNotification('🌕 MISSION RESTARTED: Marius Hills Lava Tube Platform! Mount the Rover [R] to explore the deep cavern!', 'info', 7000);
  }

  _startStage1() {
    this.missionStage = 'STAGE1_WINCH_DESCENT';
    this.waypointSystem.setWaypoint({
      id: 'cave_lidar',
      name: 'Marius Hills Basalt Vault & Ilmenite Vein',
      position: this.lidarPos,
      isWaypoint: true,
      requireRover: true,
      triggerRadius: 10.0,
      color: 0xb844ff,
      colorName: 'PURPLE',
      bullets: [
        'Drive Lunar Rover down the dark basalt lava tube',
        'LROC NAC confirms 65m diameter skylight roof opening',
        'Deploy 3D LiDAR Scanner to map subterranean cavern geometry'
      ],
      funFact: 'Fact: Lunar lava tubes are wide enough to house entire cities, shielded from meteorites and cosmic radiation!',
      onComplete: () => {
        this._startStage2();
      }
    });
  }

  _startStage2() {
    this.missionStage = 'STAGE2_DEPLOY_LIDAR';
    this.waypointSystem.setWaypoint({
      id: 'lidar_target_mount',
      name: 'DEPLOY 3D LIDAR SCANNER [E]',
      position: this.lidarPos,
      triggerRadius: 10.0,
      color: 0x00ff88,
      colorName: 'EMERALD GREEN',
      bullets: [
        'Drive rover to tripod mounting station',
        'Press [E] to fire 360-degree LiDAR mapping laser',
        'Map cavern basalt vault safe from space radiation'
      ],
      funFact: 'Fact: LiDAR fires thousands of laser pulses per second to build 3D maps!',
      onComplete: () => {
        this.engine.showNotification('🔬 BASALT VEIN REACHED: Press [E] to deploy the 3D LiDAR Scanner!', 'info', 6000);
      }
    });
    this.engine.audio.playScannerBeep();
    this.engine.showNotification('🔬 VEIN REACHED: Press [E] to deploy the 3D LiDAR Scanner!', 'info', 7500);
  }

  deployLidar() {
    if (this.lidarDeployed) return;
    this.lidarDeployed = true;

    this.engine.audio.playScannerBeep();
    this.engine.audio.playTone(720, 0.25, 'sine', 0.3);

    // Record sample
    this.engine.save.recordMissionSample('moon_m3', { type: '3D LIDAR CAVERN', name: 'Marius Hills Subterranean Vault Map' });

    // Animate laser fan opacity and point cloud
    this.fanMat.opacity = 0.65;
    this.ptMat.opacity = 0.95;

    this.engine.showNotification('📡 3D LIDAR ACTIVE: Laser fan mapping cavern walls! Choose scanning power...', 'success', 5000);

    // Present LiDAR Power vs Resolution Dilemma after scanning starts
    setTimeout(() => {
      if (this.engine.tradeoff) {
        this.engine.tradeoff.presentDecision({
          id: 'lidar_resolution_tradeoff',
          title: '🔬 3D Laser Scanner: Map Detail vs. Rover Battery',
          contextBadge: '🗺️ CAVE MAPPING MISSION',
          scenario: 'To map this dark underground cave, your rover fires thousands of harmless laser beams to make a 3D map! High detail takes more battery. What will you pick?',
          scientificBasis: 'NASA LiDAR maps caves by bouncing laser pulses off walls to create accurate 3D point cloud maps.',
          choices: [
            {
              title: 'Super High-Detail 3D Map (+1,500 Science)',
              description: 'Fire continuous lasers to scan every corner and rock in super high detail! Uses rover battery.',
              icon: '🔬',
              style: 'safe',
              impacts: [
                { label: '+1,500 Science Points', type: 'reward' },
                { label: '-25% Rover Battery Drain', type: 'cost' },
                { label: 'Underground City Site Verified', type: 'reward' }
              ],
              applyResources: { roverEnergy: -25 },
              sciencePoints: 1500,
              outcome: 'High-density LiDAR point cloud generated! Cavern volume calculated at 1.2 million cubic meters.',
              onSelected: () => {
                this._spawnExtractionWaypoint();
              }
            },
            {
              title: 'Low-Power Fast Scout Map (Save Battery)',
              description: 'Take a quick laser snapshot. Saves energy, but leaves small dark corners unmapped.',
              icon: '⚡',
              style: 'warning',
              impacts: [
                { label: '+700 Science Points', type: 'reward' },
                { label: '-8% Rover Battery Drain', type: 'cost' }
              ],
              applyResources: { roverEnergy: -8 },
              sciencePoints: 700,
              outcome: 'Basic cave profile recorded. Modest scientific points awarded with minimal power draw.',
              onSelected: () => {
                this._spawnExtractionWaypoint();
              }
            }
          ],
          onChosen: () => {
            this._spawnExtractionWaypoint();
          }
        });
      }
    }, 1500);
  }

  _spawnExtractionWaypoint() {
    this.missionStage = 'STAGE3_EXTRACTION_WINCH';

    this.engine.showNotification('🚀 3D LIDAR COMPLETE: Objective complete! Drive rover back to Winch Elevator (~90m) to extract!', 'success', 8000);

    // Spawn extraction waypoint
    const extractionPos = new THREE.Vector3(0, -28.0, 25);
    this.waypointSystem.setWaypoint({
      id: 'crane_extraction',
      name: 'SURFACE CRANE WINCH ELEVATOR (EXTRACTION)',
      position: extractionPos,
      triggerRadius: 14.0,
      color: 0x00ff88,
      colorName: 'EMERALD GREEN',
      bullets: [
        'Drive rover back to the heavy winch cable platform (~90m)',
        'LiDAR telemetry secured for Artemis subterranean base',
        'Board the elevator [E] to return to lunar surface'
      ],
      funFact: 'Fact: Basalt tubes provide natural micrometeorite defense and thermal stability (-20°C permanent)!',
      onComplete: () => {
        // Player reached extraction waypoint via rover or foot
        this._completeMissionSuccess();
      }
    });
  }

  _completeMissionSuccess() {
    if (this.missionStage === 'MISSION_COMPLETE') return;
    this.missionStage = 'MISSION_COMPLETE';

    // 1. Immediately disable player movement
    if (this.character) this.character.setControlEnabled(false);
    if (this.rover) this.rover.setControlEnabled(false);

    this.engine.audio.playSuccess();
    this.engine.scoring.add(1500, 'Marius Hills Subterranean Sanctuary Mapped');
    const scoreData = this.engine.scoring.calculateFinalScore();

    // Record physical mission sample
    this.engine.save.recordMissionSample('moon_m3', { type: 'LAVA TUBE BASALT', name: 'Marius Hills Titanium Ilmenite Core' });

    // 2. Standardized sequential mission unlock in SaveManager (unlocks Moon M4)
    this.engine.save.completeMission('moon_m3');

    // 3. Visual feedback with live life-support resources and route back to Lunar Operations Archive
    this.engine.showMissionCompletedModal({
      title: 'MISSION 3: SECRET CAVE SCOUT ACCOMPLISHED',
      subtitle: 'Marius Hills Lava Tube Vault',
      points: 1500,
      resources: scoreData.resources,
      praise: 'Outstanding spelunking, Commander Alex Morgan! You explored the subterranean basalt lava tube, deployed the 3D LiDAR mapping laser, managed tether power, and proved the cavern offers 100% natural radiation shielding!',
      onSelectNext: () => {
        this.engine.setState('DESTINATION');
        this.engine.showPanel('moon-mission-modal');
      }
    });
  }

  update(dt) {
    const input = this.engine.input;

    // 1. Rover Mount / Dismount Toggle [R]
    if (input.isActionPressed('roverToggle')) {
      const charPos = this.character.getPosition();
      const roverPos = this.rover.getPosition();
      const dist = charPos.distanceTo(roverPos);

      if (this.mode === 'walk') {
        if (dist < 5.2 && !this.lander.isOccupied) {
          this.mode = 'rover';
          this.character.setVisible(false);
          this.rover.activate();
          this.camera = this.rover.getCamera();
        }
      } else {
        this.mode = 'walk';
        this.rover.deactivate();
        this.character.position.copy(this.rover.position).add(new THREE.Vector3(2.5, 0, 0));
        this.character.setVisible(true);
        this.camera = this.character.getCamera();
      }
    }

    // 2. Update Controllers & Physics
    if (this.mode === 'walk') {
      this.character.update(dt);

      // Strict On-Foot Restriction: Player cannot walk towards destination on foot!
      if (this.missionStage === 'STAGE1_WINCH_DESCENT') {
        if (this.character.position.z < -8.0) {
          this.character.position.z = -8.0;
          this.character.speed = 0;
          if (this.engine.hud) {
            this.engine.hud.showInteractionPrompt('🚜 ROVER REQUIRED: Must mount Lunar Rover [R] to explore cave!', 'R');
          }
          if (!this._lastFootWarnTime || Date.now() - this._lastFootWarnTime > 3500) {
            this._lastFootWarnTime = Date.now();
            this.engine.showNotification('⚠️ OUTPOST SAFETY RULE: Deep cavern terrain and limited suit oxygen forbid walking on foot! Mount the Lunar Rover [R] to travel through the lava tube!', 'warning', 4500);
            this.engine.audio.playTone(320, 0.15, 'sawtooth', 0.25);
          }
        }
      }

      this.rover.update(dt);
    } else {
      this.rover.update(dt);
      this.character.position.copy(this.rover.position);
    }

    const playerPos = this.mode === 'walk' ? this.character.getPosition() : this.rover.getPosition();

    // 3. Update Waypoints
    this.waypointSystem.update(dt, playerPos, this.character);

    // 4. Update Lander
    this.lander.update(dt, playerPos);

    // 5. Update Spinning LiDAR Animation
    if (this.lidarHead) {
      this.lidarHead.rotation.y += 1.8 * dt;
    }
    if (this.laserFan && this.lidarDeployed) {
      this.laserFan.rotation.z += 1.2 * dt;
    }

    // 6. Update Umbilical Tether Line to Rover
    if (this.tetherLine && this.rover) {
      const p1 = this.winchPos;
      const p2 = this.rover.getPosition();
      this.tetherLength = p1.distanceTo(p2);

      const mid = p1.clone().lerp(p2, 0.5);
      mid.y = Math.min(p1.y, p2.y) - 4.0; // droop sag
      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
      this.tetherLine.geometry.setFromPoints(curve.getPoints(20));

      // Check tether tension limit
      if (this.tetherLength > this.maxTether) {
        this.tetherMat.color.setHex(0xff3344);
        if (this.tetherCapped) {
          this.engine.triggerMissionFailed({
            title: 'MISSION FAILED: UMBILICAL TETHER SNAPPED',
            reason: `Rover traveled ${Math.round(this.tetherLength)}m, exceeding the 150m umbilical limit!`,
            desc: 'The power tether snapped under excessive mechanical tension, severing subterranean communication and life support links!'
          });
          return;
        } else {
          this.engine.hud.showInteractionPrompt('⚠️ TETHER LIMIT REACHED: 150m Cable at max tension!', '');
        }
      } else {
        this.tetherMat.color.setHex(0x00d4ff);
      }
    }

    // 7. Interactive Stage 2 Prompt & Stage 3 Extraction (Rover Enforced)
    if (this.missionStage === 'STAGE2_DEPLOY_LIDAR' && !this.lidarDeployed) {
      const distToSite = Math.hypot(playerPos.x - this.lidarPos.x, playerPos.z - this.lidarPos.z);
      if (distToSite < 14.0) {
        if (this.mode === 'rover') {
          this.engine.hud.showInteractionPrompt('DEPLOY 3D LIDAR SCANNER & MAP CAVE [E]', 'E');
          if (input.isActionPressed('interact')) {
            this.deployLidar();
          }
        } else {
          this.engine.hud.showInteractionPrompt('🚜 ROVER REQUIRED: MUST DRIVE ROVER TO DEPLOY LIDAR', 'R');
        }
      } else {
        this.engine.hud.showInteractionPrompt('🚜 DRIVE ROVER TO PURPLE/GREEN VEIN TO MAP CAVE', 'W');
      }
    } else if (this.missionStage === 'STAGE3_EXTRACTION_WINCH') {
      const winchPos = new THREE.Vector3(0, -28.0, 25);
      const distToWinch = Math.hypot(playerPos.x - winchPos.x, playerPos.z - winchPos.z);

      // Auto-win trigger if rover drives right onto winch elevator platform
      if (distToWinch < 7.0) {
        this._completeMissionSuccess();
        return;
      }

      if (distToWinch < 16.0) {
        this.engine.hud.showInteractionPrompt('BOARD SURFACE WINCH ELEVATOR [E]', 'E');
        if (input.isActionPressed('interact')) {
          this._completeMissionSuccess();
        }
      } else {
        // Driving along corridor - traveling the distance back!
        this.engine.hud.showInteractionPrompt(`🚜 DRIVE ROVER BACK TO WINCH ELEVATOR (${Math.round(distToWinch)}m ahead)`, '');
        // Must travel the distance! No premature completion!
      }
    }

    // 8. Tactical Navigation Telemetry
    const playerHeading = this.mode === 'walk' ? this.character.getHeading() : this.rover.getHeading();
    const isStage3 = this.missionStage === 'STAGE3_EXTRACTION_WINCH';
    const winchPos = new THREE.Vector3(0, -28.0, 25);

    this.engine.hud.updateNavigation({
      playerPos,
      playerHeading,
      basePos: { x: 0, z: 25 },
      baseName: 'Surface Crane Winch Elevator',
      targets: [
        {
          id: isStage3 ? 'crane_extraction' : 'cave_lidar',
          name: isStage3 ? 'Surface Crane Winch Elevator' : 'Marius Hills Basalt Vault',
          type: isStage3 ? 'EXTRACTION ELEVATOR' : 'LIDAR TARGET',
          pos: isStage3 ? winchPos : this.lidarPos,
          completed: isStage3 ? false : this.lidarDeployed,
          isWaypoint: true,
          color: isStage3 ? 0x00ff88 : 0xb844ff,
          isPurple: !isStage3
        }
      ],
      activeTarget: {
        id: isStage3 ? 'crane_extraction' : 'cave_lidar',
        name: isStage3 ? 'Surface Crane Winch Elevator' : 'Marius Hills Basalt Vault',
        type: isStage3 ? 'EXTRACTION ELEVATOR' : 'LIDAR TARGET',
        pos: isStage3 ? winchPos : this.lidarPos,
        completed: isStage3 ? false : this.lidarDeployed,
        isWaypoint: true,
        color: isStage3 ? 0x00ff88 : 0xb844ff,
        isPurple: !isStage3
      },
      terrainSize: 300,
      sectorName: 'MARIUS HILLS SKYLITE (14.0°N, 56.8°W)'
    });
  }
}
