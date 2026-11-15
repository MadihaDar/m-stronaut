/* ============================================================
   FRONTIER: MISSION ACADEMY — Mars Orbital Reconnaissance Scene
   High-altitude Martian orbit (250 km):
   1. Walkable 3D Spacecraft Interior cabin with flight computers, bunks, life-support
   2. Panoramic Cupola Viewport Window looking down at the rotating Mars globe
   3. Orbital Reconnaissance Mode: Scan & hover over candidate landing sites
      (Jezero Crater Delta & Arcadia Planitia Subsurface Glacier)
   4. Live NASA Dataset Telemetry Cards (MEDA, SWIM, MCS, RAD, DONKI)
   5. Powered Descent & Automatic Seamless Transition to Mars Mission 1
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../systems/CharacterController.js';
import { MARS_DATA } from '../data/mars/MarsSimulationEngine.js';

export class MarsOrbitalScene extends BaseScene {
  constructor(engine) {
    super(engine);

    this.isLookingOutside = false;
    this.isDescending = false;
    this.descentProgress = 0;
    this.selectedRegion = 'MARS_JEZERO';
    this.hoveredRegion = null;

    // Flat floor for spaceship interior
    this._getInteriorHeight = (x, z) => 0.1;

    this._buildStarfield();
    this._buildEarthDistant();
    this._buildMarsGlobe();
    this._buildSpaceshipCabin();

    // Spawn astronaut character inside spaceship cabin (facing panoramic window)
    this.character = new CharacterController(this.scene, this.engine, this._getInteriorHeight);
    this.character.position.set(0, 0.15, -2.5);
    this.character.heading = 0;
    this.character.setGravity(0.0, false); // Microgravity / artificial mag-boot lock
    this.character.walkSpeed = 4.2;

    // Cabin boundary colliders
    this.cabinColliders = [
      { type: 'box', min: { x: -4.8, z: -4.8 }, max: { x: 4.8, z: 4.8 } }
    ];

    this.camera = this.character.getCamera();

    // Orbital camera looking out cupola window down at Mars
    this.orbitalCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.orbitalCamera.position.set(0, 2.2, -3.8);
    this.orbitalCamera.lookAt(0, -18, -45);
    this.orbitalYaw = 0;
    this.orbitalPitch = 0;

    // Mouse raycasting for Martian region hover & click
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);

    this._initDOMOverlay();
  }

  _buildStarfield() {
    const starCount = 4500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 250 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const tone = 0.75 + Math.random() * 0.25;
      colors[i3] = tone * (Math.random() > 0.5 ? 0.95 : 1.0);
      colors[i3 + 1] = tone * (Math.random() > 0.3 ? 0.9 : 1.0);
      colors[i3 + 2] = tone * 0.9;
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

  _buildEarthDistant() {
    // Distant Earth visible as bright blue marble in deep cosmos
    const earthGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x2266bb,
      roughness: 0.5,
      metalness: 0.1,
      emissive: 0x051a33,
      emissiveIntensity: 0.4
    });
    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.earthMesh.position.set(180, 50, -120);
    this.scene.add(this.earthMesh);
  }

  _buildMarsGlobe() {
    this.marsGroup = new THREE.Group();
    this.marsGroup.position.set(0, -68, -45);

    const marsRadius = 45;
    const marsGeo = new THREE.SphereGeometry(marsRadius, 64, 64);

    // Procedural high-detail Mars globe texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base iron-oxide rusty reddish orange
    ctx.fillStyle = '#b34728';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Darker volcanic basalt provinces (Syrtis Major, Acidalia, Tharsis)
    ctx.fillStyle = '#5c2214';
    ctx.beginPath();
    ctx.arc(380, 220, 110, 0, Math.PI * 2); // Syrtis Major
    ctx.fill();
    ctx.beginPath();
    ctx.arc(600, 260, 130, 0, Math.PI * 2); // Acidalia Planitia
    ctx.fill();
    ctx.beginPath();
    ctx.arc(220, 240, 140, 0, Math.PI * 2); // Tharsis volcanic swell
    ctx.fill();

    // Valles Marineris canyon rift line
    ctx.fillStyle = '#3a1208';
    ctx.beginPath();
    ctx.ellipse(320, 250, 90, 16, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // North & South Polar ice caps
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(512, 20, 65, 0, Math.PI * 2); // North Polar Cap
    ctx.fill();
    ctx.beginPath();
    ctx.arc(512, 492, 50, 0, Math.PI * 2); // South Polar Cap
    ctx.fill();

    // Fine cratering & impact basins
    ctx.fillStyle = '#8f331b';
    for (let i = 0; i < 60; i++) {
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height;
      const r = 2 + Math.random() * 12;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const marsMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.88,
      metalness: 0.12
    });

    this.marsGlobe = new THREE.Mesh(marsGeo, marsMat);
    this.marsGroup.add(this.marsGlobe);

    // Subtle atmospheric glow shell (thin CO2 orange/salmon limb)
    const atmoGeo = new THREE.SphereGeometry(marsRadius * 1.025, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0xef7a55,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    this.marsGroup.add(new THREE.Mesh(atmoGeo, atmoMat));

    // ── 3D Orbital Landing Beacons on the Mars Globe (EXACTLY TWO CANDIDATE SITES) ──
    this.regionBeacons = [];

    // Candidate 1: Jezero Crater Delta (18.4°N, 77.5°E) — Ancient Riverbed & Clay Mudstones
    const jezeroPos = new THREE.Vector3(marsRadius * 0.65, marsRadius * 0.31, marsRadius * 0.69);
    this.beaconRegion1 = this._createOrbitalBeacon(
      jezeroPos,
      0xff8c42,
      'JEZERO CRATER DELTA',
      'MARS_JEZERO',
      '🏞️',
      'JEZERO DELTA',
      'ANCIENT RIVERBED CLAY'
    );
    this.marsGroup.add(this.beaconRegion1);
    this.regionBeacons.push(this.beaconRegion1);

    // Candidate 2: Arcadia Planitia (39.3°N, 189.7°E) — Subsurface Glacier Sheets
    const arcadiaPos = new THREE.Vector3(-marsRadius * 0.62, marsRadius * 0.63, marsRadius * 0.46);
    this.beaconRegion2 = this._createOrbitalBeacon(
      arcadiaPos,
      0x38bdf8,
      'ARCADIA PLANITIA',
      'MARS_ARCADIA',
      '🧊',
      'ARCADIA PLANITIA',
      'PURE GLACIER ICE'
    );
    this.marsGroup.add(this.beaconRegion2);
    this.regionBeacons.push(this.beaconRegion2);

    this.scene.add(this.marsGroup);

    // Orbital Solar Illumination (Warm Sun at 1.52 AU)
    this.sun = new THREE.DirectionalLight(0xffeedd, 2.4);
    this.sun.position.set(160, 45, 120);
    this.scene.add(this.sun);

    this.ambientLight = new THREE.AmbientLight(0x181014, 0.7);
    this.scene.add(this.ambientLight);
  }

  _createOrbitalBeacon(position, colorHex, label, targetSceneKey, emoji, title, subtitle) {
    const group = new THREE.Group();
    group.position.copy(position);

    const dir = position.clone().normalize();
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    // Glowing holographic rings on the surface
    const ringGeo1 = new THREE.RingGeometry(2.0, 2.5, 32);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI * 0.5;
    group.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(3.6, 4.2, 32);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI * 0.5;
    group.add(ring2);

    // Vertical pulsing beacon cylinder
    const pillarGeo = new THREE.CylinderGeometry(0.2, 0.6, 7.5, 16);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.55
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 3.75;
    group.add(pillar);

    // Floating diamond beacon topper
    const diamondGeo = new THREE.OctahedronGeometry(1.4, 0);
    const diamondMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      wireframe: true
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.position.y = 7.5;
    group.add(diamond);

    // Floating UI Billboard Sprite
    const sprite = this._createBeaconSprite(emoji, title, subtitle, colorHex);
    sprite.position.set(0, 11.5, 0);
    group.add(sprite);

    // Hit test sphere for raycaster selection
    const hitGeo = new THREE.SphereGeometry(6.5, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.position.y = 4.0;
    group.add(hitMesh);

    group.userData = {
      label,
      targetSceneKey,
      rings: [ring1, ring2],
      pillar,
      diamond,
      hitMesh
    };

    return group;
  }

  _createBeaconSprite(emoji, title, subtitle, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    const hexStr = '#' + colorHex.toString(16).padStart(6, '0');

    ctx.fillStyle = 'rgba(15, 8, 12, 0.9)';
    ctx.strokeStyle = hexStr;
    ctx.lineWidth = 5;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(10, 10, 492, 140, 28);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(10, 10, 492, 140);
      ctx.strokeRect(10, 10, 492, 140);
    }

    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 65, 80);

    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, 125, 58);

    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = hexStr;
    ctx.fillText(subtitle, 125, 102);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(13, 4.2, 1);
    return sprite;
  }

  _buildSpaceshipCabin() {
    this.cabin = new THREE.Group();
    this.cabin.position.set(0, 0, 0);

    // Floor
    const floorGeo = new THREE.CylinderGeometry(4.8, 4.8, 0.25, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1f1618,
      roughness: 0.45,
      metalness: 0.4
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.125;
    this.cabin.add(floor);

    // Hexagonal grid ring
    const gridGeo = new THREE.RingGeometry(1.5, 4.75, 32);
    const gridMat = new THREE.MeshStandardMaterial({
      color: 0xff6633,
      roughness: 0.3,
      metalness: 0.8,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI * 0.5;
    grid.position.y = 0.02;
    this.cabin.add(grid);

    // Walls
    const wallGeo = new THREE.CylinderGeometry(4.8, 4.8, 3.8, 32, 1, true, 0, Math.PI * 1.6);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2d1a20,
      roughness: 0.6,
      metalness: 0.2,
      side: THREE.BackSide
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = 1.9;
    wall.rotation.y = Math.PI * 0.2;
    this.cabin.add(wall);

    // Ceiling dome
    const ceilingGeo = new THREE.CylinderGeometry(4.8, 4.8, 0.2, 32);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x160f12,
      roughness: 0.5,
      metalness: 0.3
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = 3.8;
    this.cabin.add(ceiling);

    // Cabin Interior Lighting
    const cabinLight = new THREE.PointLight(0xffd5cc, 1.6, 12);
    cabinLight.position.set(0, 3.2, 0);
    this.cabin.add(cabinLight);

    const consoleLight = new THREE.PointLight(0xff6633, 1.2, 6);
    consoleLight.position.set(0, 1.8, -3.2);
    this.cabin.add(consoleLight);

    // Panoramic Cupola Window Ring facing Mars
    const windowRingGeo = new THREE.TorusGeometry(3.6, 0.25, 16, 48, Math.PI);
    const windowRingMat = new THREE.MeshStandardMaterial({
      color: 0x3a2228,
      metalness: 0.8,
      roughness: 0.2
    });
    const windowRing = new THREE.Mesh(windowRingGeo, windowRingMat);
    windowRing.position.set(0, 1.8, -4.7);
    windowRing.rotation.z = Math.PI * 0.5;
    this.cabin.add(windowRing);

    // Cupola Window Glass
    const glassGeo = new THREE.PlaneGeometry(6.2, 3.2);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x331a22,
      transparent: true,
      opacity: 0.15,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.8, -4.72);
    this.cabin.add(glass);

    // Glowing observation portal trigger pad
    const padGeo = new THREE.CircleGeometry(1.6, 32);
    this.windowBeaconMat = new THREE.MeshBasicMaterial({
      color: 0xff6633,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const pad = new THREE.Mesh(padGeo, this.windowBeaconMat);
    pad.rotation.x = -Math.PI * 0.5;
    pad.position.set(0, 0.03, -3.4);
    this.cabin.add(pad);

    this.scene.add(this.cabin);
  }

  _initDOMOverlay() {
    // 1. Permanent Observation Window CTA Pill
    let lookoutBtn = document.getElementById('btn-mars-lookout-viewport');
    if (!lookoutBtn) {
      lookoutBtn = document.createElement('button');
      lookoutBtn.id = 'btn-mars-lookout-viewport';
      lookoutBtn.className = 'cupola-lookout-btn visible';
      lookoutBtn.innerHTML = `
        <span class="btn-icon">🔭</span>
        <div class="btn-text-wrap">
          <span class="btn-main-text">LOOK OUT CUPOLA WINDOW [E]</span>
          <span class="btn-sub-text">Enter High Martian Orbit (250 km)</span>
        </div>
      `;
      document.body.appendChild(lookoutBtn);
    }
    this.lookoutBtn = lookoutBtn;
    this.lookoutBtn.onclick = () => {
      if (this.engine.audio?.playUIClick) this.engine.audio.playUIClick();
      this.enterOrbitalView();
    };

    // 2. Interactive Orbital Reconnaissance Dossier Overlay
    let reconOverlay = document.getElementById('mars-recon-interactive-overlay');
    if (!reconOverlay) {
      reconOverlay = document.createElement('div');
      reconOverlay.id = 'mars-recon-interactive-overlay';
      reconOverlay.className = 'orbital-recon-overlay kid-recon-overlay';
      reconOverlay.innerHTML = `
        <div id="mars-recon-telemetry-card" class="kid-mission-card kid-mission-modal-center kid-dossier-card" style="border-color: rgba(255, 102, 51, 0.7); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85), 0 0 45px rgba(255, 102, 51, 0.35);">
          <!-- Top Control Header Bar -->
          <div class="kid-modal-topbar kid-dossier-topbar">
            <div class="kid-modal-title-group kid-topbar-left">
              <span class="kid-pill-badge" style="background: rgba(255, 102, 51, 0.25); border-color: #ff6633; color: #ff8c42;">🔴 MISSION 0: MARTIAN ORBIT (250 KM)</span>
              <span class="kid-topbar-sub">SELECT YOUR EXPEDITION LANDING SITE</span>
            </div>
            <div class="kid-topbar-right">
              <button id="btn-mars-recon-back" class="kid-close-btn" title="Return to Spaceship Cabin">
                <span>🔙 CABIN [E / Esc]</span>
              </button>
            </div>
          </div>

          <!-- Interactive Region Switcher Chips (EXACTLY TWO CANDIDATE SITES) -->
          <div class="kid-region-switcher-bar">
            <button id="tab-mars-region-1" class="kid-tab-chip active" data-region="MARS_JEZERO" style="--chip-accent: #ff8c42;">
              <span class="chip-emoji">🏞️</span>
              <div class="chip-text">
                <span class="chip-name">1. JEZERO CRATER DELTA</span>
                <span class="chip-tag">"Ancient Riverbed • 639 Pa Thin Air"</span>
              </div>
            </button>
            <button id="tab-mars-region-2" class="kid-tab-chip" data-region="MARS_ARCADIA" style="--chip-accent: #38bdf8;">
              <span class="chip-emoji">🧊</span>
              <div class="chip-text">
                <span class="chip-name">2. ARCADIA PLANITIA</span>
                <span class="chip-tag">"Subsurface Glacier • 0.72 Ice Index"</span>
              </div>
            </button>
          </div>

          <!-- Main Graphical Body -->
          <div class="kid-dossier-body">
            <!-- Left Column: Visual Artwork & Dataset Badge -->
            <div class="kid-dossier-left">
              <div class="kid-image-frame" style="border-color: rgba(255, 102, 51, 0.4);">
                <img id="kid-mars-card-img" src="/assets/images/mars_mission_m01.svg" class="kid-site-image" alt="Martian Landing Site" />
                <div id="kid-mars-image-overlay-badge" class="kid-image-tag">
                  <span id="kid-mars-image-tag-icon">🏞️</span>
                  <span id="kid-mars-image-tag-text">JEZERO CRATER DELTA</span>
                </div>
              </div>
              <div class="kid-dataset-verified">
                <span class="verify-icon">📡</span>
                <span>NASA DATA: </span>
                <strong id="kid-mars-dataset-text" style="color: #ffffff; margin-left: 4px;">Perseverance MEDA Historical Atmosphere</strong>
              </div>
            </div>

            <!-- Right Column: Visual Telemetry Meters & Mission Objective -->
            <div class="kid-dossier-right">
              <div class="kid-dossier-header">
                <h2 id="kid-mars-card-title">🏞️ JEZERO CRATER DELTA</h2>
                <div id="kid-mars-card-tagline" class="kid-tagline">"Ancient Riverbed & Lakebed Clay Mudstones"</div>
              </div>

              <!-- Segment Meter Gauges Grid -->
              <div class="kid-gauges-grid">
                <div class="kid-gauge-card">
                  <div class="gauge-meta">
                    <span class="gauge-label">☀️ SOLAR POWER</span>
                    <span id="kid-mars-text-power" class="gauge-val val-green">SUPER HIGH (100%)</span>
                  </div>
                  <div id="kid-mars-bar-power" class="kid-seg-bar"></div>
                </div>

                <div class="kid-gauge-card">
                  <div class="gauge-meta">
                    <span class="gauge-label">🌡️ TEMPERATURE</span>
                    <span id="kid-mars-text-temp" class="gauge-val val-orange">-57°C (TEMPERATE SOL)</span>
                  </div>
                  <div id="kid-mars-bar-temp" class="kid-seg-bar"></div>
                </div>

                <div class="kid-gauge-card">
                  <div class="gauge-meta">
                    <span id="kid-mars-label-resource" class="gauge-label">💧 WATER ICE</span>
                    <span id="kid-mars-text-resource" class="gauge-val val-amber">MUDSTONE CLAYS (95%)</span>
                  </div>
                  <div id="kid-mars-bar-resource" class="kid-seg-bar"></div>
                </div>

                <div class="kid-gauge-card">
                  <div class="gauge-meta">
                    <span class="gauge-label">☢️ RADIATION SHIELDS</span>
                    <span id="kid-mars-text-rad" class="gauge-val val-amber">RAD DOSIMETRY OK</span>
                  </div>
                  <div id="kid-mars-bar-rad" class="kid-seg-bar"></div>
                </div>
              </div>

              <!-- Action Mission Goal -->
              <div class="kid-dossier-goal">
                <span class="goal-tag">🎯 MISSION OBJECTIVE:</span>
                <p id="kid-mars-card-goal" class="goal-desc">
                  Pilot rover-drone scout team across the dried-up river delta in Jezero Crater to drill core samples of ancient lakebed clay and search for microbial biosignatures!
                </p>
              </div>

              <!-- Big Touchdown Action Button -->
              <button id="btn-mars-recon-launch" class="kid-launch-btn" style="background: linear-gradient(135deg, #c84020, #e05530);">
                🚀 TOUCH DOWN AT JEZERO DELTA! ▶
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(reconOverlay);
    }
    this.reconOverlay = reconOverlay;
    this.telemetryCard = document.getElementById('mars-recon-telemetry-card');

    // 3. Cinematic Descent Transition Overlay
    let descentCurtain = document.getElementById('mars-descent-curtain');
    if (!descentCurtain) {
      descentCurtain = document.createElement('div');
      descentCurtain.id = 'mars-descent-curtain';
      descentCurtain.className = 'descent-cinematic-curtain';
      descentCurtain.innerHTML = `
        <div class="descent-box" style="border-color: #ff6633; box-shadow: 0 0 40px rgba(255, 102, 51, 0.4);">
          <div class="descent-spinner" style="border-top-color: #ff6633;"></div>
          <div class="descent-title" style="color: #ff8c42;">DE-ORBIT BURN ENGAGED</div>
          <div id="mars-descent-target-label" class="descent-sub">DESCENT TRAJECTORY LOCKED TO JEZERO CRATER DELTA</div>
          <div class="descent-progress-bar-wrap">
            <div id="mars-descent-progress-bar" class="descent-progress-bar" style="background: linear-gradient(90deg, #c84020, #ff8c42);"></div>
          </div>
        </div>
      `;
      document.body.appendChild(descentCurtain);
    }
    this.descentCurtain = descentCurtain;

    // Back to Cabin Button
    const btnBack = document.getElementById('btn-mars-recon-back');
    if (btnBack) {
      btnBack.onclick = () => {
        if (this.engine.audio?.playUIClick) this.engine.audio.playUIClick();
        this.exitOrbitalView();
      };
    }

    // Region Switcher Tabs Click Handlers
    const tab1 = document.getElementById('tab-mars-region-1');
    const tab2 = document.getElementById('tab-mars-region-2');

    const setupTab = (tab, regionKey) => {
      if (!tab) return;
      tab.onclick = () => {
        if (this.engine.audio?.playUIClick) this.engine.audio.playUIClick();
        this._showRegionTelemetry(regionKey);
      };
      tab.onmouseenter = () => {
        if (this.engine.audio?.playUIHover) this.engine.audio.playUIHover();
      };
    };

    setupTab(tab1, 'MARS_JEZERO');
    setupTab(tab2, 'MARS_ARCADIA');

    // Launch Descent Button
    const btnLaunch = document.getElementById('btn-mars-recon-launch');
    if (btnLaunch) {
      btnLaunch.onclick = () => {
        const target = this.selectedRegion || this.hoveredRegion || 'MARS_JEZERO';
        this.initiateDescent(target);
      };
      btnLaunch.onmouseenter = () => {
        if (this.engine.audio?.playUIHover) this.engine.audio.playUIHover();
      };
    }

    // Window Resize
    this.onResize = (w, h) => {
      if (this.camera) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
      }
      if (this.orbitalCamera) {
        this.orbitalCamera.aspect = w / h;
        this.orbitalCamera.updateProjectionMatrix();
      }
    };

    // Mouse movement for raycasting
    this._onMouseMove = (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', this._onMouseMove, { passive: true });

    // Click on canvas while in orbital view
    this._onPointerDown = (e) => {
      if (!this.isLookingOutside || this.isDescending) return;
      if (e.target.closest('#mars-recon-interactive-overlay')) return;

      if (this.hoveredRegion) {
        if (this.engine.audio?.playUIClick) this.engine.audio.playUIClick();
        this.selectedRegion = this.hoveredRegion;
        this.initiateDescent(this.hoveredRegion);
      }
    };
    window.addEventListener('pointerdown', this._onPointerDown);
  }

  enterOrbitalView() {
    this.isLookingOutside = true;
    this.camera = this.orbitalCamera;
    if (this.lookoutBtn) {
      this.lookoutBtn.classList.remove('visible');
      this.lookoutBtn.style.display = 'none';
    }
    if (this.reconOverlay) {
      this.reconOverlay.style.display = '';
      this.reconOverlay.classList.add('visible');
    }
    if (this.telemetryCard) {
      this.telemetryCard.style.display = '';
      this.telemetryCard.classList.add('visible');
    }
    this.engine.hud.hideInteractionPrompt();
    this.engine.hidePanel('hud');
    this.engine.audio.playTone(880, 0.12, 'sine', 0.2);

    this._showRegionTelemetry(this.selectedRegion || 'MARS_JEZERO');
  }

  exitOrbitalView() {
    this.isLookingOutside = false;
    this.camera = this.character.getCamera();
    if (this.lookoutBtn) {
      this.lookoutBtn.style.display = '';
      this.lookoutBtn.classList.add('visible');
    }
    if (this.reconOverlay) {
      this.reconOverlay.classList.remove('visible');
      this.reconOverlay.style.display = 'none';
    }
    if (this.telemetryCard) {
      this.telemetryCard.classList.remove('visible');
      this.telemetryCard.style.display = 'none';
    }
    this.engine.showPanel('hud');
    this.engine.hud.setLocation('SPACECRAFT CABIN • MARTIAN ORBIT (250 KM)');
    this.engine.audio.playTone(440, 0.1, 'sine', 0.2);
  }

  _renderSegments(total, active, colorClass) {
    let html = '';
    for (let i = 0; i < total; i++) {
      const cls = i < active ? `kid-seg active seg-${colorClass}` : 'kid-seg';
      html += `<div class="${cls}"></div>`;
    }
    return html;
  }

  _showRegionTelemetry(regionKey) {
    if (!this.telemetryCard) return;

    this.telemetryCard.style.display = '';
    this.telemetryCard.classList.add('visible');
    this.selectedRegion = regionKey;

    const tab1 = document.getElementById('tab-mars-region-1');
    const tab2 = document.getElementById('tab-mars-region-2');
    const isJezero = regionKey === 'MARS_JEZERO';

    if (tab1) tab1.classList.toggle('active', isJezero);
    if (tab2) tab2.classList.toggle('active', !isJezero);

    const cardImg = document.getElementById('kid-mars-card-img');
    const imageTagIcon = document.getElementById('kid-mars-image-tag-icon');
    const imageTagText = document.getElementById('kid-mars-image-tag-text');

    const titleEl = document.getElementById('kid-mars-card-title');
    const taglineEl = document.getElementById('kid-mars-card-tagline');
    const datasetEl = document.getElementById('kid-mars-dataset-text');

    const textPower = document.getElementById('kid-mars-text-power');
    const barPower = document.getElementById('kid-mars-bar-power');

    const textTemp = document.getElementById('kid-mars-text-temp');
    const barTemp = document.getElementById('kid-mars-bar-temp');

    const labelResource = document.getElementById('kid-mars-label-resource');
    const textResource = document.getElementById('kid-mars-text-resource');
    const barResource = document.getElementById('kid-mars-bar-resource');

    const textRad = document.getElementById('kid-mars-text-rad');
    const barRad = document.getElementById('kid-mars-bar-rad');

    const goalEl = document.getElementById('kid-mars-card-goal');
    const btnLaunch = document.getElementById('btn-mars-recon-launch');

    if (isJezero) {
      if (cardImg) cardImg.src = '/assets/images/mars_mission_m01.svg';
      if (imageTagIcon) imageTagIcon.textContent = '🏞️';
      if (imageTagText) imageTagText.textContent = 'JEZERO CRATER DELTA (18.4°N, 77.5°E)';

      if (titleEl) titleEl.textContent = '🏞️ JEZERO CRATER DELTA';
      if (taglineEl) taglineEl.textContent = '"Ancient Riverbed & Lakebed Clay Mudstones"';
      if (datasetEl) datasetEl.textContent = 'Perseverance MEDA Historical (Pressure 639 Pa, Air Temp -57°C, Dust tau 0.42)';

      if (textPower) {
        textPower.textContent = 'SUPER HIGH (100%) • Low Dust (tau 0.42) Solar Generator Ready';
        textPower.className = 'gauge-val val-green';
      }
      if (barPower) barPower.innerHTML = this._renderSegments(5, 5, 'green');

      if (textTemp) {
        textTemp.textContent = '-57°C to -15°C • Midday Warmth (Easy Base Heating)';
        textTemp.className = 'gauge-val val-orange';
      }
      if (barTemp) barTemp.innerHTML = this._renderSegments(5, 3, 'orange');

      if (labelResource) labelResource.textContent = '💧 WATER RESERVES';
      if (textResource) {
        textResource.textContent = 'HYDRATED CLAYS (95%) • Sealed Tank Reserve';
        textResource.className = 'gauge-val val-cyan';
      }
      if (barResource) barResource.innerHTML = this._renderSegments(5, 4, 'cyan');

      if (textRad) {
        textRad.textContent = 'RAD BASELINE (187.6 µGy/day) • Curiosity Radiation Detector';
        textRad.className = 'gauge-val val-amber';
      }
      if (barRad) barRad.innerHTML = this._renderSegments(5, 2, 'amber');

      if (goalEl) {
        goalEl.textContent = 'Touchdown at Jezero River Delta! Starting conditions: 100% Power, 100% O₂, 95% Water, 100% Food, 100% Rover Cell, 100% Health. Pilot rover-drone team, drill core samples into titanium tubes, and search for ancient microbial life!';
      }
      if (btnLaunch) {
        btnLaunch.textContent = '🚀 TOUCH DOWN AT JEZERO DELTA! ▶';
        btnLaunch.style.background = 'linear-gradient(135deg, #c84020, #e05530)';
      }

      if (this.marsGlobe) this.marsGlobe.rotation.y = 0.2;
    } else {
      // Arcadia Planitia Subsurface Glacier
      if (cardImg) cardImg.src = '/assets/images/mars_mission_m02.svg';
      if (imageTagIcon) imageTagIcon.textContent = '🧊';
      if (imageTagText) imageTagText.textContent = 'ARCADIA PLANITIA (39.3°N, 189.7°E)';

      if (titleEl) titleEl.textContent = '🧊 ARCADIA PLANITIA GLACIERS';
      if (taglineEl) taglineEl.textContent = '"Subsurface Ice Sheets • 0.72 Consistency Index & Fuel Factory"';
      if (datasetEl) datasetEl.textContent = 'NASA Subsurface Water Ice Mapping (SWIM4MIM) Radar Index';

      if (textPower) {
        textPower.textContent = 'MODERATE (90%) • Colder Mid-Latitude (Higher Thermal Draw)';
        textPower.className = 'gauge-val val-amber';
      }
      if (barPower) barPower.innerHTML = this._renderSegments(5, 4, 'amber');

      if (textTemp) {
        textTemp.textContent = '-75°C to -35°C • Northern Freeze (Requires Thermal Cloak)';
        textTemp.className = 'gauge-val val-blue';
      }
      if (barTemp) barTemp.innerHTML = this._renderSegments(5, 2, 'blue');

      if (labelResource) labelResource.textContent = '💧 WATER RESERVES';
      if (textResource) {
        textResource.textContent = 'PURE GLACIER ICE (100%) • Massive Subsurface Water Sheet';
        textResource.className = 'gauge-val val-green';
      }
      if (barResource) barResource.innerHTML = this._renderSegments(5, 5, 'green');

      if (textRad) {
        textRad.textContent = 'ICE SHIELDING (140 µGy/day) • Thick Overburden Protection';
        textRad.className = 'gauge-val val-green';
      }
      if (barRad) barRad.innerHTML = this._renderSegments(5, 2, 'green');

      if (goalEl) {
        goalEl.textContent = 'Touchdown on the northern ice plains! Starting conditions: 90% Power, 100% O₂, 100% Water, 100% Food, 100% Rover Cell, 95% Health. Land automated ISRU rig, melt pure subsurface glacier ice, and brew liquid oxygen and methane rocket fuel!';
      }
      if (btnLaunch) {
        btnLaunch.textContent = '🚀 TOUCH DOWN AT ARCADIA GLACIER! ▶';
        btnLaunch.style.background = 'linear-gradient(135deg, #0284c7, #38bdf8)';
      }

      if (this.marsGlobe) this.marsGlobe.rotation.y = 2.4;
    }

    this.telemetryCard.classList.add('visible');
  }

  initiateDescent(regionKey) {
    if (this.isDescending) return;
    this.isDescending = true;
    this.selectedRegion = regionKey;

    this.engine.audio.playThrusterRumble();
    this.engine.audio.playTone(550, 0.35, 'triangle', 0.4);

    const isJezero = regionKey === 'MARS_JEZERO';
    const targetName = isJezero ? 'JEZERO CRATER DELTA' : 'ARCADIA PLANITIA GLACIERS';
    const labelEl = document.getElementById('mars-descent-target-label');
    if (labelEl) labelEl.textContent = `DESCENT TRAJECTORY LOCKED TO: ${targetName}`;

    if (this.descentCurtain) this.descentCurtain.classList.add('visible');

    let p = 0;
    const pBar = document.getElementById('mars-descent-progress-bar');
    const interval = setInterval(() => {
      p += 0.05;
      if (pBar) pBar.style.width = `${Math.min(100, Math.round(p * 100))}%`;

      if (p >= 1.0) {
        clearInterval(interval);
        this._completeDescentAndEgress(regionKey);
      }
    }, 50);
  }

  _completeDescentAndEgress(regionKey) {
    if (this.descentCurtain) {
      this.descentCurtain.classList.remove('visible');
      this.descentCurtain.style.display = 'none';
    }
    if (this.reconOverlay) {
      this.reconOverlay.classList.remove('visible');
      this.reconOverlay.style.display = 'none';
    }
    if (this.telemetryCard) {
      this.telemetryCard.classList.remove('visible');
      this.telemetryCard.style.display = 'none';
    }
    if (this.lookoutBtn) {
      this.lookoutBtn.classList.remove('visible');
      this.lookoutBtn.style.display = 'none';
    }

    const isJezero = regionKey === 'MARS_JEZERO';
    const targetName = isJezero ? 'Jezero Crater Delta' : 'Arcadia Planitia Glacier';

    // Strictly calculate starting entities based on selected Martian region dataset
    let resObj;
    if (isJezero) {
      // Jezero: High solar (tau 0.42), mild temp, 95% water
      resObj = { power: 100, oxygen: 100, water: 95, food: 100, roverEnergy: 100, crewCondition: 100 };
    } else {
      // Arcadia: Colder mid-latitudes (90% power, 95% health), pure glacier water (100%)
      resObj = { power: 90, oxygen: 100, water: 100, food: 100, roverEnergy: 100, crewCondition: 95 };
    }

    // Save starting entities strictly into persistent campaign save
    this.engine.save.saveCampaignResources(resObj);
    if (this.engine.resources) {
      this.engine.resources.initMissionLevels(resObj);
    }

    // Complete Mars Mission 0 & record orbital recon sample
    this.engine.save.completeMission('mars_m0');
    this.engine.save.recordMissionSample('mars_m0', {
      name: `250 km Cupola Reconnaissance (${targetName})`,
      type: 'ORBITAL RECONNAISSANCE SAMPLE',
      isSample: true
    });
    this.engine.scoring.add(1000, 'Mission 0: Mars Cupola Reconnaissance & Site Selection');
    const scoreData = this.engine.scoring.calculateFinalScore();

    this.engine.audio.playSuccess();

    // Mission 0 Complete: Show celebration modal with calibrated entity telemetry and route to Mars archive
    this.engine.showMissionCompletedModal({
      title: 'MISSION 0: HIGH MARTIAN ORBIT ACCOMPLISHED',
      subtitle: `${targetName.toUpperCase()} SELECTED`,
      points: 1000,
      resources: scoreData.resources,
      praise: `Exceptional orbital reconnaissance, Commander! You surveyed the Red Planet from 250 km altitude, analyzed NASA environmental datasets, selected ${targetName}, and calibrated all starting life-support entities!`,
      onSelectNext: () => {
        this.engine.setState('DESTINATION');
        this.engine.showPanel('mars-mission-modal');
      }
    });
  }

  onEnter() {
    this.isLookingOutside = false;
    this.isDescending = false;
    this.camera = this.character.getCamera();

    this.character.position.set(0, 0.15, -2.5);
    this.character.heading = 0;
    this.character.setControlEnabled(true);

    if (this.lookoutBtn) {
      this.lookoutBtn.style.display = '';
      this.lookoutBtn.classList.add('visible');
    }
    if (this.reconOverlay) {
      this.reconOverlay.classList.remove('visible');
      this.reconOverlay.style.display = 'none';
    }
    if (this.telemetryCard) {
      this.telemetryCard.classList.remove('visible');
      this.telemetryCard.style.display = 'none';
    }
    if (this.descentCurtain) {
      this.descentCurtain.classList.remove('visible');
      this.descentCurtain.style.display = 'none';
    }

    this.engine.showPanel('hud');
    this.engine.hud.setLocation('SPACECRAFT CABIN • MARTIAN ORBIT (250 KM)');
    this.engine.hud.setMode('SPACECRAFT RECON');
    this.engine.hud.showInteractionPrompt('LOOK OUTSIDE VIEWPORT / SCAN MARTIAN SURFACE [E]', 'E');
  }

  onExit() {
    this.isLookingOutside = false;
    if (this.lookoutBtn) {
      this.lookoutBtn.classList.remove('visible');
      this.lookoutBtn.style.display = 'none';
    }
    if (this.reconOverlay) {
      this.reconOverlay.classList.remove('visible');
      this.reconOverlay.style.display = 'none';
    }
    if (this.telemetryCard) {
      this.telemetryCard.classList.remove('visible');
      this.telemetryCard.style.display = 'none';
    }
    if (this.descentCurtain) {
      this.descentCurtain.classList.remove('visible');
      this.descentCurtain.style.display = 'none';
    }
    this.engine.hud.hideInteractionPrompt();
  }

  update(dt) {
    const input = this.engine.input;

    // Slow orbital planetary rotation
    if (this.marsGlobe) {
      this.marsGlobe.rotation.y += 0.012 * dt;
    }
    if (this.starfield) {
      this.starfield.rotation.y += 0.002 * dt;
    }

    // Pulse window beacon ring
    if (this.windowBeaconMat) {
      const pulse = 0.55 + Math.sin(Date.now() * 0.005) * 0.4;
      this.windowBeaconMat.opacity = pulse;
    }

    // Pulse and animate orbital region beacons
    this.regionBeacons.forEach(b => {
      if (b.userData) {
        if (b.userData.rings) {
          b.userData.rings[0].rotation.z += 0.04;
          b.userData.rings[1].rotation.z -= 0.025;
        }
        if (b.userData.diamond) {
          b.userData.diamond.rotation.y += 1.8 * dt;
          b.userData.diamond.rotation.x += 0.9 * dt;
          b.userData.diamond.position.y = 7.5 + Math.sin(Date.now() * 0.004) * 0.45;
        }
      }
    });

    // Character movement inside cabin
    if (!this.isLookingOutside && !this.isDescending) {
      this.character.update(dt);

      const p = this.character.getPosition();
      const distFromCenter = Math.hypot(p.x, p.z);
      if (distFromCenter > 4.2) {
        const angle = Math.atan2(p.z, p.x);
        p.x = Math.cos(angle) * 4.2;
        p.z = Math.sin(angle) * 4.2;
        this.character.position.copy(p);
      }

      const distToWindow = Math.hypot(p.x - 0, p.z - (-4.72));
      if (distToWindow < 4.8) {
        this.engine.hud.showInteractionPrompt('LOOK OUTSIDE VIEWPORT / SCAN MARTIAN SURFACE [E]', 'E');
      } else {
        this.engine.hud.hideInteractionPrompt();
      }

      if (input.isActionPressed('interact')) {
        this.engine.audio.playUIClick();
        this.enterOrbitalView();
        return;
      }
    }

    // Raycasting & Vision Angle while in Orbital Viewport Mode
    if (this.isLookingOutside && !this.isDescending) {
      if (input.isActionPressed('interact') || (input.isKeyPressed && input.isKeyPressed('Escape'))) {
        this.exitOrbitalView();
        return;
      }

      const camRot = input.getCameraRotation();
      if (Math.abs(camRot.dx) > 0.0001 || Math.abs(camRot.dy) > 0.0001) {
        this.orbitalYaw -= camRot.dx * 0.9;
        this.orbitalPitch = Math.max(-0.65, Math.min(0.65, this.orbitalPitch + camRot.dy * 0.9));
      }

      const targetLook = new THREE.Vector3(
        Math.sin(this.orbitalYaw) * 45,
        -18 + Math.sin(this.orbitalPitch) * 25,
        -45 * Math.cos(this.orbitalYaw)
      );
      this.orbitalCamera.lookAt(targetLook);

      this.raycaster.setFromCamera(this.mouse, this.orbitalCamera);
      const hitMeshes = this.regionBeacons.map(b => b.userData.hitMesh);
      const intersects = this.raycaster.intersectObjects(hitMeshes, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const beaconGroup = hit.parent;
        const key = beaconGroup.userData.targetSceneKey;

        if (this.hoveredRegion !== key) {
          this.hoveredRegion = key;
          this.engine.audio.playUIHover();
          this._showRegionTelemetry(key);
        }
      }
    }
  }
}
