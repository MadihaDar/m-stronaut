import { storage } from '../../engine/StorageManager.js';
import { ScoringSystem } from '../../engine/ScoringSystem.js';
import { audio } from '../../engine/AudioManager.js';

export class MultipleEndingsModal {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-endings';

    this.element.innerHTML = `
      <div class="modal-content ending-modal">
        <div class="modal-header">
          <h2>🏆 MARS CAMPAIGN EXPEDITION DEBRIEF</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="ending-body" id="ending-content-view">
          <!-- Injected dynamically -->
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-ending-return">RETURN TO MISSION ACADEMY</button>
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

    this.element.querySelector('#btn-ending-return').addEventListener('click', () => {
      audio.playClick();
      this.hide();
      this.uiManager.openMainMenu();
    });
  }

  showOutcome() {
    audio.playDiscovery();
    const mars = storage.state.marsState;
    const scoreRes = ScoringSystem.calculate(storage.state.scoreBreakdown);

    // Determine ending
    let endingId = 'ENDING_A';
    let endingTitle = 'ENDING A — EXCELLENT RETURN';
    let endingSubtitle = 'Flawless Command, High Science Yield & Safe Return';
    let endingBadge = 'MASTER MARS EXPLORER';
    let endingNarrative =
      'Congratulations, Commander! You established a thriving habitat in Jezero Crater, maintained balanced power and water recycling loops, collected verified geological core samples, and brought the entire crew safely home to Earth with rich scientific discoveries.';

    if (scoreRes.isSafetyFailed || mars.crewHealth < 40) {
      endingId = 'ENDING_D';
      endingTitle = 'ENDING D — MISSION REVIEW REQUIRED';
      endingSubtitle = 'Safety Margins Compromised During Expedition';
      endingBadge = 'OPERATIONAL SAFETY RETRY';
      endingNarrative =
        'The flight review board has flagged critical safety threshold breaches. Remember: on Mars, no scientific rock sample is worth compromising crew health or life-support reserves. Review your power and radiation shelter protocols, and attempt the expedition again!';
    } else if (mars.departureDelayChosen) {
      endingId = 'ENDING_C';
      endingTitle = 'ENDING C — DELAYED RETURN (PATIENT COMMANDER)';
      endingSubtitle = 'Safety Buffer Prioritized Over Speed';
      endingBadge = 'PRUDENT FLIGHT LEADER';
      endingNarrative =
        'By holding launch until space-weather conditions were calm, you consumed slightly more stored habitat supplies but protected the spacecraft avionics and crew from solar storm interference. All astronauts returned safely to Earth!';
    } else if (mars.cargoChoice === 'supplies') {
      endingId = 'ENDING_B';
      endingTitle = 'ENDING B — SUCCESSFUL RETURN, CONSERVATIVE PAYLOAD';
      endingSubtitle = 'Safety-First Logistics Yield';
      endingBadge = 'CREW GUARDIAN COMMANDER';
      endingNarrative =
        'You chose maximum life-support backup spares over raw sample mass. While fewer rock cores were returned to terrestrial laboratories, your conservative planning ensured redundant life-support systems throughout the 6-month interplanetary cruise.';
    }

    storage.completeM02(endingId);

    const container = this.element.querySelector('#ending-content-view');
    container.innerHTML = `
      <div class="ending-card ${endingId === 'ENDING_D' ? 'ending-review' : 'ending-success'}">
        <div class="ending-badge-top">${endingBadge}</div>
        <h2 class="ending-title">${endingTitle}</h2>
        <p class="ending-sub">${endingSubtitle}</p>
        
        <div class="ending-story-box">
          <p>${endingNarrative}</p>
        </div>

        <div class="ending-stats-grid">
          <div class="stat-pill">
            <span>Overall Mission Score:</span>
            <strong>${scoreRes.totalScore} / 100</strong>
          </div>
          <div class="stat-pill">
            <span>Crew Safety Gate:</span>
            <strong style="color: ${scoreRes.breakdown.safety >= 70 ? 'var(--accent-green)' : 'var(--accent-red)'};">
              ${scoreRes.breakdown.safety}% (${scoreRes.breakdown.safety >= 70 ? 'Passed' : 'Breached'})
            </strong>
          </div>
          <div class="stat-pill">
            <span>Resource Management:</span>
            <strong>${scoreRes.breakdown.resource}%</strong>
          </div>
          <div class="stat-pill">
            <span>Scientific Quality:</span>
            <strong>${scoreRes.breakdown.science}%</strong>
          </div>
          <div class="stat-pill">
            <span>Cargo Payload:</span>
            <strong>${mars.cargoWeightKg} kg [${mars.cargoChoice.toUpperCase()}]</strong>
          </div>
          <div class="stat-pill">
            <span>Water Extraction:</span>
            <strong>Active (+12.4 L/sol)</strong>
          </div>
        </div>

        <div class="educational-takeaway">
          💡 <strong>Core Educational Takeaway:</strong> A successful planetary mission is not measured by speed or how many rocks you pick up. It is measured by the safety, wisdom, evidence-based decisions, and teamwork that brings every single astronaut home.
        </div>
      </div>
    `;

    this.show();
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
