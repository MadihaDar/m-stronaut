const STORAGE_KEY = 'frontier_mission_academy_save_v2';

const DEFAULT_STATE = {
  version: 2,
  selectedDestination: 'mars', // Default to Mars for Mars campaign or Moon
  activeCharacter: 'alex',
  collectedFindings: [],
  scoreBreakdown: {
    safety: 1.0,
    navigation: 0.8,
    resource: 0.9,
    science: 0.6,
    alert_response: 0.85,
    teamwork: 0.9
  },
  settings: {
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.6,
    subtitles: true,
    fontSize: 'normal',
    colorBlindMode: 'none',
    joystickSide: 'left'
  },
  unlockedDestinations: ['moon', 'mars'],
  completedTutorial: false,
  // Mars Persistent State (Consequences carry from M01 to M02)
  marsState: {
    oxygen: 96,
    water: 92,
    power: 88,
    battery: 100,
    food: 94,
    greenhouseHealth: 90,
    solarDustLevel: 0.25, // 25% dust attenuation
    equipmentCondition: 95,
    crewHealth: 100,
    shelterMaintained: true,
    waterDrillActive: true,
    samplesCollected: 6,
    cargoChoice: 'balanced', // 'samples' | 'balanced' | 'supplies'
    cargoWeightKg: 280, // max 400 kg
    departureDelayChosen: false,
    m01Completed: false,
    m02Completed: false,
    endingEarned: null
  }
};

export class StorageManager {
  constructor() {
    this.state = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        marsState: { ...DEFAULT_STATE.marsState, ...(parsed.marsState || {}) }
      };
    } catch (e) {
      console.warn('StorageManager failed to read localStorage:', e);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('StorageManager failed to write localStorage:', e);
    }
  }

  getSetting(key) {
    return this.state.settings[key];
  }

  setSetting(key, val) {
    this.state.settings[key] = val;
    this.save();
  }

  recordFinding(findingId) {
    if (!this.state.collectedFindings.includes(findingId)) {
      this.state.collectedFindings.push(findingId);
      this.state.scoreBreakdown.science = Math.min(1.0, this.state.scoreBreakdown.science + 0.15);
      this.save();
      return true;
    }
    return false;
  }

  isFindingCollected(findingId) {
    return this.state.collectedFindings.includes(findingId);
  }

  // Mars persistent updates
  updateMarsResource(key, val) {
    this.state.marsState[key] = Math.max(0, Math.min(100, val));
    this.save();
  }

  cleanSolarPanels() {
    this.state.marsState.solarDustLevel = 0.05; // Dropped to 5% after cleaning
    this.state.marsState.power = Math.min(100, this.state.marsState.power + 10);
    this.state.scoreBreakdown.resource = Math.min(1.0, this.state.scoreBreakdown.resource + 0.1);
    this.save();
  }

  setCargoAllocation(choice, weightKg) {
    this.state.marsState.cargoChoice = choice;
    this.state.marsState.cargoWeightKg = weightKg;
    if (choice === 'samples') {
      this.state.scoreBreakdown.science = 1.0;
    } else if (choice === 'supplies') {
      this.state.scoreBreakdown.safety = 1.0;
    } else {
      this.state.scoreBreakdown.science = Math.min(1.0, this.state.scoreBreakdown.science + 0.2);
      this.state.scoreBreakdown.safety = Math.min(1.0, this.state.scoreBreakdown.safety + 0.2);
    }
    this.save();
  }

  completeM01() {
    this.state.marsState.m01Completed = true;
    this.save();
  }

  completeM02(endingId) {
    this.state.marsState.m02Completed = true;
    this.state.marsState.endingEarned = endingId;
    this.save();
  }

  resetAllProgress() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.save();
  }
}

export const storage = new StorageManager();
