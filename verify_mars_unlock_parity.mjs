import assert from 'assert';
import fs from 'fs';
import path from 'path';

// Mock localStorage for Node test
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = {
  dispatchEvent: () => {}
};
global.CustomEvent = class CustomEvent {
  constructor(type, detail) {
    this.type = type;
    this.detail = detail;
  }
};

const saveManagerPath = path.resolve('js/SaveManager.js');
const { SaveManager } = await import(`file://${saveManagerPath}`);

console.log('=== VERIFYING MARS PROGRESSIVE UNLOCKING PARITY ===\n');

// 1. Fresh Save Tests
localStorage.clear();
const save1 = new SaveManager();
assert.strictEqual(save1.isMissionUnlocked('mars_m0'), true, 'Mars M0 must be unlocked by default');
assert.strictEqual(save1.isMissionCompleted('mars_m0'), false, 'Mars M0 must NOT be completed by default');
assert.strictEqual(save1.isMissionUnlocked('mars_m1'), false, 'Mars M1 must be LOCKED by default');
assert.strictEqual(save1.isMissionCompleted('mars_m1'), false, 'Mars M1 must NOT be completed by default');

const unlocked1 = save1.getUnlockedMissions();
assert.ok(unlocked1.includes('mars_m0'), 'unlockedMissions must include mars_m0');
assert.ok(!unlocked1.includes('mars_m1'), 'unlockedMissions must NOT include mars_m1');
console.log('✓ Test 1 Passed: Fresh save has Mars M0 unlocked and Mars M1 locked.');

// 2. Complete Mars M0 Tests
save1.completeMission('mars_m0');
assert.strictEqual(save1.isMissionCompleted('mars_m0'), true, 'Mars M0 must be marked completed');
assert.strictEqual(save1.isMissionUnlocked('mars_m1'), true, 'Mars M1 must be UNLOCKED after M0 completed');

const unlocked2 = save1.getUnlockedMissions();
assert.ok(unlocked2.includes('mars_m0'), 'unlockedMissions must include mars_m0');
assert.ok(unlocked2.includes('mars_m1'), 'unlockedMissions must include mars_m1 after M0 completed');
console.log('✓ Test 2 Passed: Completing Mars M0 successfully unlocks Mars M1.');

// 3. Complete Mars M1 Tests
save1.completeMission('mars_m1');
assert.strictEqual(save1.isMissionCompleted('mars_m1'), true, 'Mars M1 must be marked completed');
console.log('✓ Test 3 Passed: Mars M1 marks completed successfully.');

// 4. Reload / Persistence Test
const save2 = new SaveManager();
assert.strictEqual(save2.isMissionCompleted('mars_m0'), true, 'Persisted save preserves Mars M0 completed');
assert.strictEqual(save2.isMissionCompleted('mars_m1'), true, 'Persisted save preserves Mars M1 completed');
assert.strictEqual(save2.isMissionUnlocked('mars_m1'), true, 'Persisted save preserves Mars M1 unlocked');
console.log('✓ Test 4 Passed: Save state reloads from localStorage accurately.');

// 5. Corrupt Save Healing Test (tampered save with mars_m1 unlocked prematurely)
localStorage.setItem('frontier_save_v1', JSON.stringify({
  version: 2,
  progress: {
    unlockedMissions: ['moon_m0', 'mars_m1'], // Tampered: skipped mars_m0!
    completedMissions: [],
    unlocked: { mars_m1: true }
  }
}));
const save3 = new SaveManager();
assert.strictEqual(save3.isMissionUnlocked('mars_m0'), true, 'Mars M0 is always unlocked');
assert.strictEqual(save3.isMissionUnlocked('mars_m1'), false, 'Tampered save must NOT allow mars_m1 without mars_m0 completed');
console.log('✓ Test 5 Passed: Tampered save properly sanitized; Mars M1 remains locked without M0 complete.');

// 6. Verify Lunar missions unaffected
assert.strictEqual(save1.isMissionUnlocked('moon_m0'), true, 'Moon M0 remains unlocked');
console.log('✓ Test 6 Passed: Lunar progression remains untouched and intact.');

console.log('\n🏆 ALL MARS PROGRESSIVE UNLOCKING TESTS PASSED 100%!');
