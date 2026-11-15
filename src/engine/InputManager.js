export class InputManager {
  constructor(domElement) {
    this.domElement = domElement;

    // Movement vectors (-1 to 1)
    this.moveX = 0;
    this.moveZ = 0;
    this.sprint = false;
    this.jump = false;

    // Actions
    this.interactPressed = false;
    this.toggleVehiclePressed = false;
    this.consumeFoodPressed = false;
    this.menuPressed = false;

    // Camera rotation deltas
    this.cameraDeltaX = 0;
    this.cameraDeltaY = 0;
    this.cameraZoomDelta = 0;

    // Internal state
    this.keys = {};
    this.isPointerDown = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;

    // Touch joystick
    this.touchJoystickActive = false;
    this.joystickTouchId = null;
    this.joystickBaseX = 0;
    this.joystickBaseY = 0;

    // Touch look
    this.lookTouchId = null;
    this.lastLookX = 0;
    this.lastLookY = 0;

    this.setupKeyboard();
    this.setupPointer();
    this.setupTouch();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyE') this.interactPressed = true;
      if (e.code === 'KeyV') this.toggleVehiclePressed = true;
      if (e.code === 'KeyC') this.consumeFoodPressed = true;
      if (e.code === 'Escape') this.menuPressed = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setupPointer() {
    this.domElement.addEventListener('pointerdown', (e) => {
      // Only handle primary pointer (mouse or first touch) for canvas dragging if not on UI
      if (e.pointerType === 'mouse') {
        this.isPointerDown = true;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isPointerDown && e.pointerType === 'mouse') {
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.cameraDeltaX += dx * 0.005;
        this.cameraDeltaY += dy * 0.005;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
      }
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });

    this.domElement.addEventListener('wheel', (e) => {
      this.cameraZoomDelta += Math.sign(e.deltaY) * 0.8;
      e.preventDefault();
    }, { passive: false });
  }

  setupTouch() {
    // Touch events for mobile camera drag on right half
    this.domElement.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        // Right half of screen acts as camera rotation
        if (touch.clientX > window.innerWidth * 0.4 && this.lookTouchId === null) {
          this.lookTouchId = touch.identifier;
          this.lastLookX = touch.clientX;
          this.lastLookY = touch.clientY;
        }
      }
    }, { passive: true });

    this.domElement.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.lookTouchId) {
          const dx = touch.clientX - this.lastLookX;
          const dy = touch.clientY - this.lastLookY;
          this.cameraDeltaX += dx * 0.006;
          this.cameraDeltaY += dy * 0.006;
          this.lastLookX = touch.clientX;
          this.lastLookY = touch.clientY;
        }
      }
    }, { passive: true });

    const handleTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.lookTouchId) {
          this.lookTouchId = null;
        }
      }
    };
    this.domElement.addEventListener('touchend', handleTouchEnd);
    this.domElement.addEventListener('touchcancel', handleTouchEnd);
  }

  setJoystickVector(x, y) {
    this.joystickX = x;
    this.joystickY = y;
  }

  update() {
    // Keyboard reading
    let kbX = 0;
    let kbZ = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) kbZ += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) kbZ -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) kbX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) kbX += 1;

    // Combine keyboard and virtual touch joystick
    const jX = this.joystickX || 0;
    const jY = -(this.joystickY || 0); // Invert Y so up is positive

    this.moveX = kbX !== 0 ? kbX : jX;
    this.moveZ = kbZ !== 0 ? kbZ : jY;

    // Normalize diagonal magnitude if greater than 1
    const mag = Math.sqrt(this.moveX * this.moveX + this.moveZ * this.moveZ);
    if (mag > 1) {
      this.moveX /= mag;
      this.moveZ /= mag;
    }

    this.sprint = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.touchSprint);
    this.jump = !!(this.keys['Space'] || this.touchJump);
  }

  consumeInteract() {
    const p = this.interactPressed || this.touchInteract;
    this.interactPressed = false;
    this.touchInteract = false;
    return p;
  }

  consumeToggleVehicle() {
    const p = this.toggleVehiclePressed || this.touchToggleVehicle;
    this.toggleVehiclePressed = false;
    this.touchToggleVehicle = false;
    return p;
  }

  consumeConsumeFood() {
    const p = this.consumeFoodPressed || this.touchConsumeFood;
    this.consumeFoodPressed = false;
    this.touchConsumeFood = false;
    return p;
  }

  consumeMenu() {
    const p = this.menuPressed;
    this.menuPressed = false;
    return p;
  }

  consumeCameraDeltas() {
    const dx = this.cameraDeltaX;
    const dy = this.cameraDeltaY;
    const dz = this.cameraZoomDelta;
    this.cameraDeltaX = 0;
    this.cameraDeltaY = 0;
    this.cameraZoomDelta = 0;
    return { dx, dy, dz };
  }
}
