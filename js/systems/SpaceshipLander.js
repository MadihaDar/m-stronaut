/* ============================================================
   FRONTIER: MISSION ACADEMY — Spaceship Exploration Lander Module
   Authentic multi-stage landing craft, detailed walk-in cabin interior
   (bunks, flight computers, airlock), retro thrusters, sub-orbital flight
   and Safe Zone storm escape mechanics
   ============================================================ */

import * as THREE from 'three';

export class SpaceshipLander {
  constructor(scene, engine, position = new THREE.Vector3(-25, 0, -20), getTerrainHeight = null) {
    this.scene = scene;
    this.engine = engine;
    this.basePosition = position.clone();
    this.getTerrainHeight = getTerrainHeight;

    const groundY = this.getTerrainHeight ? this.getTerrainHeight(this.basePosition.x, this.basePosition.z) : 0;
    this.basePosition.y = groundY;

    this.group = new THREE.Group();
    this.group.position.copy(this.basePosition);

    this.isLanding = false;
    this.landingProgress = 1.0;
    this.hatchOpen = true;
    this.interiorActive = false;

    // Egress / Boarding animation state
    this.egressActive = false;
    this.boardingActive = false;
    this.egressProgress = 0;
    this.egressDuration = 2.8;
    this.egressCallback = null;
    this.characterRef = null;

    // Flight / Takeoff state (Phase 5 Kinematic Rigid Body)
    this.isFlying = false;
    this.flightPhase = 'grounded'; // 'grounded' | 'ascending' | 'orbital' | 'descending'
    this.flightTime = 0;
    this.flightVelocity = new THREE.Vector3();
    this.orbitAltitude = 85.0;
    this.isOccupied = true; // Starts occupied (inside spacecraft!)
    this.safeZoneTarget = null;
    this.safeZoneMesh = null;

    this._buildMesh();
    this.scene.add(this.group);
  }

