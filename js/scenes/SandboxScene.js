/* ============================================================
   FRONTIER: MISSION ACADEMY — Sandbox Exploration Proving Ground
   Overhauled with:
   - GTA-style character controller with anti-clipping camera
   - Guided Purple Aura Waypoint system (no aimless roaming)
   - Auto-trigger cinematic camera zoom & Mission Accomplished rewards
   - Spaceship interior start & manual airlock egress
   - Dynamic Day/Night lighting cycle
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../systems/CharacterController.js';
import { RoverController } from '../systems/RoverController.js';
import { SpaceshipLander } from '../systems/SpaceshipLander.js';
import { WaypointSystem } from '../systems/WaypointSystem.js';

export class SandboxScene extends BaseScene {
  constructor(engine) {
    super(engine);

    this.mode = 'walk'; // 'walk' | 'rover'
    this.dayTime = 0;   // for Day/Night cycle

    // Gentle undulating rolling terrain
    this._getTerrainHeight = (x, z) => {
      return Math.sin(x * 0.04) * 2.2 + Math.cos(z * 0.04) * 1.8 + Math.sin((x + z) * 0.08) * 0.8;
    };

    // 1. Build Environment & Lighting
    this._buildEnvironment();
    this._buildOutpostBase();
    this._buildScienceTargets();

    // 2. Build Spaceship Exploration Lander
    this.lander = new SpaceshipLander(this.scene, this.engine, new THREE.Vector3(-24, 0, -18), this._getTerrainHeight);

    // 3. Build Guided Waypoint System (Glowing Purple Aura)
    this.waypointSystem = new WaypointSystem(this.scene, this.engine, this._getTerrainHeight);

    // 4. Build Character Controller
    this.character = new CharacterController(this.scene, this.engine, this._getTerrainHeight);
    this.character.setGravity(6.0, false);
    this.lander.characterRef = this.character;

    // Register solid rigid body colliders (lander hull, landing legs, outpost dome)
    const outpostCol = { type: 'cylinder', pos: { x: 0, z: 0 }, radius: 4.8 };
    const targetCols = this.scienceTargets.map(t => ({
      type: 'cylinder',
      pos: { x: t.position.x, z: t.position.z },
      radius: 0.9
    }));
    this.character.setColliders([...this.lander.getColliders(), outpostCol, ...targetCols]);

    // 5. Build Rover Controller
    this.rover = new RoverController(this.scene, this.engine, new THREE.Vector3(-18, 0, -10), this._getTerrainHeight);
    this.rover.setColliders([...this.lander.getColliders(), outpostCol, ...targetCols]);

    // Initial camera
    this.camera = this.character.getCamera();

    // Objective Index (0 -> 1 -> 2)
    this.currentTargetIndex = 0;
  }

  _buildEnvironment() {
    // Terrain mesh
    const size = 240;
    const segments = 100;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI * 0.5);

    const posAttr = geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      posAttr.setY(i, this._getTerrainHeight(x, z));
    }
    geometry.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x9e8876,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true
    });

    this.terrain = new THREE.Mesh(geometry, terrainMat);
    this.scene.add(this.terrain);

    // Boulders
    const rockGeo = new THREE.DodecahedronGeometry(1.0, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x55483d, roughness: 0.9 });
    for (let i = 0; i < 35; i++) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const rx = (Math.random() - 0.5) * 180;
      const rz = (Math.random() - 0.5) * 180;
      const ry = this._getTerrainHeight(rx, rz);
      const scale = 0.8 + Math.random() * 2.2;
      rock.position.set(rx, ry + scale * 0.3, rz);
      rock.scale.set(scale, scale * (0.6 + Math.random() * 0.6), scale);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      this.scene.add(rock);
    }

    // Sky & Dynamic Day/Night Lighting
    this.hemiLight = new THREE.HemisphereLight(0x4a709c, 0x3d2817, 1.2);
    this.scene.add(this.hemiLight);

    this.sun = new THREE.DirectionalLight(0xfffaed, 2.5);
    this.sun.position.set(60, 90, 40);
    this.sun.castShadow = true;
    this.scene.add(this.sun);

    // Star backdrop for night transition
    const starCount = 3000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 600;
      starPos[i + 1] = 40 + Math.random() * 250;
      starPos[i + 2] = (Math.random() - 0.5) * 600;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.starMat = new THREE.PointsMaterial({ size: 1.2, color: 0xffffff, transparent: true, opacity: 0.5 });
    this.scene.add(new THREE.Points(starGeo, this.starMat));
  }

  _buildOutpostBase() {
    this.outpost = new THREE.Group();

    // Central Habitat Dome
    const domeGeo = new THREE.SphereGeometry(6, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const habMat = new THREE.MeshStandardMaterial({ color: 0xe8eff8, roughness: 0.3, metalness: 0.4 });
    const dome = new THREE.Mesh(domeGeo, habMat);
    dome.position.set(0, 0, -25);
    this.outpost.add(dome);

    // Science Airlock Module
    const airlockGeo = new THREE.CylinderGeometry(1.6, 1.6, 4.0, 16);
    const airlockMat = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.5 });
    const airlock = new THREE.Mesh(airlockGeo, airlockMat);
    airlock.rotation.x = Math.PI * 0.5;
    airlock.position.set(0, 1.2, -19.5);
    this.outpost.add(airlock);

    // Snap outpost to ground
    const baseGroundY = this._getTerrainHeight(0, -25);
    this.outpost.position.y = baseGroundY;
    this.scene.add(this.outpost);
  }

  _buildScienceTargets() {
    this.scienceTargets = [
      {
        id: 'target_rock',
        name: 'Basaltic Regolith Bedrock',
        type: 'THERMAL & MINERAL STUDY',
        position: new THREE.Vector3(-14, 0, 14),
        bullets: [
          'Surface Temp: 209.6 K (-63.5°C) verified by Perseverance MEDA',
          'Subsurface Ice Index: 0.48 Ci (frozen permafrost preserved beneath)',
          'Radiation Rate: 186.6 µGy/day Galactic Cosmic Rays'
        ],
        funFact: 'Fact: You just found blocky rocks that stay warm at night and protect hidden ice below!',
        explain: {
          simple: 'This rock stays freezing cold — cold enough that water ice trapped just a few meters beneath the surface will never melt!',
          advanced: 'Surface brightness temperature verified by Mars 2020 MEDA thermal radiometry. Subsurface ice models from SWIM suggest candidate permafrost suitable for astronaut life-support extraction.',
          nasaDataset: 'Perseverance MEDA Sol 1553, SWIM GeoTIFF'
        }
      },
      {
        id: 'target_core',
        name: 'Hydrogen Volatiles Deposit',
        type: 'NEUTRON SPECTROMETRY PROBE',
        position: new THREE.Vector3(20, 0, -8),
        bullets: [
          'Neutron count suppressed to 14.2 counts/sec',
          'Water Equivalent Hydrogen confirmed at 1.25 wt% H₂O',
          'Flat topographical slope (3.4°) ideal for robotic sample drilling'
        ],
        funFact: 'Fact: Neutrons slow down when bumping into hydrogen atoms, proving water is trapped under your boots!',
        explain: {
          simple: 'When neutrons hit hydrogen atoms in water molecules, they slow down. Finding low neutron counts means hidden water ice below!',
          advanced: 'LRO LEND neutron suppression confirms significant hydrogen enrichment. Topographical analysis from LOLA confirms a flat, safe terrain for autonomous robotic drill operations.',
          nasaDataset: 'LRO LEND, LOLA RDR'
        }
      },
      {
        id: 'target_beacon',
        name: 'Space Weather Monitoring Post',
        type: 'HELIOPHYSICS & RADIATION BEACON',
        position: new THREE.Vector3(0, 0, 24),
        bullets: [
          'Solar Flare Peak Class: M1.6 coronal emission',
          'Coronal Mass Ejection Speed: 476 km/s',
          'Magnetic Shielding Divert: +15% power requirement'
        ],
        funFact: 'Fact: The Sun shot high-energy particles into space! Astronauts must monitor dosimeters and shelter inside spacecraft during storms.',
        explain: {
          simple: 'The Sun launched a solar storm! High-energy particles are heading this way. You need to choose between spending power for shields or sheltering in the spaceship.',
          advanced: 'Direct correlation with DONKI solar event logs from October 2026. Solar Energetic Particles (SEP) require active power diversion to electromagnetic or regolith shields to keep astronaut dose below career safety thresholds.',
          nasaDataset: 'NASA DONKI Space Weather DB, CRaTER Dosimetry'
        }
      }
    ];
  }

  onEnter() {
    this.engine.showPanel('hud');
    this.engine.hud.setLocation('SANDBOX / PROVING GROUND');
    if (this.engine.resources) {
      this.engine.resources.initMissionLevels();
    }

    // ── Phase 4 Requirement: Game starts with player INSIDE spacecraft cabin ──
    const cabinPos = this.lander.getInteriorPlayerSpawn();
    this.character.position.copy(cabinPos);
    this.character.heading = 0;
    this.character.setVisible(true);
    this.lander.isOccupied = true;
    this.lander.interiorActive = true;

    this.engine.showNotification('🛸 CABIN PRESSURIZED: Step up to the airlock hatch and press [E] to step outside!', 'info', 6000);

    // Guide directly to first objective purple aura
    this._activateWaypoint(0);
  }

  _activateWaypoint(index) {
    this.currentTargetIndex = index;
    const target = this.scienceTargets[index];

    if (target) {
      this.waypointSystem.setWaypoint({
        id: target.id,
        name: target.name,
        position: target.position,
        bullets: target.bullets,
        funFact: target.funFact,
        onComplete: () => {
          // Open educational science panel with glossary hovers
          this.engine.sciencePanel.open(target);
          this.engine.scoring.add(200, target.name);

          // Advance to next purple aura objective
          if (index + 1 < this.scienceTargets.length) {
            setTimeout(() => this._activateWaypoint(index + 1), 1200);
          } else {
            this.engine.showNotification('🏆 ALL SECTOR OBJECTIVES ACCOMPLISHED! You are ready for Lunar & Martian Expeditions!', 'success', 8000);
          }
        }
      });
    }
  }

  onExit() {
    this.engine.hidePanel('hud');
    this.engine.hud.hideInteractionPrompt();
  }

  update(dt) {
    const input = this.engine.input;

    // 1. Dynamic Day/Night Lighting Cycle (Phase 4)
    this.dayTime += dt * 0.05; // gentle planetary rotation
    const sunAngle = this.dayTime;
    const sunX = Math.cos(sunAngle) * 90;
    const sunY = Math.sin(sunAngle) * 90;
    const isDay = sunY > 0;

    this.sun.position.set(sunX, Math.max(-10, sunY), 40);
    const sunIntensity = Math.max(0.1, (sunY / 90) * 2.5);
    this.sun.intensity = sunIntensity;

    const ambientInt = isDay ? THREE.MathUtils.lerp(0.6, 1.2, sunY / 90) : 0.25;
    this.hemiLight.intensity = ambientInt;
    this.starMat.opacity = isDay ? 0.2 : 0.95;

    // Headlight turns on during twilight / night
    if (this.character && this.character.headlight) {
      this.character.headlight.intensity = isDay ? 0.5 : 3.2;
    }

    // 2. Rover Toggle (Character <-> Rover)
    if (input.isActionPressed('roverToggle')) {
      const charPos = this.character.getPosition();
      const roverPos = this.rover.getPosition();
      const distToRover = charPos.distanceTo(roverPos);

      if (this.mode === 'walk') {
        if (distToRover < 5.0 && !this.lander.isOccupied) {
          this.mode = 'rover';
          this.character.setVisible(false);
          this.rover.activate();
          this.camera = this.rover.getCamera();
        } else if (this.lander.isOccupied) {
          this.engine.showNotification('Exit the spacecraft airlock first before mounting the rover!', 'warning');
        } else {
          this.engine.showNotification(`Walk closer to the rover to mount! (${distToRover.toFixed(1)}m away)`, 'warning');
        }
      } else {
        this.mode = 'walk';
        this.rover.deactivate();
        this.character.position.copy(this.rover.position).add(new THREE.Vector3(2.5, 0, 0));
        this.character.setVisible(true);
        this.camera = this.character.getCamera();
      }
    }

    // 3. Update Active Controller
    if (this.mode === 'walk') {
      this.character.update(dt);
      this.rover.update(dt);
    } else {
      this.rover.update(dt);
      this.character.position.copy(this.rover.position);
    }

    const playerPos = this.mode === 'walk' ? this.character.getPosition() : this.rover.getPosition();

    // 4. Update Purple Aura Waypoint System (Guided Gameplay, No Aimless Roaming)
    this.waypointSystem.update(dt, playerPos, this.character);

    // 5. Update Lander Lifecycle, Airlock Door & Sub-Orbital Flight
    this.lander.update(dt, playerPos);
    this._updateLanderInteraction();

    // 6. Tactical Radar Telemetry Arrow (locks onto active purple aura)
    const activeWp = this.waypointSystem.getActiveWaypoint();
    const playerHeading = this.mode === 'walk' ? this.character.getHeading() : this.rover.getHeading();

    this.engine.hud.updateNavigation({
      playerPos,
      playerHeading,
      basePos: { x: 0, z: 0 },
      baseName: 'Frontier Alpha Habitat',
      targets: [
        {
          id: 'spaceship_lander',
          name: 'Exploration Lander (Refuge & Airlock)',
          type: 'PRESSURIZED VEHICLE',
          pos: this.lander.getPosition(),
          completed: true
        },
        ...this.scienceTargets.map((t, idx) => ({
          id: t.id,
          name: t.name,
          type: t.type,
          pos: t.position,
          completed: idx < this.currentTargetIndex
        }))
      ],
      activeTarget: activeWp ? {
        id: activeWp.id,
        name: activeWp.name,
        pos: activeWp.position,
        completed: false
      } : null,
      terrainSize: 240,
      sectorName: 'PROVING GROUND SANDBOX'
    });
  }

  /* ── Interactive Airlock & Boarding Interaction ── */
  _updateLanderInteraction() {
    const input = this.engine.input;
    const lander = this.lander;
    const character = this.character;

    if (lander.isLanding || lander.egressActive || lander.boardingActive) return;

    // Inside lander cabin: prompt to step outside onto planetary surface
    if (lander.isOccupied) {
      this.engine.hud.showInteractionPrompt('CYCLE AIRLOCK TO STEP OUTSIDE', 'E');
      if (input.isActionPressed('interact')) {
        lander.startEgress(character, () => {
          character.setVisible(true);
          this.engine.hud.hideInteractionPrompt();
          this.engine.showNotification('EVA COMMENCED: Head towards the Purple Aura!', 'info', 4000);
          if (this.engine.radiation) this.engine.radiation.onExitShelter();
        });
        return;
      }

      // Launch lander into flight mode
      if (input.isActionPressed('launch') || (input.isKeyPressed && input.isKeyPressed('KeyL'))) {
        lander.startFlight();
      }
      return;
    }

    // Outside: prompt to board lander when near ramp
    if (this.mode === 'walk' && lander._nearPlayer && lander.hatchOpen) {
      const dist = character.getPosition().distanceTo(lander.group.position);
      if (dist <= 5.8) {
        this.engine.hud.showInteractionPrompt('BOARD SPACECRAFT', 'E');
        if (input.isActionPressed('interact')) {
          lander.startBoarding(character, null);
        }
      }
    }
  }
}
