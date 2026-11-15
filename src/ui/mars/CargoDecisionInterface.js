import { storage } from '../../engine/StorageManager.js';
import { audio } from '../../engine/AudioManager.js';

export class CargoDecisionInterface {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.selectedOption = 'balanced';
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-cargo-decision';

    this.element.innerHTML = `
      <div class="modal-content cargo-modal">
        <div class="modal-header">
          <h2>📦 RETURN VEHICLE RESEARCH CARGO & PAYLOAD ALLOCATION</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="cargo-banner">
          <p><strong>Payload Mass Constraints:</strong> The Mars Ascent Vehicle (MAV) has a rigid return payload limit of <strong>400 kg</strong>. Every kilogram of rock samples brought to Earth reduces available capacity for backup life-support filters and emergency transit supplies.</p>
        </div>

        <div class="cargo-options-grid">
          <!-- OPTION 1: BALANCED (RECOMMENDED) -->
          <div class="cargo-card ${this.selectedOption === 'balanced' ? 'selected' : ''}" data-choice="balanced">
            <div class="c-badge badge-safe">BALANCED COMMANDER LOAD (RECOMMENDED)</div>
            <h3>Balanced Scientific & Operational Payload</h3>
            <div class="c-breakdown">
              <div>🪨 Core Samples: <strong>200 kg (14 Core Tubes)</strong></div>
              <div>🛠️ Life-Support Spares: <strong>120 kg (CO₂ Scrubber & O₂ Valves)</strong></div>
              <div>🥫 Emergency Rations: <strong>80 kg (30-day buffer)</strong></div>
            </div>
            <p class="c-desc">Strikes an ideal balance between high-priority Jezero river delta biosignature samples and redundant cabin safety margins during the 6-month Earth return transit.</p>
            <button class="btn btn-primary btn-block btn-select-cargo" data-pick="balanced">
              ${this.selectedOption === 'balanced' ? '✓ ALLOCATION SELECTED' : 'SELECT BALANCED LOAD'}
            </button>
          </div>

          <!-- OPTION 2: MAX SAMPLES -->
          <div class="cargo-card ${this.selectedOption === 'samples' ? 'selected' : ''}" data-choice="samples">
            <div class="c-badge badge-sci">MAXIMUM SCIENCE RETURN</div>
            <h3>Maximum Geological Sample Yield</h3>
            <div class="c-breakdown">
              <div>🪨 Core Samples: <strong>320 kg (Full Collection Cache)</strong></div>
              <div>🛠️ Life-Support Spares: <strong>50 kg (Minimal emergency kit)</strong></div>
              <div>🥫 Emergency Rations: <strong>30 kg (Minimal transit buffer)</strong></div>
            </div>
            <p class="c-desc">Maximizes scientific discovery on Earth, but leaves zero margin for spacecraft subsystem failures or flight delays. High operational risk.</p>
            <button class="btn btn-secondary btn-block btn-select-cargo" data-pick="samples">
              ${this.selectedOption === 'samples' ? '✓ ALLOCATION SELECTED' : 'SELECT MAX SCIENCE LOAD'}
            </button>
          </div>

          <!-- OPTION 3: MAX SAFETY -->
          <div class="cargo-card ${this.selectedOption === 'supplies' ? 'selected' : ''}" data-choice="supplies">
            <div class="c-badge badge-warn">CONSERVATIVE SAFETY MARGIN</div>
            <h3>Maximum Redundancy & Crew Protection</h3>
            <div class="c-breakdown">
              <div>🪨 Core Samples: <strong>100 kg (Top 6 Essential Cores)</strong></div>
              <div>🛠️ Life-Support Spares: <strong>200 kg (Full dual redundancy)</strong></div>
              <div>🥫 Emergency Rations: <strong>100 kg (Extended 60-day buffer)</strong></div>
            </div>
            <p class="c-desc">Guarantees maximum crew survival capability during transit complications. Some lower-priority rock samples are archived at the habitat for future missions.</p>
            <button class="btn btn-secondary btn-block btn-select-cargo" data-pick="supplies">
              ${this.selectedOption === 'supplies' ? '✓ ALLOCATION SELECTED' : 'SELECT MAX SAFETY LOAD'}
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-confirm-cargo">CONFIRM MAV CARGO MANIFEST</button>
          <button class="btn btn-secondary" data-close>CANCEL</button>
        </div>
      </div>
    `;

    // Events
    this.element.querySelectorAll('[data-close]').forEach((b) => {
      b.addEventListener('click', () => {
        audio.playClick();
        this.hide();
      });
    });

    this.element.querySelectorAll('.btn-select-cargo').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        audio.playClick();
        const choice = e.target.getAttribute('data-pick');
        this.selectOption(choice);
      });
    });

    this.element.querySelector('#btn-confirm-cargo').addEventListener('click', () => {
      audio.playClick();
      const weight = this.selectedOption === 'samples' ? 400 : this.selectedOption === 'supplies' ? 380 : 390;
      storage.setCargoAllocation(this.selectedOption, weight);
      this.uiManager.dialogueBox.showDialogue({
        characterId: 'alex',
        message: `MAV Cargo Manifest confirmed as [${this.selectedOption.toUpperCase()}]. Return vehicle payload is secured in the ascent module.`
      });
      this.hide();
    });
  }

  selectOption(choice) {
    this.selectedOption = choice;
    this.element.querySelectorAll('.cargo-card').forEach((card) => {
      const match = card.getAttribute('data-choice') === choice;
      card.classList.toggle('selected', match);
      card.querySelector('.btn-select-cargo').textContent = match ? '✓ ALLOCATION SELECTED' : 'SELECT THIS LOAD';
    });
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
