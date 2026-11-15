/* ============================================================
   FRONTIER: MISSION ACADEMY — Mission Scoring Engine
   Educational evaluation formula matching NASA challenge:
   Score = 100 * (0.30*safety + 0.20*resource + 0.15*science +
                  0.15*decision + 0.10*navigation + 0.10*teamwork)
   Hard Gate: If crew safety reaches 0, total score = 0.
   ============================================================ */

export class ScoringSystem {
  constructor(engine) {
    this.engine = engine;

    this.weights = {
      safety: 0.30,
      resource: 0.20,
      science: 0.15,
      decision: 0.15,
      navigation: 0.10,
      teamwork: 0.10
    };

    this.metrics = {
      safety: 1.0,      // 0.0 - 1.0
      resource: 1.0,
      science: 0.8,
      decision: 0.9,
      navigation: 0.85,
      teamwork: 1.0
    };

    this.totalPoints = 0;
    this.scoreHistory = [];

    this._bindEvents();
  }

  add(points = 100, reason = '') {
    this.totalPoints = (this.totalPoints || 0) + points;
    this.scoreHistory = this.scoreHistory || [];
    this.scoreHistory.push({ points, reason, time: Date.now() });
    this.metrics.science = Math.min(1.0, this.metrics.science + (points / 10000));
    this.engine.emit('score:added', { points, total: this.totalPoints, reason });
    return this.totalPoints;
  }

  _bindEvents() {
    this.engine.on('resource:warning', () => {
      this.metrics.resource = Math.max(0.2, this.metrics.resource - 0.05);
    });

    this.engine.on('resource:critical', () => {
      this.metrics.resource = Math.max(0.1, this.metrics.resource - 0.1);
      this.metrics.safety = Math.max(0.1, this.metrics.safety - 0.15);
    });

    this.engine.on('resource:depleted', (data) => {
      if (data.name === 'oxygen' || data.name === 'crewCondition') {
        this.metrics.safety = 0.0; // Hard fail gate
      }
      this.metrics.resource = Math.max(0.0, this.metrics.resource - 0.25);
    });

    this.engine.on('science:record', () => {
      this.metrics.science = Math.min(1.0, this.metrics.science + 0.1);
    });
  }

  calculate() {
    // Hard gate check
    if (this.metrics.safety <= 0.0) {
      return {
        total: 0,
        grade: 'MISSION ABORTED (SAFETY CRITICAL)',
        breakdown: { ...this.metrics }
      };
    }

    let total = 0;
    for (const [key, weight] of Object.entries(this.weights)) {
      total += (this.metrics[key] || 0) * weight;
    }

    const score = Math.round(total * 100);

    let grade = 'B';
    if (score >= 95) grade = 'A+ (Commander Honors)';
    else if (score >= 88) grade = 'A (Mission Certified)';
    else if (score >= 78) grade = 'B (Qualified)';
    else if (score >= 65) grade = 'C (Needs Training)';
    else grade = 'D (Suboptimal)';

    return {
      total: score,
      grade,
      breakdown: { ...this.metrics }
    };
  }

  /**
   * Comprehensive Final Mission Score including live snapshot of life-support resources
   */
  calculateFinalScore() {
    const calc = this.calculate();
    let resources = { oxygen: 100, power: 100, health: 100, food: 100, water: 100 };
    if (this.engine.resources) {
      const r = this.engine.resources;
      resources = {
        oxygen: Math.round(r.getPercent('oxygen')),
        power: Math.round(r.getPercent('power')),
        health: Math.round(r.getPercent('crewCondition')),
        food: Math.round(r.getPercent('food')),
        water: Math.round(r.getPercent('water'))
      };
    }

    return {
      total: calc.total,
      totalPoints: this.totalPoints || 2000,
      grade: calc.grade,
      breakdown: calc.breakdown,
      resources
    };
  }

  /* ── Interactive Itemized NASA Evaluation Receipt Modal ── */
  showEvaluationReceipt(missionName = 'LUNAR MISSION', onContinue = null) {
    const res = this.calculate();
    let modal = document.getElementById('mission-evaluation-receipt-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mission-evaluation-receipt-modal';
      modal.className = 'evaluation-receipt-modal';
      document.body.appendChild(modal);
    }

    const m = this.metrics;
    const w = this.weights;

    const rows = [
      { name: 'Crew Safety Protocol', icon: '❤️', weight: '30%', score: Math.round(m.safety * 100), contrib: (m.safety * w.safety * 100).toFixed(1) },
      { name: 'Resource Conservation', icon: '⚡', weight: '20%', score: Math.round(m.resource * 100), contrib: (m.resource * w.resource * 100).toFixed(1) },
      { name: 'Scientific Discovery Return', icon: '🔬', weight: '15%', score: Math.round(m.science * 100), contrib: (m.science * w.science * 100).toFixed(1) },
      { name: 'Operational Dilemma Decisions', icon: '⚖️', weight: '15%', score: Math.round(m.decision * 100), contrib: (m.decision * w.decision * 100).toFixed(1) },
      { name: 'Terrain Navigation & Mapping', icon: '🧭', weight: '10%', score: Math.round(m.navigation * 100), contrib: (m.navigation * w.navigation * 100).toFixed(1) },
      { name: 'Teamwork & Flight Protocols', icon: '🤝', weight: '10%', score: Math.round(m.teamwork * 100), contrib: (m.teamwork * w.teamwork * 100).toFixed(1) },
    ];

    const rowsHTML = rows.map(r => `
      <div class="receipt-row">
        <div class="receipt-row-name"><span class="receipt-icon">${r.icon}</span> ${r.name} <span class="receipt-weight">(${r.weight})</span></div>
        <div class="receipt-row-val">${r.score}% <span class="receipt-contrib">+${r.contrib} pts</span></div>
      </div>
    `).join('');

    modal.innerHTML = `
      <div class="receipt-header">
        <div class="receipt-badge">★ NASA EXPEDITION EVALUATION RECEIPT ★</div>
        <h2 class="receipt-title">${missionName}</h2>
        <div class="receipt-sub">Itemized Operational Trade-off Scoring Rubric</div>
      </div>
      <div class="receipt-body">
        <div class="receipt-rows-container">
          ${rowsHTML}
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-total-row">
          <span class="total-label">FINAL SCORE:</span>
          <span class="total-score">${res.total} / 100</span>
        </div>
        <div class="receipt-grade-badge">${res.grade}</div>
      </div>
      <div class="receipt-footer">
        <button id="btn-receipt-continue" class="receipt-btn-continue">PROCEED TO EXPEDITION HUB ▶</button>
      </div>
    `;

    modal.classList.add('visible');
    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) backdrop.classList.add('visible');

    this.engine.audio.playSuccess();

    const btn = document.getElementById('btn-receipt-continue');
    if (btn) {
      btn.onclick = () => {
        modal.classList.remove('visible');
        if (backdrop) backdrop.classList.remove('visible');
        if (onContinue) onContinue();
        else this.engine.setState('DESTINATION');
      };
    }
  }

  reset() {
    this.metrics = {
      safety: 1.0,
      resource: 1.0,
      science: 0.8,
      decision: 0.9,
      navigation: 0.85,
      teamwork: 1.0
    };
  }
}
