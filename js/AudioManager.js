/* ============================================================
   FRONTIER: MISSION ACADEMY — Audio Manager
   Procedural Web Audio sound generation for browser game
   ============================================================ */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.masterGain = null;
    this.initialized = false;

    this.musicVol = 0.5;
    this.sfxVol = 0.75;

    // Continuous atmosphere nodes
    this.ambienceRunning = false;
    this.ambienceNodes = [];
  }

  init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Music sub-bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Sound Effects sub-bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Resume context if browser started it suspended
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      this.initialized = true;
      this._startAtmosphere();
      console.log('[AudioManager] Audio engine initialized. Context state:', this.ctx.state);
    } catch (e) {
      console.warn('[AudioManager] Web Audio init failed:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMusicVolume(vol) {
    this.musicVol = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVol, this.ctx.currentTime, 0.05);
    }
  }

  setSFXVolume(vol) {
    this.sfxVol = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVol, this.ctx.currentTime, 0.05);
    }
  }

  playTone(freq, duration = 0.1, type = 'sine', gainVal = 0.3) {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      // Smooth attack and release envelope to prevent clicking
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gainVal, now + 0.01);
      gain.gain.linearRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) {
      console.warn('[AudioManager] playTone error:', e);
    }
  }

  playClick() {
    this.playUIClick();
  }

  playUIClick() {
    this.ensureContext();
    // High-tech sci-fi double-beep
    this.playTone(660, 0.05, 'triangle', 0.28);
    setTimeout(() => {
      this.playTone(920, 0.09, 'sine', 0.32);
    }, 45);
  }

  playUIHover() {
    this.ensureContext();
    this.playTone(520, 0.03, 'sine', 0.08);
  }

  playSuccess() {
    this.ensureContext();
    // 4-note ascending triumph chord (C5 - E5 - G5 - C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.22, 'sine', 0.28);
      }, idx * 75);
    });
  }

  playFanfare() {
    this.ensureContext();
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.35, 'triangle', 0.32);
      }, idx * 90);
    });
  }

  playWarning() {
    this.ensureContext();
    this.playTone(440, 0.18, 'sawtooth', 0.3);
    setTimeout(() => {
      this.playTone(370, 0.22, 'sawtooth', 0.3);
    }, 150);
  }

  playScannerBeep() {
    this.ensureContext();
    this.playTone(1100, 0.07, 'sine', 0.25);
    setTimeout(() => {
      this.playTone(1650, 0.12, 'sine', 0.3);
    }, 70);
  }

  playRoverEnginePulse() {
    this.ensureContext();
    this.playTone(95, 0.12, 'triangle', 0.15);
  }

  playQuindarTone() {
    this.ensureContext();
    // Authentic NASA 2525 Hz intro Quindar telemetry tone
    this.playTone(2525, 0.18, 'sine', 0.22);
  }

  playJumpSound() {
    this.ensureContext();
    this.playTone(280, 0.08, 'sine', 0.18);
    setTimeout(() => {
      this.playTone(420, 0.12, 'triangle', 0.2);
    }, 40);
  }

  playLandSound() {
    this.ensureContext();
    this.playTone(85, 0.14, 'triangle', 0.35);
  }

  playAirlockHiss() {
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 1.2;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.28 * this.sfxVolume;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start();
    } catch (e) {
      this.playTone(900, 0.3, 'sawtooth', 0.15);
    }
  }

  playThrusterRumble() {
    this.ensureContext();
    this.playTone(55, 0.35, 'sawtooth', 0.25);
    this.playTone(72, 0.35, 'triangle', 0.3);
  }

  playHeartbeat() {
    this.ensureContext();
    this.playTone(60, 0.09, 'sine', 0.4);
    setTimeout(() => {
      this.playTone(52, 0.12, 'sine', 0.35);
    }, 120);
  }

  playDamageSting() {
    this.ensureContext();
    this.playTone(180, 0.2, 'sawtooth', 0.35);
    this.playTone(120, 0.3, 'sawtooth', 0.35);
  }

  playEmergencySiren() {
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.7);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.75);
    } catch (e) {
      this.playTone(800, 0.3, 'sawtooth', 0.35);
    }
  }

  /* ── Continuous Cinematic Deep-Space Soundscape ── */
  _startAtmosphere() {
    if (!this.ctx || this.ambienceRunning) return;
    this.ambienceRunning = true;

    try {
      const now = this.ctx.currentTime;

      // 1. Warm space pad chords: D3 (146.8 Hz) & A3 (220 Hz) & F3 (174.6 Hz)
      const chordFrequencies = [146.83, 174.61, 220.00];

      // Master lowpass filter with slow breath
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(2.0, now);

      // Low frequency oscillator (LFO) for breathing aurora effect
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, now); // 0.12 Hz cycle (approx 8 seconds)
      lfoGain.gain.setValueAtTime(180, now);   // sweep range +/- 180 Hz
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(now);
      this.ambienceNodes.push(lfo);

      // Atmosphere main gain
      const padGain = this.ctx.createGain();
      padGain.gain.setValueAtTime(0.001, now);
      padGain.gain.linearRampToValueAtTime(0.18, now + 3.0); // Fade in over 3s
      filter.connect(padGain);
      padGain.connect(this.musicGain);

      // Spawn drone oscillators
      chordFrequencies.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        osc.type = idx === 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Subtle detune for shimmer
        osc.detune.setValueAtTime((idx - 1) * 6, now);

        osc.connect(filter);
        osc.start(now);
        this.ambienceNodes.push(osc);
      });

      console.log('[AudioManager] Continuous space atmosphere synthesizer active');
    } catch (e) {
      console.warn('[AudioManager] Failed to start atmosphere:', e);
    }
  }
}
