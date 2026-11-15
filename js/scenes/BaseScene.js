/* ============================================================
   FRONTIER: MISSION ACADEMY — Base Scene
   Abstract scene class for 3D state machine
   ============================================================ */

import * as THREE from 'three';

export class BaseScene {
  constructor(engine) {
    this.engine = engine;
    this.scene = new THREE.Scene();
    this.camera = null;
  }

  onEnter() {}

  onExit() {}

  update(dt) {}

  onResize(width, height) {
    if (this.camera && this.camera.isPerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  getThreeScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }
}
