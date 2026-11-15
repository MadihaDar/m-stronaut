/* ============================================================
   FRONTIER: MISSION ACADEMY — HUD UI Module
   Manages in-game gauges, interaction prompts, minimap radar & tactical navigation
   ============================================================ */

export class HUD {
  constructor(engine) {
    this.engine = engine;

    // Cache elements
    this.hudElement = document.getElementById('hud');
    this.promptElement = document.getElementById('interaction-prompt');
    this.promptLabel = document.getElementById('prompt-label');
    this.promptKey = document.getElementById('prompt-key');
    this.locationName = document.getElementById('hud-location-name');
    this.modeBadge = document.getElementById('hud-mode-badge');
    this.missionTimeEl = document.getElementById('hud-mission-time');
    this.notifContainer = document.getElementById('ui-notification');

    // Navigation & Radar Elements
    this.navContainer = document.getElementById('hud-nav-container');
    this.waypointCard = document.getElementById('hud-waypoint-card');
    this.waypointBearing = document.getElementById('waypoint-bearing');
    this.waypointArrow = document.getElementById('waypoint-arrow');
    this.waypointTitle = document.getElementById('waypoint-title');
    this.waypointDistance = document.getElementById('waypoint-distance');
    this.waypointStatus = document.getElementById('waypoint-status');

    this.minimapContainer = document.getElementById('hud-minimap');
    this.minimapMarkers = document.getElementById('minimap-markers');
    this.minimapPlayer = document.getElementById('minimap-player');
    this.minimapPlayerArrow = document.getElementById('minimap-player-arrow');
    this.radarRangeLabel = document.getElementById('radar-range-label');
    this.radarScaleInner = document.getElementById('radar-scale-inner');
    this.radarScaleMid = document.getElementById('radar-scale-mid');
    this.radarScaleOuter = document.getElementById('radar-scale-outer');

    // Tactical Orbital Map Modal Elements
    this.tacticalMapPanel = document.getElementById('tactical-map-modal');
    this.tacticalMapCanvas = document.getElementById('tactical-map-canvas');
    this.tacticalMapLocation = document.getElementById('tactical-map-location');
    this.tacticalWaypointList = document.getElementById('tactical-waypoint-list');
    this.btnCloseMap = document.getElementById('btn-close-map');

    this.pinnedTargetId = null;
    this.lastNavData = null;

    // Resource bar mappings & sub-50 warning tracking
    this._lastResourceWarningBeep = 0;
    this._warnedBelow50 = new Set();
    this.bars = {
      oxygen: { fill: document.getElementById('bar-o2'), val: document.getElementById('val-o2'), item: document.getElementById('res-o2'), label: 'Oxygen' },
      water: { fill: document.getElementById('bar-water'), val: document.getElementById('val-water'), item: document.getElementById('res-water'), label: 'Water' },
      food: { fill: document.getElementById('bar-food'), val: document.getElementById('val-food'), item: document.getElementById('res-food'), label: 'Food Rations' },
      power: { fill: document.getElementById('bar-power'), val: document.getElementById('val-power'), item: document.getElementById('res-power'), label: 'Base Power' },
      roverEnergy: { fill: document.getElementById('bar-rover'), val: document.getElementById('val-rover'), item: document.getElementById('res-rover'), label: 'Rover Cell' },
      crewCondition: { fill: document.getElementById('bar-crew'), val: document.getElementById('val-crew'), item: document.getElementById('res-crew'), label: 'Crew Health' }
    };

    this._bindEvents();
  }

  _bindEvents() {
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.onclick = () => {
        this.engine.audio.playUIClick();
        if (this.engine.state === 'PAUSED') {
          this.engine.setState(this.engine.previousState);
        } else if (['SANDBOX', 'MOON_M1', 'MOON_M2', 'MARS_M1', 'MARS_M2'].includes(this.engine.state)) {
          this.engine.setState('PAUSED');
        }
      };
    }

