/* ============================================================
   FRONTIER: MISSION ACADEMY — Radiation Accumulation System
   Real NASA data: MSL RAD (Mars) & DONKI alerts (Moon/Mars)
   Scientific basis: 186.6 µGy/day EVA surface (MSL RAD Oct 2026)
   Lander/habitat shields reduce dose by ~85% (Orion MPCV spec)
   Career limit NASA: 600 mSv whole-body, ALARA ongoing standard
   ============================================================ */

export class RadiationSystem {
  constructor(engine) {
    this.engine = engine;

    /* ── Real data baselines (µGy/day from MSL RAD RDR) ── */
    this.scenes = {
      SANDBOX:   { evaRate: 60.0,   indoorRate: 9.0,   name: 'Proving Ground',   planet: 'earth' },
      MOON_M1:   { evaRate: 50.0,   indoorRate: 7.5,   name: 'Lunar South Pole', planet: 'moon'  },
      MOON_M2:   { evaRate: 55.0,   indoorRate: 8.3,   name: 'Lunar Thermal',    planet: 'moon'  },
      MARS_M1:   { evaRate: 186.6,  indoorRate: 28.0,  name: 'Jezero Crater',    planet: 'mars'  },
      MARS_M2:   { evaRate: 190.0,  indoorRate: 28.5,  name: 'Mars Ascent',      planet: 'mars'  }
    };

    // Current scene config
    this.currentConfig = this.scenes.SANDBOX;
    this.currentScene = 'SANDBOX';

    // Accumulation state
    this.accumulatedDose = 0;       // µGy total (session)
    this.instantRate = 0;           // µGy/hr current
    this.isInsideShelter = false;
    this.solarEventMultiplier = 1.0;// elevated during SPE
    this.solarEventActive = false;
    this.solarEventTimer = 0;
    this.solarEventDuration = 90;   // seconds of elevated radiation

    // Career dose tracking (persisted in ResourceSystem for HUD)
    this._healthDrainThreshold = 150; // µGy before crew health starts draining
    this._criticalThreshold    = 400; // µGy — critical warning

    // DOM badge element
    this.badgeEl   = null;
    this.rateEl    = null;
    this.doseEl    = null;
    this.shieldEl  = null;
    this._initBadge();
  }

  _initBadge() {
    this.badgeEl  = document.getElementById('hud-rad-badge');
    this.rateEl   = document.getElementById('rad-rate-value');
    this.doseEl   = document.getElementById('rad-dose-value');
    this.shieldEl = document.getElementById('rad-shield-status');
  }

  /* Called whenever a new game scene is entered */
  setScene(sceneName) {
    this.currentScene = sceneName;
    this.currentConfig = this.scenes[sceneName] || this.scenes.SANDBOX;
    this.solarEventActive = false;
    this.solarEventMultiplier = 1.0;
  }

  /* Called each frame by scene update(); isInsideShelter = lander.interiorActive */
  update(dt, isInsideShelter = false) {
    if (!['SANDBOX', 'MOON_M1', 'MOON_M2', 'MARS_M1', 'MARS_M2'].includes(this.currentScene)) return;

    this.isInsideShelter = isInsideShelter;

    // Solar event countdown
    if (this.solarEventActive) {
      this.solarEventTimer -= dt;
      if (this.solarEventTimer <= 0) {
        this.solarEventActive = false;
        this.solarEventMultiplier = 1.0;
        this.engine.showNotification('☀️ Solar particle event subsiding — EVA now safer', 'info', 4000);
      }
    }

    // Calculate current rate (µGy/day → µGy/sec conversion: /86400)
    const baseRate   = isInsideShelter ? this.currentConfig.indoorRate : this.currentConfig.evaRate;
    const ratePerSec = (baseRate * this.solarEventMultiplier) / 86400;
    const doseTick   = ratePerSec * dt;

    this.accumulatedDose += doseTick;
    // Store instantaneous rate in µGy/hr for display (×3600)
    this.instantRate = ratePerSec * 3600;

    // Health drain: starts gradually after threshold
    if (this.accumulatedDose > this._healthDrainThreshold && this.engine.resources) {
      const excess   = this.accumulatedDose - this._healthDrainThreshold;
      const severity = Math.min(excess / 300, 1.0); // escalates over next 300 µGy
      this.engine.resources.drain('crewCondition', severity * 0.004 * dt);
    }

    // Fire critical alert once
    if (this.accumulatedDose > this._criticalThreshold && !this._criticalFired) {
      this._criticalFired = true;
      this.engine.showNotification('☢️ RADIATION CRITICAL: Career dose threshold approaching — seek shelter NOW!', 'warning', 6000);
      this.engine.emit('radiation:critical', { dose: this.accumulatedDose });
    }

    this._updateBadge();
  }

  /* Called by EmergencyEventSystem / scene events when a solar particle event erupts */
  triggerSolarParticleEvent(multiplier = 8.0, durationSec = 90) {
    if (this.solarEventActive) return; // already active
    this.solarEventActive    = true;
    this.solarEventMultiplier = multiplier;
    this.solarEventTimer     = durationSec;
    this.solarEventDuration  = durationSec;

    const inside = this.isInsideShelter ? 'You are inside — well shielded (85% reduction)' : '⚠ You are OUTSIDE — seek lander shelter NOW!';
    this.engine.showNotification(
      `☀️ SOLAR PARTICLE EVENT: Radiation ×${multiplier.toFixed(0)} for ${durationSec}s — ${inside}`,
      this.isInsideShelter ? 'info' : 'warning', 7000
    );
  }

  /* Fully replenish when astronaut boards lander/habitat (called by lander) */
  onEnterShelter() {
    this.isInsideShelter = true;
    // Gradually heal — the lander shielding reduces new dose accumulation
  }

  onExitShelter() {
    this.isInsideShelter = false;
  }

  _updateBadge() {
    if (!this.badgeEl) {
      // Try to find elements again (DOM may not have been ready at construction)
      this._initBadge();
      if (!this.badgeEl) return;
    }

    // Rate colour: green → amber → red
    const rateClass = this.instantRate < 8 ? 'rad-green' : this.instantRate < 25 ? 'rad-amber' : 'rad-red';
    this.badgeEl.className = 'hud-rad-badge ' + rateClass;

    if (this.rateEl)   this.rateEl.textContent  = this.instantRate.toFixed(2);
    if (this.doseEl)   this.doseEl.textContent  = this.accumulatedDose.toFixed(1);
    if (this.shieldEl) {
      if (this.solarEventActive) {
        this.shieldEl.textContent = `☀️ SPE ×${this.solarEventMultiplier.toFixed(0)}`;
        this.shieldEl.style.color = '#ff4444';
      } else if (this.isInsideShelter) {
        this.shieldEl.textContent = '🛡 SHIELDED';
        this.shieldEl.style.color = '#00ff88';
      } else {
        this.shieldEl.textContent = '☢ EVA';
        this.shieldEl.style.color = this.instantRate < 8 ? '#00e5ff' : '#ffaa00';
      }
    }
  }

  reset() {
    this.accumulatedDose      = 0;
    this.solarEventActive     = false;
    this.solarEventMultiplier = 1.0;
    this._criticalFired       = false;
  }
}
