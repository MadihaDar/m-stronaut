/* ============================================================
   FRONTIER: MISSION ACADEMY — Moon Campaign: Mission 02
   SHADOW WATCH: THE THERMAL FRONTIER (20°N to 30°N)
   Hands-on multi-stage mission using Diviner GCP, GHRM, GDR L3 & DONKI
   Stage 1: Rover Basalt Plain Traverse to Aristillus Thermal Ridge
   Stage 2: Deploy Laser Thermal Spectrometer & Rock Abundance Scan
   Stage 3: Video-Inspired Space Weather Crisis (DONKI CME — 65s Race to Lander Bunker)
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../systems/CharacterController.js';
import { RoverController } from '../systems/RoverController.js';
import { SpaceshipLander } from '../systems/SpaceshipLander.js';
import { WaypointSystem } from '../systems/WaypointSystem.js';
import { MOON_DATA, convertJulianDate } from '../data/lunar/LunarCampaignData.js';

export class MoonThermalScene extends BaseScene {
  constructor(engine) {
    super(engine);

    this.mode = 'walk'; // 'walk' | 'rover'
    this.missionStage = 'STAGE1_ROVER_TRAVERSE';
    this.stormActive = false;
    this.stormTimer = 40;
    this.spectrometerDeployed = false;

    // Mid-latitude terrain: basaltic mare plains with gentle swelling and Aristillus ejecta ridge
    this._getTerrainHeight = (x, z) => {
      const marePlain = Math.sin(x * 0.02) * 1.5 + Math.cos(z * 0.02) * 1.2;
      const ejectaRidge = Math.sin((x + z) * 0.04) * 2.5;
      const distToAnomaly = Math.hypot(x - 52, z - (-45));
      const anomalyHill = distToAnomaly < 35 ? Math.cos((distToAnomaly / 35) * Math.PI * 0.5) * 8.0 : 0;
      return marePlain + ejectaRidge + anomalyHill;
    };

    this._buildEnvironment();
    this._buildThermalCamp();
    this._buildThermalAnomalySite();

    // 1. Artemis Exploration Lander (Base Camp Storm Bunker)
    this.lander = new SpaceshipLander(this.scene, this.engine, new THREE.Vector3(-20, 0, -16), this._getTerrainHeight);

    // 3D Visible Energy Shield Dome over Bunker
    const domeGeo = new THREE.SphereGeometry(14, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.bunkerShieldDome = new THREE.Mesh(domeGeo, domeMat);
    this.bunkerShieldDome.position.set(-20, this._getTerrainHeight(-20, -16), -16);
    this.bunkerShieldDome.visible = false;
    this.scene.add(this.bunkerShieldDome);

    // 2. Guided Waypoint System (approach position on accessible ground in front of boulder)
    this.waypointPos = new THREE.Vector3(47, this._getTerrainHeight(47, -42), -42);
    this.waypointSystem = new WaypointSystem(this.scene, this.engine, this._getTerrainHeight);

    // 3. Controllers
    this.character = new CharacterController(this.scene, this.engine, this._getTerrainHeight);
    this.character.setGravity(3.2, true); // Lunar 1/6 g with Apollo bounding hop
    this.lander.characterRef = this.character;

    // Rigid body colliders
    const campCol = { type: 'cylinder', pos: { x: 0, z: -10 }, radius: 4.5 };
    const siteCol = { type: 'cylinder', pos: { x: 47, z: -42 }, radius: 3.5 };
    this.character.setColliders([...this.lander.getColliders(), campCol, siteCol]);

    // 4. Lunar Rover parked near lander
    this.rover = new RoverController(this.scene, this.engine, new THREE.Vector3(-11, 0, -10), this._getTerrainHeight);
    this.rover.setColliders([...this.lander.getColliders(), campCol, siteCol]);

    this.camera = this.character.getCamera();

    this._initStormUI();
  }

  _buildEnvironment() {
    this.ambientLight = new THREE.AmbientLight(0x080e18, 0.45);
    this.scene.add(this.ambientLight);

    // Sun at moderate mid-latitude grazing angle
    this.sun = new THREE.DirectionalLight(0xfff5e6, 2.6);
    this.sun.position.set(120, 45, 90);
    this.sun.castShadow = true;
    this.scene.add(this.sun);

    // Mid-latitude Mare Regolith (darker basaltic mare tone)
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
      color: 0x42464d, // Dark basaltic mare regolith
      roughness: 0.88,
      metalness: 0.12,
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
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 1.0, color: 0xddddff })));

    // Blocky Crater Ejecta Boulders (Aristillus ray material)
    const boulderGeo = new THREE.DodecahedronGeometry(1.4, 1);
    const boulderMat = new THREE.MeshStandardMaterial({ color: 0x5a5d66, roughness: 0.75 });
    for (let i = 0; i < 45; i++) {
      const b = new THREE.Mesh(boulderGeo, boulderMat);
      const bx = 30 + (Math.random() - 0.5) * 70;
      const bz = -30 + (Math.random() - 0.5) * 70;
      const by = this._getTerrainHeight(bx, bz);
      const scale = 0.6 + Math.random() * 2.2;

      b.position.set(bx, by + scale * 0.45, bz);
      b.scale.set(scale, scale * 0.85, scale);
      this.scene.add(b);
    }
  }

  _buildThermalCamp() {
    this.camp = new THREE.Group();

    // Portable Science Lab Pod
    const labGeo = new THREE.BoxGeometry(5.0, 3.2, 4.0);
    const labMat = new THREE.MeshStandardMaterial({ color: 0xdde4f0, roughness: 0.3, metalness: 0.4 });
    const lab = new THREE.Mesh(labGeo, labMat);
    lab.position.set(0, 1.6, -10);
    this.camp.add(lab);

    // Science Antenna Mast
    const mastGeo = new THREE.CylinderGeometry(0.08, 0.08, 6.0, 8);
    const mast = new THREE.Mesh(mastGeo, new THREE.MeshStandardMaterial({ color: 0x8899aa }));
    mast.position.set(4, 3, -10);
    this.camp.add(mast);

    const groundY = this._getTerrainHeight(0, -10);
    this.camp.position.y = groundY;
    this.scene.add(this.camp);
  }

  _buildThermalAnomalySite() {
    this.anomalyPos = new THREE.Vector3(47, this._getTerrainHeight(47, -42), -42);
    this.anomalyGroup = new THREE.Group();
    this.anomalyGroup.position.copy(this.anomalyPos);

    // The Warm Aristillus Ejecta Boulder (GHRM +32K Heat Anomaly)
    const rockGeo = new THREE.DodecahedronGeometry(2.6, 2);
    this.rockMat = new THREE.MeshStandardMaterial({
      color: 0x6e727e,
      roughness: 0.65,
      metalness: 0.2
    });
    this.anomalyBoulder = new THREE.Mesh(rockGeo, this.rockMat);
    this.anomalyBoulder.position.set(0, 1.4, 0);
    this.anomalyBoulder.scale.set(1.5, 1.1, 1.3);
    this.anomalyGroup.add(this.anomalyBoulder);

    // Warm Infrared Thermal Glow around the rock
    this.thermalGlow = new THREE.PointLight(0xff7733, 2.2, 14);
    this.thermalGlow.position.set(0, 2.0, 0);
    this.anomalyGroup.add(this.thermalGlow);

    // Tripod foundation mount for Spectrometer
    const tripodGeo = new THREE.CylinderGeometry(0.4, 0.9, 1.2, 8);
    this.tripodMount = new THREE.Mesh(tripodGeo, new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.8 }));
    this.tripodMount.position.set(3.5, 0.6, 1.5);
    this.tripodMount.scale.set(0.1, 0.1, 0.1); // Starts folded
    this.anomalyGroup.add(this.tripodMount);

    // Laser Spectrometer Emitter Beam
    const laserGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.8, 8);
    this.laserMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.0
    });
    this.laserBeam = new THREE.Mesh(laserGeo, this.laserMat);
    this.laserBeam.position.set(1.8, 1.2, 0.7);
    this.laserBeam.rotation.z = Math.PI * 0.45;
    this.anomalyGroup.add(this.laserBeam);

    this.scene.add(this.anomalyGroup);
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
          <span id="storm-timer-digits" class="storm-hud-timer">01:05</span>
        </div>
      `;
      document.body.appendChild(stormEl);
    }
    this.stormHUD = stormEl;
    this.stormTimerDigits = document.getElementById('storm-timer-digits');
  }

  onEnter() {
    this.engine.showPanel('hud');
    this.engine.hud.setLocation('MOON: MARE IMBRIUM (20°N - 30°N)');
    if (this.engine.resources) {
      this.engine.resources.initMissionLevels();
    }

    if (this.stormHUD) this.stormHUD.style.display = 'none';

    // Mission Intro Dialogue for 7-12 year olds & Educational Rover Brief
    setTimeout(() => {
      if (this.engine.dialogue) {
        this.engine.dialogue.play('moon_m2_intro');
      }
      this.engine.showNotification('🚜 ROVER BRIEF: The rover travels far across tough rocks and carries heavy tools to save astronaut oxygen!', 'info', 8500);
    }, 450);

    // Restore saved Mare Imbrium progress
    const saved = this.engine.save.get('progress.moonM2');
    if (saved && saved.missionStage && saved.missionStage !== 'STAGE1_ROVER_TRAVERSE') {
      this.missionStage = saved.missionStage;
      this.spectrometerDeployed = !!saved.spectrometerDeployed;
      if (this.spectrometerMesh) this.spectrometerMesh.visible = this.spectrometerDeployed;

      if (saved.missionStage === 'STAGE2_DEPLOY_SPECTROMETER') {
        this.character.position.set(this.anomalyPos.x - 2, this._getTerrainHeight(this.anomalyPos.x - 2, this.anomalyPos.z), this.anomalyPos.z);
        this._startStage2();
        this.engine.showNotification('🌕 WELCOME BACK: Resuming at Aristillus Thermal Anomaly! Press [E] to deploy spectrometer!', 'info', 7000);
      } else if (saved.missionStage === 'STAGE3_STORM_ESCAPE' || saved.missionStage === 'STAGE3_IN_BUNKER') {
        this._startStage3StormCrisis();
        this.engine.showNotification('⚠️ WELCOME BACK: Solar Storm in progress! Evacuate to the Artemis bunker [E]!', 'warning', 7000);
      } else if (saved.missionStage === 'MISSION_COMPLETE') {
        this.character.position.set(-20, this._getTerrainHeight(-20, -12), -12);
        this.engine.showNotification('🏆 WELCOME BACK: Mare Imbrium Mission Completed!', 'success', 7000);
      }
    } else {
      // Start outside positioned clear of the lander hatch, right in front of the Lunar Rover
      this.character.position.set(-14, this._getTerrainHeight(-14, -10), -10);
      this.character.heading = Math.PI * 0.25;
      this.character.setVisible(true);
      this.lander.isOccupied = false;

      // Mare Imbrium Wrong Landing Hazard: DONKI Solar Alert active!
      if (this.engine.radiation) {
        this.engine.radiation.solarEventActive = true;
        this.engine.radiation.solarEventMultiplier = 65.0; // High radiation baseline on dark basalt plain
      }

      this.engine.showNotification('🌕 TOUCHDOWN: Mare Imbrium! ⚠️ CME Radiation Warning Active! Mount the Rover [R] and reach the Aristillus Thermal Anomaly [Waypoint]!', 'warning', 8500);

      // Touchdown Operational Dilemma 3.5 seconds after landing
      setTimeout(() => {
        if (this.engine.tradeoff && this.missionStage === 'STAGE1_ROVER_TRAVERSE') {
          this.engine.tradeoff.presentDecision({
            id: 'mare_imbrium_night_landing',
            title: '❄️ 14-Day Freezing Night: Battery Power Choice',
            contextBadge: '🌑 MARE IMBRIUM • COLD DARK MOON NIGHT',
            scenario: 'It is super cold (-130°C) during the dark Moon night, and there is no sunlight! You have emergency batteries. How do you want to share the power?',
            scientificBasis: 'Night on the Moon lasts 14 Earth days! Without the Sun, astronauts must carefully budget battery power between heaters and driving.',
            choices: [
              {
                title: 'Cozy Heaters & Fresh Air (+15% Air & Health)',
                description: 'Keep cabin heaters warm and air scrubbers running at 100% to keep the astronaut healthy!',
                icon: '🫁',
                style: 'safe',
                impacts: [
                  { label: '+15% Oxygen & Health', type: 'reward' },
                  { label: '-8% Battery Power', type: 'cost' },
                  { label: 'Defrost Active', type: 'reward' }
                ],
                applyResources: { power: -8, oxygen: 12, crewCondition: 8 },
                sciencePoints: 300,
                outcome: 'Cabin heaters and clean air pumps humming! Crew feels warm and safe, but battery capacity drains.'
              },
              {
                title: 'Supercharge the Rover (+30% Rover Energy)',
                description: 'Send extra electricity to your Lunar Rover battery so you can drive fast and explore far!',
                icon: '🔋',
                style: 'warning',
                impacts: [
                  { label: '+30% Rover Battery', type: 'reward' },
                  { label: '-10% Cabin Oxygen', type: 'warning' },
                  { label: '+15% Rover Speed', type: 'reward' }
                ],
                applyResources: { roverEnergy: 30, oxygen: -10 },
                sciencePoints: 450,
                outcome: 'Lunar Rover supercharged for the journey! Ready to roll across the crater plain.'
              },
              {
                title: 'Power-Saver Sleep Mode (Save Power Buffer)',
                description: 'Turn off extra lights and eat packaged snacks to save precious battery power.',
                icon: '⚡',
                style: 'default',
                impacts: [
                  { label: '+10% Power Buffer Saved', type: 'reward' },
                  { label: '-10% Food Snacks', type: 'cost' },
                  { label: 'Dim Base Lights', type: 'warning' }
                ],
                applyResources: { power: 10, food: -10 },
                sciencePoints: 500,
                outcome: 'Power conserved! Your battery reserve stays high for emergency needs.'
              }
            ]
          });
        }
      }, 3500);

      // Stage 1: Traverse plain to Aristillus Thermal Ridge
      this._startStage1();
    }
  }

  restartMission() {
    if (this.engine && this.engine.save) {
      this.engine.save.set('progress.moonM2', null);
    }
    this.missionStage = 'STAGE1_ROVER_TRAVERSE';
    this.spectrometerDeployed = false;
    if (this.spectrometerMesh) this.spectrometerMesh.visible = false;
    this.mode = 'walk';
    this.character.position.set(-14, this._getTerrainHeight(-14, -10), -10);
    this.character.heading = Math.PI * 0.25;
    this.character.setVisible(true);
    this.character.setControlEnabled(true);
    if (this.rover) {
      this.rover.position.set(-12, this._getTerrainHeight(-12, -8), -8);
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
    this.engine.showNotification('🌕 MISSION RESTARTED: Mare Imbrium Plains! Mount the Rover [R] to reach the Aristillus Thermal Anomaly!', 'info', 7000);
  }

  _startStage1() {
    this.missionStage = 'STAGE1_ROVER_TRAVERSE';

    this.waypointSystem.setWaypoint({
      id: 'thermal_ridge',
      name: 'Aristillus Thermal Anomaly Ridge (+32K Heat Retention)',
      position: this.waypointPos,
      isWaypoint: true,
      color: 0xb844ff,
      colorName: 'PURPLE',
      bullets: [
        'Drive Lunar Rover across basaltic mare plain',
        'Diviner GHRM identifies +32K midnight thermal anomaly in crater ejecta',
        'Deploy Laser Thermal Spectrometer to measure rock abundance'
      ],
      funFact: 'Fact: Fresh Copernican craters retain daytime solar heat at midnight due to high thermal inertia in solid boulders!',
      onComplete: () => {
        this._startStage2();
      }
    });
  }

  _startStage2() {
    this.missionStage = 'STAGE2_DEPLOY_SPECTROMETER';
    this.waypointSystem.setWaypoint({
      id: 'spectrometer_target',
      name: 'DEPLOY THERMAL SPECTROMETER & SCAN ROCK [E]',
      position: this.waypointPos,
      color: 0x00ff88,
      colorName: 'EMERALD GREEN',
      bullets: [
        'Dismount rover and approach warm glowing basalt boulder',
        'Press [E] to fire infrared laser spectrometer',
        'Record rock mineral composition into expedition logbook'
      ],
      funFact: 'Fact: Basalt volcanic rocks absorb and release heat like giant natural thermal batteries!'
    });
    this.engine.audio.playScannerBeep();
    this.engine.showNotification('🔬 ANOMALY REACHED: Approach the Green Beacon! Press [E] to zap boulder with laser spectrometer!', 'info', 7500);

    // Present the Science vs Space Weather Crisis Dilemma!
    setTimeout(() => {
      if (this.engine.tradeoff && this.missionStage === 'STAGE2_DEPLOY_SPECTROMETER' && !this.spectrometerDeployed) {
        this.engine.tradeoff.presentDecision({
          id: 'cme_radiation_tradeoff',
          title: '🚨 Space Weather Alert: Science vs. Solar Flare',
          contextBadge: '☀️ SOLAR STORM INCOMING',
          scenario: 'NASA monitors spot a solar flare rushing towards the Moon! Scanning this giant boulder with our laser will earn lots of science, but staying outside exposes the astronaut to space radiation. What will you do?',
          scientificBasis: 'Solar storms shoot fast proton particles through space. Astronauts must take shelter in bunkers or rovers to stay safe.',
          choices: [
            {
              title: 'Hold Position for Deep Rock Analysis (Max Science)',
              description: 'Stand ground at the boulder and finish the full multi-spectral laser scan. Earn huge science points!',
              icon: '🔬',
              style: 'danger',
              impacts: [
                { label: '+1,500 Science Points', type: 'reward' },
                { label: '-25% Crew Health (Radiation)', type: 'cost' },
                { label: 'Suit Shield Broken', type: 'cost' }
              ],
              applyResources: { crewCondition: -25 },
              sciencePoints: 1500,
              outcome: 'Boulder minerals scanned! Ground-breaking science recorded, but astronaut absorbed a high radiation dose.',
              onSelected: () => {
                this.deploySpectrometer();
              }
            },
            {
              title: 'Quick Sensor Snapshot & Jump in Rover',
              description: 'Fire a quick 3-second laser pulse from inside the rover seat to get good science while staying safe.',
              icon: '⚡',
              style: 'warning',
              impacts: [
                { label: '+750 Science Points', type: 'reward' },
                { label: '-8% Crew Health', type: 'cost' },
                { label: '-10% Rover Battery', type: 'cost' }
              ],
              applyResources: { crewCondition: -8, roverEnergy: -10 },
              sciencePoints: 750,
              outcome: 'Basic boulder heat readings captured! Good science points awarded with minimal radiation risk.',
              onSelected: () => {
                this.deploySpectrometer();
              }
            },
            {
              title: 'Run to Lander Bunker (Safety First)',
              description: 'Cancel the science scan immediately and race inside the Artemis Lander bunker before the solar storm hits!',
              icon: '🛡️',
              style: 'safe',
              impacts: [
                { label: '100% Crew Health Safe', type: 'reward' },
                { label: '0 Science Points Awarded', type: 'warning' },
                { label: '-8% Bunker Shield Power', type: 'cost' }
              ],
              applyResources: { power: -8, crewCondition: 15 },
              sciencePoints: 200,
              outcome: 'Astronaut team safely locked inside the thick radiation bunker! Zero radiation absorbed.',
              onSelected: () => {
                this._triggerSpaceWeatherCrisis();
              }
            }
          ]
        });
      }
    }, 1500);
  }

  deploySpectrometer() {
    if (this.spectrometerDeployed) return;
    this.spectrometerDeployed = true;

    this.engine.audio.playScannerBeep();
    this.engine.audio.playTone(660, 0.2, 'sine', 0.3);

    // Unfold tripod and fire laser beam
    let s = 0.1;
    const unfoldInterval = setInterval(() => {
      s += 0.08;
      this.tripodMount.scale.set(s, s, s);
      if (s >= 1.0) {
        clearInterval(unfoldInterval);
        this.tripodMount.scale.set(1.0, 1.0, 1.0);
        this.laserMat.opacity = 0.85;

        // Pulse laser beam
        let pCount = 0;
        const pulse = setInterval(() => {
          this.laserMat.opacity = this.laserMat.opacity > 0.5 ? 0.2 : 0.95;
          pCount++;
          if (pCount > 6) {
            clearInterval(pulse);
            this.laserMat.opacity = 0.75;
          }
        }, 120);
      }
    }, 40);

    // Log scientific discovery and record mission sample
    const anom = MOON_DATA.ghrm.anomaly_regions[0];
    this.engine.scoring.add(1200, 'Aristillus Rock Abundance Measured');
    this.engine.save.recordMissionSample('moon_m2', { type: 'SPECTROMETER CORE', name: 'Aristillus Basalt Rock Abundance' });
    this.engine.showNotification(`📊 SPECTROMETER ACTIVE: Measured Rock Abundance ${anom.rock_abundance_percent} (RA = DN × 0.001)! Thermal anomaly verified!`, 'success', 6000);

    // Trigger Space Weather Solar Flare / CME Crisis!
    setTimeout(() => {
      this._triggerSpaceWeatherCrisis();
    }, 3500);
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
      this.engine.radiation.currentRate = 95.0; // Radiation spike
    }

    this.engine.showNotification('🚨 NASA DONKI SPACE WEATHER ALERT: M1.6 Solar Flare & 520 km/s CME Proton Storm incoming in 40s! Race rover back to Lander Bunker!', 'danger', 10000);

    // Lock waypoint onto Artemis Lander Bunker
    const bunkerPos = new THREE.Vector3(-20, this._getTerrainHeight(-20, -16), -16);
    this.waypointSystem.setWaypoint({
      id: 'lander_bunker',
      name: 'ARTEMIS LANDER RADIATION STORM BUNKER',
      position: bunkerPos,
      color: 0x00e5ff,
      colorName: 'CYAN BLUE',
      bullets: [
        'Race rover at full throttle back across Mare Imbrium!',
        'Spacecraft storm bunker attenuates 98% of ionizing protons',
        'Enter airlock [E] before the 40s timer expires to survive'
      ],
      funFact: 'Fact: Unshielded astronauts during a solar proton storm risk acute radiation sickness within hours!',
      onComplete: () => {
        // Arrived at bunker
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
    this.engine.audio.playSuccess();

    // Shielding protects crew: stop health drain and restore condition
    if (this.engine.radiation) {
      this.engine.radiation.currentRate = 0.05; // 98% shielded!
    }
    if (this.engine.resources) {
      this.engine.resources.healCrew(15);
    }

    this.engine.showNotification('🛡️ BUNKER SHIELD STRENGTH: 100%! Heavy hull & energy dome active. Remain inside until the storm clears!', 'success', 8000);
  }

  _completeMissionSuccess(hadSevereExposure = false) {
    this.missionStage = 'MISSION_COMPLETE';
    this.stormActive = false;
    if (this.stormHUD) this.stormHUD.style.display = 'none';

    // 1. Immediately disable player movement
    if (this.character) this.character.setControlEnabled(false);
    if (this.rover) this.rover.setControlEnabled(false);

    this.engine.audio.playSuccess();
    const scoreAward = hadSevereExposure ? 800 : 2000;
    this.engine.scoring.add(scoreAward, hadSevereExposure ? 'Mare Imbrium CME Escaped with Radiation Damage' : 'Mare Imbrium Proton Storm Evaded');
    const scoreData = this.engine.scoring.calculateFinalScore();

    // Record physical mission sample
    this.engine.save.recordMissionSample('moon_m2', { type: 'DONKI PROTON DATA', name: 'Mare Imbrium Thermal Shield Log' });

    // 2. Standardized sequential mission unlock in SaveManager (unlocks Moon M3)
    this.engine.save.completeMission('moon_m2');

    // 3. Visual feedback with live life-support resources
    this.engine.showMissionCompletedModal({
      title: 'MISSION 2: LAVA PLAIN RACE ACCOMPLISHED',
      subtitle: 'Mare Imbrium Thermal Anomaly Operation',
      points: scoreAward,
      resources: scoreData.resources,
      praise: 'Superb driving, Astronaut Alex Morgan! You raced across the dark freezing plains of Mare Imbrium, analyzed hot volcanic rock anomalies, balanced cabin heating against rover battery, and beat the solar proton storm!'
    });
  }

  _saveProgress() {
    try {
      this.engine.save.set('progress.moonM2', {
        missionStage: this.missionStage,
        spectrometerDeployed: !!this.spectrometerDeployed,
        missionComplete: this.missionStage === 'MISSION_COMPLETE'
      });
    } catch (e) {
      console.warn('[MoonThermalScene] Could not save progress:', e);
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

    // 1. Rover Mount / Dismount Toggle
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
          this.engine.audio.playUIClick();
          this.engine.showNotification('🚜 ROVER BOARDED: WASD / Arrows to drive across Mare Imbrium plain!', 'info', 3000);
        } else if (this.lander.isOccupied) {
          this.engine.showNotification('Exit the Artemis Lander bunker before mounting the rover.', 'warning');
        } else {
          this.engine.showNotification(`Rover is ${dist.toFixed(1)}m away. Move closer to board [R].`, 'warning');
        }
      } else {
        this.mode = 'walk';
        this.rover.deactivate();
        this.character.position.copy(this.rover.position).add(new THREE.Vector3(2.5, 0, 0));
        this.character.position.y = this._getTerrainHeight(this.character.position.x, this.character.position.z);
        this.character.setVisible(true);
        this.camera = this.character.getCamera();
        this.engine.audio.playUIClick();
      }
    }

    // 2. Update Controllers & Physics
    if (this.mode === 'walk') {
      if (!this.lander.isOccupied) {
        this.character.update(dt);
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

    // 5. Update Interactive Stage Triggers (Rover Enforced)
    if (this.missionStage === 'STAGE2_DEPLOY_SPECTROMETER') {
      const distToSite = Math.min(playerPos.distanceTo(this.waypointPos), playerPos.distanceTo(this.anomalyPos));
      if (distToSite < 8.5) {
        if (this.mode === 'rover') {
          this.engine.hud.showInteractionPrompt('DEPLOY LASER THERMAL SPECTROMETER & SCAN BOULDER [E]', 'E');
          if (input.isActionPressed('interact')) {
            this.deploySpectrometer();
          }
        } else {
          this.engine.hud.showInteractionPrompt('🚜 ROVER REQUIRED: MUST DRIVE ROVER TO DEPLOY SPECTROMETER', 'R');
        }
      } else {
        this.engine.hud.hideInteractionPrompt();
      }
    } else if (this.missionStage === 'STAGE3_STORM_ESCAPE') {
      // Countdown storm timer
      this.stormTimer -= dt;
      const m = Math.floor(Math.max(0, this.stormTimer) / 60);
      const s = Math.floor(Math.max(0, this.stormTimer) % 60);
      if (this.stormTimerDigits) {
        this.stormTimerDigits.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }

      // Radiation consequences while exposed outdoors during proton storm
      if (this.engine.resources) {
        // Continuous proton flux drains crew health
        this.engine.resources.drain('crewCondition', 0.45 * dt);

        if (this.mode === 'rover') {
          // Double rover battery drain due to radiation filters
          this.engine.resources.drain('roverEnergy', 0.35 * dt);
          // Throttle rover top speed from 16.0 to 9.5 due to EMP motor glitch
          if (this.rover) this.rover.maxSpeed = 9.5;
        }
      }

      // Radiation Audio-Visual feedback
      if (Math.random() < 0.08) {
        this.engine.audio.playTone(800 + Math.random() * 350, 0.03, 'sawtooth', 0.15); // Geiger tick
      }
      if (Math.random() < 0.02 && this.engine.hud && this.engine.hud.triggerDamageVignette) {
        this.engine.hud.triggerDamageVignette();
      }

      // Check distance to Lander Bunker
      const distToLander = playerPos.distanceTo(this.lander.group.position);
      if (distToLander < 7.0 && this.mode === 'walk') {
        this.engine.hud.showInteractionPrompt('CYCLE AIRLOCK & SEAL RADIATION STORM BUNKER', 'E');
        if (input.isActionPressed('interact')) {
          this._sealStormBunker();
        }
      } else if (distToLander < 7.0 && this.mode === 'rover') {
        this.engine.hud.showInteractionPrompt('DISMOUNT ROVER [R] & ENTER BUNKER AIRLOCK', 'R');
      } else {
        this.engine.hud.hideInteractionPrompt();
      }

      // Hard fail if timer runs out while unshielded outdoors
      if (this.stormTimer <= 0) {
        this.engine.triggerMissionFailed({
          title: 'MISSION FAILED: PROTON STORM EXPOSURE',
          reason: 'Failed to reach the radiation bunker before the 40-second storm arrival!',
          desc: 'High-energy solar protons deliver lethal radiation doses without thick spacecraft shielding. Drive the rover quickly back to the base camp bunker!'
        });
        return;
      }
    } else if (this.missionStage === 'STAGE3_IN_BUNKER') {
      this.stormTimer -= dt;
      const m = Math.floor(Math.max(0, this.stormTimer) / 60);
      const s = Math.floor(Math.max(0, this.stormTimer) % 60);
      if (this.stormTimerDigits) {
        this.stormTimerDigits.textContent = `SHELTERED — ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }

      // Fail if player exits early while storm is active
      if (!this.lander.isOccupied && this.stormTimer > 0) {
        this.engine.triggerMissionFailed({
          title: 'MISSION FAILED: EARLY BUNKER EGRESS',
          reason: 'You exited the bunker while the solar storm was raging!',
          desc: 'The CME proton flux takes time to pass. Leaving the bunker before the storm clears causes lethal radiation exposure.'
        });
        return;
      }

      if (this.stormTimer <= 0) {
        this._completeMissionSuccess(false);
      }
    } else {
      // General lander interaction: only within 3.2m of hatch to avoid blocking player at spawn
      const distToLander = playerPos.distanceTo(this.lander.group.position);
      if (distToLander < 3.2 && this.mode === 'walk' && !this.lander.isOccupied) {
        this.engine.hud.showInteractionPrompt('ENTER ARTEMIS LANDER CABIN', 'E');
        if (input.isActionPressed('interact')) {
          this.lander.startBoarding(this.character, () => {
            this.engine.showNotification('Inside Artemis Lander Cabin. Radiation shielding: 98%.', 'info');
          });
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

    // 6. Update Tactical Mini-Radar
    const playerHeading = this.mode === 'walk' ? this.character.getHeading() : this.rover.getHeading();
    this.engine.hud.updateNavigation({
      playerPos,
      playerHeading,
      basePos: { x: -20, z: -16 },
      baseName: 'Artemis Lander Bunker',
      targets: [
        {
          id: 'artemis_lander',
          name: 'Artemis Lander Storm Bunker',
          type: 'LANDER BASE',
          pos: this.lander.getPosition(),
          completed: this.lander.isOccupied
        },
        {
          id: 'thermal_ridge',
          name: 'Aristillus Thermal Anomaly (+32K)',
          type: 'SCIENCE TARGET',
          pos: this.anomalyPos,
          completed: this.spectrometerDeployed,
          isWaypoint: true,
          isPurple: true
        }
      ],
      activeTarget: this.missionStage === 'STAGE3_STORM_ESCAPE' ? {
        id: 'artemis_lander',
        name: 'Artemis Lander Storm Bunker',
        pos: this.lander.getPosition(),
        completed: false
      } : {
        id: 'thermal_ridge',
        name: 'Aristillus Thermal Anomaly Ridge',
        pos: this.anomalyPos,
        completed: this.spectrometerDeployed,
        isWaypoint: true,
        isPurple: true
      },
      terrainSize: 320,
      sectorName: 'MOON: MARE IMBRIUM (20°N - 30°N)'
    });
  }
}
