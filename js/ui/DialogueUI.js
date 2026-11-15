/* ============================================================
   FRONTIER: MISSION ACADEMY — Dialogue UI Module
   Typewriter text renderer, character portraits & decision branching
   ============================================================ */

import { CHARACTERS } from '../data/characters.js';

export class DialogueUI {
  constructor(engine) {
    this.engine = engine;

    this.panel = document.getElementById('dialogue-panel');
    this.portrait = document.getElementById('dialogue-portrait');
    this.speakerLabel = document.getElementById('dialogue-speaker-label');
    this.speakerName = document.getElementById('dialogue-speaker-name');
    this.speakerRole = document.getElementById('dialogue-speaker-role');
    this.dialogueText = document.getElementById('dialogue-text');
    this.choicesContainer = document.getElementById('dialogue-choices');
    this.btnNext = document.getElementById('dialogue-next');
    this.btnSkip = document.getElementById('dialogue-skip');

    this._bindEvents();
  }

  _bindEvents() {
    if (this.btnNext) {
      this.btnNext.onclick = () => {
        this.engine.audio.playUIClick();
        this.engine.dialogue.next();
      };
    }

    if (this.btnSkip) {
      this.btnSkip.onclick = () => {
        this.engine.audio.playUIClick();
        this.engine.dialogue.skip();
      };
    }

    this.engine.on('dialogue:line', (data) => {
      this._renderLine(data);
    });

    this.engine.on('dialogue:typingComplete', () => {
      if (this.dialogueText) {
        this.dialogueText.classList.add('typing-done');
        // Render full parsed HTML with science badges
        if (this.engine.dialogue) {
          this.dialogueText.innerHTML = this.engine.dialogue.parsedText;
        }
      }
    });

    this.engine.on('dialogue:end', () => {
      if (this.choicesContainer) this.choicesContainer.innerHTML = '';
    });
  }

  _renderLine(data) {
    const char = CHARACTERS[data.speaker] || {
      name: 'Unknown',
      role: 'Crew',
      emoji: '👤',
      cssClass: 'alex'
    };

    // Update portrait
    if (this.portrait) {
      this.portrait.textContent = char.emoji;
      this.portrait.className = `dialogue-portrait ${char.cssClass}-portrait`;
    }

    // Update speaker header
    if (this.speakerLabel) {
      this.speakerLabel.textContent = char.role.split(' ')[0];
      this.speakerLabel.className = `dialogue-speaker-label ${char.cssClass}-label`;
    }
    if (this.speakerName) {
      this.speakerName.textContent = char.name;
    }
    if (this.speakerRole) {
      this.speakerRole.textContent = `· ${char.role}`;
    }

    // Clear previous choices
    if (this.choicesContainer) {
      this.choicesContainer.innerHTML = '';
    }

    // Start typewriter
    if (this.dialogueText) {
      this.dialogueText.classList.remove('typing-done');
      this.dialogueText.textContent = '';
    }

    // Render choice buttons if any
    if (data.choices && data.choices.length > 0) {
      data.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'dialogue-choice-btn';
        btn.innerHTML = `<span class="choice-number">${index + 1}</span> <span>${choice.text}</span>`;
        btn.onclick = () => {
          this.engine.audio.playUIClick();
          this.engine.dialogue.choose(index);
        };
        this.choicesContainer.appendChild(btn);
      });
    }
  }

  update() {
    // Typewriter progress text update
    const dialogue = this.engine.dialogue;
    if (!dialogue || !dialogue.isPlaying() || dialogue.typingDone) return;

    if (this.dialogueText) {
      const chars = Math.floor(dialogue.revealedChars);
      this.dialogueText.textContent = dialogue.fullText.slice(0, chars);
    }
  }
}
