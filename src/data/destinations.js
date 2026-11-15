export const DESTINATIONS = {
  moon: {
    id: 'moon',
    name: 'The Moon (Artemis Base Camp)',
    subtitle: 'Shackleton Crater & South Pole Cold Traps',
    gravity: 1.62, // m/s^2 (~1/6th Earth)
    atmosphere: 'Ultra-thin Exosphere (Near Vacuum)',
    dayCycle: '29.5 Earth Days (14 Earth days daylight, 14 Earth days night)',
    tempRange: '-238°C (Cold Traps) to +120°C (Sunlight)',
    primaryChallenge: 'Extreme 14-day cryogenic night and zero atmospheric radiation shielding.',
    status: 'ACTIVE_SANDBOX', // Training Sandbox available
    keyInstruments: ['LRO LOLA Altimeter', 'LRO DIVINER Thermal Radiometer', 'LRO LEND Neutron Detector', 'LRO CRaTER Dosimeter'],
    color: '#94a3b8',
    skyColor: 0x020208,
    groundColor: 0x71717a,
    ambientLight: 0x475569,
    sunLight: 0xffffff,
    briefing: 'Welcome to the Lunar South Pole! Here at the rim of Shackleton Crater, towering mountain peaks receive near-continuous sunlight while the deep crater floors hide ancient water ice trapped in total darkness.'
  },
  mars: {
    id: 'mars',
    name: 'Mars (Jezero Outpost)',
    subtitle: 'Perseverance Rover Ground Station',
    gravity: 3.72, // m/s^2 (~38% Earth)
    atmosphere: '95% Carbon Dioxide, ~0.007 atm pressure',
    dayCycle: '24 Hours, 39 Minutes (1 Sol)',
    tempRange: '-85°C (Night) to -15°C (Mid-day)',
    primaryChallenge: 'Dust accumulation on solar panels and violent planetary dust storms.',
    status: 'ACTIVE_SANDBOX', // Training Sandbox available
    keyInstruments: ['Mars 2020 MEDA Weather Station', 'MSL RAD Radiation Detector', 'MRO SWIM Subsurface Ice Maps'],
    color: '#ea580c',
    skyColor: 0x241108,
    groundColor: 0xc2410c,
    ambientLight: 0x7c2d12,
    sunLight: 0xffedd5,
    briefing: 'Welcome to Jezero Crater, Mars! Once an ancient lake filled with flowing water, today it is an expansive rust-colored desert where Perseverance and future human explorers drill for ancient biosignatures.'
  }
};
