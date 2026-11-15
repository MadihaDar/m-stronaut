/* ============================================================
   FRONTIER: MISSION ACADEMY — Save Manager
   Persists game state to localStorage (no server required)
   Handles sequential campaign unlocking & self-healing save validation
   ============================================================ */

const STORAGE_KEY = 'frontier_save_v1';

export class SaveManager {
  constructor() {
    this._data = this._load();
  }

  /**
   * Helper to normalize mission IDs across the codebase
   * ('moon_m1', 'moonM1', 'MOON_M1', 'moon-m1' -> 'moon_m1')
   */
  normalizeMissionId(id) {
    if (!id || typeof id !== 'string') return '';
    const clean = id.trim().toLowerCase().replace(/[-_ ]+/g, '');
    if (clean === 'moonm0' || clean === 'moon0' || clean === 'moonorbit' || clean === 'orbit') return 'moon_m0';
    if (clean === 'moonm1' || clean === 'moon1') return 'moon_m1';
    if (clean === 'moonm2' || clean === 'moon2') return 'moon_m2';
    if (clean === 'moonm3' || clean === 'moon3') return 'moon_m3';
    if (clean === 'moonm4' || clean === 'moon4') return 'moon_m4';
    if (clean === 'moonm5' || clean === 'moon5') return 'moon_m5';
    if (clean === 'marsm0' || clean === 'mars0' || clean === 'marsorbit') return 'mars_m0';
    if (clean === 'marsm1' || clean === 'mars1') return 'mars_m1';
    if (clean === 'marsm2' || clean === 'mars2') return 'mars_m2';
    if (clean === 'marsm3' || clean === 'mars3') return 'mars_m3';
    if (clean === 'marsm4' || clean === 'mars4') return 'mars_m4';
    if (clean === 'marsm5' || clean === 'mars5') return 'mars_m5';
    return id.toLowerCase();
  }

  _load() {
    let data;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      data = raw ? JSON.parse(raw) : this._defaults();
    } catch {
      data = this._defaults();
    }

