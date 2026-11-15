/* ============================================================
   FRONTIER: MISSION ACADEMY — Resource System
   Tracks life support & rover power telemetry
   ============================================================ */

export class ResourceSystem {
  constructor(engine) {
    this.engine = engine;

    this.resources = {
      oxygen: {
        current: 100,
        max: 100,
        rate: 0.04, // % per second (NASA-STD-3001: 0.84 kg O2/day)
        label: 'Oxygen (O₂)'
      },
      water: {
        current: 100,
        max: 100,
        rate: 0.02, // % per second (NASA: 2.5 L water/day)
        label: 'Water (H₂O)'
      },
      food: {
        current: 100,
        max: 100,
        rate: 0.015, // % per second (NASA HRP: 2,500-3,000 kcal/day metabolic consumption)
        label: 'Food Rations'
      },
      power: {
        current: 100,
        max: 100,
        rate: 0.03,
        label: 'Base Power'
      },
      roverEnergy: {
        current: 100,
        max: 100,
        rate: 0.0, // 0 when parked
        label: 'Rover Energy'
      },
      crewCondition: {
        current: 100,
        max: 100,
        rate: 0.008,
        label: 'Crew Health'
      }
    };

    this.missionTime = 0; // seconds
    this.roverActive = false;

    // Track state thresholds to avoid repeating alerts
    this._warned = {
      oxygen: false,
      water: false,
      food: false,
      power: false,
      roverEnergy: false,
      crewCondition: false
    };

    this._critical = {
      oxygen: false,
      water: false,
      food: false,
      power: false,
      roverEnergy: false,
      crewCondition: false
    };
  }

  update(dt) {
    this.missionTime += dt;

    for (const [key, res] of Object.entries(this.resources)) {
      if (res.rate > 0) {
        res.current = Math.max(0, res.current - res.rate * dt);
      }

      const pct = this.getPercent(key);

      // 30% Hard Fail State: If ANY primary entity drops to 30%, trigger MISSION FAILED!
      if (pct <= 30 && !this._hardFailed && this.engine && typeof this.engine.isSurfaceExpedition === 'function' && this.engine.isSurfaceExpedition()) {
        this._hardFailed = true;
        if (typeof this.engine.triggerMissionFailed === 'function') {
          this.engine.triggerMissionFailed({
            title: 'CRITICAL RESOURCE DEPLETION (≤ 30%)',
            reason: `${res.label} dropped to ${Math.round(pct)}%!`,
            desc: 'NASA Deep Space Life Support Rule: When ANY vital consumable drops to 30%, expedition safety is severely compromised. Conserve resources and balance trade-offs to keep reserves healthy!'
          });
        }
      }

      // Warning threshold (45%)
      if (pct <= 45 && !this._warned[key]) {
        this._warned[key] = true;
        this.engine.emit('resource:warning', { name: key, label: res.label, percent: pct });
      } else if (pct > 50) {
        this._warned[key] = false;
      }

      // Critical threshold (35%)
      if (pct <= 35 && !this._critical[key]) {
        this._critical[key] = true;
        this.engine.emit('resource:critical', { name: key, label: res.label, percent: pct });
      } else if (pct > 40) {
        this._critical[key] = false;
      }

      // Depletion
      if (res.current <= 0) {
        this.engine.emit('resource:depleted', { name: key, label: res.label });
      }
    }

    // Physiological Consequences on Health Conditions:
    // 1. Oxygen Depletion (Hypoxia / Asphyxiation): Rapid health collapse
    if (this.resources.oxygen.current <= 0) {
      this.modify('crewCondition', -0.4 * dt, 'Suffocation Hazard');
    }
    // 2. Dehydration: Progressive organ stress
    if (this.resources.water.current <= 0) {
      this.modify('crewCondition', -0.15 * dt, 'Severe Dehydration');
    }
    // 3. Caloric Starvation: Muscle and cognitive decline
    if (this.resources.food.current <= 0) {
      this.modify('crewCondition', -0.08 * dt, 'Metabolic Depletion');
    }
  }

