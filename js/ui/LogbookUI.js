/* ============================================================
   FRONTIER: MISSION ACADEMY — Expedition Scientific Logbook UI
   Interactive logbook of all NASA dataset findings, core samples,
   radiation telemetry records, and operational tradeoff decisions
   ============================================================ */

export class LogbookUI {
  constructor(engine) {
    this.engine = engine;
    this.panel = document.getElementById('logbook-panel');
    this.listEl = document.getElementById('logbook-entries-list');
    this.countEl = document.getElementById('logbook-count');
    this.scoreEl = document.getElementById('logbook-score');
    this.samplesEl = document.getElementById('logbook-samples');
    this.btnClose = document.getElementById('btn-close-logbook');

    this.currentFilter = 'all';
    this._bindEvents();
  }

  _bindEvents() {
    if (this.btnClose) {
      this.btnClose.onclick = () => {
        this.engine.audio.playUIClick();
        this.close();
      };
    }

    // Filter tabs
    const tabs = document.querySelectorAll('.logbook-tab');
    tabs.forEach(tab => {
      tab.onclick = () => {
        this.engine.audio.playUIClick();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentFilter = tab.getAttribute('data-filter') || 'all';
        this.render();
      };
    });

    // Topbar header Logbook button
    const btnOpen = document.getElementById('btn-open-logbook');
    if (btnOpen) {
      btnOpen.onclick = () => {
        this.engine.audio.playUIClick();
        this.toggle();
      };
    }

    // Pause menu Logbook button
    const btnPauseLog = document.getElementById('btn-pause-logbook');
    if (btnPauseLog) {
      btnPauseLog.onclick = () => {
        this.engine.audio.playUIClick();
        this.open();
      };
    }

    // Hotkey [B] for Logbook
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyB') {
        const hud = document.getElementById('hud');
        if (hud && hud.classList.contains('visible')) {
          e.preventDefault();
          this.toggle();
        }
      }
    });
  }

  open() {
    if (!this.panel) return;
    this.panel.classList.add('visible');
    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) backdrop.classList.add('visible');
    this.render();
  }

  close() {
    if (!this.panel) return;
    this.panel.classList.remove('visible');
    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) backdrop.classList.remove('visible');
  }

  toggle() {
    if (this.panel && this.panel.classList.contains('visible')) {
      this.close();
    } else {
      this.open();
    }
  }

  render() {
    const rawFindings = (this.engine.save && this.engine.save.progress.findingsRecorded) || [];
    const samplesCount = this.engine.save ? this.engine.save.getSamplesCount() : 0;

    // Update summary counters
    if (this.countEl) this.countEl.textContent = rawFindings.length;
    if (this.scoreEl) this.scoreEl.textContent = (this.engine.scoring && typeof this.engine.scoring.totalPoints === 'number') ? this.engine.scoring.totalPoints : 0;
    if (this.samplesEl) this.samplesEl.textContent = samplesCount;

    if (!this.listEl) return;

    // Filter findings
    let filtered = rawFindings;
    if (this.currentFilter === 'measured') {
      filtered = rawFindings.filter(f => f.measurements && f.measurements.some(m => m.source === 'measured'));
    } else if (this.currentFilter === 'calculated') {
      filtered = rawFindings.filter(f => f.measurements && f.measurements.some(m => m.source === 'calculated'));
    } else if (this.currentFilter === 'tradeoffs') {
      filtered = rawFindings.filter(f => f.type === 'TRADEOFF DECISION');
    }

    if (filtered.length === 0) {
      this.listEl.innerHTML = `
        <div class="logbook-empty-state">
          <div class="empty-icon">🎒</div>
          <div class="empty-title">YOUR ASTRONAUT BACKPACK IS EMPTY!</div>
          <p class="empty-desc">
            Drive your rover, explore glowing beacons, press <strong>[E]</strong> to collect space samples, and make mission choices to earn badges here!
          </p>
        </div>
      `;
      return;
    }

    this.listEl.innerHTML = filtered.map((f) => {
      const isTradeoff = f.type === 'TRADEOFF DECISION';
      const isSample = f.isSample || (f.type && (f.type.includes('SAMPLE') || f.type.includes('DRILL') || f.type.includes('CORE') || f.type.includes('ICE') || f.type.includes('ROCK')));
      
      let icon = '🔬';
      let category = 'DISCOVERY';
      let accentCol = '#00e5ff';

      if (isTradeoff) {
        icon = '⚖️';
        category = 'MISSION CHOICE';
        accentCol = '#ffaa00';
      } else if (f.name && f.name.toLowerCase().includes('ice')) {
        icon = '🧊';
        category = 'ICE CORE SAMPLE';
        accentCol = '#38bdf8';
      } else if (f.name && f.name.toLowerCase().includes('cave') || (f.name && f.name.toLowerCase().includes('tube'))) {
        icon = '🕳️';
        category = 'LAVA CAVE VAULT';
        accentCol = '#4ade80';
      } else if (f.name && f.name.toLowerCase().includes('radio') || (f.name && f.name.toLowerCase().includes('dish'))) {
        icon = '📡';
        category = 'RADIO TELESCOPE';
        accentCol = '#c084fc';
      } else if (isSample) {
        icon = '🪨';
        category = 'ROCK SAMPLE';
        accentCol = '#fb923c';
      }

      const chipsHTML = (f.measurements || []).map(m => {
        const valStr = typeof m.value === 'string' ? m.value : `${m.value} ${m.unit || ''}`;
        if (isTradeoff) {
          const isReward = valStr.includes('REWARD') || m.label.startsWith('+');
          const chipIcon = isReward ? '✅' : '⚠️';
          const chipClass = isReward ? 'chip-reward' : 'chip-cost';
          return `
            <div class="log-badge-chip ${chipClass}">
              <span>${chipIcon}</span>
              <span class="chip-label" style="font-weight: 700;">${m.label}</span>
            </div>
          `;
        }
        return `
          <div class="log-badge-chip">
            <span class="chip-label">${m.label}:</span>
            <span class="chip-value">${valStr}</span>
          </div>
        `;
      }).join('');

      const simpleFact = f.explain && f.explain.simple ? f.explain.simple : 'Scientific discovery safely cataloged in Houston database.';

      return `
        <div class="log-kid-card" style="--card-border-col: ${accentCol}">
          <div class="log-kid-card-header">
            <div class="log-kid-badge" style="background: ${accentCol}22; color: ${accentCol}; border-color: ${accentCol}66;">
              <span>${icon}</span> <span>${category}</span>
            </div>
            <span class="log-kid-star">★ VERIFIED</span>
          </div>
          
          <h3 class="log-kid-title">${f.name}</h3>

          ${chipsHTML ? `<div class="log-kid-chips-grid">${chipsHTML}</div>` : ''}

          <div class="log-kid-fact-box">
            <span class="fact-bulb">💡</span>
            <div class="fact-text-kid">${simpleFact}</div>
          </div>
        </div>
      `;
    }).reverse().join('');
  }
}
