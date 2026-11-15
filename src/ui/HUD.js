import { ScoringSystem } from '../engine/ScoringSystem.js';
import { storage } from '../engine/StorageManager.js';
import { audio } from '../engine/AudioManager.js';

export class HUD {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.metSeconds = 0;
    this.isRoverActive = false;
    this.activeKidTip = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'hud-container hidden';

    const mars = storage.state.marsState;

    this.element.innerHTML = `
      <!-- TOP STATUS BAR -->
      <div class="hud-top-bar">
        <div class="hud-brand">
          <span class="hud-dot"></span>
          <span class="hud-dest-label" id="hud-dest-name">MARS (JEZERO OUTPOST)</span>
        </div>

        <!-- 7.6 / 8.6 Generic Resource Trackers -->
        <div class="resources-row">
          <div class="resource-badge" title="Oxygen Supply">
            <span class="res-icon">🫧</span>
            <div class="res-bar-wrap">
              <span class="res-title">O₂</span>
              <div class="res-bar"><div class="res-fill" id="fill-o2" style="width: ${mars.oxygen}%;"></div></div>
            </div>
            <span class="res-val" id="val-o2">${mars.oxygen}%</span>
          </div>

          <div class="resource-badge" title="Recycled Water Reserves">
            <span class="res-icon">💧</span>
            <div class="res-bar-wrap">
              <span class="res-title">H₂O</span>
              <div class="res-bar"><div class="res-fill" id="fill-water" style="width: ${mars.water}%;"></div></div>
            </div>
            <span class="res-val" id="val-water">${mars.water}%</span>
          </div>

          <div class="resource-badge" title="Solar & Battery Base Power">
            <span class="res-icon">⚡</span>
            <div class="res-bar-wrap">
              <span class="res-title">PWR</span>
              <div class="res-bar"><div class="res-fill" id="fill-power" style="width: ${mars.power}%;"></div></div>
            </div>
            <span class="res-val" id="val-power">${mars.power}%</span>
          </div>

          <div class="resource-badge" title="Greenhouse Food Reserves">
            <span class="res-icon">🌱</span>
            <div class="res-bar-wrap">
              <span class="res-title">FOOD</span>
              <div class="res-bar"><div class="res-fill" id="fill-food" style="width: ${mars.food}%;"></div></div>
            </div>
            <span class="res-val" id="val-food">${mars.food}%</span>
          </div>

          <div class="resource-badge" title="Crew Vitals & Safety">
            <span class="res-icon">❤️</span>
            <div class="res-bar-wrap">
              <span class="res-title">CREW</span>
              <div class="res-bar"><div class="res-fill" id="fill-crew" style="width: ${mars.crewHealth}%;"></div></div>
            </div>
            <span class="res-val" id="val-crew">${mars.crewHealth}%</span>
          </div>
        </div>

        <!-- In-Game Quick Tool Bar for Mars Facilities -->
        <div class="hud-tools-bar">
          <button class="btn btn-tool" id="hud-btn-hab" title="Habitat Life-Support Loop">🏠 HAB</button>
          <button class="btn btn-tool" id="hud-btn-greenhouse" title="Bio-Greenhouse Crops">🌱 CROP</button>
          <button class="btn btn-tool" id="hud-btn-water" title="SWIM Subsurface Water Drill">💧 SWIM</button>
          <button class="btn btn-tool" id="hud-btn-rad" title="MSL RAD Dosimeter & Shelter">☢️ RAD</button>
          <button class="btn btn-tool" id="hud-btn-cargo" title="M02 Return Cargo Allocation">📦 CARGO</button>
          <button class="btn btn-tool" id="hud-btn-ascent" title="M02 MAV Departure Checklist">🚀 ASCENT</button>
          <button class="btn btn-tool" id="hud-btn-map" title="Open Science GIS Map">🗺️ MAP</button>
          <button class="btn btn-tool" id="hud-btn-alert" title="DONKI Solar Alert Simulator">🚨 ALERT</button>
        </div>

        <!-- Top Right Score & Time -->
        <div class="hud-top-right">
          <div class="score-widget" id="hud-score-widget" title="Click for Score Formula Breakdown">
            <span class="score-label">ACADEMY SCORE</span>
            <span class="score-val" id="hud-score-val">88</span>
          </div>
          <div class="time-widget">
            <span class="time-label">MET</span>
            <span class="time-val" id="hud-met-val">00:00:00</span>
          </div>
          <button class="btn btn-icon-only" id="hud-btn-menu" title="Menu / Pause">☰</button>
        </div>
      </div>

      <!-- ACTIVE MISSION OBJECTIVE TRACKER (TOP CENTER) -->
      <div class="active-mission-card hidden" id="active-mission-tracker">
        <div class="mission-tracker-header">
          <span class="mission-tracker-badge" id="tracker-mission-badge">ACTIVE EXPEDITION</span>
          <span class="mission-step-count" id="tracker-step-count">TASK 1 OF 5</span>
        </div>
        <div class="mission-tracker-body">
          <span class="tracker-icon" id="tracker-icon">🚗</span>
          <div class="tracker-text-wrap">
            <div class="tracker-task-title-row">
              <span class="tracker-task-title" id="tracker-title">Drive Rover to Ridge</span>
              <button class="info-btn-kid hidden" id="tracker-info-btn" title="Learn what this means!">ℹ️</button>
            </div>
            <div class="tracker-task-desc" id="tracker-desc">Follow the 3D glowing beacon on the horizon!</div>
          </div>
        </div>
        <div class="tracker-progress-bar">
          <div class="tracker-progress-fill" id="tracker-progress-fill" style="width: 20%;"></div>
        </div>
      </div>

      <!-- KID INFO POPUP TOOLTIP -->
      <div class="kid-info-popup hidden" id="kid-info-popup">
        <div class="kid-info-header">
          <span class="orbit-avatar">🤖</span>
          <span class="kid-info-title" id="kid-info-term">ORBIT'S SCIENCE DISCOVERY</span>
          <button class="kid-info-close" id="kid-info-close">&times;</button>
        </div>
        <p class="kid-info-text" id="kid-info-text">Explanation goes here...</p>
      </div>

      <!-- INTERACTION PROMPT -->
      <div class="interaction-prompt hidden" id="hud-interaction-prompt">
        <span class="key-badge" id="prompt-key">E</span>
        <span class="prompt-text" id="prompt-label">INVESTIGATE TARGET</span>
      </div>

      <!-- VEHICLE & STAMINA INDICATOR -->
      <div class="vehicle-indicator" id="hud-vehicle-indicator">
        <span class="mode-badge">MODE: EVA ASTRONAUT</span>
        <span class="mode-hint">Walk near rover [V] to drive • Press [C] to eat food</span>
      </div>

      <!-- EVA SUIT & TETHER RANGE HUD (BOTTOM LEFT) -->
      <div class="eva-vitals-card" id="eva-vitals-card">
        <div class="eva-row">
          <span class="eva-icon">🫧</span>
          <div class="eva-bar-wrap">
            <span class="eva-label">SUIT OXYGEN</span>
            <div class="eva-bar"><div class="eva-fill" id="eva-fill-o2" style="width: 100%;"></div></div>
          </div>
          <span class="eva-val" id="eva-val-o2">100%</span>
        </div>
        <div class="eva-row">
          <span class="eva-icon">⚡</span>
          <div class="eva-bar-wrap">
            <span class="eva-label" id="vehicle-power-label">SUIT BATTERY</span>
            <div class="eva-bar"><div class="eva-fill" id="eva-fill-power" style="width: 100%;"></div></div>
          </div>
          <span class="eva-val" id="eva-val-power">100%</span>
        </div>
        <div class="eva-tether-row">
          <span class="tether-icon">📍</span>
          <span class="tether-text" id="eva-tether-dist">Distance to Base: 12m</span>
          <span class="tether-badge safe" id="eva-tether-status">SAFE RANGE</span>
        </div>
      </div>

      <!-- TETHER OVER-RANGE WARNING BANNER -->
      <div class="tether-warning-banner hidden" id="tether-warning-banner">
        ⚠️ WARNING: EXCEEDING EVA LIFE-SUPPORT SAFETY RADIUS! RETURN TO BASE!
      </div>

      <!-- FLOATING NOTICE NOTIFICATION -->
      <div class="floating-notice hidden" id="hud-floating-notice"></div>

      <!-- CELEBRATION TASK BANNER -->
      <div class="task-celebration-banner hidden" id="hud-task-celebration">
        <div class="celeb-sparkles">✨ 🏆 ✨</div>
        <div class="celeb-title">TASK COMPLETED!</div>
        <div class="celeb-desc" id="celeb-task-name">Sweep Martian Dust</div>
        <div class="celeb-reward">+100 MISSION XP EARNED</div>
      </div>

      <!-- TOUCH CONTROLS (Mobile / Tablet) -->
      <div class="touch-controls-layer" id="touch-layer">
        <!-- Virtual Joystick Area -->
        <div class="joystick-zone" id="joystick-zone">
          <div class="joystick-base" id="joystick-base">
            <div class="joystick-thumb" id="joystick-thumb"></div>
          </div>
        </div>

        <!-- Touch Action Buttons -->
        <div class="touch-actions-zone">
          <button class="touch-btn touch-btn-primary" id="touch-btn-interact">
            <span>🔬</span>
            <label>ACTION [E]</label>
          </button>
          <button class="touch-btn touch-btn-accent" id="touch-btn-vehicle">
            <span>🚗</span>
            <label>ROVER [V]</label>
          </button>
          <button class="touch-btn touch-btn-food" id="touch-btn-eat">
            <span>🍎</span>
            <label>EAT [C]</label>
          </button>
          <button class="touch-btn" id="touch-btn-jump">
            <span>⬆️</span>
            <label>JUMP</label>
          </button>
          <button class="touch-btn" id="touch-btn-sprint">
            <span>⚡</span>
            <label>SPRINT</label>
          </button>
        </div>
      </div>
    `;

