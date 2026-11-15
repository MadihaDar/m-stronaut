/* ============================================================
   FRONTIER: MISSION ACADEMY — Educational Tooltip & (i) System
   Kid-friendly plain-English scientific glossary with interactive (i) popups
   ============================================================ */

export const SCIENCE_GLOSSARY = {
  'eclss': {
    term: 'ECLSS (Life Support System)',
    definition: 'Environmental Control and Life Support System! The awesome machines that scrub toxic carbon dioxide into breathable oxygen and recycle clean drinking water for astronauts.'
  },
  'psr': {
    term: 'PSR (Permanently Shadowed Region)',
    definition: 'Deep polar craters where sunlight has never shone for billions of years! It is one of the coldest spots in the solar system (-240°C), preserving pure frozen water ice.'
  },
  'regolith': {
    term: 'Regolith (Space Dust)',
    definition: 'The layer of powdery, crunchy dust and smashed rock gravel covering the Moon and Mars like gray powdered sugar!'
  },
  'hydrolox': {
    term: 'Hydrolox (Rocket Propellant)',
    definition: 'Super-cold rocket fuel made by mixing liquid hydrogen (-253°C) and liquid oxygen (-183°C). When burned, its only exhaust is clean water vapor!'
  },
  'tradeoff': {
    term: 'Trade-off',
    definition: 'A crucial astronaut choice: when choosing more of one vital thing (like extra oxygen or active heating) means using up another (like limited battery power or food rations)!'
  },
  'solar storm': {
    term: 'Solar Particle Storm',
    definition: 'A blast of high-energy protons hurled by the Sun across space that can penetrate spacecraft walls unless heavy water or magnetic shielding is active!'
  },
  'solar flare': {
    term: 'Solar Flare',
    definition: 'An intense flash of light and X-rays erupting on the Sun that reaches the Moon at the speed of light (approx. 8 minutes)!'
  },
  'cme': {
    term: 'CME (Coronal Mass Ejection)',
    definition: 'A gigantic bubble of billions of tons of magnetized solar plasma blasted into space at millions of miles per hour!'
  },
  'albedo': {
    term: 'Albedo (Reflectivity)',
    definition: 'How shiny or reflective a surface is! Bright icy spots bounce sunlight away (high albedo), while dark volcanic rocks absorb heat (low albedo).'
  },
  'spectrometry': {
    term: 'Spectrometry',
    definition: 'Shooting lasers or light prisms at rocks like a detective to figure out exactly what minerals and metals they are made of without breaking them!'
  },
  'lola': {
    term: 'LOLA (Laser Altimeter)',
    definition: 'Lunar Orbiter Laser Altimeter—a NASA satellite instrument that fires laser beams down to the Moon to map every mountain ridge and crater floor.'
  },
  'lend': {
    term: 'LEND (Neutron Detector)',
    definition: 'Lunar Exploration Neutron Detector—a NASA sensor that counts bouncing neutrons to sniff out hidden hydrogen and buried water ice under the dust!'
  },
  'diviner': {
    term: 'Diviner (Lunar Radiometer)',
    definition: 'NASA’s infrared temperature camera in lunar orbit that measures freezing crater floors (-240°C) and scorching hot boulders in real time.'
  },
  'donki': {
    term: 'DONKI Space Weather System',
    definition: 'NASA’s real-time early warning network that tracks solar flares and coronal mass ejections to warn astronauts before radiation strikes!'
  },
  'grail': {
    term: 'GRAIL Gravity Probes',
    definition: 'Twin NASA spacecraft that mapped subtle gravity tugs to discover massive underground empty lava tubes suitable for future human cities!'
  },
  'lroc': {
    term: 'LROC Satellite Camera',
    definition: 'Ultra-high-resolution NASA cameras orbiting the Moon that can spot individual rover tracks and 65-meter skylight cave openings from 50 km up!'
  },
  'water ice': {
    term: 'Water Ice (Lunar H₂O)',
    definition: 'Precious frozen water buried beneath polar regolith that astronauts can purify for drinking and split into oxygen air and hydrogen rocket fuel!'
  },
  'permafrost': {
    term: 'Permafrost',
    definition: 'Subsurface soil and gravel frozen solid like stone for billions of years at cryogenic temperatures.'
  },
  'sublimation': {
    term: 'Sublimation',
    definition: 'When frozen ice turns directly into gas vapor in a vacuum without ever melting into liquid water first!'
  },
  'dosimeter': {
    term: 'Radiation Dosimeter',
    definition: 'A badge or handheld instrument that counts invisible ionizing radiation particles hitting an astronaut’s body.'
  },
  'bolometric': {
    term: 'Bolometric Heat',
    definition: 'A scientific term for measuring the total combined thermal energy and radiation coming off a planetary body.'
  },
  'epithermal': {
    term: 'Epithermal Neutrons',
    definition: 'Subatomic particles knocked loose by cosmic rays that slow down when colliding with hydrogen atoms, proving water is present!'
  },
  'cosmic rays': {
    term: 'Galactic Cosmic Rays (GCR)',
    definition: 'Super-fast atomic nuclei blasted from ancient exploding stars (supernovae) across the galaxy traveling near the speed of light!'
  },
  'magnetosphere': {
    term: 'Magnetosphere',
    definition: 'An invisible magnetic bubble surrounding a planet that deflects harmful solar wind and cosmic particle radiation.'
  },
  'basalt': {
    term: 'Basaltic Volcanic Rock',
    definition: 'Dense, dark volcanic stone formed when ancient red-hot magma cooled. Basalt makes an excellent natural radiation shield!'
  },
  'volatiles': {
    term: 'Volatile Elements',
    definition: 'Molecules like water, methane, and ammonia that quickly vaporize into gas when warmed by the sun.'
  },
  'microgravity': {
    term: 'Microgravity',
    definition: 'The floating sensation in space where gravity appears near-zero because you are in continuous freefall around a world.'
  },
  'dipole': {
    term: 'Dipole Radio Antenna',
    definition: 'An antenna made of two straight conductive rods used to detect low-frequency radio waves from the Cosmic Dawn.'
  },
  'emcon': {
    term: 'EMCON (Emission Control)',
    definition: 'Radio silence protocol! Astronauts shut down vehicle motors and cabin heaters to stop local radio noise from drowning out faint cosmic signals.'
  }
};

