import { CHARACTERS } from '../data/characters.js';
import { storage } from '../engine/StorageManager.js';
import { audio } from '../engine/AudioManager.js';

export class CharacterDossier {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.activeId = storage.state.activeCharacter || 'alex';
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-crew';

    const chars = Object.values(CHARACTERS);

    this.element.innerHTML = `
      <div class="modal-content crew-modal">
        <div class="modal-header">
          <h2>👨‍🚀 MISSION CREW DOSSIERS</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="crew-tabs">
          ${chars
            .map(
              (c) => `
            <button class="crew-tab-btn ${c.id === this.activeId ? 'active' : ''}" data-char="${c.id}" style="--accent: ${c.accentColor}">
              <span class="tab-emoji">${c.avatarEmoji}</span>
              <span class="tab-name">${c.name.split(' ')[0]}</span>
            </button>
          `
            )
            .join('')}
        </div>

        <div class="crew-detail-container" id="crew-detail-view">
          ${this.renderDetailHtml(CHARACTERS[this.activeId])}
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-select-active-char">SELECT AS ACTIVE ASTRONAUT</button>
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

    this.element.querySelectorAll('.crew-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-char');
        this.selectTab(id);
      });
    });

    this.element.querySelector('#btn-select-active-char').addEventListener('click', () => {
      audio.playClick();
      storage.state.activeCharacter = this.activeId;
      storage.save();
      this.uiManager.onCharacterChanged(this.activeId);
      this.hide();
    });
  }

  selectTab(charId) {
    audio.playClick();
    this.activeId = charId;
    this.element.querySelectorAll('.crew-tab-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-char') === charId);
    });
    const view = this.element.querySelector('#crew-detail-view');
    view.innerHTML = this.renderDetailHtml(CHARACTERS[charId]);
  }

  renderDetailHtml(c) {
    return `
      <div class="crew-card-active" style="border-left: 6px solid ${c.accentColor};">
        <div class="crew-header-info">
          <div class="crew-avatar-large" style="background: ${c.accentColor}22; border-color: ${c.accentColor};">
            ${c.avatarEmoji}
          </div>
          <div>
            <div class="crew-badge" style="background: ${c.accentColor}33; color: ${c.accentColor};">${c.badge}</div>
            <h3>${c.name}</h3>
            <p class="crew-role">${c.role} ${c.age ? `• Age ${c.age}` : ''}</p>
          </div>
        </div>

        <div class="crew-traits">
          ${c.traits.map((t) => `<span class="trait-pill">${t}</span>`).join('')}
        </div>

        <div class="crew-section">
          <h4>Background & Expertise:</h4>
          <p>${c.bio}</p>
        </div>

        <div class="crew-section">
          <h4>Standard Equipment:</h4>
          <p class="equipment-text">🛠️ ${c.equipment}</p>
        </div>

        <div class="crew-section">
          <h4>Gameplay & Training Role:</h4>
          <p>${c.gameplayRole}</p>
        </div>

        <blockquote class="crew-quote" style="border-left-color: ${c.accentColor};">
          "${c.quote}"
        </blockquote>
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
