import { storage } from '../../engine/StorageManager.js';
import { audio } from '../../engine/AudioManager.js';

export class RadiationSafetyInterface {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.shelterDrillDone = false;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-rad-safety';

    this.element.innerHTML = `
      <div class="modal-content rad-modal">
        <div class="modal-header">
          <h2>☢️ RADIATION ASSESSMENT & SHELTER TRAINING CONSOLE</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="rad-banner">
          <p><strong>MSL RAD Ground Surface Telemetry (Gale Crater):</strong> Curiosity’s Radiation Assessment Detector recorded 1,731 quality-filtered observations during October 2026. Mars has no global magnetic field, exposing the surface to Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE).</p>
        </div>

        <div class="rad-channels-grid">
          <!-- CHANNEL 0 -->
          <div class="rad-channel-card">
            <span class="rad-badge">CHANNEL: Total Dose B</span>
            <h3>Total Dose B (Silicon Detector)</h3>
            <div class="rad-rate-val">187.58 <span>µGy/day</span></div>
            <p class="rad-desc">Total absorbed dose recorded in silicon solid-state detector, including cosmic rays and Curiosity's MMRTG power generator background.</p>
          </div>

          <!-- CHANNEL 1 -->
          <div class="rad-channel-card">
            <span class="rad-badge">CHANNEL: RTG-Corrected</span>
            <h3>RTG Corrected Dose B (Cosmic Only)</h3>
            <div class="rad-rate-val" style="color: var(--accent-cyan);">130.57 <span>µGy/day</span></div>
            <p class="rad-desc">MMRTG nuclear background subtracted. Represents the true natural space ionizing radiation reaching the Martian surface through the thin $CO_2$ atmosphere.</p>
          </div>

          <!-- CHANNEL 2 -->
          <div class="rad-channel-card">
            <span class="rad-badge">CHANNEL: Total Dose E</span>
            <h3>Total Dose E (Tissue-Equivalent Plastic)</h3>
            <div class="rad-rate-val" style="color: var(--accent-orange);">187.05 <span>µGy/day</span></div>
            <p class="rad-desc">Measured through polymer plastic engineered with hydrogen density matching human muscle tissue to simulate astronaut tissue absorption.</p>
          </div>
        </div>

        <!-- REGOLITH SHELTER SIMULATION -->
        <div class="shelter-drill-card">
          <div class="shelter-header">
            <h3>🛡️ Regolith-Shielded Radiation Bunker</h3>
            <span class="f-lbl">Formula: Exposure = Baseline × f_shelter</span>
          </div>
          <p>Earth's atmosphere provides the shielding equivalent of 10 meters of water. On Mars, piling 2.5 meters of local Martian dirt (regolith) over our habitat dome reduces incoming GCR cosmic rays and blocks lethal solar protons.</p>
          
          <div class="shelter-specs-row">
            <span>Regolith Overburden: <strong>2.8 meters</strong></span>
            <span>Shielding Factor (f_shelter): <strong>0.14 (86% Reduction)</strong></span>
            <span>Shelter Status: <strong>${this.shelterDrillDone ? 'DRILL COMPLETED' : 'DRILL REQUIRED'}</strong></span>
          </div>

          <button class="btn btn-primary btn-block btn-large" id="btn-execute-shelter-drill">
            ${this.shelterDrillDone ? '✓ SHELTER DRILL VERIFIED' : 'EXECUTE CREW SHELTER TRAINING DRILL'}
          </button>
        </div>

        <div class="mandatory-notice-box">
          ⚠️ <strong>Scientific Integrity Rules:</strong><br>
          1. MSL RAD data was recorded inside Gale Crater by Curiosity, not at Jezero.<br>
          2. Absorbed dose in micrograys ($\mu\text{Gy}$) is physical energy absorbed per kg. Biological dose equivalent in Sieverts ($\text{Sv}$) requires complex radiation quality weighting factors ($Q$).
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

    this.element.querySelector('#btn-execute-shelter-drill').addEventListener('click', () => {
      audio.playRadioChirp();
      this.shelterDrillDone = true;
      storage.state.marsState.shelterMaintained = true;
      storage.state.scoreBreakdown.safety = 1.0;
      storage.save();

      this.element.querySelector('#btn-execute-shelter-drill').textContent = '✓ SHELTER DRILL VERIFIED';
      this.element.querySelector('#btn-execute-shelter-drill').classList.add('btn-success');

      this.uiManager.dialogueBox.showDialogue({
        characterId: 'noah',
        message: 'Excellent drill execution, Commander! The entire crew reached the regolith storm bunker in under 90 seconds. Shelter readiness verified for high solar storm activity.'
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
