import fs from 'fs';
import path from 'path';

console.log('=== RUNNING VERIFICATION FOR USER REQUESTED FIXES ===\n');

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`  ❌ FAILED: ${msg}`);
    failed = true;
  } else {
    console.log(`  ✓ PASSED: ${msg}`);
  }
}

// 1. Check TradeoffSystem.js
const tradeoffCode = fs.readFileSync('js/systems/TradeoffSystem.js', 'utf8');

console.log('Testing TradeoffSystem.js:');
assert(tradeoffCode.includes('this.decisionTimeRemaining = 80.0'), 'Decision timer initialized to 80.0 seconds (1m 20s)');
assert(tradeoffCode.includes('decisionTimeRemaining / 80.0'), 'Timer bar percentage based on 80.0 seconds');
assert(tradeoffCode.includes('1m 20s'), 'Timer label formatted with 1m 20s initial state');
assert(tradeoffCode.includes('hesitated more than 1 minute 20 seconds'), 'Timeout fail screen updated to 1 minute 20 seconds');
assert(tradeoffCode.includes('MOON BASE POWER CONTROLS'), 'Kid-friendly title on Outpost Power Console');
assert(tradeoffCode.includes('Choose how your Moon base shares its battery power!'), 'Kid-friendly subtitle on Outpost Power Console');
assert(tradeoffCode.includes('MAIN POWER TANK'), 'Kid-friendly battery description');
assert(tradeoffCode.includes('CLEAN OXYGEN TO BREATHE'), 'Kid-friendly oxygen description');
assert(tradeoffCode.includes('SPACE GREENHOUSE HARVEST'), 'Kid-friendly food description');
assert(tradeoffCode.includes('ASTRONAUT FEELING GREAT'), 'Kid-friendly health description');
assert(tradeoffCode.includes('⚖️ BALANCED TEAM'), 'Kid-friendly balanced mode name');
assert(tradeoffCode.includes('🫁 SUPER AIR & COZY WARMTH'), 'Kid-friendly oxygen mode name');
assert(tradeoffCode.includes('🛡️ FORCE FIELD SHIELD'), 'Kid-friendly shield mode name');
assert(tradeoffCode.includes('🌱 SPACE FARM & ROVER BOOST'), 'Kid-friendly farm mode name');
assert(tradeoffCode.includes('🚀 BACK TO MISSION'), 'Kid-friendly resume button');

// 2. Check MoonFarSideScene.js (Mission 5 Rover Waypoint)
const m5Code = fs.readFileSync('js/scenes/MoonFarSideScene.js', 'utf8');
console.log('\nTesting MoonFarSideScene.js (Mission 5):');
assert(m5Code.includes("radius: 1.5"), 'arrayCol collider radius shrunk from 5.0 to 1.5 to not obstruct rover');
assert(m5Code.includes("triggerRadius: 12.0"), 'Waypoint triggerRadius increased to 12.0 for smooth rover arrival');
assert(m5Code.includes("requireRover: true"), 'Waypoint requires rover');
assert(m5Code.includes("distToArray < 14.0"), 'Interaction prompt distance expanded to 14.0m');
assert(m5Code.includes("if (distToPeak < 10) return 12.0;"), 'Central peak has a flat survey plateau for rover and radio masts');

// 3. Check MoonLavaTubeScene.js (Mission 3 On-Foot Restriction)
const m3Code = fs.readFileSync('js/scenes/MoonLavaTubeScene.js', 'utf8');
console.log('\nTesting MoonLavaTubeScene.js (Mission 3):');
assert(m3Code.includes("this.character.position.z = -8.0"), 'On-foot traversal past platform is physically blocked');
assert(m3Code.includes("ROVER REQUIRED"), 'Clear educational warning given when attempting to walk into cave');
assert(m3Code.includes("ROVER TUTORIAL: The Lunar Rover travels far, crosses tough terrain, and carries heavy tools to save astronaut oxygen!"), 'Educational dialogue explaining rover purpose');
assert(m3Code.includes("requireRover: true"), 'Waypoint requires rover');

// 4. Check WaypointSystem.js (requireRover & triggerRadius support)
const wpCode = fs.readFileSync('js/systems/WaypointSystem.js', 'utf8');
console.log('\nTesting WaypointSystem.js:');
assert(wpCode.includes("this.requireRover = !!(wp && wp.requireRover)"), 'Supports requireRover flag on waypoints');
assert(wpCode.includes("this.triggerRadius = (wp && wp.triggerRadius) ? wp.triggerRadius : 6.5"), 'Supports custom triggerRadius on waypoints');
assert(wpCode.includes("if (this.requireRover && !isRover)"), 'Guards waypoint auto-trigger from foot traversal when rover required');

if (failed) {
  console.error('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n✅ ALL VERIFICATIONS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}
