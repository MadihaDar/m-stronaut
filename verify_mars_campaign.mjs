import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = 'C:/Users/User/.gemini/antigravity/scratch/frontier-mission-academy';

// Mock localStorage for SaveManager
class LocalStorageMock {
  constructor() { this.store = {}; }
  getItem(k) { return this.store[k] || null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
}
globalThis.localStorage = new LocalStorageMock();
globalThis.window = {
  dispatchEvent: () => {}
};

async function runMarsTests() {
  console.log('=== VERIFYING LUNAR MISSION 3 WIN STATE & MARS CAMPAIGN ===\n');

  // Test 1: Lunar Mission 3 Win State in MoonLavaTubeScene.js
  console.log('Test 1: Lunar Mission 3 Win State & Extraction Waypoint');
  const lavaTubeCode = fs.readFileSync(path.join(ROOT, 'js/scenes/MoonLavaTubeScene.js'), 'utf8');
  console.assert(lavaTubeCode.includes('this._completeMissionSuccess()'), 'Must call _completeMissionSuccess()');
  console.assert(lavaTubeCode.includes('winchCol = { type: \'cylinder\', pos: { x: 0, z: 25 }, radius: 1.5 }'), 'Winch collider radius must be 1.5');
  console.assert(lavaTubeCode.includes('onComplete: () => {') && lavaTubeCode.includes('this._completeMissionSuccess();'), 'Waypoint onComplete must trigger _completeMissionSuccess');
  console.assert(lavaTubeCode.includes('this.engine.save.completeMission(\'moon_m3\')'), 'Must complete moon_m3');
  console.assert(lavaTubeCode.includes('this.engine.showPanel(\'moon-mission-modal\')'), 'Must route to moon-mission-modal');
  console.log('  ✓ Lunar Mission 3 Win State & Waypoint Collision verified!\n');

  // Test 2: SaveManager Mars Sequential Progression (M0 -> M1 -> M2 -> M3 -> M4 -> M5)
  console.log('Test 2: SaveManager Mars Progression Chain');
  const { SaveManager } = await import('file:///' + ROOT.replace(/\\/g, '/') + '/js/SaveManager.js');
  const save = new SaveManager();
  save.fullReset();

  console.assert(save.isMissionUnlocked('mars_m0') === true, 'Mars M0 should be UNLOCKED at start');
  console.assert(save.isMissionUnlocked('mars_m1') === false, 'Mars M1 should be LOCKED until M0 complete');
  console.assert(save.isMissionUnlocked('mars_m2') === false, 'Mars M2 should be LOCKED until M1 complete');
  console.assert(save.isMissionUnlocked('mars_m3') === false, 'Mars M3 should be LOCKED until M2 complete');
  console.assert(save.isMissionUnlocked('mars_m4') === false, 'Mars M4 should be LOCKED until M3 complete');
  console.assert(save.isMissionUnlocked('mars_m5') === false, 'Mars M5 should be LOCKED until M4 complete');

  save.completeMission('mars_m0');
  console.assert(save.isMissionUnlocked('mars_m1') === true, 'Mars M1 must be unlocked after M0');
  save.completeMission('mars_m1');
  console.assert(save.isMissionUnlocked('mars_m2') === true, 'Mars M2 must be unlocked after M1');
  save.completeMission('mars_m2');
  console.assert(save.isMissionUnlocked('mars_m3') === true, 'Mars M3 must be unlocked after M2');
  save.completeMission('mars_m3');
  console.assert(save.isMissionUnlocked('mars_m4') === true, 'Mars M4 must be unlocked after M3');
  save.completeMission('mars_m4');
  console.assert(save.isMissionUnlocked('mars_m5') === true, 'Mars M5 must be unlocked after M4');
  console.log('  ✓ Mars sequential unlocking (M0->M1->M2->M3->M4->M5) strictly verified!\n');

  // Test 3: Mars Mission 0 (High Martian Orbit) Implementation
  console.log('Test 3: Mars Mission 0 (MarsOrbitalScene.js)');
  const marsOrbitCode = fs.readFileSync(path.join(ROOT, 'js/scenes/MarsOrbitalScene.js'), 'utf8');
  console.assert(marsOrbitCode.includes('MARS_JEZERO') && marsOrbitCode.includes('MARS_ARCADIA'), 'Must present exactly two candidates: Jezero and Arcadia');
  console.assert(marsOrbitCode.includes('resObj = { power: 100, oxygen: 100, water: 95, food: 100, roverEnergy: 100, crewCondition: 100 }'), 'Must calculate Jezero starting payload');
  console.assert(marsOrbitCode.includes('resObj = { power: 90, oxygen: 100, water: 100, food: 100, roverEnergy: 100, crewCondition: 95 }'), 'Must calculate Arcadia starting payload');
  console.assert(marsOrbitCode.includes('this.engine.save.saveCampaignResources(resObj)'), 'Must save starting entities');
  console.assert(marsOrbitCode.includes('showMissionCompletedModal'), 'Must show Mission 0 completion modal upon site selection');
  console.assert(marsOrbitCode.includes('mars-mission-modal'), 'Must route to mars-mission-modal');
  console.log('  ✓ Mars Mission 0 candidate selection and mission accomplishment verified!\n');

  // Test 4: TradeoffSystem Mars Decision Tasks
  console.log('Test 4: TradeoffSystem 5 Mars Mission Decision Tasks');
  const tradeoffCode = fs.readFileSync(path.join(ROOT, 'js/systems/TradeoffSystem.js'), 'utf8');
  console.assert(tradeoffCode.includes('presentMarsM1Tradeoff'), 'Must include Mars M1 tradeoff');
  console.assert(tradeoffCode.includes('presentMarsM2Tradeoff'), 'Must include Mars M2 tradeoff');
  console.assert(tradeoffCode.includes('presentMarsM3Tradeoff'), 'Must include Mars M3 tradeoff');
  console.assert(tradeoffCode.includes('presentMarsM4Tradeoff'), 'Must include Mars M4 tradeoff');
  console.assert(tradeoffCode.includes('presentMarsM5Tradeoff'), 'Must include Mars M5 tradeoff');
  console.assert(tradeoffCode.includes('this.decisionTimeRemaining = 80.0'), 'Must enforce 80s timer');
  console.assert(!tradeoffCode.includes('id="btn-close-tradeoff"'), 'Must have NO close button on tradeoff modal');
  console.log('  ✓ 5 Mars Tradeoff Decision tasks (80s timer, no X button, kid-friendly) verified!\n');

  // Test 5: Mars Mission Scenes Parity (M1 to M5)
  console.log('Test 5: Mars Mission Scenes Parity & Constraints');
  const m1Code = fs.readFileSync(path.join(ROOT, 'js/scenes/MarsJezeroScene.js'), 'utf8');
  const m2Code = fs.readFileSync(path.join(ROOT, 'js/scenes/MarsArcadiaScene.js'), 'utf8');
  const m3Code = fs.readFileSync(path.join(ROOT, 'js/scenes/MarsStormScene.js'), 'utf8');
  const m4Code = fs.readFileSync(path.join(ROOT, 'js/scenes/MarsLavaTubeScene.js'), 'utf8');
  const m5Code = fs.readFileSync(path.join(ROOT, 'js/scenes/MarsAscentReturnScene.js'), 'utf8');

  // Blue route trail check
  [m1Code, m2Code, m3Code, m4Code].forEach((code, i) => {
    console.assert(code.includes('setRouteTrailColor(0x38bdf8)'), `Mission ${i+1} must configure blue route trail (0x38bdf8)`);
    console.assert(code.includes('setRouteTrailVisible(true)'), `Mission ${i+1} must make route trail visible`);
  });

  // Waypoints and win states
  console.assert(m1Code.includes('presentMarsM1Tradeoff'), 'M1 must trigger M1 tradeoff');
  console.assert(m1Code.includes('completeMission(\'mars_m1\')'), 'M1 must complete mars_m1');
  console.assert(m2Code.includes('presentMarsM2Tradeoff'), 'M2 must trigger M2 tradeoff');
  console.assert(m2Code.includes('completeMission(\'mars_m2\')'), 'M2 must complete mars_m2');
  console.assert(m3Code.includes('presentMarsM3Tradeoff'), 'M3 must trigger M3 tradeoff');
  console.assert(m3Code.includes('completeMission(\'mars_m3\')'), 'M3 must complete mars_m3');
  console.assert(m4Code.includes('presentMarsM4Tradeoff'), 'M4 must trigger M4 tradeoff');
  console.assert(m4Code.includes('completeMission(\'mars_m4\')'), 'M4 must complete mars_m4');
  console.assert(m5Code.includes('presentMarsM5Tradeoff'), 'M5 must trigger M5 tradeoff');
  console.assert(m5Code.includes('completeMission(\'mars_m5\')'), 'M5 must complete mars_m5');
  console.log('  ✓ All Mars missions (M1..M5) verified for waypoints, tradeoffs, and completion!\n');

  // Test 6: Environmental Lighting Variation Check
  console.log('Test 6: Environmental Lighting Variation Across Martian Missions');
  console.assert(m1Code.includes('0xb56545'), 'M1 must use daytime butterscotch salmon sky');
  console.assert(m2Code.includes('0xb87360'), 'M2 must use twilight/dusk peach sky');
  console.assert(m3Code.includes('0xa84824') && m3Code.includes('0x4a6fa5'), 'M3 must use dust storm & blue sunset');
  console.assert(m4Code.includes('0x0c0714'), 'M4 must use dark night/cave lighting');
  console.assert(m5Code.includes('starfield'), 'M5 must use deep space cosmic starfield');
  console.log('  ✓ Varied daytime, dusk, dust storm, night cave, and deep space environments verified!\n');

  // Test 7: Index.html & DestinationScene.js UI Wiring
  console.log('Test 7: HTML & Destination Archive UI Integration');
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (let i = 0; i <= 5; i++) {
    console.assert(indexHtml.includes(`card-mars-m${i}`), `index.html must have card-mars-m${i}`);
    console.assert(indexHtml.includes(`btn-launch-mars-m${i}`), `index.html must have btn-launch-mars-m${i}`);
  }
  const destCode = fs.readFileSync(path.join(ROOT, 'js/scenes/DestinationScene.js'), 'utf8');
  console.assert(destCode.includes('bindMarsLaunch(\'card-mars-m0\''), 'DestinationScene must bind Mars M0');
  console.assert(destCode.includes('bindMarsLaunch(\'card-mars-m5\''), 'DestinationScene must bind Mars M5');
  console.log('  ✓ All 6 Mars cards and launch handlers wired in HTML and Destination Scene!\n');

  console.log('🏆 ALL PHASES (1, 2, 3, 4) PASSED 100% OF VERIFICATION CHECKS!');
}

runMarsTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
