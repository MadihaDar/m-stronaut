import { storage } from '../engine/StorageManager.js';
import { audio } from '../engine/AudioManager.js';

export class MissionAlertModal {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-mission-alert';

    this.element.innerHTML = `
      <div class="modal-content alert-modal">
        <div class="alert-banner-header">
          <span class="alert-icon-anim">🚨</span>
          <div>
            <h2>MISSION CRITICAL ALERT: SPACE WEATHER PROTOCOL</h2>
            <p class="alert-sub">NASA DONKI Satellite Warning • Active Eruptive Solar Flare</p>
          </div>
        </div>

        <div class="alert-telemetry-box">
          <div class="alert-meta-grid">
            <div class="meta-item">
              <span class="m-lbl">Detected Event:</span>
              <strong style="color: #fca5a5;">AR 14546 B9.3 Eruptive Solar Flare</strong>
            </div>
            <div class="meta-item">
              <span class="m-lbl">Source Telemetry:</span>
              <span>NASA DONKI Space Weather Database (October 2026)</span>
            </div>
            <div class="meta-item">
              <span class="m-lbl">Associated Phenomenon:</span>
              <span>Coronal Mass Ejection (CME) Directed Plasma Front</span>
            </div>
            <div class="meta-item">
              <span class="m-lbl">Warning Transit Window:</span>
              <strong style="color: var(--accent-cyan);">~1.5 Hours to High Proton Flux Arrival</strong>
            </div>
          </div>

          <div class="alert-integrity-note">
            ⚠️ <strong>Scientific Integrity Notice:</strong> This mission event is a fictional training simulation inspired by real NASA DONKI metadata. Space weather flare records provide solar activity context, but do not directly calculate human biological dose rates without secondary shielding models.
          </div>
        </div>

        <div class="alert-decision-container">
          <h3>👨‍🚀 Commander Decision Required:</h3>
          <p>The Moon has zero atmosphere and no global magnetic shield. High-energy solar protons pose a severe health hazard to unshielded astronauts on EVA.</p>

          <div class="decision-cards">
            <!-- OPTION A: CONSERVATIVE & SAFE -->
            <div class="decision-card safe-choice" id="choice-safe">
              <div class="choice-title">
                <span>🛡️ PROTOCOL ALPHA: ABORT EVA & SHELTER (RECOMMENDED)</span>
                <span class="tag-rec">SAFETY FIRST</span>
              </div>
              <p>Immediately order all crew into the regolith-shielded outpost habitat. Power down external rover communications and activate magnetic storm shielding.</p>
              <button class="btn btn-primary btn-block" id="btn-choice-safe">EXECUTE PROTOCOL ALPHA</button>
            </div>

            <!-- OPTION B: RISKY -->
            <div class="decision-card risk-choice" id="choice-risk">
              <div class="choice-title">
                <span>⚠️ PROTOCOL BETA: ATTEMPT TO FINISH SAMPLING FIRST</span>
                <span class="tag-risk">HIGH HAZARD</span>
              </div>
              <p>Stay outside for an extra 45 minutes to drill one more rock core sample before driving back to the habitat.</p>
              <button class="btn btn-danger btn-block" id="btn-choice-risk">EXECUTE PROTOCOL BETA</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind choices
    this.element.querySelector('#btn-choice-safe').addEventListener('click', () => {
      audio.playClick();
      storage.state.scoreBreakdown.safety = 1.0;
      storage.state.scoreBreakdown.alert_response = 1.0;
      storage.state.scoreBreakdown.decision = Math.min(1.0, storage.state.scoreBreakdown.decision + 0.2);
      storage.save();

      this.hide();
      this.uiManager.dialogueBox.showDialogue({
        characterId: 'noah',
        message: 'Outstanding leadership, Commander! The entire crew is safely inside the regolith bunker with radiation monitors green. Safe astronauts make successful missions!'
      });
      this.uiManager.dialogueBox.showDialogue({
        characterId: 'orbit',
        message: 'Telemetry logged: Solar proton arrival recorded. Habitat shields held at 100% integrity!'
      });
    });

    this.element.querySelector('#btn-choice-risk').addEventListener('click', () => {
      audio.playClick();
      storage.state.scoreBreakdown.safety = 0.25; // Compromised safety!
      storage.state.scoreBreakdown.alert_response = 0.2;
      storage.save();

      this.hide();
      this.uiManager.dialogueBox.showDialogue({
        characterId: 'noah',
        message: 'Commander, personal dosimeters spiked during the extra drill time! Crew health was compromised. In space, no rock sample is worth your crew’s life.'
      });
    });
  }

  show() {
    audio.playRadioChirp();
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