  initMissionLevels(customLevels = null) {
    const defaults = {
      power: 100,         // Outpost primary power pool fully energized
      oxygen: 100,        // Cabin/EVA suit tank reserve at 100% capacity
      water: 100,         // Closed-loop recycler potable water tanks 100% full
      food: 100,          // Complete balanced nutrient rations at 100%
      roverEnergy: 100,   // High-capacity rover battery fully charged at 100%
      crewCondition: 100  // Optimal astronaut physiological condition at 100%
    };

    // Check if we have persistent campaign resources saved from previous missions
    const savedCampaignRes = this.engine?.save?.getCampaignResources ? this.engine.save.getCampaignResources() : null;
    const baseLevels = savedCampaignRes || defaults;
    const levels = Object.assign({}, baseLevels, customLevels || {});

    for (const [key, val] of Object.entries(levels)) {
      if (this.resources[key]) {
        this.resources[key].current = Math.max(0, Math.min(this.resources[key].max, val));
      }
    }
    this.missionTime = 0;
    this._hardFailed = false;
    for (const k in this._warned) this._warned[k] = false;
    for (const k in this._critical) this._critical[k] = false;
    if (this.engine && this.engine.hud) {
      this.engine.hud.update();
    }
  }

  getSnapshot() {
    return {
      power: Math.round(this.getPercent('power')),
      oxygen: Math.round(this.getPercent('oxygen')),
      water: Math.round(this.getPercent('water')),
      food: Math.round(this.getPercent('food')),
      roverEnergy: Math.round(this.getPercent('roverEnergy')),
      crewCondition: Math.round(this.getPercent('crewCondition'))
    };
  }

  get(name) {
    return this.resources[name] || null;
  }

  getPercent(name) {
    const res = this.resources[name];
    if (!res) return 0;
    return (res.current / res.max) * 100;
  }

  modify(name, delta, reason = null) {
    const res = this.resources[name];
    if (!res) return;
    const oldVal = res.current;
    res.current = Math.max(0, Math.min(res.max, res.current + delta));
    const actualDelta = res.current - oldVal;

    // Persist calculated updated entities seamlessly across all subsequent missions
    if (this.engine?.save?.saveCampaignResources) {
      this.engine.save.saveCampaignResources(this.getSnapshot());
    }

    // Emit physical consequence badge event on screen
    if (Math.abs(actualDelta) >= 0.5) {
      this.engine.emit('resource:delta', {
        name,
        label: res.label,
        delta: actualDelta,
        current: res.current,
        reason
      });
    } else if (delta > 0 && res.current >= res.max) {
      // If resource was already near max, still give user feedback that it's capped!
      this.engine.emit('resource:delta', {
        name,
        label: `${res.label} (MAX)`,
        delta: 0.1,
        current: res.current,
        reason: 'Reservoir Capped at 100%'
      });
    }

    // Immediately refresh HUD so bars update without waiting
    if (this.engine && this.engine.hud) {
      this.engine.hud.update();
    }

    // 30% Hard Fail State: If ANY primary entity drops to <= 30%, trigger MISSION FAILED!
    const pct = this.getPercent(name);
    if (pct <= 30 && !this._hardFailed && this.engine && typeof this.engine.isSurfaceExpedition === 'function' && this.engine.isSurfaceExpedition()) {
      this._hardFailed = true;
      if (typeof this.engine.triggerMissionFailed === 'function') {
        this.engine.triggerMissionFailed({
          title: 'CRITICAL RESOURCE DEPLETION (≤ 30%)',
          reason: `${res.label} dropped to ${Math.round(pct)}%!`,
          desc: 'NASA Deep Space Life Support Rule: When ANY vital consumable drops to 30%, expedition safety is severely compromised. Conserve resources and balance trade-offs to keep reserves healthy!'
        });
      }
    }
  }

  /* Convenience: set a resource to an absolute percentage value (0–100) */
  set(name, pct, reason = null) {
    const res = this.resources[name];
    if (!res) return;
    const target = Math.max(0, Math.min(res.max, (pct / 100) * res.max));
    this.modify(name, target - res.current, reason);
  }

  /* Heal crew by an absolute amount */
  healCrew(amount, reason = null) {
    this.modify('crewCondition', amount, reason);
  }

  /* Drain a resource by an amount (positive = reduce) */
  drain(name, amount, reason = null) {
    this.modify(name, -Math.abs(amount), reason);
  }

  setRate(name, rate) {
    if (this.resources[name]) {
      this.resources[name].rate = rate;
    }
  }

  setRoverActive(active) {
    this.roverActive = active;
    if (active) {
      this.resources.roverEnergy.rate = 0.12; // Depletes during rover drive
    } else {
      this.resources.roverEnergy.rate = 0.0;
    }
  }

  reset() {
    this.initMissionLevels();
  }
}
