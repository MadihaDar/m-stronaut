/* ============================================================
   FRONTIER: MISSION ACADEMY — Moon Campaign: Mission 01
   FIRST LIGHT: THE SOUTH POLE OUTPOST (85°S to 90°S)
   Multi-Stage Hands-on Gameplay:
   Stage 1: Mount Lunar Rover & Traverse LOLA Ridge to High Solar Peak (+15m)
   Stage 2: Physical Hardware Deployment (Parabolic Solar Reflector Dish)
   Stage 3: Video Challenge Space Weather Crisis (NASA DONKI M1.6 Solar Flare
            & 520 km/s CME Proton Storm — 70s Race to Lander Storm Bunker)
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../systems/CharacterController.js';
import { RoverController } from '../systems/RoverController.js';
import { SpaceshipLander } from '../systems/SpaceshipLander.js';
import { WaypointSystem } from '../systems/WaypointSystem.js';
import { MOON_DATA, calculateLolaElevation, calculateSlopeDegrees } from '../data/lunar/LunarCampaignData.js';

export class MoonSouthPoleScene extends BaseScene {
  constructor(engine) {
    super(engine);

    // Multi-Stage Mission State:
    // 'STAGE1_ROVER_ASCENT' | 'STAGE2_DEPLOY_REFLECTOR' | 'STAGE3_STORM_ESCAPE' | 'STAGE3_IN_BUNKER' | 'MISSION_COMPLETE'
    this.missionStage = 'STAGE1_ROVER_ASCENT';
    this.mode = 'walk';
    this.reflectorDeployed = false;
    this.stormTimer = 40; // 40 seconds space weather storm countdown
    this.stormActive = false;

    // Shackleton crater topography with prominent LOLA Solar Reflector peak at (48, -55)
    this._getTerrainHeight = (x, z) => {
      const distFromCrater = Math.hypot(x - 30, z - 35);
      const craterBowl = distFromCrater < 45 ? -Math.cos((distFromCrater / 45) * Math.PI * 0.5) * 8.5 : 0;
      const ridge = Math.sin(x * 0.035) * 4.0 - Math.cos(z * 0.03) * 3.5;
      const distToPeak = Math.hypot(x - 48, z - (-55));
      const peakHill = distToPeak < 38 ? Math.cos((distToPeak / 38) * Math.PI * 0.5) * 15.0 : 0;
      return craterBowl + ridge + peakHill;
    };

    this._buildEnvironment();
    this._buildSouthPoleOutpost();
    this._buildSolarReflectorPeak();
    this._buildRidgePathPinkMarkers();

    // 1. Artemis Exploration Lander (Base Camp Bunker)
    this.lander = new SpaceshipLander(this.scene, this.engine, new THREE.Vector3(-22, 0, -18), this._getTerrainHeight);

    // 3D Visible Energy Shield Dome over Bunker
    const domeGeo = new THREE.SphereGeometry(14, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.bunkerShieldDome = new THREE.Mesh(domeGeo, domeMat);
    this.bunkerShieldDome.position.set(-22, this._getTerrainHeight(-22, -18), -18);
    this.bunkerShieldDome.visible = false;
    this.scene.add(this.bunkerShieldDome);

    // 2. Guided Purple Aura Waypoint System (accessible approach area on ridge)
    this.waypointPos = new THREE.Vector3(44, this._getTerrainHeight(44, -50), -50);
    this.waypointSystem = new WaypointSystem(this.scene, this.engine, this._getTerrainHeight);

    // 3. Controllers
    this.character = new CharacterController(this.scene, this.engine, this._getTerrainHeight);
    this.character.setGravity(3.2, true); // Lunar 1/6 g with Apollo bounding hop
    this.lander.characterRef = this.character;

    // Rigid body colliders
    const outpostCol = { type: 'cylinder', pos: { x: 0, z: 0 }, radius: 4.8 };
    const peakCol = { type: 'cylinder', pos: { x: 48, z: -55 }, radius: 3.5 };
    this.character.setColliders([...this.lander.getColliders(), outpostCol, peakCol]);

    // 4. Lunar Rover parked near lander
    this.rover = new RoverController(this.scene, this.engine, new THREE.Vector3(-14, 0, -10), this._getTerrainHeight);
    this.rover.setColliders([...this.lander.getColliders(), outpostCol, peakCol]);

    this.camera = this.character.getCamera();

    this._initStormUI();
  }

  _buildEnvironment() {
    this.ambientLight = new THREE.AmbientLight(0x060812, 0.4);
    this.scene.add(this.ambientLight);

    // Extreme low-angle grazing sun typical of 89.9°S South Pole
    this.sun = new THREE.DirectionalLight(0xfff5eb, 3.2);
    this.sun.position.set(220, 10, -180);
    this.sun.castShadow = true;
    this.scene.add(this.sun);

    // Distant Earth hanging low on polar horizon
    const earthGeo = new THREE.SphereGeometry(3.0, 32, 32);
    const earthMat = new THREE.MeshBasicMaterial({ color: 0x3388ff });
    this.earth = new THREE.Mesh(earthGeo, earthMat);
    this.earth.position.set(-160, 22, -180);
    this.scene.add(this.earth);

    // High-contrast South Polar Regolith Terrain
    const size = 320;
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
      color: 0x828489,
      roughness: 0.92,
      metalness: 0.08,
      flatShading: true
    });
    this.terrain = new THREE.Mesh(geometry, terrainMat);
    this.scene.add(this.terrain);

    // Starfield
    const starCount = 4500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 800;
      starPos[i + 1] = 10 + Math.random() * 400;
      starPos[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 1.0, color: 0xeeeeff })));
  }

  _buildSouthPoleOutpost() {
    this.outpost = new THREE.Group();

    // Habitat dome
    const habGeo = new THREE.CylinderGeometry(4.5, 4.5, 5.0, 16);
    const habMat = new THREE.MeshStandardMaterial({ color: 0xf5f7fb, roughness: 0.25, metalness: 0.5 });
    const hab = new THREE.Mesh(habGeo, habMat);
    hab.position.set(0, 2.5, 0);
    this.outpost.add(hab);

    // Solar panels on base roof
    const solarGeo = new THREE.BoxGeometry(4.0, 0.1, 2.5);
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x1a3366, metalness: 0.8, roughness: 0.2 });
    this.baseSolarPanels = new THREE.Mesh(solarGeo, solarMat);
    this.baseSolarPanels.position.set(0, 5.1, 0);
    this.outpost.add(this.baseSolarPanels);

    // Habitat floodlight
    const light = new THREE.PointLight(0xaaccff, 1.8, 25);
    light.position.set(0, 5.5, 3.0);
    this.outpost.add(light);

    // Interactive Outpost Power & ECLSS Console Kiosk
    this.powerKioskPos = new THREE.Vector3(5.5, 0, 2.5);
    const kioskGroup = new THREE.Group();
    kioskGroup.position.copy(this.powerKioskPos);

    const kioskBaseGeo = new THREE.CylinderGeometry(0.45, 0.65, 1.2, 8);
    const kioskBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const kioskBase = new THREE.Mesh(kioskBaseGeo, kioskBaseMat);
    kioskBase.position.y = 0.6;
    kioskGroup.add(kioskBase);

    // Glowing holographic console screen
    const screenGeo = new THREE.PlaneGeometry(0.85, 0.55);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 1.35, 0);
    screen.rotation.x = -0.35;
    kioskGroup.add(screen);

    // Cyan glowing pointlight
    const kioskLight = new THREE.PointLight(0x00e5ff, 1.6, 9);
    kioskLight.position.set(0, 1.8, 0);
    kioskGroup.add(kioskLight);

    this.outpost.add(kioskGroup);

    const groundY = this._getTerrainHeight(0, 0);
    this.outpost.position.y = groundY;
    this.scene.add(this.outpost);
  }

  _buildSolarReflectorPeak() {
    this.peakPos = new THREE.Vector3(44, this._getTerrainHeight(44, -50), -50);
    this.reflectorGroup = new THREE.Group();
    this.reflectorGroup.position.copy(this.peakPos);

    // Tripod foundation mount
    const mountGeo = new THREE.CylinderGeometry(0.8, 1.2, 1.2, 8);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.7 });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.y = 0.6;
    this.reflectorGroup.add(mount);

    // 3D Parabolic Golden Solar Mirror Dish
    const dishGeo = new THREE.SphereGeometry(2.8, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
    this.dishMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.08,
      side: THREE.DoubleSide
    });
    this.reflectorDish = new THREE.Mesh(dishGeo, this.dishMat);
    this.reflectorDish.position.set(0, 2.4, 0);
    this.reflectorDish.rotation.x = Math.PI * 0.65;
    this.reflectorDish.rotation.y = -Math.PI * 0.35;
    this.reflectorDish.scale.set(0.15, 0.15, 0.15); // Starts folded
    this.reflectorGroup.add(this.reflectorDish);

    // Reflected Golden Beam (Shoots down from peak to habitat)
    const beamGeo = new THREE.CylinderGeometry(0.4, 3.2, 75, 16);
    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    this.beam = new THREE.Mesh(beamGeo, this.beamMat);
    this.beam.position.set(-24, -6, 28);
    this.beam.rotation.z = Math.PI * 0.42;
    this.beam.rotation.y = -Math.PI * 0.15;
    this.reflectorGroup.add(this.beam);

    this.scene.add(this.reflectorGroup);
  }

  _buildRidgePathPinkMarkers() {
    this.pinkRidgeMarkers = new THREE.Group();
    this.pinkMarkerLeds = [];
    this.pinkMarkerRings = [];

    // Navigational ridge guide positions leading from lander (-16, -10) to Solar Peak (44, -50)
    const ridgeWaypoints = [
      { x: -6, z: -18 },
      { x: 6, z: -26 },
      { x: 18, z: -34 },
      { x: 30, z: -42 },
      { x: 40, z: -47 }
    ];

    ridgeWaypoints.forEach((pt) => {
      const y = this._getTerrainHeight(pt.x, pt.z);
      const markerGroup = new THREE.Group();
      markerGroup.position.set(pt.x, y, pt.z);

      // 1. Titanium survey mast
      const mastGeo = new THREE.CylinderGeometry(0.16, 0.24, 2.6, 12);
      const mastMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.25
      });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = 1.3;
      markerGroup.add(mast);

      // 2. High-power neon pink LED beacon head
      const ledGeo = new THREE.SphereGeometry(0.38, 16, 16);
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xff00ff,
        emissiveIntensity: 3.2,
        roughness: 0.15,
        metalness: 0.4
      });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.y = 2.6;
      markerGroup.add(led);
      this.pinkMarkerLeds.push(ledMat);

      // 3. Glowing neon pink ground highlight ring & disc on lunar regolith
      const groundDiscGeo = new THREE.CircleGeometry(2.4, 24);
      const groundDiscMat = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const groundDisc = new THREE.Mesh(groundDiscGeo, groundDiscMat);
      groundDisc.rotation.x = -Math.PI / 2;
      groundDisc.position.y = 0.08;
      markerGroup.add(groundDisc);

      const groundRingGeo = new THREE.RingGeometry(2.2, 2.6, 24);
      const groundRingMat = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const groundRing = new THREE.Mesh(groundRingGeo, groundRingMat);
      groundRing.rotation.x = -Math.PI / 2;
      groundRing.position.y = 0.12;
      markerGroup.add(groundRing);
      this.pinkMarkerRings.push(groundRing);

      // 4. Downward pink point light illuminating the regolith
      const pinkLight = new THREE.PointLight(0xff00ff, 2.2, 10);
      pinkLight.position.set(0, 2.4, 0);
      markerGroup.add(pinkLight);

      this.pinkRidgeMarkers.add(markerGroup);
    });

    this.scene.add(this.pinkRidgeMarkers);
  }

  _initStormUI() {
    let stormEl = document.getElementById('storm-countdown-hud');
    if (!stormEl) {
      stormEl = document.createElement('div');
      stormEl.id = 'storm-countdown-hud';
      stormEl.className = 'storm-countdown-hud';
      stormEl.style.display = 'none';
      stormEl.innerHTML = `
        <span class="storm-hud-icon">⚠️</span>
        <div class="storm-hud-text">
          <span class="storm-hud-title">DONKI M1.6 SOLAR PROTON STORM IMPACT:</span>
          <span id="storm-timer-digits" class="storm-hud-timer">01:10</span>
        </div>
      `;
      document.body.appendChild(stormEl);
    }
    this.stormHUD = stormEl;
    this.stormTimerDigits = document.getElementById('storm-timer-digits');
  }

  onEnter() {
    this.engine.showPanel('hud');
    this.engine.hud.setLocation('MOON: SHACKLETON CRATER (SOUTH POLE)');
    if (this.engine.resources) {
      this.engine.resources.initMissionLevels();
    }

    if (this.stormHUD) this.stormHUD.style.display = 'none';

    // Mission Intro Dialogue for 7-12 year olds
    setTimeout(() => {
      if (this.engine.dialogue) {
        this.engine.dialogue.play('moon_m1_intro');
      }
    }, 450);

    // Restore saved Moon South Pole progress if exists
    const saved = this.engine.save.get('progress.moonM1');
    if (saved && saved.missionStage && saved.missionStage !== 'STAGE1_ROVER_ASCENT' && saved.missionStage !== 'MISSION_COMPLETE') {
      this.missionStage = saved.missionStage;
      this.reflectorDeployed = !!saved.reflectorDeployed;
      if (this.reflectorDish) this.reflectorDish.visible = this.reflectorDeployed;

      if (saved.missionStage === 'STAGE2_DEPLOY_REFLECTOR') {
        this.character.position.set(this.peakPos.x - 2, this._getTerrainHeight(this.peakPos.x - 2, this.peakPos.z), this.peakPos.z);
        this._startStage2();
        this.engine.showNotification('🌕 WELCOME BACK: Resuming at LOLA Solar Peak! Press [E] to deploy reflector!', 'info', 7000);
      } else if (saved.missionStage === 'STAGE3_STORM_ESCAPE' || saved.missionStage === 'STAGE3_IN_BUNKER') {
        this._startStage3StormCrisis();
        this.engine.showNotification('⚠️ WELCOME BACK: Solar Storm in progress! Evacuate to the Artemis bunker [E]!', 'warning', 7000);
      }
    } else {
      // Start outside positioned clear of the lander hatch, right in front of the Lunar Rover
      this.missionStage = 'STAGE1_ROVER_ASCENT';
      this.reflectorDeployed = false;
      if (this.reflectorDish) this.reflectorDish.visible = false;
      this.character.position.set(-16, this._getTerrainHeight(-16, -10), -10);
      this.character.heading = Math.PI * 0.25;
      this.character.setVisible(true);
      this.lander.isOccupied = false;

      this.engine.showNotification('🌕 TOUCHDOWN: Shackleton Crater Rim! Mount the Rover [R] and follow the glowing PINK BEACON & ridge trail up to the Solar Peak!', 'info', 8500);

      // Stage 1: Guide player up the ridge to the LOLA Solar Peak
      this._startStage1();
    }
  }

  restartMission() {
    if (this.engine && this.engine.save) {
      this.engine.save.set('progress.moonM1', null);
    }
    this.missionStage = 'STAGE1_ROVER_ASCENT';
    this.reflectorDeployed = false;
    if (this.reflectorDish) this.reflectorDish.visible = false;
    this.mode = 'walk';
    this.character.position.set(-16, this._getTerrainHeight(-16, -10), -10);
    this.character.heading = Math.PI * 0.25;
    this.character.setVisible(true);
    this.character.setControlEnabled(true);
    if (this.rover) {
      this.rover.position.set(-14, this._getTerrainHeight(-14, -8), -8);
      this.rover.heading = Math.PI * 0.25;
      this.rover.isOccupied = false;
      this.rover.setControlEnabled(true);
      this.rover.speed = 0;
    }
    if (this.lander) {
      this.lander.isOccupied = false;
      this.lander.interiorActive = false;
    }
    if (this.stormHUD) this.stormHUD.style.display = 'none';
    if (this._stormInterval) {
      clearInterval(this._stormInterval);
      this._stormInterval = null;
    }
    this._startStage1();
    this.engine.showNotification('🌕 MISSION RESTARTED: Shackleton Crater Rim! Mount the Rover [R] to reach the Solar Peak!', 'info', 7000);
  }

  _startStage1() {
    this.missionStage = 'STAGE1_ROVER_ASCENT';

    this.waypointSystem.setWaypoint({
      id: 'solar_peak',
      name: 'LOLA Solar Peak (+15m Elevation)',
      billboardText: '🎯 PINK TARGET: LOLA SOLAR PEAK',
      position: this.waypointPos,
      isWaypoint: true,
      color: 0xff00ff,
      colorName: 'PINK',
      bullets: [
        'Drive Lunar Rover along gentle ridge slope (4–7°)',
        'LOLA Spot 1 verifies +15m elevation bathed in 92% continuous sunlight',
        'Deploy Parabolic Solar Reflector to restore base power'
      ],
      funFact: 'Fact: Peak ridges at the Lunar South Pole receive near-permanent sunlight, ideal for solar reflectors!',
      onComplete: () => {
        this._startStage2();
      }
    });
  }

  _startStage2() {
    this.missionStage = 'STAGE2_DEPLOY_REFLECTOR';
    this.waypointSystem.setWaypoint({
      id: 'reflector_mount',
      name: 'DEPLOY SOLAR REFLECTOR DISH [E]',
      position: this.waypointPos,
      color: 0x00ff88,
      colorName: 'EMERALD GREEN',
      bullets: [
        'Dismount rover and approach the peak mounting station',
        'Press [E] to unfold the gold-coated parabolic reflector',
        'Aim focused 50 kW sunlight beam down to Shackleton Base'
      ],
      funFact: 'Fact: Gold mirrors reflect 99% of infrared thermal energy in space!'
    });
    this.engine.audio.playScannerBeep();
    this.engine.showNotification('⛰️ PEAK REACHED: Head to the Green Beacon! Press [E] to deploy the Parabolic Solar Reflector!', 'info', 7500);
  }

  deploySolarReflector() {
    if (this.reflectorDeployed) return;
    this.reflectorDeployed = true;

    // Record physical mission sample
    this.engine.save.recordMissionSample('moon_m1', { type: 'SOLAR REFLECTOR CORE', name: 'Shackleton Peak LOLA Regolith' });

    this.engine.audio.playThrusterRumble();
    this.engine.audio.playTone(720, 0.25, 'triangle', 0.35);

    // Animate dish unfolding
    let s = 0.15;
    const unfoldInterval = setInterval(() => {
      s += 0.05;
      this.reflectorDish.scale.set(s, s, s);
      if (s >= 1.0) {
        clearInterval(unfoldInterval);
        this.reflectorDish.scale.set(1.0, 1.0, 1.0);
        this.beamMat.opacity = 0.85; // Beam shines down to base
      }
    }, 40);

    // Restore base power
    this.engine.resources.modify('power', 35, 'Solar Reflector Deployed');
    this.engine.scoring.add(1200, 'Solar Reflector Deployed');
    this.engine.showNotification('☀️ REFLECTOR DEPLOYED: Focused 50 kW solar beam directed to outpost arrays! Power +35%!', 'success', 6000);

    // Present Interactive NASA Solar Beam Distribution Dilemma
    setTimeout(() => {
      this._presentSolarBeamTradeoff();
    }, 2200);
  }

  _presentSolarBeamTradeoff() {
    if (!this.engine.tradeoff) {
      this._triggerSpaceWeatherCrisis();
      return;
    }

    this.engine.tradeoff.presentDecision({
      id: 'south_pole_solar_tradeoff',
      title: '☀️ Solar Power Choice: Where Does Sunlight Go?',
      contextBadge: '☀️ SHACKLETON CRATER • SUNSHINE POWER',
      scenario: 'Our giant solar mirror is catching lots of warm sunlight and sending electricity to our Moon base! Every space mission has to choose what to power first. What should we do?',
      scientificBasis: 'NASA astronauts must choose where to send their electricity: making fresh breathing air, growing food, or powering shields.',
      choices: [
        {
          title: 'Super Clean Air & Warm Heaters (+45% Oxygen)',
          description: 'Pump extra fresh breathing air and keep heaters cozy warm! Fills oxygen tanks and heals astronaut health.',
          icon: '🫁',
          style: 'balanced',
          impacts: [
            { label: '+25% Fresh Oxygen', type: 'reward' },
            { label: '+10% Astronaut Health', type: 'reward' },
            { label: '-8% Battery Power', type: 'cost' }
          ],
          applyResources: { oxygen: 25, crewCondition: 10, power: -8 },
          sciencePoints: 600,
          outcome: 'Fresh clean air floods the base habitat! The crew breathes easy and feels warm.',
          onSelected: () => {
            if (this.engine.tradeoff) this.engine.tradeoff.setPowerMode('OXYGEN_PRIORITY');
            setTimeout(() => this._triggerSpaceWeatherCrisis(), 3800);
          }
        },
        {
          title: 'Space Farm & Fast Rover Charger (+40% Food)',
          description: 'Shine bright grow lights on tasty space crops and quick-charge the rover battery for driving!',
          icon: '🌱',
          style: 'safe',
          impacts: [
            { label: '+25% Fresh Food', type: 'reward' },
            { label: '+30% Rover Battery Charged', type: 'reward' },
            { label: '+8% Energy Stored', type: 'reward' }
          ],
          applyResources: { food: 25, roverEnergy: 30, power: 8 },
          sciencePoints: 600,
          outcome: 'Greenhouse lights shine bright! Fresh snacks are ready and your rover is fully charged.',
          onSelected: () => {
            if (this.engine.tradeoff) this.engine.tradeoff.setPowerMode('GROWTH_PRIORITY');
            setTimeout(() => this._triggerSpaceWeatherCrisis(), 3800);
          }
        },
        {
          title: 'Magnetic Force Field Shield (Blocks Radiation)',
          description: 'Turn on a giant magnetic shield dome around the base to deflect solar storm radiation!',
          icon: '🛡️',
          style: 'warning',
          impacts: [
            { label: '99% Radiation Deflection', type: 'reward' },
            { label: '-10% Battery Drain', type: 'cost' },
            { label: 'Shield Active', type: 'reward' }
          ],
          applyResources: { power: -10, crewCondition: 10 },
          sciencePoints: 800,
          outcome: 'Force field engaged! An invisible magnetic bubble deflects space radiation away from the base.',
          onSelected: () => {
            if (this.engine.tradeoff) this.engine.tradeoff.setPowerMode('SHIELD_PRIORITY');
            setTimeout(() => this._triggerSpaceWeatherCrisis(), 3800);
          }
        }
      ]
    });
  }

  _triggerSpaceWeatherCrisis() {
    this.missionStage = 'STAGE3_STORM_ESCAPE';
    this.stormActive = true;
    this.stormTimer = 40;

    // Siren alarm
    this.engine.audio.playEmergencySiren();

    if (this.stormHUD) this.stormHUD.style.display = 'flex';

    // Spike dosimeter
    if (this.engine.radiation) {
      this.engine.radiation.currentRate = 85.0; // High radiation spike
    }

    this.engine.showNotification('🚨 NASA DONKI SPACE WEATHER ALERT: M1.6 Solar Flare & 520 km/s CME Proton Storm incoming in 40s! Race rover back to Lander Bunker!', 'danger', 10000);

    // Lock waypoint onto Artemis Lander Bunker
    const bunkerPos = new THREE.Vector3(-22, this._getTerrainHeight(-22, -18), -18);
    this.waypointSystem.setWaypoint({
      id: 'lander_bunker',
      name: 'ARTEMIS LANDER RADIATION STORM BUNKER',
      position: bunkerPos,
      color: 0x00e5ff,
      colorName: 'CYAN BLUE',
      bullets: [
        'Race rover at top speed back down the ridge!',
        'Spacecraft storm bunker attenuates 98% of ionizing protons',
        'Enter airlock [E] before the 40s timer expires to survive'
      ],
      funFact: 'Fact: Coronal Mass Ejection protons travel at relativistic speeds—immediate shelter is mandatory!',
      onComplete: () => {
        // Player arrived near bunker
      }
    });
  }

  _sealStormBunker() {
    this.missionStage = 'STAGE3_IN_BUNKER';
    this.lander.isOccupied = true;
    this.lander.interiorActive = true;
    this.character.setVisible(false);
    if (this.bunkerShieldDome) this.bunkerShieldDome.visible = true;

    this.engine.audio.playAirlockHiss();
    this.engine.audio.playTone(440, 0.2, 'sine', 0.3);

    // Shielding protects crew
    if (this.engine.radiation) {
      this.engine.radiation.currentRate = 0.05; // 98% shielded!
    }

    this.engine.showNotification('🛡️ BUNKER SHIELD STRENGTH: 100%! Heavy hull & energy dome active. Remain inside until the storm clears!', 'success', 8000);
  }

  _completeMissionSuccess() {
    this.missionStage = 'MISSION_COMPLETE';
    this.stormActive = false;
    if (this.stormHUD) this.stormHUD.style.display = 'none';

    // 1. Immediately disable player movement
    if (this.character) this.character.setControlEnabled(false);
    if (this.rover) this.rover.setControlEnabled(false);

    this.engine.audio.playSuccess();
    this.engine.scoring.add(2000, 'DONKI Proton Storm Survived');
    const scoreData = this.engine.scoring.calculateFinalScore();

    // Record physical mission sample
    this.engine.save.recordMissionSample('moon_m1', { type: 'DONKI PROTON DATA', name: 'Solar Storm Shield Telemetry' });

    // 2. Standardized sequential mission unlock in SaveManager
    this.engine.save.completeMission('moon_m1');

    // 3. Visual feedback with live life-support resources
    this.engine.showMissionCompletedModal({
      title: 'MISSION 1: ICE WATER HUNT ACCOMPLISHED',
      subtitle: 'South Pole Shackleton Ridge Outpost',
      points: 2000,
      resources: scoreData.resources,
      praise: 'Outstanding work, Commander Alex Morgan! You drove the rover to the solar peak, deployed the parabolic reflector, made life support power trade-offs, and safely sheltered from the solar flare proton storm!'
    });
  }

  _saveProgress() {
    try {
      this.engine.save.set('progress.moonM1', {
        missionStage: this.missionStage,
        reflectorDeployed: !!this.reflectorDeployed,
        missionComplete: this.missionStage === 'MISSION_COMPLETE'
      });
    } catch (e) {
      console.warn('[MoonSouthPoleScene] Could not save progress:', e);
    }
  }

  onExit() {
    this._saveProgress();
    this.engine.hidePanel('hud');
    this.engine.hud.hideInteractionPrompt();
    if (this.stormHUD) this.stormHUD.style.display = 'none';
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

    // 2. Update Active Controller
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

    // Animate glowing pink ridge trail markers
    if (this.pinkMarkerLeds && this.pinkMarkerLeds.length > 0) {
      const time = Date.now() * 0.003;
      this.pinkMarkerLeds.forEach((mat, i) => {
        mat.emissiveIntensity = 2.4 + Math.sin(time * 3.0 + i * 0.8) * 1.4;
      });
      this.pinkMarkerRings.forEach((ring, i) => {
        const s = 1.0 + Math.sin(time * 2.5 + i * 0.8) * 0.15;
        ring.scale.set(s, s, s);
      });
    }

    // 4. Update Lander
    this.lander.update(dt, playerPos);

    // 5. Stage 2 Reflector Deployment Prompt at Peak (Rover Enforced)
    if (this.missionStage === 'STAGE2_DEPLOY_REFLECTOR' && !this.reflectorDeployed) {
      const distToReflector = playerPos.distanceTo(this.waypointPos);
      if (distToReflector < 8.5) {
        if (this.mode === 'rover') {
          this.engine.hud.showInteractionPrompt('DEPLOY PARABOLIC SOLAR REFLECTOR [E]', 'E');
          if (input.isActionPressed('interact')) {
            this.deploySolarReflector();
          }
        } else {
          this.engine.hud.showInteractionPrompt('🚜 ROVER REQUIRED: MUST DRIVE ROVER TO DEPLOY REFLECTOR', 'R');
        }
      } else {
        this.engine.hud.hideInteractionPrompt();
      }
    }

    // 5b. Outpost Power & Life Support Kiosk Interaction
    const distToKiosk = playerPos.distanceTo(new THREE.Vector3(5.5, this._getTerrainHeight(5.5, 2.5), 2.5));
    if (distToKiosk < 5.0 && this.mode === 'walk' && !this.stormActive && !this.lander.isOccupied && this.missionStage !== 'STAGE2_DEPLOY_REFLECTOR') {
      this.engine.hud.showInteractionPrompt('OPEN OUTPOST POWER & ECLSS CONSOLE', 'E');
      if (input.isActionPressed('interact')) {
        if (this.engine.tradeoff) {
          this.engine.tradeoff.togglePowerRerouteConsole();
        }
      }
    }

    // 6. Stage 3 Space Weather Countdown & Bunker Interaction
    if (this.stormActive) {
      this.stormTimer -= dt;
      const m = Math.floor(Math.max(0, this.stormTimer) / 60);
      const s = Math.floor(Math.max(0, this.stormTimer) % 60);
      if (this.stormTimerDigits) {
        this.stormTimerDigits.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }

      // If in bunker, enforce staying inside until storm timer reaches 0
      if (this.missionStage === 'STAGE3_IN_BUNKER') {
        if (!this.lander.isOccupied && this.stormTimer > 0) {
          this.engine.triggerMissionFailed({
            title: 'MISSION FAILED: EARLY BUNKER EGRESS',
            reason: 'You exited the bunker while the solar storm was raging!',
            desc: 'The CME proton flux takes time to pass. Leaving the bunker before the storm clears causes lethal radiation exposure.'
          });
          return;
        }
      }

      // If outdoors, check distance to Lander Bunker
      if (this.missionStage === 'STAGE3_STORM_ESCAPE') {
        const distToLander = playerPos.distanceTo(this.lander.group.position);
        if (distToLander < 7.0 && this.mode === 'walk') {
          this.engine.hud.showInteractionPrompt('CYCLE AIRLOCK & SEAL RADIATION STORM BUNKER', 'E');
          if (input.isActionPressed('interact')) {
            this._sealStormBunker();
          }
        } else if (distToLander < 7.0 && this.mode === 'rover') {
          this.engine.hud.showInteractionPrompt('DISMOUNT ROVER [R] & SEAL STORM BUNKER [E]', 'R');
        } else {
          this.engine.hud.hideInteractionPrompt();
        }
      }

      // Hard Fail if timer expires while outdoors
      if (this.stormTimer <= 0 && this.missionStage === 'STAGE3_STORM_ESCAPE') {
        this.engine.triggerMissionFailed({
          title: 'MISSION FAILED: PROTON STORM EXPOSURE',
          reason: 'Failed to reach the radiation bunker before the 40-second storm arrival!',
          desc: 'High-energy solar protons deliver lethal radiation doses without thick spacecraft shielding. Drive the rover quickly back to the base camp bunker!'
        });
        return;
      } else if (this.stormTimer <= 0 && this.missionStage === 'STAGE3_IN_BUNKER') {
        this._completeMissionSuccess();
      }
    }

    // 7. Tactical Radar Telemetry
    const activeWp = this.waypointSystem.getActiveWaypoint();
    const playerHeading = this.mode === 'walk' ? this.character.getHeading() : this.rover.getHeading();

    this.engine.hud.updateNavigation({
      playerPos,
      playerHeading,
      basePos: { x: 0, z: 0 },
      baseName: 'Artemis South Pole Base Camp',
      targets: [
        {
          id: 'artemis_lander',
          name: 'Artemis Lander Storm Bunker',
          type: 'PRESSURIZED SHELTER',
          pos: this.lander.getPosition(),
          completed: this.missionStage === 'STAGE3_IN_BUNKER'
        },
        {
          id: 'solar_peak',
          name: 'LOLA Solar Peak Reflector',
          type: 'SOLAR HARDWARE',
          pos: this.waypointPos,
          completed: this.reflectorDeployed,
          isWaypoint: true,
          isPurple: true
        }
      ],
      activeTarget: activeWp ? {
        id: activeWp.id,
        name: activeWp.name,
        pos: activeWp.position,
        completed: false,
        isWaypoint: true,
        isPurple: true
      } : null,
      terrainSize: 320,
      sectorName: 'SHACKLETON CRATER RIM (89.9°S)'
    });
  }
}
