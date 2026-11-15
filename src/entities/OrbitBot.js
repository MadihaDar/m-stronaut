import * as THREE from 'three';

export class OrbitBot {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    this.position = new THREE.Vector3(1.2, 2.0, 1.2);
    this.targetPosition = new THREE.Vector3();
    this.time = 0;
    this.eyeEmotion = 'normal'; // 'normal' | 'happy' | 'scan' | 'alert'

    this.buildModel();
    this.scene.add(this.group);
  }

  buildModel() {
    // 1. Sphere Body
    const bodyGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.1
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.castShadow = true;
    this.group.add(this.body);

    // 2. Cyan / Orange Accent Ring
    const ringGeo = new THREE.TorusGeometry(0.33, 0.025, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.3,
      metalness: 0.6
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    this.body.add(ring);

    // 3. Digital Eye Screen
    const screenGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24);
    screenGeo.rotateX(Math.PI / 2);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.04, 0.28);
    this.body.add(screen);

    // Cyan glowing LED pupil
    const pupilGeo = new THREE.RingGeometry(0.04, 0.1, 16);
    this.pupilMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide
    });
    this.pupil = new THREE.Mesh(pupilGeo, this.pupilMat);
    this.pupil.position.set(0, 0.04, 0.31);
    this.body.add(this.pupil);

    // 4. Twin Miniature Attitude Thrusters
    const thrusterGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.12, 8);
    const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });

    [-0.34, 0.34].forEach((xPos) => {
      const th = new THREE.Mesh(thrusterGeo, thrusterMat);
      th.position.set(xPos, -0.05, 0);
      th.rotation.z = xPos < 0 ? 0.3 : -0.3;
      this.body.add(th);
    });
  }

  setEmotion(emotion) {
    this.eyeEmotion = emotion;
    if (emotion === 'scan') {
      this.pupilMat.color.setHex(0xa855f7); // Purple scan
    } else if (emotion === 'alert') {
      this.pupilMat.color.setHex(0xef4444); // Red alert
    } else if (emotion === 'happy') {
      this.pupilMat.color.setHex(0x22c55e); // Green happy
    } else {
      this.pupilMat.color.setHex(0x38bdf8); // Standard cyan
    }
  }

  update(delta, leaderPosition, leaderRotationY) {
    this.time += delta;

    // Orbit follows leader slightly to the right-rear and floats higher
    const offsetX = Math.sin(leaderRotationY + 2.3) * 1.8;
    const offsetZ = Math.cos(leaderRotationY + 2.3) * 1.8;

    this.targetPosition.set(
      leaderPosition.x + offsetX,
      leaderPosition.y + 1.8 + Math.sin(this.time * 2.5) * 0.15, // Floating bob
      leaderPosition.z + offsetZ
    );

    // Smooth position interpolation
    this.position.lerp(this.targetPosition, delta * 4.0);
    this.group.position.copy(this.position);

    // Look at leader
    this.group.lookAt(leaderPosition.x, leaderPosition.y + 1.2, leaderPosition.z);
  }
}
