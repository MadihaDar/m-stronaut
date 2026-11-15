import { DESTINATIONS } from '../data/destinations.js';
import { storage } from '../engine/StorageManager.js';
import { audio } from '../engine/AudioManager.js';

export class DestinationSelector {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.selected = storage.state.selectedDestination || 'moon';
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-destinations';

    const moon = DESTINATIONS.moon;
    const mars = DESTINATIONS.mars;

    this.element.innerHTML = `
      <div class="modal-content destination-modal">
        <div class="modal-header">
          <h2>🪐 DESTINATION SELECTOR</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="destinations-grid">
          <!-- MOON CARD -->
          <div class="destination-card ${this.selected === 'moon' ? 'selected' : ''}" data-dest="moon">
            <div class="dest-badge">LUNAR SOUTH POLE</div>
            <h3>${moon.name}</h3>
            <p class="dest-sub">${moon.subtitle}</p>
            
            <div class="dest-specs">
              <div class="spec-row">
                <span class="spec-label">Surface Gravity:</span>
                <span class="spec-val">${moon.gravity} m/s² (1/6th Earth)</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">Atmosphere:</span>
                <span class="spec-val">${moon.atmosphere}</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">Thermal Limits:</span>
                <span class="spec-val">${moon.tempRange}</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">NASA Datasets:</span>
                <span class="spec-val">${moon.keyInstruments.join(', ')}</span>
              </div>
            </div>

            <p class="dest-briefing">${moon.briefing}</p>

            <button class="btn btn-primary btn-block btn-select-dest" data-select="moon">
              ${this.selected === 'moon' ? '✓ CURRENT DESTINATION' : 'SET AS DESTINATION'}
            </button>
          </div>

          <!-- MARS CARD -->
          <div class="destination-card ${this.selected === 'mars' ? 'selected' : ''}" data-dest="mars">
            <div class="dest-badge mars-badge">JEZERO CRATER</div>
            <h3>${mars.name}</h3>
            <p class="dest-sub">${mars.subtitle}</p>
            
            <div class="dest-specs">
              <div class="spec-row">
                <span class="spec-label">Surface Gravity:</span>
                <span class="spec-val">${mars.gravity} m/s² (38% Earth)</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">Atmosphere:</span>
                <span class="spec-val">${mars.atmosphere}</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">Thermal Limits:</span>
                <span class="spec-val">${mars.tempRange}</span>
              </div>
              <div class="spec-row">
                <span class="spec-label">NASA Datasets:</span>
                <span class="spec-val">${mars.keyInstruments.join(', ')}</span>
              </div>
            </div>

            <p class="dest-briefing">${mars.briefing}</p>

            <button class="btn btn-primary btn-block btn-select-dest" data-select="mars">
              ${this.selected === 'mars' ? '✓ CURRENT DESTINATION' : 'SET AS DESTINATION'}
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <p class="hint-text">💡 Note: In this Core Engine Slice, both planetary training sandboxes are fully accessible for vehicle testing and sensor telemetry calibration!</p>
          <button class="btn btn-secondary" data-close>CLOSE</button>
        </div>
      </div>
    `;

    // Bind events
    this.element.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.hide();
      });
    });

    this.element.querySelectorAll('.btn-select-dest').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const destId = e.target.getAttribute('data-select');
        this.selectDestination(destId);
      });
    });
  }

  selectDestination(destId) {
    audio.playClick();
    this.selected = destId;
    storage.state.selectedDestination = destId;
    storage.save();

    this.element.querySelectorAll('.destination-card').forEach((card) => {
      const match = card.getAttribute('data-dest') === destId;
      card.classList.toggle('selected', match);
      const btn = card.querySelector('.btn-select-dest');
      btn.textContent = match ? '✓ CURRENT DESTINATION' : 'SET AS DESTINATION';
    });

    // Notify game engine to switch environment lighting and assets
    this.uiManager.onDestinationChanged(destId);
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
