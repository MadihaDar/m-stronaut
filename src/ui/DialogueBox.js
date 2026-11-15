import { CHARACTERS } from '../data/characters.js';
import { audio } from '../engine/AudioManager.js';

export class DialogueBox {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.queue = [];
    this.current = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'dialogue-overlay hidden';
    this.element.innerHTML = `
      <div class="dialogue-box" id="dialogue-card">
        <div class="dialogue-avatar" id="dialogue-avatar">👨‍🚀</div>
        <div class="dialogue-content">
          <div class="dialogue-speaker-row">
            <span class="dialogue-speaker" id="dialogue-speaker">ALEX MORGAN</span>
            <span class="dialogue-role" id="dialogue-role">MISSION COMMANDER</span>
            <span class="dialogue-radio-fx">COMMS • ONLINE</span>
          </div>
          <div class="dialogue-text" id="dialogue-text">
            Welcome to the Frontier Mission Academy training simulation!
          </div>
        </div>
        <button class="dialogue-btn-next" id="dialogue-next">
          NEXT ❯
        </button>
      </div>
    `;

    this.element.querySelector('#dialogue-next').addEventListener('click', () => {
      audio.playRadioChirp();
      this.advance();
    });
  }

  showDialogue(dialogueObj) {
    this.queue.push(dialogueObj);
    if (!this.current) {
      this.advance();
    }
  }

  advance() {
    if (this.queue.length === 0) {
      this.current = null;
      this.element.classList.add('hidden');
      return;
    }

    this.current = this.queue.shift();
    const c = CHARACTERS[this.current.characterId] || CHARACTERS.alex;

    const card = this.element.querySelector('#dialogue-card');
    card.style.borderLeftColor = c.accentColor;

    const avatar = this.element.querySelector('#dialogue-avatar');
    avatar.textContent = c.avatarEmoji;
    avatar.style.background = `${c.accentColor}22`;
    avatar.style.borderColor = c.accentColor;

    this.element.querySelector('#dialogue-speaker').textContent = c.name.toUpperCase();
    this.element.querySelector('#dialogue-speaker').style.color = c.accentColor;
    this.element.querySelector('#dialogue-role').textContent = c.role.toUpperCase();
    this.element.querySelector('#dialogue-text').textContent = this.current.message;

    audio.playRadioChirp();
    this.element.classList.remove('hidden');
  }

  hide() {
    this.queue = [];
    this.current = null;
    this.element.classList.add('hidden');
  }
}
