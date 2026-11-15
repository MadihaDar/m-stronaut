/* ============================================================
   FRONTIER: MISSION ACADEMY — GTA-Style Third-Person Character Controller
   Polished 3rd-person camera damping, anti-clipping, rigid-body physics,
   hardcoded forward/back camera relative controls & suit headlights
   ============================================================ */

import * as THREE from 'three';
import { PhysicsEngine } from './PhysicsEngine.js';

export class CharacterController {
  constructor(scene, engine, getTerrainHeight) {
    this.scene = scene;
    this.engine = engine;
    this.getTerrainHeight = getTerrainHeight;

    this.position = new THREE.Vector3(0, 0, 10);
    this.velocity = new THREE.Vector3();
    this.heading = 0; // facing angle in radians

    this.walkSpeed = 6.0;
    this.sprintSpeed = 10.5;
    this.isControlled = true; // false during cinematic zoom-in

    // Physics Engine integration
    this.physics = new PhysicsEngine();
    this.gravity = 6.5; // m/s^2
    this.jumpImpulse = 4.8;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.isMoonGravity = false;

    // Camera orbit & damping parameters (GTA-style)
    this.cameraDistance = 6.5;
    this.targetCameraDistance = 6.5;
    this.minDistance = 0.5;
    this.maxDistance = 24.0;
    this.cameraYaw = 0;
    this.cameraPitch = 0.28; // radians above horizon
    this.isFirstPerson = false;
    this.currentCamPos = new THREE.Vector3(0, 5, 15);
    this.currentLookAt = new THREE.Vector3(0, 1.4, 10);
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Cinematic zoom state
    this.isCinematic = false;
    this.cinematicTime = 0;
    this.cinematicTargetYaw = 0;

    // Headlight / Suit light (for Day/Night cycle)
    this.headlight = null;

    this._buildMesh();
  }

