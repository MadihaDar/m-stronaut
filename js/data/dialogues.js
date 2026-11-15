/* ============================================================
   FRONTIER: MISSION ACADEMY — Dialogue Trees (Kid-Friendly 7–12)
   Easy-to-understand space science & exciting astronaut missions
   ============================================================ */

/**
 * Science tag syntax within text strings:
 *   {measured|Real measured value}   → green badge
 *   {calculated|Derived value}       → blue badge
 *   {model|Model-based value}        → gold badge
 *   {story|Fictional element}        → orange badge
 */

export const DIALOGUES = {

  /* ─── INTRO: Welcome to the Sandbox ─── */
  sandbox_intro: {
    id: 'sandbox_intro',
    lines: [
      {
        speaker: 'orbit',
        text: 'MISSION SYSTEMS ONLINE! Welcome to the Frontier Mission Academy training grounds. All systems are green and ready.'
      },
      {
        speaker: 'alex',
        text: 'Good morning, astronaut! I\'m Commander Alex Morgan. Before we launch into real deep space missions, let\'s practice the basics together.'
      },
      {
        speaker: 'alex',
        text: 'This is our training sandbox — a safe proving ground where you can try out all the controls and explore freely!'
      },
      {
        speaker: 'leo',
        text: 'Hey! I\'m Leo Chen, your mission engineer. See that awesome rover over there? Use WASD or the joystick to drive, and press R to jump in and out!'
      },
      {
        speaker: 'maya',
        text: 'I\'m Maya Patel, planetary geologist! Those glowing beacons you see around the surface are mystery targets. Walk up and press E to scan them!'
      },
      {
        speaker: 'noah',
        text: 'And I\'m Noah! I\'m watching your oxygen, water, and power gauges on the right side of the screen. Keep them in the green and you\'ll do great!'
      },
      {
        speaker: 'orbit',
        text: 'ORBIT BRIEFING: When you scan targets, I show real NASA data! I label {measured|measured data}, {calculated|calculated facts}, {model|computer models}, and {story|story parts}.',
        choices: [
          { text: '🚀 Let\'s explore! I\'m ready.', goto: null },
          { text: '❓ How do the science badges work?', goto: 'sandbox_science_explainer' }
        ]
      }
    ]
  },

  /* ─── Science Explainer ─── */
  sandbox_science_explainer: {
    id: 'sandbox_science_explainer',
    lines: [
      {
        speaker: 'orbit',
        text: 'Great question! Real NASA spacecraft use high-tech instruments to gather data. Here is what the badges mean:'
      },
      {
        speaker: 'orbit',
        text: 'A {measured|MEASURED} badge means a real robot or satellite measured it — like temperature sensors on the Perseverance Mars rover!'
      },
      {
        speaker: 'orbit',
        text: 'A {calculated|CALCULATED} badge means scientists used math to figure it out — like finding how much water ice is hidden under the dirt.'
      },
      {
        speaker: 'maya',
        text: 'A {model|MODEL} badge means it\'s a smart computer simulation based on real physics to help scientists know where to search!'
      },
      {
        speaker: 'orbit',
        text: 'And {story|STORY} means it is part of our fun adventure — like our character team and future moon bases. Real facts, exciting game!'
      },
      {
        speaker: 'alex',
        text: 'Every decision you make matches real trade-offs NASA astronauts actually face. Ready to train?'
      }
    ]
  },

  /* ─── Radiation Warning ─── */
  radiation_warning: {
    id: 'radiation_warning',
    lines: [
      {
        speaker: 'orbit',
        text: 'ALERT: Solar storm incoming! The Sun released a burst of high-energy particles heading our way! {measured|NASA space weather alert}.'
      },
      {
        speaker: 'noah',
        text: 'Commander, we need to choose fast! We can power up our thick magnetic shields, or take shelter inside our rover.'
      },
      {
        speaker: 'alex',
        text: 'What should we do, team?',
        choices: [
          { text: '🛡️ Power up shields — protect the crew (-15% power)', goto: 'radiation_shield_choice', applyResources: { power: -15, crewCondition: 10 } },
          { text: '🚜 Shelter in rover — save base power', goto: 'radiation_rover_choice', applyResources: { crewCondition: -5 } },
          { text: '⚠️ Stay outside on EVA — risky choice', goto: 'radiation_eva_choice', applyResources: { crewCondition: -15 } }
        ]
      }
    ]
  },

  radiation_shield_choice: {
    id: 'radiation_shield_choice',
    lines: [
      {
        speaker: 'leo',
        text: 'Shields powered up! That draws extra battery power, but keeps our crew totally safe and cozy inside.'
      },
      {
        speaker: 'noah',
        text: 'Smart move! Solar storms can give astronauts dangerous doses of radiation. Extra shielding keeps everyone healthy.'
      },
      {
        speaker: 'orbit',
        text: 'ORBIT: Radiation blocked! Crew safety: 100%. That is how real flight directors protect astronauts on the International Space Station.'
      }
    ]
  },

  radiation_rover_choice: {
    id: 'radiation_rover_choice',
    lines: [
      {
        speaker: 'leo',
        text: 'Rover shelter active! The metal rover shell gives good protection without using any extra base power.'
      },
      {
        speaker: 'noah',
        text: 'The crew gets a tiny dose, but stays well under safety limits. Good balance of power and safety!'
      }
    ]
  },

  radiation_eva_choice: {
    id: 'radiation_eva_choice',
    lines: [
      {
        speaker: 'noah',
        text: 'Warning! Spacesuits are too thin to block high-energy solar rays. We must head inside immediately!'
      },
      {
        speaker: 'alex',
        text: 'Noah is right! Crew health always comes first in space. Everyone get inside the airlock!'
      }
    ]
  },

  /* ─── Investigation Target: Rock Sample ─── */
  scan_rock: {
    id: 'scan_rock',
    lines: [
      {
        speaker: 'orbit',
        text: 'Scan complete! This is dark volcanic basalt rock. Surface temperature is {measured|~209 Kelvin (-64°C)}.'
      },
      {
        speaker: 'maya',
        text: 'Brrr, that\'s cold! But that freezing cold ground is great news — it keeps ancient water ice frozen solid like rock underneath!'
      },
      {
        speaker: 'leo',
        text: 'We can use the rover drill to grab an ice sample! That will take about 12% of our battery power. What do you think?',
        choices: [
          { text: '🧊 Drill for ice sample (-12% rover power, +20 water)', goto: null, applyResources: { roverEnergy: -12, water: 20 } },
          { text: '📝 Record data & save rover battery', goto: null }
        ]
      }
    ]
  },

  /* ─── Low Resource Warning ─── */
  low_oxygen: {
    id: 'low_oxygen',
    lines: [
      {
        speaker: 'noah',
        text: 'Commander! Oxygen reserves have dropped below 50%! Start heading back toward our base or rover.'
      },
      {
        speaker: 'orbit',
        text: 'ORBIT: Plenty of time if you head back now. Refill stations are waiting inside the airlock.'
      },
      {
        speaker: 'alex',
        text: 'Safety first, team! Let\'s refill our suit tanks before we continue exploring.'
      }
    ]
  },

  /* ══════════════════════════════════════════════════════════
     MOON CAMPAIGN: MISSION INTROS (KID-FRIENDLY & CLEAR)
     ══════════════════════════════════════════════════════════ */

  moon_m1_intro: {
    id: 'moon_m1_intro',
    lines: [
      {
        speaker: 'alex',
        text: 'Welcome to Shackleton Crater at the Moon\'s South Pole! The Sun hugs the horizon and shadows stretch out forever.'
      },
      {
        speaker: 'leo',
        text: 'Your mission: Drive your rover up the crater ridge to the glowing beacon! Deploy our shiny solar mirror to bounce sunlight into our solar panels.'
      },
      {
        speaker: 'orbit',
        text: 'MISSION BRIEFING: Watch out for solar storm alerts! If an alarm sounds, race back to the lunar lander to stay safe!'
      }
    ]
  },

  moon_m1_day1_intro: {
    id: 'moon_m1_day1_intro',
    lines: [
      {
        speaker: 'alex',
        text: 'Welcome to Shackleton Crater at the Moon\'s South Pole! The Sun hugs the horizon and shadows stretch out forever.'
      },
      {
        speaker: 'leo',
        text: 'Your mission: Drive your rover up the crater ridge to the glowing beacon! Deploy our shiny solar mirror to bounce sunlight into our solar panels.'
      },
      {
        speaker: 'orbit',
        text: 'MISSION BRIEFING: Watch out for solar storm alerts! If an alarm sounds, race back to the lunar lander to stay safe!'
      }
    ]
  },

  moon_m1_day1_debrief: {
    id: 'moon_m1_day1_debrief',
    lines: [
      {
        speaker: 'maya',
        text: 'Awesome job scanning that crater ridge! Since the Moon has no oceans or sea level, scientists measure mountain heights straight from the center of the Moon!'
      },
      {
        speaker: 'leo',
        text: 'The slope is gentle — just 5 degrees! That makes it super smooth for driving our rover.'
      }
    ]
  },

  moon_m1_day2_debrief: {
    id: 'moon_m1_day2_debrief',
    lines: [
      {
        speaker: 'leo',
        text: 'Check this out: driving straight up a steep crater wall takes twice as much battery power as taking the gentle path around the ridge!'
      },
      {
        speaker: 'alex',
        text: 'Saving battery power means we have plenty left for our suit heaters and scientific tools!'
      }
    ]
  },

  moon_m1_day3_debrief: {
    id: 'moon_m1_day3_debrief',
    lines: [
      {
        speaker: 'maya',
        text: 'Our neutron scanner detected hydrogen! When cosmic particles hit hydrogen in water ice, they slow way down. That proves water ice is hiding right under our wheels!'
      },
      {
        speaker: 'noah',
        text: 'Water on the Moon is priceless — we can drink it, grow plants with it, and even turn it into rocket fuel!'
      }
    ]
  },

  moon_m1_day4_debrief: {
    id: 'moon_m1_day4_debrief',
    lines: [
      {
        speaker: 'maya',
        text: 'Shackleton Crater is over 20 kilometers wide and 4 kilometers deep! Ice trapped in its freezing shadows has stayed frozen for billions of years!'
      }
    ]
  },

  moon_m1_day5_alert: {
    id: 'moon_m1_day5_alert',
    lines: [
      {
        speaker: 'orbit',
        text: 'ALERT: The Sun released a burst of solar protons! We must take shelter immediately!'
      },
      {
        speaker: 'noah',
        text: 'Commander, what is our survival plan?',
        choices: [
          { text: '🛡️ Seek thick shelter in the Lander bunker (Safest)', goto: 'moon_m1_alert_safe', applyResources: { power: -15, crewCondition: 10 } },
          { text: '🚜 Shelter inside rover cabin (Conserves base power)', goto: 'moon_m1_alert_rover', applyResources: { power: -5, roverEnergy: -10, crewCondition: -5 } },
          { text: '⚠️ Stay outside on the surface (Unsafe!)', goto: 'moon_m1_alert_risk', applyResources: { crewCondition: -20, oxygen: -15 } }
        ]
      }
    ]
  },

  moon_m1_alert_safe: {
    id: 'moon_m1_alert_safe',
    lines: [
      {
        speaker: 'noah',
        text: 'Great decision! The heavy metal spacecraft walls block 98% of the space storm. The crew is safe and sound!'
      },
      {
        speaker: 'alex',
        text: 'Mission completed with top honors! You learned how to find high sunlight peaks and protect your crew!'
      }
    ]
  },

  moon_m1_alert_rover: {
    id: 'moon_m1_alert_rover',
    lines: [
      {
        speaker: 'leo',
        text: 'Rover sealed! The rover hull gives good shielding and saves base electricity.'
      },
      {
        speaker: 'alex',
        text: 'A smart operational trade-off. Mission 1 successfully completed!'
      }
    ]
  },

  moon_m1_alert_risk: {
    id: 'moon_m1_alert_risk',
    lines: [
      {
        speaker: 'noah',
        text: 'Spacesuits cannot block solar storms! Always head to shelter when a solar alert sounds.'
      }
    ]
  },

  /* ─── MISSION 2: MARE IMBRIUM (THERMAL) ─── */
  moon_m2_intro: {
    id: 'moon_m2_intro',
    lines: [
      {
        speaker: 'alex',
        text: 'Commander, we have touched down in Mare Imbrium! It\'s pitch black and freezing cold out in the lunar shadows.'
      },
      {
        speaker: 'maya',
        text: 'Your mission: Drive your rover down the volcanic plain to the glowing beacon! Use your heat laser scanner to see how much solar warmth that giant rock trapped.'
      },
      {
        speaker: 'noah',
        text: 'Keep an eye on base heater power! We have to balance our batteries so our base camp doesn\'t freeze!'
      }
    ]
  },

  moon_m2_hour1_debrief: {
    id: 'moon_m2_hour1_debrief',
    lines: [
      {
        speaker: 'maya',
        text: 'Because the Moon has no atmosphere, temperatures swing from super hot in sunlight (120°C) to freezing cold in shadow (-130°C)!'
      }
    ]
  },

  moon_m2_hour2_debrief: {
    id: 'moon_m2_hour2_debrief',
    lines: [
      {
        speaker: 'orbit',
        text: 'Our infrared sensors measure surface warmth across the crater floor. Every reading is tracked in real-time!'
      }
    ]
  },

  moon_m2_hour3_debrief: {
    id: 'moon_m2_hour3_debrief',
    lines: [
      {
        speaker: 'maya',
        text: 'Heat anomaly detected! That giant boulder is 24 degrees warmer than the sandy ground around it!'
      },
      {
        speaker: 'leo',
        text: 'Fine moon dust cools down in seconds, but big solid boulders hold heat like big thermal blankets through the long night!'
      }
    ]
  },

  moon_m2_hour5_debrief: {
    id: 'moon_m2_hour5_debrief',
    lines: [
      {
        speaker: 'leo',
        text: 'That high rock density explains the warmth! Understanding thermal rocks helps astronauts choose the safest places to build heated shelters.'
      }
    ]
  },

  moon_m2_hour6_debrief: {
    id: 'moon_m2_hour6_debrief',
    lines: [
      {
        speaker: 'maya',
        text: 'We verified the crater: Aristillus Crater! Its ancient asteroid splash marks stretch across the entire lava plain.'
      }
    ]
  },

  moon_m2_hour7_alert: {
    id: 'moon_m2_hour7_alert',
    lines: [
      {
        speaker: 'noah',
        text: 'Space storm alert received! Inside our mobile lab, storm shielding is active and keeping everyone protected.'
      }
    ]
  },

  moon_m2_hour8_complete: {
    id: 'moon_m2_hour8_complete',
    lines: [
      {
        speaker: 'alex',
        text: 'Fantastic work, Commander! You learned how rocks trap solar heat and how astronauts keep their equipment warm during the freezing lunar night!'
      }
    ]
  },

  /* ─── MISSION 3: MARIUS HILLS (LAVA TUBE) ─── */
  moon_m3_intro: {
    id: 'moon_m3_intro',
    lines: [
      {
        speaker: 'alex',
        text: 'Welcome to Marius Hills! Long ago, ancient moon volcanoes carved out giant hollow underground tunnels called lava tubes!'
      },
      {
        speaker: 'maya',
        text: 'Underground, astronauts are completely protected from meteorites and space radiation! Follow the glowing markers into the cavern.'
      },
      {
        speaker: 'leo',
        text: 'Your mission: Deploy our 3D laser scanner to create a map of the cave for our future moon city!'
      }
    ]
  },

  /* ─── MISSION 4: CABEUS CRATER (CRYO ICE) ─── */
  moon_m4_intro: {
    id: 'moon_m4_intro',
    lines: [
      {
        speaker: 'alex',
        text: 'Commander, welcome to Cabeus Crater! Inside this dark crater shadow, it is colder than Pluto!'
      },
      {
        speaker: 'maya',
        text: 'Pure water ice is frozen rock-solid inside the lunar dirt here! Follow the glowing beacon to the ice deposit.'
      },
      {
        speaker: 'leo',
        text: 'Your mission: Deploy our cryo-drill to extract lunar ice and melt it into drinking water and rocket fuel!'
      }
    ]
  },

  /* ─── MISSION 5: FAR SIDE (RADIO SHIELD) ─── */
  moon_m5_intro: {
    id: 'moon_m5_intro',
    lines: [
      {
        speaker: 'alex',
        text: 'Welcome to the Far Side of the Moon! The giant bulk of the Moon blocks all radio, cell phone, and television signals from Earth.'
      },
      {
        speaker: 'maya',
        text: 'That makes this the quietest place in the entire solar system to listen to the stars!'
      },
      {
        speaker: 'leo',
        text: 'Your mission: Drive to the beacon and set up our giant radio telescope antennas to listen for deep space signals from the start of the universe!'
      }
    ]
  },

  /* ══════════════════════════════════════════════════════════
     MARS CAMPAIGN: MISSION INTROS (KID-FRIENDLY & CLEAR)
     ══════════════════════════════════════════════════════════ */

  mars_m1_intro: {
    id: 'mars_m1_intro',
    lines: [
      {
        speaker: 'alex',
        text: 'Touchdown confirmed on Mars! Welcome to Jezero Crater, a giant red desert with weak gravity and thin air.'
      },
      {
        speaker: 'leo',
        text: 'Step out through the spacecraft airlock! Walking feels light and bouncy, but remember to watch your suit oxygen!'
      },
      {
        speaker: 'maya',
        text: 'Your mission: Follow the purple beacon to inspect our habitat, check our greenhouse plants, and drill for ancient lake bed mud samples!'
      }
    ]
  },

  mars_m1_step1_arrival: {
    id: 'mars_m1_step1_arrival',
    lines: [
      {
        speaker: 'alex',
        text: 'Touchdown confirmed in Jezero Crater! Look at the horizon — that distinct salmon-red sky is caused by fine airborne iron-oxide dust.'
      },
      {
        speaker: 'leo',
        text: 'Mars gravity is only 38% of Earth! You can jump super high, but remember your momentum still carries you forward!'
      },
      {
        speaker: 'orbit',
        text: 'ORBIT TELEMETRY: Sol 1 begins. Step 2 requires activating our connected habitat systems. Proceed to the central hub.'
      }
    ]
  },

  mars_m1_step2_habitat: {
    id: 'mars_m1_step2_habitat',
    lines: [
      {
        speaker: 'noah',
        text: 'Habitat connected systems are online! Super-insulating aerogel walls keep our heat inside while outside is freezing cold (-57°C)!'
      }
    ]
  },

  mars_m1_step3_power: {
    id: 'mars_m1_step3_power',
    lines: [
      {
        speaker: 'leo',
        text: 'Our solar panels turn Martian sunlight into electric power. When fine red dust settles on the glass, we wipe them clean to keep full power!'
      }
    ]
  },

  mars_m1_step4_water: {
    id: 'mars_m1_step4_water',
    lines: [
      {
        speaker: 'maya',
        text: 'Radar detected signs of buried ice 1 to 5 meters underground! Ice will be essential for our future drinking water.'
      }
    ]
  },

  mars_m1_step5_greenhouse: {
    id: 'mars_m1_step5_greenhouse',
    lines: [
      {
        speaker: 'noah',
        text: 'Welcome to our space greenhouse! Our closed-loop water recycler recovers 94% of our moisture to grow fresh space vegetables!'
      }
    ]
  },

  mars_m1_step6_radiation: {
    id: 'mars_m1_step6_radiation',
    lines: [
      {
        speaker: 'noah',
        text: 'Piling thick Martian sand and dirt over our habitat cuts space radiation by over 55%! That keeps astronauts healthy.'
      }
    ]
  },

  mars_m1_step7_environment: {
    id: 'mars_m1_step7_environment',
    lines: [
      {
        speaker: 'maya',
        text: 'Our weather sensors measure air pressure and wind speed so we can spot incoming dust storms before they arrive.'
      }
    ]
  },

  mars_m1_step8_rover: {
    id: 'mars_m1_step8_rover',
    lines: [
      {
        speaker: 'leo',
        text: 'Rover expedition successful! We drilled into ancient clay mudstones from when Jezero Crater was filled with a deep lake!'
      }
    ]
  },

  mars_m1_step9_dust: {
    id: 'mars_m1_step9_dust',
    lines: [
      {
        speaker: 'orbit',
        text: 'EMERGENCY: High winds are kicking up a massive dust storm! Head inside the habitat to stay safe.'
      }
    ]
  },

  mars_m1_step10_complete: {
    id: 'mars_m1_step10_complete',
    lines: [
      {
        speaker: 'alex',
        text: 'Sol 10 completed! You established the base camp, explored the ancient lake bed, and survived on Mars!'
      }
    ]
  },

  /* ─── MARS MISSION 2: DUST STORM CRISIS ─── */
  mars_m2_intro: {
    id: 'mars_m2_intro',
    lines: [
      {
        speaker: 'alex',
        text: 'RED ALERT! A violent Martian dust storm is tearing across Jezero Crater with 100 km/h winds!'
      },
      {
        speaker: 'orbit',
        text: 'Thick dust is blocking the sun and your suit battery is draining fast! Sprint 65 meters to the Habitat airlock immediately!'
      },
      {
        speaker: 'leo',
        text: 'Once inside, open the emergency power console to keep our life support running through the blackout!'
      }
    ]
  }
};

/** Get a dialogue by id */
export function getDialogue(id) {
  return DIALOGUES[id] ?? null;
}

/** Parse science tags from text: {measured|text} → HTML span */
export function parseDialogueText(raw) {
  return raw.replace(/\{(measured|calculated|model|story)\|([^}]+)\}/g, (_, type, text) => {
    return `<span class="science-tag ${type}">${text}</span>`;
  });
}
