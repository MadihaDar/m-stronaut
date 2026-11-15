/* ============================================================
   FRONTIER: MISSION ACADEMY — Moon Campaign: Mission 05
   DAEDALUS CRATER FAR-SIDE RADIO ARRAY — THE QUIET COSMOS
   Real NASA Data: Lunar Far-Side Earth Radio Shielding (<30 MHz), Robbins Crater Database
   Stage 1: Traverse Daedalus Central Peak Massif in pristine radio-quiet darkness
   Stage 2: Deploy 3-Mast Dipole Antenna Array & Spectrum Analyzer
   Stage 3: Execute EMCON Radio Silence Dilemma & Detect 21cm Cosmic Dark Ages Signal
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../systems/CharacterController.js';
import { RoverController } from '../systems/RoverController.js';
import { SpaceshipLander } from '../systems/SpaceshipLander.js';
import { WaypointSystem } from '../systems/WaypointSystem.js';

export class MoonFarSideScene extends BaseScene {
  constructor(engine) {
    super(engine);

    this.mode = 'walk'; // 'walk' | 'rover'
    this.missionStage = 'STAGE1_ARRAY_TRAVERSE';
    this.arrayDeployed = false;
    this.cosmicSignalLocked = false;

    // Daedalus Crater Floor & Central Peak Massif Terrain
    this._getTerrainHeight = (x, z) => {
      // Central peak massif at (45, -50)
      const distToPeak = Math.hypot(x - 45, z + 50);
      if (distToPeak < 40) {
        if (distToPeak < 10) return 12.0; // Flat survey plateau at summit for rover & telescope array
        const t = (40 - distToPeak) / 30;
        return t * t * 12.0;
      }
      // Crater floor with impact regolith ripples
      return Math.sin(x * 0.04) * 1.5 + Math.cos(z * 0.05) * 1.8;
    };

    this.arrayPos = new THREE.Vector3(45, this._getTerrainHeight(45, -50), -50);

    this._buildEnvironment();
    this._buildTerrain();
    this._buildRadioAntennaArray();
    this._initSpectrumHUD();

    // 1. Artemis Exploration Lander (Base Camp)
    this.lander = new SpaceshipLander(this.scene, this.engine, new THREE.Vector3(-16, 0, -10), this._getTerrainHeight);

    // 2. Guided Waypoint System
    this.waypointPos = this.arrayPos;
    this.waypointSystem = new WaypointSystem(this.scene, this.engine, this._getTerrainHeight);

    // 3. Controllers
    this.character = new CharacterController(this.scene, this.engine, this._getTerrainHeight);
    this.character.setGravity(3.2, true);
    this.lander.characterRef = this.character;

    // Colliders (array central terminal hub has small radius so rover can drive right up to waypoint)
    const campCol = { type: 'cylinder', pos: { x: 0, z: -5 }, radius: 4.5 };
    const arrayCol = { type: 'cylinder', pos: { x: 45, z: -50 }, radius: 1.5 };
    this.character.setColliders([...this.lander.getColliders(), campCol, arrayCol]);

    // 4. Far-Side Science Rover
    this.rover = new RoverController(this.scene, this.engine, new THREE.Vector3(-9, 0, -6), this._getTerrainHeight);
    this.rover.setColliders([...this.lander.getColliders(), campCol, arrayCol]);

    this.camera = this.character.getCamera();
  }

  _buildEnvironment() {
    // Zero Earthshine! Farside lunar night has absolute deepest darkness in the inner solar system
    this.ambientLight = new THREE.AmbientLight(0x080c14, 0.4);
    this.scene.add(this.ambientLight);

    // Starlight illumination
    this.starlight = new THREE.DirectionalLight(0xaaccff, 0.65);
    this.starlight.position.set(60, 80, 50);
    this.scene.add(this.starlight);

    // Ultra-dense Milky Way galactic core starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2600;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 340 + Math.random() * 30;
      starPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 8;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Galactic core violet-cyan-gold hues
      const hueChoice = Math.random();
      if (hueChoice < 0.6) {
        starColors[i * 3] = 0.85; starColors[i * 3 + 1] = 0.95; starColors[i * 3 + 2] = 1.0;
      } else if (hueChoice < 0.85) {
        starColors[i * 3] = 0.6;  starColors[i * 3 + 1] = 0.8;  starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3] = 1.0;  starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 0.6;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.4,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.95
    });
    this.milkyWay = new THREE.Points(starGeo, starMat);
    this.scene.add(this.milkyWay);
  }

  _buildTerrain() {
    const planeGeo = new THREE.PlaneGeometry(260, 260, 96, 96);
    planeGeo.rotateX(-Math.PI / 2);

    const pos = planeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this._getTerrainHeight(x, z));
    }
    planeGeo.computeVertexNormals();

    this.groundMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.8,
      metalness: 0.15
    });
    this.terrainMesh = new THREE.Mesh(planeGeo, this.groundMat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  _buildRadioAntennaArray() {
    this.arrayGroup = new THREE.Group();
    this.arrayGroup.position.copy(this.arrayPos);

    // Central telemetry processing terminal
    const hubGeo = new THREE.CylinderGeometry(1.2, 1.6, 2.2, 8);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.8 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.y = 1.1;
    this.arrayGroup.add(hub);

    // Glowing diagnostic terminal screen
    const screenGeo = new THREE.PlaneGeometry(0.8, 0.45);
    this.terminalMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide });
    const screen = new THREE.Mesh(screenGeo, this.terminalMat);
    screen.position.set(0, 1.8, 1.25);
    this.arrayGroup.add(screen);

    // 3 Telescoping Dipole Antenna Masts arranged in an equilateral triangle (120° apart)
    this.masts = [];
    this.waveRings = [];
    const radius = 6.5;

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const mx = Math.cos(angle) * radius;
      const mz = Math.sin(angle) * radius;

      const mastGroup = new THREE.Group();
      mastGroup.position.set(mx, 0, mz);

      // Vertical mast pole (12m tall)
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.14, 12.0, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xdfe6e9, metalness: 0.9 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 6.0;
      mastGroup.add(pole);

      // Horizontal cross dipole wire arms
      const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 8.0, 8);
      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.y = 11.8;
      mastGroup.add(arm);

      // Flashing beacon LED on top
      const ledGeo = new THREE.SphereGeometry(0.18, 12, 8);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.y = 12.1;
      mastGroup.add(led);

      this.masts.push(mastGroup);
      this.arrayGroup.add(mastGroup);

      // Holographic cosmic radio waves expanding upwards
      const ringGeo = new THREE.RingGeometry(0.8, 1.2, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0, // invisible until activated
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(mx, 12.0, mz);
      this.waveRings.push(ring);
      this.arrayGroup.add(ring);
    }

    this.scene.add(this.arrayGroup);
  }

  _initSpectrumHUD() {
    let spec = document.getElementById('radio-spectrum-hud');
    if (!spec) {
      spec = document.createElement('div');
      spec.id = 'radio-spectrum-hud';
      spec.className = 'radio-spectrum-hud';
      spec.style.display = 'none';
      spec.innerHTML = `
        <div class="spectrum-card">
          <div class="spec-header">
            <span class="spec-pulse-dot"></span>
            <span class="spec-title">COSMIC 21CM HYDROGEN WATERFALL ANALYZER (14.2 MHz)</span>
            <span id="spec-status-pill" class="spec-pill waiting">SEARCHING SKY...</span>
          </div>
          <div class="waterfall-canvas-wrap">
            <canvas id="waterfall-canvas" width="340" height="70"></canvas>
          </div>
          <div class="spec-footer">
            <span class="spec-stat">EARTH RFI SHIELDING: <strong>99.999% (Moon Bulk)</strong></span>
            <span class="spec-stat">REDSHIFT: <strong>z ≈ 15.4 (Cosmic Dawn)</strong></span>
          </div>
        </div>
      `;
      document.body.appendChild(spec);
    }
    this.spectrumHUD = spec;
    this.waterfallCanvas = document.getElementById('waterfall-canvas');
    if (this.waterfallCanvas) {
      this.waterfallCtx = this.waterfallCanvas.getContext('2d');
    }
  }

  onEnter() {
    this.engine.showPanel('hud');
    this.engine.hud.setLocation('MOON: DAEDALUS CRATER (5.9°S - FAR-SIDE RADIO SILENCE)');
    if (this.engine.resources) {
      this.engine.resources.initMissionLevels();
    }

    if (this.spectrumHUD) this.spectrumHUD.style.display = 'block';

    // Mission Intro Dialogue for 7-12 year olds
    setTimeout(() => {
      if (this.engine.dialogue) {
        this.engine.dialogue.play('moon_m5_intro');
      }
    }, 450);

    // Start outside lander on foot
    this.character.position.set(-12, this._getTerrainHeight(-12, -7), -7);
    this.character.heading = Math.PI * 0.45;
    this.character.setVisible(true);
    this.lander.isOccupied = false;

    this.engine.showNotification('📡 TOUCHDOWN: Daedalus Crater Far-Side! Complete radio shielding from Earth. Mount the Rover and ascend the Central Peak [Waypoint]!', 'info', 8500);

    // Initial Gateway Relay Dilemma (Kid-Friendly)
    setTimeout(() => {
      if (this.engine.tradeoff && this.missionStage === 'STAGE1_ARRAY_TRAVERSE') {
        this.engine.tradeoff.presentDecision({
          id: 'daedalus_blackout_dilemma',
          title: '🛰️ Far Side of the Moon: Autonomous Driving',
          contextBadge: '🌑 BLOCKED FROM EARTH RADIO',
          scenario: 'The Moon is blocking direct radio signals to Earth! The NASA relay satellite is temporarily behind the horizon. You must choose how to climb the peak on your own!',
          scientificBasis: 'The Moon far side never faces Earth, so radio waves cannot reach it directly without an orbiting relay satellite!',
          choices: [
            {
              title: 'Drive Rover Directly to the Mountain Peak (+500 Science)',
              description: 'Use the rover smart cameras to navigate rocks and climb the peak without waiting for Houston.',
              icon: '🤖',
              style: 'aggressive',
              impacts: [
                { label: '+500 Science Points', type: 'reward' },
                { label: 'Fast Mountain Climb', type: 'reward' },
                { label: '-15% Rover Battery', type: 'cost' }
              ],
              applyResources: { roverEnergy: -15 },
              sciencePoints: 500,
              outcome: 'Autonomous navigation engaged! Rover treads climb the basalt incline smoothly.'
            },
            {
              title: 'Conserve Power & Wait for Satellite Link',
              description: 'Park the rover in low-power mode until the Lunar Gateway satellite passes overhead.',
              icon: '🛰️',
              style: 'safe',
              impacts: [
                { label: '+300 Science Points', type: 'reward' },
                { label: 'Earth Radio Reconnected', type: 'reward' },
                { label: '-15% Oxygen & Power while waiting', type: 'cost' }
              ],
              applyResources: { oxygen: -15, power: -10 },
              sciencePoints: 300,
              outcome: 'Telemetry lock achieved with Lunar Gateway. Houston confirms optimal peak coordinates.'
            }
          ]
        });
      }
    }, 3500);

    this._startStage1();
  }

  restartMission() {
    if (this.engine && this.engine.save) {
      this.engine.save.set('progress.moonM5', null);
    }
    this.missionStage = 'STAGE1_ARRAY_TRAVERSE';
    this.arrayDeployed = false;
    if (this.arrayMesh) this.arrayMesh.visible = false;
    this.mode = 'walk';
    this.character.position.set(-12, this._getTerrainHeight(-12, -7), -7);
    this.character.heading = Math.PI * 0.45;
    this.character.setVisible(true);
    this.character.setControlEnabled(true);
    if (this.rover) {
      this.rover.position.set(-10, this._getTerrainHeight(-10, -5), -5);
      this.rover.heading = Math.PI * 0.45;
      this.rover.isOccupied = false;
      this.rover.setControlEnabled(true);
      this.rover.speed = 0;
    }
    if (this.lander) {
      this.lander.isOccupied = false;
      this.lander.interiorActive = false;
    }
    this._startStage1();
    this.engine.showNotification('🌕 MISSION RESTARTED: Daedalus Crater Floor! Mount the Rover [R] and ascend to the central peak!', 'info', 7000);
  }

  _startStage1() {
    this.missionStage = 'STAGE1_ARRAY_TRAVERSE';

    this.waypointSystem.setWaypoint({
      id: 'daedalus_peak_array',
      name: 'Daedalus Central Peak (Cosmic Dawn Radio Site)',
      position: this.waypointPos,
      isWaypoint: true,
      triggerRadius: 12.0,
      requireRover: true,
      color: 0xb844ff,
      colorName: 'PURPLE',
      bullets: [
        'Drive Lunar Rover up the central peak massif',
        'Deploy 3-mast dipole array to capture low-frequency radio waves (<30 MHz)',
        'Discover the 21cm hydrogen signature from the first stars'
      ],
      funFact: 'Fact: The lunar far side is the quietest place in the solar system for radio astronomy because the entire Moon blocks human radio noise!',
      onComplete: () => {
        this._startStage2();
      }
    });
  }

  _startStage2() {
    this.missionStage = 'STAGE2_ARRAY_DEPLOY';
    this.waypointSystem.setWaypoint({
      id: 'daedalus_mast_mount',
      name: 'DEPLOY DIPOLE RADIO MASTS [E]',
      position: this.waypointPos,
      triggerRadius: 12.0,
      color: 0x00ff88,
      colorName: 'EMERALD GREEN',
      bullets: [
        'Drive rover onto telescope survey pad',
        'Press [E] to extend 12-meter beryllium copper masts',
        'Tune receivers into pristine cosmic dawn frequencies'
      ],
      funFact: 'Fact: Low frequency waves allow astronomers to see the very first stars born after the Big Bang!'
    });
    this.engine.audio.playScannerBeep();
    this.engine.showNotification('🔭 CENTRAL PEAK REACHED: Drive onto the survey pad and press [E] to deploy the radio masts!', 'info', 7500);
  }

  deployRadioArray() {
    if (this.arrayDeployed) return;
    this.arrayDeployed = true;

    // Record physical mission sample
    this.engine.save.recordMissionSample('moon_m5', { type: 'EMCON ARCHIVE', name: 'Daedalus Crater PDS Telemetry' });

    this.engine.audio.playSuccess();
    this.engine.showNotification('📡 ANTENNAS EXTENDED: 12-meter dipole masts locked! Tuning into 14.2 MHz...', 'success', 6000);

    // Present EMCON Radio Silence Dilemma after 3 seconds (Kid-Friendly)
    setTimeout(() => {
      if (this.engine.tradeoff) {
        this.engine.tradeoff.presentDecision({
          id: 'daedalus_emcon_dilemma',
          title: '📡 Cosmic Dawn: Telescope vs. Rover Noise',
          contextBadge: '🌌 FIRST STARS IN THE UNIVERSE',
          scenario: 'The antenna array is listening for faint radio waves from the very first stars born after the Big Bang! But rover motors and heaters make electrical humming noise. What will you do?',
          scientificBasis: 'Signals from the cosmic dawn are very quiet. Turning off vehicle electronics allows radio telescopes to hear the early universe clearly.',
          choices: [
            {
              title: 'Full Radio Silence: Cut Heaters for 45s (Max Science!)',
              description: 'Turn off all motors and heaters for 45 seconds to get a crystal-clear recording of the first stars!',
              icon: '🌌',
              style: 'aggressive',
              impacts: [
                { label: 'COSMIC DAWN SIGNAL CAPTURED!', type: 'reward' },
                { label: '+1000 Science Points', type: 'reward' },
                { label: '-15% Crew Comfort (Cold)', type: 'cost' }
              ],
              applyResources: { crewCondition: -15, power: 15 },
              sciencePoints: 1000,
              outcome: 'Electromagnetic silence achieved! Pristine hydrogen absorption dip from 13.5 billion years ago captured perfectly!',
              onSelected: () => {
                this.cosmicSignalLocked = true;
                const pill = document.getElementById('spec-status-pill');
                if (pill) {
                  pill.textContent = '21CM SIGNAL LOCKED!';
                  pill.className = 'spec-pill locked';
                }
                this._spawnExtractionWaypoint();
              }
            },
            {
              title: 'Filtered Listening: Keep Heaters On (Crew Safety)',
              description: 'Keep cabin heaters warm and use computer filters to clean the signal. The crew stays warm and cozy.',
              icon: '🛡️',
              style: 'safe',
              impacts: [
                { label: '+10% Crew Health', type: 'reward' },
                { label: '+600 Science Points', type: 'reward' },
                { label: '-10% Power Drain', type: 'cost' }
              ],
              applyResources: { power: -10, crewCondition: 10 },
              sciencePoints: 600,
              outcome: 'Filters engaged! Signal captured with good clarity while the astronaut team stays warm.',
              onSelected: () => {
                this.cosmicSignalLocked = true;
                const pill = document.getElementById('spec-status-pill');
                if (pill) {
                  pill.textContent = '21CM SIGNAL LOCKED!';
                  pill.className = 'spec-pill locked';
                }
                this._spawnExtractionWaypoint();
              }
            }
          ],
          onChosen: () => {
            this.cosmicSignalLocked = true;
            const pill = document.getElementById('spec-status-pill');
            if (pill) {
              pill.textContent = '21CM SIGNAL LOCKED!';
              pill.className = 'spec-pill locked';
            }
            this._spawnExtractionWaypoint();
          }
        });
      }
    }, 3000);
  }

  _spawnExtractionWaypoint() {
    this.missionStage = 'STAGE3_RETURN_TO_LANDER';
    this.engine.showNotification('📡 21CM COSMIC DAWN LOCKED: Telescopes operational! Return to the Artemis Lander airlock to complete the lunar campaign!', 'success', 9000);

    const landerPos = this.lander ? this.lander.group.position.clone() : new THREE.Vector3(-16, this._getTerrainHeight(-16, -10), -10);
    this.waypointSystem.setWaypoint({
      id: 'lander_extraction_m5',
      name: 'ARTEMIS SPACECRAFT AIRLOCK (CAMPAIGN FINALE)',
      position: landerPos,
      triggerRadius: 10.0,
      color: 0x00ff88,
      colorName: 'EMERALD GREEN',
      bullets: [
        'Drive rover back to the expedition lander',
        'Cosmic Dawn radio signals archived to NASA Planetary Data System',
        'Board the spacecraft [E] to complete the lunar campaign!'
      ],
      funFact: 'Fact: The lunar far side allows detecting signals from before the very first stars were born!',
      onComplete: () => {
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
    this.engine.scoring.add(2500, 'Daedalus Cosmic Dawn Array Commissioned');
    const scoreData = this.engine.scoring.calculateFinalScore();

    // Record sample
    this.engine.save.recordMissionSample('moon_m5', { type: '21CM COSMIC DAWN', name: 'Far-Side Lunar Radio Spectra' });

    // 2. Standardized sequential mission completion in SaveManager
    this.engine.save.completeMission('moon_m5');

    // 3. Visual feedback with live life-support resources
    this.engine.showMissionCompletedModal({
      title: 'MISSION 5: QUIET RADIO DISH ACCOMPLISHED',
      subtitle: 'Daedalus Crater Far-Side Radio Array',
      points: 2500,
      resources: scoreData.resources,
      praise: 'Incredible astronomical discovery, Commander Alex Morgan! You set up the 3-mast radio telescope on the quiet far side of the Moon, balanced EMCON vehicle silence against astronaut heating, and captured the first 21cm radio signals from the dawn of the universe!',
      onSelectNext: () => {
        this.engine.setState('DESTINATION');
        this.engine.showPanel('moon-mission-modal');
      }
    });
  }

  update(dt) {
    const input = this.engine.input;

    // 1. Rover toggle
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

    // 5. Radio Holographic Wave Rings Animation
    if (this.arrayDeployed) {
      this.waveRings.forEach((ring, idx) => {
        ring.material.opacity = 0.65;
        const scale = 1.0 + ((Date.now() * 0.002 + idx * 0.7) % 2.5);
        ring.scale.set(scale, scale, scale);
      });
    }

    // Draw Waterfall Spectrum
    if (this.waterfallCtx && this.waterfallCanvas) {
      const ctx = this.waterfallCtx;
      const w = this.waterfallCanvas.width;
      const h = this.waterfallCanvas.height;

      // Shift canvas up by 1 pixel
      const imgData = ctx.getImageData(0, 1, w, h - 1);
      ctx.putImageData(imgData, 0, 0);

      // Generate bottom row
      for (let x = 0; x < w; x++) {
        let intensity = Math.random() * 0.35;
        // Primordial hydrogen dip at x = 160
        if (this.cosmicSignalLocked) {
          const d = Math.abs(x - 160);
          if (d < 18) {
            intensity = 0.95 - (d / 18) * 0.5;
          }
        }
        ctx.fillStyle = `rgba(${Math.round(intensity * 30)}, ${Math.round(intensity * 240)}, ${Math.round(intensity * 255)}, 0.9)`;
        ctx.fillRect(x, h - 1, 1, 1);
      }
    }

    // 6. Interactive Prompts (Rover Enforced)
    if (this.missionStage === 'STAGE2_ARRAY_DEPLOY' && !this.arrayDeployed) {
      const distToArray = Math.hypot(playerPos.x - this.arrayPos.x, playerPos.z - this.arrayPos.z);
      if (distToArray < 14.0) {
        if (this.mode === 'rover') {
          this.engine.hud.showInteractionPrompt('DEPLOY LOW-FREQUENCY RADIO ARRAY & CALIBRATE RECEIVER [E]', 'E');
          if (input.isActionPressed('interact')) {
            this.deployRadioArray();
          }
        } else {
          this.engine.hud.showInteractionPrompt('🚜 ROVER REQUIRED: MUST DRIVE ROVER TO DEPLOY ARRAY', 'R');
        }
      } else {
        this.engine.hud.hideInteractionPrompt();
      }
    } else {
      // General lander interaction & Stage 3 Extraction
      const landerPos = this.lander ? this.lander.group.position : new THREE.Vector3(-16, 0, -10);
      const distToLander = Math.hypot(playerPos.x - landerPos.x, playerPos.z - landerPos.z);
      if (this.missionStage === 'STAGE3_RETURN_TO_LANDER') {
        if (distToLander < 10.0) {
          this.engine.hud.showInteractionPrompt('BOARD SPACECRAFT / COMPLETE LUNAR CAMPAIGN [E]', 'E');
          if (input.isActionPressed('interact') || distToLander < 4.5) {
            this._completeMissionSuccess();
            return;
          }
        } else {
          // Traveling the distance down from the central peak!
          this.engine.hud.showInteractionPrompt(`🚜 DRIVE ROVER BACK TO ARTEMIS LANDER (${Math.round(distToLander)}m ahead)`, '');
          // Must travel the distance! No premature completion!
        }
      } else if (distToLander < 6.0 && this.mode === 'walk') {
        if (!this.lander.isOccupied) {
          this.engine.hud.showInteractionPrompt('ENTER ARTEMIS LANDER CABIN', 'E');
          if (input.isActionPressed('interact')) {
            this.lander.startBoarding(this.character, () => {
              this.engine.showNotification('Inside Artemis Lander Cabin. Radio silence secured.', 'info');
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

    // 7. Mini-radar
    const playerHeading = this.mode === 'walk' ? this.character.getHeading() : this.rover.getHeading();
    const isStage3 = this.missionStage === 'STAGE3_RETURN_TO_LANDER';
    const landerPos = this.lander ? this.lander.group.position : new THREE.Vector3(-16, 0, -10);

    this.engine.hud.updateNavigation({
      playerPos,
      playerHeading,
      basePos: { x: -16, z: -10 },
      baseName: 'Daedalus Base Camp',
      targets: [
        {
          id: isStage3 ? 'lander_extraction_m5' : 'daedalus_lander',
          name: isStage3 ? 'Artemis Lander Campaign Finale' : 'Artemis Lander Bunker',
          type: isStage3 ? 'EXTRACTION AIRLOCK' : 'PRESSURIZED SHELTER',
          pos: landerPos,
          completed: this.lander.isOccupied,
          color: isStage3 ? 0x00ff88 : 0x00e5ff
        },
        {
          id: 'daedalus_peak_array',
          name: 'Low-Frequency Dipole Antenna Array',
          type: 'RADIO OBSERVATORY',
          pos: this.arrayPos,
          completed: this.arrayDeployed,
          isWaypoint: !isStage3,
          isPurple: !isStage3
        }
      ],
      activeTarget: isStage3 ? {
        id: 'lander_extraction_m5',
        name: 'Artemis Lander Campaign Finale',
        pos: landerPos,
        completed: false,
        isWaypoint: true,
        color: 0x00ff88
      } : {
        id: 'daedalus_peak_array',
        name: this.arrayDeployed ? 'Deploy Antenna Array' : 'Ascend to Central Peak',
        pos: this.arrayPos,
        completed: this.arrayDeployed,
        isWaypoint: true,
        isPurple: true
      },
      terrainSize: 260,
      sectorName: 'DAEDALUS CRATER (FAR SIDE 5.9°S, 179.4°E)',
      zoomLevel: 1.0
    });
  }

  onExit() {
    if (this.spectrumHUD) this.spectrumHUD.style.display = 'none';
    this.engine.hud.hideInteractionPrompt();
  }
}