  _buildMesh() {
    this.mesh = new THREE.Group();
    this.group = this.mesh; // Defensive alias

    // 1. Torso (EVA Spacesuit)
    const torsoGeo = new THREE.CylinderGeometry(0.38, 0.32, 0.8, 14);
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0xf0f2f5,
      roughness: 0.4,
      metalness: 0.15
    });
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.y = 0.9;
    this.mesh.add(torso);

    // Blue Command Accent Stripe (Alex Morgan theme)
    const stripeGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.12, 14);
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x1f75fe,
      roughness: 0.35,
      metalness: 0.3
    });
    const stripe = new THREE.Mesh(stripeGeo, accentMat);
    stripe.position.y = 1.15;
    this.mesh.add(stripe);

    // 2. Helmet
    const helmetGeo = new THREE.SphereGeometry(0.36, 18, 18);
    const helmet = new THREE.Mesh(helmetGeo, suitMat);
    helmet.position.y = 1.55;
    this.mesh.add(helmet);

    // Gold/Blue reflective Visor
    const visorGeo = new THREE.SphereGeometry(0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      roughness: 0.08,
      metalness: 0.9,
      emissive: 0x003366,
      emissiveIntensity: 0.35
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.rotation.x = Math.PI * 0.4;
    visor.position.set(0, 1.55, 0.12);
    this.mesh.add(visor);

    // 3. Life Support Backpack (PLSS) & Dual High-Pressure Oxygen Tanks
    const plssGeo = new THREE.BoxGeometry(0.52, 0.68, 0.22);
    const plssMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde4,
      roughness: 0.5,
      metalness: 0.2
    });
    const plss = new THREE.Mesh(plssGeo, plssMat);
    plss.position.set(0, 1.02, -0.26);
    this.mesh.add(plss);

    // Dual High-Pressure Oxygen Cylinders
    const o2TankGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.48, 12);
    const o2TankMat = new THREE.MeshStandardMaterial({
      color: 0xfcfdff,
      roughness: 0.2,
      metalness: 0.4
    });
    [-0.13, 0.13].forEach((tankX) => {
      const tank = new THREE.Mesh(o2TankGeo, o2TankMat);
      tank.position.set(tankX, 1.02, -0.40);
      this.mesh.add(tank);

      const capGeo = new THREE.SphereGeometry(0.09, 10, 8);
      const capTop = new THREE.Mesh(capGeo, o2TankMat);
      capTop.position.set(tankX, 1.26, -0.40);
      this.mesh.add(capTop);

      const capBot = new THREE.Mesh(capGeo, o2TankMat);
      capBot.position.set(tankX, 0.78, -0.40);
      this.mesh.add(capBot);
    });

    // Suit status LED indicator
    const ledGeo = new THREE.BoxGeometry(0.24, 0.04, 0.02);
    this.suitO2LedMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.9
    });
    const led = new THREE.Mesh(ledGeo, this.suitO2LedMat);
    led.position.set(0, 1.30, -0.38);
    this.mesh.add(led);

    // 4. Arms
    const armGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.65, 8);
    const leftArm = new THREE.Mesh(armGeo, suitMat);
    leftArm.position.set(-0.48, 0.95, 0);
    leftArm.rotation.z = 0.2;
    this.mesh.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, suitMat);
    rightArm.position.set(0.48, 0.95, 0);
    rightArm.rotation.z = -0.2;
    this.mesh.add(rightArm);

    // 5. Animated Legs
    const legGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.72, 8);
    this.leftLeg = new THREE.Mesh(legGeo, suitMat);
    this.leftLeg.position.set(-0.20, 0.38, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, suitMat);
    this.rightLeg.position.set(0.20, 0.38, 0);
    this.mesh.add(this.rightLeg);

    // 6. Suit Exploration Headlight (Spotlight)
    this.headlight = new THREE.SpotLight(0xffffff, 2.5, 40, Math.PI * 0.22, 0.35, 1.2);
    this.headlight.position.set(0, 1.6, 0.2);
    this.headlightTarget = new THREE.Object3D();
    this.headlightTarget.position.set(0, 1.2, 8);
    this.mesh.add(this.headlight);
    this.mesh.add(this.headlightTarget);
    this.headlight.target = this.headlightTarget;

    this.scene.add(this.mesh);
  }

  setGravity(g, isMoon = false) {
    this.gravity = g;
    this.isMoonGravity = isMoon;
    this.jumpImpulse = isMoon ? 6.2 : (g < 5 ? 5.4 : 4.8);
    this.walkSpeed = isMoon ? 5.4 : (g < 5 ? 5.4 : 6.0);
  }

  setColliders(colliders) {
    this.physics.setColliders(colliders);
  }

  addCollider(collider) {
    this.physics.addCollider(collider);
  }

  setObstacleObjects(objects) {
    this.obstacleObjects = objects || [];
  }

  teleport(pos, heading = null) {
    if (!pos) return;
    this.position.copy(pos);
    if (heading !== null) this.heading = heading;
    if (this.mesh) {
      this.mesh.position.set(this.position.x, this.position.y, this.position.z);
      if (heading !== null) this.mesh.rotation.y = this.heading;
    }
  }

  setControlEnabled(enabled) {
    this.isControlled = enabled;
    if (!enabled) {
      this.velocity.set(0, 0, 0);
      if (this.leftLeg && this.rightLeg) {
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
      }
    }
  }

  /**
   * Triggers a smooth dramatic cinematic camera zoom-in onto the astronaut
   */
  startCinematicZoom(durationSec = 2.8) {
    this.isCinematic = true;
    this.cinematicTime = 0;
    this.cinematicDuration = durationSec;
    this.setControlEnabled(false);
  }

  stopCinematicZoom() {
    this.isCinematic = false;
    this.setControlEnabled(true);
    this.targetCameraDistance = 6.5;
  }

  updateSuitTelemetry(resources) {
    if (!resources || !this.suitO2LedMat) return;
    const o2Pct = resources.getPercent ? resources.getPercent('oxygen') : 100;
    if (o2Pct > 50) {
      this.suitO2LedMat.emissive.setHex(0x00e5ff);
      this.suitO2LedMat.color.setHex(0x00ffcc);
      this.suitO2LedMat.emissiveIntensity = 0.9;
    } else if (o2Pct > 20) {
      this.suitO2LedMat.emissive.setHex(0xffaa00);
      this.suitO2LedMat.color.setHex(0xffaa00);
      this.suitO2LedMat.emissiveIntensity = 1.2;
    } else {
      const blink = (Date.now() % 500) < 250;
      this.suitO2LedMat.emissive.setHex(blink ? 0xff2222 : 0x440000);
      this.suitO2LedMat.color.setHex(0xff2222);
      this.suitO2LedMat.emissiveIntensity = blink ? 2.2 : 0.2;
    }
  }

  update(dt) {
    const input = this.engine.input;
    const camRot = input.getCameraRotation(); // {dx, dy} from mouse drag / arrows

    // Toggle Vision Mode (1st Person vs 3rd Person) via [V] key
    if (input.isActionPressed('viewToggle')) {
      this.toggleVisionMode();
    }

    // 1. Camera Orbit Rotation (Manual via mouse / drag / arrows)
    if (!this.isCinematic) {
      this.cameraYaw -= camRot.dx;
      // Allow looking UP into sky/stars (-0.65 rad) and looking DOWN at ground (1.35 rad)
      this.cameraPitch = Math.max(-0.65, Math.min(1.35, this.cameraPitch + camRot.dy));

      const zoom = input.getZoomDelta();
      if (Math.abs(zoom) > 0.001) {
        this.targetCameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetCameraDistance - zoom * 0.7));
        if (this.targetCameraDistance <= 1.0 && !this.isFirstPerson) {
          this.isFirstPerson = true;
          this.engine.showNotification('👁️ 1ST-PERSON VISOR VIEW', 'info', 1800);
        } else if (this.isFirstPerson && this.targetCameraDistance > 1.8) {
          this.isFirstPerson = false;
          this.engine.showNotification('🎥 3RD-PERSON CHASE CAM', 'info', 1800);
        }
      }
    } else {
      // Cinematic Camera Sweeping Zoom-In
      this.cinematicTime += dt;
      this.cameraPitch = THREE.MathUtils.lerp(this.cameraPitch, 0.18, dt * 2.5);
      this.cameraYaw += 0.35 * dt; // slow hero spin
      this.targetCameraDistance = THREE.MathUtils.lerp(this.targetCameraDistance, 2.6, dt * 3.0);
    }

    // 2. HARDCODED "GTA-STYLE" KEYBOARD CONTROLS (FORWARD / BACKWARD / STRAFE)
    // Up / W: Moves FORWARD in the camera's horizontal facing direction
    // Down / S: Moves BACKWARD
    // Right / D: Strafe Right
    // Left / A: Strafe Left
    const move = input.getMovementVector(); // { x: [-1,1], z: [-1,1] } where z < 0 is W/Up, z > 0 is S/Down
    const isMoving = this.isControlled && (Math.abs(move.x) > 0.05 || Math.abs(move.z) > 0.05);
    const speed = input.isSprinting() ? this.sprintSpeed : this.walkSpeed;

    if (isMoving) {
      // Camera horizontal forward vector (pointing FROM camera TO player)
      const forwardX = -Math.sin(this.cameraYaw);
      const forwardZ = -Math.cos(this.cameraYaw);

      // Camera horizontal right vector
      const rightX = Math.cos(this.cameraYaw);
      const rightZ = -Math.sin(this.cameraYaw);

      // move.z is -1 for Forward (W/Up), +1 for Back (S/Down) -> negate move.z
      const forwardFactor = -move.z;
      const strafeFactor  = move.x;

      const dirX = forwardX * forwardFactor + rightX * strafeFactor;
      const dirZ = forwardZ * forwardFactor + rightZ * strafeFactor;
      const dirLen = Math.hypot(dirX, dirZ);

      if (dirLen > 0.001) {
        const normDirX = dirX / dirLen;
        const normDirZ = dirZ / dirLen;

        this.velocity.x = normDirX * speed;
        this.velocity.z = normDirZ * speed;

        // Smoothly rotate character heading towards movement direction
        const targetHeading = Math.atan2(normDirX, normDirZ);
        let diff = targetHeading - this.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.heading += diff * Math.min(1.0, dt * 14.0);
      }

      // Leg swing walk animation
      const walkCycle = Math.sin(Date.now() * 0.012 * (speed / this.walkSpeed));
      if (this.leftLeg && this.rightLeg) {
        this.leftLeg.rotation.x = walkCycle * 0.55;
        this.rightLeg.rotation.x = -walkCycle * 0.55;
      }
    } else {
      this.velocity.x *= 0.65;
      this.velocity.z *= 0.65;
      if (this.leftLeg && this.rightLeg) {
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
      }
    }

    // Jump Input
    if (this.isControlled && input.isActionPressed('jump') && this.isGrounded) {
      this.verticalVelocity = this.jumpImpulse;
      this.isGrounded = false;
      this.engine.audio.playJumpSound();
      if (this.engine.resources && this.engine.resources.drain) {
        this.engine.resources.drain('water', 0.25);
        this.engine.resources.drain('oxygen', 0.2);
      }
    }

    // 3. Rigid Body Collision via PhysicsEngine
    const candidateX = this.position.x + this.velocity.x * dt;
    const candidateZ = this.position.z + this.velocity.z * dt;
    const playerRadius = 0.45;

    const colResult = this.physics.resolveCollision(candidateX, candidateZ, playerRadius, this.velocity.x, this.velocity.z);
    this.position.x = colResult.x;
    this.position.z = colResult.z;

    if (colResult.hit) {
      // Nullify momentum into obstacle for responsive sliding along walls
      const vDotN = this.velocity.x * colResult.normalX + this.velocity.z * colResult.normalZ;
      if (vDotN < 0) {
        this.velocity.x -= vDotN * colResult.normalX;
        this.velocity.z -= vDotN * colResult.normalZ;
      }
    }

    // 4. Low-Gravity Vertical Physics Integration
    const groundY = this.getTerrainHeight ? this.getTerrainHeight(this.position.x, this.position.z) : 0;

    if (!this.isGrounded) {
      this.verticalVelocity -= this.gravity * dt;
      this.position.y += this.verticalVelocity * dt;

      if (this.position.y <= groundY) {
        this.position.y = groundY;
        if (this.verticalVelocity < -5.0) {
          this.engine.audio.playLandSound();
          if (this.verticalVelocity < -12.5) {
            this.engine.audio.playDamageSting();
            if (this.engine.resources && this.engine.resources.drain) {
              this.engine.resources.drain('crewCondition', 10);
            }
            if (this.engine.hud && this.engine.hud.triggerDamageVignette) {
              this.engine.hud.triggerDamageVignette();
            }
            this.engine.showNotification('SUIT IMPACT ALERT: High fall deceleration recorded!', 'danger', 3000);
          }
        }
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    } else {
      this.position.y = groundY;
    }

    // Lunar Bounding Gait: Apollo-style buoyant hop
    let bounceOffset = 0;
    if (this.isGrounded && isMoving && this.isMoonGravity) {
      bounceOffset = Math.abs(Math.sin(Date.now() * 0.009 * (speed / this.walkSpeed))) * 0.16;
    }

    // Update Mesh Position & Heading
    this.mesh.position.set(this.position.x, this.position.y + bounceOffset, this.position.z);
    this.mesh.rotation.y = this.heading;

    // 5. GTA-STYLE CAMERA DAMPING & VISION ANGLE CALCULATION
    if (this.isFirstPerson) {
      // First-person vision from inside astronaut helmet visor
      this.mesh.visible = false;
      const eyePos = new THREE.Vector3(this.position.x, this.position.y + 1.62, this.position.z);
      const lookDir = new THREE.Vector3(
        -Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
        -Math.sin(this.cameraPitch),
        -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
      );
      this.camera.position.copy(eyePos);
      this.camera.lookAt(eyePos.clone().add(lookDir));
    } else {
      this.mesh.visible = true;
      const lookAtTarget = new THREE.Vector3(this.position.x, this.position.y + 1.45, this.position.z);

      // Anti-clipping raycast calculation against walls
      let effectiveDist = this.targetCameraDistance;
      if (this.obstacleObjects && this.obstacleObjects.length > 0) {
        const idealCamOffset = new THREE.Vector3(
          Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * effectiveDist,
          Math.sin(this.cameraPitch) * effectiveDist,
          Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * effectiveDist
        );
        const idealCamPos = lookAtTarget.clone().add(idealCamOffset);
        effectiveDist = this.physics.resolveCameraClip(lookAtTarget, idealCamPos, this.targetCameraDistance, this.obstacleObjects);
      }

      // Smoothly damp camera distance
      this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, effectiveDist, Math.min(1.0, dt * 10.0));

      // Spherical offset from yaw and pitch
      const camOffsetX = Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
      const camOffsetY = Math.sin(this.cameraPitch) * this.cameraDistance;
      const camOffsetZ = Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

      const desiredCamPos = new THREE.Vector3(
        this.position.x + camOffsetX,
        this.position.y + 1.45 + camOffsetY,
        this.position.z + camOffsetZ
      );

      // Smooth GTA-style exponential damping on camera position and look-at target
      const camDampFactor = Math.min(1.0, dt * 12.0);
      this.currentCamPos.lerp(desiredCamPos, camDampFactor);
      this.currentLookAt.lerp(lookAtTarget, camDampFactor);

      this.camera.position.copy(this.currentCamPos);
      this.camera.lookAt(this.currentLookAt);
    }

    // Update suit telemetry LEDs
    if (this.engine.resources) {
      this.updateSuitTelemetry(this.engine.resources);
    }
  }

  toggleVisionMode() {
    this.isFirstPerson = !this.isFirstPerson;
    if (this.isFirstPerson) {
      this.targetCameraDistance = 0.5;
      this.engine.showNotification('👁️ 1ST-PERSON VISOR VIEW (Press [V] or Zoom Out to exit)', 'info', 3000);
      this.engine.audio.playTone(880, 0.08, 'sine', 0.2);
    } else {
      this.targetCameraDistance = 6.5;
      this.engine.showNotification('🎥 3RD-PERSON CHASE CAM (Press [V] for 1st-person visor)', 'info', 3000);
      this.engine.audio.playTone(660, 0.08, 'sine', 0.2);
    }
  }

  resetCameraAngle() {
    this.cameraYaw = this.heading;
    this.cameraPitch = 0.28;
    this.engine.audio.playUIClick();
    this.engine.showNotification('⟲ Camera Angle Reset to Front', 'info', 1800);
  }

  getCamera() {
    return this.camera;
  }

  getPosition() {
    return this.position;
  }

  getHeading() {
    return this.heading || 0;
  }

  getCameraYaw() {
    return this.cameraYaw || 0;
  }

  setVisible(visible) {
    this.mesh.visible = visible;
  }
}
