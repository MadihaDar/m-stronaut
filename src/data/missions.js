export const MOON_MISSIONS = [
  {
    id: 'moon_m01',
    number: '01',
    title: 'MISSION 01 — FIRST LIGHT: THE SOUTH POLE OUTPOST',
    subtitle: 'Shackleton Crater Rim (85°S to 90°S)',
    duration: '5 Operational Days',
    briefing: 'Establish humankind’s first permanent lunar south-polar outpost. Assess landing terrain using LOLA altimetry, plan a safe rover route, investigate LEND neutron suppression for hydrogen-rich volatiles, inspect Robbins crater morphology, and respond to a space-weather alert.',
    availableData: ['LOLA Orbit 200-400 / 400-800 Altimetry', 'LEND RDR RSCI Neutron Spectra', 'Robbins Lunar Crater Database 2018', 'DONKI Solar Flare Telemetry'],
    leadCrew: ['Alex Morgan', 'Leo Chen', 'Maya Patel', 'Noah Williams', 'ORBIT'],
    days: [
      {
        day: 1,
        title: 'Day 1: Landing-Site Assessment',
        objective: 'Analyze LOLA digital elevation model (DEM) and slope gradients. Select a safe, level outpost location on the Shackleton connecting ridge.',
        taskKey: 'landing_site'
      },
      {
        day: 2,
        title: 'Day 2: Rover Route Planning',
        objective: 'Compare alternative traversal paths using the slope cost heuristic. Choose the safest path to reach the exploration ridge.',
        taskKey: 'route_planner'
      },
      {
        day: 3,
        title: 'Day 3: LEND Neutron Investigation',
        objective: 'Drive rover to the permanently shadowed crater rim. Measure epithermal neutron count suppression with LEND detector.',
        taskKey: 'lend_scan'
      },
      {
        day: 4,
        title: 'Day 4: Robbins Crater Field Expedition',
        objective: 'Calculate great-circle distance to Shackleton and Faustini craters. Compare rim-to-floor depths and ejecta blanket features.',
        taskKey: 'crater_expedition'
      },
      {
        day: 5,
        title: 'Day 5: DONKI Space-Weather Alert & Debrief',
        objective: 'Respond to an incoming solar eruptive flare alert. Abort EVA, secure rover, and complete mission debrief.',
        taskKey: 'solar_alert'
      }
    ]
  },
  {
    id: 'moon_m02',
    number: '02',
    title: 'MISSION 02 — SHADOW WATCH: THE THERMAL FRONTIER',
    subtitle: 'Mare Imbrium & Aristillus Region (20°N to 30°N)',
    duration: '8 Operational Hours',
    briefing: 'Deploy to a distinct equatorial-to-mid-latitude thermal study region. Investigate extreme diurnal brightness temperature swings using Diviner GCP tables, decode Diviner JD AVG observation timing, analyze Diviner GDR L3 rock abundance, and earn the Science Commander certificate.',
    availableData: ['Diviner GCP Cumulative-Average Thermal Tables (20°N–30°N)', 'Diviner GHRM High-Resolution Mapping', 'Diviner GDR L3 Rock Abundance', 'Diviner JD AVG Timing'],
    leadCrew: ['Maya Patel', 'Leo Chen', 'Alex Morgan', 'Noah Williams', 'ORBIT'],
    hours: [
      {
        hour: '1–2',
        title: 'Hours 1–2: Thermal Brightness Mapping & JD AVG',
        objective: 'Query Diviner GCP tables for t3–t9 and tbol. Compare noon vs midnight delta_T. Decode Julian Date timing from JD AVG.',
        taskKey: 'thermal_mapping'
      },
      {
        hour: '3–4',
        title: 'Hours 3–4: Rock Abundance & Rover Hazard Evaluation',
        objective: 'Convert Diviner DN to fractional rock abundance (RA = DN * 0.001). Filter missing values and navigate around boulder hazards.',
        taskKey: 'rock_abundance'
      },
      {
        hour: '5–6',
        title: 'Hours 5–6: Aristillus & Autolycus Crater Geology',
        objective: 'Measure distance to complex Copernican craters and inspect blocky impact melt blankets.',
        taskKey: 'crater_geology'
      },
      {
        hour: '7–8',
        title: 'Hours 7–8: Mission Alert, Return & Commander Certificate',
        objective: 'Respond to mission alert, dock rover safely at the habitat, and compile the final Science Report.',
        taskKey: 'debrief_certificate'
      }
    ]
  }
];

export const MARS_TEMPLATE_MISSIONS = [
  {
    id: 'mars_m01',
    number: 'M01',
    title: 'MISSION M01 — RED HORIZON: THE FIRST HABITAT',
    subtitle: 'Jezero Crater Outpost Template',
    duration: '5 Sols',
    status: 'TEMPLATE (Awaiting Verified Mars Mission Datasets)',
    briefing: 'A fictional astronaut crew arrives at Jezero Crater. The team assesses terrain stability, verifies habitat power, inspects the 6-wheel rover, and manages consumables. (All Mars measurements clearly labeled as simulated training placeholders until verified Mars datasets are loaded).',
    availableData: ['Perseverance MEDA Sol 1553 Weather (Supplied)', 'MSL RAD Surface Dosimetry (Supplied)', 'MRO SWIM Subsurface Ice Maps (Supplied)', 'Mars Terrain DEM (Pending Verified Release)'],
    leadCrew: ['Alex Morgan', 'Leo Chen', 'Maya Patel', 'Noah Williams', 'ORBIT']
  },
  {
    id: 'mars_m02',
    number: 'M02',
    title: 'MISSION M02 — ANCIENT RIVER: THE GEOLOGY EXPEDITION',
    subtitle: 'Jezero Delta & Crater Rim Template',
    duration: '8 Sols',
    status: 'TEMPLATE (Awaiting Verified Mars Mission Datasets)',
    briefing: 'Explore the ancient river delta of Jezero Crater to investigate past water flow, sedimentary layers, and biosignature sampling sites. Includes rover traversing and responding to a simulated dust storm alert.',
    availableData: ['Mars MCS Atmospheric Profiles', 'Mars 2020 Spectral Indexes', 'Mars Crater Catalogue (Pending)'],
    leadCrew: ['Maya Patel', 'Leo Chen', 'Alex Morgan', 'Noah Williams', 'ORBIT']
  }
];
