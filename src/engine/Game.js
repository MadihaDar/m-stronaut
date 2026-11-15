import * as THREE from 'three';
import { CameraController } from './CameraController.js';
import { InputManager } from './InputManager.js';
import { Environment } from '../entities/Environment.js';
import { MarsEnvironment } from '../entities/MarsEnvironment.js';
import { Astronaut } from '../entities/Astronaut.js';
import { Rover } from '../entities/Rover.js';
import { OrbitBot } from '../entities/OrbitBot.js';
import { ScienceTarget } from '../entities/ScienceTarget.js';
import { HabitatCamp } from '../entities/HabitatCamp.js';
import { MissionManager } from './MissionManager.js';
import { SCIENCE_DATABASE } from '../data/scienceData.js';
import { DESTINATIONS } from '../data/destinations.js';
import { storage } from './StorageManager.js';
import { audio } from './AudioManager.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.inMission = false;
    this.isRoverActive = false;
    this.inHabitatInterior = false;

    // Constraints & Survival Vitals
    this.suitOxygen = 100;
    this.roverBattery = 100;
    this.suitBattery = 100;
    this.tetherWarningCooldown = 0;

    this.destinationId = storage.state.selectedDestination || 'mars';
    this.characterId = storage.state.activeCharacter || 'alex';

    this.initThree();
    this.input = new InputManager(this.canvas);
    this.cameraController = new CameraController(this.camera, this.canvas);

    this.missionManager = new MissionManager(this);

    this.buildWorld();
    this.setupTargets();

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener('resize', this.onResize.bind(this));
  }

  initThree() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.2, 800);

    const dest = DESTINATIONS[this.destinationId] || DESTINATIONS.mars;
    this.scene.background = new THREE.Color(dest.skyColor);

    this.ambientLight = new THREE.AmbientLight(dest.ambientLight, 0.75);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(dest.sunLight, 2.2);
    this.sunLight.position.set(45, 60, 30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 160;
    const shadowDist = 55;
    this.sunLight.shadow.camera.left = -shadowDist;
    this.sunLight.shadow.camera.right = shadowDist;
    this.sunLight.shadow.camera.top = shadowDist;
    this.sunLight.shadow.camera.bottom = -shadowDist;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
  }

  buildWorld() {
    if (this.environment) {
      this.scene.remove(this.environment.group);
    }
    if (this.habitatCamp) {
      this.scene.remove(this.habitatCamp.group);
    }

    if (this.destinationId === 'mars') {
      this.environment = new MarsEnvironment(this.scene);
    } else {
      this.environment = new Environment(this.scene, this.destinationId);
    }

    // 3D Camp & Habitat Interior
    this.habitatCamp = new HabitatCamp(this.scene, this.destinationId);

    const dest = DESTINATIONS[this.destinationId] || DESTINATIONS.mars;
    if (this.astronaut) {
      this.astronaut.gravity = dest.gravity * 2.2;
    } else {
      this.astronaut = new Astronaut(this.scene, this.characterId);
      this.astronaut.gravity = dest.gravity * 2.2;
    }

    if (!this.rover) {
      this.rover = new Rover(this.scene);
    }

    if (!this.orbitBot) {
      this.orbitBot = new OrbitBot(this.scene);
    }
  }

  setupTargets() {
    if (this.scienceTargets) {
      this.scienceTargets.forEach((t) => this.scene.remove(t.group));
    }
    this.scienceTargets = [];

    if (this.destinationId === 'mars') {
      // 1. MRO SWIM Subsurface Ice Anomaly
      const swimData = SCIENCE_DATABASE.find((s) => s.id === 'swim_ice') || SCIENCE_DATABASE[5];
      const t1Pos = new THREE.Vector3(20, this.environment.getHeightAt(20, 14), 14);
      const target1 = new ScienceTarget(this.scene, swimData, t1Pos);
      target1.facilityType = 'water_station';
      this.scienceTargets.push(target1);

      // 2. Perseverance MEDA Weather Station
      const medaData = SCIENCE_DATABASE.find((s) => s.id === 'meda_weather') || SCIENCE_DATABASE[1];
      const t2Pos = new THREE.Vector3(-11, this.environment.getHeightAt(-11, -10), -10);
      const target2 = new ScienceTarget(this.scene, medaData, t2Pos);
      target2.facilityType = 'habitat';
      this.scienceTargets.push(target2);

      // 3. Curiosity MSL RAD Radiation Dosimeter
      const radData = SCIENCE_DATABASE.find((s) => s.id === 'rad_dosimetry') || SCIENCE_DATABASE[2];
      const t3Pos = new THREE.Vector3(-25, this.environment.getHeightAt(-25, 0), 0);
      const target3 = new ScienceTarget(this.scene, radData, t3Pos);
      target3.facilityType = 'rad_shelter';
      this.scienceTargets.push(target3);

      // 4. Mars Ascent Vehicle (MAV) on Launch Pad
      const mavData = {
        id: 'mav_ascent',
        title: 'Mars Ascent Vehicle (MAV) Departure Pad',
        planet: 'Mars',
        instrument: 'Pre-Positioned Return Propulsion System',
        dataType: 'MODEL',
        measuredData: 'MAV Stage 1 & 2 fueled with methane-LOX. Avionics telemetry online.',
        calculatedValue: 'Ascent delta-v required: 4.1 km/s to 250 km Mars parking orbit.',
        simplifiedExplanation: 'The return rocket was delivered and fueled before the crew arrived. Verify the 10-point checklist before launch!',
        kidTip: 'Our ticket back to Earth is waiting on the launch pad!'
      };
      const t4Pos = new THREE.Vector3(32, this.environment.getHeightAt(32, -18), -18);
      const target4 = new ScienceTarget(this.scene, mavData, t4Pos);
      target4.facilityType = 'mav_rocket';
      this.scienceTargets.push(target4);

      // 5. Bio-Regenerative Greenhouse
      const ghData = {
        id: 'mars_greenhouse',
        title: 'Bio-Regenerative Greenhouse Module',
        planet: 'Mars',
        instrument: 'Controlled Environment Agriculture (CEA)',
        dataType: 'MODEL',
        measuredData: 'Photosynthesis rate: 6CO₂ + 6H₂O + light ➔ C₆H₁₂O₆ + 6O₂.',
        calculatedValue: 'Self-sufficient hydroponic food production.',
        simplifiedExplanation: 'Fresh crops like potatoes and tomatoes provide vital nutrients and psychological comfort.',
        kidTip: 'Adjust temperature and water to harvest fresh food!'
      };
      const t5Pos = new THREE.Vector3(-16, this.environment.getHeightAt(-16, 7), 7);
      const target5 = new ScienceTarget(this.scene, ghData, t5Pos);
      target5.facilityType = 'greenhouse';
      this.scienceTargets.push(target5);

      // 6. Solar Panel Dust Accumulator
      const solarData = {
        id: 'solar_field',
        title: 'Photovoltaic Array & Dust Deposition Monitor',
        planet: 'Mars',
        instrument: 'Perseverance MEDA RDS Photodiode Baseline',
        dataType: 'MEASURED',
        measuredData: 'Dust deposition factor: f_dust = 0.25 (25% solar attenuation).',
        calculatedValue: 'Power generation restored upon cleaning.',
        simplifiedExplanation: 'Fine Martian dust settles onto solar arrays over time. Sweep dust away to keep battery storage at 100%!',
        kidTip: 'Sweep dust away to restore full solar power!'
      };
      const t6Pos = new THREE.Vector3(-8, this.environment.getHeightAt(-8, -26), -26);
      const target6 = new ScienceTarget(this.scene, solarData, t6Pos);
      target6.facilityType = 'solar_panels';
      this.scienceTargets.push(target6);

    } else {
      // Moon Targets
      const t1Data = SCIENCE_DATABASE.find((s) => s.id === 'lend_ice') || SCIENCE_DATABASE[0];
      const t1Pos = new THREE.Vector3(28, this.environment.getHeightAt(28, 25), 25);
      const target1 = new ScienceTarget(this.scene, t1Data, t1Pos);
      this.scienceTargets.push(target1);

      const t2Data = SCIENCE_DATABASE.find((s) => s.id === 'diviner_cold_trap') || SCIENCE_DATABASE[3];
      const t2Pos = new THREE.Vector3(15, this.environment.getHeightAt(15, -15), -15);
      const target2 = new ScienceTarget(this.scene, t2Data, t2Pos);
      this.scienceTargets.push(target2);

      const t3Data = SCIENCE_DATABASE.find((s) => s.id === 'donki_solar_storm') || SCIENCE_DATABASE[4];
      const t3Pos = new THREE.Vector3(-14, this.environment.getHeightAt(-14, -22), -22);
      const target3 = new ScienceTarget(this.scene, t3Data, t3Pos);
      this.scienceTargets.push(target3);
    }
  }

  setInMission(inMission) {
    this.inMission = inMission;
  }

  switchDestination(destId) {
    this.destinationId = destId;
    storage.state.selectedDestination = destId;
    storage.save();

    const dest = DESTINATIONS[destId] || DESTINATIONS.mars;
    this.scene.background = new THREE.Color(dest.skyColor);
    this.ambientLight.color.setHex(dest.ambientLight);
    this.sunLight.color.setHex(dest.sunLight);

    this.buildWorld();
    this.setupTargets();

    this.astronaut.position.set(0, 0, 0);
    this.rover.position.set(4, 0, 8);
    this.rover.rotationY = 0;
    this.rover.speed = 0;
    this.setRoverMode(false);
  }

  switchCharacter(charId) {
    this.characterId = charId;
    this.astronaut.setCharacter(charId);
  }

  setRoverMode(isRover) {
    this.isRoverActive = isRover;
    this.rover.setOccupied(isRover);
    this.astronaut.setVisible(!isRover);

    if (isRover) {
      this.astronaut.position.copy(this.rover.position);
    } else {
      this.astronaut.position.set(
        this.rover.position.x - Math.cos(this.rover.rotationY) * 2.2,
        this.rover.position.y,
        this.rover.position.z + Math.sin(this.rover.rotationY) * 2.2
      );
    }

    if (this.uiManager && this.uiManager.hud) {
      this.uiManager.hud.setVehicleMode(isRover);
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.input.update();

    const activeEntity = this.isRoverActive ? this.rover : this.astronaut;
    const activePos = activeEntity.position;
    const activeRotY = this.isRoverActive ? this.rover.rotationY : this.astronaut.rotationY;

    // Camera targeting
    this.cameraController.setTarget(activePos);
    this.cameraController.update(delta, this.input);

    // Entity updates
    if (this.isRoverActive) {
      this.rover.update(delta, this.input, this.environment);
    } else {
      this.astronaut.update(delta, this.input, this.cameraController.getYaw(), this.environment);
      this.rover.update(delta, { moveX: 0, moveZ: 0 }, this.environment);
    }

    this.orbitBot.update(delta, activePos, activeRotY);
    this.scienceTargets.forEach((t) => t.update(delta));

    // Survival Constraints & Travel Limitations
    const distFromBase = Math.sqrt(activePos.x * activePos.x + activePos.z * activePos.z);

    // 1. Safety Tether Constraint (180m warning, 220m boundary wall)
    if (distFromBase > 180) {
      if (this.uiManager && this.uiManager.hud) {
        this.uiManager.hud.setTetherWarning(true);
      }
      this.tetherWarningCooldown += delta;
      if (this.tetherWarningCooldown > 4.0) {
        this.tetherWarningCooldown = 0;
        audio.playAlarm();
      }
    } else if (this.uiManager && this.uiManager.hud) {
      this.uiManager.hud.setTetherWarning(false);
    }

    if (distFromBase > 220) {
      activePos.x = (activePos.x / distFromBase) * 220;
      activePos.z = (activePos.z / distFromBase) * 220;
    }

    // 2. Suit Oxygen Depletion on foot vs refilling in base/rover
    if (!this.isRoverActive && !this.inHabitatInterior) {
      this.suitOxygen = Math.max(0, this.suitOxygen - delta * 0.15);
      if (this.suitOxygen <= 0) {
        storage.state.marsState.crewHealth = Math.max(0, storage.state.marsState.crewHealth - delta * 1.5);
      }
    } else {
      this.suitOxygen = Math.min(100, this.suitOxygen + delta * 30.0);
    }

    // 3. Rover Battery Depletion when driving vs recharging on pad
    if (this.isRoverActive) {
      if (this.input.moveZ !== 0 || this.input.moveX !== 0) {
        this.roverBattery = Math.max(0, this.roverBattery - delta * 0.22);
      }
    } else {
      const roverDistToBase = Math.sqrt(this.rover.position.x * this.rover.position.x + this.rover.position.z * this.rover.position.z);
      if (roverDistToBase < 8) {
        this.roverBattery = Math.min(100, this.roverBattery + delta * 12.0);
      }
    }

    // 4. Update HUD Vitals
    if (this.uiManager && this.uiManager.hud) {
      this.uiManager.hud.updateVitals(this.suitOxygen, this.roverBattery, distFromBase, this.isRoverActive);
    }

    // 5. Update Habitat Camp Animations
    if (this.habitatCamp) {
      this.habitatCamp.update(delta);
    }

    // 6. Update Mission Manager (Tasks & 3D Beacon)
    if (this.missionManager) {
      this.missionManager.update(delta, activePos);
    }

    // 7. Interactive Triggers
    if (this.inMission && this.uiManager) {
      this.handleInteractions(activePos);
    }

    if (this.uiManager) {
      this.uiManager.update(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }

  handleInteractions(playerPos) {
    let promptShown = false;

    // 0. Eating food with [C] key
    if (this.input.consumeConsumeFood()) {
      if (this.habitatCamp) {
        this.habitatCamp.consumeFood();
        this.missionManager.triggerAction('consume_food');
        this.uiManager.hud.showFloatingNotice('🍎 CONSUMED ASTRONAUT RATION! (+20% Health)');
      }
    }

    // 1. Rover Boarding / Disembarking
    const distToRover = playerPos.distanceTo(this.rover.position);
    if (!this.isRoverActive && distToRover < 3.5) {
      this.uiManager.hud.showPrompt('V', 'BOARD 6-WHEEL ROVER');
      promptShown = true;
      if (this.input.consumeToggleVehicle()) {
        audio.playClick();
        this.setRoverMode(true);
      }
    } else if (this.isRoverActive) {
      if (this.input.consumeToggleVehicle()) {
        audio.playClick();
        this.setRoverMode(false);
      }
    }

    // 2. 3D Airlock Door Entry / Exit at (-10.5, 1.4, -10)
    const distToAirlock = playerPos.distanceTo(new THREE.Vector3(-10.5, playerPos.y, -10));
    if (!this.isRoverActive && distToAirlock < 3.2) {
      const isInside = playerPos.x < -11;
      const label = isInside ? 'EXIT TO PLANETARY SURFACE' : 'ENTER 3D HABITAT INTERIOR';
      this.uiManager.hud.showPrompt('E', label);
      promptShown = true;
      if (this.input.consumeInteract()) {
        audio.playClick();
        if (isInside) {
          this.astronaut.position.set(-8.0, 0.2, -10);
          this.inHabitatInterior = false;
          this.uiManager.hud.showFloatingNotice('🚪 EXITED AIRLOCK ONTO SURFACE');
        } else {
          this.astronaut.position.set(-14.5, 0.4, -10);
          this.inHabitatInterior = true;
          this.missionManager.triggerAction('enter_airlock');
          this.uiManager.hud.showFloatingNotice('🏠 ENTERED 3D HABITAT INTERIOR');
        }
      }
    }

    // 3. 3D Greenhouse Fresh Crop Harvest inside at (-16, 0.5, 7)
    const distToGreenhouse = playerPos.distanceTo(new THREE.Vector3(-16, playerPos.y, 7));
    if (!this.isRoverActive && distToGreenhouse < 3.8) {
      this.uiManager.hud.showPrompt('E', 'HARVEST FRESH 3D CROPS');
      promptShown = true;
      if (this.input.consumeInteract()) {
        if (this.habitatCamp) {
          this.habitatCamp.harvestCrops();
          this.missionManager.triggerAction('harvest_crops');
          this.uiManager.hud.showFloatingNotice('🌱 HARVESTED 25 FRESH MARTIAN TOMATOES!');
        }
      }
    }

    // 4. Solar Panels Dust Sweeping
    if (this.habitatCamp && this.habitatCamp.solarPanels) {
      for (let i = 0; i < this.habitatCamp.solarPanels.length; i++) {
        const p = this.habitatCamp.solarPanels[i];
        const dist = playerPos.distanceTo(p.group.position);
        if (dist < 3.2 && !p.isClean && !this.isRoverActive) {
          this.uiManager.hud.showPrompt('E', `SWEEP SOLAR PANEL #${i + 1} DUST`);
          promptShown = true;
          if (this.input.consumeInteract()) {
            this.habitatCamp.sweepPanel(i);
            storage.state.marsState.power = Math.min(100, storage.state.marsState.power + 15);
            storage.save();
            this.missionManager.triggerAction('sweep_panels');
          }
          break;
        }
      }
    }

    // 5. Water Extraction Drill Rig at (20, 0, 14)
    const distToDrill = playerPos.distanceTo(new THREE.Vector3(20, playerPos.y, 14));
    if (!this.isRoverActive && distToDrill < 4.0) {
      this.uiManager.hud.showPrompt('E', 'ACTIVATE SWIM WATER DRILL');
      promptShown = true;
      if (this.input.consumeInteract()) {
        audio.playClick();
        storage.state.marsState.water = Math.min(100, storage.state.marsState.water + 20);
        storage.save();
        this.missionManager.triggerAction('drill_water');
        this.uiManager.hud.showFloatingNotice('💧 DRILL ACTIVE: PUMPING WATER ICE');
      }
    }

    // 6. Radiation Bunker Shelter at (-16, 0.5, -14.8)
    const distToBunker = playerPos.distanceTo(new THREE.Vector3(-16, playerPos.y, -14.8));
    if (!this.isRoverActive && distToBunker < 3.0) {
      this.uiManager.hud.showPrompt('E', 'ENTER RADIATION BUNKER');
      promptShown = true;
      if (this.input.consumeInteract()) {
        audio.playSuccess();
        this.missionManager.triggerAction('shelter_bunker');
        this.uiManager.hud.showFloatingNotice('🛡️ SHELTERED: 100% RADIATION PROTECTION');
      }
    }

    // 7. Cargo Crane at (26, 0, -18)
    const distToCrane = playerPos.distanceTo(new THREE.Vector3(26, playerPos.y, -18));
    if (!this.isRoverActive && distToCrane < 4.2) {
      this.uiManager.hud.showPrompt('E', 'BALANCE 400kg RETURN CARGO');
      promptShown = true;
      if (this.input.consumeInteract()) {
        this.uiManager.cargoDecisionInterface.show();
        this.missionManager.triggerAction('balance_cargo');
      }
    }

    // 8. MAV Rocket Launch Pad at (32, 0, -18)
    const distToMav = playerPos.distanceTo(new THREE.Vector3(32, playerPos.y, -18));
    if (!this.isRoverActive && distToMav < 6.0) {
      this.uiManager.hud.showPrompt('E', 'INSPECT MAV & RUN CHECKLIST');
      promptShown = true;
      if (this.input.consumeInteract()) {
        this.uiManager.departureChecklistInterface.show();
        this.missionManager.triggerAction('inspect_mav');
        this.missionManager.triggerAction('execute_checklist');
        this.missionManager.triggerAction('board_capsule');
        this.missionManager.triggerAction('launch_mav');
      }
    }

    // 9. Standard Science Targets
    let nearestTarget = null;
    let nearestDist = 999;
    this.scienceTargets.forEach((t) => {
      const dist = t.getDistanceTo(playerPos);
      if (dist < t.interactionRadius && dist < nearestDist) {
        nearestDist = dist;
        nearestTarget = t;
      }
    });

    if (nearestTarget && !this.isRoverActive && !promptShown) {
      this.uiManager.hud.showPrompt('E', `INVESTIGATE: ${nearestTarget.data.title.toUpperCase()}`);
      promptShown = true;
      this.orbitBot.setEmotion('scan');

      if (this.input.consumeInteract()) {
        this.missionManager.triggerAction('interact_target');
        this.uiManager.scannerPanel.openWithTarget(nearestTarget);
      }
    } else if (!nearestTarget && !promptShown) {
      this.orbitBot.setEmotion('normal');
    }

    if (!promptShown) {
      this.uiManager.hud.hidePrompt();
    }
  }
}
