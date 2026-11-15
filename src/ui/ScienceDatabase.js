import { SCIENCE_DATABASE, DATA_TYPES } from '../data/scienceData.js';
import { storage } from '../engine/StorageManager.js';
import { audio } from '../engine/AudioManager.js';

export class ScienceDatabase {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.activeFilter = 'ALL';
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-science';

    this.element.innerHTML = `
      <div class="modal-content science-modal">
        <div class="modal-header">
          <h2>🔬 ACADEMY SCIENCE DATABASE</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <!-- Educational Legend -->
        <div class="science-legend">
          <div class="legend-title">Scientific Data Classification:</div>
          <div class="legend-tags">
            ${Object.values(DATA_TYPES)
              .map(
                (t) => `
              <div class="legend-item">
                <span class="type-pill" style="background: ${t.color}33; color: ${t.color}; border: 1px solid ${t.color};">
                  ${t.badge}
                </span>
                <span class="legend-desc">${t.desc}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Filter bar -->
        <div class="science-filters">
          <button class="filter-btn active" data-filter="ALL">All Entries</button>
          <button class="filter-btn" data-filter="Moon">Lunar Science (LRO)</button>
          <button class="filter-btn" data-filter="Mars">Martian Science (Perseverance & Curiosity)</button>
          <button class="filter-btn" data-filter="COLLECTED">My Field Discoveries</button>
        </div>

        <!-- Science Entries List -->
        <div class="science-entries-grid" id="science-entries-container">
          ${this.renderEntriesHtml()}
        </div>

        <div class="modal-footer">
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

    this.element.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.element.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.getAttribute('data-filter');
        this.updateList();
      });
    });
  }

  updateList() {
    const container = this.element.querySelector('#science-entries-container');
    container.innerHTML = this.renderEntriesHtml();
  }

  renderEntriesHtml() {
    const collected = storage.state.collectedFindings || [];
    let list = SCIENCE_DATABASE;

    if (this.activeFilter === 'Moon' || this.activeFilter === 'Mars') {
      list = list.filter((e) => e.planet === this.activeFilter);
    } else if (this.activeFilter === 'COLLECTED') {
      list = list.filter((e) => collected.includes(e.id));
      if (list.length === 0) {
        return `<div class="empty-state">No discoveries logged in the field yet! Explore the 3D sandbox and scan science beacons to log findings.</div>`;
      }
    }

    return list
      .map((entry) => {
        const isCollected = collected.includes(entry.id);
        const typeInfo = DATA_TYPES[entry.dataType] || DATA_TYPES.MEASURED;

        return `
        <div class="science-entry-card ${isCollected ? 'collected' : ''}">
          <div class="entry-header">
            <span class="type-pill" style="background: ${typeInfo.color}22; color: ${typeInfo.color}; border: 1px solid ${typeInfo.color};">
              ${typeInfo.badge}
            </span>
            <span class="entry-planet">${entry.planet} • ${entry.instrument}</span>
          </div>

          <h3>${entry.title}</h3>

          <div class="entry-data-block">
            <div class="data-row">
              <span class="data-label">📡 Measured Telemetry:</span>
              <span class="data-val">${entry.measuredData}</span>
            </div>
            <div class="data-row">
              <span class="data-label">🧮 Calculated Physics Value:</span>
              <span class="data-val">${entry.calculatedValue}</span>
            </div>
          </div>

          <div class="entry-explanation">
            <div class="exp-title">💡 Junior Astronaut Concept:</div>
            <p>${entry.simplifiedExplanation}</p>
          </div>

          <div class="entry-kid-tip">
            ⭐ <strong>Mission Impact:</strong> ${entry.kidTip}
          </div>

          <div class="entry-footer">
            ${
              isCollected
                ? `<span class="badge-collected">✓ LOGGED IN FIELD NOTEBOOK</span>`
                : `<span class="badge-unrecorded">○ AVAILABLE FOR FIELD SCAN</span>`
            }
          </div>
        </div>
      `;
      })
      .join('');
  }

  show() {
    this.updateList();
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
