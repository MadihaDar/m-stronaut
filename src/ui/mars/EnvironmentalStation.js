import { audio } from '../../engine/AudioManager.js';

export class EnvironmentalStation {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.activeTab = 'meda'; // 'meda' | 'mcs'
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-env-station';

    this.element.innerHTML = `
      <div class="modal-content env-modal">
        <div class="modal-header">
          <h2>🛰️ MARS ENVIRONMENTAL & ATMOSPHERIC DYNAMICS STATION</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="env-nav-tabs">
          <button class="env-tab-btn active" data-tab="meda">
            Perseverance MEDA Sol 1553 Surface Telemetry
          </button>
          <button class="env-tab-btn" data-tab="mcs">
            MRO MCS Upper Atmosphere Vertical Profiles
          </button>
        </div>

        <div class="env-body" id="env-content-view">
          ${this.renderMedaHtml()}
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

    this.element.querySelectorAll('.env-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.element.querySelectorAll('.env-tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.getAttribute('data-tab');
        const view = this.element.querySelector('#env-content-view');
        view.innerHTML = this.activeTab === 'meda' ? this.renderMedaHtml() : this.renderMcsHtml();
      });
    });
  }

  renderMedaHtml() {
    return `
      <div class="env-overview-box">
        <div class="meda-headline">
          <span class="m-badge">NASA MARS 2020 • PERSEVERANCE</span>
          <h3>MEDA Calibrated Surface Weather (Sol 1553 Historical)</h3>
          <p class="m-date">Observed: 2 July 2025 21:03 UTC to 3 July 2025 21:43 UTC</p>
        </div>

        <div class="meda-stat-tiles">
          <div class="tile">
            <span class="t-lbl">Median Barometric Pressure:</span>
            <strong class="t-val" style="color: var(--accent-cyan);">639.0 Pa (0.0063 atm)</strong>
            <span class="t-sub">Diurnal cycle: 628 Pa to 655 Pa</span>
          </div>
          <div class="tile">
            <span class="t-lbl">Median Air Temperature:</span>
            <strong class="t-val" style="color: #f97316;">215.87 K (-57.3°C)</strong>
            <span class="t-sub">High: -24.3°C | Low: -83.1°C</span>
          </div>
          <div class="tile">
            <span class="t-lbl">Median Ground Infrared Temp:</span>
            <strong class="t-val" style="color: #facc15;">218.55 K (-54.6°C)</strong>
            <span class="t-sub">TIRS downward IR sensor</span>
          </div>
        </div>

        <div class="meda-sensors-list">
          <h4>Calibrated Sensor Channels in Sol 1553 Archive:</h4>
          <div class="sensors-grid">
            <div class="s-card"><span>CAL_PS</span>: 48,071 pressure readings</div>
            <div class="s-card"><span>CAL_ATS</span>: 48,501 mast air temperatures</div>
            <div class="s-card"><span>CAL_TIRS</span>: 48,500 infrared ground emissions</div>
            <div class="s-card"><span>CAL_RDS</span>: 48,078 dust optical sensors</div>
            <div class="s-card"><span>CAL_RHS</span>: 28,218 relative humidity checks</div>
            <div class="s-card"><span>CAL_ENG</span>: 48,507 instrument temperatures</div>
          </div>
        </div>

        <div class="mandatory-notice-box">
          ⚠️ <strong>Scientific Data Integrity:</strong> MEDA represents genuine historical rover surface telemetry. It is not live weather at the fictional base. The RDS optical sensor measures solar dust opacity, not astronaut ionizing radiation.
        </div>
      </div>
    `;
  }

  renderMcsHtml() {
    return `
      <div class="env-overview-box">
        <div class="meda-headline">
          <span class="m-badge">MRO SATELLITE • ORBIT 88752</span>
          <h3>Mars Climate Sounder (MCS) Vertical Atmospheric Profiles</h3>
          <p class="m-date">25,994 profiles • 105 vertical levels • 1–5 July 2025</p>
        </div>

        <div class="mcs-profile-table-container">
          <table class="mcs-table">
            <thead>
              <tr>
                <th>Altitude (km)</th>
                <th>Temperature (K)</th>
                <th>Pressure (Pa)</th>
                <th>Dust Opacity (/km)</th>
                <th>Atmospheric Layer</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>0.0 km</td><td>218.0 K</td><td>635 Pa</td><td>0.080</td><td>Planetary Boundary Layer</td></tr>
              <tr><td>5.0 km</td><td>208.5 K</td><td>380 Pa</td><td>0.050</td><td>Lower Troposphere</td></tr>
              <tr><td>10.0 km</td><td>198.0 K</td><td>220 Pa</td><td>0.030</td><td>Mid Troposphere</td></tr>
              <tr><td>20.0 km</td><td>182.0 K</td><td>75 Pa</td><td>0.020</td><td>Upper Troposphere</td></tr>
              <tr><td>30.0 km</td><td>171.0 K</td><td>25 Pa</td><td>0.010</td><td>Mesosphere Base</td></tr>
              <tr><td>50.0 km</td><td>158.0 K</td><td>2.5 Pa</td><td>0.001</td><td>Cryogenic Upper Atmosphere</td></tr>
            </tbody>
          </table>
        </div>

        <div class="formula-box" style="margin-top: 12px;">
          <div class="f-title">📐 Atmospheric Physics Explanations:</div>
          <code>Ideal Gas Law: P = ρRT / M  |  Aerodynamic Drag: F_drag = ½ ρ C_D A v²</code>
          <p style="font-size: 0.75rem; color: #cbd5e1; margin-top: 4px;">Because atmospheric density (ρ) drops exponentially with altitude, landing spacecraft require supersonic parachutes and retrorockets to decelerate safely.</p>
        </div>

        <div class="mandatory-notice-box">
          ⚠️ <strong>Scientific Rule:</strong> MCS limb-sounding profiles measure the atmosphere at altitude. They do NOT provide local surface weather or ground temperature for the fictional outpost.
        </div>
      </div>
    `;
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
