import { audio } from '../engine/AudioManager.js';

export class MainMenu {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'overlay-screen main-menu';
    this.element.innerHTML = `
      <div class="menu-container main-menu-wide">
        <!-- Header -->
        <div class="menu-header-block">
          <div class="game-badge">NASA SPACE APPS CHALLENGE • 2026 ASTRONAUT MISSION TRAINER</div>
          <h1 class="game-title">FRONTIER: MISSION ACADEMY</h1>
          <p class="game-subtitle">Explore the Moon and Mars with real NASA datasets. Make decisions like an astronaut!</p>
        </div>

        <!-- Equal Side-by-Side Campaigns Section -->
        <div class="campaign-dual-column">
          
          <!-- ================= LUNAR CAMPAIGN (MOON) ================= -->
          <div class="campaign-col moon-campaign-col">
            <div class="campaign-header moon-header">
              <div class="campaign-title-wrap">
                <span class="campaign-badge badge-moon">DESTINATION 1 • MOON</span>
                <h2 class="campaign-name">🌕 LUNAR EXPEDITION</h2>
                <div class="campaign-sub">Artemis South Pole & Thermal Science Bases (2 Missions)</div>
              </div>
            </div>

            <div class="missions-stack">
              <!-- Lunar Mission 01 -->
              <div class="mission-card" id="card-moon-m1">
                <div class="mission-card-image-wrap">
                  <img src="/assets/images/moon_mission_01.svg" alt="Lunar Mission 01 - Shackleton Rim" class="mission-card-img" />
                  <span class="mission-tag-pill pill-moon">MISSION 01</span>
                </div>
                <div class="mission-card-content">
                  <div class="mission-card-header">
                    <h3 class="mission-card-title">FIRST LIGHT: SHACKLETON RIM</h3>
                    <span class="mission-card-dest">South Pole • 89.9°S</span>
                  </div>
                  <div class="dataset-tags-row">
                    <span class="data-tag">LOLA 10m Topography</span>
                    <span class="data-tag">LEND Neutron Ice</span>
                  </div>
                  <p class="mission-card-desc">
                    Explore Shackleton crater's permanently shadowed regions (PSRs). Navigate rugged polar ridges and detect buried hydrogen volatiles for human outpost water supply.
                  </p>
                  <div class="mission-card-btn-group">
                    <button id="btn-play-moon-m1" class="btn btn-primary btn-card-action">
                      <span class="btn-icon">▶</span> PLAY MISSION
                    </button>
                    <button id="btn-brief-moon-m1" class="btn btn-secondary btn-card-action">
                      <span class="btn-icon">📋</span> BRIEFING
                    </button>
                  </div>
                </div>
              </div>

              <!-- Lunar Mission 02 -->
              <div class="mission-card" id="card-moon-m2">
                <div class="mission-card-image-wrap">
                  <img src="/assets/images/moon_mission_02.svg" alt="Lunar Mission 02 - Mare Imbrium" class="mission-card-img" />
                  <span class="mission-tag-pill pill-moon">MISSION 02</span>
                </div>
                <div class="mission-card-content">
                  <div class="mission-card-header">
                    <h3 class="mission-card-title">SHADOW WATCH: THERMAL FRONTIER</h3>
                    <span class="mission-card-dest">Mare Imbrium • Cold Trap Basin</span>
                  </div>
                  <div class="dataset-tags-row">
                    <span class="data-tag">Diviner Radiometer</span>
                    <span class="data-tag">Rock Abundance</span>
                  </div>
                  <p class="mission-card-desc">
                    Face severe thermal swings from +120°C sunlit plains to -180°C deep cold traps. Manage equipment radiators, drill regolith cores, and measure thermal inertia.
                  </p>
                  <div class="mission-card-btn-group">
                    <button id="btn-play-moon-m2" class="btn btn-primary btn-card-action">
                      <span class="btn-icon">▶</span> PLAY MISSION
                    </button>
                    <button id="btn-brief-moon-m2" class="btn btn-secondary btn-card-action">
                      <span class="btn-icon">📋</span> BRIEFING
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ================= MARS CAMPAIGN (MARS) ================= -->
          <div class="campaign-col mars-campaign-col">
            <div class="campaign-header mars-header">
              <div class="campaign-title-wrap">
                <span class="campaign-badge badge-mars">DESTINATION 2 • MARS</span>
                <h2 class="campaign-name">🪐 MARTIAN EXPEDITION</h2>
                <div class="campaign-sub">Jezero Crater Outpost & Return Flight (2 Missions)</div>
              </div>
            </div>

            <div class="missions-stack">
              <!-- Mars Mission M01 -->
              <div class="mission-card" id="card-mars-m1">
                <div class="mission-card-image-wrap">
                  <img src="/assets/images/mars_mission_m01.svg" alt="Mars Mission M01 - Life on Mars" class="mission-card-img" />
                  <span class="mission-tag-pill pill-mars">MISSION M01</span>
                </div>
                <div class="mission-card-content">
                  <div class="mission-card-header">
                    <h3 class="mission-card-title">LIFE ON MARS: BUILD A HOME</h3>
                    <span class="mission-card-dest">Jezero Crater • 18.4°N, 77.5°E</span>
                  </div>
                  <div class="dataset-tags-row">
                    <span class="data-tag">SWIM Radar Ice</span>
                    <span class="data-tag">MEDA Weather</span>
                    <span class="data-tag">MSL RAD Safety</span>
                  </div>
                  <p class="mission-card-desc">
                    Establish a self-sufficient outpost. Drill for glacial ice with SWIM radar, cultivate greenhouse hydroponics, balance oxygen loops, and shelter from solar radiation.
                  </p>
                  <div class="mission-card-btn-group">
                    <button id="btn-play-mars-m1" class="btn btn-primary btn-card-action btn-mars-primary">
                      <span class="btn-icon">▶</span> PLAY MISSION
                    </button>
                    <button id="btn-brief-mars-m1" class="btn btn-secondary btn-card-action">
                      <span class="btn-icon">📋</span> BRIEFING
                    </button>
                  </div>
                </div>
              </div>

              <!-- Mars Mission M02 -->
              <div class="mission-card" id="card-mars-m2">
                <div class="mission-card-image-wrap">
                  <img src="/assets/images/mars_mission_m02.svg" alt="Mars Mission M02 - The Journey Home" class="mission-card-img" />
                  <span class="mission-tag-pill pill-mars">MISSION M02</span>
                </div>
                <div class="mission-card-content">
                  <div class="mission-card-header">
                    <h3 class="mission-card-title">THE JOURNEY HOME: EARTH RETURN</h3>
                    <span class="mission-card-dest">Jezero Launch Complex • Ascent Pad</span>
                  </div>
                  <div class="dataset-tags-row">
                    <span class="data-tag">MAV Cargo Allocator</span>
                    <span class="data-tag">10-Point Checklist</span>
                  </div>
                  <p class="mission-card-desc">
                    Your final mission is to bring everyone back safely. Balance the 400 kg MAV cargo limit between science rock samples and life support, then execute the ascent checklist.
                  </p>
                  <div class="mission-card-btn-group">
                    <button id="btn-play-mars-m2" class="btn btn-primary btn-card-action btn-mars-primary">
                      <span class="btn-icon">▶</span> PLAY MISSION
                    </button>
                    <button id="btn-brief-mars-m2" class="btn btn-secondary btn-card-action">
                      <span class="btn-icon">📋</span> BRIEFING
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Quick Access Science Tools Bar -->
        <div class="menu-tools-bar">
          <div class="tools-bar-label">🚀 MISSION PLANNING & SCIENTIFIC DATA TOOLS</div>
          <div class="tools-btn-grid">
            <button id="btn-open-map" class="btn btn-secondary btn-tool">
              <span class="btn-icon">🗺️</span> SCIENCE MAP & GIS ATLAS
            </button>
            <button id="btn-open-route" class="btn btn-secondary btn-tool">
              <span class="btn-icon">🧭</span> ROVER ROUTE PLANNER
            </button>
            <button id="btn-open-alert" class="btn btn-secondary btn-tool">
              <span class="btn-icon">🚨</span> SPACE WEATHER (DONKI)
            </button>
            <button id="btn-crew" class="btn btn-secondary btn-tool">
              <span class="btn-icon">👨‍🚀</span> CREW DOSSIERS
            </button>
            <button id="btn-science" class="btn btn-secondary btn-tool">
              <span class="btn-icon">🔬</span> SCIENCE DATABASE
            </button>
            <button id="btn-prov" class="btn btn-secondary btn-tool">
              <span class="btn-icon">📋</span> DATA PROVENANCE
            </button>
            <button id="btn-settings" class="btn btn-secondary btn-tool">
              <span class="btn-icon">⚙️</span> SETTINGS
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="menu-footer">
          <span>Target Audience: Junior Astronauts (Ages 7–12)</span>
          <span>•</span>
          <span>Browser-First • Guest Mode (Zero Login Required)</span>
          <span>•</span>
          <span>Verified NASA Datasets: LOLA, LEND, DIVINER, SWIM, MEDA, MSL RAD</span>
        </div>
      </div>
    `;

