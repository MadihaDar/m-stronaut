import { DATA_TYPES } from '../data/scienceData.js';
import { storage } from '../engine/StorageManager.js';
import { audio } from '../engine/AudioManager.js';

export class ScannerPanel {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.currentTarget = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-scanner';

    this.element.innerHTML = `
      <div class="modal-content scanner-modal">
        <div class="scanner-header">
          <div class="scanner-status">
            <span class="scan-pulse"></span>
            <span>SCIENCE FIELD SCANNER • ACTIVE TELEMETRY</span>
          </div>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="scanner-body" id="scanner-content">
          <!-- Injected dynamically on open -->
        </div>

        <div class="scanner-footer">
          <button class="btn btn-primary btn-large" id="btn-record-finding">
            📝 RECORD FINDING IN FIELD LOG
          </button>
          <button class="btn btn-secondary" data-close>CLOSE SCANNER</button>
        </div>
      </div>
    `;

    // Event listeners
    this.element.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.hide();
      });
    });

    this.element.querySelector('#btn-record-finding').addEventListener('click', () => {
      if (this.currentTarget && this.currentTarget.data) {
        audio.playDiscovery();
        const findingId = this.currentTarget.data.id;
        const isNew = storage.recordFinding(findingId);
        this.currentTarget.setRecorded(true);

        const btn = this.element.querySelector('#btn-record-finding');
        btn.textContent = '✓ FINDING LOGGED IN SCIENCE NOTEBOOK!';
        btn.classList.add('btn-success');
        btn.disabled = true;

        // Show ORBIT celebration dialogue
        this.uiManager.dialogueBox.showDialogue({
          characterId: 'orbit',
          title: 'Science Telemetry Confirmed!',
          message: `Beep-boop! Excellent observation, Commander! Observation logged into the Academy database: "${this.currentTarget.data.title}".`
        });
      }
    });
  }

  openWithTarget(target) {
    this.currentTarget = target;
    const d = target.data;
    const typeInfo = DATA_TYPES[d.dataType] || DATA_TYPES.MEASURED;
    const isCollected = storage.isFindingCollected(d.id);

    audio.playScan();

    const body = this.element.querySelector('#scanner-content');
    body.innerHTML = `
      <div class="scanner-grid">
        <!-- Hologram Visual Area -->
        <div class="scan-visual-card">
          <div class="scan-reticle">
            <div class="scan-radar-sweep"></div>
            <span class="scan-icon">📡</span>
          </div>
          <div class="scan-instrument-tag">${d.instrument}</div>
          <div class="scan-planet-tag">${d.planet} Outpost</div>
        </div>

        <!-- Telemetry Details -->
        <div class="scan-details-card">
          <span class="type-pill" style="background: ${typeInfo.color}22; color: ${typeInfo.color}; border: 1px solid ${typeInfo.color};">
            ${typeInfo.badge}
          </span>
          <h2 class="scan-title">${d.title}</h2>

          <div class="data-breakdown-box">
            <div class="box-row">
              <span class="box-label">📡 Measured Telemetry:</span>
              <p class="box-val">${d.measuredData}</p>
            </div>
            <div class="box-row">
              <span class="box-label">🧮 Calculated Physics:</span>
              <p class="box-val">${d.calculatedValue}</p>
            </div>
          </div>

          <div class="kid-concept-box">
            <div class="concept-header">💡 Junior Astronaut Concept (Ages 7–12):</div>
            <p class="concept-text">${d.simplifiedExplanation}</p>
          </div>

          <div class="tip-box">
            ⭐ <strong>Mission Importance:</strong> ${d.kidTip}
          </div>
        </div>
      </div>
    `;

    const btn = this.element.querySelector('#btn-record-finding');
    if (isCollected) {
      btn.textContent = '✓ ALREADY LOGGED IN FIELD NOTEBOOK';
      btn.classList.add('btn-success');
      btn.disabled = true;
    } else {
      btn.textContent = '📝 RECORD FINDING IN FIELD LOG';
      btn.classList.remove('btn-success');
      btn.disabled = false;
    }

    this.show();
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
    this.currentTarget = null;
  }
}