  _buildMesh() {
    // 1. Heat Shield Base
    const shieldGeo = new THREE.CylinderGeometry(3.1, 3.2, 0.6, 24);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x1f2228,
      roughness: 0.8,
      metalness: 0.2
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.y = 0.5;
    this.group.add(shield);

    // 2. Main Pressurized Hull (Artemis / Orion theme)
    const hullGeo = new THREE.CylinderGeometry(2.4, 3.0, 6.5, 24);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xf0f2f5,
      roughness: 0.35,
      metalness: 0.25
    });
    this.hullMesh = new THREE.Mesh(hullGeo, hullMat);
    this.hullMesh.position.y = 4.0;
    this.group.add(this.hullMesh);

    // Command Nose Cone
    const coneGeo = new THREE.ConeGeometry(2.4, 2.8, 24);
    const cone = new THREE.Mesh(coneGeo, hullMat);
    cone.position.y = 8.6;
    this.group.add(cone);

    // NASA Blue Mission Stripe
    const stripeGeo = new THREE.CylinderGeometry(2.72, 2.76, 0.5, 24);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0x0055cc,
      roughness: 0.4,
      metalness: 0.4
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 3.6;
    this.group.add(stripe);

    // 3. Cockpit Observation Windows (Upper Flight Deck)
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x004488,
      emissiveIntensity: 0.4
    });
    [-0.5, 0, 0.5].forEach((offsetAngle) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.15), windowMat);
      win.position.set(Math.sin(offsetAngle) * 2.3, 6.2, Math.cos(offsetAngle) * 2.3);
      win.rotation.y = offsetAngle;
      this.group.add(win);
    });

    // 4. Hydraulic Landing Struts & Footpads (4 legs)
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x778899, roughness: 0.3, metalness: 0.8 });
    const padMat = new THREE.MeshStandardMaterial({ color: 0x333d47, roughness: 0.6, metalness: 0.5 });
    this.legs = [];

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const legGroup = new THREE.Group();

      const upperStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8), strutMat);
      upperStrut.position.set(0, 1.4, 0);
      upperStrut.rotation.z = 0.55;

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.15, 6), padMat);
      pad.position.set(1.4, 0.1, 0);

      legGroup.add(upperStrut);
      legGroup.add(pad);
      legGroup.position.set(Math.cos(angle) * 2.6, 0, Math.sin(angle) * 2.6);
      legGroup.rotation.y = -angle;

      this.group.add(legGroup);
      this.legs.push(legGroup);
    }

    // 5. Central Gimballed Retro-Rocket Engine Bell
    const engineGeo = new THREE.CylinderGeometry(0.3, 0.9, 1.1, 16);
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
    const engineBell = new THREE.Mesh(engineGeo, engineMat);
    engineBell.position.y = 0.1;
    this.group.add(engineBell);

    // Retro-thruster plume
    const plumeGeo = new THREE.ConeGeometry(1.2, 5.0, 16);
    this.plumeMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    this.plume = new THREE.Mesh(plumeGeo, this.plumeMat);
    this.plume.rotation.x = Math.PI;
    this.plume.position.y = -2.5;
    this.group.add(this.plume);

    this.plumeLight = new THREE.PointLight(0x00e5ff, 0, 25);
    this.plumeLight.position.set(0, -1.0, 0);
    this.group.add(this.plumeLight);

    // 6. Airlock Hatch Door (Front +Z face)
    const hatchFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 2.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.5 })
    );
    hatchFrame.position.set(0, 2.2, 2.85);
    this.group.add(hatchFrame);

    this.hatchDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.9, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x4a9eff, metalness: 0.7, roughness: 0.3 })
    );
    this.hatchDoor.position.set(0, 2.2, 2.92);
    this.group.add(this.hatchDoor);

    // 7. Deployable Boarding Ramp
    const rampGeo = new THREE.BoxGeometry(1.1, 0.08, 3.8);
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.7, metalness: 0.3 });
    this.rampMesh = new THREE.Mesh(rampGeo, rampMat);
    this.rampMesh.position.set(0, 1.1, 4.4);
    this.rampMesh.rotation.x = 0.55;
    this.group.add(this.rampMesh);

    // 8. REALISTIC SPACECRAFT CABIN INTERIOR (Phase 4 Overhaul)
    this._buildInterior();

    // 9. Ground Landing Pad Marking
    const padMarkGeo = new THREE.RingGeometry(3.5, 4.2, 32);
    const padMarkMat = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35
    });
    const padMark = new THREE.Mesh(padMarkGeo, padMarkMat);
    padMark.rotation.x = -Math.PI / 2;
    padMark.position.y = 0.03;
    this.group.add(padMark);
  }

  _buildInterior() {
    this.interiorGroup = new THREE.Group();
    this.interiorGroup.position.set(0, 2.4, 0);

    // Interior composite deck floor
    const floorGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.12, 24);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a2332, roughness: 0.5, metalness: 0.3 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    this.interiorGroup.add(floor);

    // Interior Curved Insulated Wall Lining
    const innerWallGeo = new THREE.CylinderGeometry(2.18, 2.18, 2.3, 24, 1, true, Math.PI * 0.25, Math.PI * 1.5);
    const innerWallMat = new THREE.MeshStandardMaterial({
      color: 0x2d3a4d,
      roughness: 0.6,
      side: THREE.BackSide
    });
    const innerWall = new THREE.Mesh(innerWallGeo, innerWallMat);
    innerWall.position.y = 1.15;
    this.interiorGroup.add(innerWall);

    // Flight Deck Commander Seat
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x113355, roughness: 0.4, metalness: 0.3 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.55), seatMat);
    seat.position.set(0, 0.5, -0.6);
    this.interiorGroup.add(seat);

    // Primary Flight Telemetry Console & Nav Screens
    const consoleGeo = new THREE.BoxGeometry(1.6, 0.75, 0.55);
    const consoleMat = new THREE.MeshStandardMaterial({ color: 0x0a111a, metalness: 0.8, roughness: 0.2 });
    const consoleMesh = new THREE.Mesh(consoleGeo, consoleMat);
    consoleMesh.position.set(0, 0.65, -1.25);
    this.interiorGroup.add(consoleMesh);

    // Holographic Flight Instrument Display
    const screenGeo = new THREE.PlaneGeometry(1.3, 0.5);
    const screenMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      side: THREE.DoubleSide
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 1.0, -1.1);
    screen.rotation.x = -0.32;
    this.interiorGroup.add(screen);

    // Multi-display Telemetry Screen
    const screenGeo2 = new THREE.PlaneGeometry(0.7, 0.35);
    const screenMat2 = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      side: THREE.DoubleSide
    });
    const screen2 = new THREE.Mesh(screenGeo2, screenMat2);
    screen2.position.set(-0.55, 1.0, -1.1);
    screen2.rotation.x = -0.32;
    screen2.rotation.y = 0.25;
    this.interiorGroup.add(screen2);

    // ── Crew Bunks / Sleep Quarters (Stacked Beds) ──
    const bunkFrameMat = new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.4 });
    const bunkBedMat = new THREE.MeshStandardMaterial({ color: 0x3d5a80, roughness: 0.7 });

    // Lower Bunk
    const bunk1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.15, 1.6), bunkBedMat);
    bunk1.position.set(1.4, 0.35, -0.2);
    this.interiorGroup.add(bunk1);

    // Upper Bunk
    const bunk2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.15, 1.6), bunkBedMat);
    bunk2.position.set(1.4, 1.15, -0.2);
    this.interiorGroup.add(bunk2);

    // Bunk structural support ladder
    const bunkLadder = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 0.1), bunkFrameMat);
    bunkLadder.position.set(1.05, 0.7, -0.9);
    this.interiorGroup.add(bunkLadder);

    // ── Cryogenic Oxygen & Water Life Support Terminal ──
    const o2StationGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.3, 14);
    const o2StationMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x0088cc,
      emissiveIntensity: 0.7
    });
    const o2Station = new THREE.Mesh(o2StationGeo, o2StationMat);
    o2Station.position.set(-1.4, 0.7, 0.1);
    this.interiorGroup.add(o2Station);

    // ── Interior Airlock Hatch & Cycling Console ──
    const airlockFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.0, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x2d3a4d, metalness: 0.6 })
    );
    airlockFrame.position.set(0, 1.1, 1.95);
    this.interiorGroup.add(airlockFrame);

    // Airlock Status Light (Green = Pressurized, Amber = Cycling, Red = Depressurized)
    this.airlockLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.08, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 1.2 })
    );
    this.airlockLed.position.set(0, 1.95, 1.9);
    this.interiorGroup.add(this.airlockLed);

    // Interior Ambient Lights
    this.interiorLight = new THREE.PointLight(0x88ccff, 1.4, 6.5);
    this.interiorLight.position.set(0, 1.8, 0);
    this.interiorGroup.add(this.interiorLight);

    this.group.add(this.interiorGroup);
  }

  getInteriorPlayerSpawn() {
    return new THREE.Vector3(
      this.basePosition.x,
      this.basePosition.y + 2.45,
      this.basePosition.z - 0.2
    );
  }

  /* ── Animate astronaut walking OUT of the lander (egress) ── */
  startEgress(character, onDone = null) {
    this.characterRef = character;
    this.egressCallback = onDone;
    this.egressActive = true;
    this.boardingActive = false;
    this.egressProgress = 0;
    this.isOccupied = false;

    // Airlock status cycling
    if (this.airlockLed) {
      this.airlockLed.material.color.setHex(0xffaa00);
      this.airlockLed.material.emissive.setHex(0xffaa00);
    }
    this.engine.audio.playAirlockHiss();

    character.position.set(this.basePosition.x, this.basePosition.y + 2.45, this.basePosition.z);
    character.setVisible(true);
  }

  /* ── Animate astronaut walking INTO the lander (boarding/ingress) ── */
  startBoarding(character, onDone = null) {
    if (this.isOccupied) return;
    this.characterRef = character;
    this.boardingCallback = onDone;
    this.boardingActive = true;
    this.egressActive = false;
    this.boardingProgress = 0;
    this.boardingDuration = 2.4;

    this._boardStartPos = character.position.clone();
    this._boardEndPos = new THREE.Vector3(
      this.basePosition.x,
      this.basePosition.y + 2.45,
      this.basePosition.z - 0.2
    );
  }

  /* Alias to prevent TypeError */
  startIngress(character, onDone = null) {
    return this.startBoarding(character, onDone);
  }

  /**
   * Phase 5: Spaceship Flight Mode (Piloting the ship during storms)
   */
  startFlight(safeZoneCoords = null) {
    if (this.isFlying) return;
    this.isFlying = true;
    this.flightPhase = 'ascending';
    this.flightTime = 0;
    this.safeZoneTarget = safeZoneCoords;

    this.plumeMat.opacity = 0.95;
    this.plumeLight.intensity = 5.5;
    this.engine.audio.playThrusterRumble();

    // Spawn massive Safe Zone purple aura if target specified
    if (safeZoneCoords) {
      this._spawnSafeZoneAura(safeZoneCoords);
    }

    this.engine.showNotification('🚀 SUB-ORBITAL FLIGHT ENGAGED: Pilot spaceship towards the Safe Zone!', 'success', 6000);
  }

  _spawnSafeZoneAura(targetPos) {
    if (this.safeZoneMesh) {
      this.scene.remove(this.safeZoneMesh);
    }

    const groundY = this.getTerrainHeight ? this.getTerrainHeight(targetPos.x, targetPos.z) : (targetPos.y || 0);

    this.safeZoneMesh = new THREE.Group();
    this.safeZoneMesh.position.set(targetPos.x, groundY, targetPos.z);

    // Massive 9m wide, 25m tall purple sanctuary cylinder
    const cylGeo = new THREE.CylinderGeometry(9.0, 9.0, 26.0, 32, 1, true);
    const cylMat = new THREE.MeshBasicMaterial({
      color: 0x9933ff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const cyl = new THREE.Mesh(cylGeo, cylMat);
    cyl.position.y = 13.0;
    this.safeZoneMesh.add(cyl);

    // Huge glowing ground sanctuary ring
    const ringGeo = new THREE.RingGeometry(8.0, 9.5, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xcc66ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.15;
    this.safeZoneMesh.add(ring);

    this.scene.add(this.safeZoneMesh);
  }

  startLanding() {
    if (!this.isFlying || this.flightPhase !== 'orbital') return;
    this.flightPhase = 'descending';
    this.flightTime = 0;

    const groundY = this.getTerrainHeight ? this.getTerrainHeight(this.group.position.x, this.group.position.z) : 0;
    this.basePosition.set(this.group.position.x, groundY, this.group.position.z);

    this.plumeMat.opacity = 0.8;
    this.plumeLight.intensity = 4.0;
    this.engine.audio.playThrusterRumble();
    this.engine.showNotification('🛬 INITIATING RE-ENTRY DESCENT: Touching down on planetary surface...', 'info', 4500);
  }

  update(dt, playerPos = null) {
    // 1. Egress animation (astronaut walking down ramp outside)
    if (this.egressActive && this.characterRef) {
      this.egressProgress = Math.min(1.0, this.egressProgress + dt / this.egressDuration);
      const t = 1 - Math.pow(1 - this.egressProgress, 2);
      const startX = this.basePosition.x;
      const startY = this.basePosition.y + 2.45;
      const startZ = this.basePosition.z;

      const endX = this.basePosition.x;
      const endY = this.basePosition.y + 0.1;
      const endZ = this.basePosition.z + 5.5;

      this.characterRef.position.set(
        startX + (endX - startX) * t,
        startY + (endY - startY) * t,
        startZ + (endZ - startZ) * t
      );

      if (this.egressProgress >= 1.0) {
        this.egressActive = false;
        this.isOccupied = false;
        this.interiorActive = false;
        if (this.airlockLed) {
          this.airlockLed.material.color.setHex(0x00ff88);
          this.airlockLed.material.emissive.setHex(0x00ff88);
        }
        if (this.egressCallback) this.egressCallback();
      }
      return;
    }

    // 2. Boarding animation (astronaut walking into cabin)
    if (this.boardingActive && this.characterRef) {
      this.boardingProgress = Math.min(1.0, (this.boardingProgress || 0) + dt / this.boardingDuration);
      const t = 1 - Math.pow(1 - this.boardingProgress, 2);
      this.characterRef.position.lerpVectors(this._boardStartPos, this._boardEndPos, t);

      if (this.boardingProgress >= 1.0) {
        this.boardingActive = false;
        this.isOccupied = true;
        this.interiorActive = true;
        this.characterRef.setVisible(false);

        // Life support replenishment
        if (this.engine.resources) {
          this.engine.resources.set('oxygen', 100);
          this.engine.resources.set('water', 100);
          this.engine.resources.healCrew(25);
        }
        if (this.engine.radiation) this.engine.radiation.onEnterShelter();

        this.engine.audio.playAirlockHiss();
        this.engine.showNotification('🛸 ABOARD SPACECRAFT: Cabin pressurized. Press [L] for Flight Mode or [E] to Exit.', 'info', 5000);
        if (this.boardingCallback) this.boardingCallback();
      }
      return;
    }

    // 3. Sub-Orbital Flight Mechanics (Phase 5)
    if (this.isFlying) {
      this.flightTime += dt;
      const flicker = 0.85 + Math.random() * 0.3;
      this.plume.scale.set(flicker, 1.0 + Math.random() * 0.25, flicker);
      this.plumeLight.intensity = 4.5 * flicker;

      if (this.flightPhase === 'ascending') {
        const prog = Math.min(1.0, this.flightTime / 5.5);
        const ease = 1 - Math.pow(1 - prog, 3);
        this.group.position.y = this.basePosition.y + this.orbitAltitude * ease;
        if (prog >= 1.0) {
          this.flightPhase = 'orbital';
          this.plumeMat.opacity = 0.35; // idle orbital burn
          this.engine.showNotification('🛸 SUB-ORBITAL FLIGHT: Use WASD to steer towards the massive Purple Safe Zone!', 'info', 6000);
        }
      } else if (this.flightPhase === 'orbital') {
        // Steering with WASD / joystick
        if (this.engine.input) {
          const move = this.engine.input.getMovementVector();
          if (Math.abs(move.x) > 0.05 || Math.abs(move.z) > 0.05) {
            this.group.position.x += move.x * 24.0 * dt;
            this.group.position.z += move.z * 24.0 * dt;
            this.group.rotation.y += move.x * 0.8 * dt;
          }
        }

        // Check if inside Safe Zone
        if (this.safeZoneTarget) {
          const distToSafe = Math.hypot(
            this.group.position.x - this.safeZoneTarget.x,
            this.group.position.z - this.safeZoneTarget.z
          );
          if (distToSafe <= 10.0) {
            this.engine.showNotification('📍 SAFE ZONE OVERFLYING: Press [L] to Initiate Landing!', 'success', 3000);
          }
        }
      } else if (this.flightPhase === 'descending') {
        const prog = Math.min(1.0, this.flightTime / 5.0);
        const ease = 1 - Math.pow(1 - (1 - prog), 3);
        this.group.position.y = this.basePosition.y + this.orbitAltitude * (1 - prog);

        if (prog >= 1.0) {
          this.isFlying = false;
          this.flightPhase = 'grounded';
          this.group.position.y = this.basePosition.y;
          this.plumeMat.opacity = 0;
          this.plumeLight.intensity = 0;
          this.engine.audio.playLandSound();
          this.hatchDoor.position.x = 1.1;
          this.rampMesh.visible = true;

          // Check if landed in Safe Zone
          if (this.safeZoneTarget) {
            const distToSafe = Math.hypot(
              this.group.position.x - this.safeZoneTarget.x,
              this.group.position.z - this.safeZoneTarget.z
            );
            if (distToSafe <= 14.0) {
              if (this.safeZoneMesh) this.safeZoneMesh.visible = false;
              this.engine.emit('storm:evaded', { location: this.basePosition });
              this.engine.showNotification('★ STORM SURVIVED! Lander secured in Geological Sanctuary Safe Zone! (+500 PTS)', 'success', 7000);
              this.engine.audio.playSuccess();
            }
          }
        }
      }
      return;
    }

    // 4. Proximity & Door Prompts
    if (playerPos && !this.isOccupied && this.hatchOpen) {
      const d = playerPos.distanceTo(this.group.position);
      this._nearPlayer = d <= 5.5;
      if (d <= 4.0 && this.engine.resources) {
        if (this.engine.resources.getPercent('oxygen') < 99) this.engine.resources.modify('oxygen', 0.1 * dt);
        if (this.engine.resources.getPercent('water') < 99) this.engine.resources.modify('water', 0.05 * dt);
      }
    } else {
      this._nearPlayer = false;
    }
  }

  getColliders() {
    return [
      {
        type: 'cylinder',
        pos: { x: this.basePosition.x, z: this.basePosition.z },
        radius: 3.1
      },
      ...this.legs.map((leg) => ({
        type: 'cylinder',
        pos: {
          x: this.basePosition.x + leg.position.x,
          z: this.basePosition.z + leg.position.z
        },
        radius: 0.75
      }))
    ];
  }

  getPosition() {
    return this.group.position;
  }
}