export class TooltipSystem {
  constructor(engine) {
    this.engine = engine;
    this.container = null;
    this._initDOM();
  }

  _initDOM() {
    this.container = document.getElementById('edu-tooltip-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'edu-tooltip-container';
      this.container.className = 'edu-tooltip-box';
      document.body.appendChild(this.container);
    }

    // Dismiss on click anywhere else
    window.addEventListener('click', (e) => {
      if (!e.target.closest('.edu-info-icon') && !e.target.closest('#edu-tooltip-container')) {
        this.hideTooltip();
      }
    });
  }

  /**
   * Scans an HTML string, finds technical terms, and wraps them in an interactive (i) badge
   */
  decorateHTML(htmlText) {
    if (!htmlText || typeof htmlText !== 'string') return htmlText;

    let result = htmlText;
    const sortedTerms = Object.keys(SCIENCE_GLOSSARY).sort((a, b) => b.length - a.length);

    sortedTerms.forEach(key => {
      // If already wrapped for this glossary term, skip to prevent double-wrapping
      if (result.includes(`data-term-key="${key}"`)) return;

      const data = SCIENCE_GLOSSARY[key];
      // Escape for regex
      const escapedKey = key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      // Match whole word, case insensitive, not already inside an HTML tag or attribute
      const regex = new RegExp(`\\b(${escapedKey})\\b(?![^<]*>|[^<>]*<\\/(?:button|span)>)`, 'gi');
      result = result.replace(regex, (match) => {
        return `<span class="edu-term-wrapper">${match}<span class="edu-info-icon" role="button" tabindex="0" data-term-key="${key}" title="Click or hover for plain English definition" aria-label="Learn meaning of ${match}">ⓘ</span></span>`;
      });
    });

    return result;
  }

  /**
   * Helper that traverses and decorates all suitable text nodes in a DOM element
   */
  decorateElement(rootElement) {
    if (!rootElement) return;

    // Target elements to decorate text inside (paragraphs, spans, list items)
    const targets = rootElement.querySelectorAll('.dest-card-desc, .goal-desc, .tradeoff-scenario-desc, .tradeoff-choice-desc, .basis-text, .kid-tagline, .panel-body > div');
    targets.forEach(el => {
      if (!el.getAttribute('data-edu-decorated')) {
        el.setAttribute('data-edu-decorated', 'true');
        el.innerHTML = this.decorateHTML(el.innerHTML);
      }
    });

    this.bindTooltips(rootElement);
  }

  /**
   * Binds mouseenter/mouseleave/click listeners onto any .edu-info-icon elements inside a container
   */
  bindTooltips(rootElement = document) {
    if (!rootElement) return;
    const buttons = rootElement.querySelectorAll('.edu-info-icon:not([data-bound])');
    buttons.forEach(btn => {
      btn.setAttribute('data-bound', 'true');

      const showTip = (e) => {
        e.stopPropagation();
        const key = btn.getAttribute('data-term-key');
        const data = SCIENCE_GLOSSARY[key];
        if (!data) return;

        this.container.innerHTML = `
          <div class="edu-tooltip-header">
            <span class="edu-tooltip-icon">💡</span>
            <span class="edu-tooltip-title">${data.term}</span>
          </div>
          <div class="edu-tooltip-body">${data.definition}</div>
        `;

        const rect = btn.getBoundingClientRect();
        this.container.classList.add('visible');
        const tipRect = this.container.getBoundingClientRect();

        // Position above button centered, clamp within viewport
        let top = Math.max(10, rect.top - tipRect.height - 8);
        let left = Math.max(10, Math.min(window.innerWidth - tipRect.width - 10, rect.left + rect.width * 0.5 - tipRect.width * 0.5));

        // If clipped off the top of screen, show below button
        if (rect.top - tipRect.height - 8 < 10) {
          top = Math.min(window.innerHeight - tipRect.height - 10, rect.bottom + 8);
        }

        this.container.style.top = `${top}px`;
        this.container.style.left = `${left}px`;
      };

      const hideTip = () => {
        this.hideTooltip();
      };

      btn.addEventListener('mouseenter', showTip);
      btn.addEventListener('mouseleave', hideTip);
      btn.addEventListener('click', showTip);
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          showTip(e);
        }
      });
    });
  }

  hideTooltip() {
    if (this.container) {
      this.container.classList.remove('visible');
    }
  }
}
