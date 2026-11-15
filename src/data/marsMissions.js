export const MARS_MISSIONS_DATA = {
  m01: {
    id: 'mars_m01',
    code: 'M01',
    title: 'MISSION M01 — LIFE ON MARS',
    subtitle: 'Build a home on the Red Planet.',
    duration: '10 Fictional Sols',
    setting: 'Fictional Human Exploration Base in Jezero Crater Region (Regional Ref: 77.5°E, 18.4°N)',
    briefing: 'Establish humankind’s first operational Mars outpost. Inspect and activate the life-support loop, clean dust from solar arrays, investigate subsurface water-ice evidence using regional SWIM data, balance greenhouse crop growth, practice radiation shelter protocols with historical Curiosity RAD telemetry, and secure the base during a Martian dust event.',
    steps: [
      {
        step: 1,
        title: 'Step 1: Arrival & First Exploration',
        desc: 'Exit the habitat airlock, survey the Jezero base perimeter, locate the solar array, greenhouse, water drill, radiation shelter, and pre-positioned return vehicle.',
        action: 'explore_base'
      },
      {
        step: 2,
        title: 'Step 2: Habitat Life-Support Activation',
        desc: 'Activate the oxygen generation loop, carbon dioxide removal scrubbers, and water recycling system (η = [W_rec / W_proc] * 100%).',
        action: 'open_habitat_panel'
      },
      {
        step: 3,
        title: 'Step 3: Power & Solar-Panel Dust Inspection',
        desc: 'Inspect solar arrays for dust accumulation (P_solar = G * A * η * f_dust * f_other). Clean panels to maintain battery charge reserves.',
        action: 'clean_solar_panels'
      },
      {
        step: 4,
        title: 'Step 4: Regional Water-Ice Investigation (SWIM)',
        desc: 'Analyze regional MRO SWIM composite consistency layers (0-1m, 1-5m, >5m) and activate the simulated water extraction drill.',
        action: 'open_water_station'
      },
      {
        step: 5,
        title: 'Step 5: Greenhouse Biology & Food Production',
        desc: 'Calibrate greenhouse growth factors (r_eff = r_max * f_T * f_L * f_W * f_CO2 * f_nut) to ensure self-sustaining food reserves.',
        action: 'open_greenhouse'
      },
      {
        step: 6,
        title: 'Step 6: Radiation Safety & Shelter Drill (MSL RAD)',
        desc: 'Review historical Curiosity Gale Crater radiation telemetry (Total Dose B 187.58 µGy/day) and execute a shelter drill into the regolith bunker.',
        action: 'open_rad_shelter'
      },
      {
        step: 7,
        title: 'Step 7: Environmental Science Station (MEDA & MCS)',
        desc: 'Examine Perseverance Sol 1553 surface weather (median pressure 639 Pa, median air temp 215.87 K) and MCS vertical atmospheric profiles.',
        action: 'open_env_station'
      },
      {
        step: 8,
        title: 'Step 8: Rover Research Expedition',
        desc: 'Drive the 6-wheeled rover to collect simulated geological training samples across the Jezero delta plain.',
        action: 'drive_rover'
      },
      {
        step: 9,
        title: 'Step 9: Equipment Malfunction & Dust Challenge',
        desc: 'Respond to an incoming regional dust storm event. Reduce non-essential power consumption to preserve life support battery reserves.',
        action: 'dust_challenge'
      },
      {
        step: 10,
        title: 'Step 10: Prepare for Return Mission & Save State',
        desc: 'Audit all remaining reserves, secure equipment, and store persistent expedition state for Mission M02.',
        action: 'save_m01_state'
      }
    ]
  },
  m02: {
    id: 'mars_m02',
    code: 'M02',
    title: 'MISSION M02 — THE JOURNEY HOME',
    subtitle: 'Your final mission is to bring everyone back safely.',
    duration: 'Final Departure & Earth Transit',
    setting: 'Jezero Outpost Return Vehicle Pad & Interplanetary Trajectory',
    briefing: 'The Mars surface stay is coming to an end and the planetary return window is open. Audit remaining consumables, make critical cargo allocation trade-offs between scientific samples and life-support spares, resolve a space-weather alert, execute the 10-point departure checklist, ascend to orbit, and navigate the journey home.',
    steps: [
      {
        step: 1,
        title: 'Step 1: Return Mission Briefing',
        desc: 'Load saved state from Mission M01. Review the lasting consequences of your power, water, greenhouse, and maintenance decisions.',
        action: 'load_state_briefing'
      },
      {
        step: 2,
        title: 'Step 2: Final Resource & Consumables Audit',
        desc: 'Audit remaining oxygen, water, food, power reserves, and crew health to confirm departure readiness.',
        action: 'audit_resources'
      },
      {
        step: 3,
        title: 'Step 3: Research Cargo Allocation Decision',
        desc: 'Balance limited return payload capacity: Choose between maximum geological samples vs backup life-support spares.',
        action: 'open_cargo_decision'
      },
      {
        step: 4,
        title: 'Step 4: Environmental & Space-Weather Warning',
        desc: 'Analyze space-weather caution from DONKI satellite tracking. Decide whether to launch immediately or delay for calmer solar conditions.',
        action: 'environmental_warning'
      },
      {
        step: 5,
        title: 'Step 5: 10-Point Departure Checklist',
        desc: 'Verify flight computers, pressurized cabin seals, ascent propellant, navigation alignment, and emergency beacons.',
        action: 'open_departure_checklist'
      },
      {
        step: 6,
        title: 'Step 6: Final Launch Decision',
        desc: 'Authorize ascent engine ignition or delay launch. (Crew safety is the ultimate priority).',
        action: 'launch_decision'
      },
      {
        step: 7,
        title: 'Step 7: Mars Ascent Sequence',
        desc: 'Monitor vehicle telemetry during the powered climb from Jezero Crater into Mars parking orbit.',
        action: 'cinematic_ascent'
      },
      {
        step: 8,
        title: 'Step 8: Interplanetary Return & Comms Delay',
        desc: 'Monitor spacecraft systems during the transit to Earth. Learn why Earth-Mars communication takes 5 to 20 minutes (t = d/c).',
        action: 'transit_monitoring'
      },
      {
        step: 9,
        title: 'Step 9: Final Mission Outcome & Certification',
        desc: 'Receive the final mission evaluation based on your cumulative decisions (Endings A, B, C, or D).',
        action: 'final_outcome'
      }
    ]
  }
};
