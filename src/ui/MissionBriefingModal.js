import { MOON_MISSIONS, MARS_TEMPLATE_MISSIONS } from '../data/missions.js';
import { audio } from '../engine/AudioManager.js';

export class MissionBriefingModal {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.currentMission = MOON_MISSIONS[0];
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-mission-briefing';

    this.element.innerHTML = `
      <div class="modal-content briefing-modal">
        <div class="modal-header">
          <div class="briefing-tag">MISSION BRIEFING • LEVEL CADET TO COMMANDER</div>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="briefing-body" id="briefing-dynamic-content">
          <!-- Injected via showMission() -->
        </div>

        <div class="briefing-controls-tutorial">
          <div class="tut-title">🎮 Junior Astronaut Controls:</div>
          <div class="tut-grid">
            <div class="tut-item"><span>⌨️ Desktop:</span> WASD / Arrow Keys to Move | [V] Drive Rover | [E] Scan Target | [Space] Jump</div>
            <div class="tut-item"><span>📱 Mobile/Tablet:</span> Virtual Joystick on left | Touch Buttons on right for [SCAN], [ROVER], [JUMP]</div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary btn-large btn-block" id="btn-launch-expedition">
            🚀 COMMENCE EXPEDITION
          </button>
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

    this.element.querySelector('#btn-launch-expedition').addEventListener('click', () => {
      audio.playClick();
      this.hide();
      this.uiManager.startMission(this.currentMission ? this.currentMission.id : 'moon_m01');
    });
  }

  showMission(missionId = 'moon_m01') {
    const allMissions = [...MOON_MISSIONS, ...MARS_TEMPLATE_MISSIONS];
    this.currentMission = allMissions.find((m) => m.id === missionId) || MOON_MISSIONS[0];
    const m = this.currentMission;

    const container = this.element.querySelector('#briefing-dynamic-content');
    container.innerHTML = `
      <div class="briefing-title-card">
        <h2>${m.title}</h2>
        <p class="b-sub">${m.subtitle} • Duration: ${m.duration}</p>
      </div>

      <div class="b-section">
        <h3>🎯 Mission Directive:</h3>
        <p class="b-text">${m.briefing}</p>
      </div>

      <div class="b-grid">
        <div class="b-card">
          <h4>🛰️ Verified Science Data Layers:</h4>
          <ul>
            ${m.availableData.map((d) => `<li>✓ ${d}</li>`).join('')}
          </ul>
        </div>
        <div class="b-card">
          <h4>👨‍🚀 Operational Crew:</h4>
          <ul>
            ${m.leadCrew.map((c) => `<li>• ${c}</li>`).join('')}
          </ul>
        </div>
      </div>

      ${
        m.days
          ? `
        <div class="b-timeline">
          <h4>📅 Operational Timeline:</h4>
          <div class="timeline-steps">
            ${m.days
              .map(
                (d) => `
              <div class="t-step">
                <span class="step-badge">Day ${d.day}</span>
                <span class="step-title">${d.title.split(': ')[1] || d.title}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }
    `;

    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
