import { ScoringSystem } from '../engine/ScoringSystem.js';
import { storage } from '../engine/StorageManager.js';
import { audio } from '../engine/AudioManager.js';

export class MissionDebriefModal {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-debrief';

    this.element.innerHTML = `
      <div class="modal-content debrief-modal">
        <div class="modal-header">
          <h2>🏆 EXPEDITION DEBRIEF & COMMANDER CERTIFICATION</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="debrief-content" id="debrief-content-view">
          <!-- Dynamic injected score & certificate -->
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-debrief-done">RETURN TO MISSION ACADEMY</button>
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

    this.element.querySelector('#btn-debrief-done').addEventListener('click', () => {
      audio.playClick();
      this.hide();
      this.uiManager.openMainMenu();
    });
  }

  show() {
    audio.playDiscovery();
    const scoreRes = ScoringSystem.calculate(storage.state.scoreBreakdown);
    const findingsCount = (storage.state.collectedFindings || []).length;

    const container = this.element.querySelector('#debrief-content-view');
    container.innerHTML = `
      <div class="certificate-frame">
        <div class="cert-gold-border">
          <div class="cert-header">
            <span class="cert-emblem">🌕</span>
            <h3>LUNAR FRONTIER: MISSION ACADEMY</h3>
            <p class="cert-sub">OFFICIAL JUNIOR COMMANDER CERTIFICATION</p>
          </div>

          <div class="cert-body">
            <p class="cert-text">This certifies that</p>
            <h2 class="cert-name">JUNIOR ASTRONAUT COMMANDER</h2>
            <p class="cert-text">
              has successfully analyzed verified NASA Lunar Reconnaissance Orbiter (LRO) datasets,
              executed rover navigation across South-Polar terrain, verified hydrogen neutron suppression,
              and upheld strict crew safety protocols during active space-weather events.
            </p>

            <div class="cert-metrics-row">
              <div class="c-metric">
                <span class="cm-lbl">Final Score</span>
                <span class="cm-val">${scoreRes.totalScore} / 100</span>
              </div>
              <div class="c-metric">
                <span class="cm-lbl">Commander Rank</span>
                <span class="cm-val rank-val">${scoreRes.grade}</span>
              </div>
              <div class="c-metric">
                <span class="cm-lbl">Science Discoveries</span>
                <span class="cm-val">${findingsCount} Logged</span>
              </div>
            </div>

            <div class="cert-signatures">
              <div class="sig-block">
                <span class="sig-name">Alex Morgan</span>
                <span class="sig-title">Mission Commander</span>
              </div>
              <div class="sig-block">
                <span class="sig-name">ORBIT v3.4</span>
                <span class="sig-title">Academy Science AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="score-breakdown-panel">
        <h4>📊 Evaluation Breakdown:</h4>
        <div class="eval-grid">
          <div class="eval-item"><span>🛡️ Crew Safety (30% Hard Gate):</span><strong>${scoreRes.breakdown.safety}%</strong></div>
          <div class="eval-item"><span>🧭 Navigation Efficiency (20%):</span><strong>${scoreRes.breakdown.navigation}%</strong></div>
          <div class="eval-item"><span>⚡ Resource Management (20%):</span><strong>${scoreRes.breakdown.resource}%</strong></div>
          <div class="eval-item"><span>🔬 Science Observation Quality (15%):</span><strong>${scoreRes.breakdown.science}%</strong></div>
          <div class="eval-item"><span>🚨 Alert Response Quality (10%):</span><strong>${scoreRes.breakdown.alert_response}%</strong></div>
          <div class="eval-item"><span>🤝 Crew Teamwork (5%):</span><strong>${scoreRes.breakdown.teamwork}%</strong></div>
        </div>
      </div>
    `;

    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
