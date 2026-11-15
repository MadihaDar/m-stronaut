import { storage } from '../../engine/StorageManager.js';
import { audio } from '../../engine/AudioManager.js';

export class DepartureChecklistInterface {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.checklist = [
      { id: 'chk_o2', label: '1. Cabin Oxygen Supply Pressurization (101.3 kPa)', checked: true },
      { id: 'chk_water', label: '2. Closed-Loop Water Recovery & Reserve Tanks (180 L)', checked: true },
      { id: 'chk_food', label: '3. Spaceflight Food & High-Calorie Rations (180-Day Transit)', checked: true },
      { id: 'chk_power', label: '4. Ascent Vehicle Batteries & Primary Solar Array Charge', checked: true },
      { id: 'chk_comms', label: '5. Deep Space Network Comms & High-Gain Dish Alignment', checked: true },
      { id: 'chk_crew', label: '6. Crew Biometrics, Suits & Radiation Protection Verified', checked: true },
      { id: 'chk_mav', label: '7. MAV Ascent Rocket Stage 1 & 2 Ignition Systems Armed', checked: true },
      { id: 'chk_cargo', label: '8. Research Core Samples Secured in Counterbalanced Cargo Bay', checked: true },
      { id: 'chk_suits', label: '9. Spacesuit Seals, Umbilicals & Visors Leak-Tested', checked: true },
      { id: 'chk_tei', label: '10. Trans-Earth Injection (TEI) Planetary Alignment Window Open', checked: true }
    ];
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-departure-checklist';

    this.element.innerHTML = `
      <div class="modal-content checklist-modal">
        <div class="modal-header">
          <h2>🚀 FINAL MARS DEPARTURE CHECKLIST & ASCENT COMMAND</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="checklist-banner">
          <p><strong>Pre-Flight Safety Gate:</strong> All 10 mission verification steps must be confirmed prior to initiating the Mars Ascent Vehicle (MAV) countdown. No departure is permitted if critical safety systems are compromised.</p>
        </div>

        <div class="checklist-items-grid">
          ${this.checklist
            .map(
              (item) => `
            <div class="chk-item">
              <input type="checkbox" id="${item.id}" ${item.checked ? 'checked' : ''}>
              <label for="${item.id}">${item.label}</label>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="launch-decision-panel">
          <h3>👨‍🚀 Launch Authorization & Environmental Timing:</h3>
          <p>A minor solar wind fluctuation is noted in DONKI telemetry. You have two valid commander choices:</p>

          <div class="decision-row">
            <button class="btn btn-primary btn-large btn-block" id="btn-authorize-launch">
              🔥 AUTHORIZE IMMEDIATE LAUNCH & MARS ASCENT
            </button>
            <button class="btn btn-secondary btn-block" id="btn-delay-launch">
              ⏱️ DELAY LAUNCH 12 HOURS FOR OPTIMAL WEATHER BUFFER
            </button>
          </div>
        </div>

        <div class="comms-delay-box">
          <span class="f-lbl">Interplanetary Communication Delay Telemetry:</span>
          <code>One-Way Delay: t = d / c  |  Round-Trip Delay: t_round_trip = 2d / c</code>
          <p style="font-size: 0.8rem; color: #cbd5e1; margin-top: 4px;">At present planetary distance (142 million km), a radio signal takes <strong>7.9 minutes</strong> to travel one way to Earth Mission Control. All ascent flight decisions are autonomous!</p>
        </div>

        <div class="modal-footer">
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

    this.element.querySelector('#btn-authorize-launch').addEventListener('click', () => {
      audio.playRadioChirp();
      this.executeAscent(false);
    });

    this.element.querySelector('#btn-delay-launch').addEventListener('click', () => {
      audio.playRadioChirp();
      storage.state.marsState.departureDelayChosen = true;
      storage.state.scoreBreakdown.safety = 1.0;
      storage.state.scoreBreakdown.decision = 1.0;
      storage.save();
      this.executeAscent(true);
    });
  }

  executeAscent(wasDelayed) {
    this.hide();
    audio.playDiscovery();

    // Cinematic Ascent and transit narrative
    this.uiManager.dialogueBox.showDialogue({
      characterId: 'alex',
      message: wasDelayed
        ? 'Prudent command decision! We waited out the minor solar disturbance, ensuring our avionics have 100% clean flight telemetry. MAV Stage 1 Ignition in 3... 2... 1... Liftoff from Mars!'
        : 'All 10 checklist items verified green! Main engines ignited! We are ascending from Jezero Crater into Martian parking orbit!'
    });

    this.uiManager.dialogueBox.showDialogue({
      characterId: 'orbit',
      message: 'Ascent telemetry nominal! Mars orbital insertion achieved. Trans-Earth Injection burn executed. Speed: 11.2 km/s. Mars is shrinking in the rearview visor!'
    });

    this.uiManager.dialogueBox.showDialogue({
      characterId: 'noah',
      message: 'Life-support cabin pressure stable at 101.3 kPa. Water and oxygen recycling loops are green. The crew is in high spirits on our journey home to Earth!'
    });

    // Determine final ending based on persistent state
    setTimeout(() => {
      this.uiManager.multipleEndingsModal.showOutcome();
    }, 1800);
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
