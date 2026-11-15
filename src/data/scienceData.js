export const DATA_TYPES = {
  MEASURED: {
    label: 'Measured Data',
    badge: 'NASA TELEMETRY',
    color: '#3b82f6',
    desc: 'Direct empirical sensor observation from a spacecraft or rover instrument.'
  },
  CALCULATED: {
    label: 'Calculated Value',
    badge: 'SCIENTIFIC DERIVATION',
    color: '#8b5cf6',
    desc: 'Scientifically derived metric calculated using physics formulas and raw telemetry.'
  },
  MODEL: {
    label: 'Simplified Gameplay Model',
    badge: 'TRAINING SIMULATION',
    color: '#f59e0b',
    desc: 'An educational abstraction designed for intuitive interaction and young players.'
  },
  STORY: {
    label: 'Story Event',
    badge: 'MISSION SCENARIO',
    color: '#10b981',
    desc: 'A fictional mission context created to test junior commanders in real-world scenarios.'
  }
};

export const SCIENCE_DATABASE = [
  {
    id: 'lend_ice',
    title: 'Epithermal Neutron Suppression (Subsurface Water Ice)',
    planet: 'Moon',
    instrument: 'LRO LEND (Lunar Exploration Neutron Detector)',
    dataType: 'MEASURED',
    measuredData: 'Epithermal neutron count rate drops by ~28% inside deep polar craters.',
    calculatedValue: 'Equivalent hydrogen bulk weight: 0.5% – 1.5% water equivalent hydrogen (WEH).',
    simplifiedExplanation: 'Think of cosmic rays as ping-pong balls hitting bowling balls (heavy rock atoms). But when they hit hydrogen atoms in water molecules (which have the same size and mass), the neutrons slow down and get absorbed! So when the detector sees fewer fast neutrons, water ice is hiding underneath!',
    kidTip: 'Water on the Moon can be melted for astronauts to drink, and split into oxygen to breathe and hydrogen rocket fuel!'
  },
  {
    id: 'meda_weather',
    title: 'Sol 1553 Diurnal Atmosphere Cycle',
    planet: 'Mars',
    instrument: 'Mars 2020 Perseverance MEDA (CAL_ATS & CAL_PS)',
    dataType: 'MEASURED',
    measuredData: 'Atmospheric pressure: 782 Pa (0.0077 atm); Air temp: -83°C (05:00 LMST) to -18°C (14:30 LMST).',
    calculatedValue: 'Diurnal air density swing: 0.014 kg/m³ to 0.019 kg/m³.',
    simplifiedExplanation: 'Mars has very thin air—less than 1% of Earth’s atmosphere. Because the blanket of air is so thin, heat escapes straight into space as soon as the Sun sets, plunging the outpost into deep freeze every single night.',
    kidTip: 'Our habitat insulation and heating heaters work hardest right before Martian dawn.'
  },
  {
    id: 'rad_dosimetry',
    title: 'Surface Ionizing Radiation Dose Rates',
    planet: 'Mars',
    instrument: 'MSL Curiosity RAD (Radiation Assessment Detector)',
    dataType: 'CALCULATED',
    measuredData: 'Average silicon detector dose: 168.4 µGy/day (range: 111 – 256 µGy/day).',
    calculatedValue: 'Human tissue-equivalent biological dose equivalent: ~0.64 mSv/day (~230 mSv/year).',
    simplifiedExplanation: 'On Earth, a magnetic field and thick atmosphere protect us like an invisible umbrella from cosmic rays. On Mars, the atmosphere is thin and there is no global magnetic field, so radiation doses are about 300 times higher than an airline flight.',
    kidTip: 'Piling 2 to 3 meters of Martian dirt (regolith) on top of the habitat provides the same shield as Earth’s atmosphere!'
  },
  {
    id: 'diviner_cold_trap',
    title: 'Permanently Shadowed Regions (PSRs)',
    planet: 'Moon',
    instrument: 'LRO Diviner Lunar Radiometer Experiment',
    dataType: 'MEASURED',
    measuredData: 'Surface temperature inside Shackleton crater floor: 40 Kelvin (-233°C).',
    calculatedValue: 'Sublimation loss rate for water ice: < 1 mm per billion years.',
    simplifiedExplanation: 'Because the Moon’s axis barely tilts (only 1.5 degrees), the sun never shines over the rims of deep polar craters. These spots have been frozen in darkness for billions of years, acting like natural cryogenic cosmic freezers!',
    kidTip: 'Rovers exploring here need special heated lubricants, or their wheel gears will freeze solid.'
  },
  {
    id: 'donki_solar_storm',
    title: 'Coronal Mass Ejections & Space Weather',
    planet: 'Solar System',
    instrument: 'NASA DONKI (Space Weather Database)',
    dataType: 'MEASURED',
    measuredData: 'Fast CME plasma velocity: 1,400 km/s; Proton flux > 10 MeV exceeds 1,000 pfu.',
    calculatedValue: 'Transit time from Sun to Moon: 18 hours; Sun to Mars: 42 hours.',
    simplifiedExplanation: 'The Sun occasionally burps out giant bubbles of magnetized plasma and energetic particles called solar storms. When a flare is spotted, early warning satellites give astronauts time to take shelter.',
    kidTip: 'When ORBIT warns of a solar flare, EVAs are aborted immediately to keep the crew safe!'
  },
  {
    id: 'swim_ice',
    title: 'Subsurface Water Ice Mapping (SWIM)',
    planet: 'Mars',
    instrument: 'MRO SHARAD Radar & Thermal Inertia Sounder',
    dataType: 'CALCULATED',
    measuredData: 'Subsurface radar dielectric constant anomalies at 0–1m, 1–5m, and >5m depths.',
    calculatedValue: 'Ice Consistency Index (Ci) > 0.8 across northern lowlands.',
    simplifiedExplanation: 'Radar beams sent from an orbiter reflect differently off rock, sand, and pure ice. By reading the echo, scientists drew a subterranean map showing exactly how deep you have to dig to hit ice.',
    kidTip: 'Landing near shallow ice (0-1m) means our rovers won’t need heavy drills to get water!'
  }
];
