import fs from 'fs';
import assert from 'assert';

console.log('=== VERIFYING FLASHCARDS & TRIMMED MARS ARCHIVE ===\n');

const indexPath = 'C:/Users/User/.gemini/antigravity/scratch/frontier-mission-academy/index.html';
const html = fs.readFileSync(indexPath, 'utf8');

// Test 1: Menu buttons
console.log('Test 1: Main Menu About Moon & About Mars buttons');
assert(html.includes('id="btn-about-moon"'), 'btn-about-moon must exist');
assert(html.includes('id="btn-about-mars"'), 'btn-about-mars must exist');
console.log('  ✓ Main Menu buttons verified!');

// Test 2: Flashcard modals
console.log('\nTest 2: Flashcard Galleries in index.html');
assert(html.includes('id="about-moon-modal"'), 'about-moon-modal must exist');
assert(html.includes('id="about-mars-modal"'), 'about-mars-modal must exist');
assert(html.includes('btn-close-about-moon'), 'btn-close-about-moon must exist');
assert(html.includes('btn-close-about-mars'), 'btn-close-about-mars must exist');

const moonCardsCount = (html.match(/class="[^"]*flashcard-panel[^"]*filter-[^"]*"/g) || []).length;
console.log(`  ✓ Found flashcard panels across galleries (Total: ${moonCardsCount})`);
assert(moonCardsCount === 33, `Expected 33 flashcard panels (21 Moon + 12 Mars), found ${moonCardsCount}`);

// Test 3: Mars missions modal strictly retains Orbital Recon in header and Mission 1 in grid
console.log('\nTest 3: Mars Missions modal strictly retains Orbital Recon in header and Mission 1 in grid');
assert(html.includes('id="btn-launch-mars-orbit"'), 'btn-launch-mars-orbit must exist in header');
assert(!html.includes('id="card-mars-m0"'), 'card-mars-m0 duplicate must be removed');
assert(html.includes('id="card-mars-m1"'), 'card-mars-m1 must exist');
assert(!html.includes('id="card-mars-m2"'), 'card-mars-m2 must be removed');
assert(!html.includes('id="card-mars-m3"'), 'card-mars-m3 must be removed');
assert(!html.includes('id="card-mars-m4"'), 'card-mars-m4 must be removed');
assert(!html.includes('id="card-mars-m5"'), 'card-mars-m5 must be removed');
console.log('  ✓ Mars orbital recon in header and single Mission 1 card in grid verified!');

// Test 4: CSS Object-fit contain
console.log('\nTest 4: CSS object-fit contain enforcement');
const menuCss = fs.readFileSync('C:/Users/User/.gemini/antigravity/scratch/frontier-mission-academy/styles/menu.css', 'utf8');
assert(menuCss.includes('object-fit: contain'), 'menu.css must specify object-fit: contain for flashcard images');
console.log('  ✓ Image aspect ratio containment verified!');

// Test 5: README.md verification
console.log('\nTest 5: README.md Space Apps Challenge submission sections');
const readmePath = 'C:/Users/User/.gemini/antigravity/scratch/frontier-mission-academy/README.md';
assert(fs.existsSync(readmePath), 'README.md must exist in scratch');
const readme = fs.readFileSync(readmePath, 'utf8');
assert(readme.includes('Project M²'), 'README must include Project M² title');
assert(readme.includes('Project Summary'), 'README must include Project Summary');
assert(readme.includes('Project Links'), 'README must include Project Links');
assert(readme.includes('Project Details'), 'README must include Project Details');
assert(readme.includes('Use of Super Intelligence (SI)'), 'README must include SI disclosure');
assert(readme.includes('LOLA'), 'README must document LOLA dataset');
assert(readme.includes('Diviner'), 'README must document Diviner dataset');
assert(readme.includes('LEND'), 'README must document LEND dataset');
assert(readme.includes('LCROSS'), 'README must document LCROSS dataset');
assert(readme.includes('DONKI'), 'README must document DONKI dataset');
assert(readme.includes('MEDA'), 'README must document MEDA dataset');
assert(readme.includes('SWIM'), 'README must document SWIM dataset');
assert(readme.includes('CANGrow'), 'README must document CANGrow');
assert(readme.includes('APXS'), 'README must document APXS');
console.log('  ✓ README.md complete with all NASA Space Apps requirements and datasets!');

console.log('\n🏆 ALL VERIFICATION CHECKS PASSED 100%!');
