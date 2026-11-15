import { storage } from '../engine/StorageManager.js';
import { audio } from '../engine/AudioManager.js';

export class SettingsModal {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-settings';

    const s = storage.state.settings;

    this.element.innerHTML = `
      <div class="modal-content settings-modal">
        <div class="modal-header">
          <h2>⚙️ SETTINGS & ACCESSIBILITY</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="settings-group">
          <h3>🔊 Audio Volumes</h3>
          <div class="setting-row">
            <label for="set-master">Master Volume:</label>
            <input type="range" id="set-master" min="0" max="1" step="0.05" value="${s.masterVolume}">
            <span class="range-val" id="val-master">${Math.round(s.masterVolume * 100)}%</span>
          </div>
          <div class="setting-row">
            <label for="set-sfx">Sound Effects & Telemetry:</label>
            <input type="range" id="set-sfx" min="0" max="1" step="0.05" value="${s.sfxVolume}">
            <span class="range-val" id="val-sfx">${Math.round(s.sfxVolume * 100)}%</span>
          </div>
          <div class="setting-row">
            <label for="set-music">Ambient Drone & Music:</label>
            <input type="range" id="set-music" min="0" max="1" step="0.05" value="${s.musicVolume}">
            <span class="range-val" id="val-music">${Math.round(s.musicVolume * 100)}%</span>
          </div>
        </div>

        <div class="settings-group">
          <h3>👁️ Accessibility & Display</h3>
          <div class="setting-row">
            <label for="set-subtitles">Crew Dialogue Subtitles:</label>
            <input type="checkbox" id="set-subtitles" ${s.subtitles ? 'checked' : ''}>
          </div>
          <div class="setting-row">
            <label for="set-font">Text Size (Junior Friendly):</label>
            <select id="set-font">
              <option value="normal" ${s.fontSize === 'normal' ? 'selected' : ''}>Standard (Default)</option>
              <option value="large" ${s.fontSize === 'large' ? 'selected' : ''}>Large & Readable</option>
            </select>
          </div>
          <div class="setting-row">
            <label for="set-colorblind">Color-Vision Assistance:</label>
            <select id="set-colorblind">
              <option value="none" ${s.colorBlindMode === 'none' ? 'selected' : ''}>Standard Colors</option>
              <option value="deuteranopia" ${s.colorBlindMode === 'deuteranopia' ? 'selected' : ''}>Deuteranopia (Green-Safe)</option>
              <option value="protanopia" ${s.colorBlindMode === 'protanopia' ? 'selected' : ''}>Protanopia (Red-Safe)</option>
              <option value="high_contrast" ${s.colorBlindMode === 'high_contrast' ? 'selected' : ''}>High Contrast Outlines</option>
            </select>
          </div>
        </div>

        <div class="settings-group danger-group">
          <h3>💾 Local Progress & Guest Save</h3>
          <p class="setting-info">Progress is saved safely in your browser (LocalStorage). No passwords or accounts required.</p>
          <button class="btn btn-danger" id="btn-reset-save">⚠️ RESET ALL PROGRESS</button>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" data-close>SAVE & CLOSE</button>
        </div>
      </div>
    `;

    // Audio bindings
    const masterSlider = this.element.querySelector('#set-master');
    const sfxSlider = this.element.querySelector('#set-sfx');
    const musicSlider = this.element.querySelector('#set-music');

    masterSlider.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      storage.setSetting('masterVolume', v);
      this.element.querySelector('#val-master').textContent = `${Math.round(v * 100)}%`;
    });

    sfxSlider.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      storage.setSetting('sfxVolume', v);
      this.element.querySelector('#val-sfx').textContent = `${Math.round(v * 100)}%`;
      audio.playClick();
    });

    musicSlider.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      storage.setSetting('musicVolume', v);
      this.element.querySelector('#val-music').textContent = `${Math.round(v * 100)}%`;
    });

    // Subtitles
    this.element.querySelector('#set-subtitles').addEventListener('change', (e) => {
      storage.setSetting('subtitles', e.target.checked);
      audio.playClick();
    });

    // Font size
    this.element.querySelector('#set-font').addEventListener('change', (e) => {
      const v = e.target.value;
      storage.setSetting('fontSize', v);
      document.body.classList.toggle('large-text', v === 'large');
      audio.playClick();
    });

    // Color blind
    this.element.querySelector('#set-colorblind').addEventListener('change', (e) => {
      const v = e.target.value;
      storage.setSetting('colorBlindMode', v);
      this.uiManager.applyColorBlindMode(v);
      audio.playClick();
    });

    // Reset progress
    this.element.querySelector('#btn-reset-save').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all training progress and collected science findings?')) {
        storage.resetAllProgress();
        audio.playClick();
        alert('All training data reset successfully.');
        location.reload();
      }
    });

    // Close buttons
    this.element.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.hide();
      });
    });
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
