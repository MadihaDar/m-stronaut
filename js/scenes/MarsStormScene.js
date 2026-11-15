/* ============================================================
   FRONTIER: MISSION ACADEMY — Mars Campaign: Mission M03
   VALLES MARINERIS: CANYON RIM WEATHER & DUST STORM RESCUE
   - 4,000 km grand canyon rim precipice dropping into the abyss
   - Atmospheric dust storm transmission & Beer-Lambert extinction
   - Swirling dust particles & cool blue sunset scattering
   - Mandatory Tradeoff: Long-Range Radar Ping vs. Cabin Warmth (80s timer, un-closeable)
   - Rover expedition with blue route-tracking line & headlights
   - Giant 3D beacons & rewarding win state unlocking Mission 4
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../systems/CharacterController.js';
import { RoverController } from '../systems/RoverController.js';
import { SpaceshipLander } from '../systems/SpaceshipLander.js';
import { WaypointSystem } from '../systems/WaypointSystem.js';
import { MarsSimulationEngine, MARS_DATA } from '../data/mars/MarsSimulationEngine.js';

export class MarsStormScene extends BaseScene {
  constructor(engine) {
    super(engine);

    this.sim = new MarsSimulationEngine(this.engine.save);
    this.mode = 'walk';
    this.missionStage = 'STAGE1_DEPLOY_ROVER';
    this.dustTau = 0.45;
    this.stormActive = true;

    // Valles Marineris canyon rim terrain:
    // Cliff edge at z < -20 where terrain drops steeply 45 meters down!
    this._getTerrainHeight = (x, z) => {
      if (z < -22) {
        const drop = (z - (-22)) * 2.8;
        return Math.max(-55, -2 + drop);
      }
      const rim = Math.sin(x * 0.03) * 2.5 + Math.cos(z * 0.04) * 1.8;
      const ridges = Math.sin((x + z) * 0.08) * 0.6;
      return rim + ridges;
    };

    this._buildEnvironment();
    this._buildCanyonStation();
    this._buildDustStormParticles();

    // 1. Expedition Lander Craft
    this.lander = new SpaceshipLander(this.scene, this.engine, new THREE.Vector3(-25, 0, 15), this._getTerrainHeight);

    // 2. Guided 3D Waypoint System
    this.waypointSystem = new WaypointSystem(this.scene, this.engine, this._getTerrainHeight);

    // 3. Controllers
    this.character = new CharacterController(this.scene, this.engine, this._getTerrainHeight);
    this.character.setGravity(7.5, false); // Mars 0.38g
    this.lander.characterRef = this.character;

    // Rigid body colliders (Habitat station & canyon safety railings)
    const habCol = { type: 'cylinder', pos: { x: 0, z: 20 }, radius: 6.5 };
    const cacheCol = { type: 'cylinder', pos: { x: 38, z: -8 }, radius: 2.0 };
    this.character.setColliders([...this.lander.getColliders(), habCol, cacheCol]);

    // 4. Pressurized Rover
    this.rover = new RoverController(this.scene, this.engine, new THREE.Vector3(-18, 0, 8), this._getTerrainHeight);
    this.rover.setColliders([...this.lander.getColliders(), habCol, cacheCol]);
    this.rover.setRouteTrailColor(0x38bdf8); // Blue route trail line
    this.rover.setRouteTrailVisible(true);
    this._addRoverHeadlights();

    this.camera = this.character.getCamera();

    // Wind sound audio timer
    this._windAudioTimer = 0;
  }

  _addRoverHeadlights() {
    this.headlights = new THREE.SpotLight(0xfff1e6, 4.0, 55, Math.PI / 4, 0.35, 1.2);
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
    // Dynamic Martian dust storm atmosphere:
    // Starts deep ochre/amber, with an eerie cool blue solar scattering halo!
    this.skyColorAmber = new THREE.Color(0xa84824);
    this.skyColorBlueSunset = new THREE.Color(0x4a6fa5); // Martian blue scattering sunset
    this.scene.background = this.skyColorAmber.clone();
    this.scene.fog = new THREE.FogExp2(0xa84824, 0.016);

    this.ambient = new THREE.AmbientLight(0x6e2c1a, 1.2);
    this.scene.add(this.ambient);

    // Warm Sun that fades as dust tau increases
    this.sun = new THREE.DirectionalLight(0xffd5b3, 2.2);
    this.sun.position.set(130, 45, -70);
    this.sun.castShadow = true;
    this.scene.add(this.sun);

    // Cool blue sunset glow ring
    const sunsetGlowGeo = new THREE.RingGeometry(8, 24, 32);
    const sunsetGlowMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.sunsetGlow = new THREE.Mesh(sunsetGlowGeo, sunsetGlowMat);
    this.sunsetGlow.position.set(130, 45, -70);
    this.sunsetGlow.lookAt(0, 0, 0);
    this.scene.add(this.sunsetGlow);

    // Canyon Rim Terrain
    const size = 360;
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
      color: 0x9c3d20,
      roughness: 0.94,
      metalness: 0.06,
      flatShading: true
    });

    this.terrain = new THREE.Mesh(geometry, terrainMat);
    this.scene.add(this.terrain);

    // Canyon wall basalt strata markers (dark rock stripes along cliff)
    const cliffBoulders = new THREE.DodecahedronGeometry(2.0, 1);
    const cliffMat = new THREE.MeshStandardMaterial({ color: 0x421c12, roughness: 0.95 });
    for (let i = 0; i < 35; i++) {
      const b = new THREE.Mesh(cliffBoulders, cliffMat);
      const bx = (Math.random() - 0.5) * 200;
      const bz = -20 - Math.random() * 12;
      const by = this._getTerrainHeight(bx, bz);
      const s = 1.0 + Math.random() * 2.5;
      b.scale.set(s, s * 0.8, s);
      b.position.set(bx, by, bz);
      this.scene.add(b);
    }
  }

  _buildCanyonStation() {
    this.stationGroup = new THREE.Group();
    const groundY = this._getTerrainHeight(0, 20);
    this.stationGroup.position.set(0, groundY, 20);

    // Weather Station Habitat Dome
    const domeGeo = new THREE.SphereGeometry(6.5, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3, metalness: 0.4 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    this.stationGroup.add(dome);

    // Airlock Entry Portal
    const airlockGeo = new THREE.BoxGeometry(2.6, 2.8, 3.2);
    const airlockMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const airlock = new THREE.Mesh(airlockGeo, airlockMat);
    airlock.position.set(0, 1.4, 6.2);
    this.stationGroup.add(airlock);

    // Solar-Powered Weather Antenna Tower
    const mastGeo = new THREE.CylinderGeometry(0.2, 0.4, 14, 16);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(5.5, 7, 0);
    this.stationGroup.add(mast);

    // Rotating Radar Dish
    const dishGeo = new THREE.SphereGeometry(1.8, 16, 16, 0, Math.PI, 0, Math.PI * 0.5);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5 });
    this.radarDish = new THREE.Mesh(dishGeo, dishMat);
    this.radarDish.position.set(5.5, 14, 0);
    this.radarDish.rotation.x = Math.PI * 0.3;
    this.stationGroup.add(this.radarDish);

    this.scene.add(this.stationGroup);

    // Automated Emergency Supply Cache Pod (At coordinate 38, -8)
    this.supplyCacheGroup = new THREE.Group();
    const cacheY = this._getTerrainHeight(38, -8);
    this.supplyCacheGroup.position.set(38, cacheY, -8);

    const podGeo = new THREE.CylinderGeometry(1.5, 1.8, 2.5, 16);
    const podMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.3 });
    const pod = new THREE.Mesh(podGeo, podMat);
    pod.position.y = 1.25;
    this.supplyCacheGroup.add(pod);

    // Flashing Beacon Light
    this.cacheBeaconLight = new THREE.PointLight(0xf59e0b, 2.5, 20);
    this.cacheBeaconLight.position.set(0, 3.0, 0);
    this.supplyCacheGroup.add(this.cacheBeaconLight);

    this.scene.add(this.supplyCacheGroup);
  }

  _buildDustStormParticles() {
    this.particleCount = 2800;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 180;
      pos[i * 3 + 1] = Math.random() * 26;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 180;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xcc6633,
      size: 0.5,
      transparent: true,
      opacity: 0.7
    });

    this.dustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dustParticles);
  }

  onEnter() {
    this.engine.showPanel('hud');
    this.engine.hud.setLocation('MARS: VALLES MARINERIS (CANYON DUST STORM)');
    this.engine.hud.setMode('EVA SUIT MODE');

    this.missionStage = 'STAGE1_DEPLOY_ROVER';
    this.dustTau = 0.5;
    this.scene.fog.density = 0.016;

    if (!this.engine.save.getCampaignResources()) {
      const initRes = { power: 95, oxygen: 100, water: 95, food: 100, roverEnergy: 100, crewCondition: 100 };
      this.engine.save.saveCampaignResources(initRes);
      if (this.engine.resources) this.engine.resources.initMissionLevels(initRes);
    } else if (this.engine.resources) {
      this.engine.resources.initMissionLevels();
    }

    this.character.teleport(new THREE.Vector3(-22, this._getTerrainHeight(-22, 12) + 0.5, 12));
    this.character.setControlEnabled(true);
    this.rover.setControlEnabled(true);
    this.rover.teleport(new THREE.Vector3(-18, this._getTerrainHeight(-18, 8) + 0.5, 8));

    this._startStage1MountRover();

    this.engine.showNotification('⚠️ DUST STORM WARNING: High-altitude dust clouds detected by MCS! Mount rover and deploy weather beacons along canyon rim.', 'warning', 6500);
  }

  _startStage1MountRover() {
    this.missionStage = 'STAGE1_DEPLOY_ROVER';
    const roverPos = this.rover.getPosition();

    this.waypointSystem.setWaypoint({
      id: 'storm_mount_rover',
      name: 'MOUNT CANYON ROVER [R]',
      position: roverPos,
      color: 0xf59e0b,
      colorName: 'AMBER GOLD',
      bullets: [
        'Board the heavy storm-shielded pressurized rover [R]',
        'High-beam headlights and cabin environmental controls will engage',
        'Canyon winds are rising along the Valles Marineris rim'
      ],
      funFact: 'Fact: Valles Marineris plunges up to 7 kilometers deep—4 times deeper than the Grand Canyon!',
      onComplete: () => {
        if (this.mode === 'rover') {
          this._startStage2WeatherBeacon();
        } else {
          this.engine.hud.showInteractionPrompt('🚜 MUST MOUNT ROVER [R] TO PROCEED', 'R');
        }
      }
    });
  }

  _startStage2WeatherBeacon() {
    this.missionStage = 'STAGE2_WEATHER_BEACON';
    const beaconSitePos = new THREE.Vector3(12, this._getTerrainHeight(12, -15), -15);

    this.engine.audio.playTone(550, 0.2, 'triangle', 0.3);
    this.engine.showNotification('📡 CANYON RIM TRAVERSE: Drive along the rim to deploy Weather Beacon #1!', 'info', 5000);

    this.waypointSystem.setWaypoint({
      id: 'storm_weather_beacon',
      name: 'CANYON RIM WEATHER BEACON #1',
      position: beaconSitePos,
      color: 0x38bdf8,
      colorName: 'CYAN BLUE',
      bullets: [
        'Drive rover along the scenic canyon cliff edge',
        'Deploy solar-powered weather transponder',
        'Measure rising atmospheric dust opacity (Beer-Lambert extinction)'
      ],
      funFact: 'Fact: Sunsets on Mars glow a cool blue because fine red dust scatters sunlight!',
      onComplete: () => {
        if (this.mode !== 'rover') {
          this.engine.showNotification('⚠️ ROVER REQUIRED: Remain in rover for life support!', 'warning', 4000);
          return;
        }
        this._startStage3TradeoffDecision();
      }
    });
  }

  _startStage3TradeoffDecision() {
    this.missionStage = 'STAGE3_TRADEOFF';
    this.waypointSystem.clearWaypoint();

    // Trigger Mission 3 Tradeoff Dilemma: Long-Range Radar Ping vs. Cabin Warmth
    (this.engine.tradeoffs || this.engine.tradeoff).presentMarsM3Tradeoff(() => {
      this._startStage4SupplyRescue();
    });
  }

  _startStage4SupplyRescue() {
    this.missionStage = 'STAGE4_SUPPLY_RESCUE';
    const cachePos = new THREE.Vector3(38, this._getTerrainHeight(38, -8), -8);

    // Intensify dust storm fog
    this.dustTau = 2.8;
    this.scene.fog.density = 0.024;
    this.engine.audio.playTone(880, 0.25, 'sawtooth', 0.4);
    this.engine.showNotification('🌪️ STORM ARRIVAL: Visibility dropping! Drive to the Emergency Supply Cache before blackout!', 'warning', 6000);

    this.waypointSystem.setWaypoint({
      id: 'storm_supply_cache',
      name: 'EMERGENCY SUPPLY CACHE (RESCUE)',
      position: cachePos,
      color: 0xef4444,
      colorName: 'EMERGENCY RED',
      bullets: [
        'Follow amber transponder ping through howling dust winds',
        'Secure emergency food and life-support battery canisters',
        'Prepare to return to the sealed Canyon Station airlock'
      ],
      funFact: 'Fact: Planet-encircling Martian dust storms can last for 3 to 4 months!',
      onComplete: () => {
        if (this.mode !== 'rover') {
          this.engine.showNotification('⚠️ ROVER REQUIRED: Maneuver rover to hook supply cache!', 'warning', 4000);
          return;
        }
        this._startStage5ReturnStation();
      }
    });
  }

  _startStage5ReturnStation() {
    this.missionStage = 'STAGE5_RETURN_STATION';
    const stationPos = new THREE.Vector3(0, this._getTerrainHeight(0, 20), 20);

    this.engine.audio.playTone(720, 0.2, 'sine', 0.3);
    this.engine.showNotification('🚀 CACHE SECURED! Return rover to the Canyon Station airlock to seal against the storm!', 'success', 6000);

    this.waypointSystem.setWaypoint({
      id: 'storm_station_airlock',
      name: 'CANYON STATION AIRLOCK (EXTRACTION)',
      position: stationPos,
      color: 0x00ff88,
      colorName: 'EMERALD GREEN',
      bullets: [
        'Drive rover onto the station airlock docking bay',
        'Secure collected supplies inside the habitat vault',
        'Wait out the regional storm in pressurized safety'
      ],
      funFact: 'Fact: Sealed habitats protect astronauts from high-speed sandblasting dust!',
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
    this.engine.scoring.add(2000, 'Valles Marineris Storm Survived & Supply Cache Rescued');
    const scoreData = this.engine.scoring.calculateFinalScore();

    this.engine.save.recordMissionSample('mars_m3', {
      type: 'VALLES MARINERIS BASALT',
      name: 'Chasma Wall Stratified Core & Atmospheric Telemetry'
    });

    this.engine.save.completeMission('mars_m3');

    this.engine.showMissionCompletedModal({
      title: 'MISSION 3: CANYON RESCUE ACCOMPLISHED',
      subtitle: 'Valles Marineris Canyon Rim Station',
      points: 2000,
      resources: scoreData.resources,
      praise: 'Outstanding piloting through the storm, Commander Alex Morgan! You deployed weather monitors along Valles Marineris, managed life support power under high optical dust opacity, and successfully rescued the critical emergency supply cache!',
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
            this._startStage2WeatherBeacon();
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

    // 3. Swirling dust storm particles animation
    if (this.dustParticles) {
      const p = this.dustParticles.geometry.attributes.position;
      for (let i = 0; i < this.particleCount; i++) {
        let x = p.getX(i) + (18.0 + this.dustTau * 12.0) * dt;
        let y = p.getY(i) - 1.5 * dt;
        let z = p.getZ(i) + 4.0 * dt;

        if (x > 90) x = -90;
        if (y < 0) y = 24;
        if (z > 90) z = -90;

        p.setXYZ(i, x, y, z);
      }
      p.needsUpdate = true;
    }

    // 4. Rotating radar dish & flashing beacon
    if (this.radarDish) {
      this.radarDish.rotation.z += 1.8 * dt;
    }
    if (this.cacheBeaconLight) {
      this.cacheBeaconLight.intensity = 1.5 + Math.sin(Date.now() * 0.008) * 1.5;
    }

    // 5. Waypoint & navigation update
    const playerPos = this.mode === 'walk' ? this.character.getPosition() : this.rover.getPosition();
    this.waypointSystem.update(dt, playerPos);

    const playerHeading = this.mode === 'walk' ? this.character.getHeading() : this.rover.getHeading();
    this.engine.hud.updateNavigation({
      playerPos,
      playerHeading,
      basePos: { x: 0, z: 20 },
      distance: playerPos.distanceTo(new THREE.Vector3(0, 0, 20))
    });
  }
}
