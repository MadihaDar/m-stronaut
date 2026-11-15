import { DATASET_PROVENANCE } from '../data/scienceProvenance.js';
import { audio } from '../engine/AudioManager.js';

export class DatasetInfoModal {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.currentKey = 'lola';
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-dataset-info';

    this.element.innerHTML = `
      <div class="modal-content dataset-modal">
        <div class="modal-header">
          <h2>📋 SCIENTIFIC DATASET PROVENANCE PANEL</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="provenance-tabs">
          <button class="prov-tab-btn active" data-prov="lola">LOLA Altimetry</button>
          <button class="prov-tab-btn" data-prov="diviner_gcp">Diviner GCP Thermal</button>
          <button class="prov-tab-btn" data-prov="diviner_ghrm">Diviner GHRM</button>
          <button class="prov-tab-btn" data-prov="diviner_ra">Diviner Rock Abundance</button>
          <button class="prov-tab-btn" data-prov="diviner_jd">Diviner JD AVG</button>
          <button class="prov-tab-btn" data-prov="lend">NASA LEND</button>
          <button class="prov-tab-btn" data-prov="robbins">Robbins Craters</button>
          <button class="prov-tab-btn" data-prov="donki">NASA DONKI</button>
        </div>

        <div class="provenance-detail-card" id="prov-detail-content">
          ${this.renderCardHtml('lola')}
        </div>

        <div class="modal-footer">
          <p class="hint-text">🔒 Scientific Data Integrity Rule: Never invent NASA data or coverage. Maintain full provenance.</p>
          <button class="btn btn-secondary" data-close>CLOSE</button>
        </div>
      </div>
    `;

    // Events
    this.element.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.hide();
      });
    });

    this.element.querySelectorAll('.prov-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.element.querySelectorAll('.prov-tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const key = btn.getAttribute('data-prov');
        this.showKey(key);
      });
    });
  }

  showKey(key) {
    this.currentKey = key;
    const container = this.element.querySelector('#prov-detail-content');
    container.innerHTML = this.renderCardHtml(key);
  }

  renderCardHtml(key) {
    const d = DATASET_PROVENANCE[key] || DATASET_PROVENANCE.lola;
    return `
      <div class="prov-header-row">
        <div>
          <span class="prov-badge">${d.sourceMission}</span>
          <h3>${d.datasetName}</h3>
          <p class="prov-product">Product: <code>${d.productName}</code></p>
        </div>
        <span class="type-pill" style="background: rgba(56, 189, 248, 0.2); color: var(--accent-cyan); border: 1px solid var(--accent-cyan);">
          ${d.valueType}
        </span>
      </div>

      <div class="prov-specs-grid">
        <div class="prov-row">
          <span class="p-label">Primary Parameter:</span>
          <span class="p-val">${d.parameter}</span>
        </div>
        <div class="prov-row">
          <span class="p-label">Measurement Unit:</span>
          <span class="p-val">${d.unit}</span>
        </div>
        <div class="prov-row">
          <span class="p-label">Geographic Coverage:</span>
          <span class="p-val highlight-val">${d.geographicCoverage}</span>
        </div>
        <div class="prov-row">
          <span class="p-label">Observation Period:</span>
          <span class="p-val">${d.observationPeriod}</span>
        </div>
        <div class="prov-row">
          <span class="p-label">Spatial/Temporal Resolution:</span>
          <span class="p-val">${d.resolution}</span>
        </div>
        <div class="prov-row">
          <span class="p-label">Missing Value Handling:</span>
          <span class="p-val">${d.missingValueHandling}</span>
        </div>
      </div>

      ${
        d.conversionFormula
          ? `
        <div class="formula-box">
          <div class="f-title">📐 Conversion & Calculation Formula:</div>
          <code>${d.conversionFormula}</code>
          ${d.slopeFormula ? `<br><code>${d.slopeFormula}</code>` : ''}
        </div>
      `
          : ''
      }
    `;
  }

  show(key = 'lola') {
    this.showKey(key);
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
