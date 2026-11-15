import { storage } from '../../engine/StorageManager.js';
import { audio } from '../../engine/AudioManager.js';

export class WaterInvestigationInterface {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.selectedDepth = '1_5';
    this.isDrilling = false;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-water-investigation';

    this.element.innerHTML = `
      <div class="modal-content water-modal">
        <div class="modal-header">
          <h2>💧 MRO SWIM REGIONAL WATER-ICE INVESTIGATION</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="swim-info-banner">
          <p><strong>Subsurface Water Ice Mapping (SWIM):</strong> Synthesizes SHARAD radar dielectric reflections, neutron spectroscopy, and thermal inertia to evaluate subsurface ice consistency across depth zones.</p>
        </div>

        <div class="swim-layers-grid">
          <!-- 0-1m LAYER -->
          <div class="swim-layer-card ${this.selectedDepth === '0_1' ? 'selected' : ''}" data-depth="0_1">
            <div class="depth-badge">SHALLOW DEPTH (0–1 m)</div>
            <h4>Layer: SWIM4MIM_Ci_0_1.tif</h4>
            <div class="ci-metric">
              <span class="ci-lbl">Jezero Regional Value:</span>
              <strong class="ci-val" style="color: #ef4444;">-0.1906</strong>
            </div>
            <p class="ci-desc">Negative consistency value. Thermal & geomorphological models indicate dry desiccated regolith in top 1 meter due to atmospheric sublimation.</p>
          </div>

          <!-- 1-5m LAYER -->
          <div class="swim-layer-card ${this.selectedDepth === '1_5' ? 'selected' : ''}" data-depth="1_5">
            <div class="depth-badge">INTERMEDIATE DEPTH (1–5 m)</div>
            <h4>Layer: SWIM4MIM_Ci_1_5.tif</h4>
            <div class="ci-metric">
              <span class="ci-lbl">Jezero Regional Value:</span>
              <strong class="ci-val" style="color: var(--accent-cyan);">0.0000</strong>
            </div>
            <p class="ci-desc">Neutral consistency (0.0). Does NOT prove ice is absent; indicates radar echo returns are at detection threshold. Candidate for deep exploration drilling.</p>
          </div>

          <!-- >5m LAYER -->
          <div class="swim-layer-card ${this.selectedDepth === '5_plus' ? 'selected' : ''}" data-depth="5_plus">
            <div class="depth-badge">DEEP CRUST (&gt;5 m)</div>
            <h4>Layer: SWIM4MIM_Ci_5.tif</h4>
            <div class="ci-metric">
              <span class="ci-lbl">Jezero Regional Value:</span>
              <strong class="ci-val" style="color: #94a3b8;">0.0000</strong>
            </div>
            <p class="ci-desc">Deep radar dielectric soundings show consolidated basalt and delta sediments. Requires heavy industrial drilling rigs.</p>
          </div>
        </div>

        <!-- DRILL EXTRACTION SIMULATION -->
        <div class="drill-station-card">
          <div class="drill-header">
            <h3>⛏️ Autonomous Subsurface Drill & Extraction Unit</h3>
            <span class="f-lbl">Formula: W_extracted = R_drill × t × f_game</span>
          </div>
          <p>Our autonomous rotary-percussive drill probe penetrates through the surface regolith into the intermediate 1–5 meter zone. Thermal sublimation melts locked ice into clean water vapor for the recovery condenser.</p>
          
          <div class="drill-status-row">
            <span>Drill Depth: <strong>3.2 meters</strong></span>
            <span>Simulated Yield: <strong>+12.4 Liters / Sol</strong></span>
            <span class="drill-indicator ${this.isDrilling ? 'drill-active' : ''}">
              ${this.isDrilling ? 'DRILL EXTRACTING...' : 'DRILL READY'}
            </span>
          </div>

          <button class="btn btn-primary btn-block btn-large" id="btn-activate-drill">
            ${this.isDrilling ? '✓ EXTRACTION PROBE OPERATIONAL' : 'ACTIVATE ICE EXTRACTION PROBE'}
          </button>
        </div>

        <div class="mandatory-notice-box">
          ⚠️ <strong>Scientific Data Integrity Rule:</strong> The SWIM values (-0.1906, 0.0) are regional remote-sensing consistency scores, NOT guaranteed litres of water. In-situ extraction is simulated as an educational game mechanic.
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" data-close>CLOSE</button>
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

    this.element.querySelectorAll('.swim-layer-card').forEach((card) => {
      card.addEventListener('click', () => {
        audio.playClick();
        this.selectedDepth = card.getAttribute('data-depth');
        this.element.querySelectorAll('.swim-layer-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });

    this.element.querySelector('#btn-activate-drill').addEventListener('click', () => {
      audio.playScan();
      this.isDrilling = true;
      storage.updateMarsResource('water', Math.min(100, storage.state.marsState.water + 8));
      storage.state.scoreBreakdown.science = Math.min(1.0, storage.state.scoreBreakdown.science + 0.15);
      storage.state.scoreBreakdown.resource = Math.min(1.0, storage.state.scoreBreakdown.resource + 0.15);
      storage.save();

      this.element.querySelector('#btn-activate-drill').textContent = '✓ EXTRACTION PROBE OPERATIONAL';
      this.element.querySelector('#btn-activate-drill').classList.add('btn-success');

      this.uiManager.dialogueBox.showDialogue({
        characterId: 'maya',
        message: 'Telemetry confirmed, Commander! The drill has penetrated to 3.2 meters. Subsurface water vapor is flowing into our recovery condenser!'
      });
    });
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
