import * as THREE from 'three';
import { CHARACTERS } from '../data/characters.js';

export class Astronaut {
  constructor(scene, characterId = 'alex') {
    this.scene = scene;
    this.characterId = characterId;
    this.group = new THREE.Group();

    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3();
    this.rotationY = 0;

    // Movement state
    this.walkSpeed = 4.2;
    this.sprintSpeed = 7.5;
    this.gravity = 9.8; // default Earth-like for training or adjusted by destination
    this.jumpForce = 4.8;
    this.isGrounded = true;
    this.isWalking = false;
    this.animTime = 0;
    this.visible = true;

    this.buildModel();
    this.scene.add(this.group);
  }

  buildModel() {
    const charData = CHARACTERS[this.characterId] || CHARACTERS.alex;
    const accentColor = charData.suitColor;

    // Materials
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.6,
      metalness: 0.1
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.4,
      metalness: 0.3
    });

    const darkJointMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8
    });

    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      metalness: 0.9,
      roughness: 0.15
    });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
    this.torso = new THREE.Mesh(torsoGeo, suitMat);
    this.torso.position.y = 1.05;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // Chest badge stripe
    const badgeGeo = new THREE.BoxGeometry(0.35, 0.15, 0.04);
    const badge = new THREE.Mesh(badgeGeo, accentMat);
    badge.position.set(0, 0.1, 0.18);
    this.torso.add(badge);

    // Life support backpack
    const packGeo = new THREE.BoxGeometry(0.46, 0.58, 0.22);
    const backpack = new THREE.Mesh(packGeo, suitMat);
    backpack.position.set(0, 0.05, -0.26);
    backpack.castShadow = true;
    this.torso.add(backpack);

    // Backpack oxygen tanks
    const tankGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.45, 12);
    const tank1 = new THREE.Mesh(tankGeo, accentMat);
    tank1.position.set(-0.13, 0.05, -0.12);
    backpack.add(tank1);
    const tank2 = new THREE.Mesh(tankGeo, accentMat);
    tank2.position.set(0.13, 0.05, -0.12);
    backpack.add(tank2);

    // 2. Helmet
    const helmetGeo = new THREE.SphereGeometry(0.28, 16, 16);
    this.helmet = new THREE.Mesh(helmetGeo, suitMat);
    this.helmet.position.set(0, 1.55, 0);
    this.helmet.castShadow = true;
    this.group.add(this.helmet);

    // Visor
    const visorGeo = new THREE.SphereGeometry(0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.rotation.x = Math.PI * 0.5;
    visor.position.set(0, 0, 0.08);
    this.helmet.add(visor);

    // 3. Limbs (Pivots for animation)
    // Left Leg
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.16, 0.75, 0);
    const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.7, 10);
    const leftLegMesh = new THREE.Mesh(legGeo, suitMat);
    leftLegMesh.position.y = -0.35;
    leftLegMesh.castShadow = true;
    this.leftLegPivot.add(leftLegMesh);

    const bootGeo = new THREE.BoxGeometry(0.18, 0.14, 0.28);
    const leftBoot = new THREE.Mesh(bootGeo, darkJointMat);
    leftBoot.position.set(0, -0.7, 0.05);
    this.leftLegPivot.add(leftBoot);
    this.group.add(this.leftLegPivot);

    // Right Leg
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.16, 0.75, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, suitMat);
    rightLegMesh.position.y = -0.35;
    rightLegMesh.castShadow = true;
    this.rightLegPivot.add(rightLegMesh);

    const rightBoot = new THREE.Mesh(bootGeo, darkJointMat);
    rightBoot.position.set(0, -0.7, 0.05);
    this.rightLegPivot.add(rightBoot);
    this.group.add(this.rightLegPivot);

    // Left Arm
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.36, 1.3, 0);
    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.55, 10);
    const leftArmMesh = new THREE.Mesh(armGeo, suitMat);
    leftArmMesh.position.y = -0.28;
    leftArmMesh.castShadow = true;
    this.leftArmPivot.add(leftArmMesh);
    this.group.add(this.leftArmPivot);

    // Right Arm
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.36, 1.3, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, suitMat);
    rightArmMesh.position.y = -0.28;
    rightArmMesh.castShadow = true;
    this.rightArmPivot.add(rightArmMesh);
    this.group.add(this.rightArmPivot);
  }

  setCharacter(characterId) {
    this.characterId = characterId;
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.buildModel();
  }

  setVisible(visible) {
    this.visible = visible;
    this.group.visible = visible;
  }

  update(delta, input, cameraYaw, terrain) {
    if (!this.visible) return;

    // Movement calculation relative to camera yaw
    const moveX = input.moveX;
    const moveZ = input.moveZ;
    const speed = input.sprint ? this.sprintSpeed : this.walkSpeed;

    this.isWalking = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;

    if (this.isWalking) {
      // Calculate movement angle in world space
      const angle = Math.atan2(moveX, moveZ) + cameraYaw;
      this.rotationY = angle;

      const vx = Math.sin(angle) * speed;
      const vz = Math.cos(angle) * speed;

      this.position.x += vx * delta;
      this.position.z += vz * delta;

      // Animate limbs
      this.animTime += delta * (input.sprint ? 14 : 9);
      const swing = Math.sin(this.animTime) * 0.65;
      this.leftLegPivot.rotation.x = swing;
      this.rightLegPivot.rotation.x = -swing;
      this.leftArmPivot.rotation.x = -swing;
      this.rightArmPivot.rotation.x = swing;
      this.torso.position.y = 1.05 + Math.abs(Math.sin(this.animTime * 2)) * 0.04;
    } else {
      // Return limbs to idle
      this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, 0, delta * 10);
      this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0, delta * 10);
      this.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.leftArmPivot.rotation.x, 0, delta * 10);
      this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, 0, delta * 10);
      // Gentle breathing bob
      this.animTime += delta * 2;
      this.torso.position.y = 1.05 + Math.sin(this.animTime) * 0.015;
    }

    // Jump / Gravity
    const groundY = terrain ? terrain.getHeightAt(this.position.x, this.position.z) : 0;

    if (input.jump && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * delta;
      this.position.y += this.velocity.y * delta;
      if (this.position.y <= groundY) {
        this.position.y = groundY;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    } else {
      this.position.y = groundY;
    }

    // Smooth rotation towards target angle
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, this.rotationY, delta * 14);
    this.group.position.copy(this.position);
  }
}