    // Bind Event Listeners
    // Moon Missions
    this.element.querySelector('#btn-play-moon-m1').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.startMoonMission('moon_m01');
    });

    this.element.querySelector('#btn-brief-moon-m1').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.missionBriefingModal.showMission('moon_m01');
    });

    this.element.querySelector('#btn-play-moon-m2').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.startMoonMission('moon_m02');
    });

    this.element.querySelector('#btn-brief-moon-m2').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.missionBriefingModal.showMission('moon_m02');
    });

    // Mars Missions
    this.element.querySelector('#btn-play-mars-m1').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.startMarsMission('M01');
    });

    this.element.querySelector('#btn-brief-mars-m1').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.missionBriefingModal.showMission('mars_m01');
    });

    this.element.querySelector('#btn-play-mars-m2').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.startMarsMission('M02');
    });

    this.element.querySelector('#btn-brief-mars-m2').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.missionBriefingModal.showMission('mars_m02');
    });

    // Science Tools
    this.element.querySelector('#btn-open-map').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.scienceMapViewer.show();
    });

    this.element.querySelector('#btn-open-route').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.roverRoutePlanner.show();
    });

    this.element.querySelector('#btn-open-alert').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.missionAlertModal.show();
    });

    this.element.querySelector('#btn-crew').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.openModal('crew');
    });

    this.element.querySelector('#btn-science').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.openModal('science');
    });

    this.element.querySelector('#btn-prov').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.datasetInfoModal.show('lola');
    });

    this.element.querySelector('#btn-settings').addEventListener('click', () => {
      audio.playClick();
      this.uiManager.openModal('settings');
    });
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
