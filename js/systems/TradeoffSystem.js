/* ============================================================
   FRONTIER: MISSION ACADEMY — Mission Tradeoff & Power Allocation System
   Simulates authentic NASA operational tradeoffs:
   Resource Cost (Power / O2 / Food) vs Science Return vs Crew Health
   Based on NASA Space Apps Challenge "Junior Astronaut Mission Trainer"
   ============================================================ */

export class TradeoffSystem {
  constructor(engine) {
    this.engine = engine;
    this.activeDecision = null;

    // Active Outpost Power Distribution Mode
    // 'BALANCED' | 'OXYGEN_PRIORITY' | 'SHIELD_PRIORITY' | 'GROWTH_PRIORITY'
    this.currentMode = 'BALANCED';

    this.modes = {
      BALANCED: {
        id: 'BALANCED',
        name: '⚖️ BALANCED TEAM',
        icon: '⚖️',
        tagline: 'Everyone Shares Power Fairly',
        desc: 'Gives equal battery power to fresh air, warm heaters, the space farm, and your rover!',
        allocations: { lifeSupport: 34, shielding: 33, mobility: 33 },
        badges: ['Standard Power Drain', 'Safe Breathing Air', 'Good Shield Defense'],
        color: '#00e5ff'
      },
      OXYGEN_PRIORITY: {
        id: 'OXYGEN_PRIORITY',
        name: '🫁 SUPER AIR & COZY WARMTH',
        icon: '🫁',
        tagline: 'Extra Fresh Oxygen & Warm Heaters',
        desc: 'Pumps lots of clean breathing air and keeps astronauts warm and cozy! Heals health, but uses more battery.',
        allocations: { lifeSupport: 60, shielding: 20, mobility: 20 },
        badges: ['Fills Air Fast', 'Heals Astronaut Health', 'Uses More Battery'],
        color: '#33aaff'
      },
      SHIELD_PRIORITY: {
        id: 'SHIELD_PRIORITY',
        name: '🛡️ FORCE FIELD SHIELD',
        icon: '🛡️',
        tagline: 'Blocks Dangerous Solar Storms',
        desc: 'Turns on a giant magnetic shield dome to protect astronauts from space radiation! Uses lots of battery.',
        allocations: { lifeSupport: 25, shielding: 60, mobility: 15 },
        badges: ['98% Radiation Blocked', 'Safe In Solar Storms', 'High Power Drain'],
        color: '#ffaa00'
      },
      GROWTH_PRIORITY: {
        id: 'GROWTH_PRIORITY',
        name: '🌱 SPACE FARM & ROVER BOOST',
        icon: '🌱',
        tagline: 'Fresh Snacks & Fast Rover Charging',
        desc: 'Grows crunchy space salad under bright lights and charges your rover battery super fast!',
        allocations: { lifeSupport: 25, shielding: 15, mobility: 60 },
        badges: ['Grows Fresh Food', 'Fast Rover Recharging', 'Uses Moderate Power'],
        color: '#00ff88'
      }
    };

    this._initModalDOM();
    this._initPowerConsoleDOM();
  }

  /* ── 1. Discrete NASA Operational Dilemma Modal ── */
  _initModalDOM() {
    this.modalEl = document.getElementById('mission-tradeoff-modal');
    if (!this.modalEl) {
      this.modalEl = document.createElement('div');
      this.modalEl.id = 'mission-tradeoff-modal';
      this.modalEl.className = 'tradeoff-decision-modal';
      document.body.appendChild(this.modalEl);
    }
  }

  /* ── 2. Interactive Outpost Power Reroute Console Modal ── */
  _initPowerConsoleDOM() {
    this.consoleEl = document.getElementById('outpost-power-modal');
    if (!this.consoleEl) {
      this.consoleEl = document.createElement('div');
      this.consoleEl.id = 'outpost-power-modal';
      this.consoleEl.className = 'power-reroute-modal';
      document.body.appendChild(this.consoleEl);
    }
  }

  /**
   * Continuous real-time frame loop (called by GameEngine during surface missions)
   */
  update(dt) {
    const res = this.engine.resources;
    if (!res) return;

    const powerPct = res.getPercent('power');

    // If power is completely depleted (0%) -> Outpost Blackout!
    if (powerPct <= 0) {
      // Blackout emergency: health and oxygen drain rapidly!
      res.modify('oxygen', -0.15 * dt);
      res.modify('crewCondition', -0.10 * dt);
      return;
    }

    if (this.currentMode === 'OXYGEN_PRIORITY') {
      // Oxygen regenerates and health slowly restores with gentle balanced power draw
      if (res.getPercent('oxygen') < 99) res.modify('oxygen', 0.25 * dt);
      if (res.getPercent('crewCondition') < 99) res.modify('crewCondition', 0.10 * dt);
      res.modify('power', -0.04 * dt);
    } else if (this.currentMode === 'SHIELD_PRIORITY') {
      // Radiation deflected with gentle balanced shield power draw
      res.modify('power', -0.06 * dt);
      // Suppress radiation rate in RadiationSystem
      if (this.engine.radiation) {
        this.engine.radiation.instantRate = Math.min(this.engine.radiation.instantRate, 0.05);
      }
    } else if (this.currentMode === 'GROWTH_PRIORITY') {
      // Food and rover battery replenish with gentle balanced power draw
      if (res.getPercent('food') < 99) res.modify('food', 0.25 * dt);
      if (res.getPercent('roverEnergy') < 99) res.modify('roverEnergy', 0.35 * dt);
      res.modify('power', -0.04 * dt);
    }
  }