    // Tool bindings
    this.element.querySelector('#hud-btn-hab').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.habitatPanel.show();
    });

    this.element.querySelector('#hud-btn-greenhouse').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.greenhouseInterface.show();
    });

    this.element.querySelector('#hud-btn-water').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.waterInvestigationInterface.show();
    });

    this.element.querySelector('#hud-btn-rad').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.radiationSafetyInterface.show();
    });

    this.element.querySelector('#hud-btn-cargo').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.cargoDecisionInterface.show();
    });

    this.element.querySelector('#hud-btn-ascent').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.departureChecklistInterface.show();
    });

    this.element.querySelector('#hud-btn-map').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.scienceMapViewer.show();
    });

    this.element.querySelector('#hud-btn-alert').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.missionAlertModal.show();
    });

    // Score widget click
    const scoreWidget = this.element.querySelector('#hud-score-widget');
    scoreWidget.addEventListener('click', () => {
      audio.playClick();
      this.uiManager.multipleEndingsModal.showOutcome();
    });

    // Menu button
    this.element.querySelector('#hud-btn-menu').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.openMainMenu();
    });

    // Kid info button & popup
    const infoBtn = this.element.querySelector('#tracker-info-btn');
    const infoPopup = this.element.querySelector('#kid-info-popup');
    const infoClose = this.element.querySelector('#kid-info-close');

    infoBtn.addEventListener('click', () => {
      audio.playClick();
      if (this.activeKidTip) {
        this.element.querySelector('#kid-info-term').textContent = this.activeKidTip.term.toUpperCase();
        this.element.querySelector('#kid-info-text').textContent = this.activeKidTip.tip;
        infoPopup.classList.remove('hidden');
      }
    });

    infoClose.addEventListener('click', () => {
      audio.playClick();
      infoPopup.classList.add('hidden');
    });

    this.setupTouchInput();
  }

  setupTouchInput() {
    const zone = this.element.querySelector('#joystick-zone');
    const base = this.element.querySelector('#joystick-base');
    const thumb = this.element.querySelector('#joystick-thumb');

    let touchId = null;
    let baseRect = null;
    const maxRadius = 45;

    const onTouchStart = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touchId === null) {
          touchId = touch.identifier;
          baseRect = base.getBoundingClientRect();
          const centerX = baseRect.left + baseRect.width / 2;
          const centerY = baseRect.top + baseRect.height / 2;
          this.handleJoystickMove(touch.clientX - centerX, touch.clientY - centerY, thumb, maxRadius);
          break;
        }
      }
    };

    const onTouchMove = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId && baseRect) {
          const centerX = baseRect.left + baseRect.width / 2;
          const centerY = baseRect.top + baseRect.height / 2;
          this.handleJoystickMove(touch.clientX - centerX, touch.clientY - centerY, thumb, maxRadius);
          break;
        }
      }
    };

    const onTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          touchId = null;
          thumb.style.transform = `translate(-50%, -50%)`;
          if (this.uiManager.game && this.uiManager.game.input) {
            this.uiManager.game.input.setJoystickVector(0, 0);
          }
          break;
        }
      }
    };

    zone.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    // Touch action buttons
    const btnInteract = this.element.querySelector('#touch-btn-interact');
    const btnVehicle = this.element.querySelector('#touch-btn-vehicle');
    const btnEat = this.element.querySelector('#touch-btn-eat');
    const btnJump = this.element.querySelector('#touch-btn-jump');
    const btnSprint = this.element.querySelector('#touch-btn-sprint');

    btnInteract.addEventListener('touchstart', (e) => {
      e.preventDefault();
      audio.playClick();
      if (this.uiManager.game && this.uiManager.game.input) {
        this.uiManager.game.input.touchInteract = true;
      }
    });

    btnVehicle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      audio.playClick();
      if (this.uiManager.game && this.uiManager.game.input) {
        this.uiManager.game.input.touchToggleVehicle = true;
      }
    });

    btnEat.addEventListener('touchstart', (e) => {
      e.preventDefault();
      audio.playClick();
      if (this.uiManager.game && this.uiManager.game.input) {
        this.uiManager.game.input.touchConsumeFood = true;
      }
    });

    btnJump.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.uiManager.game && this.uiManager.game.input) {
        this.uiManager.game.input.touchJump = true;
      }
    });
    btnJump.addEventListener('touchend', () => {
      if (this.uiManager.game && this.uiManager.game.input) {
        this.uiManager.game.input.touchJump = false;
      }
    });

    btnSprint.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.uiManager.game && this.uiManager.game.input) {
        this.uiManager.game.input.touchSprint = true;
      }
    });
    btnSprint.addEventListener('touchend', () => {
      if (this.uiManager.game && this.uiManager.game.input) {
        this.uiManager.game.input.touchSprint = false;
      }
    });
  }

  handleJoystickMove(dx, dy, thumb, maxRadius) {
    const dist = Math.sqrt(dx * dx + dy * dy);
    let clampedX = dx;
    let clampedY = dy;
    if (dist > maxRadius) {
      clampedX = (dx / dist) * maxRadius;
      clampedY = (dy / dist) * maxRadius;
    }
    thumb.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;

    if (this.uiManager.game && this.uiManager.game.input) {
      this.uiManager.game.input.setJoystickVector(clampedX / maxRadius, clampedY / maxRadius);
    }
  }

  updateMissionTracker(mission, currentTask, currentTaskIndex) {
    const tracker = this.element.querySelector('#active-mission-tracker');
    if (!mission || !currentTask) {
      tracker.classList.add('hidden');
      return;
    }

    tracker.classList.remove('hidden');

    const totalTasks = mission.tasks.length;
    const taskNum = currentTaskIndex + 1;

    this.element.querySelector('#tracker-mission-badge').textContent = mission.title;
    this.element.querySelector('#tracker-step-count').textContent = `TASK ${taskNum} OF ${totalTasks}`;
    this.element.querySelector('#tracker-icon').textContent = currentTask.icon || '🎯';
    this.element.querySelector('#tracker-title').textContent = currentTask.title;
    this.element.querySelector('#tracker-desc').textContent = currentTask.instruction;

    const fillPercent = ((taskNum - 1) / totalTasks) * 100;
    this.element.querySelector('#tracker-progress-fill').style.width = `${Math.max(12, fillPercent)}%`;

    // Handle (i) info button
    const infoBtn = this.element.querySelector('#tracker-info-btn');
    if (currentTask.kidTip) {
      this.activeKidTip = { term: currentTask.kidTerm || 'Science Tip', tip: currentTask.kidTip };
      infoBtn.classList.remove('hidden');
    } else {
      this.activeKidTip = null;
      infoBtn.classList.add('hidden');
    }
  }

  showFloatingNotice(text) {
    const el = this.element.querySelector('#hud-floating-notice');
    el.textContent = text;
    el.classList.remove('hidden');
    setTimeout(() => {
      el.classList.add('hidden');
    }, 2800);
  }

  showTaskCelebration(taskTitle) {
    const el = this.element.querySelector('#hud-task-celebration');
    this.element.querySelector('#celeb-task-name').textContent = taskTitle;
    el.classList.remove('hidden');
    setTimeout(() => {
      el.classList.add('hidden');
    }, 3200);
  }

  updateVitals(suitO2, roverBattery, distFromBase, isRover) {
    const o2Val = Math.round(suitO2);
    const o2Fill = this.element.querySelector('#eva-fill-o2');
    const o2Text = this.element.querySelector('#eva-val-o2');
    if (o2Fill) o2Fill.style.width = `${o2Val}%`;
    if (o2Text) {
      o2Text.textContent = `${o2Val}%`;
      o2Text.style.color = o2Val < 25 ? '#ef4444' : '#f8fafc';
    }

    const powerVal = Math.round(roverBattery);
    const powerFill = this.element.querySelector('#eva-fill-power');
    const powerText = this.element.querySelector('#eva-val-power');
    const powerLabel = this.element.querySelector('#vehicle-power-label');
    if (powerLabel) powerLabel.textContent = isRover ? 'ROVER BATTERY' : 'SUIT BATTERY';
    if (powerFill) powerFill.style.width = `${powerVal}%`;
    if (powerText) powerText.textContent = isRover ? `${powerVal}% (~${(powerVal * 3.5).toFixed(0)}m)` : `${powerVal}%`;

    const distText = this.element.querySelector('#eva-tether-dist');
    const distStatus = this.element.querySelector('#eva-tether-status');
    const roundedDist = Math.round(distFromBase);
    if (distText) distText.textContent = `Distance to Base: ${roundedDist}m`;

    if (distStatus) {
      if (roundedDist > 180) {
        distStatus.textContent = 'DANGER: OUT OF BOUNDS';
        distStatus.className = 'tether-badge danger';
      } else if (roundedDist > 120) {
        distStatus.textContent = 'CAUTION';
        distStatus.className = 'tether-badge caution';
      } else {
        distStatus.textContent = 'SAFE RANGE';
        distStatus.className = 'tether-badge safe';
      }
    }
  }

  setTetherWarning(isOverRange) {
    const banner = this.element.querySelector('#tether-warning-banner');
    if (banner) {
      if (isOverRange) {
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }
    }
  }

  setDestinationName(name) {
    const el = this.element.querySelector('#hud-dest-name');
    if (el) el.textContent = name.toUpperCase();
  }

  setVehicleMode(isRover) {
    this.isRoverActive = isRover;
    const el = this.element.querySelector('#hud-vehicle-indicator');
    if (el) {
      el.innerHTML = isRover
        ? `<span class="mode-badge rover-badge">MODE: 6-WHEEL ROVER</span><span class="mode-hint">Press [V] to disembark</span>`
        : `<span class="mode-badge">MODE: EVA ASTRONAUT</span><span class="mode-hint">Walk near rover [V] to drive • Press [C] to eat food</span>`;
    }
  }

  showPrompt(key, label) {
    const p = this.element.querySelector('#hud-interaction-prompt');
    const k = this.element.querySelector('#prompt-key');
    const l = this.element.querySelector('#prompt-label');
    k.textContent = key;
    l.textContent = label;
    p.classList.remove('hidden');
  }

  hidePrompt() {
    const p = this.element.querySelector('#hud-interaction-prompt');
    p.classList.add('hidden');
  }

  update(delta) {
    // MET Timer
    this.metSeconds += delta;
    const hrs = Math.floor(this.metSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((this.metSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(this.metSeconds % 60).toString().padStart(2, '0');
    const timeEl = this.element.querySelector('#hud-met-val');
    if (timeEl) timeEl.textContent = `${hrs}:${mins}:${secs}`;

    // Score update
    const res = ScoringSystem.calculate(storage.state.scoreBreakdown);
    const scoreVal = this.element.querySelector('#hud-score-val');
    if (scoreVal) scoreVal.textContent = res.totalScore;

    // Refresh resource bars
    const mars = storage.state.marsState;
    const o2Fill = this.element.querySelector('#fill-o2');
    if (o2Fill) o2Fill.style.width = `${mars.oxygen}%`;
    const waterFill = this.element.querySelector('#fill-water');
    if (waterFill) waterFill.style.width = `${mars.water}%`;
    const powerFill = this.element.querySelector('#fill-power');
    if (powerFill) powerFill.style.width = `${mars.power}%`;
    const foodFill = this.element.querySelector('#fill-food');
    if (foodFill) foodFill.style.width = `${mars.food}%`;
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