    return this._sanitizeAndHeal(data);
  }

  _defaults() {
    return {
      version: 2,
      firstLaunch: true,
      settings: {
        musicVolume: 0.5,
        sfxVolume: 0.7,
        subtitles: true,
        textSize: 'medium',   // 'small'|'medium'|'large'
        colorblind: false,
        advancedScience: false
      },
      progress: {
        // Strict sequential progression arrays: Mission 0 is the starting recon mission for Moon and Mars
        unlockedMissions: ['moon_m0', 'mars_m0'],
        completedMissions: [],
        unlocked: {
          moon_m0: true,
          moon_m1: false,
          moon_m2: false,
          moon_m3: false,
          moon_m4: false,
          moon_m5: false,
          mars_m0: true,
          mars_m1: false,
          mars_m2: false,
          mars_m3: false,
          mars_m4: false,
          mars_m5: false
        },
        completed: {
          moon_m0: false,
          moon_m1: false,
          moon_m2: false,
          moon_m3: false,
          moon_m4: false,
          moon_m5: false,
          mars_m0: false,
          mars_m1: false,
          mars_m2: false,
          mars_m3: false,
          mars_m4: false,
          mars_m5: false
        },
        // Persistent campaign resource entities across all missions
        campaignResources: null,
        missionSamples: {},
        moonMissionUnlocked: true,
        marsMissionUnlocked: true,
        sandboxVisited: false,
        findingsRecorded: [],
        samplesSecured: 0,
        dialoguesSeen: [],
        totalPlaytime: 0,
        marsM1: {
          currentStep: 1,
          completedSteps: [],
          playerPos: null,
          isOutside: false,
          missionComplete: false
        },
        marsM2: {
          completedSteps: [],
          missionComplete: false
        },
        moonM0: {
          missionComplete: false,
          selectedLandingZone: null
        },
        moonM1: {
          missionStage: null,
          reflectorDeployed: false,
          bunkerReached: false,
          missionComplete: false
        },
        moonM2: {
          missionStage: null,
          spectrometerDeployed: false,
          bunkerReached: false,
          missionComplete: false
        },
        moonM3: {
          missionStage: null,
          lidarDeployed: false,
          missionComplete: false
        },
        moonM4: {
          missionStage: null,
          iceExtracted: false,
          missionComplete: false
        },
        moonM5: {
          missionStage: null,
          arrayCalibrated: false,
          missionComplete: false
        }
      },
      lastSession: null
    };
  }

  /**
   * Self-healing validator: ensures strict sequential progression.
   * If a corrupt or legacy save skipped an index (e.g. M3 unlocked without M2 completed),
   * this sanitizes the state so ONLY valid unlocked missions remain unlocked.
   */
  _sanitizeAndHeal(data) {
    if (!data || !data.progress) {
      return this._defaults();
    }

    const p = data.progress;
    if (!Array.isArray(p.completedMissions)) p.completedMissions = [];
    if (!Array.isArray(p.unlockedMissions)) p.unlockedMissions = ['moon_m0', 'mars_m0'];
    if (!p.unlocked) p.unlocked = {};
    if (!p.completed) p.completed = {};

    // 1. Sync legacy booleans into completedMissions
    const legacyCompletions = [
      { key: 'moonM0', id: 'moon_m0' },
      { key: 'moonM1', id: 'moon_m1' },
      { key: 'moonM2', id: 'moon_m2' },
      { key: 'moonM3', id: 'moon_m3' },
      { key: 'moonM4', id: 'moon_m4' },
      { key: 'moonM5', id: 'moon_m5' },
      { key: 'marsM0', id: 'mars_m0' },
      { key: 'marsM1', id: 'mars_m1' },
      { key: 'marsM2', id: 'mars_m2' }
    ];

    legacyCompletions.forEach(({ key, id }) => {
      if (p[key]?.missionComplete && !p.completedMissions.includes(id)) {
        p.completedMissions.push(id);
      }
    });

    // 2. Strict Transitive Prerequisite Chain Validation
    // M0 is the ONLY unlocked lunar/martian mission at start.
    // M1 unlocks ONLY after M0 is completed.
    // M(N) unlocks strictly after M(N-1) is completed.
    const m0Done = p.completedMissions.includes('moon_m0') || Boolean(p.moonM0?.missionComplete);
    const m1Done = m0Done && (p.completedMissions.includes('moon_m1') || Boolean(p.moonM1?.missionComplete));
    const m2Done = m1Done && (p.completedMissions.includes('moon_m2') || Boolean(p.moonM2?.missionComplete));
    const m3Done = m2Done && (p.completedMissions.includes('moon_m3') || Boolean(p.moonM3?.missionComplete));
    const m4Done = m3Done && (p.completedMissions.includes('moon_m4') || Boolean(p.moonM4?.missionComplete));
    const m5Done = m4Done && (p.completedMissions.includes('moon_m5') || Boolean(p.moonM5?.missionComplete));
    const marsM0Done = p.completedMissions.includes('mars_m0') || Boolean(p.marsM0?.missionComplete);
    const marsM1Done = marsM0Done && (p.completedMissions.includes('mars_m1') || Boolean(p.marsM1?.missionComplete));
    const marsM2Done = marsM1Done && (p.completedMissions.includes('mars_m2') || Boolean(p.marsM2?.missionComplete));

    // Filter completedMissions to remove any invalid premature completions
    p.completedMissions = p.completedMissions.filter(id => {
      if (id === 'moon_m0' || id === 'mars_m0') return true;
      if (id === 'moon_m1') return m0Done;
      if (id === 'moon_m2') return m1Done;
      if (id === 'moon_m3') return m2Done;
      if (id === 'moon_m4') return m3Done;
      if (id === 'moon_m5') return m4Done;
      if (id === 'mars_m1') return marsM0Done;
      if (id === 'mars_m2') return marsM1Done;
      return false;
    });

    // Construct valid unlocked missions strictly based on prerequisites
    const validUnlocked = ['moon_m0', 'mars_m0'];
    if (m0Done) validUnlocked.push('moon_m1');
    if (m1Done) validUnlocked.push('moon_m2');
    if (m2Done) validUnlocked.push('moon_m3');
    if (m3Done) validUnlocked.push('moon_m4');
    if (m4Done) validUnlocked.push('moon_m5');
    if (marsM0Done) validUnlocked.push('mars_m1');
    if (marsM1Done) validUnlocked.push('mars_m2');

    p.unlockedMissions = validUnlocked;

    // Build boolean map for instant lookups
    p.unlocked = {
      moon_m0: true,
      moon_m1: m0Done,
      moon_m2: m1Done,
      moon_m3: m2Done,
      moon_m4: m3Done,
      moon_m5: m4Done,
      mars_m0: true,
      mars_m1: marsM0Done,
      mars_m2: marsM1Done
    };

    p.completed = {
      moon_m0: m0Done,
      moon_m1: m1Done,
      moon_m2: m2Done,
      moon_m3: m3Done,
      moon_m4: m4Done,
      moon_m5: m5Done,
      mars_m0: marsM0Done,
      mars_m1: marsM1Done,
      mars_m2: marsM2Done
    };

    // Keep legacy objects aligned
    if (p.moonM0) p.moonM0.missionComplete = p.completed.moon_m0;
    if (p.moonM1) p.moonM1.missionComplete = p.completed.moon_m1;
    if (p.moonM2) p.moonM2.missionComplete = p.completed.moon_m2;
    if (p.moonM3) p.moonM3.missionComplete = p.completed.moon_m3;
    if (p.moonM4) p.moonM4.missionComplete = p.completed.moon_m4;
    if (p.moonM5) p.moonM5.missionComplete = p.completed.moon_m5;
    if (p.marsM0) p.marsM0.missionComplete = p.completed.mars_m0;
    if (p.marsM1) p.marsM1.missionComplete = p.completed.mars_m1;
    if (p.marsM2) p.marsM2.missionComplete = p.completed.mars_m2;

    return data;
  }

  /**
   * Check if a mission is completed
   */
  isMissionCompleted(missionId) {
    const id = this.normalizeMissionId(missionId);
    if (!id) return false;
    return Boolean(this._data.progress.completed?.[id] || this._data.progress.completedMissions?.includes(id));
  }

  /**
   * Check if a mission is unlocked (enforces strict sequential prerequisites)
   */
  isMissionUnlocked(missionId) {
    const id = this.normalizeMissionId(missionId);
    if (id === 'moon_m0' || id === 'mars_m0') return true;
    if (id === 'moon_m1') return this.isMissionCompleted('moon_m0');
    if (id === 'moon_m2') return this.isMissionCompleted('moon_m1');
    if (id === 'moon_m3') return this.isMissionCompleted('moon_m2');
    if (id === 'moon_m4') return this.isMissionCompleted('moon_m3');
    if (id === 'moon_m5') return this.isMissionCompleted('moon_m4');
    if (id === 'mars_m1') return this.isMissionCompleted('mars_m0');
    if (id === 'mars_m2') return this.isMissionCompleted('mars_m1');
    if (id === 'mars_m3') return this.isMissionCompleted('mars_m2');
    if (id === 'mars_m4') return this.isMissionCompleted('mars_m3');
    if (id === 'mars_m5') return this.isMissionCompleted('mars_m4');
    return false;
  }

  /**
   * Completes a mission and strictly unlocks the sequential next mission
   */
  completeMission(missionId) {
    const id = this.normalizeMissionId(missionId);
    if (!id) return;

    const p = this._data.progress;

    // 1. Mark completed
    if (!p.completedMissions.includes(id)) {
      p.completedMissions.push(id);
    }
    if (!p.completed) p.completed = {};
    p.completed[id] = true;

    // Sync legacy objects
    if (id === 'moon_m0' && p.moonM0) p.moonM0.missionComplete = true;
    if (id === 'moon_m1' && p.moonM1) p.moonM1.missionComplete = true;
    if (id === 'moon_m2' && p.moonM2) p.moonM2.missionComplete = true;
    if (id === 'moon_m3' && p.moonM3) p.moonM3.missionComplete = true;
    if (id === 'moon_m4' && p.moonM4) p.moonM4.missionComplete = true;
    if (id === 'moon_m5' && p.moonM5) p.moonM5.missionComplete = true;
    if (id === 'mars_m0' && p.marsM0) p.marsM0.missionComplete = true;
    if (id === 'mars_m1' && p.marsM1) p.marsM1.missionComplete = true;
    if (id === 'mars_m2' && p.marsM2) p.marsM2.missionComplete = true;
    if (id === 'mars_m3' && p.marsM3) p.marsM3.missionComplete = true;
    if (id === 'mars_m4' && p.marsM4) p.marsM4.missionComplete = true;
    if (id === 'mars_m5' && p.marsM5) p.marsM5.missionComplete = true;

    // 2. Sequentially unlock next mission (strictly one-by-one!)
    const nextMissionMap = {
      'moon_m0': 'moon_m1',
      'moon_m1': 'moon_m2',
      'moon_m2': 'moon_m3',
      'moon_m3': 'moon_m4',
      'moon_m4': 'moon_m5',
      'mars_m0': 'mars_m1',
      'mars_m1': 'mars_m2',
      'mars_m2': 'mars_m3',
      'mars_m3': 'mars_m4',
      'mars_m4': 'mars_m5'
    };

    const nextId = nextMissionMap[id];
    if (nextId) {
      if (!p.unlockedMissions.includes(nextId)) {
        p.unlockedMissions.push(nextId);
      }
      if (!p.unlocked) p.unlocked = {};
      p.unlocked[nextId] = true;
    }

    this.save();

    // 3. Dispatch global progress event so any open UI refreshes
    try {
      window.dispatchEvent(new CustomEvent('frontier:missionCompleted', { detail: { completedId: id, unlockedId: nextId } }));
    } catch {
      // Ignore if window not ready
    }
  }

  /** Get list of currently unlocked missions */
  getUnlockedMissions() {
    return [...(this._data.progress.unlockedMissions || ['moon_m0', 'mars_m0'])];
  }

  /** Get list of completed missions */
  getCompletedMissions() {
    return [...(this._data.progress.completedMissions || [])];
  }

  /** Persist to localStorage */
  save() {
    try {
      this._data.lastSession = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
    } catch (e) {
      console.warn('[SaveManager] Could not save:', e);
    }
  }

  /** Get a nested value via dot notation, e.g. get('settings.musicVolume') */
  get(path, fallback = undefined) {
    return path.split('.').reduce((obj, key) => obj?.[key], this._data) ?? fallback;
  }

  /** Set a nested value via dot notation */
  set(path, value) {
    const keys = path.split('.');
    let obj = this._data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (obj[keys[i]] === undefined) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    this.save();
  }

  /** Mark a dialogue as seen */
  markDialogueSeen(dialogueId) {
    if (!this._data.progress.dialoguesSeen.includes(dialogueId)) {
      this._data.progress.dialoguesSeen.push(dialogueId);
      this.save();
    }
  }

  /** Check if dialogue has been seen */
  hasSeenDialogue(dialogueId) {
    return this._data.progress.dialoguesSeen.includes(dialogueId);
  }

  /** Record a scientific finding */
  recordFinding(finding) {
    if (!this._data.progress.findingsRecorded) {
      this._data.progress.findingsRecorded = [];
    }
    this._data.progress.findingsRecorded.push({
      ...finding,
      timestamp: Date.now()
    });
    this.save();
  }

  /** Record a physical geological/cryo sample */
  recordSample(sampleData) {
    this._data.progress.samplesSecured = (this._data.progress.samplesSecured || 0) + 1;
    this.recordFinding({
      ...sampleData,
      isSample: true,
      type: sampleData.type || 'GEOLOGICAL SAMPLE'
    });
  }

  /** Get total calculated samples secured */
  getSamplesCount() {
    const raw = this._data.progress.findingsRecorded || [];
    const directSamples = raw.filter(f => f.isSample || (f.type && (
      f.type.includes('SAMPLE') || 
      f.type.includes('DRILL') || 
      f.type.includes('CORE') || 
      f.type.includes('ROCK') || 
      f.type.includes('ICE') || 
      f.type.includes('ISRU') ||
      f.type.includes('TARGET')
    )) || (f.name && (
      f.name.toLowerCase().includes('sample') ||
      f.name.toLowerCase().includes('core') ||
      f.name.toLowerCase().includes('ice') ||
      f.name.toLowerCase().includes('rock') ||
      f.name.toLowerCase().includes('basalt') ||
      f.name.toLowerCase().includes('regolith') ||
      f.name.toLowerCase().includes('ilmenite')
    ))).length;
    return Math.max(directSamples, this._data.progress.samplesSecured || 0);
  }

  /** Record a sample specifically for a mission scene */
  recordMissionSample(sceneKey, sample) {
    if (!this._data.progress.missionSamples) this._data.progress.missionSamples = {};
    const key = (sceneKey || 'general').toLowerCase();
    if (!this._data.progress.missionSamples[key]) this._data.progress.missionSamples[key] = [];
    this._data.progress.missionSamples[key].push({ ...sample, time: Date.now() });
    this.recordSample(sample);
  }

  /** Get count of samples collected in a specific mission */
  getMissionSamples(sceneKey) {
    if (!this._data.progress.missionSamples) return 0;
    const key = (sceneKey || 'general').toLowerCase();
    const list = this._data.progress.missionSamples[key];
    return Array.isArray(list) ? list.length : 0;
  }

  /** Persist ongoing campaign life-support entities across all missions */
  saveCampaignResources(resObj) {
    if (!resObj) return;
    this._data.progress.campaignResources = {
      power: Math.round(resObj.power ?? 100),
      oxygen: Math.round(resObj.oxygen ?? 100),
      water: Math.round(resObj.water ?? 100),
      food: Math.round(resObj.food ?? 100),
      roverEnergy: Math.round(resObj.roverEnergy ?? 100),
      crewCondition: Math.round(resObj.crewCondition ?? resObj.health ?? 100)
    };
    this.save();
  }

  /** Get persisted campaign resources, or null if fresh start */
  getCampaignResources() {
    return this._data.progress.campaignResources || null;
  }

  /** Reset campaign resources back to fresh 100% start */
  resetCampaignResources() {
    this._data.progress.campaignResources = {
      power: 100,
      oxygen: 100,
      water: 100,
      food: 100,
      roverEnergy: 100,
      crewCondition: 100
    };
    this.save();
  }

  /** Add playtime in seconds */
  addPlaytime(seconds) {
    this._data.progress.totalPlaytime += seconds;
  }

  /** Reset all progress (keep settings) */
  resetProgress() {
    const settings = { ...this._data.settings };
    this._data = this._defaults();
    this._data.settings = settings;
    this._data.firstLaunch = false;
    this.save();
  }

  /** Full reset including settings */
  fullReset() {
    localStorage.removeItem(STORAGE_KEY);
    this._data = this._defaults();
  }

  get settings() { return this._data.settings; }
  get progress() { return this._data.progress; }
  get isFirstLaunch() { return this._data.firstLaunch; }
}
