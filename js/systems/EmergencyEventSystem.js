/* ============================================================
   FRONTIER: MISSION ACADEMY — Emergency Event & Dynamic Hazards System
   Handles real-time "STORM DANGER!" alerts, escape countdowns,
   sub-orbital flight safe zone rescues & DSN transmission delay
   ============================================================ */

export class EmergencyEventSystem {
  constructor(engine) {
    this.engine = engine;
    this.activeStorm = false;
    this.stormDangerActive = false;
    this.countdownTimer = 0;
    this.safeZoneTarget = null;

    // Cache DOM elements
    this.modalEl = document.getElementById('storm-emergency-modal');
    this.dsnBanner = document.getElementById('dsn-uplink-banner');
    this.dsnProgress = document.getElementById('dsn-uplink-progress');
    this.dsnText = document.getElementById('dsn-uplink-text');

    this._initDangerBannerDOM();
    this._bindEvents();
  }

  _initDangerBannerDOM() {
    this.dangerBanner = document.getElementById('storm-danger-banner');
    if (!this.dangerBanner) {
      this.dangerBanner = document.createElement('div');
      this.dangerBanner.id = 'storm-danger-banner';
      this.dangerBanner.className = 'storm-danger-banner';
      this.dangerBanner.innerHTML = `
        <div class="danger-icon">⚠️</div>
        <div class="danger-content">
          <div class="danger-title">STORM DANGER! RETREAT TO SPACECRAFT!</div>
          <div class="danger-sub">Gale-force regolith winds & radiation spike detected!</div>
        </div>
        <div id="storm-countdown-num" class="danger-timer">00:45</div>
      `;
      document.body.appendChild(this.dangerBanner);
    }
  }

  _bindEvents() {
    const btnChoice1 = document.getElementById('btn-storm-shelter');
    if (btnChoice1) {
      btnChoice1.onclick = () => this.resolveStormChoice('shelter');
    }

    const btnChoice2 = document.getElementById('btn-storm-sample');
    if (btnChoice2) {
      btnChoice2.onclick = () => this.resolveStormChoice('sample');
    }

    const btnChoice3 = document.getElementById('btn-storm-power');
    if (btnChoice3) {
      btnChoice3.onclick = () => this.resolveStormChoice('power');
    }

    const btnClose = document.getElementById('btn-close-storm');
    if (btnClose) {
      btnClose.onclick = () => this.hideStormModal();
    }
  }

