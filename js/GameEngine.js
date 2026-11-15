/* ============================================================
   FRONTIER: MISSION ACADEMY — Central Game Engine
   Coordinates 3D rendering, scenes, input, audio, UI & systems
   ============================================================ */

import * as THREE from 'three';
import { InputManager } from './InputManager.js';
import { SaveManager } from './SaveManager.js';
import { AudioManager } from './AudioManager.js';
import { ResourceSystem } from './systems/ResourceSystem.js';
import { DialogueSystem } from './systems/DialogueSystem.js';
import { ScoringSystem } from './systems/ScoringSystem.js';
import { HUD } from './ui/HUD.js';
import { DialogueUI } from './ui/DialogueUI.js';
import { JoystickUI } from './ui/JoystickUI.js';
import { SciencePanel } from './ui/SciencePanel.js';
import { EmergencyEventSystem } from './systems/EmergencyEventSystem.js';
import { RadiationSystem } from './systems/RadiationSystem.js';
import { TooltipSystem } from './systems/TooltipSystem.js';
import { TradeoffSystem } from './systems/TradeoffSystem.js';
import { LogbookUI } from './ui/LogbookUI.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { DestinationScene } from './scenes/DestinationScene.js';
import { SandboxScene } from './scenes/SandboxScene.js';
import { MoonOrbitalScene } from './scenes/MoonOrbitalScene.js';
import { MoonSouthPoleScene } from './scenes/MoonSouthPoleScene.js';
import { MoonThermalScene } from './scenes/MoonThermalScene.js';
import { MoonLavaTubeScene } from './scenes/MoonLavaTubeScene.js';
import { MoonCryoIceScene } from './scenes/MoonCryoIceScene.js';
import { MoonFarSideScene } from './scenes/MoonFarSideScene.js';
import { MarsOrbitalScene } from './scenes/MarsOrbitalScene.js';
import { MarsJezeroScene } from './scenes/MarsJezeroScene.js';
import { MarsArcadiaScene } from './scenes/MarsArcadiaScene.js';
import { MarsStormScene } from './scenes/MarsStormScene.js';
import { MarsLavaTubeScene } from './scenes/MarsLavaTubeScene.js';
import { MarsAscentReturnScene } from './scenes/MarsAscentReturnScene.js';
import { CHARACTER_LIST } from './data/characters.js';