  /**
   * Set active outpost power distribution mode
   */
  setPowerMode(modeKey) {
    if (!this.modes[modeKey]) return;
    const oldMode = this.currentMode;
    this.currentMode = modeKey;
    const mode = this.modes[modeKey];

    // Gentle balanced reallocation shift on power grid change (never dropping power by 10-20% abruptly)
    if (oldMode !== modeKey && this.engine.resources) {
      if (modeKey === 'OXYGEN_PRIORITY') {
        this.engine.resources.modify('power', -4, 'Air Scrubbers Active');
        this.engine.resources.modify('oxygen', 10, 'Clean Oxygen Scrubbing');
        this.engine.resources.modify('crewCondition', 5, 'Cabin Heating');
      } else if (modeKey === 'GROWTH_PRIORITY') {
        this.engine.resources.modify('power', -4, 'Hydroponics & Super-Charge');
        this.engine.resources.modify('food', 12, 'Space Farm Harvest');
        this.engine.resources.modify('roverEnergy', 15, 'Rover Charging');
      } else if (modeKey === 'SHIELD_PRIORITY') {
        this.engine.resources.modify('power', -5, 'Shield Dome Active');
        this.engine.resources.modify('crewCondition', 8, 'Radiation Deflector');
      } else if (modeKey === 'BALANCED') {
        this.engine.resources.modify('power', 4, 'Balanced Grid Restored');
        this.engine.resources.modify('roverEnergy', 5, 'Balanced Sharing');
      }
    }

    this.engine.audio.playTone(550, 0.12, 'sine', 0.3);
    setTimeout(() => this.engine.audio.playTone(880, 0.16, 'sine', 0.35), 80);

    // Update HUD Mode Badge
    const badgeEl = document.getElementById('hud-tradeoff-badge');
    if (badgeEl) {
      badgeEl.innerHTML = `${mode.icon} ${mode.name}`;
      badgeEl.style.borderColor = mode.color;
      badgeEl.style.color = mode.color;
    }

    // Refresh HUD
    if (this.engine.hud) {
      this.engine.hud.update();
    }

    this.engine.showNotification(`⚡ OUTPOST POWER REROUTED: ${mode.name} engaged!`, 'success', 4500);

    // Re-render open console if visible
    if (this.consoleEl && this.consoleEl.classList.contains('visible')) {
      this._renderPowerConsoleHTML();
    }
  }

  /**
   * Check if power reroute console is currently open
   */
  isConsoleOpen() {
    return !!(this.consoleEl && this.consoleEl.classList.contains('visible'));
  }

  /**
   * Toggles the Power Reroute Console
   */
  togglePowerRerouteConsole() {
    if (this.isConsoleOpen()) {
      this.closePowerConsole();
    } else {
      this.openPowerRerouteConsole();
    }
  }

  openPowerRerouteConsole() {
    if (!this.consoleEl) return;
    this._renderPowerConsoleHTML();
    this.consoleEl.classList.add('visible');

    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) {
      backdrop.classList.add('visible');
      backdrop.onclick = () => this.closePowerConsole();
    }