  /* ── Deep Space Network Speed-of-Light Communication Delay ── */
  transmitToHouston(packetName, onResponse = null, isMars = true) {
    if (!this.dsnBanner) return;

    this.engine.audio.playQuindarTone();
    this.dsnBanner.classList.add('visible');

    const delayDist = isMars ? '225,000,000 km (14m 24s Light Travel)' : '384,400 km (1.3s Light Travel)';
    const station = isMars ? 'DSN GOLDSTONE 70M DISH' : 'DSN MADRID GROUND STATION';

    if (this.dsnText) {
      this.dsnText.innerHTML = `<strong>[${station}]</strong> UPLINKING: <em>${packetName}</em><br><small>Speed-of-Light Propagation Distance: ${delayDist}</small>`;
    }

    let progress = 0;
    const duration = isMars ? 3200 : 1300;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      progress += step;
      if (this.dsnProgress) {
        this.dsnProgress.style.width = `${Math.min(100, progress)}%`;
      }

      if (progress >= 100) {
        clearInterval(timer);
        this.engine.audio.playQuindarTone();
        if (this.dsnText) {
          this.dsnText.innerHTML = `<strong>[MISSION CONTROL (HOUSTON)]</strong> SIGNAL CONFIRMED! Telemetry packet logged into NASA Planetary Data System.`;
        }

        setTimeout(() => {
          this.dsnBanner.classList.remove('visible');
          if (this.dsnProgress) this.dsnProgress.style.width = '0%';
          if (onResponse) onResponse();
        }, 1800);
      }
    }, interval);
  }

  /**
   * Phase 5: Dynamic Storm Hazard with 45s Escape Countdown & Flight Safe Zone
   */
  triggerStormDanger(sectorName = 'JEZERO CRATER DELTA', safeZonePos = { x: 35, y: 0, z: -40 }, countdownSec = 45) {
    this.stormDangerActive = true;
    this.countdownTimer = countdownSec;
    this.safeZoneTarget = safeZonePos;

    this.dangerBanner.classList.add('visible');
    this.engine.audio.playWarning();

    if (this.engine.hud && this.engine.hud.triggerDamageVignette) {
      this.engine.hud.triggerDamageVignette();
    }

    this.engine.showNotification('🚨 CRITICAL HAZARD: Run back to your spaceship before the storm strikes!', 'danger', 7000);

    // Guide player back to lander
    const scene = this.engine.currentScene;
    if (scene && scene.waypointSystem && scene.lander) {
      scene.waypointSystem.setWaypoint({
        id: 'escape_lander',
        name: 'SPACECRAFT REFUGE AIRLOCK',
        position: scene.lander.getPosition(),
        bullets: [
          'Escape the violent surface particle storm!',
          'Board spaceship to initiate Sub-Orbital Flight Mode'
        ],
        funFact: 'Fact: Martian dust storms can grow so huge they envelop the entire planet in days!'
      });
    }
  }

  update(dt) {
    if (!this.stormDangerActive) return;

    this.countdownTimer -= dt;
    const sec = Math.max(0, Math.ceil(this.countdownTimer));
    const timerEl = document.getElementById('storm-countdown-num');
    if (timerEl) {
      timerEl.textContent = `00:${String(sec).padStart(2, '0')}`;
    }

    // Check if player has boarded lander
    const scene = this.engine.currentScene;
    if (scene && scene.lander && scene.lander.isOccupied) {
      // Player made it inside the ship safely!
      this.stormDangerActive = false;
      this.dangerBanner.classList.remove('visible');
      this.engine.showNotification('★ REFUGE REACHED! Engaging Spaceship Flight Mode to escape to the Safe Zone!', 'success', 6000);

      // Trigger Kinematic Sub-Orbital Flight Mode
      scene.lander.startFlight(this.safeZoneTarget);
      return;
    }

    // Countdown reached 0 before player entered ship
    if (this.countdownTimer <= 0) {
      this.stormDangerActive = false;
      this.dangerBanner.classList.remove('visible');
      if (this.engine.resources) {
        this.engine.resources.drain('crewCondition', 25);
        this.engine.resources.drain('oxygen', 30);
      }
      this.engine.audio.playDamageSting();
      this.engine.showNotification('⚠️ STORM IMPACT: Suit integrity compromised from abrasive regolith particles!', 'danger', 6000);
    }
  }

  /* Trigger Sudden Planetary Crisis Decision Modal */
  triggerStormCrisis(sectorName = 'JEZERO CRATER RIVER DELTA') {
    this.activeStorm = true;
    this.engine.audio.playWarning();

    if (this.modalEl) {
      this.engine.showPanel('storm-emergency-modal');
    }

    const locationLabel = document.getElementById('storm-location-label');
    if (locationLabel) {
      locationLabel.textContent = `CRITICAL ALERT AT: ${sectorName}`;
    }

    this.engine.showNotification('EMERGENCY: Category 4 Planetary Dust Storm Detected! Immediate Decision Required!', 'danger', 6000);
  }

  resolveStormChoice(choice) {
    this.engine.audio.playUIClick();
    this.hideStormModal();

    const res = this.engine.resources;
    if (!res) return;

    if (choice === 'shelter') {
      res.set('oxygen', 100);
      res.healCrew(10);
      res.drain('power', 12);
      this.transmitToHouston('EMERGENCY EVA RETREAT PACKET', () => {
        this.engine.showNotification('SHELTER SECURED: Crew inside pressurized cabin. Suit O2 and health preserved at 100%!', 'success', 5000);
      });
    } else if (choice === 'sample') {
      res.drain('oxygen', 22);
      res.drain('water', 18);
      res.drain('crewCondition', 14);
      res.drain('roverEnergy', 15);
      if (this.engine.scoring) this.engine.scoring.add(350, 'Brave Storm Sample Recovery');
      if (this.engine.hud) this.engine.hud.triggerDamageVignette();
      this.transmitToHouston('EXPEDITION HIGH-VALUE SAMPLE DATA', () => {
        this.engine.showNotification('HEROIC RECOVERY: Drill core saved (+350 PTS)! Suit O2 and hull took minor dust abrasions.', 'warning', 5500);
      });
    } else if (choice === 'power') {
      res.set('power', 95);
      res.drain('roverEnergy', 25);
      this.transmitToHouston('POWER GRID FUEL CELL DIVERSION', () => {
        this.engine.showNotification('GRID STABILIZED: Auxiliary fuel cells online. Base life-support secured at 95%!', 'info', 5000);
      });
    }

    if (this.engine.hud) {
      this.engine.hud.update();
    }
  }

  hideStormModal() {
    if (this.modalEl) {
      this.engine.hidePanel('storm-emergency-modal');
    }
  }
}
