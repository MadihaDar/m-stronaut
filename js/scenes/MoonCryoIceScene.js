/* ============================================================
   FRONTIER: MISSION ACADEMY — Moon Campaign: Mission 04
   FAUSTINI CRATER CRYOGENIC ICE MINE — THE FROZEN OASIS
   Real NASA Data: LCROSS 5.5 wt% Water Plume, LRO LEND Neutron Spectrometer & Diviner 40K PSR
   Stage 1: Navigate 40K Permanently Shadowed Crater with Floodlights
   Stage 2: Deploy Industrial Cryo-Drill Rig & Sublimation Canopy Dome
   Stage 3: Manage Cryogenic Tradeoffs (Thermal Heating vs Battery / Propellant vs Life Support)
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../systems/CharacterController.js';
import { RoverController } from '../systems/RoverController.js';
import { SpaceshipLander } from '../systems/SpaceshipLander.js';
import { WaypointSystem } from '../systems/WaypointSystem.js';
import { MOON_DATA } from '../data/lunar/LunarCampaignData.js';

export class MoonCryoIceScene extends BaseScene {
  constructor(engine) {
    super(engine);

    this.mode = 'walk'; // 'walk' | 'rover'
    this.missionStage = 'STAGE1_ICE_TRAVERSE';
    this.drillDeployed = false;
    this.drillActive = false;
    this.extractedIceKg = 0;
    this.targetIceKg = 250; // kg of pure H2O ice

    // Faustini PSR Crater Floor Terrain (Cold crater floor surrounded by towering rim walls)
    this._getTerrainHeight = (x, z) => {
      const distFromCenter = Math.hypot(x, z);
      // Crater rim rising at distance > 85m
      if (distFromCenter > 85) {
        const rimT = Math.min(1.0, (distFromCenter - 85) / 45);
        return rimT * 32.0;
      }
      // Crater floor with gentle frost-heave hummocks
      const hummock = Math.sin(x * 0.05) * 1.4 + Math.cos(z * 0.06) * 1.2;
      return hummock;
    };

    this.drillPos = new THREE.Vector3(38, this._getTerrainHeight(38, -42), -42);

    this._buildEnvironment();
    this._buildCryoIceTerrain();
    this._buildDrillSite();
    this._initVisorFrostUI();

    // 1. Artemis Exploration Lander
    this.lander = new SpaceshipLander(this.scene, this.engine, new THREE.Vector3(-18, 0, -12), this._getTerrainHeight);

    // 2. Guided Waypoint System
    this.waypointPos = this.drillPos;
    this.waypointSystem = new WaypointSystem(this.scene, this.engine, this._getTerrainHeight);

    // 3. Controllers
    this.character = new CharacterController(this.scene, this.engine, this._getTerrainHeight);
    this.character.setGravity(3.2, true); // Lunar 1/6 g
    this.lander.characterRef = this.character;

    // Colliders
    const campCol = { type: 'cylinder', pos: { x: 0, z: -5 }, radius: 4.5 };
    const drillCol = { type: 'cylinder', pos: { x: 38, z: -42 }, radius: 4.0 };
    this.character.setColliders([...this.lander.getColliders(), campCol, drillCol]);

    // 4. Heavy Lunar Mining Rover parked near lander
    this.rover = new RoverController(this.scene, this.engine, new THREE.Vector3(-10, 0, -8), this._getTerrainHeight);
    this.rover.setColliders([...this.lander.getColliders(), campCol, drillCol]);

    this.camera = this.character.getCamera();
  }

  _buildEnvironment() {
    // Ultra-deep space ambient light (PSR - zero direct sunlight, illuminated only by Earthshine and work lights)
    this.ambientLight = new THREE.AmbientLight(0x0c1528, 0.35);
    this.scene.add(this.ambientLight);

    // Faint Earthshine rim light
    this.earthLight = new THREE.DirectionalLight(0x4488ff, 0.45);
    this.earthLight.position.set(-80, 50, -40);
    this.scene.add(this.earthLight);

    // High-mast industrial floodlight tower at base camp
    this.baseFloodlight = new THREE.SpotLight(0xaaddff, 4.5, 90, Math.PI * 0.35, 0.4);
    this.baseFloodlight.position.set(-15, 14, -8);
    this.baseFloodlight.target.position.set(0, 0, 0);
    this.scene.add(this.baseFloodlight);
    this.scene.add(this.baseFloodlight.target);

    // Tower pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.28, 14, 8),
      new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.8 })
    );
    pole.position.set(-15, 7, -8);
    this.scene.add(pole);

    // Dense starfield skybox
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 320 + Math.random() * 40;
      starPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 10; // keep above horizon
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xddf0ff,
      size: 1.2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.95
    });
    this.starfield = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starfield);
  }

  _buildCryoIceTerrain() {
    // 240m x 240m high-resolution cryogenic regolith plane with frost glint
    const planeGeo = new THREE.PlaneGeometry(240, 240, 96, 96);
    planeGeo.rotateX(-Math.PI / 2);

    const pos = planeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this._getTerrainHeight(x, z));
    }
    planeGeo.computeVertexNormals();

    // Specular dark blue regolith with icy sheen
    this.groundMat = new THREE.MeshStandardMaterial({
      color: 0x182030,
      roughness: 0.35,
      metalness: 0.45
    });
    this.terrainMesh = new THREE.Mesh(planeGeo, this.groundMat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // Glowing cyan permafrost ice veins across the crater floor
    this.iceVeins = new THREE.Group();
    const iceGeo = new THREE.RingGeometry(2.0, 7.5, 18);
    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x33bbee,
      emissive: 0x0088cc,
      emissiveIntensity: 0.65,
      roughness: 0.15,
      metalness: 0.8,
      side: THREE.DoubleSide
    });

    const patchLocations = [
      { x: 38, z: -42 },
      { x: 26, z: -35 },
      { x: 45, z: -52 },
      { x: 15, z: -25 }
    ];

    patchLocations.forEach(p => {
      const patch = new THREE.Mesh(iceGeo, iceMat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(p.x, this._getTerrainHeight(p.x, p.z) + 0.05, p.z);
      this.iceVeins.add(patch);
    });
    this.scene.add(this.iceVeins);
  }

  _buildDrillSite() {
    this.drillGroup = new THREE.Group();
    this.drillGroup.position.copy(this.drillPos);

    // 1. Heavy Industrial Drill Derrick Tower (Lattice Truss Frame)
    const towerGeo = new THREE.CylinderGeometry(1.4, 2.2, 9.5, 4, 1, true);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.4, metalness: 0.7 }); // NASA orange
    this.tower = new THREE.Mesh(towerGeo, towerMat);
    this.tower.position.y = 4.75;
    this.drillGroup.add(this.tower);

    // 2. Spinning Carbide Auger Bit
    const augerGeo = new THREE.CylinderGeometry(0.35, 0.45, 6.5, 12);
    const augerMat = new THREE.MeshStandardMaterial({ color: 0x95a5a6, metalness: 0.9, roughness: 0.2 });
    this.augerBit = new THREE.Mesh(augerGeo, augerMat);
    this.augerBit.position.y = 3.0;
    this.drillGroup.add(this.augerBit);

    // Spiral helical blade flange on auger
    const spiralGeo = new THREE.TorusGeometry(0.65, 0.08, 8, 24);
    const spiralMat = new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.9 });
    for (let k = 0; k < 5; k++) {
      const ring = new THREE.Mesh(spiralGeo, spiralMat);
      ring.rotation.x = Math.PI / 2 + 0.2;
      ring.position.y = 0.8 + k * 1.1;
      this.augerBit.add(ring);
    }

    // 3. Heated Sublimation Canopy Dome (Captures vaporized H2O)
    const domeGeo = new THREE.SphereGeometry(3.6, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    this.domeMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    this.dome = new THREE.Mesh(domeGeo, this.domeMat);
    this.dome.position.y = 0.2;
    this.drillGroup.add(this.dome);

    // 4. Cryogenic Liquid Water Condenser Tank
    const tankGeo = new THREE.CylinderGeometry(0.9, 0.9, 3.2, 16);
    const tankMat = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      metalness: 0.8,
      roughness: 0.3
    });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(3.2, 1.6, 0.5);
    this.drillGroup.add(tank);

    // Tank level indicator window
    const levelGeo = new THREE.PlaneGeometry(0.15, 2.4);
    this.levelMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const levelMesh = new THREE.Mesh(levelGeo, this.levelMat);
    levelMesh.position.set(3.2, 1.6, 1.42);
    this.drillGroup.add(levelMesh);

    // 5. Work Spotlights on Drill Rig
    this.drillWorkLight = new THREE.SpotLight(0xddeeff, 5.0, 35, Math.PI * 0.3, 0.35);
    this.drillWorkLight.position.set(0, 8.5, 0);
    this.drillWorkLight.target.position.set(0, 0, 0);
    this.drillGroup.add(this.drillWorkLight);
    this.drillGroup.add(this.drillWorkLight.target);

    // 6. Steam / Sublimation Vapor Particle System
    const steamCount = 65;
    const steamGeo = new THREE.BufferGeometry();
    const steamPos = new Float32Array(steamCount * 3);
    this.steamVelocities = [];

    for (let i = 0; i < steamCount; i++) {
      steamPos[i * 3]     = (Math.random() - 0.5) * 2.5;
      steamPos[i * 3 + 1] = Math.random() * 4.0;
      steamPos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
      this.steamVelocities.push(0.8 + Math.random() * 1.5);
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
    this.steamMat = new THREE.PointsMaterial({
      color: 0x99eeff,
      size: 0.35,
      transparent: true,
      opacity: 0.0, // starts invisible until drilling
      blending: THREE.AdditiveBlending
    });
    this.steamParticles = new THREE.Points(steamGeo, this.steamMat);
    this.drillGroup.add(this.steamParticles);

    // 7. Crystalline Frozen Ice Mound (Initial state)
    const iceGeo = new THREE.DodecahedronGeometry(1.6, 1);
    this.iceMoundMat = new THREE.MeshStandardMaterial({
      color: 0xcdefff,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.35
    });
    this.frozenIceMound = new THREE.Mesh(iceGeo, this.iceMoundMat);
    this.frozenIceMound.position.set(0, 0.45, 0);
    this.frozenIceMound.scale.set(1.4, 0.65, 1.4);
    this.drillGroup.add(this.frozenIceMound);

    // 8. Dynamic Melted Liquid Water Pool (Swaps in upon extraction)
    const poolGeo = new THREE.CylinderGeometry(2.3, 2.3, 0.18, 24);
    this.waterPoolMat = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      roughness: 0.05,
      metalness: 0.35,
      transparent: true,
      opacity: 0.88,
      emissive: 0x0055ff,
      emissiveIntensity: 0.45
    });
    this.meltedWaterPool = new THREE.Mesh(poolGeo, this.waterPoolMat);
    this.meltedWaterPool.position.set(0, 0.1, 0);
    this.meltedWaterPool.visible = false; // Initially frozen!
    this.drillGroup.add(this.meltedWaterPool);

    this.scene.add(this.drillGroup);
  }

  _initVisorFrostUI() {
    let frost = document.getElementById('visor-frost-overlay');
    if (!frost) {
      frost = document.createElement('div');
      frost.id = 'visor-frost-overlay';
      frost.className = 'visor-frost-overlay';
      frost.style.display = 'none';
      frost.innerHTML = `
        <div class="frost-vignette"></div>
        <div class="cryo-temp-badge">
          <span class="cryo-icon">❄️</span>
          <span class="cryo-label">SURFACE TEMP: 40 K (-233°C) • PERMAFROST CORE</span>
        </div>
      `;
      document.body.appendChild(frost);
    }
    this.frostOverlay = frost;
  }

  onEnter() {
    this.engine.showPanel('hud');
    this.engine.hud.setLocation('MOON: FAUSTINI CRATER (87.3°S - PERMAFROST PSR)');
    if (this.engine.resources) {
      this.engine.resources.initMissionLevels();
    }

    if (this.frostOverlay) this.frostOverlay.style.display = 'block';

    // Mission Intro Dialogue for 7-12 year olds
    setTimeout(() => {
      if (this.engine.dialogue) {
        this.engine.dialogue.play('moon_m4_intro');
      }
    }, 450);

    // Start outside lander on foot
    this.character.position.set(-14, this._getTerrainHeight(-14, -8), -8);
    this.character.heading = Math.PI * 0.35;
    this.character.setVisible(true);
    this.lander.isOccupied = false;

    this.engine.showNotification('🧊 TOUCHDOWN: Faustini Crater PSR! 40 Kelvin (-233°C). Drive the Rover to the Hydrogen Permafrost anomaly [Waypoint]!', 'info', 8500);

    // Initial Cryogenic Dilemma
    setTimeout(() => {
      if (this.engine.tradeoff && this.missionStage === 'STAGE1_ICE_TRAVERSE') {
        this.engine.tradeoff.presentDecision({
          id: 'faustini_thermal_dilemma',
          title: '❄️ Deep Freeze Survival: Heaters vs. Battery',
          contextBadge: '🧊 FAUSTINI CRATER • SUPER FREEZING SHADOW',
          scenario: 'This deep crater is one of the coldest places in the entire solar system (-233°C)! How much battery will you spend on heaters to keep your suit and rover warm?',
          scientificBasis: 'In permanently shadowed Moon craters, temperatures drop to 40 Kelvin! Electric heaters prevent metal from cracking.',
          choices: [
            {
              title: 'Cozy Warm Heaters (100% Warmth & Health)',
              description: 'Run full power to all heaters. Astronauts stay warm and healthy, but battery drains faster.',
              icon: '🔥',
              style: 'safe',
              impacts: [
                { label: '+10% Crew Health', type: 'reward' },
                { label: '-8% Battery Power', type: 'cost' },
                { label: 'Heaters 100% Active', type: 'reward' }
              ],
              applyResources: { power: -8, crewCondition: 10 },
              sciencePoints: 350,
              outcome: 'Heaters glowing warm! Life support safe, but battery capacity draining steadily.'
            },
            {
              title: 'Pulse-Warming Mode (Save Battery Power)',
              description: 'Turn heaters on and off in pulses. Saves power for heavy ice drilling, but feels a bit chilly!',
              icon: '⚡',
              style: 'balanced',
              impacts: [
                { label: '+15% Power Saved', type: 'reward' },
                { label: '-10% Crew Warmth', type: 'cost' },
                { label: 'Longer Driving Range', type: 'reward' }
              ],
              applyResources: { power: 15, crewCondition: -10 },
              sciencePoints: 500,
              outcome: 'Power conserved for heavy ice drilling! Systems remain stable.'
            }
          ]
        });
      }
    }, 3500);

    this._startStage1();
  }

  restartMission() {
    if (this.engine && this.engine.save) {
      this.engine.save.set('progress.moonM4', null);
    }
    this.missionStage = 'STAGE1_ICE_TRAVERSE';
    this.drillSampleExtracted = false;
    this.isruPurified = false;
    this.mode = 'walk';
    this.character.position.set(-14, this._getTerrainHeight(-14, -8), -8);
    this.character.heading = Math.PI * 0.35;
    this.character.setVisible(true);
    this.character.setControlEnabled(true);
    if (this.rover) {
      this.rover.position.set(-12, this._getTerrainHeight(-12, -6), -6);
      this.rover.heading = Math.PI * 0.35;
      this.rover.isOccupied = false;
      this.rover.setControlEnabled(true);
      this.rover.speed = 0;
    }
    if (this.lander) {
      this.lander.isOccupied = false;
      this.lander.interiorActive = false;
    }
    this._startStage1();
    this.engine.showNotification('🌕 MISSION RESTARTED: Faustini Crater PSR Rim! Drive down into the dark cold trap crater!', 'info', 7000);
  }

  _startStage1() {
    this.missionStage = 'STAGE1_ICE_TRAVERSE';

    this.waypointSystem.setWaypoint({
      id: 'faustini_ice_mine',
      name: 'Faustini Hydrogen Deposit (LCROSS 5.5 wt% Water Ice)',
      position: this.waypointPos,
      isWaypoint: true,
      color: 0xb844ff,
      colorName: 'PURPLE',
      bullets: [
        'Traverse frozen regolith plain in the dark crater floor',
        'LEND neutron count indicates deep permafrost 1.2m subsurface',
        'Position mining rig directly above the ice vein'
      ],
      funFact: 'Fact: LCROSS discovered water ice, methane, ammonia, and silver vapor when it impacted a lunar south pole crater!',
      onComplete: () => {
        this._startStage2();
      }
    });
  }

  _startStage2() {
    this.missionStage = 'STAGE2_DRILL_DEPLOY';
    this.waypointSystem.setWaypoint({
      id: 'faustini_drill_rig',
      name: 'ACTIVATE INDUSTRIAL CRYO-DRILL [E]',
      position: this.drillPos,
      color: 0x00ff88,
      colorName: 'EMERALD GREEN',
      bullets: [
        'Dismount rover and approach the carbide auger rig',
        'Press [E] to drill through hard permafrost ice',
        'Melt frozen ice into pure drinking water & rocket fuel'
      ],
      funFact: 'Fact: In super cold shadows (-233°C), water ice is as hard as granite!'
    });
    this.engine.audio.playScannerBeep();
    this.engine.showNotification('🔬 VEIN REACHED: Approach the Green Beacon! Press [E] to activate carbide auger & melt ice!', 'info', 7500);
  }

  deployDrillRig() {
    if (this.drillDeployed) return;
    this.drillDeployed = true;
    this.drillActive = true;

    this.engine.audio.playThrusterRumble();
    this.engine.audio.playSuccess();
    this.steamMat.opacity = 0.85; // steam rises

    // Dynamic State Change: Swap 3D Frozen Ice Mound to Melted Liquid Water Pool!
    if (this.frozenIceMound) this.frozenIceMound.visible = false;
    if (this.meltedWaterPool) this.meltedWaterPool.visible = true;
    if (this.levelMat) this.levelMat.color.setHex(0x00ff88);

    // Record physical mission sample
    this.engine.save.recordMissionSample('moon_m4', { type: 'LCROSS CRYO ICE', name: 'Faustini Permanently Shadowed Permafrost Core' });

    this.engine.showNotification('💧 ICE MELTED & CONDENSED: Pure water now pooling under the sublimation canopy!', 'success', 6000);

    // Present Resource Refining Dilemma after 3 seconds of drilling
    setTimeout(() => {
      if (this.engine.tradeoff) {
        this.engine.tradeoff.presentDecision({
          id: 'faustini_refining_tradeoff',
          title: '💧 Extracted Moon Water: Rocket Fuel or Drinking Water?',
          contextBadge: '💧 250 KG FRESH MOON WATER',
          scenario: 'Your heated drill successfully melted 250 kg of pure Moon ice into liquid water! Water is like gold on the Moon. How should we use it?',
          scientificBasis: 'Water can be purified for drinking and clean air, or split into hydrogen and oxygen to make rocket fuel for spacecraft!',
          choices: [
            {
              title: 'Turn into Rocket Fuel (Powers Return Flight)',
              description: 'Convert the water into liquid rocket propellant so our spacecraft has extra fuel to fly home to Earth!',
              icon: '🚀',
              style: 'aggressive',
              impacts: [
                { label: '+500 kg Rocket Propellant', type: 'reward' },
                { label: '+25% Return Flight Fuel', type: 'reward' },
                { label: '-15% Drinking Water', type: 'cost' }
              ],
              applyResources: { water: -15, oxygen: 20 },
              sciencePoints: 850,
              outcome: 'Rocket fuel tanks pressurized! Spacecraft now has surplus fuel for the return flight home.',
              onSelected: () => {
                this._spawnExtractionWaypoint();
              }
            },
            {
              title: 'Purify for Drinking & Clean Air (+40% Water)',
              description: 'Send all the water into the base drinking filters and greenhouse farm so the crew has plenty of fresh water!',
              icon: '💧',
              style: 'safe',
              impacts: [
                { label: '+40% Water Reserves', type: 'reward' },
                { label: '+30% Fresh Breathing Air', type: 'reward' },
                { label: 'Standard Fuel Only', type: 'warning' }
              ],
              applyResources: { water: 40, oxygen: 30, food: 15 },
              sciencePoints: 750,
              outcome: 'Base life support fully replenished! Crew has over 6 months of fresh drinking water.',
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
    }, 3200);
  }

  _spawnExtractionWaypoint() {
    this.missionStage = 'STAGE3_RETURN_TO_LANDER';
    this.engine.showNotification('🚀 WATER ALLOCATED: Return to the Artemis Lander airlock to complete the expedition!', 'success', 8000);

    const landerPos = this.lander ? this.lander.group.position.clone() : new THREE.Vector3(-18, this._getTerrainHeight(-18, -12), -12);
    this.waypointSystem.setWaypoint({
      id: 'lander_extraction',
      name: 'ARTEMIS SPACECRAFT AIRLOCK (EXTRACTION)',
      position: landerPos,
      triggerRadius: 10.0,
      color: 0x00ff88,
      colorName: 'EMERALD GREEN',
      bullets: [
        'Drive rover back to the expedition lander',
        'Lunar water purified and safely hooked to life support systems',
        'Board the spacecraft [E] to finalize the mission'
      ],
      funFact: 'Fact: Extracting 1 kg of lunar water saves over $10,000 compared to launching water from Earth!',
      onComplete: () => {
        this._completeMissionSuccess();
      }
    });
  }

  _completeMissionSuccess() {
    if (this.missionStage === 'MISSION_COMPLETE') return;
    this.missionStage = 'MISSION_COMPLETE';
    this.drillActive = false;

    // 1. Immediately disable player movement
    if (this.character) this.character.setControlEnabled(false);
    if (this.rover) this.rover.setControlEnabled(false);

    this.engine.audio.playSuccess();
    this.engine.scoring.add(2200, 'Faustini Cryogenic Ice Mine Commissioned');
    const scoreData = this.engine.scoring.calculateFinalScore();

    // Record sample
    this.engine.save.recordMissionSample('moon_m4', { type: 'ISRU WATER CONDENSATE', name: 'Purified Liquid H2O Canister' });

    // 2. Standardized sequential mission unlock in SaveManager (unlocks Moon M5)
    this.engine.save.completeMission('moon_m4');

    // 3. Visual feedback with live life-support resources
    this.engine.showMissionCompletedModal({
      title: 'MISSION 4: DEEP COLD ICE MINE ACCOMPLISHED',
      subtitle: 'Faustini Crater Ice Extraction',
      points: 2200,
      resources: scoreData.resources,
      praise: 'Outstanding work, Commander Alex Morgan! You braved -233°C temperatures, drilled deep into the permafrost, melted pure lunar ice, and made life-saving resource trade-offs!',
      onSelectNext: () => {
        this.engine.setState('DESTINATION');
        this.engine.showPanel('moon-mission-modal');
      }
    });
  }

  update(dt) {
    const input = this.engine.input;

    // 1. Rover mount / dismount
    if (input.isActionPressed('roverToggle')) {
      const dist = this.character.getPosition().distanceTo(this.rover.position);
      if (this.mode === 'walk') {
        if (dist < 5.2 && !this.lander.isOccupied) {
          this.mode = 'rover';
          this.character.setVisible(false);
          this.rover.activate();
          this.camera = this.rover.getCamera();
        } else if (this.lander.isOccupied) {
          this.engine.showNotification('Exit the spacecraft cabin first before mounting the rover!', 'warning');
        } else {
          this.engine.showNotification(`Approach the rover to mount! (${dist.toFixed(1)}m away)`, 'warning');
        }
      } else {
        this.mode = 'walk';
        this.rover.deactivate();
        this.character.position.copy(this.rover.position).add(new THREE.Vector3(2.5, 0, 0));
        this.character.setVisible(true);
        this.camera = this.character.getCamera();
      }
    }

    // 2. Update Controllers
    if (this.mode === 'walk') {
      this.character.update(dt);
      this.rover.update(dt);
    } else {
      this.rover.update(dt);
      this.character.position.copy(this.rover.position);
    }

    const playerPos = this.mode === 'walk' ? this.character.getPosition() : this.rover.getPosition();

    // 3. Update Waypoint System
    this.waypointSystem.update(dt, playerPos, this.character);

    // 4. Update Lander
    this.lander.update(dt, playerPos);

    // 5. Drill Rig Animation
    if (this.drillActive) {
      if (this.augerBit) this.augerBit.rotation.y += 12.0 * dt;
      if (this.domeMat) {
        this.domeMat.opacity = 0.45 + Math.sin(Date.now() * 0.005) * 0.15;
      }

      // Steam particle rise
      const posAttr = this.steamParticles.geometry.attributes.position;
      for (let i = 0; i < this.steamVelocities.length; i++) {
        let y = posAttr.getY(i) + this.steamVelocities[i] * dt;
        if (y > 4.5) y = 0.2;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    }

    // 6. Interactive Prompts
    if (this.missionStage === 'STAGE2_DRILL_DEPLOY' && !this.drillDeployed) {
      const distToDrill = Math.hypot(playerPos.x - this.drillPos.x, playerPos.z - this.drillPos.z);
      if (distToDrill < 10.0) {
        if (this.mode === 'rover') {
          this.engine.hud.showInteractionPrompt('ACTIVATE CRYO-AUGER & EXTRACT LUNAR ICE [E]', 'E');
          if (input.isActionPressed('interact')) {
            this.deployDrillRig();
          }
        } else {
          this.engine.hud.showInteractionPrompt('🚜 ROVER REQUIRED: MUST DRIVE ROVER TO DRILL RIG', 'R');
        }
      } else {
        this.engine.hud.hideInteractionPrompt();
      }
    } else {
      // General lander interaction & Stage 3 Extraction
      const landerPos = this.lander ? this.lander.group.position : new THREE.Vector3(-18, 0, -12);
      const distToLander = Math.hypot(playerPos.x - landerPos.x, playerPos.z - landerPos.z);
      if (this.missionStage === 'STAGE3_RETURN_TO_LANDER') {
        if (distToLander < 10.0) {
          this.engine.hud.showInteractionPrompt('BOARD ARTEMIS SPACECRAFT / SECURE LUNAR ICE [E]', 'E');
          if (input.isActionPressed('interact') || distToLander < 4.5) {
            this._completeMissionSuccess();
            return;
          }
        } else {
          // Traveling the distance back across the crater!
          this.engine.hud.showInteractionPrompt(`🚜 DRIVE ROVER BACK TO ARTEMIS LANDER (${Math.round(distToLander)}m ahead)`, '');
          // Must travel the distance! No premature completion!
        }
      } else if (distToLander < 6.0 && this.mode === 'walk') {
        if (!this.lander.isOccupied) {
          this.engine.hud.showInteractionPrompt('ENTER ARTEMIS LANDER CABIN', 'E');
          if (input.isActionPressed('interact')) {
            this.lander.startBoarding(this.character, () => {
              this.engine.showNotification('Inside Artemis Lander Cabin. Cryo-shielding: 100%.', 'info');
            });
          }
        }
      } else if (this.lander.isOccupied) {
        this.engine.hud.showInteractionPrompt('EXIT ARTEMIS LANDER TO SURFACE', 'E');
        if (input.isActionPressed('interact')) {
          this.lander.startEgress(this.character, () => {
            this.character.setVisible(true);
          });
        }
      } else {
        this.engine.hud.hideInteractionPrompt();
      }
    }

    // 7. Tactical Mini-Radar Telemetry
    const playerHeading = this.mode === 'walk' ? this.character.getHeading() : this.rover.getHeading();
    const isStage3 = this.missionStage === 'STAGE3_RETURN_TO_LANDER';
    const landerPos = this.lander ? this.lander.group.position : new THREE.Vector3(-18, 0, -12);

    this.engine.hud.updateNavigation({
      playerPos,
      playerHeading,
      basePos: { x: -18, z: -12 },
      baseName: 'Faustini Cryo Base',
      targets: [
        {
          id: isStage3 ? 'lander_extraction' : 'cryo_lander',
          name: isStage3 ? 'Artemis Lander Extraction' : 'Artemis Lander Bunker',
          type: isStage3 ? 'EXTRACTION AIRLOCK' : 'PRESSURIZED SHELTER',
          pos: landerPos,
          completed: this.lander.isOccupied,
          color: isStage3 ? 0x00ff88 : 0x00e5ff
        },
        {
          id: 'faustini_ice_mine',
          name: 'Faustini Cryo Ice Deposit (LCROSS 5.5 wt% H2O)',
          type: 'ISRU MINE',
          pos: this.drillPos,
          completed: this.drillDeployed,
          isWaypoint: !isStage3,
          isPurple: !isStage3
        }
      ],
      activeTarget: isStage3 ? {
        id: 'lander_extraction',
        name: 'Artemis Lander Extraction',
        pos: landerPos,
        completed: false,
        isWaypoint: true,
        color: 0x00ff88
      } : {
        id: 'faustini_ice_mine',
        name: this.drillDeployed ? 'Activate Cryo-Auger' : 'Faustini Hydrogen Deposit',
        pos: this.drillPos,
        completed: this.drillDeployed,
        isWaypoint: true,
        isPurple: true
      },
      terrainSize: 240,
      sectorName: 'FAUSTINI CRATER FLOOR (87.3°S, 77.0°E)',
      zoomLevel: 1.0
    });
  }

  onExit() {
    if (this.frostOverlay) this.frostOverlay.style.display = 'none';
    this.engine.hud.hideInteractionPrompt();
  }
}
