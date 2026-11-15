/* ============================================================
   FRONTIER: MISSION ACADEMY — Main Entry Point
   ============================================================ */

import { GameEngine } from './GameEngine.js';

window.addEventListener('DOMContentLoaded', () => {
  // If the browser has a leftover hash like #moon-m1 or #sandbox from previous sessions, clear it
  // so the game NEVER auto-launches a mission automatically on load.
  const rawHash = (window.location.hash || '').toLowerCase();
  if (rawHash === '#moon-m1' || rawHash === '#sandbox') {
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch (_) {}
  }
  const initialHash = (window.location.hash || '').toLowerCase();

  const engine = new GameEngine();
  window.frontierEngine = engine; // Expose for debugging/inspection
  window.engine = engine;
  window.app = engine;

  // Start engine
  engine.init();

  // URL Hash shortcuts for automated & direct verification testing
  const handleHashRoute = (targetHash = null) => {
    const hash = (targetHash || window.location.hash || '').toLowerCase();
    if (hash === '#complete-moon-m1') {
      setTimeout(() => {
        engine.save.completeMission('moon_m1');
        const scoreData = engine.scoring ? engine.scoring.calculateFinalScore() : null;
        engine.showMissionCompletedModal({
          title: 'MISSION 1: ICE WATER HUNT ACCOMPLISHED',
          subtitle: 'South Pole Shackleton Ridge Outpost',
          points: 2000,
          resources: scoreData?.resources,
          praise: 'Outstanding work, Commander Alex Morgan! You drove the rover to the solar peak, deployed the parabolic reflector, and made life-saving trade-offs!'
        });
      }, 900);
    } else if (hash === '#mars-m0' || hash === '#mars0' || hash === '#mars-orbit') {
      setTimeout(() => {
        console.log('[Router] Navigating directly to MARS_M0 (Mars Orbital Recon)...');
        engine.setState('MARS_M0');
      }, 350);
    } else if (hash === '#mars-m1' || hash === '#mars1' || hash === '#jezero') {
      setTimeout(() => {
        console.log('[Router] Navigating directly to MARS_M1 (Jezero Crater)...');
        engine.setState('MARS_M1');
      }, 350);
    } else if (hash === '#mars-m2' || hash === '#mars2' || hash === '#arcadia' || hash === '#glacier') {
      setTimeout(() => {
        console.log('[Router] Navigating directly to MARS_M2 (Arcadia Planitia Glacier)...');
        engine.setState('MARS_M2');
      }, 350);
    } else if (hash === '#mars-m3' || hash === '#mars3' || hash === '#storm' || hash === '#valles') {
      setTimeout(() => {
        console.log('[Router] Navigating directly to MARS_M3 (Valles Marineris Storm)...');
        engine.setState('MARS_M3');
      }, 350);
    } else if (hash === '#mars-m4' || hash === '#mars4' || hash === '#olympus') {
      setTimeout(() => {
        console.log('[Router] Navigating directly to MARS_M4 (Olympus Mons Lava Tube)...');
        engine.setState('MARS_M4');
      }, 350);
    } else if (hash === '#mars-m5' || hash === '#mars5' || hash === '#phobos' || hash === '#return') {
      setTimeout(() => {
        console.log('[Router] Navigating directly to MARS_M5 (Phobos Relay & Earth Return)...');
        engine.setState('MARS_M5');
      }, 350);
    } else if (hash === '#moon-m0' || hash === '#moon0' || hash === '#orbit') {
      setTimeout(() => {
        console.log('[Router] Navigating directly to MOON_ORBIT...');
        engine.setState('MOON_ORBIT');
      }, 350);
    } else if (hash === '#moon-m1' || hash === '#moon1' || hash === '#southpole') {
      setTimeout(() => {
        console.log('[Router] Navigating directly to MOON_M1 (South Pole Shackleton)...');
        engine.setState('MOON_M1');
      }, 350);
    } else if (hash === '#moon-m2' || hash === '#moon2' || hash === '#thermal') {
      setTimeout(() => {
        console.log('[Router] Navigating directly to MOON_M2 (Mare Imbrium)...');
        engine.setState('MOON_M2');
      }, 350);
    } else if (hash === '#moon-m3' || hash === '#moon3' || hash === '#lava') {
      setTimeout(() => {
        console.log('[Router] Navigating directly to MOON_M3 (Lava Tube)...');
        engine.setState('MOON_M3');
      }, 350);
    } else if (hash === '#moon-m4' || hash === '#moon4' || hash === '#cryo') {
      setTimeout(() => {
        console.log('[Router] Navigating directly to MOON_M4 (Cryo Ice Mine)...');
        engine.setState('MOON_M4');
      }, 350);
    } else if (hash === '#moon-m5' || hash === '#moon5' || hash === '#farside') {
      setTimeout(() => {
        console.log('[Router] Navigating directly to MOON_M5 (Far Side / Daedalus)...');
        engine.setState('MOON_M5');
      }, 350);
    } else if (hash === '#mars-m1' || hash === '#mars1' || hash === '#jezero') {
      setTimeout(() => {
        console.log('[Router] Navigating directly to MARS_M1 (Jezero Crater)...');
        engine.setState('MARS_M1');
      }, 350);
    } else if (hash === '#tradeoff-test' || hash === '#dilemma') {
      setTimeout(() => {
        console.log('[Router] Presenting test tradeoff decision with 10s timer...');
        if (!engine.isSurfaceExpedition()) {
          engine.setState('MOON_M1');
        }
        setTimeout(() => {
          if (engine.tradeoff) {
            engine.tradeoff.presentDecision({
              id: 'test_decision_hash',
              title: 'Critical Outpost Power Dilemma: Oxygen vs Deflector Shield',
              scenario: 'A violent dust storm threatens the primary array. How should we balance life support vs base deflector shields?',
              text: 'A violent dust storm threatens the primary array. How should we balance life support vs base deflector shields?',
              scientificBasis: 'NASA Exploration Architecture resource balancing protocol for deep space habitats.',
              basis: 'NASA Exploration Architecture resource balancing protocol for deep space habitats.',
              choices: [
                {
                  id: 'c1',
                  title: '1. Prioritize Life Support & ECLSS',
                  description: 'Maximum oxygen generation and habitat heating. Cuts non-vital labs.',
                  desc: 'Maximum oxygen generation and habitat heating. Cuts non-vital labs.',
                  icon: '🫁',
                  impacts: [
                    { label: '+40% Oxygen Scrubbing', type: 'reward' },
                    { label: '-20% Base Power', type: 'warning' },
                    { label: 'Science offline', type: 'risk' }
                  ],
                  badges: [
                    { text: '+40% Oxygen Scrubbing', type: 'reward' },
                    { text: '-20% Base Power', type: 'warning' },
                    { text: 'Science offline', type: 'risk' }
                  ],
                  consequences: { oxygen: 40, power: -20 }
                },
                {
                  id: 'c2',
                  title: '2. Prioritize Electromagnetic Deflector Shield',
                  description: 'Maintain full storm shield against high-energy ionizing protons.',
                  desc: 'Maintain full storm shield against high-energy ionizing protons.',
                  icon: '🛡️',
                  impacts: [
                    { label: '+100% Storm Protection', type: 'reward' },
                    { label: '-30% Base Power', type: 'warning' },
                    { label: 'Chilly Habitat', type: 'risk' }
                  ],
                  badges: [
                    { text: '+100% Storm Protection', type: 'reward' },
                    { text: '-30% Base Power', type: 'warning' },
                    { text: 'Chilly Habitat', type: 'risk' }
                  ],
                  consequences: { power: -30, crewCondition: 15 }
                }
              ],
              onChoice: (choice) => {
                console.log('[Test Decision Selected]:', choice);
              }
            });
          }
        }, 500);
      }, 300);
    } else if (hash === '#destinations') {
      setTimeout(() => engine.setState('DESTINATION'), 400);
    }
  };

  if (initialHash && initialHash !== '#main-menu') {
    handleHashRoute(initialHash);
  }
  window.addEventListener('hashchange', () => handleHashRoute());

  // Audio gesture unlock (ensures Web Audio context starts on first interaction)
  const unlockAudio = () => {
    engine.audio.init();
    if (engine.audio.ctx && engine.audio.ctx.state === 'suspended') {
      engine.audio.ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('mousedown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
});
