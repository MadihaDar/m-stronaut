/* ============================================================
   FRONTIER: MISSION ACADEMY — Dialogue System
   ============================================================ */

import { DIALOGUES, parseDialogueText } from '../data/dialogues.js';

export class DialogueSystem {
  constructor(engine) {
    this.engine = engine;

    this.currentDialogue = null;
    this.lineIndex = 0;
    this.onCompleteCallback = null;
    this.waitingForChoice = false;

    // Typewriter state
    this.fullText = '';
    this.parsedText = '';
    this.revealedChars = 0;
    this.typingSpeed = 45; // characters per second
    this.typingDone = false;
  }

  play(dialogueId, onComplete = null) {
    const dialogue = DIALOGUES[dialogueId];
    if (!dialogue) {
      console.warn(`[DialogueSystem] Dialogue "${dialogueId}" not found.`);
      if (onComplete) onComplete();
      return;
    }

    this.currentDialogue = dialogue;
    this.lineIndex = 0;
    this.onCompleteCallback = onComplete;
    this.waitingForChoice = false;

    this.engine.showPanel('dialogue-panel');
    this.engine.emit('dialogue:start', { id: dialogueId });

    this._setupLine();
  }

  _setupLine() {
    if (!this.currentDialogue) return;
    const line = this.currentDialogue.lines[this.lineIndex];
    if (!line) {
      this.end();
      return;
    }

    this.fullText = line.text;
    this.parsedText = parseDialogueText(line.text);
    this.revealedChars = 0;
    this.typingDone = false;
    this.waitingForChoice = false;

    this.engine.emit('dialogue:line', {
      speaker: line.speaker,
      text: line.text,
      parsedText: this.parsedText,
      choices: line.choices || null,
      lineIndex: this.lineIndex,
      totalLines: this.currentDialogue.lines.length
    });
  }

  update(dt) {
    if (!this.isPlaying() || this.typingDone) return;

    this.revealedChars += this.typingSpeed * dt;
    if (this.revealedChars >= this.fullText.length) {
      this.revealedChars = this.fullText.length;
      this.typingDone = true;
      this.engine.emit('dialogue:typingComplete');
    }
  }

  next() {
    if (!this.isPlaying()) return;

    // If still typing, immediately fast-forward to full line
    if (!this.typingDone) {
      this.revealedChars = this.fullText.length;
      this.typingDone = true;
      this.engine.emit('dialogue:typingComplete');
      return;
    }

    const currentLine = this.currentDialogue.lines[this.lineIndex];

    // If waiting for choice selection, don't advance automatically
    if (currentLine && currentLine.choices && currentLine.choices.length > 0) {
      this.waitingForChoice = true;
      return;
    }

    this.lineIndex++;
    if (this.lineIndex < this.currentDialogue.lines.length) {
      this._setupLine();
    } else {
      this.end();
    }
  }

  choose(choiceIndex) {
    if (!this.isPlaying()) return;
    const currentLine = this.currentDialogue.lines[this.lineIndex];
    if (!currentLine || !currentLine.choices) return;

    const choice = currentLine.choices[choiceIndex];
    if (!choice) return;

    // Apply any physical resource trade-offs from dialogue decisions
    if (choice.applyResources && this.engine.resources) {
      for (const [key, delta] of Object.entries(choice.applyResources)) {
        this.engine.resources.modify(key, delta, choice.text);
      }
      if (this.engine.hud) this.engine.hud.update();
    }
    if (choice.onSelected) {
      choice.onSelected();
    }

    if (choice.goto) {
      this.play(choice.goto, this.onCompleteCallback);
    } else {
      this.lineIndex++;
      if (this.lineIndex < this.currentDialogue.lines.length) {
        this._setupLine();
      } else {
        this.end();
      }
    }
  }

  skip() {
    this.end();
  }

  end() {
    if (!this.currentDialogue) return;
    const id = this.currentDialogue.id;
    this.currentDialogue = null;
    this.lineIndex = 0;
    this.waitingForChoice = false;

    this.engine.hidePanel('dialogue-panel');
    this.engine.emit('dialogue:end', { id });

    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }

  isPlaying() {
    return this.currentDialogue !== null;
  }
}
