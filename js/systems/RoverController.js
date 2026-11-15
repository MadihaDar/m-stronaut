/* ============================================================
   FRONTIER: MISSION ACADEMY — Rover Controller
   Surface mobility vehicle with 4-wheel drive, steering & chase camera
   ============================================================ */

import * as THREE from 'three';
import { PhysicsEngine } from './PhysicsEngine.js';

export class RoverController {
  constructor(scene, engine, spawnPos, getTerrainHeight) {
    this.scene = scene;
    this.engine = engine;
    this.getTerrainHeight = getTerrainHeight;

    this.position = spawnPos.clone();
    this.heading = 0; // facing direction in radians
    this.speed = 0;
    this.maxSpeed = 12.0;
    this.reverseSpeed = -5.0;
    this.acceleration = 14.0;
    this.friction = 5.0;
    this.steerAngle = 0;
    this.turnSpeed = 2.2;

    this.active = false;
    this.physics = new PhysicsEngine();

    // Chase camera with full 360 vision orbit & cockpit view
    this.cameraDistance = 10.0;
    this.targetCameraDistance = 10.0;
    this.minDistance = 3.0;
    this.maxDistance = 40.0;
    this.cameraHeight = 3.5;
    this.cameraYaw = 0;
    this.cameraPitch = 0.28;
    this.isFirstPerson = false;
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.wheels = [];
    this._buildMesh();

    // Yellow Route Tracking Trail (Hidden by default, toggle with 'E')
    this.trailPoints = [];
    this.maxTrailPoints = 400;
    this.trailGeo = new THREE.BufferGeometry();
    this.trailMat = new THREE.LineBasicMaterial({
      color: 0xffd700,
      linewidth: 3,
      transparent: true,
      opacity: 0.85
    });
    this.routeLine = new THREE.Line(this.trailGeo, this.trailMat);
    this.routeLine.visible = false; // Hidden by default
    this.scene.add(this.routeLine);
    this._lastRecordedPos = this.position.clone();
  }

  setColliders(colliders) {
    this.physics.setColliders(colliders);
  }

  addCollider(collider) {
    this.physics.addCollider(collider);
  }

  _buildMesh() {
    this.mesh = new THREE.Group();
    this.group = this.mesh; // Alias for scene compatibility

    // 1. Chassis Body (Stout exploration frame)
    const bodyGeo = new THREE.BoxGeometry(2.4, 0.7, 3.8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.4,
      metalness: 0.3
    });
    const chassis = new THREE.Mesh(bodyGeo, bodyMat);
    chassis.position.y = 0.8;
    this.mesh.add(chassis);

    // High-visibility Orange Accent (Leo Chen Systems theme)
    const stripeGeo = new THREE.BoxGeometry(2.42, 0.2, 3.82);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xff8c42,
      roughness: 0.3,
      metalness: 0.2
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 0.85;
    this.mesh.add(stripe);

