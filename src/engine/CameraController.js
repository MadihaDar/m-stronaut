import * as THREE from 'three';

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.targetPosition = new THREE.Vector3(0, 1.2, 0);
    this.currentLookAt = new THREE.Vector3(0, 1.2, 0);

    // Spherical coordinates
    this.distance = 6.5;
    this.minDistance = 2.5;
    this.maxDistance = 14.0;

    this.yaw = 0; // Horizontal angle in radians
    this.pitch = 0.35; // Vertical angle in radians
    this.minPitch = -0.1;
    this.maxPitch = 1.2;

    this.smoothSpeed = 8.0;
  }

  setTarget(pos, immediate = false) {
    this.targetPosition.copy(pos);
    if (immediate) {
      this.currentLookAt.copy(pos);
    }
  }

  update(delta, input) {
    const { dx, dy, dz } = input.consumeCameraDeltas();

    this.yaw -= dx;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch + dy));
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + dz));

    // Smoothly interpolate lookAt position
    this.currentLookAt.lerp(this.targetPosition, Math.min(1.0, delta * this.smoothSpeed));

    // Calculate camera position in spherical coordinates
    const horizontalDistance = this.distance * Math.cos(this.pitch);
    const verticalDistance = this.distance * Math.sin(this.pitch);

    const camX = this.currentLookAt.x - horizontalDistance * Math.sin(this.yaw);
    const camZ = this.currentLookAt.z - horizontalDistance * Math.cos(this.yaw);
    const camY = Math.max(0.5, this.currentLookAt.y + verticalDistance);

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(this.currentLookAt.x, this.currentLookAt.y + 0.6, this.currentLookAt.z);
  }

  getYaw() {
    return this.yaw;
  }
}
