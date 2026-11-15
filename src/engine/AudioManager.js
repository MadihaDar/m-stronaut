import { storage } from './StorageManager.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.droneGain = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.initialized = true;
      this.startAmbientDrone();
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getMasterVol() {
    return storage.getSetting('masterVolume') ?? 0.8;
  }

  getSfxVol() {
    return (storage.getSetting('sfxVolume') ?? 0.9) * this.getMasterVol();
  }

  getMusicVol() {
    return (storage.getSetting('musicVolume') ?? 0.6) * this.getMasterVol();
  }

  playClick() {
    this.ensureContext();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.12 * this.getSfxVol(), this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playUIClick() {
    this.playClick();
  }

  playUIHover() {
    // subtle hover sound
  }

  playScan() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.15);
    osc.frequency.linearRampToValueAtTime(1320, now + 0.3);
    gain.gain.setValueAtTime(0.15 * this.getSfxVol(), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playDiscovery() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.15 * this.getSfxVol(), now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  }

  playRadioChirp() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(850, now + 0.04);
    gain.gain.setValueAtTime(0.08 * this.getSfxVol(), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playSuccess() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.18 * this.getSfxVol(), now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.28);
    });
  }

  playFanfare() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 880, 1108.73];
    const times = [0, 0.12, 0.24, 0.36, 0.52, 0.7];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + times[idx]);
      gain.gain.setValueAtTime(0.2 * this.getSfxVol(), now + times[idx]);
      gain.gain.exponentialRampToValueAtTime(0.001, now + times[idx] + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + times[idx]);
      osc.stop(now + times[idx] + 0.45);
    });
  }

  playEat() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.12);
    gain.gain.setValueAtTime(0.15 * this.getSfxVol(), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playAlarm() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(600, now + 0.15);
    gain.gain.setValueAtTime(0.15 * this.getSfxVol(), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  startAmbientDrone() {
    if (!this.ctx || this.droneGain) return;
    try {
      const osc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A hum
      this.droneGain.gain.setValueAtTime(0.03 * this.getMusicVol(), this.ctx.currentTime);
      osc.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);
      osc.start();
    } catch (e) {
      console.warn('Ambient drone error:', e);
    }
  }

  setRoverEngineSound(isDriving, speedRatio = 0) {
    this.ensureContext();
    if (!this.ctx) return;
    if (isDriving) {
      if (!this.engineOsc) {
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(60, this.ctx.currentTime);
        this.engineGain.gain.setValueAtTime(0.02 * this.getSfxVol(), this.ctx.currentTime);
        this.engineOsc.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();
      }
      const targetFreq = 70 + speedRatio * 100;
      this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
      this.engineGain.gain.setTargetAtTime((0.03 + speedRatio * 0.05) * this.getSfxVol(), this.ctx.currentTime, 0.1);
    } else if (this.engineOsc) {
      try {
        this.engineGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.1);
        setTimeout(() => {
          if (this.engineOsc) {
            this.engineOsc.stop();
            this.engineOsc.disconnect();
            this.engineOsc = null;
            this.engineGain = null;
          }
        }, 120);
      } catch (e) {
        this.engineOsc = null;
      }
    }
  }
}

export const audio = new AudioManager();
