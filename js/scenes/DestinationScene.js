/* ============================================================
   FRONTIER: MISSION ACADEMY — Destination Selector Scene
   3D representation of Moon & Mars planetary destinations
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';

export class DestinationScene extends BaseScene {
  constructor(engine) {
    super(engine);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 28);
    this.camera.lookAt(0, 0, 0);

    this._buildStarfield();
    this._buildPlanets();
    this._buildLighting();
  }

  _buildStarfield() {
    const starCount = 4000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 400;
      positions[i + 1] = (Math.random() - 0.5) * 400;
      positions[i + 2] = (Math.random() - 0.5) * 400;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ size: 1.0, color: 0x8899bb });
    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  _buildPlanets() {
    // 1. Earth/Academy Hub (Center)
    const earthGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x1a4e8f,
      roughness: 0.6,
      metalness: 0.2
    });
    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.earthMesh.position.set(0, -1, 0);
    this.scene.add(this.earthMesh);

    // 2. Moon (Left)
    const moonGeo = new THREE.SphereGeometry(2.2, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0x9999aa,
      roughness: 0.9,
      metalness: 0.1
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.position.set(-10, 1, 0);
    this.scene.add(this.moonMesh);

    // 3. Mars (Right)
    const marsGeo = new THREE.SphereGeometry(2.8, 32, 32);
    const marsMat = new THREE.MeshStandardMaterial({
      color: 0xcc5533,
      roughness: 0.8,
      metalness: 0.1
    });
    this.marsMesh = new THREE.Mesh(marsGeo, marsMat);
    this.marsMesh.position.set(10, 1, 0);
    this.scene.add(this.marsMesh);
  }

  _buildLighting() {
    const ambient = new THREE.AmbientLight(0x0e172a, 1.2);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e0, 2.0);
    sun.position.set(20, 20, 20);
    this.scene.add(sun);
  }

  onEnter() {
    this.engine.showPanel('destination-panel');
    this._updateProgressBadges();
    this._bindEvents();

    if (!this._boundProgressEvent) {
      this._boundProgressEvent = () => this._updateProgressBadges();
      window.addEventListener('frontier:missionCompleted', this._boundProgressEvent);
    }
  }

  _updateProgressBadges() {
    try {
      const marsSaved = this.engine.save.get('progress.marsM1');
      const moonSaved1 = this.engine.save.get('progress.moonM1');
      const moonSaved2 = this.engine.save.get('progress.moonM2');
      const moonSaved3 = this.engine.save.get('progress.moonM3');
      const moonSaved4 = this.engine.save.get('progress.moonM4');
      const moonSaved5 = this.engine.save.get('progress.moonM5');

      const isMarsM0Done = this.engine.save.isMissionCompleted('mars_m0');

      const marsStatusEl = document.querySelector('#card-mars .dest-card-status');
      if (marsStatusEl) {
        if (marsSaved && marsSaved.missionComplete) {
          marsStatusEl.textContent = '🏆 JEZERO CAMPAIGN COMPLETE';
        } else if (marsSaved && marsSaved.completedSteps && marsSaved.completedSteps.length > 0) {
          marsStatusEl.textContent = `● RESUME STEP ${marsSaved.currentStep || 1}/10 (SAVED)`;
        } else if (isMarsM0Done) {
          marsStatusEl.textContent = '● MISSION 1 READY (JEZERO DELTA)';
        } else {
          marsStatusEl.textContent = '★ START MISSION 0: ORBIT';
        }
      }

      // Main Moon destination card badge
      const moonStatusEl = document.querySelector('#card-moon .dest-card-status');
      const anyMoonDone = [moonSaved1, moonSaved2, moonSaved3, moonSaved4, moonSaved5].some(m => m?.missionComplete);
      const anyMoonActive = [moonSaved1, moonSaved2, moonSaved3, moonSaved4, moonSaved5].some(m => m?.missionStage);

      if (moonStatusEl) {
        if (anyMoonDone) {
          moonStatusEl.textContent = '🏆 LUNAR THEATRE ACTIVE (5 MISSIONS)';
        } else if (anyMoonActive) {
          moonStatusEl.textContent = '● RESUME LUNAR OPERATIONS';
        } else {
          moonStatusEl.textContent = '5 MISSIONS UNLOCKED';
        }
      }

      // Sequential Mission Locking Logic:
      // Powered by SaveManager.isMissionUnlocked with strict prerequisite validation
      const moonUnlocks = {
        m1: this.engine.save.isMissionUnlocked('moon_m1'),
        m2: this.engine.save.isMissionUnlocked('moon_m2'),
        m3: this.engine.save.isMissionUnlocked('moon_m3'),
        m4: this.engine.save.isMissionUnlocked('moon_m4'),
        m5: this.engine.save.isMissionUnlocked('moon_m5')
      };

      const updateCardLockState = (cardId, btnId, statusId, isUnlocked, prevName, defaultStatusText, savedObj, launchBtnText) => {
        const card = document.getElementById(cardId);
        const btn = document.getElementById(btnId);
        const el = document.getElementById(statusId);

        if (isUnlocked) {
          if (card) {
            card.classList.remove('dest-card-locked');
            card.style.opacity = '1';
            card.style.filter = 'none';
            card.style.cursor = 'pointer';
            const oldOverlay = card.querySelector('.mission-padlock-overlay');
            if (oldOverlay) oldOverlay.remove();
          }
          if (btn) {
            btn.textContent = launchBtnText;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.removeAttribute('disabled');
          }
          if (el) {
            if (savedObj?.missionComplete) {
              el.textContent = '🏆 MISSION COMPLETED';
              el.className = 'dest-card-status status-unlocked';
              el.style.color = '#4ade80';
              el.style.borderColor = '#4ade80';
            } else if (savedObj?.missionStage) {
              el.textContent = '● RESUME IN-PROGRESS';
              el.className = 'dest-card-status status-unlocked';
              el.style.color = '#38bdf8';
              el.style.borderColor = '#38bdf8';
            } else {
              el.textContent = defaultStatusText;
              el.className = 'dest-card-status status-unlocked';
              el.style.color = '';
              el.style.borderColor = '';
            }
          }
        } else {
          // Locked
          if (card) {
            card.classList.add('dest-card-locked');
            card.style.opacity = '0.55';
            card.style.filter = 'grayscale(0.7)';
            card.style.cursor = 'not-allowed';

            let overlay = card.querySelector('.mission-padlock-overlay');
            if (!overlay) {
              overlay = document.createElement('div');
              overlay.className = 'mission-padlock-overlay';
              card.appendChild(overlay);
            }
            overlay.innerHTML = `
              <div class="mission-padlock-icon">🔒</div>
              <div class="mission-padlock-text">LOCKED: COMPLETE ${prevName}</div>
            `;
          }
          if (btn) {
            btn.textContent = '🔒 LOCKED';
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
            btn.setAttribute('disabled', 'true');
          }
          if (el) {
            el.textContent = `🔒 COMPLETE ${prevName} TO UNLOCK`;
            el.className = 'dest-card-status status-locked';
            el.style.color = '#f87171';
            el.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }
        }
      };

      const isM0Done = this.engine.save.isMissionCompleted('moon_m0');
      const bannerM0 = document.getElementById('btn-launch-moon-orbit');
      if (bannerM0) {
        if (isM0Done) {
          bannerM0.style.border = '2px solid rgba(74, 222, 128, 0.7)';
          const btn = bannerM0.querySelector('button');
          if (btn) {
            btn.textContent = '🏆 COMPLETED • RE-SCAN ORBIT ▶';
            btn.style.color = '#4ade80';
            btn.style.borderColor = '#4ade80';
          }
        } else {
          bannerM0.style.border = '2px solid #38bdf8';
          bannerM0.style.boxShadow = '0 0 25px rgba(56, 189, 248, 0.4)';
          const btn = bannerM0.querySelector('button');
          if (btn) {
            btn.textContent = '★ START HERE: SCAN FROM ORBIT ▶';
            btn.style.color = '#38bdf8';
            btn.style.borderColor = '#38bdf8';
          }
        }
      }

      updateCardLockState('card-moon-m1', 'btn-launch-moon-m1', 'status-moon-m1', moonUnlocks.m1, 'MISSION 0 (CUPOLA RECON)', 'WATER ICE DETECTED', moonSaved1, '🚜 DEPLOY ROVER TO SURFACE');
      updateCardLockState('card-moon-m2', 'btn-launch-moon-m2', 'status-moon-m2', moonUnlocks.m2, 'MISSION 1', 'HEAT ANOMALY (+32K)', moonSaved2, '🚜 DEPLOY ROVER TO SURFACE');
      updateCardLockState('card-moon-m3', 'btn-launch-moon-m3', 'status-moon-m3', moonUnlocks.m3, 'MISSION 2', '100% RADIATION SAFE', moonSaved3, '🚜 DEPLOY ROVER TO SURFACE');
      updateCardLockState('card-moon-m4', 'btn-launch-moon-m4', 'status-moon-m4', moonUnlocks.m4, 'MISSION 3', 'LCROSS 5.5 wt% H₂O', moonSaved4, '🚜 DEPLOY ROVER TO SURFACE');
      updateCardLockState('card-moon-m5', 'btn-launch-moon-m5', 'status-moon-m5', moonUnlocks.m5, 'MISSION 4', 'RADIO QUIET ZONE', moonSaved5, '🚜 DEPLOY ROVER TO SURFACE');

      // Mars Orbital Recon Hero Banner
      const bannerMarsM0 = document.getElementById('btn-launch-mars-orbit');
      if (bannerMarsM0) {
        if (isMarsM0Done) {
          bannerMarsM0.style.border = '2px solid rgba(74, 222, 128, 0.7)';
          bannerMarsM0.style.boxShadow = '0 0 25px rgba(74, 222, 128, 0.3)';
          const btn = bannerMarsM0.querySelector('button');
          if (btn) {
            btn.textContent = '🏆 COMPLETED • RE-SCAN ORBIT ▶';
            btn.style.color = '#4ade80';
            btn.style.borderColor = '#4ade80';
          }
        } else {
          bannerMarsM0.style.border = '2px solid #ff8c42';
          bannerMarsM0.style.boxShadow = '0 0 25px rgba(255, 140, 66, 0.4)';
          const btn = bannerMarsM0.querySelector('button');
          if (btn) {
            btn.textContent = '★ START HERE: SCAN FROM ORBIT ▶';
            btn.style.color = '#ff8c42';
            btn.style.borderColor = '#ff8c42';
          }
        }
      }

      // Mars Campaign Mission Locking: Mission 1 unlocks strictly after Mission 0
      const marsUnlocks = {
        m0: this.engine.save.isMissionUnlocked('mars_m0'),
        m1: this.engine.save.isMissionUnlocked('mars_m1')
      };

      updateCardLockState('card-mars-m1', 'btn-launch-mars-m1', 'status-mars-m1', marsUnlocks.m1, 'MISSION 0 (MARTIAN ORBIT)', 'RIVERBED CLAYS', marsSaved, '🚜 PLAY MISSION 1: JEZERO DELTA ▶');

      // Decorate tooltips for any newly visible badges
      if (this.engine.tooltip) {
        this.engine.tooltip.bindTooltips(document.getElementById('moon-mission-modal'));
      }
    } catch (e) {
      console.warn('[DestinationScene] Could not update progress badges:', e);
    }
  }

  _bindEvents() {
    const btnBack = document.getElementById('btn-dest-back');
    if (btnBack) {
      btnBack.onclick = () => {
        this.engine.audio.playUIClick();
        this.engine.setState('MAIN_MENU');
      };
    }

    const cardSandbox = document.getElementById('card-sandbox');
    if (cardSandbox) {
      cardSandbox.onclick = () => {
        this.engine.audio.playUIClick();
        this.engine.setState('SANDBOX');
      };
    }

    const cardMoon = document.getElementById('card-moon');
    if (cardMoon) {
      cardMoon.onclick = () => {
        this.engine.audio.playUIClick();
        this.engine.showPanel('moon-mission-modal');
        const backdrop = document.getElementById('panel-backdrop');
        if (backdrop) backdrop.classList.add('visible');
      };
    }

    const btnCloseMoon = document.getElementById('btn-close-moon-missions');
    if (btnCloseMoon) {
      btnCloseMoon.onclick = () => {
        this.engine.audio.playUIClick();
        this.engine.hidePanel('moon-mission-modal');
        const backdrop = document.getElementById('panel-backdrop');
        if (backdrop) backdrop.classList.remove('visible');
      };
    }

    const btnLaunchOrbit = document.getElementById('btn-launch-moon-orbit');
    if (btnLaunchOrbit) {
      btnLaunchOrbit.onclick = () => {
        this.engine.audio.playSuccess();
        this.engine.hidePanel('moon-mission-modal');
        const backdrop = document.getElementById('panel-backdrop');
        if (backdrop) backdrop.classList.remove('visible');
        this.engine.setState('MOON_ORBIT');
      };
    }

    const btnLaunchMarsOrbit = document.getElementById('btn-launch-mars-orbit');
    if (btnLaunchMarsOrbit) {
      btnLaunchMarsOrbit.onclick = () => {
        this.engine.audio.playSuccess();
        this.engine.hidePanel('mars-mission-modal');
        const backdrop = document.getElementById('panel-backdrop');
        if (backdrop) backdrop.classList.remove('visible');
        this.engine.setState('MARS_M0');
      };
    }

    // Attach click listeners with strict sequential mission locking
    const bindMoonLaunch = (cardId, btnId, stateName, missionId, prevLabel) => {
      const isMissionUnlocked = () => {
        return this.engine.save.isMissionUnlocked(missionId);
      };

      const launch = (e) => {
        if (e) e.stopPropagation();
        if (!isMissionUnlocked()) {
          this.engine.audio.playWarning();
          this.engine.showNotification(`🔒 Mission Locked: Complete ${prevLabel} first to unlock this theater!`, 'warning', 3200);
          return;
        }
        this.engine.audio.playSuccess();
        this.engine.hidePanel('moon-mission-modal');
        const backdrop = document.getElementById('panel-backdrop');
        if (backdrop) backdrop.classList.remove('visible');
        this.engine.setState(stateName);
      };

      const card = document.getElementById(cardId);
      if (card) {
        card.onclick = launch;
        card.onmouseenter = () => {
          if (isMissionUnlocked()) this.engine.audio.playUIHover();
        };
      }

      const btn = document.getElementById(btnId);
      if (btn) {
        btn.onclick = launch;
        btn.onmouseenter = () => {
          if (isMissionUnlocked()) this.engine.audio.playUIHover();
        };
      }
    };

    bindMoonLaunch('card-moon-m1', 'btn-launch-moon-m1', 'MOON_M1', 'moon_m1', 'Mission 0 (Cupola Reconnaissance)');
    bindMoonLaunch('card-moon-m2', 'btn-launch-moon-m2', 'MOON_M2', 'moon_m2', 'Mission 1 (South Pole)');
    bindMoonLaunch('card-moon-m3', 'btn-launch-moon-m3', 'MOON_M3', 'moon_m3', 'Mission 2 (Mare Imbrium)');
    bindMoonLaunch('card-moon-m4', 'btn-launch-moon-m4', 'MOON_M4', 'moon_m4', 'Mission 3 (Marius Hills)');
    bindMoonLaunch('card-moon-m5', 'btn-launch-moon-m5', 'MOON_M5', 'moon_m5', 'Mission 4 (Faustini Crater)');

    const cardMars = document.getElementById('card-mars');
    if (cardMars) {
      cardMars.onclick = () => {
        this.engine.audio.playUIClick();
        this.engine.showPanel('mars-mission-modal');
        const backdrop = document.getElementById('panel-backdrop');
        if (backdrop) backdrop.classList.add('visible');
      };
    }

    const btnCloseMars = document.getElementById('btn-close-mars-missions');
    if (btnCloseMars) {
      btnCloseMars.onclick = () => {
        this.engine.audio.playUIClick();
        this.engine.hidePanel('mars-mission-modal');
        const backdrop = document.getElementById('panel-backdrop');
        if (backdrop) backdrop.classList.remove('visible');
      };
    }

    const bindMarsLaunch = (cardId, btnId, stateKey, missionId, prevName) => {
      const card = document.getElementById(cardId);
      const btn = document.getElementById(btnId);
      const handler = (e) => {
        if (e) e.stopPropagation();
        if (!this.engine.save.isMissionUnlocked(missionId)) {
          this.engine.audio.playWarning();
          this.engine.showNotification(`🔒 Mission Locked: Complete ${prevName} first to unlock!`, 'warning', 3200);
          return;
        }
        this.engine.audio.playSuccess();
        this.engine.hidePanel('mars-mission-modal');
        const backdrop = document.getElementById('panel-backdrop');
        if (backdrop) backdrop.classList.remove('visible');
        this.engine.setState(stateKey);
      };
      if (btn) {
        btn.onclick = handler;
        btn.onmouseenter = () => {
          if (this.engine.save.isMissionUnlocked(missionId)) this.engine.audio.playUIHover();
        };
      }
      if (card) {
        card.onclick = handler;
        card.onmouseenter = () => {
          if (this.engine.save.isMissionUnlocked(missionId)) this.engine.audio.playUIHover();
        };
      }
    };

    bindMarsLaunch('card-mars-m1', 'btn-launch-mars-m1', 'MARS_M1', 'mars_m1', 'Mission 0 (Martian Orbit)');

    [cardSandbox, cardMoon, cardMars].forEach(card => {
      if (card) {
        card.onmouseenter = () => this.engine.audio.playUIHover();
      }
    });

    [btnBack, btnLaunchOrbit, btnLaunchMarsOrbit].forEach(btn => {
      if (btn) {
        btn.onmouseenter = () => this.engine.audio.playUIHover();
      }
    });
  }

  onExit() {
    this.engine.hidePanel('destination-panel');
    this.engine.hidePanel('moon-mission-modal');
    this.engine.hidePanel('mars-mission-modal');
    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) backdrop.classList.remove('visible');
  }

  update(dt) {
    if (this.earthMesh) this.earthMesh.rotation.y += 0.08 * dt;
    if (this.moonMesh) this.moonMesh.rotation.y += 0.05 * dt;
    if (this.marsMesh) this.marsMesh.rotation.y += 0.06 * dt;
    if (this.starfield) this.starfield.rotation.y += 0.003 * dt;
  }
}
