import { MOON_MISSIONS } from '../data/missions.js';
import { MARS_MISSIONS_DATA } from '../data/marsMissions.js';
import { storage } from '../engine/StorageManager.js';
import { audio } from '../engine/AudioManager.js';

export class CampaignMapModal {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.activeTab = storage.state.selectedDestination || 'mars';
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-campaign-map';

    this.element.innerHTML = `
      <div class="modal-content campaign-modal">
        <div class="modal-header">
          <h2>🎯 CAMPAIGN & MISSION SELECTION</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="campaign-nav-tabs">
          <button class="camp-tab-btn ${this.activeTab === 'mars' ? 'active' : ''}" data-camp="mars">
            🪐 MARS EXPEDITION (CONNECTED MISSIONS M01 & M02)
          </button>
          <button class="camp-tab-btn ${this.activeTab === 'moon' ? 'active' : ''}" data-camp="moon">
            🌕 MOON CAMPAIGN (FIRST LIGHT & SHADOW WATCH)
          </button>
        </div>

        <div class="campaign-missions-container" id="campaign-missions-view">
          ${this.renderMissionsHtml(this.activeTab)}
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" data-close>CLOSE</button>
        </div>
      </div>
    `;

    // Events
    this.element.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.hide();
      });
    });

    this.element.querySelectorAll('.camp-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.element.querySelectorAll('.camp-tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.getAttribute('data-camp');
        this.updateView();
      });
    });
  }

  updateView() {
    const view = this.element.querySelector('#campaign-missions-view');
    view.innerHTML = this.renderMissionsHtml(this.activeTab);
    this.bindMissionButtons();
  }

  renderMissionsHtml(camp) {
    if (camp === 'mars') {
      const m01 = MARS_MISSIONS_DATA.m01;
      const m02 = MARS_MISSIONS_DATA.m02;
      const m01Done = storage.state.marsState.m01Completed;

      return `
        <div class="campaign-banner mars-banner">
          <div class="camp-tag mars-tag">MARS EXPEDITION • JEZERO CRATER OUTPOST</div>
          <p>Two connected missions sharing the same base, rover, life-support loops, and persistent decision consequences. Verified NASA science from MRO SWIM, Mars 2020 MEDA, MSL RAD, MRO MCS, and DONKI.</p>
        </div>

        <div class="missions-list">
          <!-- MISSION M01 -->
          <div class="mission-card" style="border-left: 5px solid var(--accent-orange);">
            <div class="m-card-top">
              <span class="m-num mars-tag">MISSION ${m01.code}</span>
              <span class="m-dur">⏱️ ${m01.duration}</span>
            </div>
            <h3>${m01.title}</h3>
            <p class="m-sub">${m01.subtitle}</p>
            <p class="m-desc">${m01.briefing}</p>
            <div class="m-layers-tag" style="color: #fdba74;">
              🛰️ Verified Science: MRO SWIM Ice Consistency • MEDA Sol 1553 Weather • MSL RAD Dosimetry • MRO MCS Profiles
            </div>
            <button class="btn btn-primary btn-block btn-open-mars-m1">
              ${m01Done ? 'REPLAY MISSION M01: LIFE ON MARS' : 'COMMENCE MISSION M01: LIFE ON MARS'}
            </button>
          </div>

          <!-- MISSION M02 -->
          <div class="mission-card" style="border-left: 5px solid #ef4444;">
            <div class="m-card-top">
              <span class="m-num" style="color: #fca5a5;">MISSION ${m02.code}</span>
              <span class="m-dur">⏱️ ${m02.duration}</span>
            </div>
            <h3>${m02.title}</h3>
            <p class="m-sub">${m02.subtitle}</p>
            <p class="m-desc">${m02.briefing}</p>
            <div class="status-pill-mars">
              💾 Persistent Connection: Loads your saved consumables, cargo allocation, and shelter readiness from Mission M01.
            </div>
            <button class="btn ${m01Done ? 'btn-primary' : 'btn-secondary'} btn-block btn-open-mars-m2">
              COMMENCE MISSION M02: THE JOURNEY HOME
            </button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="campaign-banner moon-banner">
          <div class="camp-tag">LUNAR FRONTIER • NASA LRO VERIFIED SCOPE</div>
          <p>Two connected missions utilizing real South-Polar LOLA altimetry, LEND neutron spectra, Robbins crater catalogues, Diviner GCP thermal tables, GHRM mapping, and Diviner Rock Abundance.</p>
        </div>
        <div class="missions-list">
          ${MOON_MISSIONS.map((m) => `
            <div class="mission-card" style="border-left: 5px solid var(--accent-cyan);">
              <div class="m-card-top">
                <span class="m-num">MISSION ${m.number}</span>
                <span class="m-dur">⏱️ ${m.duration}</span>
              </div>
              <h3>${m.title}</h3>
              <p class="m-sub">${m.subtitle}</p>
              <p class="m-desc">${m.briefing}</p>
              <div class="m-layers-tag">
                🛰️ Verified Datasets: ${m.availableData.join(' • ')}
              </div>
              <button class="btn btn-primary btn-block btn-open-briefing" data-mission="${m.id}">
                COMMENCE ${m.title.split(' — ')[1] || m.title}
              </button>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  bindMissionButtons() {
    const btnM1 = this.element.querySelector('.btn-open-mars-m1');
    if (btnM1) {
      btnM1.addEventListener('click', () => {
        audio.playClick();
        this.hide();
        this.uiManager.startMarsMission('M01');
      });
    }

    const btnM2 = this.element.querySelector('.btn-open-mars-m2');
    if (btnM2) {
      btnM2.addEventListener('click', () => {
        audio.playClick();
        this.hide();
        this.uiManager.startMarsMission('M02');
      });
    }

    this.element.querySelectorAll('.btn-open-briefing').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        audio.playClick();
        const mId = e.currentTarget.getAttribute('data-mission');
        this.hide();
        this.uiManager.missionBriefingModal.showMission(mId);
      });
    });
  }

  show(tab = 'mars') {
    this.activeTab = tab;
    this.element.querySelectorAll('.camp-tab-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-camp') === tab);
    });
    this.updateView();
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
