import { storage } from '../../engine/StorageManager.js';
import { audio } from '../../engine/AudioManager.js';

export class GreenhouseInterface {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.factors = {
      temp: 0.95,
      light: 0.90,
      water: 0.92,
      co2: 0.98,
      nutrients: 0.90
    };
    this.render();
  }

  calculateGrowthRate() {
    const r = this.factors.temp * this.factors.light * this.factors.water * this.factors.co2 * this.factors.nutrients;
    return Math.round(r * 100);
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-greenhouse';

    const growthRate = this.calculateGrowthRate();

    this.element.innerHTML = `
      <div class="modal-content greenhouse-modal">
        <div class="modal-header">
          <h2>🌱 BIO-REGENERATIVE GREENHOUSE CONSOLE</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="greenhouse-formula-box">
          <span class="f-lbl">Crop Growth Multiplier Formula:</span>
          <code>r_effective = r_max × f_temp × f_light × f_water × f_CO2 × f_nutrients</code>
          <p class="f-sub">Photosynthesis: 6CO₂ + 6H₂O + light ➔ C₆H₁₂O₆ (Sugar) + 6O₂ (Breathable Oxygen)</p>
        </div>

        <div class="growth-meter-card">
          <div class="meter-header">
            <span>Overall Crop Growth Efficiency:</span>
            <strong class="growth-val" id="gh-growth-val">${growthRate}%</strong>
          </div>
          <div class="growth-bar">
            <div class="growth-fill" id="gh-growth-fill" style="width: ${growthRate}%;"></div>
          </div>
          <span class="meter-status" id="gh-meter-status">Crops thriving! Daily yield: +1.6 kg fresh vegetables</span>
        </div>

        <div class="crop-sliders-grid">
          <!-- TEMPERATURE -->
          <div class="crop-slider-row">
            <label>🌡️ Temperature Factor (f_temp): <strong id="lbl-f-temp">${Math.round(this.factors.temp * 100)}%</strong></label>
            <input type="range" min="0.2" max="1.0" step="0.05" value="${this.factors.temp}" id="slide-temp">
            <span class="slider-hint">Optimal range: 20°C to 24°C</span>
          </div>

          <!-- LIGHT -->
          <div class="crop-slider-row">
            <label>💡 LED Spectrum Lighting (f_light): <strong id="lbl-f-light">${Math.round(this.factors.light * 100)}%</strong></label>
            <input type="range" min="0.2" max="1.0" step="0.05" value="${this.factors.light}" id="slide-light">
            <span class="slider-hint">Photoperiod: 16 hrs light / 8 hrs dark</span>
          </div>

          <!-- WATER -->
          <div class="crop-slider-row">
            <label>💧 Hydroponic Nutrient Water (f_water): <strong id="lbl-f-water">${Math.round(this.factors.water * 100)}%</strong></label>
            <input type="range" min="0.2" max="1.0" step="0.05" value="${this.factors.water}" id="slide-water">
            <span class="slider-hint">Recycled water irrigation loop</span>
          </div>

          <!-- NUTRIENTS -->
          <div class="crop-slider-row">
            <label>🧪 Mineral Nutrients N-P-K (f_nutrients): <strong id="lbl-f-nut">${Math.round(this.factors.nutrients * 100)}%</strong></label>
            <input type="range" min="0.2" max="1.0" step="0.05" value="${this.factors.nutrients}" id="slide-nut">
            <span class="slider-hint">Nitrogen, Phosphorus, Potassium</span>
          </div>
        </div>

        <div class="educational-insight-box">
          <div class="insight-title">💡 NASA Space-Crop Research (VEGGIE & OCHRE):</div>
          <p>Crops like red romaine lettuce, radishes, and microgreens provide vital fresh vitamins (C and K1) and psychological comfort for the crew. However, plants alone cannot scrub all $CO_2$ or generate all oxygen—engineered life-support machines remain essential.</p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-save-greenhouse">CONFIRM CROP SETTINGS</button>
          <button class="btn btn-secondary" data-close>CLOSE</button>
        </div>
      </div>
    `;

    // Sliders
    const bindSlider = (id, factorKey, lblId) => {
      const slider = this.element.querySelector(id);
      slider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        this.factors[factorKey] = v;
        this.element.querySelector(lblId).textContent = `${Math.round(v * 100)}%`;
        const rate = this.calculateGrowthRate();
        this.element.querySelector('#gh-growth-val').textContent = `${rate}%`;
        this.element.querySelector('#gh-growth-fill').style.width = `${rate}%`;
      });
    };

    bindSlider('#slide-temp', 'temp', '#lbl-f-temp');
    bindSlider('#slide-light', 'light', '#lbl-f-light');
    bindSlider('#slide-water', 'water', '#lbl-f-water');
    bindSlider('#slide-nut', 'nutrients', '#lbl-f-nut');

    // Events
    this.element.querySelectorAll('[data-close]').forEach((b) => {
      b.addEventListener('click', () => {
        audio.playClick();
        this.hide();
      });
    });

    this.element.querySelector('#btn-save-greenhouse').addEventListener('click', () => {
      audio.playClick();
      const rate = this.calculateGrowthRate();
      storage.updateMarsResource('greenhouseHealth', rate);
      storage.updateMarsResource('food', Math.min(100, storage.state.marsState.food + 5));
      this.uiManager.dialogueBox.showDialogue({
        characterId: 'noah',
        message: `Great work in the greenhouse, Commander! Crop growth efficiency is calibrated to ${rate}%. Fresh produce is boosting crew morale!`
      });
      this.hide();
    });
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
