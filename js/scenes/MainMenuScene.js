/* ============================================================
   FRONTIER: MISSION ACADEMY — Main Menu Scene
   Cinematic celestial background with rotating planet & starfield
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';

export class MainMenuScene extends BaseScene {
  constructor(engine) {
    super(engine);

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 30);
    this.camera.lookAt(0, 0, 0);

    // Build 3D background elements
    this._buildStarfield();
    this._buildPlanet();
    this._buildLighting();
  }

  _buildStarfield() {
    const starCount = 6000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 150 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Subtle celestial blue/white hues
      const shade = 0.7 + Math.random() * 0.3;
      colors[i3]     = shade * (Math.random() > 0.5 ? 0.8 : 1.0);
      colors[i3 + 1] = shade * (Math.random() > 0.3 ? 0.9 : 1.0);
      colors[i3 + 2] = shade;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  _buildPlanet() {
    // Large aesthetic planet in the lower background
    const geometry = new THREE.SphereGeometry(18, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x223355,
      roughness: 0.85,
      metalness: 0.1,
      wireframe: false
    });

    this.planet = new THREE.Mesh(geometry, material);
    this.planet.position.set(10, -18, -10);
    this.scene.add(this.planet);

    // Atmosphere halo
    const glowGeo = new THREE.SphereGeometry(18.6, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    this.atmosphere = new THREE.Mesh(glowGeo, glowMat);
    this.planet.add(this.atmosphere);
  }

  _buildLighting() {
    const ambientLight = new THREE.AmbientLight(0x0a1024, 1.5);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff0dd, 2.5);
    sunLight.position.set(-30, 20, 20);
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x4a9eff, 1.2);
    rimLight.position.set(20, -10, -15);
    this.scene.add(rimLight);
  }

  onEnter() {
    this.engine.showPanel('main-menu');
    this._bindButtons();
  }

  _bindButtons() {
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
      btnStart.onclick = (e) => {
        if (e) e.preventDefault();
        console.log('[Frontier] Opening Destination Selector (Moon & Mars)...');
        this.engine.audio.playUIClick();
        this.engine.setState('DESTINATION');
      };
    }

    const btnDest = document.getElementById('btn-destination');
    if (btnDest) {
      btnDest.onclick = (e) => {
        if (e) e.preventDefault();
        console.log('[Frontier] Opening Destination Selector...');
        this.engine.audio.playUIClick();
        this.engine.setState('DESTINATION');
      };
    }

    const btnChars = document.getElementById('btn-chars');
    if (btnChars) {
      btnChars.onclick = (e) => {
        if (e) e.preventDefault();
        this.engine.audio.playUIClick();
        this.engine.showPanel('character-info-panel');
      };
    }

    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
      btnSettings.onclick = (e) => {
        if (e) e.preventDefault();
        this.engine.audio.playUIClick();
        this.engine.showPanel('settings-panel');
      };
    }

    const btnAboutMoon = document.getElementById('btn-about-moon');
    if (btnAboutMoon) {
      btnAboutMoon.onclick = (e) => {
        if (e) e.preventDefault();
        this.engine.audio.playUIClick();
        this.engine.showPanel('about-moon-modal');
      };
    }

    const btnAboutMars = document.getElementById('btn-about-mars');
    if (btnAboutMars) {
      btnAboutMars.onclick = (e) => {
        if (e) e.preventDefault();
        this.engine.audio.playUIClick();
        this.engine.showPanel('about-mars-modal');
      };
    }

    const btnCloseAboutMoon = document.getElementById('btn-close-about-moon');
    if (btnCloseAboutMoon) {
      btnCloseAboutMoon.onclick = () => {
        this.engine.audio.playUIClick();
        this.engine.hidePanel('about-moon-modal');
      };
    }

    const btnCloseAboutMars = document.getElementById('btn-close-about-mars');
    if (btnCloseAboutMars) {
      btnCloseAboutMars.onclick = () => {
        this.engine.audio.playUIClick();
        this.engine.hidePanel('about-mars-modal');
      };
    }

    // Filter tabs for scientific flashcard galleries
    document.querySelectorAll('.gallery-filter-bar .gallery-filter-btn').forEach(btn => {
      btn.onclick = (e) => {
        if (e) e.preventDefault();
        this.engine.audio.playUIClick();
        const bar = btn.closest('.gallery-filter-bar');
        if (bar) {
          bar.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
        const filter = btn.getAttribute('data-filter');
        const modal = btn.closest('.lunar-archive-center-modal') || btn.closest('.flashcard-center-modal') || btn.closest('.flashcard-gallery-modal');
        if (modal) {
          const cards = modal.querySelectorAll('.flashcard-panel');
          cards.forEach(card => {
            if (filter === 'all' || card.classList.contains(filter)) {
              card.style.display = 'flex';
            } else {
              card.style.display = 'none';
            }
          });
        }
      };
    });

    // ── Full-Screen Flashcard Zoom / Lightbox Logic ──
    let activeCardsList = [];
    let activeCardIndex = 0;

    const modalDetail = document.getElementById('flashcard-detail-modal');
    const imgDetail = document.getElementById('flashcard-detail-img');
    const tagDetail = document.getElementById('flashcard-detail-tag');
    const titleDetail = document.getElementById('flashcard-detail-title');
    const descDetail = document.getElementById('flashcard-detail-desc');
    const sourceDetail = document.getElementById('flashcard-detail-source');
    const counterDetail = document.getElementById('flashcard-detail-counter');

    const updateDetailCard = (index) => {
      if (!activeCardsList.length) return;
      activeCardIndex = (index + activeCardsList.length) % activeCardsList.length;
      const card = activeCardsList[activeCardIndex];
      if (!card) return;

      const imgEl = card.querySelector('img');
      const tagEl = card.querySelector('.lunar-card-badge');
      const titleEl = card.querySelector('.lunar-card-title');
      const descEl = card.querySelector('.lunar-card-desc');
      const sourceText = card.getAttribute('data-source') || 'NASA Planetary Data System (PDS) & Space Agency Archives';

      if (imgDetail && imgEl) {
        imgDetail.src = imgEl.src;
        imgDetail.alt = titleEl ? titleEl.textContent : 'Science Image';
      }
      if (tagDetail && tagEl) {
        tagDetail.textContent = tagEl.textContent;
        tagDetail.style.color = card.style.getPropertyValue('--card-accent') || '#38bdf8';
        tagDetail.style.borderColor = (card.style.getPropertyValue('--card-accent') || '#38bdf8') + '88';
      }
      if (titleDetail && titleEl) titleDetail.textContent = titleEl.textContent;
      if (descDetail && descEl) descDetail.textContent = descEl.textContent;
      if (sourceDetail) sourceDetail.textContent = sourceText;
      if (counterDetail) counterDetail.textContent = `CARD ${activeCardIndex + 1} / ${activeCardsList.length}`;
    };

    const openFlashcardDetail = (clickedCard, modalParent) => {
      const visibleCards = Array.from(modalParent.querySelectorAll('.flashcard-panel')).filter(c => c.style.display !== 'none');
      activeCardsList = visibleCards.length ? visibleCards : Array.from(modalParent.querySelectorAll('.flashcard-panel'));
      activeCardIndex = activeCardsList.indexOf(clickedCard);
      if (activeCardIndex === -1) activeCardIndex = 0;

      updateDetailCard(activeCardIndex);
      if (modalDetail) {
        modalDetail.style.display = 'flex';
      }
      this.engine.audio.playSuccess();
    };

    const closeFlashcardDetail = () => {
      if (modalDetail) modalDetail.style.display = 'none';
      this.engine.audio.playUIClick();
    };

    document.querySelectorAll('.flashcard-panel').forEach(card => {
      card.style.cursor = 'pointer';
      card.onclick = (e) => {
        if (e) e.stopPropagation();
        const modalParent = card.closest('.lunar-archive-center-modal') || card.closest('.flashcard-center-modal');
        if (modalParent) {
          openFlashcardDetail(card, modalParent);
        }
      };
    });

    const btnCloseDetail = document.getElementById('btn-close-flashcard-detail');
    if (btnCloseDetail) btnCloseDetail.onclick = (e) => { if (e) e.stopPropagation(); closeFlashcardDetail(); };

    const btnCloseDetailBottom = document.getElementById('btn-flashcard-close-bottom');
    if (btnCloseDetailBottom) btnCloseDetailBottom.onclick = (e) => { if (e) e.stopPropagation(); closeFlashcardDetail(); };

    const backdropDetail = document.getElementById('flashcard-detail-backdrop');
    if (backdropDetail) backdropDetail.onclick = (e) => { if (e) e.stopPropagation(); closeFlashcardDetail(); };

    const btnPrev = document.getElementById('btn-flashcard-prev');
    if (btnPrev) {
      btnPrev.onclick = (e) => {
        if (e) e.stopPropagation();
        this.engine.audio.playUIClick();
        updateDetailCard(activeCardIndex - 1);
      };
    }

    const btnNext = document.getElementById('btn-flashcard-next');
    if (btnNext) {
      btnNext.onclick = (e) => {
        if (e) e.stopPropagation();
        this.engine.audio.playUIClick();
        updateDetailCard(activeCardIndex + 1);
      };
    }

    if (!this._hasDetailKeyHandler) {
      this._hasDetailKeyHandler = true;
      window.addEventListener('keydown', (e) => {
        if (modalDetail && modalDetail.style.display !== 'none') {
          if (e.key === 'Escape') {
            closeFlashcardDetail();
          } else if (e.key === 'ArrowLeft') {
            this.engine.audio.playUIClick();
            updateDetailCard(activeCardIndex - 1);
          } else if (e.key === 'ArrowRight') {
            this.engine.audio.playUIClick();
            updateDetailCard(activeCardIndex + 1);
          }
        }
      });
    }

    [btnStart, btnDest, btnChars, btnSettings, btnAboutMoon, btnAboutMars].forEach(btn => {
      if (btn) {
        btn.onmouseenter = () => this.engine.audio.playUIHover();
      }
    });
  }

  onExit() {
    this.engine.hidePanel('main-menu');
    this.engine.hidePanel('character-info-panel');
    this.engine.hidePanel('settings-panel');
    this.engine.hidePanel('about-moon-modal');
    this.engine.hidePanel('about-mars-modal');
    const modalDetail = document.getElementById('flashcard-detail-modal');
    if (modalDetail) modalDetail.style.display = 'none';
  }

  update(dt) {
    if (this.planet) {
      this.planet.rotation.y += 0.03 * dt;
    }
    if (this.starfield) {
      this.starfield.rotation.y += 0.005 * dt;
    }
  }
}