    // 2. Cockpit / Cargo Bay
    const canopyGeo = new THREE.BoxGeometry(1.6, 0.8, 1.8);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x223344,
      roughness: 0.2,
      metalness: 0.8
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 1.45, 0.2);
    this.mesh.add(canopy);

    // 3. Solar Panel Roof Wing
    const panelGeo = new THREE.BoxGeometry(2.2, 0.05, 1.2);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x112255,
      roughness: 0.1,
      metalness: 0.9
    });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 1.9, 0.1);
    this.mesh.add(panel);

    // 4. Mast Camera / Sensor Suite
    const mastGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8);
    const mast = new THREE.Mesh(mastGeo, bodyMat);
    mast.position.set(0.6, 2.0, 1.4);
    this.mesh.add(mast);

    const headGeo = new THREE.BoxGeometry(0.3, 0.15, 0.25);
    const head = new THREE.Mesh(headGeo, canopyMat);
    head.position.set(0.6, 2.55, 1.4);
    this.mesh.add(head);

    // 5. Four Rugged Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 16);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x222225,
      roughness: 0.9,
      metalness: 0.1
    });

    const wheelPositions = [
      [-1.35, 0.55,  1.3],  // Front Left
      [ 1.35, 0.55,  1.3],  // Front Right
      [-1.35, 0.55, -1.3],  // Rear Left
      [ 1.35, 0.55, -1.3]   // Rear Right
    ];

    wheelPositions.forEach((pos) => {
      const wheelHub = new THREE.Group();
      wheelHub.position.set(...pos);

      const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
      wheelMesh.rotation.z = Math.PI * 0.5; // Turn sideways
      wheelHub.add(wheelMesh);

      this.mesh.add(wheelHub);
      this.wheels.push(wheelMesh);
    });

    this.scene.add(this.mesh);
  }

  activate() {
    this.active = true;
    this.engine.resources.setRoverActive(true);
    this.engine.hud.setMode('rover');
    this.engine.audio.playRoverEnginePulse();
    this.engine.showNotification('Mounted Exploration Rover (Systems Online)', 'info');
  }

  deactivate() {
    this.active = false;
    this.speed = 0;
    this.engine.resources.setRoverActive(false);
    this.engine.hud.setMode('walk');
    this.engine.showNotification('Dismounted Rover (EVA Suit Mode)', 'info');
  }

  teleport(pos, heading = null) {
    if (!pos) return;
    this.position.copy(pos);
    if (heading !== null) this.heading = heading;
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      if (heading !== null) this.mesh.rotation.y = this.heading;
    }
    this.speed = 0;
  }

  setControlEnabled(enabled) {
    this.isControlled = enabled;
    if (!enabled) {
      this.speed = 0;
      this.steering = 0;
    }
  }

  update(dt) {
    if (!this.active || this.isControlled === false) {
      this.speed = 0;
      // Parked state: snap to ground
      const groundY = this.getTerrainHeight ? this.getTerrainHeight(this.position.x, this.position.z) : 0;
      this.position.y = groundY;
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.heading;
      return;
    }

    const input = this.engine.input;
    const move = input.getMovementVector();

    // Acceleration & Braking (W/S or Up/Down)
    if (move.z < -0.1) {
      // Accelerate forward
      this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration * dt);
    } else if (move.z > 0.1) {
      // Reverse / brake
      this.speed = Math.max(this.reverseSpeed, this.speed - this.acceleration * dt);
    } else {
      // Friction slowdown
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.friction * dt);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.friction * dt);
      }
    }

    // Steering (A/D or Left/Right)
    if (Math.abs(this.speed) > 0.1) {
      const steerDir = this.speed > 0 ? 1 : -1;
      if (move.x < -0.1) {
        this.heading += this.turnSpeed * dt * steerDir;
      } else if (move.x > 0.1) {
        this.heading -= this.turnSpeed * dt * steerDir;
      }
    }

    // Movement forward in world coordinates
    const nextX = this.position.x + Math.sin(this.heading) * this.speed * dt;
    const nextZ = this.position.z + Math.cos(this.heading) * this.speed * dt;
    const col = this.physics.resolveCollision(nextX, nextZ, 1.4, Math.sin(this.heading) * this.speed, Math.cos(this.heading) * this.speed);
    this.position.x = col.x;
    this.position.z = col.z;
    if (col.hit) {
      this.speed *= 0.25; // bump stop
    }

    // Terrain altitude
    const groundY = this.getTerrainHeight ? this.getTerrainHeight(this.position.x, this.position.z) : 0;
    this.position.y = groundY;

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;

    // Record route path points
    if (this._lastRecordedPos.distanceTo(this.position) > 0.8) {
      this.trailPoints.push(new THREE.Vector3(this.position.x, this.position.y + 0.15, this.position.z));
      if (this.trailPoints.length > this.maxTrailPoints) this.trailPoints.shift();
      this.trailGeo.setFromPoints(this.trailPoints);
      this._lastRecordedPos.copy(this.position);
    }

    // Toggle Yellow Route Trail via [E] Key (only if not near an interactive objective prompt)
    const promptVisible = this.engine && this.engine.hud && this.engine.hud.promptElement && this.engine.hud.promptElement.classList.contains('visible');
    if (!promptVisible && (input.isActionPressed('interact') || input.isKeyPressed('KeyE') || input.isKeyPressed('e') || input.isKeyPressed('E'))) {
      this.toggleRouteLine();
    }

    // Animate spinning wheels
    const wheelRotDelta = (this.speed / 0.55) * dt;
    this.wheels.forEach(w => {
      w.rotation.x += wheelRotDelta;
    });

    // 4. Update Zoom & Vision Angle Chase Camera
    const camRot = input.getCameraRotation(); // {dx, dy} from mouse drag / arrow keys
    this.cameraYaw -= camRot.dx;
    this.cameraPitch = Math.max(-0.45, Math.min(1.25, this.cameraPitch + camRot.dy));

    const zoom = input.getZoomDelta();
    if (Math.abs(zoom) > 0.001) {
      this.targetCameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetCameraDistance - zoom * 1.0));
      if (this.targetCameraDistance <= 3.5 && !this.isFirstPerson) {
        this.isFirstPerson = true;
        this.engine.showNotification('👁️ ROVER COCKPIT VIEW', 'info', 1800);
      } else if (this.isFirstPerson && this.targetCameraDistance > 4.5) {
        this.isFirstPerson = false;
        this.engine.showNotification('🎥 ROVER CHASE CAM', 'info', 1800);
      }
    }
    this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, this.targetCameraDistance || 10.0, Math.min(1.0, dt * 8.0));

    // When accelerating forward/backward without manual drag, gently ease camera yaw towards rover heading
    if (Math.abs(this.speed) > 1.2 && Math.abs(camRot.dx) < 0.0001) {
      this.cameraYaw = THREE.MathUtils.lerp(this.cameraYaw, 0, dt * 1.8);
    }

    if (this.isFirstPerson) {
      // Driver cockpit position inside rover
      const cockpitOffset = new THREE.Vector3(0, 1.9, 0.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading);
      const eyePos = this.position.clone().add(cockpitOffset);
      const totalYaw = this.heading + this.cameraYaw;
      const lookDir = new THREE.Vector3(
        -Math.sin(totalYaw) * Math.cos(this.cameraPitch),
        -Math.sin(this.cameraPitch),
        -Math.cos(totalYaw) * Math.cos(this.cameraPitch)
      );
      this.camera.position.copy(eyePos);
      this.camera.lookAt(eyePos.clone().add(lookDir));
    } else {
      const totalYaw = this.heading + this.cameraYaw;
      const hDist = Math.cos(this.cameraPitch) * this.cameraDistance;
      const vDist = Math.sin(this.cameraPitch) * this.cameraDistance;

      const camOffset = new THREE.Vector3(
        -Math.sin(totalYaw) * hDist,
        Math.max(1.2, 1.4 + vDist),
        -Math.cos(totalYaw) * hDist
      );
      const desiredPos = this.position.clone().add(camOffset);
      this.camera.position.lerp(desiredPos, Math.min(1.0, dt * 12.0));
      this.camera.lookAt(this.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
    }
  }

  setRouteTrailColor(hex) {
    if (this.trailMat) {
      this.trailMat.color.setHex(hex);
    }
  }

  setRouteTrailVisible(visible) {
    if (this.routeLine) {
      this.routeLine.visible = visible;
    }
  }

  toggleRouteLine() {
    this.routeLine.visible = !this.routeLine.visible;
    const isVis = this.routeLine.visible;
    const isBlue = this.trailMat && this.trailMat.color.getHex() === 0x00d4ff;
    const colorLabel = isBlue ? '🔵 BLUE' : '🟡 YELLOW';
    this.engine.showNotification(
      isVis ? `${colorLabel} ROVER ROUTE TRAIL: ON (Press [E] to hide)` : '⚪ ROVER ROUTE TRAIL: OFF (Press [E] to show)',
      'info',
      2400
    );
    this.engine.audio.playTone(isVis ? 880 : 550, 0.08, 'sine', 0.25);
  }

  toggleVisionMode() {
    this.isFirstPerson = !this.isFirstPerson;
    if (this.isFirstPerson) {
      this.targetCameraDistance = 3.0;
      this.engine.showNotification('👁️ ROVER COCKPIT VIEW ENGAGED (Press [V] to toggle)', 'info', 2500);
      this.engine.audio.playTone(880, 0.08, 'sine', 0.2);
    } else {
      this.targetCameraDistance = 10.0;
      this.engine.showNotification('🎥 ROVER CHASE CAM (Press [V] for cockpit view)', 'info', 2500);
      this.engine.audio.playTone(660, 0.08, 'sine', 0.2);
    }
  }

  resetCameraAngle() {
    this.cameraYaw = 0;
    this.cameraPitch = 0.28;
    this.engine.audio.playUIClick();
    this.engine.showNotification('⟲ Rover Camera Reset to Front', 'info', 1800);
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
}