    // On-screen Zoom In / Zoom Out controls
    const btnZoomIn = document.getElementById('btn-zoom-in');
    if (btnZoomIn) {
      btnZoomIn.onclick = () => {
        this.engine.audio.playTone(850, 0.04, 'sine', 0.15);
        this.engine.input.addZoom(2.5);
      };
      let zoomInInterval = null;
      btnZoomIn.addEventListener('mousedown', () => {
        zoomInInterval = setInterval(() => this.engine.input.addZoom(0.8), 50);
      });
      window.addEventListener('mouseup', () => {
        if (zoomInInterval) { clearInterval(zoomInInterval); zoomInInterval = null; }
      });
      btnZoomIn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.engine.audio.playTone(850, 0.04, 'sine', 0.15);
        this.engine.input.addZoom(3.0);
      }, { passive: false });
    }

    const btnZoomOut = document.getElementById('btn-zoom-out');
    if (btnZoomOut) {
      btnZoomOut.onclick = () => {
        this.engine.audio.playTone(650, 0.04, 'sine', 0.15);
        this.engine.input.addZoom(-2.5);
      };
      let zoomOutInterval = null;
      btnZoomOut.addEventListener('mousedown', () => {
        zoomOutInterval = setInterval(() => this.engine.input.addZoom(-0.8), 50);
      });
      window.addEventListener('mouseup', () => {
        if (zoomOutInterval) { clearInterval(zoomOutInterval); zoomOutInterval = null; }
      });
      btnZoomOut.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.engine.audio.playTone(650, 0.04, 'sine', 0.15);
        this.engine.input.addZoom(-3.0);
      }, { passive: false });
    }

    // Waypoint card & Minimap click handlers
    if (this.waypointCard) {
      this.waypointCard.onclick = () => {
        this.toggleTacticalMap();
      };
    }

    if (this.minimapContainer) {
      this.minimapContainer.onclick = () => {
        this.toggleTacticalMap();
      };
    }

    if (this.btnCloseMap) {
      this.btnCloseMap.onclick = () => {
        this.closeTacticalMap();
      };
    }

    // DSN Uplink Handlers

    const btnDsn = document.getElementById('btn-dsn-ping');
    if (btnDsn) {
      btnDsn.onclick = () => {
        if (this.engine.emergency) {
          const isMars = !(this.locationName && this.locationName.textContent.includes('MOON'));
          this.engine.emergency.transmitToHouston('DSN SPEED-OF-LIGHT RANGING TELEMETRY', null, isMars);
        }
      };
    }

    const btnLander = document.getElementById('btn-lander-action');
    if (btnLander) {
      btnLander.onclick = () => {
        const scene = this.engine.currentScene;
        if (!scene || !scene.lander) return;
        const lander = scene.lander;
        if (lander.isFlying && lander.flightPhase === 'orbital') {
          lander.startLanding();
        } else if (lander.isOccupied) {
          lander.startFlight();
        } else if (scene.character && scene.mode === 'walk') {
          const dist = scene.character.getPosition().distanceTo(lander.group.position);
          if (dist <= 7.0) {
            lander.startBoarding(scene.character);
          } else {
            this.showMessage('Approach the lander to board, or press [E] when near ramp.', 'info', 3000);
          }
        }
      };
    }

    const btnTradeoffs = document.getElementById('btn-open-tradeoffs');
    if (btnTradeoffs) {
      btnTradeoffs.onclick = () => {
        if (this.engine.tradeoff) {
          this.engine.tradeoff.togglePowerRerouteConsole();
        }
      };
    }

    // Make interaction prompt clickable
    if (this.promptElement) {
      this.promptElement.style.cursor = 'pointer';
      this.promptElement.title = 'Click or press [E] to interact';
      this.promptElement.onclick = (e) => {
        e.stopPropagation();
        this.engine.audio.playUIClick();
        this.engine.input.triggerAction('interact');
      };
    }

    // Make bottom control bar hint items clickable
    const hintItems = document.querySelectorAll('.controls-hint .hint-item');
    hintItems.forEach(item => {
      item.style.cursor = 'pointer';
      item.setAttribute('role', 'button');
      item.onclick = (e) => {
        e.stopPropagation();
        const text = item.textContent.toUpperCase();
        if (text.includes('SPACE') || text.includes('JUMP')) {
          this.engine.input.triggerAction('jump');
        } else if (text.includes('LANDER FLY') || text.includes(' L ')) {
          if (btnLander) btnLander.click();
        } else if (text.includes('ROVER') || text.includes(' R ')) {
          this.engine.input.triggerAction('roverToggle');
        } else if (text.includes('INSPECT') || text.includes(' E ')) {
          this.engine.input.triggerAction('interact');
        } else if (text.includes('TRADEOFFS') || text.includes(' T ')) {
          if (this.engine.tradeoff) this.engine.tradeoff.togglePowerRerouteConsole();
        } else if (text.includes('1ST/3RD') || text.includes(' V ') || text.includes('VIEW')) {
          const scene = this.engine.currentScene;
          if (scene) {
            if (scene.character && scene.mode === 'walk') scene.character.toggleVisionMode();
            else if (scene.rover && scene.mode === 'rover') scene.rover.toggleVisionMode();
          }
        } else if (text.includes('LOOK') || text.includes('ARROWS')) {
          this.showMessage('Tip: Drag your mouse or use Arrow Keys (← → ↑ ↓) to look all around in 360°!', 'info', 4000);
        }
      };
    });

    // Vision Angle & Camera View Mode Toggle
    const btnViewToggle = document.getElementById('btn-view-toggle');
    if (btnViewToggle) {
      btnViewToggle.onclick = () => {
        const scene = this.engine.currentScene;
        if (scene) {
          if (scene.character && scene.mode === 'walk') {
            scene.character.toggleVisionMode();
          } else if (scene.rover && scene.mode === 'rover') {
            scene.rover.toggleVisionMode();
          }
        }
      };
    }

    const bindCamBtn = (id, dx, dy) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      let interval = null;
      const step = () => this.engine.input.addCameraRotation(dx, dy);
      btn.addEventListener('mousedown', () => {
        step();
        interval = setInterval(step, 40);
      });
      window.addEventListener('mouseup', () => {
        if (interval) { clearInterval(interval); interval = null; }
      });
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        step();
        interval = setInterval(step, 40);
      }, { passive: false });
      btn.addEventListener('touchend', () => {
        if (interval) { clearInterval(interval); interval = null; }
      });
    };

    bindCamBtn('btn-cam-left', -0.05, 0);
    bindCamBtn('btn-cam-right', 0.05, 0);
    bindCamBtn('btn-cam-up', 0, -0.04);
    bindCamBtn('btn-cam-down', 0, 0.04);

    const btnCamReset = document.getElementById('btn-cam-reset');
    if (btnCamReset) {
      btnCamReset.onclick = () => {
        const scene = this.engine.currentScene;
        if (scene) {
          if (scene.character && scene.mode === 'walk') scene.character.resetCameraAngle();
          if (scene.rover && scene.mode === 'rover') scene.rover.resetCameraAngle();
        }
      };
    }

    // Keyboard shortcut [M] for Tactical Map, [T] / [P] for Power Tradeoffs Console, [V] for Vision Mode
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM' || e.key === 'm' || e.key === 'M') {
        if (this.engine && (this.engine.isSurfaceExpedition() || this.engine.state === 'SANDBOX')) {
          e.preventDefault();
          this.toggleTacticalMap();
        }
      }
      if (e.code === 'KeyT' || e.code === 'KeyP' || e.key === 't' || e.key === 'T' || e.key === 'p' || e.key === 'P') {
        if (this.engine && this.engine.tradeoff && (this.engine.isSurfaceExpedition() || this.engine.state === 'SANDBOX')) {
          e.preventDefault();
          this.engine.tradeoff.togglePowerRerouteConsole();
        }
      }
      if (e.code === 'KeyV' || e.key === 'v' || e.key === 'V') {
        const scene = this.engine ? this.engine.currentScene : null;
        if (scene) {
          if (scene.character && scene.mode === 'walk') {
            scene.character.toggleVisionMode();
          } else if (scene.rover && scene.mode === 'rover') {
            scene.rover.toggleVisionMode();
          }
        }
      }
    });

    this.engine.on('resource:warning', (data) => {
      this.showMessage(`WARNING: ${data.label} reserve below 25%!`, 'warning', 3500);
      this.engine.audio.playWarning();
    });

    this.engine.on('resource:critical', (data) => {
      this.showMessage(`CRITICAL ALERT: ${data.label} critically low (<10%)!`, 'danger', 4500);
      this.engine.audio.playWarning();
    });

    // Listen for physical decision consequences & level changes
    this.engine.on('resource:delta', (data) => {
      this.spawnFloatingConsequence(data);
    });
  }

  show() {
    if (this.hudElement) this.hudElement.classList.add('visible');
  }

  hide() {
    if (this.hudElement) this.hudElement.classList.remove('visible');
    this.hideInteractionPrompt();
  }

  setLocation(name) {
    if (this.locationName) this.locationName.textContent = name;
  }

  setMode(mode) {
    if (!this.modeBadge) return;
    if (mode === 'rover') {
      this.modeBadge.textContent = 'ROVER TELEMETRY';
      this.modeBadge.classList.add('rover-mode');
    } else {
      this.modeBadge.textContent = 'EVA SUIT MODE';
      this.modeBadge.classList.remove('rover-mode');
    }
  }

  showInteractionPrompt(label, key = 'E') {
    if (!this.promptElement) return;
    if (this.promptLabel) this.promptLabel.textContent = label;
    if (this.promptKey) this.promptKey.textContent = key;
    this.promptElement.classList.add('visible');
  }

  hideInteractionPrompt() {
    if (this.promptElement) this.promptElement.classList.remove('visible');
  }

  update() {
    const res = this.engine.resources;
    if (!res) return;

    // Update resource bars
    for (const [key, elements] of Object.entries(this.bars)) {
      if (!elements.fill || !elements.val) continue;

      const pct = res.getPercent(key);
      const rounded = Math.round(pct);

      elements.fill.style.width = `${rounded}%`;

      // Calculate net rate (base consumption vs active power tradeoff mode)
      let netRate = -(res.resources[key] ? res.resources[key].rate : 0);
      const mode = this.engine.tradeoff ? this.engine.tradeoff.currentMode : 'BALANCED';
      if (mode === 'OXYGEN_PRIORITY') {
        if (key === 'oxygen') netRate += 0.35;
        if (key === 'crewCondition') netRate += 0.12;
        if (key === 'power') netRate -= 0.28;
      } else if (mode === 'SHIELD_PRIORITY') {
        if (key === 'power') netRate -= 0.42;
        if (key === 'oxygen') netRate -= 0.04;
      } else if (mode === 'GROWTH_PRIORITY') {
        if (key === 'food') netRate += 0.30;
        if (key === 'roverEnergy') netRate += 0.70;
        if (key === 'power') netRate -= 0.25;
      }

      let rateHTML = '';
      if (Math.abs(netRate) > 0.005) {
        const sign = netRate > 0 ? '+' : '';
        const cls = netRate > 0 ? 'rate-gain' : 'rate-drain';
        const arrow = netRate > 0 ? '▲' : '▼';
        rateHTML = ` <span class="resource-rate-badge ${cls}">${arrow}${sign}${netRate.toFixed(2)}%/s</span>`;
      } else {
        rateHTML = ` <span class="resource-rate-badge rate-neutral">● 0.00%/s</span>`;
      }

      elements.val.innerHTML = `${rounded}%${rateHTML}`;

      // Phase 3.2: Monitor Food, Health, Power, and Oxygen (< 50%)
      const monitoredKeys = ['food', 'crewCondition', 'power', 'oxygen'];
      if (monitoredKeys.includes(key)) {
        if (pct < 50) {
          if (elements.item) elements.item.classList.add('warning-sub50');
          const now = Date.now();
          if (!this._warnedBelow50.has(key) && (now - this._lastResourceWarningBeep > 10000)) {
            this._warnedBelow50.add(key);
            this._lastResourceWarningBeep = now;
            if (this.engine.audio) {
              this.engine.audio.playWarning();
            }
            if (this.engine.showNotification) {
              this.engine.showNotification(`⚠️ CAUTION: ${elements.label} is below 50%!`, 'warning', 3200);
            }
          }
        } else {
          if (elements.item) elements.item.classList.remove('warning-sub50');
          this._warnedBelow50.delete(key);
        }
      }

      // Status class color grading
      elements.fill.classList.remove('safe', 'warning', 'danger', 'critical');
      elements.val.classList.remove('warning', 'danger', 'critical');

      if (pct > 30) {
        elements.fill.classList.add('safe');
      } else if (pct > 20) {
        elements.fill.classList.add('warning');
        elements.val.classList.add('warning');
      } else if (pct > 10) {
        elements.fill.classList.add('danger');
        elements.val.classList.add('danger');
      } else {
        elements.fill.classList.add('critical');
        elements.val.classList.add('critical');
      }
    }

    // Format mission time HH:MM:SS
    if (this.missionTimeEl) {
      const sec = Math.floor(res.missionTime);
      const h = String(Math.floor(sec / 3600)).padStart(2, '0');
      const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      this.missionTimeEl.textContent = `${h}:${m}:${s}`;
    }

    // Update lander action pill text
    const btnLanderLabel = document.getElementById('btn-lander-action-label');
    if (btnLanderLabel && this.engine.currentScene && this.engine.currentScene.lander) {
      const lander = this.engine.currentScene.lander;
      if (lander.isFlying && lander.flightPhase === 'orbital') {
        btnLanderLabel.textContent = 'LAND ON SURFACE';
      } else if (lander.isOccupied) {
        btnLanderLabel.textContent = 'LAUNCH TO ORBIT';
      } else {
        btnLanderLabel.textContent = 'BOARD LANDER';
      }
    }

    // Update Live Deep Space Network Latency Telemetry (Speed of Light Delay)
    const isMars = !(this.locationName && this.locationName.textContent.includes('MOON'));
    const dsnLatencyEl = document.getElementById('dsn-latency-display');
    const dsnModeEl = document.getElementById('dsn-mode-display');
    if (dsnLatencyEl) {
      dsnLatencyEl.textContent = isMars ? '14m 24s' : '1.3s';
    }
    if (dsnModeEl) {
      dsnModeEl.textContent = isMars ? 'AUTONOMOUS' : 'EARTH LINKED';
    }

    // Apply visual environmental & screen-space entity effects based on resource state
    this.updateEntityVisuals(res);
  }

  /* Physical Floating Decision & Level Consequence Popups */
  spawnFloatingConsequence(data) {
    const container = document.getElementById('floating-consequence-container');
    if (!container) return;

    const el = document.createElement('div');
    const isGain = data.delta > 0;
    const sign = isGain ? '+' : '';
    const rounded = Math.round(data.delta);
    const cls = isGain ? 'consequence-gain' : 'consequence-loss';

    el.className = `floating-consequence-pill ${cls}`;
    el.innerHTML = `
      <span class="consequence-num">${sign}${rounded}%</span>
      <span class="consequence-label">${data.label}</span>
      ${data.reason ? `<span class="consequence-reason">(${data.reason})</span>` : ''}
    `;

    const offsetX = (Math.random() - 0.5) * 80;
    el.style.setProperty('--offset-x', `${offsetX}px`);

    container.appendChild(el);

    if (isGain) {
      this.engine.audio.playTone(880, 0.08, 'sine', 0.2);
    } else {
      this.engine.audio.playTone(220, 0.12, 'sawtooth', 0.18);
    }

    setTimeout(() => {
      el.remove();
    }, 2400);
  }

  triggerDamageVignette() {
    let vignette = document.getElementById('damage-vignette');
    if (!vignette) {
      vignette = document.createElement('div');
      vignette.id = 'damage-vignette';
      vignette.className = 'damage-vignette-overlay';
      document.body.appendChild(vignette);
    }
    vignette.classList.remove('flash');
    void vignette.offsetWidth; // trigger reflow
    vignette.classList.add('flash');
  }

  updateEntityVisuals(res) {
    if (!res) return;
    const o2Pct = res.getPercent('oxygen');
    let frostEl = document.getElementById('visor-frost-overlay');
    if (!frostEl) {
      frostEl = document.createElement('div');
      frostEl.id = 'visor-frost-overlay';
      frostEl.className = 'visor-frost-overlay';
      document.body.appendChild(frostEl);
    }
    if (o2Pct <= 25) {
      frostEl.classList.add('visible');
      frostEl.style.opacity = `${(25 - o2Pct) / 25 * 0.85 + 0.15}`;
    } else {
      frostEl.classList.remove('visible');
    }

    const powerPct = res.getPercent('power');
    const pItem = document.getElementById('res-power');
    if (pItem) {
      pItem.classList.toggle('low-power-pulse', powerPct < 30);
    }

    const roverPct = res.getPercent('roverEnergy');
    const rItem = document.getElementById('res-rover');
    if (rItem) {
      rItem.classList.toggle('low-power-pulse', roverPct < 25);
    }

    const foodPct = res.getPercent('food');
    const fItem = document.getElementById('res-food');
    if (fItem) {
      fItem.classList.toggle('low-power-pulse', foodPct < 25);
    }

    const healthPct = res.getPercent('crewCondition');
    if (healthPct < 25 && Date.now() - (this._lastHeartbeat || 0) > 1800) {
      this._lastHeartbeat = Date.now();
      this.engine.audio.playHeartbeat();
    }

    // Physical Astronaut Mobility Fatigue (ESA Deconditioning & Low Nutrition):
    const scene = this.engine.currentScene;
    if (scene && scene.character) {
      const isFatigued = (foodPct < 20 || healthPct < 30);
      const isMoon = scene.character.isMoonGravity;
      const baseWalkSpeed = isMoon ? 5.4 : 6.0;
      scene.character.walkSpeed = isFatigued ? (baseWalkSpeed * 0.6) : baseWalkSpeed;
    }
  }

  getCardinalDirection(deg) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  }

  /* ── Upgraded Tactical Radar & Waypoint Navigation System ── */
  updateNavigation(data) {
    if (!data || !data.playerPos) return;
    this.lastNavData = data;

    const {
      playerPos,
      playerHeading = 0,
      basePos = { x: 0, z: 0 },
      baseName = 'Frontier Alpha Habitat',
      targets = [],
      terrainSize = 240,
      sectorName = 'SURFACE PROVING GROUND'
    } = data;

    if (this.tacticalMapLocation && sectorName) {
      this.tacticalMapLocation.textContent = `SECTOR: ${sectorName}`;
    }
    if (this.radarRangeLabel) {
      this.radarRangeLabel.textContent = `${Math.round(terrainSize / 2)}m [M]`;
    }
    if (this.radarScaleInner) {
      this.radarScaleInner.textContent = `${Math.round(terrainSize * 0.16)}m`;
    }
    if (this.radarScaleMid) {
      this.radarScaleMid.textContent = `${Math.round(terrainSize * 0.31)}m`;
    }
    if (this.radarScaleOuter) {
      this.radarScaleOuter.textContent = `${Math.round(terrainSize * 0.46)}m`;
    }

    // 1. Determine Active Target Objective
    const sceneActive = data.activeTarget || data.currentObjective;
    let activeTarget = null;
    if (this.pinnedTargetId) {
      activeTarget = targets.find(t => t.id === this.pinnedTargetId);
    }
    if (!activeTarget && sceneActive) {
      activeTarget = targets.find(t => t.id === sceneActive.id) || sceneActive;
    }
    if (!activeTarget) {
      activeTarget = targets.find(t => !t.completed);
    }
    if (!activeTarget) {
      // All sites completed: return waypoint to base
      activeTarget = {
        id: 'base_outpost',
        name: `${baseName} (Return)`,
        type: 'EXPEDITION RETURN POINT',
        pos: basePos,
        completed: true,
        isBase: true
      };
    }

    // 2. Compute Target Distance, Bearing & Arrow Heading
    const targetPos = activeTarget.pos || activeTarget.position || { x: 0, z: 0 };
    const dx = targetPos.x - playerPos.x;
    const dz = targetPos.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Cartographic bearing: North (-Z) is 0 deg, East (+X) is 90 deg, South (+Z) is 180 deg, West (-X) is 270 deg
    const bearingRad = Math.atan2(dx, -dz);
    const bearingDeg = (bearingRad * 180 / Math.PI + 360) % 360;
    const cardinal = this.getCardinalDirection(bearingDeg);

    // Player facing angle (North is 0 deg):
    const playerDeg = (Math.atan2(Math.sin(playerHeading), -Math.cos(playerHeading)) * 180 / Math.PI + 360) % 360;
    // Relative direction to target:
    const relDeg = (bearingDeg - playerDeg + 360) % 360;

    // 3. Update HUD Waypoint Telemetry Card
    const colorLabel = (activeTarget.colorName || (this.engine.waypointSystem ? this.engine.waypointSystem.currentColorName : 'PINK')).toUpperCase();
    const isPinkTarget = colorLabel.includes('PINK') || activeTarget.color === 0xff00ff;
    const isPurpleTarget = !isPinkTarget && (colorLabel.includes('PURPLE') || activeTarget.isPurple);
    const badgeColor = activeTarget.color !== undefined
      ? `#${activeTarget.color.toString(16).padStart(6, '0')}`
      : (isPinkTarget ? '#ff00ff' : (isPurpleTarget ? '#c084fc' : '#00e5ff'));

    if (this.waypointCard) {
      this.waypointCard.classList.toggle('purple-target', isPurpleTarget);
      this.waypointCard.classList.toggle('pink-target', isPinkTarget);
      this.waypointCard.style.borderColor = badgeColor;
      const badgeEl = this.waypointCard.querySelector('.waypoint-badge');
      if (badgeEl) {
        badgeEl.textContent = `🎯 ${colorLabel} BEACON`;
        badgeEl.style.color = badgeColor;
      }
    }
    if (this.waypointArrow) {
      this.waypointArrow.style.transform = `rotate(${relDeg}deg)`;
    }
    if (this.waypointTitle) {
      this.waypointTitle.textContent = activeTarget.name || 'Active Waypoint';
    }
    if (this.waypointDistance) {
      this.waypointDistance.textContent = `${Math.round(dist)} m`;
    }
    if (this.waypointBearing) {
      this.waypointBearing.textContent = `BRG ${Math.round(bearingDeg).toString().padStart(3, '0')}° [${cardinal}]`;
    }
    if (this.waypointStatus) {
      if (dist <= 5.5) {
        this.waypointStatus.textContent = 'ARRIVED [E]';
        this.waypointStatus.className = 'waypoint-status arrived';
      } else if (dist <= 25) {
        this.waypointStatus.textContent = 'APPROACHING';
        this.waypointStatus.className = 'waypoint-status';
      } else {
        this.waypointStatus.textContent = 'EN ROUTE';
        this.waypointStatus.className = 'waypoint-status';
      }
    }

    // 4. Update Player Marker on Circular Radar (Smooth Circular Clamp)
    if (this.minimapPlayer) {
      const maxRadiusPct = 43.5;
      const pdxPct = (playerPos.x / terrainSize) * 100;
      const pdzPct = (playerPos.z / terrainSize) * 100;
      const pDist = Math.sqrt(pdxPct * pdxPct + pdzPct * pdzPct);
      let px = pdxPct;
      let pz = pdzPct;
      if (pDist > maxRadiusPct) {
        px = (pdxPct / pDist) * maxRadiusPct;
        pz = (pdzPct / pDist) * maxRadiusPct;
      }
      this.minimapPlayer.style.left = `${50 + px}%`;
      this.minimapPlayer.style.top = `${50 + pz}%`;
      if (this.minimapPlayerArrow) {
        this.minimapPlayerArrow.style.transform = `rotate(${playerDeg}deg)`;
      }
    }

    // 5. Update Target & Base Markers on Circular Radar
    this._renderRadarMarkers(targets, basePos, baseName, activeTarget, terrainSize);

    // 6. Update Tactical Orbital Map if open
    if (this.tacticalMapPanel && this.tacticalMapPanel.classList.contains('visible')) {
      this.renderTacticalMapCanvas(data, activeTarget);
      this._renderTacticalWaypointList(targets, activeTarget, playerPos);
    }
  }

  _renderRadarMarkers(targets, basePos, baseName, activeTarget, terrainSize) {
    if (!this.minimapMarkers) return;

    // Consolidate targets: include activeTarget if not already listed
    const effectiveTargets = [...targets];
    if (activeTarget && !effectiveTargets.some(t => t.id === activeTarget.id) && !activeTarget.isBase) {
      effectiveTargets.push(activeTarget);
    }

    const markerCount = effectiveTargets.length + 1;
    if (this.minimapMarkers.children.length !== markerCount) {
      this.minimapMarkers.innerHTML = '';

      // Base marker
      const baseEl = document.createElement('div');
      baseEl.className = 'minimap-marker marker-base';
      baseEl.id = 'minimap-base-marker';
      baseEl.textContent = '⬡';
      baseEl.title = baseName;
      this.minimapMarkers.appendChild(baseEl);

      // Target blips
      effectiveTargets.forEach((t) => {
        const el = document.createElement('div');
        el.className = 'minimap-marker marker-target';
        el.id = `blip-${t.id}`;
        el.title = `${t.name} (Click to set active waypoint)`;
        el.onclick = (e) => {
          e.stopPropagation();
          this.pinnedTargetId = t.id;
          this.engine.audio.playUIClick();
          this.engine.showNotification(`Active Waypoint: ${t.name}`, 'info', 2500);
          if (this.lastNavData) {
            this.updateNavigation(this.lastNavData);
          }
        };
        this.minimapMarkers.appendChild(el);
      });
    }

    const maxRadiusPct = 43.5;

    // Position Base Outpost marker (Circular Polar Clamping)
    const baseEl = document.getElementById('minimap-base-marker');
    if (baseEl) {
      const bx = ((basePos.x || 0) / terrainSize) * 100;
      const bz = ((basePos.z || 0) / terrainSize) * 100;
      const bDist = Math.sqrt(bx * bx + bz * bz);
      let cx = bx;
      let cz = bz;
      if (bDist > maxRadiusPct) {
        cx = (bx / bDist) * maxRadiusPct;
        cz = (bz / bDist) * maxRadiusPct;
      }
      baseEl.style.left = `${50 + cx}%`;
      baseEl.style.top = `${50 + cz}%`;
    }

    // Position Target blips (Circular Polar Clamping + Purple Beacon Highlighting)
    effectiveTargets.forEach((t) => {
      const el = document.getElementById(`blip-${t.id}`);
      if (el) {
        const pos = t.pos || t.position || { x: 0, z: 0 };
        const tx = (pos.x / terrainSize) * 100;
        const tz = (pos.z / terrainSize) * 100;
        const dist = Math.sqrt(tx * tx + tz * tz);
        let cx = tx;
        let cz = tz;
        if (dist > maxRadiusPct) {
          cx = (tx / dist) * maxRadiusPct;
          cz = (tz / dist) * maxRadiusPct;
        }
        el.style.left = `${50 + cx}%`;
        el.style.top = `${50 + cz}%`;

        const isActive = activeTarget && activeTarget.id === t.id;
        const colorName = (t.colorName || (activeTarget && activeTarget.colorName) || (t.color === 0xff00ff ? 'PINK' : 'OBJECTIVE')).toUpperCase();
        const isPink = colorName.includes('PINK') || t.color === 0xff00ff || (isActive && activeTarget.color === 0xff00ff);
        const isPurple = !isPink && (t.isWaypoint || t.isPurple || colorName.includes('PURPLE'));

        el.classList.toggle('active', !!isActive);
        el.classList.toggle('completed', !!t.completed);
        el.classList.toggle('waypoint-purple', isPurple);
        el.classList.toggle('waypoint-pink', isPink);

        if (isPink) {
          el.title = `🎯 ${t.name} (PINK BEACON OBJECTIVE - Click to set)`;
          el.style.background = '#ff00ff';
          el.style.boxShadow = '0 0 12px #ff00ff, 0 0 20px rgba(255, 0, 255, 0.9)';
        } else if (isPurple) {
          el.title = `💜 ${t.name} (PURPLE BEACON OBJECTIVE - Click to set)`;
          el.style.background = '#c084fc';
          el.style.boxShadow = '0 0 10px #d946ef';
        } else {
          el.title = `${t.name} (Click to set active waypoint)`;
          el.style.background = '';
          el.style.boxShadow = '';
        }
      }
    });
  }

  /* ── Tactical Orbital Map Modal Handlers ── */
  toggleTacticalMap() {
    if (this.tacticalMapPanel && this.tacticalMapPanel.classList.contains('visible')) {
      this.closeTacticalMap();
    } else {
      this.openTacticalMap();
    }
  }

  openTacticalMap() {
    if (!this.tacticalMapPanel) return;
    this.engine.audio.playUIClick();
    this.engine.showPanel('tactical-map-modal');
    if (this.lastNavData) {
      this.updateNavigation(this.lastNavData);
    }
  }

  closeTacticalMap() {
    if (!this.tacticalMapPanel) return;
    this.engine.audio.playUIClick();
    this.engine.hidePanel('tactical-map-modal');
  }

  renderTacticalMapCanvas(data, activeTarget) {
    if (!this.tacticalMapCanvas) return;
    const canvas = this.tacticalMapCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const terrainSize = data.terrainSize || 240;
    const scale = (w * 0.86) / terrainSize; // pixels per world meter

    // 1. Clear background
    ctx.fillStyle = '#050a16';
    ctx.fillRect(0, 0, w, h);

    // 2. Coordinate Grid & Range Rings
    ctx.save();
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.12)';
    ctx.lineWidth = 1;
    const step = 20 * scale;
    for (let x = cx % step; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = cy % step; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Concentric range circles
    [30, 60, 90, 120].forEach(rMeters => {
      const rPx = rMeters * scale;
      if (rPx < w * 0.48) {
        ctx.beginPath();
        ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(74, 158, 255, 0.22)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        // Label
        ctx.fillStyle = 'rgba(74, 158, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.fillText(`${rMeters}m`, cx + 4, cy - rPx + 11);
      }
    });

    const worldToCanvas = (wx, wz) => {
      return {
        x: cx + wx * scale,
        y: cy + wz * scale
      };
    };

    // 3. Draw Trajectory Line (Player to Active Target)
    const pPos = data.playerPos;
    const pCanvas = worldToCanvas(pPos.x, pPos.z);

    if (activeTarget) {
      const tPos = activeTarget.pos || activeTarget.position || { x: 0, z: 0 };
      const tCanvas = worldToCanvas(tPos.x, tPos.z);
      const isPurple = !!(activeTarget.isWaypoint || activeTarget.isPurple);

      ctx.beginPath();
      ctx.moveTo(pCanvas.x, pCanvas.y);
      ctx.lineTo(tCanvas.x, tCanvas.y);
      ctx.strokeStyle = isPurple ? '#c084fc' : '#ff4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Draw Base Outpost
    const basePos = data.basePos || { x: 0, z: 0 };
    const bCanvas = worldToCanvas(basePos.x, basePos.z);
    ctx.beginPath();
    ctx.arc(bCanvas.x, bCanvas.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('OUTPOST BASE', bCanvas.x + 12, bCanvas.y + 4);

    // 5. Draw Targets (including Purple Objective Beacon)
    const mapTargets = [...(data.targets || [])];
    if (activeTarget && !mapTargets.some(t => t.id === activeTarget.id) && !activeTarget.isBase) {
      mapTargets.push(activeTarget);
    }

    mapTargets.forEach(t => {
      const pos = t.pos || t.position || { x: 0, z: 0 };
      const tc = worldToCanvas(pos.x, pos.z);
      const isActive = activeTarget && activeTarget.id === t.id;
      const colorName = (t.colorName || (activeTarget && activeTarget.colorName) || (t.color === 0xff00ff ? 'PINK' : '')).toUpperCase();
      const isPink = colorName.includes('PINK') || t.color === 0xff00ff || (isActive && activeTarget.color === 0xff00ff);
      const isPurple = !isPink && (t.isWaypoint || t.isPurple || colorName.includes('PURPLE') || (isActive && (activeTarget.isWaypoint || activeTarget.isPurple)));

      if (isPink || isPurple) {
        const ringCol = isPink ? '#ff00ff' : '#c084fc';
        const ringAlpha = isPink ? 'rgba(255, 0, 255, 0.65)' : 'rgba(217, 70, 239, 0.6)';
        const textCol = isPink ? '#ffb3ff' : '#f5d0fe';
        const icon = isPink ? '🎯' : '💜';

        // Glowing concentric rings matching 3D aura
        ctx.beginPath();
        ctx.arc(tc.x, tc.y, 16, 0, Math.PI * 2);
        ctx.strokeStyle = ringAlpha;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(tc.x, tc.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = ringCol;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Target Label with highlight
        ctx.fillStyle = textCol;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${icon} ${t.name}`, tc.x + 12, tc.y + 4);
      } else {
        if (isActive) {
          // Pulsing glow ring
          ctx.beginPath();
          ctx.arc(tc.x, tc.y, 14, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 68, 68, 0.5)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(tc.x, tc.y, isActive ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = t.completed ? '#00ff88' : (isActive ? '#ff4444' : '#ffaa00');
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Target Label
        ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255,255,255,0.75)';
        ctx.font = isActive ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.fillText(t.name, tc.x + 10, tc.y + 4);
      }
    });

    // 6. Draw Player Marker & FOV Arc
    const playerDeg = (Math.atan2(Math.sin(data.playerHeading || 0), -Math.cos(data.playerHeading || 0)) * 180 / Math.PI + 360) % 360;
    const headingRad = (playerDeg - 90) * (Math.PI / 180);

    // FOV cone
    ctx.beginPath();
    ctx.moveTo(pCanvas.x, pCanvas.y);
    ctx.arc(pCanvas.x, pCanvas.y, 38, headingRad - 0.45, headingRad + 0.45);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 229, 255, 0.16)';
    ctx.fill();

    // Player position dot
    ctx.beginPath();
    ctx.arc(pCanvas.x, pCanvas.y, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00e5ff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Heading pointer line
    ctx.beginPath();
    ctx.moveTo(pCanvas.x, pCanvas.y);
    ctx.lineTo(pCanvas.x + Math.cos(headingRad) * 16, pCanvas.y + Math.sin(headingRad) * 16);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // "YOU" Label
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('YOU', pCanvas.x - 10, pCanvas.y - 10);

    // 7. Compass Rose in top-right
    const compassX = w - 32;
    const compassY = 32;
    ctx.beginPath();
    ctx.moveTo(compassX, compassY + 14);
    ctx.lineTo(compassX, compassY - 14);
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('N', compassX - 4, compassY - 18);

    ctx.restore();
  }

  _renderTacticalWaypointList(targets, activeTarget, playerPos) {
    if (!this.tacticalWaypointList) return;
    this.tacticalWaypointList.innerHTML = '';

    const listTargets = [...targets];
    if (activeTarget && !listTargets.some(t => t.id === activeTarget.id) && !activeTarget.isBase) {
      listTargets.push(activeTarget);
    }

    listTargets.forEach((t, idx) => {
      const pos = t.pos || t.position || { x: 0, z: 0 };
      const dx = pos.x - playerPos.x;
      const dz = pos.z - playerPos.z;
      const dist = Math.round(Math.sqrt(dx * dx + dz * dz));
      const isActive = activeTarget && activeTarget.id === t.id;
      const isPurple = !!(t.isWaypoint || t.isPurple || (isActive && (activeTarget.isWaypoint || activeTarget.isPurple)));

      const card = document.createElement('div');
      card.className = `tactical-waypoint-card ${isActive ? 'active' : ''} ${isPurple ? 'purple-target' : ''} ${t.completed ? 'completed' : ''}`;
      
      const badgeColor = t.completed ? '#00ff88' : (isPurple ? '#c084fc' : (isActive ? '#ff4444' : '#ffaa00'));
      const badgeText = t.completed ? '✓ COMPLETED' : (isPurple ? '💜 MISSION OBJECTIVE (PURPLE BEACON)' : (isActive ? '🎯 ACTIVE TARGET' : `SITE #${idx + 1}`));

      card.innerHTML = `
        <div class="wp-card-head">
          <span style="color: ${badgeColor}; font-weight: 700;">
            ${badgeText}
          </span>
          <span style="color: ${isPurple ? '#f472b6' : 'var(--accent-cyan)'}; font-weight: 700;">${dist} m</span>
        </div>
        <div class="wp-card-title">${t.name}</div>
        <div class="wp-card-type">${t.type || (isPurple ? 'PRIMARY SCIENCE OBJECTIVE' : 'SCIENTIFIC SITE')}</div>
      `;

      card.onclick = () => {
        this.pinnedTargetId = t.id;
        this.engine.audio.playUIClick();
        this.engine.showNotification(`Target Pinned: ${t.name}`, 'info', 2000);
        if (this.lastNavData) {
          this.updateNavigation(this.lastNavData);
        }
      };

      this.tacticalWaypointList.appendChild(card);
    });
  }

  // Backwards compatibility fallback for updateMinimapDot
  updateMinimapDot(px, pz, terrainSize = 240) {
    if (this.minimapPlayer) {
      const maxRadiusPct = 43.5;
      const pdxPct = (px / terrainSize) * 100;
      const pdzPct = (pz / terrainSize) * 100;
      const pDist = Math.sqrt(pdxPct * pdxPct + pdzPct * pdzPct);
      let clX = pdxPct;
      let clZ = pdzPct;
      if (pDist > maxRadiusPct) {
        clX = (pdxPct / pDist) * maxRadiusPct;
        clZ = (pdzPct / pDist) * maxRadiusPct;
      }
      this.minimapPlayer.style.left = `${50 + clX}%`;
      this.minimapPlayer.style.top = `${50 + clZ}%`;
    }
  }

  showMessage(text, type = 'info', duration = 3000) {
    if (!this.notifContainer) return;

    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.textContent = text;
    this.notifContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s';
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }
}
