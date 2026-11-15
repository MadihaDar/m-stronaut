/* ============================================================
   FRONTIER: MISSION ACADEMY — Input Manager
   Handles keyboard, mouse, touch, and gamepad input
   ============================================================ */

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;

    // Keyboard state
    this._keysDown    = new Set();
    this._keysPressed = new Set(); // pressed this frame
    this._keysReleased= new Set(); // released this frame

    // Mouse state
    this.mouse = { x: 0, y: 0, dx: 0, dy: 0, buttons: new Set() };
    this._mouseDragging = false;
    this._lastMouseX = 0;
    this._lastMouseY = 0;

    // Camera rotation (accumulated delta)
    this._camDx = 0;
    this._camDy = 0;

    // Zoom delta (positive = zoom in, negative = zoom out)
    this.zoomDelta = 0;
    this._pinchDist = null;

    // Virtual joystick state (set by JoystickUI)
    this.joystick = { x: 0, y: 0, active: false };

    // Camera touch state (set by JoystickUI)
    this.touchCam = { dx: 0, dy: 0 };

    // Action flags (set externally, cleared per frame)
    this._actionsPressed = new Set();

    // Sensitivity
    this.mouseSensitivity = 0.005;
    this.touchSensitivity = 0.005;

    // Action key mappings
    this.keyMap = {
      interact:    ['KeyE', 'Keye', 'e', 'E'],
      jump:        ['Space'],
      launch:      ['KeyL', 'Keyl', 'l', 'L'],
      roverToggle: ['KeyR', 'Keyr', 'r', 'R'],
      viewToggle:  ['KeyV', 'Keyv', 'v', 'V'],
      pause:       ['Escape'],
      map:         ['KeyM', 'Tab'],
      scanner:     ['KeyF', 'Keyf', 'f', 'F'],
      sprint:      ['ShiftLeft', 'ShiftRight'],
      dialogNext:  ['Space', 'Enter', 'KeyE', 'Keye', 'e', 'E']
    };

    this._bindEvents();
  }

  /* ── Binding ── */
  _bindEvents() {
    window.addEventListener('keydown',   this._onKeyDown.bind(this),   { passive: false });
    window.addEventListener('keyup',     this._onKeyUp.bind(this));
    window.addEventListener('mousedown', this._onMouseDown.bind(this));
    window.addEventListener('mousemove', this._onMouseMove.bind(this));
    window.addEventListener('mouseup',   this._onMouseUp.bind(this));
    window.addEventListener('contextmenu', e => e.preventDefault());

    // Mouse wheel zoom
    window.addEventListener('wheel', (e) => {
      // Allow natural scroll inside open side panels or dialogs
      if (e.target && e.target.closest && e.target.closest('.side-panel.visible, .panel-body, #dialogue-panel.visible')) {
        return;
      }
      const dir = -Math.sign(e.deltaY);
      this.zoomDelta += dir * 1.5;
    }, { passive: true });

    // Touch pinch-to-zoom
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        this._pinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && this._pinchDist !== null) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = dist - this._pinchDist;
        this.zoomDelta += diff * 0.05;
        this._pinchDist = dist;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        this._pinchDist = null;
      }
    }, { passive: true });

    // Prevent default touch on canvas to avoid scroll
    if (this.canvas && this.canvas.addEventListener) {
      this.canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
      this.canvas.addEventListener('touchmove',  e => e.preventDefault(), { passive: false });
    }
  }

  _onKeyDown(e) {
    if (e.repeat) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
      e.preventDefault();
    }
    const code = e.code;
    const key = e.key;
    if (code) {
      this._keysDown.add(code);
      this._keysPressed.add(code);
    }
    if (key) {
      this._keysDown.add(key);
      this._keysPressed.add(key);
      this._keysDown.add(key.toLowerCase());
      this._keysPressed.add(key.toLowerCase());
      this._keysDown.add(key.toUpperCase());
      this._keysPressed.add(key.toUpperCase());
    }
  }

  _onKeyUp(e) {
    const code = e.code;
    const key = e.key;
    if (code) {
      this._keysDown.delete(code);
      this._keysReleased.add(code);
    }
    if (key) {
      this._keysDown.delete(key);
      this._keysDown.delete(key.toLowerCase());
      this._keysDown.delete(key.toUpperCase());
      this._keysReleased.add(key);
    }
  }

  _onMouseDown(e) {
    this.mouse.buttons.add(e.button);
    if (e.button === 2 || e.button === 0) { // right or left drag for camera
      this._mouseDragging = true;
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;
    }
  }
  _onMouseMove(e) {
    this.mouse.x = (e.clientX / window.innerWidth)  * 2 - 1;
    this.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    if (this._mouseDragging) {
      const dx = e.clientX - this._lastMouseX;
      const dy = e.clientY - this._lastMouseY;
      this._camDx += dx * this.mouseSensitivity;
      this._camDy += dy * this.mouseSensitivity;
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;
    }
  }
  _onMouseUp(e) {
    this.mouse.buttons.delete(e.button);
    if (e.button === 2 || e.button === 0) this._mouseDragging = false;
  }

  /* ── Query API ── */

  /** Is the key currently held down? */
  isKeyDown(code) { return this._keysDown.has(code); }

  /** Was the key just pressed this frame? */
  isKeyPressed(code) { return this._keysPressed.has(code); }

  /** Was the key just released this frame? */
  isKeyReleased(code) { return this._keysReleased.has(code); }

  /** Is an action currently held (any of its bound keys)? */
  isActionDown(action) {
    const keys = this.keyMap[action] ?? [];
    return keys.some(k => this._keysDown.has(k));
  }

  /** Was an action just triggered this frame? */
  isActionPressed(action) {
    const keys = this.keyMap[action] ?? [];
    return keys.some(k => this._keysPressed.has(k)) || this._actionsPressed.has(action);
  }

  /**
   * Convenience check for the 'E' / interact action across keycodes and physical keys.
   */
  isInteractPressed() {
    return this.isActionPressed('interact') ||
      this.isKeyPressed('KeyE') ||
      this.isKeyPressed('e') ||
      this.isKeyPressed('E');
  }

  /** Trigger an action programmatically (from UI button) */
  triggerAction(action) {
    this._actionsPressed.add(action);
  }

  /**
   * Returns normalized movement vector {x, z} in [-1, 1]
   * combining keyboard WASD/arrows + virtual joystick.
   */
  getMovementVector() {
    let x = 0, z = 0;

    // Primary keyboard movement: WASD
    if (this.isKeyDown('KeyW')) z -= 1;
    if (this.isKeyDown('KeyS')) z += 1;
    if (this.isKeyDown('KeyA')) x -= 1;
    if (this.isKeyDown('KeyD')) x += 1;

    // Virtual joystick (from JoystickUI)
    if (this.joystick.active) {
      x += this.joystick.x;
      z += this.joystick.y; // joystick Y = forward/back (negative = forward)
    }

    // Normalize
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    return { x, z };
  }

  /**
   * Returns camera rotation delta {dx, dy} this frame.
   * Positive dx = rotate right. Positive dy = look down.
   */
  getCameraRotation() {
    let keyDx = 0;
    let keyDy = 0;

    // Arrow keys for changing vision angle / rotating camera
    if (this.isKeyDown('ArrowLeft'))  keyDx -= 0.045;
    if (this.isKeyDown('ArrowRight')) keyDx += 0.045;
    if (this.isKeyDown('ArrowUp'))    keyDy -= 0.035;
    if (this.isKeyDown('ArrowDown'))  keyDy += 0.035;

    const result = {
      dx: this._camDx + this.touchCam.dx + keyDx,
      dy: this._camDy + this.touchCam.dy + keyDy
    };
    return result;
  }

  /** Programmatic camera rotation (from UI buttons) */
  addCameraRotation(dx, dy) {
    this._camDx += dx;
    this._camDy += dy;
  }

  /**
   * Returns accumulated zoom delta this frame.
   * Positive = zoom in, negative = zoom out.
   */
  getZoomDelta() {
    let delta = this.zoomDelta;
    if (this.isKeyDown('Equal') || this.isKeyDown('NumpadAdd')) delta += 0.8;
    if (this.isKeyDown('Minus') || this.isKeyDown('NumpadSubtract')) delta -= 0.8;
    if (this.isKeyDown('PageUp')) delta += 1.2;
    if (this.isKeyDown('PageDown')) delta -= 1.2;
    return delta;
  }

  addZoom(amount) {
    this.zoomDelta += amount;
  }

  /** Is the sprint key held? */
  isSprinting() {
    return this.isKeyDown('ShiftLeft') || this.isKeyDown('ShiftRight');
  }

  /* ── Frame lifecycle ── */

  /** Call at the END of each frame to clear one-shot states */
  endFrame() {
    this._keysPressed.clear();
    this._keysReleased.clear();
    this._actionsPressed.clear();
    this._camDx = 0;
    this._camDy = 0;
    this.touchCam.dx = 0;
    this.touchCam.dy = 0;
    this.zoomDelta = 0;
  }

  /** Set joystick values from JoystickUI (x, y in [-1,1]) */
  setJoystick(x, y, active) {
    this.joystick.x = x;
    this.joystick.y = y;
    this.joystick.active = active;
  }

  /** Set touch camera delta from JoystickUI */
  setCameraTouch(dx, dy) {
    this.touchCam.dx += dx;
    this.touchCam.dy += dy;
  }

  /** Is touch device? */
  static isTouchDevice() {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches
      || 'ontouchstart' in window;
  }
}
