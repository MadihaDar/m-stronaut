import { storage } from '../../engine/StorageManager.js';
import { audio } from '../../engine/AudioManager.js';

export class HabitatPanel {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.o2GenActive = true;
    this.co2ScrubActive = true;
    this.waterRecycleActive = true;
    this.heatingLevel = 'OPTIMAL'; // 'ECO' | 'OPTIMAL' | 'HIGH'
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-habitat-panel';

    this.element.innerHTML = `
      <div class="modal-content habitat-modal">
        <div class="modal-header">
          <h2>🏠 MARS BASE CONNECTED LIFE-SUPPORT CONSOLE</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="habitat-info-banner">
          <p><strong>System Connectivity:</strong> Life-support systems are interdependent. Oxygen generation requires electrical power and water electrolysis; carbon dioxide scrubbers prevent toxic buildup; recycling loops reclaim precious moisture.</p>
        </div>

        <div class="systems-grid">
          <!-- 1. OXYGEN GENERATION LOOP -->
          <div class="system-card ${this.o2GenActive ? 'active-sys' : ''}">
            <div class="sys-header">
              <span class="sys-icon">🫧</span>
              <div>
                <h3>Oxygen Generation System (OGS)</h3>
                <span class="sys-formula">O₂ next = O₂ current + O₂ gen − O₂ consumed</span>
              </div>
              <span class="status-indicator ${this.o2GenActive ? 'status-green' : 'status-red'}">
                ${this.o2GenActive ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <p class="sys-desc">Water electrolysis splits $H_2O$ into breathable $O_2$ and hydrogen byproduct. Consumes 1.8 kW of electrical power.</p>
            <div class="sys-metrics">
              <span>Production: <strong>+2.1 kg/day</strong></span>
              <span>Power Draw: <strong>1.8 kW</strong></span>
            </div>
            <button class="btn btn-secondary btn-block" id="btn-toggle-o2">
              ${this.o2GenActive ? 'DEACTIVATE O₂ LOOP' : 'ACTIVATE O₂ GENERATOR'}
            </button>
          </div>

          <!-- 2. CO2 REMOVAL & SCRUBBERS -->
          <div class="system-card ${this.co2ScrubActive ? 'active-sys' : ''}">
            <div class="sys-header">
              <span class="sys-icon">💨</span>
              <div>
                <h3>Carbon Dioxide Removal (CDRA)</h3>
                <span class="sys-formula">CO₂ next = CO₂ current + CO₂ prod − CO₂ removed</span>
              </div>
              <span class="status-indicator ${this.co2ScrubActive ? 'status-green' : 'status-red'}">
                ${this.co2ScrubActive ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <p class="sys-desc">Thermal amine beds scrub exhaled $CO_2$ from habitat air, maintaining cabin $CO_2$ below 0.3% to prevent crew headaches.</p>
            <div class="sys-metrics">
              <span>Scrub Rate: <strong>3.2 kg/day</strong></span>
              <span>Cabin CO₂: <strong>0.22% (Safe)</strong></span>
            </div>
            <button class="btn btn-secondary btn-block" id="btn-toggle-co2">
              ${this.co2ScrubActive ? 'DEACTIVATE CDRA' : 'ACTIVATE CDRA SCRUBBERS'}
            </button>
          </div>

          <!-- 3. WATER RECOVERY & RECYCLING -->
          <div class="system-card ${this.waterRecycleActive ? 'active-sys' : ''}">
            <div class="sys-header">
              <span class="sys-icon">💧</span>
              <div>
                <h3>Water Recovery System (WRS)</h3>
                <span class="sys-formula">η = (Water recovered / Water processed) × 100%</span>
              </div>
              <span class="status-indicator ${this.waterRecycleActive ? 'status-green' : 'status-red'}">
                ${this.waterRecycleActive ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <p class="sys-desc">Vapor compression distillation reclaims wastewater and atmospheric humidity at 94% efficiency.</p>
            <div class="sys-metrics">
              <span>Recycling Efficiency (η): <strong>94.2%</strong></span>
              <span>Recovery Rate: <strong>18.5 L/day</strong></span>
            </div>
            <button class="btn btn-secondary btn-block" id="btn-toggle-water">
              ${this.waterRecycleActive ? 'DEACTIVATE RECYCLER' : 'ACTIVATE WATER RECYCLER'}
            </button>
          </div>

          <!-- 4. THERMAL HABITAT HEATING -->
          <div class="system-card active-sys">
            <div class="sys-header">
              <span class="sys-icon">🌡️</span>
              <div>
                <h3>Thermal & Climate Regulation</h3>
                <span class="sys-formula">Q = mcΔT | P = εσA(T⁴ − T surroundings⁴)</span>
              </div>
              <span class="status-indicator status-green">21.5°C</span>
            </div>
            <p class="sys-desc">External Martian temperatures plunge to -83°C. Electric radiant heaters maintain interior shirtsleeve comfort.</p>
            <div class="heating-buttons">
              <button class="btn btn-sm ${this.heatingLevel === 'ECO' ? 'btn-primary' : 'btn-secondary'}" data-heat="ECO">ECO (18°C • 1.2 kW)</button>
              <button class="btn btn-sm ${this.heatingLevel === 'OPTIMAL' ? 'btn-primary' : 'btn-secondary'}" data-heat="OPTIMAL">OPTIMAL (21°C • 2.0 kW)</button>
              <button class="btn btn-sm ${this.heatingLevel === 'HIGH' ? 'btn-primary' : 'btn-secondary'}" data-heat="HIGH">HIGH (24°C • 3.1 kW)</button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <p class="hint-text">💡 Educational Note: Life-support formulas are simplified gameplay models for training.</p>
          <button class="btn btn-secondary" data-close>SAVE & CLOSE</button>
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

    this.element.querySelector('#btn-toggle-o2').addEventListener('click', () => {
      audio.playClick();
      this.o2GenActive = !this.o2GenActive;
      this.updateView();
    });

    this.element.querySelector('#btn-toggle-co2').addEventListener('click', () => {
      audio.playClick();
      this.co2ScrubActive = !this.co2ScrubActive;
      this.updateView();
    });

    this.element.querySelector('#btn-toggle-water').addEventListener('click', () => {
      audio.playClick();
      this.waterRecycleActive = !this.waterRecycleActive;
      this.updateView();
    });

    this.element.querySelectorAll('[data-heat]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        audio.playClick();
        this.heatingLevel = e.target.getAttribute('data-heat');
        this.updateView();
      });
    });
  }

  updateView() {
    this.render();
    this.element.classList.remove('hidden');
    // Update persistent state in storage
    storage.updateMarsResource('oxygen', this.o2GenActive ? 98 : 65);
    storage.updateMarsResource('water', this.waterRecycleActive ? 95 : 70);
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