    // Pause background simulation when power console is open
    this.engine.isGamePaused = true;
    this.engine.audio.playTone(480, 0.1, 'triangle', 0.25);
  }

  closePowerConsole() {
    if (this.consoleEl) this.consoleEl.classList.remove('visible');
    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) backdrop.classList.remove('visible');
    // Unpause background simulation
    this.engine.isGamePaused = false;
  }

  _renderPowerConsoleHTML() {
    const res = this.engine.resources;
    const powerPct = res ? Math.round(res.getPercent('power')) : 100;
    const o2Pct = res ? Math.round(res.getPercent('oxygen')) : 100;
    const foodPct = res ? Math.round(res.getPercent('food')) : 100;
    const healthPct = res ? Math.round(res.getPercent('crewCondition')) : 100;

    const activeMode = this.modes[this.currentMode];
    const alloc = activeMode.allocations;

    const cardsHTML = Object.values(this.modes).map((m) => {
      const isActive = m.id === this.currentMode;
      const badgesHTML = m.badges.map(b => `<span class="power-mode-badge">${b}</span>`).join('');

      return `
        <div class="power-mode-card ${isActive ? 'active' : ''}" data-mode-id="${m.id}" style="--accent-col: ${m.color}">
          <div class="mode-card-header">
            <span class="mode-card-icon">${m.icon}</span>
            <div class="mode-card-titles">
              <span class="mode-card-name">${m.name}</span>
              <span class="mode-card-tagline">${m.tagline}</span>
            </div>
            ${isActive ? '<span class="mode-active-pill">● SELECTED & ACTIVE</span>' : `<button class="mode-select-btn" data-select-id="${m.id}">CHOOSE THIS ▶</button>`}
          </div>
          <p class="mode-card-desc">${m.desc}</p>
          <div class="mode-badges-row">${badgesHTML}</div>
        </div>
      `;
    }).join('');

    this.consoleEl.innerHTML = `
      <div class="power-console-header">
        <div class="power-console-title-group">
          <span class="power-console-icon">⚡</span>
          <div>
            <h2 class="power-console-title">MOON BASE POWER CONTROLS</h2>
            <span class="power-console-subtitle">Choose how your Moon base shares its battery power!</span>
          </div>
        </div>
      </div>

      <div class="power-console-body">
        <!-- Outpost Battery & Vitals Overview -->
        <div class="power-status-banner">
          <div class="power-stat-box">
            <span class="stat-label">⚡ BASE BATTERY</span>
            <div class="stat-value-row">
              <span class="stat-val ${powerPct < 30 ? 'val-danger' : 'val-power'}">${powerPct}%</span>
              <span class="stat-sub">MAIN POWER TANK</span>
            </div>
            <div class="power-track-small"><div class="power-fill-small" style="width: ${powerPct}%;"></div></div>
          </div>

          <div class="power-stat-box">
            <span class="stat-label">🫁 FRESH AIR (O₂)</span>
            <div class="stat-value-row">
              <span class="stat-val ${o2Pct < 30 ? 'val-danger' : 'val-o2'}">${o2Pct}%</span>
              <span class="stat-sub">CLEAN OXYGEN TO BREATHE</span>
            </div>
            <div class="power-track-small"><div class="o2-fill-small" style="width: ${o2Pct}%;"></div></div>
          </div>

          <div class="power-stat-box">
            <span class="stat-label">🥗 TASTY FOOD</span>
            <div class="stat-value-row">
              <span class="stat-val ${foodPct < 30 ? 'val-danger' : 'val-food'}">${foodPct}%</span>
              <span class="stat-sub">SPACE GREENHOUSE HARVEST</span>
            </div>
            <div class="power-track-small"><div class="food-fill-small" style="width: ${foodPct}%;"></div></div>
          </div>

          <div class="power-stat-box">
            <span class="stat-label">❤️ CREW HEALTH</span>
            <div class="stat-value-row">
              <span class="stat-val ${healthPct < 30 ? 'val-danger' : 'val-health'}">${healthPct}%</span>
              <span class="stat-sub">ASTRONAUT FEELING GREAT</span>
            </div>
            <div class="power-track-small"><div class="health-fill-small" style="width: ${healthPct}%;"></div></div>
          </div>
        </div>

        <!-- Real-Time Power Distribution Meters (The 100% Allocation Pool) -->
        <div class="power-allocation-container">
          <div class="alloc-header">
            <span class="alloc-title">📊 HOW 100% BASE ENERGY IS SHARED RIGHT NOW</span>
            <span class="alloc-current-mode" style="color: ${activeMode.color}">CURRENT PLAN: ${activeMode.name}</span>
          </div>
          
          <div class="alloc-meters-grid">
            <div class="alloc-item">
              <div class="alloc-row">
                <span>🫁 Fresh Breathing Air & Heaters</span>
                <span class="alloc-num">${alloc.lifeSupport}%</span>
              </div>
              <div class="alloc-track"><div class="alloc-fill fill-ls" style="width: ${alloc.lifeSupport}%;"></div></div>
            </div>

            <div class="alloc-item">
              <div class="alloc-row">
                <span>🛡️ Force Field Shield (Blocks Radiation)</span>
                <span class="alloc-num">${alloc.shielding}%</span>
              </div>
              <div class="alloc-track"><div class="alloc-fill fill-shield" style="width: ${alloc.shielding}%;"></div></div>
            </div>

            <div class="alloc-item">
              <div class="alloc-row">
                <span>🌱 Space Farm & Fast Rover Charger</span>
                <span class="alloc-num">${alloc.mobility}%</span>
              </div>
              <div class="alloc-track"><div class="alloc-fill fill-growth" style="width: ${alloc.mobility}%;"></div></div>
            </div>
          </div>
        </div>

        <!-- Interactive Priority Mode Cards -->
        <div class="power-modes-list">
          <div class="modes-list-title">👇 PICK A POWER PLAN FOR YOUR CREW:</div>
          ${cardsHTML}
        </div>
      </div>

      <!-- Centered Bottom Clean Action Bar -->
      <div class="power-console-footer" style="padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; gap: 14px;">
        <button id="btn-resume-power-expedition" class="btn btn-primary" style="font-weight: 800; font-size: 0.95rem; background: linear-gradient(135deg, #0284c7, #00e5ff); border: 2px solid #00e5ff; color: #040812; padding: 12px 30px; border-radius: var(--r-pill); cursor: pointer; box-shadow: 0 4px 15px rgba(0, 229, 255, 0.4);">
          🚀 BACK TO MISSION ▶
        </button>
      </div>
    `;

    // Bind mode selection clicks
    const btns = this.consoleEl.querySelectorAll('[data-select-id]');
    btns.forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const modeId = btn.getAttribute('data-select-id');
        this.setPowerMode(modeId);
      };
    });

    const cards = this.consoleEl.querySelectorAll('.power-mode-card');
    cards.forEach(card => {
      card.onclick = () => {
        const modeId = card.getAttribute('data-mode-id');
        this.setPowerMode(modeId);
      };
    });

    const btnResume = document.getElementById('btn-resume-power-expedition');
    if (btnResume) btnResume.onclick = () => this.closePowerConsole();
  }

  /* ── 3. Discrete NASA Operational Tradeoff Decision Modal ── */
  presentDecision(decision) {
    this.activeDecision = decision;
    if (!this.modalEl) return;

    // Clear any active decision timer
    if (this._decisionTimerInterval) {
      clearInterval(this._decisionTimerInterval);
      this._decisionTimerInterval = null;
    }

    this.engine.audio.playTone(440, 0.12, 'triangle', 0.25);
    setTimeout(() => this.engine.audio.playTone(660, 0.15, 'triangle', 0.25), 120);

    const tooltip = this.engine.tooltip;

    const choicesHTML = decision.choices.map((c, idx) => {
      const impactsList = c.impacts || c.badges || [];
      const impactsHTML = impactsList.map(imp => {
        const label = imp.label || imp.text || String(imp);
        const type = imp.type || 'reward';
        const cls = type === 'reward' ? 'safe' : (type === 'cost' ? 'danger' : 'warning');
        return `<span class="impact-badge ${cls}">${label}</span>`;
      }).join('');

      const descText = c.description || c.desc || '';
      const descHTML = tooltip ? tooltip.decorateHTML(descText) : descText;
      const cleanTitle = (c.title || '').replace(/^\d+[\.\)]\s*/, '');
      const titleHTML = tooltip ? tooltip.decorateHTML(cleanTitle) : cleanTitle;

      return `
        <div class="tradeoff-choice-card choice-${c.style || 'default'}" role="button" tabindex="0" data-choice-index="${idx}" aria-label="Select choice ${idx + 1}: ${cleanTitle}">
          <div class="tradeoff-choice-icon">${c.icon || '⚖️'}</div>
          <div class="tradeoff-choice-info">
            <div class="tradeoff-choice-title">${idx + 1}. ${titleHTML}</div>
            <div class="tradeoff-choice-desc">${descHTML}</div>
            <div class="tradeoff-impacts-row">${impactsHTML}</div>
          </div>
        </div>
      `;
    }).join('');

    const rawScenario = decision.scenario || decision.text || '';
    const rawBasis = decision.scientificBasis || decision.basis || '';
    const scenarioHTML = tooltip ? tooltip.decorateHTML(rawScenario) : rawScenario;
    const basisHTML = tooltip ? tooltip.decorateHTML(rawBasis) : rawBasis;

    this.modalEl.innerHTML = `
      <div class="panel-header tradeoff-header">
        <div class="panel-title">
          <span class="panel-title-icon">⚖️</span>
          <span>MISSION TRADEOFF DECISION</span>
        </div>
      </div>
      <div class="panel-body tradeoff-body">
        <!-- 1 Minute 20 Second (80s) Decision Countdown Timer -->
        <div class="decision-timer-container">
          <div class="timer-header-row">
            <span id="decision-timer-label" class="timer-label">⏱️ DECISION TIMER: 1m 20s</span>
            <span style="font-family: var(--font-mono); font-size: 0.65rem; color: #94a3b8;">1 MINUTE 20 SECONDS</span>
          </div>
          <div class="timer-bar-track">
            <div id="decision-timer-bar" class="timer-bar-fill" style="width: 100%;"></div>
          </div>
        </div>

        <div class="tradeoff-context-badge">${decision.contextBadge || 'MISSION CHOICE'}</div>
        <h2 class="tradeoff-scenario-title">${decision.title}</h2>
        <p class="tradeoff-scenario-desc">${scenarioHTML}</p>

        <div class="tradeoff-basis-box">
          <span class="basis-icon">📊</span>
          <div class="basis-text">
            <strong>WHY THIS MATTERS:</strong> ${basisHTML}
          </div>
        </div>

        <div class="tradeoff-choices-list">
          ${choicesHTML}
        </div>
      </div>
    `;

    this.modalEl.classList.add('visible');
    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) backdrop.classList.add('visible');

    if (tooltip) {
      tooltip.bindTooltips(this.modalEl);
    }

    // Bind choice cards (both click and keyboard Enter/Space)
    const cardEls = this.modalEl.querySelectorAll('.tradeoff-choice-card');
    cardEls.forEach(card => {
      const select = () => {
        const idx = parseInt(card.getAttribute('data-choice-index'), 10);
        this.resolveChoice(idx);
      };
      card.onclick = select;
      card.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
        }
      };
    });

    // Start 1 Minute 20 Seconds (80.0s) Strict Decision Countdown Timer
    this.decisionTimeRemaining = 80.0;
    const timerLabel = document.getElementById('decision-timer-label');
    const timerBar = document.getElementById('decision-timer-bar');

    this._decisionTimerInterval = setInterval(() => {
      this.decisionTimeRemaining -= 0.1;
      const pct = Math.max(0, (this.decisionTimeRemaining / 80.0) * 100);

      if (timerBar) timerBar.style.width = `${pct}%`;
      if (timerLabel) {
        const mins = Math.floor(Math.max(0, this.decisionTimeRemaining) / 60);
        const secs = Math.floor(Math.max(0, this.decisionTimeRemaining) % 60).toString().padStart(2, '0');
        timerLabel.textContent = `⏱️ DECISION TIMER: ${mins}m ${secs}s`;
        if (this.decisionTimeRemaining <= 15.0) {
          timerLabel.classList.add('urgent');
          if (timerBar) timerBar.classList.add('urgent');
          this.engine.audio.playTone(850, 0.08, 'square', 0.2);
        }
      }

      if (this.decisionTimeRemaining <= 0) {
        clearInterval(this._decisionTimerInterval);
        this._decisionTimerInterval = null;
        this._triggerDecisionTimeoutFailure(decision);
      }
    }, 100);
  }

  /**
   * Action Card: Food Management Dilemma (Kid-Friendly for 7-12 Age Group)
   */
  presentFoodTradeoff(onComplete = null) {
    this.presentDecision({
      id: 'hydroponic_food_dilemma',
      title: '🥗 Greenhouse Food vs. Battery Power',
      contextBadge: '🌱 SPACE BASE FARM CHOICE',
      scenario: 'The astronaut team is hungry after a long day of moon exploration! Do you turn on the bright greenhouse grow lights to grow yummy fresh space salad, or save battery power and eat packaged snacks?',
      scientificBasis: 'NASA astronauts grow real plants in space using LED lights! It makes healthy fresh food and oxygen, but draws electricity from the base battery.',
      choices: [
        {
          title: 'Turn On Grow Lights (+35% Fresh Food)',
          description: 'Power up the greenhouse LED grow lights to harvest fresh crunchy vegetables for the team!',
          icon: '🌱',
          style: 'safe',
          impacts: [
            { label: '+35% Fresh Food', type: 'reward' },
            { label: '+10% Crew Health', type: 'reward' },
            { label: '-15% Base Power', type: 'cost' }
          ],
          applyResources: { food: 35, crewCondition: 10, power: -15 },
          sciencePoints: 500,
          outcome: 'Yum! Fresh green vegetables harvested! Commander Alex Morgan feels energized and happy.'
        },
        {
          title: 'Save Battery Power (+10% Power Saved)',
          description: 'Keep lights dim to save electricity. The crew eats standard packaged astronaut meals.',
          icon: '⚡',
          style: 'aggressive',
          impacts: [
            { label: '+10% Base Power Saved', type: 'reward' },
            { label: '+10% Standard Food', type: 'reward' },
            { label: 'Saves Battery for Driving', type: 'warning' }
          ],
          applyResources: { power: 10, food: 10 },
          sciencePoints: 400,
          outcome: 'Battery saved! Your Moon base reserves remain strong for rovers and heaters.'
        }
      ],
      onChosen: () => {
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Action Card: Mars M1 — Jezero Delta Rover-Drone Dilemma (Kid-Friendly 7-12)
   */
  presentMarsM1Tradeoff(onComplete = null) {
    this.presentDecision({
      id: 'mars_m1_drone_tradeoff',
      title: '🚁 Ingenuity Drone Scout: Fly High vs. Save Battery',
      contextBadge: '🔴 MARS M1: JEZERO RIVER DELTA',
      scenario: 'The Ingenuity mini-helicopter is sitting on your rover deck! The dried-up Mars river delta is ahead. Do you want to fly the helicopter high in the thin air to take awesome aerial photos, or save your rover battery and drive slowly on the ground?',
      scientificBasis: 'Mars air is 100 times thinner than Earth air! NASA\'s Ingenuity drone had to spin its carbon-fiber blades over 2,500 times a minute to lift off into thin air.',
      choices: [
        {
          title: 'Fly the Helicopter High! (+Awesome Aerial Photos)',
          description: 'Spin up blades to 2,700 RPM! Flying high spots the richest ancient lake mud layers, but uses some rover battery.',
          icon: '🚁',
          style: 'safe',
          impacts: [
            { label: '+25% Science Data', type: 'reward' },
            { label: '+15% Core Sample Quality', type: 'reward' },
            { label: '-12% Rover Battery', type: 'cost' }
          ],
          applyResources: { power: -12, roverEnergy: -12 },
          sciencePoints: 600,
          outcome: 'Ingenuity zoomed 12 meters into thin Martian air! Aerial photos spotted the richest ancient lakebed clay mudstones.',
          onSelected: () => {
            if (onComplete) onComplete();
          }
        },
        {
          title: 'Save Battery & Drive on Ground! (+Extra Power)',
          description: 'Keep the helicopter docked on your rover deck. Drive forward on 6 aluminum wheels to save electricity!',
          icon: '🚜',
          style: 'aggressive',
          impacts: [
            { label: '+10% Battery Power Saved', type: 'reward' },
            { label: 'Longer Driving Range', type: 'reward' },
            { label: 'Standard Surface Samples Only', type: 'warning' }
          ],
          applyResources: { power: 10, roverEnergy: 10 },
          sciencePoints: 400,
          outcome: 'Battery energy saved! Your rover has lots of power stored to climb the steep river delta ridges.',
          onSelected: () => {
            if (onComplete) onComplete();
          }
        }
      ],
      onChosen: () => {
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Action Card: Mars M2 — Arcadia Planitia Glacier Mining Dilemma
   */
  presentMarsM2Tradeoff(onComplete = null) {
    this.presentDecision({
      id: 'mars_m2_glacier_tradeoff',
      title: '🧊 Subsurface Glacier Drill: Deep Thermal Melt vs. Shallow Regolith Scrape',
      contextBadge: '🔴 MARS M2: ARCADIA PLANITIA CHOICE',
      scenario: 'Orbital radar (SWIM dataset) confirmed massive sheets of pure water ice buried under red dust in Arcadia Planitia! Do you direct nuclear thermal heat deep into the pure glacier to brew methane rocket fuel for Earth return, or scrape shallow dusty permafrost to save electricity?',
      scientificBasis: 'NASA\'s Sabatier reactor combines hydrogen from melted Martian ice with atmospheric carbon dioxide to brew methane rocket propellant. Deep glacier ice is 98% pure, but melting requires heavy thermal kilowatts!',
      choices: [
        {
          title: 'Deep Thermal Melting (Pure Subsurface Glacier)',
          description: 'Deploy thermal probe 3 meters down into the pure ancient glacier slab. High-purity water fuels the automated Sabatier refinery!',
          icon: '💧',
          style: 'safe',
          impacts: [
            { label: '+30% Water Reserves', type: 'reward' },
            { label: '+25% Rocket Methane Propellant', type: 'reward' },
            { label: '-14% Base Power', type: 'cost' }
          ],
          applyResources: { water: 30, power: -14 },
          sciencePoints: 650,
          outcome: 'Thermal probe penetrated the protective dust lag! Pure crystal-clear water pumped into the Sabatier plant to synthesize liquid methane and oxygen propellant.'
        },
        {
          title: 'Shallow Dirt Scraping (+12% Power Saved)',
          description: 'Scrape shallow permafrost soil in the top 30 cm using mechanical scrapers. Requires less heater electricity, but produces dusty water.',
          icon: '⛏️',
          style: 'aggressive',
          impacts: [
            { label: '+12% Power Saved', type: 'reward' },
            { label: '+10% Water Recovered', type: 'reward' },
            { label: 'Filter Clogging Risk', type: 'warning' }
          ],
          applyResources: { power: 12, water: 10 },
          sciencePoints: 400,
          outcome: 'Power conserved for habitat life support! Water extraction filters required manual purging to remove red volcanic dust silt.'
        }
      ],
      onChosen: () => {
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Action Card: Mars M3 — Valles Marineris Canyon Storm Dilemma
   */
  presentMarsM3Tradeoff(onComplete = null) {
    this.presentDecision({
      id: 'mars_m3_storm_tradeoff',
      title: '⚠️ Approaching Dust Storm: Long-Range Radar vs. Cabin Warmth',
      contextBadge: '🔴 MARS M3: VALLES MARINERIS CHOICE',
      scenario: 'A giant regional Martian dust storm is rising rapidly along the canyon rim! Solar irradiance is falling fast as atmospheric dust optical depth exceeds tau 3.0. Do you fire a high-power long-range radar ping to locate the emergency supply cache immediately, or max out cabin heaters to protect crew warmth?',
      scientificBasis: 'Mars Climate Sounder (MCS) vertical profiles show high-altitude dust layers block solar rays via Beer-Lambert extinction. Temperatures plunge below -85°C while driving winds scatter radio signals!',
      choices: [
        {
          title: 'High-Power Radar Ping (Instant Supply Cache Lock)',
          description: 'Transmit a 2.4 kW synthetic aperture radar pulse through swirling dust to instantly pinpoint the emergency supply cache beacon.',
          icon: '📡',
          style: 'safe',
          impacts: [
            { label: 'Supply Cache Located Instantly', type: 'reward' },
            { label: '+20% Navigation Speed', type: 'reward' },
            { label: '-12% Rover Battery', type: 'cost' }
          ],
          applyResources: { power: -12, roverEnergy: -12 },
          sciencePoints: 650,
          outcome: 'Radar pulse pierced the billowing dust cloud! Emergency cache transponder locked at 320 meters bearing 042°. Rover navigation path plotted.'
        },
        {
          title: 'Maximize Cabin Heaters & Visual Search (+15% Crew Warmth)',
          description: 'Keep internal resistive heaters at full power to keep the crew cockpit warm and comfortable during the storm.',
          icon: '🔥',
          style: 'aggressive',
          impacts: [
            { label: '+15% Cabin Warmth', type: 'reward' },
            { label: '+10% Crew Health', type: 'reward' },
            { label: 'Slower Search in Low Visibility', type: 'warning' }
          ],
          applyResources: { crewCondition: 10, food: 5 },
          sciencePoints: 450,
          outcome: 'Cockpit remained a cozy +21°C as outside temperature plunged to -92°C! Crew navigated cautiously through zero-visibility dust haze.'
        }
      ],
      onChosen: () => {
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Action Card: Mars M4 — Olympus Mons Lava Tube Basecamp Dilemma
   */
  presentMarsM4Tradeoff(onComplete = null) {
    this.presentDecision({
      id: 'mars_m4_lavatube_tradeoff',
      title: '🌋 Subterranean Base: Deep Lava Vault vs. 3D-Printed Regolith Dome',
      contextBadge: '🔴 MARS M4: OLYMPUS MONS CHOICE',
      scenario: 'You\'ve descended through a 60-meter volcanic skylight pit on the flank of Olympus Mons! Do you establish permanent astronaut basecamp deep inside the underground lava tube for total cosmic ray shielding, or build a 3D-printed regolith dome on the surface with solar panels?',
      scientificBasis: 'Curiosity RAD dosimeter records 187 µGy/day on Mars\'s surface due to solar cosmic rays. Underground basalt lava tubes provide 100% natural radiation shielding and a stable thermal shelter!',
      choices: [
        {
          title: 'Deep Lava Tube Sanctuary (100% Radiation Protection)',
          description: 'Anchor the habitat vault 50 meters underground beneath 20 meters of solid basalt rock. Zero cosmic ray exposure for the crew!',
          icon: '🛡️',
          style: 'safe',
          impacts: [
            { label: '100% Cosmic Radiation Shielding', type: 'reward' },
            { label: '+25% Crew Health & Safety', type: 'reward' },
            { label: '-10% Tether Power for Winch Lights', type: 'cost' }
          ],
          applyResources: { crewCondition: 25, power: -10 },
          sciencePoints: 700,
          outcome: 'Cavern vault established! Solid basalt ceiling blocks cosmic rays, solar proton storms, and micrometeorites, ensuring long-term crew health.'
        },
        {
          title: 'Surface 3D-Printed Regolith Shell (+20% Solar Power)',
          description: 'Microwave Martian soil to sinter a radiation dome on the surface. Easy solar power generation and direct communications with Earth.',
          icon: '🏛️',
          style: 'aggressive',
          impacts: [
            { label: '+20% Solar Battery Power', type: 'reward' },
            { label: 'Direct High-Gain Earth Comms', type: 'reward' },
            { label: 'Moderate Surface Radiation (187 µGy/d)', type: 'warning' }
          ],
          applyResources: { power: 20, food: 10 },
          sciencePoints: 500,
          outcome: 'Surface regolith dome 3D-printed! Solar panels bask in full sunlight, but crew dosimeters record baseline surface radiation.'
        }
      ],
      onChosen: () => {
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Action Card: Mars M5 — Phobos Relay & Earth Return Dilemma
   */
  presentMarsM5Tradeoff(onComplete = null) {
    this.presentDecision({
      id: 'mars_m5_phobos_tradeoff',
      title: '🛰️ Interplanetary Launch: Titanium Core Payload vs. Fuel Safety Buffer',
      contextBadge: '🔴 MARS M5: PHOBOS ORBIT DOCKING',
      scenario: 'Docked with the interplanetary transfer vehicle near Mars\'s potato-shaped moon Phobos! Before aligning the optical laser relay for the 9-month cruise home to Earth, do you bring aboard all heavy titanium sample tubes, or jettison tailings for an extra rocket fuel reserve?',
      scientificBasis: 'DONKI space weather data tracks interplanetary CME events and the 4 to 22-minute light-speed communication delay with Earth. Every kilogram of returned sample requires propellant mass during trans-Earth injection!',
      choices: [
        {
          title: 'Full Titanium Core Payload (Max Science Return for Earth)',
          description: 'Keep all sealed rock core tubes from Jezero, Arcadia, Valles Marineris, and Olympus Mons! Delivers groundbreaking biosignature discoveries.',
          icon: '💎',
          style: 'safe',
          impacts: [
            { label: '+50% Grand NASA Science Award', type: 'reward' },
            { label: 'All 10 Core Samples Returned to Earth', type: 'reward' },
            { label: '-12% Fuel Safety Margin', type: 'cost' }
          ],
          applyResources: { power: -12, roverEnergy: -12 },
          sciencePoints: 1000,
          outcome: 'All titanium core canisters locked into the Earth-return bio-containment vault! Earth scientists will study Martian river mudstones for signs of ancient life.'
        },
        {
          title: 'Light Cargo & Max Propellant Buffer (+20% Fuel Margin)',
          description: 'Jettison unneeded drill bits and secondary rock tailings to maximize return rocket propellant safety margins for the long voyage home.',
          icon: '🚀',
          style: 'aggressive',
          impacts: [
            { label: '+20% Fuel Safety Margin', type: 'reward' },
            { label: '+15% Life Support Power Buffer', type: 'reward' },
            { label: 'Only Highest-Priority Samples Kept', type: 'warning' }
          ],
          applyResources: { power: 20, oxygen: 10 },
          sciencePoints: 600,
          outcome: 'Propellant tanks topped with maximum safety margin! The interplanetary spacecraft has generous fuel reserves for course corrections to Earth.'
        }
      ],
      onChosen: () => {
        if (onComplete) onComplete();
      }
    });
  }

  _triggerDecisionTimeoutFailure(decision) {
    this.close();

    this.engine.audio.playTone(220, 0.4, 'sawtooth', 0.4);
    setTimeout(() => this.engine.audio.playTone(160, 0.6, 'sawtooth', 0.5), 350);

    let failModal = document.getElementById('mission-failed-modal');
    if (!failModal) {
      failModal = document.createElement('div');
      failModal.id = 'mission-failed-modal';
      failModal.className = 'mission-failed-modal';
      document.body.appendChild(failModal);
    }

    failModal.innerHTML = `
      <div class="fail-badge-pill">🚨 MISSION FAILED 🚨</div>
      <h2 class="fail-title">MISSION FAILED: TOO SLOW!</h2>
      <div class="fail-subtitle">Decision Countdown Expired!</div>
      <p class="fail-desc">
        Commander Alex Morgan hesitated more than 1 minute 20 seconds! In real NASA space operations, critical life-support trade-offs require fast, decisive action before consumables run out.
      </p>
      <div class="fail-actions">
        <button id="btn-retry-decision" class="btn btn-primary fail-btn-retry">🔄 RETRY DECISION</button>
        <button id="btn-failed-select" class="btn btn-secondary fail-btn-select">🪐 RETURN TO DESTINATION</button>
      </div>
    `;

    failModal.classList.add('visible');
    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) backdrop.classList.add('visible');

    const btnRetry = document.getElementById('btn-retry-decision');
    if (btnRetry) {
      btnRetry.onclick = () => {
        failModal.classList.remove('visible');
        if (backdrop) backdrop.classList.remove('visible');
        this.presentDecision(decision);
      };
    }

    const btnSelect = document.getElementById('btn-failed-select');
    if (btnSelect) {
      btnSelect.onclick = () => {
        failModal.classList.remove('visible');
        if (backdrop) backdrop.classList.remove('visible');
        this.engine.setState('DESTINATION');
        if (this.engine.state && this.engine.state.startsWith('MARS_')) {
          this.engine.showPanel('mars-mission-modal');
        } else {
          this.engine.showPanel('moon-mission-modal');
        }
      };
    }
  }

  resolveChoice(index) {
    if (this._decisionTimerInterval) {
      clearInterval(this._decisionTimerInterval);
      this._decisionTimerInterval = null;
    }

    if (!this.activeDecision) return;
    const decision = this.activeDecision;
    const choice = decision.choices[index];
    if (!choice) return;

    this.engine.audio.playUIClick();

    // 1. Apply physical resource modifications
    if (choice.applyResources && this.engine.resources) {
      for (const [key, delta] of Object.entries(choice.applyResources)) {
        this.engine.resources.modify(key, delta, choice.title);
      }
    }

    // 2. Award science score
    if (choice.sciencePoints && this.engine.scoring) {
      this.engine.scoring.add(choice.sciencePoints, choice.title);
    }

    // 3. Record choice into the Expedition Logbook
    if (this.engine.save) {
      this.engine.save.recordFinding({
        id: `tradeoff_${Date.now()}`,
        name: `${decision.title}: ${choice.title}`,
        type: 'TRADEOFF DECISION',
        measurements: (choice.impacts || choice.badges || []).map(i => ({
          label: i.label || i.text || String(i),
          value: ((i.type) || 'REWARD').toUpperCase(),
          unit: 'Tradeoff Impact',
          source: 'calculated',
          sourceLabel: 'Operational Decision'
        })),
        explain: {
          simple: `You selected: ${choice.title}. ${choice.outcome || ''}`,
          advanced: `Scientific basis: ${decision.scientificBasis || decision.basis || ''}`,
          nasaDataset: 'Mission Academy Operational Decision Architecture'
        }
      });
    }

    // 4. Immediate HUD Refresh
    if (this.engine.hud) {
      this.engine.hud.update();
    }

    // 5. Trigger audio & notifications
    this.engine.audio.playSuccess();
    this.engine.showNotification(`DECISION EXECUTED: ${choice.title}`, 'success', 5000);

    this.close();

    // 6. Invoke choice and decision completion callbacks
    if (choice && typeof choice.onSelected === 'function') {
      try {
        choice.onSelected();
      } catch (err) {
        console.error('Error executing choice.onSelected:', err);
      }
    }
    if (choice && typeof choice.onChosen === 'function') {
      try {
        choice.onChosen();
      } catch (err) {
        console.error('Error executing choice.onChosen:', err);
      }
    }

    if (decision && typeof decision.onChosen === 'function') {
      try {
        decision.onChosen(choice, index);
      } catch (err) {
        console.error('Error executing decision.onChosen:', err);
      }
    }
    if (decision && typeof decision.onComplete === 'function') {
      try {
        decision.onComplete(choice, index);
      } catch (err) {
        console.error('Error executing decision.onComplete:', err);
      }
    }
  }

  close() {
    if (this._decisionTimerInterval) {
      clearInterval(this._decisionTimerInterval);
      this._decisionTimerInterval = null;
    }
    if (this.modalEl) this.modalEl.classList.remove('visible');
    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) backdrop.classList.remove('visible');
    this.activeDecision = null;
  }
}
