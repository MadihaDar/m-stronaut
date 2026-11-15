/* ============================================================
   FRONTIER: MISSION ACADEMY — Joystick & Touch Controls UI
   Virtual analog stick and camera swipe gesture listeners
   ============================================================ */

export class JoystickUI {
  constructor(engine) {
    this.engine = engine;

    this.container = document.getElementById('mobile-controls');
    this.zone = document.getElementById('joystick-zone');
    this.thumb = document.getElementById('joystick-thumb');
    this.camZone = document.getElementById('camera-zone');

    this.touchId = null;
    this.originX = 0;
    this.originY = 0;
    this.maxRadius = 55; // pixels

    this.camTouchId = null;
    this.lastCamX = 0;
    this.lastCamY = 0;

    this.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this._init();
  }

  _init() {
    this._bindJoystickEvents();
    this._bindCameraSwipeEvents();
    this._bindActionButtons();

    this.engine.on('state:change', (data) => {
      const gameplayStates = ['SANDBOX', 'MOON_M1', 'MOON_M2', 'MARS_M1', 'MARS_M2'];
      if (gameplayStates.includes(data.state)) {
        this.show();
      } else {
        this.hide();
      }
    });
  }

  show() {
    if (this.isTouch && this.container) {
      this.container.classList.add('active');
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.remove('active');
    }
  }

  _bindJoystickEvents() {
    if (!this.zone || !this.thumb) return;

    this.zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      this.touchId = touch.identifier;

      const rect = this.zone.getBoundingClientRect();
      this.originX = rect.left + rect.width * 0.5;
      this.originY = rect.top + rect.height * 0.5;

      this._handleTouchMove(touch.clientX, touch.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this.touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchId) {
          this._handleTouchMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    }, { passive: false });

    const endHandler = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchId) {
          this.touchId = null;
          this.thumb.style.transform = `translate(-50%, -50%)`;
          this.engine.input.setJoystick(0, 0, false);
          break;
        }
      }
    };

    window.addEventListener('touchend', endHandler);
    window.addEventListener('touchcancel', endHandler);
  }

  _handleTouchMove(clientX, clientY) {
    let dx = clientX - this.originX;
    let dy = clientY - this.originY;
    const dist = Math.hypot(dx, dy);

    if (dist > this.maxRadius) {
      dx = (dx / dist) * this.maxRadius;
      dy = (dy / dist) * this.maxRadius;
    }

    this.thumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    // Normalized input vector
    const nx = dx / this.maxRadius;
    const ny = dy / this.maxRadius; // forward is negative Y on screen
    this.engine.input.setJoystick(nx, ny, true);
  }

  _bindCameraSwipeEvents() {
    if (!this.camZone) return;

    this.camZone.addEventListener('touchstart', (e) => {
      const touch = e.changedTouches[0];
      this.camTouchId = touch.identifier;
      this.lastCamX = touch.clientX;
      this.lastCamY = touch.clientY;
    }, { passive: true });

    this.camZone.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.camTouchId) {
          const dx = touch.clientX - this.lastCamX;
          const dy = touch.clientY - this.lastCamY;
          this.engine.input.setCameraTouch(dx * 0.005, dy * 0.005);
          this.lastCamX = touch.clientX;
          this.lastCamY = touch.clientY;
          break;
        }
      }
    }, { passive: true });

    const endCam = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.camTouchId) {
          this.camTouchId = null;
          break;
        }
      }
    };
    this.camZone.addEventListener('touchend', endCam);
    this.camZone.addEventListener('touchcancel', endCam);
  }

  _bindActionButtons() {
    const btnJump = document.getElementById('btn-mobile-jump');
    if (btnJump) {
      btnJump.onclick = () => {
        this.engine.input.triggerAction('jump');
      };
    }

    const btnLander = document.getElementById('btn-mobile-lander');
    if (btnLander) {
      btnLander.onclick = () => {
        const scene = this.engine.currentScene;
        if (!scene || !scene.lander) return;
        const lander = scene.lander;
        if (lander.isFlying && lander.flightPhase === 'orbital') {
          lander.startLanding();
        } else if (lander.isOccupied) {
          lander.startFlight();
        } else if (scene.character) {
          const dist = scene.character.getPosition().distanceTo(lander.group.position);
          if (dist <= 7.0) {
            lander.startBoarding(scene.character);
          } else {
            this.engine.showNotification('Move closer to the lander to board!', 'info', 3000);
          }
        }
      };
    }

    const btnInteract = document.getElementById('btn-mobile-interact');
    if (btnInteract) {
      btnInteract.onclick = () => {
        this.engine.input.triggerAction('interact');
      };
    }

    const btnRover = document.getElementById('btn-mobile-rover');
    if (btnRover) {
      btnRover.onclick = () => {
        this.engine.input.triggerAction('roverToggle');
      };
    }

    const btnPause = document.getElementById('btn-mobile-pause');
    if (btnPause) {
      btnPause.onclick = () => {
        this.engine.input.triggerAction('pause');
      };
    }
  }
}
