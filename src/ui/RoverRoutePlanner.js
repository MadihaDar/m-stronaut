import { storage } from '../engine/StorageManager.js';
import { audio } from '../engine/AudioManager.js';

export class RoverRoutePlanner {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.routes = [
      {
        id: 'route_ridge',
        name: 'Route 1: North Ridge Highway (Safe Traverse)',
        distanceKm: 4.8,
        meanSlopeDeg: 3.8,
        maxSlopeDeg: 7.2,
        normalizedSlope: 0.19,
        normalizedRisk: 0.15,
        slopeWeight: 1.5,
        riskWeight: 2.0,
        batteryConsumptionPct: 18,
        safetyRating: 'A+ (OPTIMAL)',
        hazardDesc: 'Follows smooth elevated crest. Ample continuous solar illumination for rover recharge.',
        isSafe: true
      },
      {
        id: 'route_gully',
        name: 'Route 2: Direct Gully Descent (High Hazard)',
        distanceKm: 2.9,
        meanSlopeDeg: 14.5,
        maxSlopeDeg: 21.8,
        normalizedSlope: 0.725,
        normalizedRisk: 0.85,
        slopeWeight: 1.5,
        riskWeight: 2.0,
        batteryConsumptionPct: 34,
        safetyRating: 'D (CRITICAL ROLLOVER RISK)',
        hazardDesc: 'Direct short path cuts across a 21° loose regolith slope. High slip & wheel entrapment hazard.',
        isSafe: false
      }
    ];

    // Compute route costs using heuristic formula
    this.routes.forEach((r) => {
      r.calculatedCost = (
        r.distanceKm * (1 + r.slopeWeight * r.normalizedSlope + r.riskWeight * r.normalizedRisk)
      ).toFixed(2);
    });

    this.selectedRouteId = 'route_ridge';
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-route-planner';

    this.element.innerHTML = `
      <div class="modal-content route-modal">
        <div class="modal-header">
          <h2>🧭 ROVER ROUTE TRAVERSAL PLANNER</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="route-formula-banner">
          <span class="f-lbl">Gameplay Route Cost Heuristic:</span>
          <code>route_cost = distance × (1 + 1.5 × norm_slope + 2.0 × norm_risk)</code>
          <p class="f-note">⚠️ Note: This is an educational gameplay heuristic based on LOLA slope telemetry, not an official NASA navigation equation.</p>
        </div>

        <div class="routes-comparison-grid">
          ${this.routes
            .map(
              (r) => `
            <div class="route-card ${r.id === this.selectedRouteId ? 'selected' : ''}" data-route="${r.id}">
              <div class="route-card-header">
                <h3>${r.name}</h3>
                <span class="route-badge ${r.isSafe ? 'badge-safe' : 'badge-danger'}">${r.safetyRating}</span>
              </div>

              <div class="route-metrics">
                <div class="metric-box">
                  <span class="m-label">Traverse Distance:</span>
                  <span class="m-val">${r.distanceKm} km</span>
                </div>
                <div class="metric-box">
                  <span class="m-label">Average Slope:</span>
                  <span class="m-val">${r.meanSlopeDeg}°</span>
                </div>
                <div class="metric-box">
                  <span class="m-label">Max Crest Angle:</span>
                  <span class="m-val">${r.maxSlopeDeg}°</span>
                </div>
                <div class="metric-box">
                  <span class="m-label">Calculated Route Cost:</span>
                  <span class="m-val highlight-val">${r.calculatedCost}</span>
                </div>
              </div>

              <p class="route-desc">${r.hazardDesc}</p>

              <button class="btn btn-primary btn-block btn-choose-route" data-select="${r.id}">
                ${r.id === this.selectedRouteId ? '✓ ROUTE SELECTED' : 'SELECT THIS TRAVERSE'}
              </button>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="educational-insight-box">
          <div class="insight-title">💡 Junior Commander Lesson: Why Shortest is NOT Safest!</div>
          <p>Route 2 is 1.9 km shorter, but its steep 21° incline forces the rover motors to consume double the battery power and introduces a dangerous rollover risk. Route 1 has a lower calculated route cost (${this.routes[0].calculatedCost} vs ${this.routes[1].calculatedCost}) because flat gentle terrain is vastly safer for planetary exploration!</p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-confirm-route">CONFIRM NAVIGATION PLAN</button>
          <button class="btn btn-secondary" data-close>CANCEL</button>
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

    this.element.querySelectorAll('.btn-choose-route').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        audio.playClick();
        const id = e.target.getAttribute('data-select');
        this.selectRoute(id);
      });
    });

    this.element.querySelector('#btn-confirm-route').addEventListener('click', () => {
      audio.playClick();
      const chosen = this.routes.find((r) => r.id === this.selectedRouteId);
      if (chosen.isSafe) {
        storage.state.scoreBreakdown.navigation = Math.min(1.0, storage.state.scoreBreakdown.navigation + 0.3);
        storage.state.scoreBreakdown.decision = Math.min(1.0, storage.state.scoreBreakdown.decision + 0.25);
        storage.save();
        this.uiManager.dialogueBox.showDialogue({
          characterId: 'leo',
          message: 'Excellent navigation call, Commander! North Ridge Highway keeps our rover wheels firmly planted and saves our battery reserve.'
        });
      } else {
        storage.state.scoreBreakdown.safety = Math.max(0.4, storage.state.scoreBreakdown.safety - 0.3);
        storage.save();
        this.uiManager.dialogueBox.showDialogue({
          characterId: 'leo',
          message: 'Warning Commander! The rover wheels experienced 40% slip in the gully scree. We made it, but safety margins were dangerously low!'
        });
      }
      this.hide();
    });
  }

  selectRoute(id) {
    this.selectedRouteId = id;
    this.element.querySelectorAll('.route-card').forEach((card) => {
      const match = card.getAttribute('data-route') === id;
      card.classList.toggle('selected', match);
      card.querySelector('.btn-choose-route').textContent = match ? '✓ ROUTE SELECTED' : 'SELECT THIS TRAVERSE';
    });
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