export class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.clock = new THREE.Clock();
    this.eventListeners = {};

    // 1. Initialize Subsystems
    this.save = new SaveManager();
    this.audio = new AudioManager();
    this.input = new InputManager(this.canvas);
    this.resources = new ResourceSystem(this);
    this.dialogue = new DialogueSystem(this);
    this.scoring = new ScoringSystem(this);

    // 2. Initialize Three.js WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 3. Initialize UI Overlays
    this.hud = new HUD(this);
    this.dialogueUI = new DialogueUI(this);
    this.joystickUI = new JoystickUI(this);
    this.sciencePanel = new SciencePanel(this);
    this.emergency = new EmergencyEventSystem(this);
    this.radiation = new RadiationSystem(this);
    this.tooltip = new TooltipSystem(this);
    this.logbook = new LogbookUI(this);
    this.tradeoff = new TradeoffSystem(this);
    this.tradeoffs = this.tradeoff;

    // 4. State & Scenes
    this.state = 'INIT'; // 'MAIN_MENU' | 'DESTINATION' | 'SANDBOX' | 'PAUSED'
    this.previousState = 'MAIN_MENU';
    this.scenes = {};
    this.currentScene = null;

    this._bindWindowEvents();
    this._populateCharacterRoster();
  }

  /* ── Event Dispatcher ── */
  on(event, callback) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(callback);
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(cb => cb(data));
    }
  }

  /* ── Lifecycle Initialization ── */
  init() {
    // Instantiate 3D Scenes
    this.scenes.MAIN_MENU = new MainMenuScene(this);
    this.scenes.DESTINATION = new DestinationScene(this);
    this.scenes.SANDBOX = new SandboxScene(this);
    this.scenes.MOON_ORBIT = new MoonOrbitalScene(this);
    this.scenes.MOON_M1 = new MoonSouthPoleScene(this);
    this.scenes.MOON_M2 = new MoonThermalScene(this);
    this.scenes.MOON_M3 = new MoonLavaTubeScene(this);
    this.scenes.MOON_M4 = new MoonCryoIceScene(this);
    this.scenes.MOON_M5 = new MoonFarSideScene(this);
    this.scenes.MARS_M0 = new MarsOrbitalScene(this);
    this.scenes.MARS_M1 = new MarsJezeroScene(this);
    this.scenes.MARS_M2 = new MarsArcadiaScene(this);
    this.scenes.MARS_M3 = new MarsStormScene(this);
    this.scenes.MARS_M4 = new MarsLavaTubeScene(this);
    this.scenes.MARS_M5 = new MarsAscentReturnScene(this);

    // Initial State: Main Menu
    this.setState('MAIN_MENU');

    // Dismiss Loading Screen
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    if (loadingBar) loadingBar.style.width = '100%';

    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => loadingScreen.remove(), 450);
      }
    }, 400);

    // Start Main Loop
    this._animate();
  }

  isSurfaceExpedition() {
    return [
      'SANDBOX',
      'MOON_M1', 'MOON_M2', 'MOON_M3', 'MOON_M4', 'MOON_M5',
      'MARS_M1', 'MARS_M2', 'MARS_M3', 'MARS_M4', 'MARS_M5'
    ].includes(this.state);
  }

  /* ── State Machine ── */
  setState(newState) {
    if (this.state === newState) return;

    if (this.state === 'PAUSED' && newState !== 'PAUSED') {
      const pausePanel = document.getElementById('pause-panel');
      if (pausePanel) pausePanel.classList.remove('visible');
    }

    if (newState === 'PAUSED') {
      this.previousState = this.state;
      this.state = 'PAUSED';
      const pausePanel = document.getElementById('pause-panel');
      if (pausePanel) pausePanel.classList.add('visible');
      return;
    }

    // Exit old scene
    if (this.currentScene && this.currentScene.onExit) {
      this.currentScene.onExit();
    }

    this.previousState = this.state;
    this.state = newState;
    this.currentScene = this.scenes[newState] || null;

    // Push browser history state for Google tab Back arrow navigation
    try {
      const hash = newState.toLowerCase().replace(/_/g, '-');
      history.pushState({ state: newState }, '', '#' + hash);
    } catch (e) {}

    // Update radiation system to new scene context
    if (this.radiation) this.radiation.setScene(newState);

    // Show or hide HUD based on whether we are in a surface mission
    if (this.hud) {
      if (this.isSurfaceExpedition() || newState === 'SANDBOX') {
        this.hud.show();
      } else {
        this.hud.hide();
      }
    }

    // Enter new scene
    if (this.currentScene && this.currentScene.onEnter) {
      this.currentScene.onEnter();
    }

    this.emit('state:change', { state: this.state });
  }

  /* ── Panel Management Helpers ── */
  showPanel(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('visible');
      if (el.classList.contains('side-panel') || el.classList.contains('lunar-archive-center-modal')) {
        const backdrop = document.getElementById('panel-backdrop');
        if (backdrop) backdrop.classList.add('visible');
      }
    }
  }

  hidePanel(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('visible');
      const anyModal = document.querySelector('.side-panel.visible, .lunar-archive-center-modal.visible');
      if (!anyModal) {
        const backdrop = document.getElementById('panel-backdrop');
        if (backdrop) backdrop.classList.remove('visible');
      }
    }
  }

  hideAllPanels() {
    ['main-menu', 'destination-panel', 'moon-mission-modal', 'mars-mission-modal', 'hud', 'dialogue-panel', 'science-panel', 'character-info-panel', 'settings-panel', 'pause-panel', 'tactical-map-modal', 'storm-emergency-modal', 'mission-accomplished-modal', 'logbook-panel', 'mission-tradeoff-modal'].forEach(id => {
      this.hidePanel(id);
    });
    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) backdrop.classList.remove('visible');
  }

  showNotification(text, type = 'info', duration = 3000) {
    this.hud.showMessage(text, type, duration);
  }

  /**
   * 30% Hard Fail State & Operational Abort Flow
   */
  triggerMissionFailed({ title, reason, desc, onRetry } = {}) {
    let modal = document.getElementById('mission-failed-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mission-failed-modal';
      modal.className = 'mission-failed-modal';
      document.body.appendChild(modal);
    }

    // Guard: Do not thrash innerHTML or rebind click handlers if already open and visible
    if (modal.classList.contains('visible')) return;

    // Pause simulation so background drains and physics halt while modal is active
    this.isGamePaused = true;

    // Disable player and rover controls immediately
    if (this.currentScene) {
      if (this.currentScene.character) this.currentScene.character.setControlEnabled(false);
      if (this.currentScene.rover) this.currentScene.rover.setControlEnabled(false);
    }

    const failTitle = title || 'MISSION FAILED';
    const failReason = reason || 'Resource levels dropped below the 30% safety limit.';
    const failDesc = desc || 'NASA Artemis Survival Protocol: When ANY life support or power entity falls to 30%, safety margins are violated and the expedition must abort.';

    modal.innerHTML = `
      <div class="fail-badge-pill">⚠️ MISSION ABORTED</div>
      <h2 class="fail-title">🚨 ${failTitle}</h2>
      <div class="fail-subtitle">${failReason}</div>
      <p class="fail-desc">${failDesc}</p>
      
      <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
        <button id="btn-failed-retry" class="btn btn-primary" style="background: linear-gradient(135deg, #ef4444, #dc2626); border-color: #f87171; color: #fff; font-weight: 800; padding: 12px 24px; cursor: pointer; pointer-events: auto; z-index: 20005;">
          🔄 RETRY MISSION
        </button>
        <button id="btn-failed-return" class="btn btn-secondary" style="border-color: #94a3b8; color: #cbd5e1; font-weight: 700; padding: 12px 24px; cursor: pointer; pointer-events: auto; z-index: 20005;">
          🪐 RETURN TO DESTINATION
        </button>
      </div>
    `;

    modal.classList.add('visible');
    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) backdrop.classList.add('visible');

    this.audio.playTone(220, 0.4, 'sawtooth', 0.4);
    setTimeout(() => this.audio.playTone(165, 0.6, 'sawtooth', 0.45), 250);

    const btnRetry = document.getElementById('btn-failed-retry');
    if (btnRetry) {
      btnRetry.onclick = () => {
        this.audio.playUIClick();
        modal.classList.remove('visible');
        if (backdrop) backdrop.classList.remove('visible');
        this.isGamePaused = false;

        // Reset hard fail state and restore campaign resources back to 100%
        if (this.resources) {
          this.resources._hardFailed = false;
        }
        if (this.save && this.save.resetCampaignResources) {
          this.save.resetCampaignResources();
        }
        if (this.resources) {
          this.resources.initMissionLevels({ power: 100, oxygen: 100, water: 100, food: 100, roverEnergy: 100, crewCondition: 100 });
        }

        // Clear saved progress for this mission scene so it restarts cleanly from beginning
        const sceneProgressKeys = {
          'MOON_M1': 'progress.moonM1',
          'MOON_M2': 'progress.moonM2',
          'MOON_M3': 'progress.moonM3',
          'MOON_M4': 'progress.moonM4',
          'MOON_M5': 'progress.moonM5',
          'MARS_M0': 'progress.marsM0',
          'MARS_M1': 'progress.marsM1',
          'MARS_M2': 'progress.marsM2',
          'MARS_M3': 'progress.marsM3',
          'MARS_M4': 'progress.marsM4',
          'MARS_M5': 'progress.marsM5'
        };
        const pKey = sceneProgressKeys[this.state];
        if (pKey && this.save) {
          this.save.set(pKey, null);
        }

        // Re-enable character & rover controls and reset mode
        if (this.currentScene) {
          if (this.currentScene.character) {
            this.currentScene.character.setControlEnabled(true);
            this.currentScene.character.isRoverMounted = false;
            this.currentScene.character.setVisible(true);
          }
          if (this.currentScene.rover) {
            this.currentScene.rover.setControlEnabled(true);
            this.currentScene.rover.isOccupied = false;
            this.currentScene.rover.speed = 0;
          }
          if (this.currentScene.lander) {
            this.currentScene.lander.interiorActive = false;
            this.currentScene.lander.isOccupied = false;
          }
          this.currentScene.mode = 'walk';

          // Clear any active storm timer
          if (this.currentScene._stormInterval) {
            clearInterval(this.currentScene._stormInterval);
            this.currentScene._stormInterval = null;
          }
          if (this.currentScene.stormHUD) {
            this.currentScene.stormHUD.style.display = 'none';
          }
        }

        if (onRetry) {
          onRetry();
        } else if (this.currentScene && typeof this.currentScene.restartMission === 'function') {
          this.currentScene.restartMission();
        } else if (this.currentScene && typeof this.currentScene.onEnter === 'function') {
          this.currentScene.onEnter();
        } else {
          const cur = this.state;
          this.setState('DESTINATION');
          setTimeout(() => this.setState(cur), 50);
        }
      };
    }

    const btnReturn = document.getElementById('btn-failed-return');
    if (btnReturn) {
      btnReturn.onclick = () => {
        this.audio.playUIClick();
        modal.classList.remove('visible');
        if (backdrop) backdrop.classList.remove('visible');
        this.isGamePaused = false;

        // Reset hard fail state and restore campaign resources
        if (this.resources) {
          this.resources._hardFailed = false;
        }
        if (this.save && this.save.resetCampaignResources) {
          this.save.resetCampaignResources();
        }
        if (this.resources) {
          this.resources.initMissionLevels({ power: 100, oxygen: 100, water: 100, food: 100, roverEnergy: 100, crewCondition: 100 });
        }

        // Clear saved progress for this mission scene
        const sceneProgressKeys = {
          'MOON_M1': 'progress.moonM1',
          'MOON_M2': 'progress.moonM2',
          'MOON_M3': 'progress.moonM3',
          'MOON_M4': 'progress.moonM4',
          'MOON_M5': 'progress.moonM5',
          'MARS_M0': 'progress.marsM0',
          'MARS_M1': 'progress.marsM1',
          'MARS_M2': 'progress.marsM2',
          'MARS_M3': 'progress.marsM3',
          'MARS_M4': 'progress.marsM4',
          'MARS_M5': 'progress.marsM5'
        };
        const pKey = sceneProgressKeys[this.state];
        if (pKey && this.save) {
          this.save.set(pKey, null);
        }

        // Re-enable controls
        if (this.currentScene) {
          if (this.currentScene.character) this.currentScene.character.setControlEnabled(true);
          if (this.currentScene.rover) this.currentScene.rover.setControlEnabled(true);
          if (this.currentScene._stormInterval) {
            clearInterval(this.currentScene._stormInterval);
            this.currentScene._stormInterval = null;
          }
        }

        const wasMars = this.state && this.state.startsWith('MARS_');
        this.setState('DESTINATION');
        if (wasMars) {
          this.showPanel('mars-mission-modal');
        } else {
          this.showPanel('moon-mission-modal');
        }
        const pBackdrop = document.getElementById('panel-backdrop');
        if (pBackdrop) pBackdrop.classList.add('visible');
      };
    }
  }

  /**
   * Massive Rewarding Mission Completed Celebration Flow (Phase 4.2 / Win State)
   */
  showMissionCompletedModal({ title, subtitle, points, praise, resources, onSelectNext }) {
    let modal = document.getElementById('mission-completed-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mission-completed-modal';
      modal.className = 'mission-completed-modal';
      document.body.appendChild(modal);
    }

    // Dynamic live resources from ResourceSystem
    let res = resources;
    if (!res && this.resources) {
      res = {
        oxygen: Math.round(this.resources.getPercent('oxygen')),
        power: Math.round(this.resources.getPercent('power')),
        health: Math.round(this.resources.getPercent('crewCondition')),
        food: Math.round(this.resources.getPercent('food')),
        water: Math.round(this.resources.getPercent('water'))
      };
    }
    if (!res) res = { oxygen: 92, power: 85, health: 90, food: 88, water: 94 };

    // Persist real life support percentages forward into the campaign save
    if (this.save && this.save.saveCampaignResources) {
      this.save.saveCampaignResources(res);
    }

    // Dynamic Mission Score calculation (reflecting performance & preserved consumables)
    const key = (subtitle || title || this.state || '').toLowerCase();
    let basePts = 2000;
    if (key.includes('m0') || key.includes('orbit') || key.includes('recon')) basePts = 1200;
    else if (key.includes('m1') || key.includes('south pole') || key.includes('shackleton')) basePts = 2100;
    else if (key.includes('m2') || key.includes('thermal') || key.includes('imbrium') || key.includes('plain')) basePts = 2450;
    else if (key.includes('m3') || key.includes('cave') || key.includes('lava') || key.includes('tube')) basePts = 2750;
    else if (key.includes('m4') || key.includes('faustini') || key.includes('cryo') || key.includes('ice mine')) basePts = 3100;
    else if (key.includes('m5') || key.includes('radio') || key.includes('daedalus') || key.includes('quiet')) basePts = 3600;
    else if (key.includes('mars') && key.includes('storm')) basePts = 3400;
    else if (key.includes('mars')) basePts = 2800;

    // Incorporate base score with performance resource survival bonus
    const missionBase = (typeof points === 'number' && points > 0) ? Math.max(points, basePts) : basePts;
    const resourceBonus = Math.round((res.power * 2.2) + (res.oxygen * 2.0) + (res.health * 2.5) + (res.food * 1.5) + (res.water * 1.5));
    const finalScore = missionBase + resourceBonus;

    if (this.scoring && this.scoring.add) {
      this.scoring.add(finalScore, `${title || 'Mission'} Completed`);
    }

    // Samples collected specifically for this mission (not cumulative logbook total)
    const missionSamples = this.save ? this.save.getMissionSamples(this.state) : 0;
    const samplesCount = missionSamples > 0 ? missionSamples : (key.includes('m0') ? 1 : 2);

    // Dynamic NASA Compliance rating reflecting preserved life support margins
    const avgRes = Math.round((res.oxygen + res.power + res.health + res.food + res.water) / 5);
    const compliancePct = Math.min(99, Math.max(76, Math.round((avgRes * 0.42) + 54)));

    modal.innerHTML = `
      <div class="completed-badge-pill">★ EXPEDITION OBJECTIVE FULFILLED ★</div>
      <h2 class="completed-title">🏆 MISSION ACCOMPLISHED!</h2>
      <div class="completed-mission-name">${title || 'Planetary Surface Operation'}</div>
      ${subtitle ? `<div class="completed-mission-sub">${subtitle}</div>` : ''}
      
      <div class="completed-stats-row">
        <div class="completed-stat-card">
          <div class="completed-stat-num">+${finalScore.toLocaleString()}</div>
          <div class="completed-stat-lbl">SCIENCE POINTS</div>
        </div>
        <div class="completed-stat-card">
          <div class="completed-stat-num">${samplesCount}</div>
          <div class="completed-stat-lbl">SAMPLES SECURED</div>
        </div>
        <div class="completed-stat-card">
          <div class="completed-stat-num">${compliancePct}%</div>
          <div class="completed-stat-lbl">NASA COMPLIANCE</div>
        </div>
      </div>

      <!-- Life Support Final Resource Breakdown -->
      <div class="completed-resources-container">
        <div class="completed-resources-title">FINAL LIFE SUPPORT & RESOURCE STATUS</div>
        <div class="completed-resources-grid">
          <div class="completed-res-card">
            <span class="res-icon">🫁</span>
            <div class="res-data">
              <span class="res-name">OXYGEN</span>
              <span class="res-val" style="color: #38bdf8;">${res.oxygen}%</span>
            </div>
          </div>
          <div class="completed-res-card">
            <span class="res-icon">⚡</span>
            <div class="res-data">
              <span class="res-name">POWER</span>
              <span class="res-val" style="color: #facc15;">${res.power}%</span>
            </div>
          </div>
          <div class="completed-res-card">
            <span class="res-icon">❤️</span>
            <div class="res-data">
              <span class="res-name">HEALTH</span>
              <span class="res-val" style="color: #4ade80;">${res.health}%</span>
            </div>
          </div>
          <div class="completed-res-card">
            <span class="res-icon">🥗</span>
            <div class="res-data">
              <span class="res-name">FOOD</span>
              <span class="res-val" style="color: #a3e635;">${res.food}%</span>
            </div>
          </div>
          <div class="completed-res-card">
            <span class="res-icon">💧</span>
            <div class="res-data">
              <span class="res-name">WATER</span>
              <span class="res-val" style="color: #22d3ee;">${res.water}%</span>
            </div>
          </div>
        </div>
      </div>

      <p class="completed-praise">
        ${praise || 'Outstanding work, Astronaut Alex Morgan! Your planetary decisions and surface operations have been successfully verified by Mission Control.'}
      </p>

      <button id="btn-return-mission-select" class="completed-btn-select">
        🪐 RETURN TO MISSION SELECT ▶
      </button>
    `;

    modal.classList.add('visible');
    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) backdrop.classList.add('visible');

    this.audio.playFanfare();

    const btnReturn = document.getElementById('btn-return-mission-select');
    if (btnReturn) {
      btnReturn.onclick = () => {
        this.audio.playUIClick();
        modal.classList.remove('visible');
        if (backdrop) backdrop.classList.remove('visible');
        if (onSelectNext) {
          onSelectNext();
        } else {
          // Route back to the appropriate planetary operations archive
          const wasMars = this.state && this.state.startsWith('MARS_');
          this.setState('DESTINATION');
          if (wasMars) {
            this.showPanel('mars-mission-modal');
          } else {
            this.showPanel('moon-mission-modal');
          }
        }
      };
    }
  }

  /* ── Google Tab Back Arrow / Browser Navigation Handler ── */
  handleBrowserBack(savedState) {
    console.log('[GameEngine] Browser Back Arrow Pressed! Current state:', this.state, 'Target:', savedState);

    // 1. If inside an open modal or side panel, close it first
    const openModal = document.querySelector('.side-panel.visible');
    if (openModal) {
      this.audio.playUIClick();
      this.hidePanel(openModal.id);
      history.pushState({ state: this.state }, '', '#' + this.state.toLowerCase().replace(/_/g, '-'));
      return;
    }

    // 2. If in MoonOrbitalScene and currently looking outside through the viewport:
    if (this.state === 'MOON_ORBIT' && this.currentScene && this.currentScene.isLookingOutside) {
      this.audio.playUIClick();
      this.currentScene.exitOrbitalView();
      history.pushState({ state: 'MOON_ORBIT' }, '', '#moon-orbit');
      return;
    }

    // 2b. If in MarsOrbitalScene and currently looking outside through the viewport:
    if (this.state === 'MARS_M0' && this.currentScene && this.currentScene.isLookingOutside) {
      this.audio.playUIClick();
      this.currentScene.exitOrbitalView();
      history.pushState({ state: 'MARS_M0' }, '', '#mars-m0');
      return;
    }

    // 3. If in MoonOrbitalScene or MarsOrbitalScene cabin: go back to Destination Selector
    if (this.state === 'MOON_ORBIT' || this.state === 'MARS_M0') {
      this.audio.playUIClick();
      this.setState('DESTINATION');
      return;
    }

    // 4. If on lunar surface: go back to Moon Orbit cabin
    if (['MOON_M1', 'MOON_M2', 'MOON_M3', 'MOON_M4', 'MOON_M5'].includes(this.state)) {
      this.audio.playUIClick();
      this.setState('MOON_ORBIT');
      return;
    }

    // 5. If on Martian surface: go back to Mars Orbit cabin
    if (['MARS_M1', 'MARS_M2', 'MARS_M3', 'MARS_M4', 'MARS_M5'].includes(this.state)) {
      this.audio.playUIClick();
      this.setState('MARS_M0');
      return;
    }

    // 5b. If in Sandbox: go back to Destination Selector
    if (this.state === 'SANDBOX') {
      this.audio.playUIClick();
      this.setState('DESTINATION');
      return;
    }

    // 6. If on Destination Selector: go back to Main Menu
    if (this.state === 'DESTINATION') {
      this.audio.playUIClick();
      this.setState('MAIN_MENU');
      return;
    }

    // 7. If on Main Menu: keep player in game on Main Menu, prevent leaving page!
    if (this.state === 'MAIN_MENU') {
      history.pushState({ state: 'MAIN_MENU' }, '', '#menu');
      this.showNotification('🪐 Frontier Command Menu. Choose a mission to deploy!', 'info', 3000);
      return;
    }

    // Fallback: if savedState has a known state, use it, otherwise MAIN_MENU
    if (savedState && savedState.state && this.scenes[savedState.state]) {
      this.setState(savedState.state);
    } else {
      this.setState('MAIN_MENU');
    }
  }

  /* ── Window & Accessibility ── */
  _bindWindowEvents() {
    // Initialize browser history entry so the Google Chrome tab Back button doesn't close the game
    try {
      const currentHash = (window.location.hash || '').toLowerCase();
      if (!currentHash || currentHash === '#menu') {
        history.replaceState({ state: 'MAIN_MENU' }, '', '#menu');
        history.pushState({ state: 'MAIN_MENU' }, '', '#menu');
      }
    } catch (e) {
      console.warn('[GameEngine] History API init:', e);
    }

    // Handle Google Chrome Tab Back Arrow
    window.addEventListener('popstate', (e) => {
      this.handleBrowserBack(e.state);
    });

    // Window Resize
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.renderer.setSize(width, height);
      if (this.currentScene && this.currentScene.onResize) {
        this.currentScene.onResize(width, height);
      }
    });

    // Backdrop Click Dismiss
    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) {
      backdrop.onclick = () => {
        this.audio.playUIClick();
        document.querySelectorAll('.side-panel.visible').forEach(panel => {
          this.hidePanel(panel.id);
        });
      };
    }

    // Escape Key Handler (closes modals first, then pauses game)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        // 1. Close Tradeoffs console if open
        if (this.tradeoff && this.tradeoff.isConsoleOpen && this.tradeoff.isConsoleOpen()) {
          this.audio.playUIClick();
          this.tradeoff.closePowerConsole();
          return;
        }
        // 2. Close Tradeoff Decision dilemma modal if open
        if (this.tradeoff && this.tradeoff.modalEl && this.tradeoff.modalEl.classList.contains('visible')) {
          this.audio.playUIClick();
          this.tradeoff.close();
          return;
        }
        const openModal = document.querySelector('.side-panel.visible');
        if (openModal) {
          this.audio.playUIClick();
          this.hidePanel(openModal.id);
          return;
        }
        if (this.isSurfaceExpedition() || this.state === 'MOON_ORBIT') {
          this.setState('PAUSED');
        } else if (this.state === 'PAUSED') {
          this.setState(this.previousState);
        }
      }
    });

    // Pause UI Buttons
    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
      btnResume.onclick = () => {
        this.audio.playUIClick();
        this.setState(this.previousState);
      };
    }

    const btnPauseMenu = document.getElementById('btn-pause-menu');
    if (btnPauseMenu) {
      btnPauseMenu.onclick = () => {
        this.audio.playUIClick();
        this.setState('MAIN_MENU');
      };
    }

    // Modal Close Buttons
    const btnCloseChars = document.getElementById('btn-close-chars');
    if (btnCloseChars) {
      btnCloseChars.onclick = () => {
        this.audio.playUIClick();
        this.hidePanel('character-info-panel');
      };
    }

    const btnCloseSettings = document.getElementById('btn-close-settings');
    if (btnCloseSettings) {
      btnCloseSettings.onclick = () => {
        this.audio.playUIClick();
        this.hidePanel('settings-panel');
      };
    }

    // Audio & Settings Binding
    const volMusic = document.getElementById('vol-music');
    if (volMusic) {
      volMusic.oninput = (e) => {
        this.audio.setMusicVolume(e.target.value / 100);
      };
    }

    const volSfx = document.getElementById('vol-sfx');
    if (volSfx) {
      volSfx.oninput = (e) => {
        this.audio.setSFXVolume(e.target.value / 100);
        this.audio.playTone(880, 0.05, 'triangle', 0.25);
      };
    }

    const toggleSubtitles = document.getElementById('toggle-subtitles');
    if (toggleSubtitles) {
      toggleSubtitles.onchange = () => {
        this.audio.playUIClick();
        this.showNotification(toggleSubtitles.checked ? 'Subtitles enabled' : 'Subtitles disabled', 'info');
      };
    }

    const toggleColorblind = document.getElementById('toggle-colorblind');
    if (toggleColorblind) {
      toggleColorblind.onchange = () => {
        this.audio.playUIClick();
        this.showNotification(toggleColorblind.checked ? 'Color-safe palette enabled' : 'Standard palette restored', 'info');
      };
    }

    const btnReset = document.getElementById('btn-reset-save');
    if (btnReset) {
      btnReset.onclick = () => {
        this.audio.playWarning();
        if (confirm('Clear local astronaut findings and reset progress?')) {
          this.save.resetProgress();
          this.audio.playSuccess();
          this.showNotification('Local save data reset successfully', 'info');
        }
      };
    }
  }

  _populateCharacterRoster() {
    const list = document.getElementById('char-roster-list');
    if (!list) return;

    list.innerHTML = '';
    CHARACTER_LIST.forEach((c) => {
      const card = document.createElement('div');
      card.className = 'char-card-mini';
      card.innerHTML = `
        <div class="char-mini-avatar" style="border-color: ${c.suitAccent};">${c.emoji}</div>
        <div class="char-mini-info">
          <div class="char-mini-name">${c.name} (${c.role})</div>
          <div class="char-mini-role">${c.description}</div>
        </div>
      `;
      card.onmouseenter = () => this.audio.playUIHover();
      card.onclick = () => {
        this.audio.playUIClick();
        this.showNotification(`Specialist: ${c.name} — ${c.role}`, 'info');
      };
      list.appendChild(card);
    });
  }

  /* ── Master Render / Game Loop ── */
  _animate() {
    requestAnimationFrame(() => this._animate());

    const dt = Math.min(this.clock.getDelta(), 0.1);

    if (this.state !== 'PAUSED' && !this.isGamePaused) {
      // 1. Update Game Systems
      if (this.isSurfaceExpedition()) {
        this.resources.update(dt);
        this.hud.update();
        // Radiation: get shelter state from scene's lander
        const scene = this.currentScene;
        const insideShelter = scene && scene.lander ? scene.lander.interiorActive : false;
        this.radiation.update(dt, insideShelter);
        this.emergency.update(dt);
        if (this.tradeoff) this.tradeoff.update(dt);
      }

      this.dialogue.update(dt);
      this.dialogueUI.update();

      // 2. Update Current 3D Scene
      if (this.currentScene && this.currentScene.update) {
        this.currentScene.update(dt);
      }
    }

    // 3. Render 3D Frame
    if (this.currentScene) {
      const threeScene = this.currentScene.getThreeScene();
      const camera = this.currentScene.getCamera();
      if (threeScene && camera) {
        this.renderer.render(threeScene, camera);
      }
    }

    // 4. Clear Per-Frame Input Flags
    this.input.endFrame();
  }
}
