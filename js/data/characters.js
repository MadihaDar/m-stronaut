/* ============================================================
   FRONTIER: MISSION ACADEMY — Character Definitions
   ============================================================ */

export const CHARACTERS = {
  alex: {
    id: 'alex',
    name: 'Alex Morgan',
    age: 34,
    role: 'Mission Commander',
    description: 'Calm, thoughtful, and decisive. Alex leads the team with steady confidence and always puts crew safety first. A veteran astronaut with experience on the ISS and multiple planetary missions.',
    emoji: '👩‍🚀',
    color: 0x2a7edf,
    colorHex: '#2a7edf',
    accentHex: '#4a9eff',
    cssClass: 'alex',
    suitAccent: '#4a9eff',
    responsibilities: [
      'Mission briefings and overall priorities',
      'Crew coordination and morale',
      'Final decisions on safety-critical actions',
      'Communication with Mission Control'
    ]
  },
  leo: {
    id: 'leo',
    name: 'Leo Chen',
    age: 30,
    role: 'Systems & Mobility Engineer',
    description: 'Energetic, practical, and always ready to get his hands dirty. Leo keeps the rover running and manages every watt of power the outpost uses.',
    emoji: '👨‍🔧',
    color: 0xcc6600,
    colorHex: '#cc6600',
    accentHex: '#ff8c42',
    cssClass: 'leo',
    suitAccent: '#ff8c42',
    responsibilities: [
      'Rover systems, maintenance, and driving',
      'Power budgeting and solar panel output',
      'Equipment checks and repair',
      'Mobility and EVA logistics'
    ]
  },
  maya: {
    id: 'maya',
    name: 'Maya Patel',
    age: 29,
    role: 'Planetary Geologist',
    description: 'Curious, observant, and evidence-driven. Maya sees stories written in rocks and soil that others walk right past. She insists on scientific honesty — always distinguishing data from interpretation.',
    emoji: '🧑‍🔬',
    color: 0x008899,
    colorHex: '#008899',
    accentHex: '#3dd6cc',
    cssClass: 'maya',
    suitAccent: '#3dd6cc',
    responsibilities: [
      'Geological mapping and sample analysis',
      'Thermal and neutron observation interpretation',
      'Science mission planning and site selection',
      'Recording and verifying scientific findings'
    ]
  },
  noah: {
    id: 'noah',
    name: 'Noah Williams',
    age: 32,
    role: 'Crew Health & Life-Support',
    description: 'Kind, patient, and genuinely reassuring. Noah monitors every breath the crew takes — literally. He keeps the life support systems running and watches for early signs of radiation stress or medical issues.',
    emoji: '🧑‍⚕️',
    color: 0x229944,
    colorHex: '#229944',
    accentHex: '#42d994',
    cssClass: 'noah',
    suitAccent: '#42d994',
    responsibilities: [
      'Oxygen and water system management',
      'Crew health monitoring and medical support',
      'Radiation dose tracking and safety thresholds',
      'Food production and nutrition planning'
    ]
  },
  orbit: {
    id: 'orbit',
    name: 'ORBIT',
    age: null,
    role: 'AI Science Assistant',
    description: 'A small floating spherical robot with expressive digital eyes. ORBIT displays science maps, gives data-driven hints, and announces alerts. It never fabricates a measurement — if data is unavailable, ORBIT says so clearly.',
    emoji: '🤖',
    color: 0xc8d8ff,
    colorHex: '#c8d8ff',
    accentHex: '#e0e8ff',
    cssClass: 'orbit',
    suitAccent: '#e0e8ff',
    responsibilities: [
      'Displaying real NASA science data and maps',
      'Providing data-grounded hints during missions',
      'Announcing resource warnings and alerts',
      'Distinguishing measured data from models'
    ]
  }
};

export const CHARACTER_LIST = Object.values(CHARACTERS);

/** Get character by id. Returns null if not found. */
export function getCharacter(id) {
  return CHARACTERS[id] ?? null;
}

/** Build a Three.js color (number) from character id */
export function getCharacterColor(id) {
  return CHARACTERS[id]?.color ?? 0xffffff;
}
