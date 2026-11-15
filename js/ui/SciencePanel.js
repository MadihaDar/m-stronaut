/* ============================================================
   FRONTIER: MISSION ACADEMY — Science Scanner Panel
   Presents NASA open dataset observations with child-friendly explanations
   ============================================================ */

export class SciencePanel {
  constructor(engine) {
    this.engine = engine;

    this.panel = document.getElementById('science-panel');
    this.titleEl = document.getElementById('science-target-title');
    this.subEl = document.getElementById('science-target-sub');
    this.metricsGrid = document.getElementById('science-metrics');
    this.simpleTextEl = document.getElementById('science-simple-text');
    this.advTextEl = document.getElementById('science-adv-text');
    this.btnRecord = document.getElementById('btn-record-finding');
    this.btnClose = document.getElementById('btn-close-science');

    this.currentTarget = null;
    this._bindEvents();
  }

  _bindEvents() {
    if (this.btnClose) {
      this.btnClose.onclick = () => {
        this.engine.audio.playUIClick();
        this.close();
      };
    }

    if (this.btnRecord) {
      this.btnRecord.onclick = () => {
        if (!this.currentTarget) return;
        this.engine.audio.playSuccess();
        this.engine.emit('science:record', this.currentTarget);
        this.engine.save.recordFinding({
          id: this.currentTarget.id,
          name: this.currentTarget.name,
          type: this.currentTarget.type
        });

        this.btnRecord.disabled = true;
        this.btnRecord.classList.add('recorded');
        this.btnRecord.innerHTML = '<span>✅</span> RECORDED IN LOGBOOK';
        this.engine.showNotification(`Saved observation: ${this.currentTarget.name}`, 'success');
      };
    }
  }

  open(target) {
    this.currentTarget = target;
    if (!this.panel) return;

    if (this.titleEl) this.titleEl.textContent = target.name;
    if (this.subEl) this.subEl.textContent = target.type;

    // Render telemetry metrics
    if (this.metricsGrid && target.measurements) {
      this.metricsGrid.innerHTML = '';
      target.measurements.forEach((m) => {
        const cell = document.createElement('div');
        cell.className = 'science-data-cell';
        const labelHTML = this.engine.tooltip ? this.engine.tooltip.decorateHTML(m.label) : m.label;
        const sourceLabelHTML = this.engine.tooltip ? this.engine.tooltip.decorateHTML(m.sourceLabel) : m.sourceLabel;
        cell.innerHTML = `
          <div class="science-data-cell-label">${labelHTML}</div>
          <div class="science-data-cell-value">${m.value} <span class="science-data-cell-unit">${m.unit}</span></div>
          <div class="science-data-source">
            <span class="science-tag ${m.source}">${m.source.toUpperCase()}</span>
            <span>${sourceLabelHTML}</span>
          </div>
        `;
        this.metricsGrid.appendChild(cell);
      });
    }

    // Render explanation with Educational Tooltip (i) decoration
    if (this.simpleTextEl && target.explain) {
      const text = `⭐ <strong>Punchy Fact:</strong> ${target.explain.simple}`;
      this.simpleTextEl.innerHTML = this.engine.tooltip ? this.engine.tooltip.decorateHTML(text) : text;
    }
    if (this.advTextEl && target.explain) {
      const adv = `🔍 <strong>Deep Science:</strong> ${target.explain.advanced} <br><small class="text-dim">NASA Provenance: ${target.explain.nasaDataset}</small>`;
      this.advTextEl.innerHTML = this.engine.tooltip ? this.engine.tooltip.decorateHTML(adv) : adv;
    }

    // Bind interactive (i) popups
    if (this.engine.tooltip) {
      this.engine.tooltip.bindTooltips(this.panel);
    }

    // Reset record button
    if (this.btnRecord) {
      this.btnRecord.disabled = false;
      this.btnRecord.classList.remove('recorded');
      this.btnRecord.innerHTML = '<span>💾</span> RECORD FINDING IN LOGBOOK';
    }

    this.panel.classList.add('visible');
  }

  close() {
    if (this.panel) this.panel.classList.remove('visible');
    this.currentTarget = null;
  }

  isOpen() {
    return this.panel && this.panel.classList.contains('visible');
  }
}
