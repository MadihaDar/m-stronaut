import * as THREE from 'three';
import { audio } from '../engine/AudioManager.js';

export class Rover {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    this.position = new THREE.Vector3(5, 0, 4);
    this.rotationY = 0;
    this.speed = 0;
    this.maxSpeed = 10.5;
    this.reverseSpeed = -4.5;
    this.acceleration = 7.0;
    this.deceleration = 6.0;
    this.turnSpeed = 1.9;

    this.isOccupied = false;
    this.wheels = [];
    this.headlights = [];

    this.buildModel();
    this.scene.add(this.group);
  }

  buildModel() {
    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.2,
      roughness: 0.5
    });

    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.6,
      roughness: 0.4
    });

    const orangeAccentMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Leo Chen's mobility accent
      roughness: 0.4
    });

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1
    });

    // 1. Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(1.6, 0.4, 2.8);
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.65;
    chassis.castShadow = true;
    this.group.add(chassis);

    // 2. Main Cabin
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.8, 1.8);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 1.15, -0.1);
    cabin.castShadow = true;
    this.group.add(cabin);

    // Windshield
    const windshieldGeo = new THREE.BoxGeometry(1.2, 0.45, 0.1);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 1.25, 0.85);
    windshield.rotation.x = -0.3;
    this.group.add(windshield);

    // Orange Racing/Engineering Stripe
    const stripeGeo = new THREE.BoxGeometry(1.42, 0.12, 1.82);
    const stripe = new THREE.Mesh(stripeGeo, orangeAccentMat);
    stripe.position.set(0, 1.05, -0.1);
    this.group.add(stripe);

    // 3. Solar Panel Rack (Rear)
    const panelBedGeo = new THREE.BoxGeometry(1.3, 0.08, 0.9);
    const panelBedMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.2, metalness: 0.8 });
    const panelBed = new THREE.Mesh(panelBedGeo, panelBedMat);
    panelBed.position.set(0, 1.1, -1.1);
    panelBed.rotation.x = 0.1;
    this.group.add(panelBed);

    // 4. High-Gain Antenna Dish
    const mastGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    const mast = new THREE.Mesh(mastGeo, chassisMat);
    mast.position.set(0.5, 1.8, -0.8);
    this.group.add(mast);

    const dishGeo = new THREE.SphereGeometry(0.24, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.4);
    const dish = new THREE.Mesh(dishGeo, chassisMat);
    dish.position.set(0.5, 2.2, -0.8);
    dish.rotation.x = -Math.PI * 0.7;
    this.group.add(dish);

    // 5. Headlights
    const lightGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12);
    lightGeo.rotateX(Math.PI / 2);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    [-0.5, 0.5].forEach((xPos) => {
      const lamp = new THREE.Mesh(lightGeo, lightMat);
      lamp.position.set(xPos, 0.95, 1.35);
      this.group.add(lamp);

      const spot = new THREE.SpotLight(0xffffff, 1.5, 25, Math.PI * 0.22, 0.5);
      spot.position.set(xPos, 0.95, 1.35);
      spot.target.position.set(xPos, 0.2, 10);
      this.group.add(spot);
      this.group.add(spot.target);
      this.headlights.push(spot);
    });

    // 6. Six Heavy-Duty Planetary Wheels
    const wheelPositions = [
      [-0.95, 0.45, 1.0],  // Front Left
      [0.95, 0.45, 1.0],   // Front Right
      [-0.95, 0.45, 0.0],  // Middle Left
      [0.95, 0.45, 0.0],   // Middle Right
      [-0.95, 0.45, -1.0], // Rear Left
      [0.95, 0.45, -1.0]   // Rear Right
    ];

    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 14);
    wheelGeo.rotateZ(Math.PI / 2);

    wheelPositions.forEach(([x, y, z]) => {
      const wheelHub = new THREE.Group();
      wheelHub.position.set(x, y, z);

      const wheelMesh = new THREE.Mesh(wheelGeo, tireMat);
      wheelMesh.castShadow = true;
      wheelHub.add(wheelMesh);

      // Hubcap orange accent
      const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 10);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, orangeAccentMat);
      wheelHub.add(rimMesh);

      this.group.add(wheelHub);
      this.wheels.push(wheelMesh);
    });
  }

  setOccupied(occupied) {
    this.isOccupied = occupied;
    if (!occupied) {
      audio.setRoverEngineSound(false);
    }
  }

  update(delta, input, terrain) {
    if (this.isOccupied) {
      // Acceleration & Steering
      const throttle = input.moveZ;
      const steer = input.moveX;

      if (throttle > 0.05) {
        this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration * delta);
      } else if (throttle < -0.05) {
        this.speed = Math.max(this.reverseSpeed, this.speed - this.acceleration * delta);
      } else {
        // Friction / coasting
        if (this.speed > 0) {
          this.speed = Math.max(0, this.speed - this.deceleration * delta);
        } else if (this.speed < 0) {
          this.speed = Math.min(0, this.speed + this.deceleration * delta);
        }
      }

      // Steering
      if (Math.abs(this.speed) > 0.1) {
        const dir = this.speed >= 0 ? 1 : -1;
        this.rotationY -= steer * this.turnSpeed * delta * dir;
      }

      // Audio engine update
      const speedRatio = Math.abs(this.speed) / this.maxSpeed;
      audio.setRoverEngineSound(Math.abs(this.speed) > 0.1, speedRatio);
    } else {
      // Gradually stop if unoccupied
      if (Math.abs(this.speed) > 0.1) {
        this.speed = Math.max(0, this.speed - this.deceleration * delta * 2);
      } else {
        this.speed = 0;
      }
    }

    // Move forward in facing direction
    this.position.x += Math.sin(this.rotationY) * this.speed * delta;
    this.position.z += Math.cos(this.rotationY) * this.speed * delta;

    // Follow terrain height
    const groundY = terrain ? terrain.getHeightAt(this.position.x, this.position.z) : 0;
    this.position.y = groundY;

    // Rotate wheels based on distance traveled
    const wheelRoll = (this.speed * delta) / 0.38;
    this.wheels.forEach((w) => {
      w.rotation.x += wheelRoll;
    });

    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;
  }
}
