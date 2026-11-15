/* ============================================================
   FRONTIER: MISSION ACADEMY — Moon Orbital Reconnaissance Scene
   High-altitude lunar orbit:
   1. Walkable 3D Spacecraft Interior cabin with flight computers, bunks, life-support
   2. Panoramic Cupola Viewport Window looking down at the rotating Moon
   3. Orbital Reconnaissance Mode: Scan & hover over candidate landing sites
      (Shackleton Crater South Pole & Mare Imbrium Thermal Anomaly)
   4. Live NASA Dataset Telemetry Cards (LOLA, Diviner, CRaTER, LEND, DONKI)
   5. Powered Descent & Automatic Surface Egress Sequence
   ============================================================ */

import * as THREE from 'three';
import { BaseScene } from './BaseScene.js';
import { CharacterController } from '../systems/CharacterController.js';
import { MOON_DATA } from '../data/lunar/LunarCampaignData.js';

export class MoonOrbitalScene extends BaseScene {
  constructor(engine) {
    super(engine);

    this.isLookingOutside = false;
    this.isDescending = false;
    this.descentProgress = 0;
    this.selectedRegion = null;
    this.hoveredRegion = null;

    // Flat floor for spaceship interior
    this._getInteriorHeight = (x, z) => 0.1;

    this._buildStarfield();
    this._buildEarth();
    this._buildLunarGlobe();
    this._buildSpaceshipCabin();

    // Spawn astronaut character inside spaceship cabin (facing the panoramic window)
    this.character = new CharacterController(this.scene, this.engine, this._getInteriorHeight);
    this.character.position.set(0, 0.15, -2.5);
    this.character.heading = 0;
    this.character.setGravity(0.0, false); // Microgravity / artificial mag-boot lock
    this.character.walkSpeed = 4.2;

    // Cabin boundary colliders (keep player inside cabin)
    this.cabinColliders = [
      { type: 'box', min: { x: -4.8, z: -4.8 }, max: { x: 4.8, z: 4.8 } }
    ];

    this.camera = this.character.getCamera();

    // Orbital camera for looking out cupola window
    this.orbitalCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.orbitalCamera.position.set(0, 2.2, -3.8);
    this.orbitalCamera.lookAt(0, -18, -45);
    this.orbitalYaw = 0;
    this.orbitalPitch = 0;

    // Mouse raycasting for lunar region hover & click
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
      colors[i3] = tone * (Math.random() > 0.5 ? 0.85 : 1.0);
      colors[i3 + 1] = tone * (Math.random() > 0.3 ? 0.95 : 1.0);
      colors[i3 + 2] = tone;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.88
    });
    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  _buildEarth() {
    // Distant Blue Marble Earth
    const earthGeo = new THREE.SphereGeometry(7.5, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x1f66cc,
      roughness: 0.5,
      metalness: 0.2,
      emissive: 0x051a3a,
      emissiveIntensity: 0.4
    });
    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.earthMesh.position.set(-160, 48, -260);
    this.scene.add(this.earthMesh);

    // Subtle atmospheric haze
    const atmosphereGeo = new THREE.SphereGeometry(7.8, 32, 32);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x55aaff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    this.earthMesh.add(new THREE.Mesh(atmosphereGeo, atmosphereMat));
  }

  _buildLunarGlobe() {
    // High-resolution 3D Moon sphere rotating in orbit below spaceship
    this.lunarGroup = new THREE.Group();
    this.lunarGroup.position.set(0, -68, -45);

    const moonRadius = 45;
    const moonGeo = new THREE.SphereGeometry(moonRadius, 64, 64);

    // Procedural high-contrast lunar mare texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#7a7e85';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Basaltic mare plains
    ctx.fillStyle = '#3c4046';
    ctx.beginPath();
    ctx.arc(380, 220, 110, 0, Math.PI * 2); // Mare Imbrium
    ctx.fill();
    ctx.beginPath();
    ctx.arc(580, 260, 95, 0, Math.PI * 2);  // Mare Serenitatis
    ctx.fill();
    ctx.beginPath();
    ctx.arc(480, 320, 130, 0, Math.PI * 2); // Mare Tranquillitatis
    ctx.fill();

    // South Polar crater cluster
    ctx.fillStyle = '#2a2d33';
    ctx.beginPath();
    ctx.arc(512, 485, 55, 0, Math.PI * 2); // Shackleton / South Pole
    ctx.fill();

    // Ray craters
    ctx.fillStyle = '#c5c9d1';
    for (let i = 0; i < 45; i++) {
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height;
      const r = 2 + Math.random() * 8;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const moonMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.92,
      metalness: 0.08
    });
    this.moonGlobe = new THREE.Mesh(moonGeo, moonMat);
    this.lunarGroup.add(this.moonGlobe);

    // ── 3D Orbital Landing Beacons on the Moon Globe (Exactly Two Candidate Landing Sites) ──
    this.regionBeacons = [];

    // Candidate 1: Shackleton Crater Sunlit Ridge (High Solar Illumination Peak)
    const sunlitRidgePos = new THREE.Vector3(0, -moonRadius * 0.985, moonRadius * 0.17);
    this.beaconRegion1 = this._createOrbitalBeacon(
      sunlitRidgePos,
      0xfacc15,
      'SHACKLETON SUNLIT RIDGE',
      'MOON_M1',
      '☀️',
      'SUNLIT RIDGE',
      '95% SOLAR POWER'
    );
    this.lunarGroup.add(this.beaconRegion1);
    this.regionBeacons.push(this.beaconRegion1);

    // Candidate 2: Shadowed Cold Trap (Permanently Shadowed Region - PSR)
    const coldTrapPos = new THREE.Vector3(moonRadius * 0.12, -moonRadius * 0.98, -moonRadius * 0.14);
    this.beaconRegion2 = this._createOrbitalBeacon(
      coldTrapPos,
      0x00e5ff,
      'SHADOWED COLD TRAP',
      'MOON_M1_COLD',
      '🧊',
      'SHADOWED COLD TRAP',
      'trapped h2o ice'
    );
    this.lunarGroup.add(this.beaconRegion2);
    this.regionBeacons.push(this.beaconRegion2);

    this.scene.add(this.lunarGroup);

    // Orbital Solar Illumination
    this.sun = new THREE.DirectionalLight(0xfff7ea, 2.8);
    this.sun.position.set(160, 45, 120);
    this.scene.add(this.sun);

    this.ambientLight = new THREE.AmbientLight(0x0e172a, 0.6);
    this.scene.add(this.ambientLight);
  }

  _createOrbitalBeacon(position, colorHex, label, targetSceneKey, emoji, title, subtitle) {
    const group = new THREE.Group();
    group.position.copy(position);

    // Normal vector facing away from Moon center
    const dir = position.clone().normalize();
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    // Concentric glowing holographic rings on the surface
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
      opacity: 0.5
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 3.75;
    group.add(pillar);

    // 3D Spinning Crystal Gem (Octahedron)
    const diamondGeo = new THREE.OctahedronGeometry(1.6, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.75,
      metalness: 0.85,
      roughness: 0.15
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.position.y = 7.5;
    group.add(diamond);

    // Floating 2D Billboard Badge with Emoji & Label
    const sprite = this._createBeaconSprite(emoji, title, subtitle, colorHex);
    sprite.position.y = 11.2;
    group.add(sprite);

    // Clickable hit sphere for raycasting (generous radius so kids easily hover/click it!)
    const hitGeo = new THREE.SphereGeometry(7.0, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitSphere = new THREE.Mesh(hitGeo, hitMat);
    hitSphere.position.y = 6.0;
    group.add(hitSphere);

    group.userData = {
      label,
      targetSceneKey,
      colorHex,
      emoji,
      title,
      subtitle,
      hitMesh: hitSphere,
      rings: [ring1, ring2],
      pillar,
      diamond,
      sprite
    };

    return group;
  }

  _createBeaconSprite(emoji, title, subtitle, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    const hexStr = '#' + colorHex.toString(16).padStart(6, '0');

    // Rounded rectangle background
    ctx.fillStyle = 'rgba(7, 14, 28, 0.88)';
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

    // Emoji icon on left
    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 65, 80);

    // Title
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, 125, 58);

    // Subtitle
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

    // 1. Cabin Composite Floor (Circular Deck)
    const floorGeo = new THREE.CylinderGeometry(4.8, 4.8, 0.25, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x161f2d,
      roughness: 0.45,
      metalness: 0.4
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.125;
    this.cabin.add(floor);

    // Hexagonal deck plate grid line accent
    const gridGeo = new THREE.RingGeometry(1.5, 4.75, 32);
    const gridMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      roughness: 0.3,
      metalness: 0.8,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI * 0.5;
    grid.position.y = 0.01;
    this.cabin.add(grid);

    // 2. Insulated Curved Bulkhead Walls
    const wallGeo = new THREE.CylinderGeometry(4.78, 4.78, 3.4, 32, 1, true, Math.PI * 0.22, Math.PI * 1.56);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x223044,
      roughness: 0.65,
      side: THREE.BackSide
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = 1.7;
    this.cabin.add(wall);

    // 3. Ceiling Ring with Recessed Ambient Lights
    const ceilingGeo = new THREE.CylinderGeometry(4.8, 4.8, 0.2, 32);
    const ceiling = new THREE.Mesh(ceilingGeo, floorMat);
    ceiling.position.y = 3.5;
    this.cabin.add(ceiling);

    // 4. PANORAMIC CUPOLA VIEWPORT WINDOW (Front Bulkhead looking towards Moon)
    // Cutout frame at z = -4.75
    const windowFrameGeo = new THREE.TorusGeometry(1.6, 0.18, 16, 32);
    const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0x0a1420, metalness: 0.9, roughness: 0.2 });
    this.windowFrame = new THREE.Mesh(windowFrameGeo, windowFrameMat);
    this.windowFrame.position.set(0, 1.8, -4.72);
    this.cabin.add(this.windowFrame);

    // Curved Observation Glass
    const glassGeo = new THREE.CircleGeometry(1.55, 32);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.9,
      side: THREE.DoubleSide
    });
    this.windowGlass = new THREE.Mesh(glassGeo, glassMat);
    this.windowGlass.position.set(0, 1.8, -4.71);
    this.cabin.add(this.windowGlass);

    // Holographic interactive window ring beacon
    const beaconGeo = new THREE.RingGeometry(1.65, 1.75, 32);
    this.windowBeaconMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.windowBeacon = new THREE.Mesh(beaconGeo, this.windowBeaconMat);
    this.windowBeacon.position.set(0, 1.8, -4.68);
    this.cabin.add(this.windowBeacon);

    // 5. Cockpit Flight Consoles (Left & Right of Window)
    const consoleMat = new THREE.MeshStandardMaterial({ color: 0x0b131e, metalness: 0.8, roughness: 0.25 });
    [-2.2, 2.2].forEach(cx => {
      const cMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.8), consoleMat);
      cMesh.position.set(cx, 0.55, -3.8);
      cMesh.rotation.y = cx > 0 ? -0.35 : 0.35;
      this.cabin.add(cMesh);

      // Glowing Nav Screen
      const scr = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.65),
        new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide })
      );
      scr.position.set(cx, 1.05, -3.7);
      scr.rotation.y = cx > 0 ? -0.35 : 0.35;
      scr.rotation.x = -0.35;
      this.cabin.add(scr);
    });

    // Commander Flight Chair
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x112845, roughness: 0.5, metalness: 0.3 });
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.7), chairMat);
    chair.position.set(0, 0.65, -2.6);
    this.cabin.add(chair);

    // 6. Crew Bunks (Stacked along East Wall)
    const bunkMat = new THREE.MeshStandardMaterial({ color: 0x243b55, roughness: 0.6 });
    const bunk1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 2.2), bunkMat);
    bunk1.position.set(3.8, 0.45, 0.5);
    this.cabin.add(bunk1);

    const bunk2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 2.2), bunkMat);
    bunk2.position.set(3.8, 1.6, 0.5);
    this.cabin.add(bunk2);

    // 7. Cryogenic Life Support Tanks (West Wall)
    const tankGeo = new THREE.CylinderGeometry(0.35, 0.35, 2.2, 16);
    const o2Mat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x0066aa,
      emissiveIntensity: 0.6,
      metalness: 0.6
    });
    const tankO2 = new THREE.Mesh(tankGeo, o2Mat);
    tankO2.position.set(-3.9, 1.1, 0.2);
    this.cabin.add(tankO2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x15803d,
      emissiveIntensity: 0.5,
      metalness: 0.6
    });
    const tankH2O = new THREE.Mesh(tankGeo, waterMat);
    tankH2O.position.set(-3.9, 1.1, 1.1);
    this.cabin.add(tankH2O);

    // 8. Pressurized Airlock Chamber Door (South Wall)
    const hatchFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.5, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x1a2736, metalness: 0.7 })
    );
    hatchFrame.position.set(0, 1.25, 4.65);
    this.cabin.add(hatchFrame);

    this.airlockHatch = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.1, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x0055cc, metalness: 0.6, roughness: 0.3 })
    );
    this.airlockHatch.position.set(0, 1.25, 4.7);
    this.cabin.add(this.airlockHatch);

    // Airlock status indicator light
    this.airlockLight = new THREE.PointLight(0x00ff88, 1.2, 4);
    this.airlockLight.position.set(0, 2.4, 4.4);
    this.cabin.add(this.airlockLight);

    // Warm Interior Cabin Lighting
    this.cabinLight = new THREE.PointLight(0xddeeff, 2.0, 12);
    this.cabinLight.position.set(0, 2.8, -0.5);
    this.cabin.add(this.cabinLight);

    this.scene.add(this.cabin);
  }

  _initDOMOverlay() {
    // 1. Look Outside Floating Action Button (for easy touch or click)
    let lookoutBtn = document.getElementById('btn-orbital-lookout');
    if (!lookoutBtn) {
      lookoutBtn = document.createElement('button');
      lookoutBtn.id = 'btn-orbital-lookout';
      lookoutBtn.className = 'orbital-lookout-btn';
      lookoutBtn.innerHTML = `
        <span class="lookout-icon">🔭</span>
        <div class="lookout-text">
          <span class="lookout-title">LOOK OUTSIDE VIEWPORT</span>
          <span class="lookout-sub">Scan Lunar Landing Sites & Map [E]</span>
        </div>
      `;
      document.body.appendChild(lookoutBtn);
    }
    this.lookoutBtn = lookoutBtn;

    // 2. Orbital Reconnaissance Kid-Friendly Centered HUD Overlay
    let reconOverlay = document.getElementById('orbital-recon-overlay');
    if (!reconOverlay) {
      reconOverlay = document.createElement('div');
      reconOverlay.id = 'orbital-recon-overlay';
      reconOverlay.className = 'orbital-recon-overlay';
      reconOverlay.innerHTML = `
        <!-- Centered Kid Mission Card (Holographic Tactical Dossier) -->
        <div id="recon-telemetry-card" class="kid-mission-card kid-mission-modal-center">
          <!-- Top Navigation & Region Tabs -->
          <div class="kid-modal-topbar">
            <div class="kid-modal-title-group">
              <span class="kid-radar-icon">🛰️</span>
              <div>
                <div class="kid-modal-title">LUNAR ORBITAL RECONNAISSANCE MAP (110 KM)</div>
                <div class="kid-modal-subtitle">Hover over pins on the 3D Moon or click a region below to inspect</div>
              </div>
            </div>
            <div class="kid-modal-actions">
              <button id="btn-recon-back" class="kid-close-btn" title="Return to Spaceship Cabin">
                <span>🔙 CABIN [E / Esc]</span>
              </button>
            </div>
          </div>

          <!-- Interactive Region Switcher Chips (Exactly Two Candidate Sites) -->
          <div class="kid-region-switcher-bar">
            <button id="tab-region-1" class="kid-tab-chip active" data-region="MOON_M1">
              <span class="chip-emoji">☀️</span>
              <div class="chip-text">
                <span class="chip-name">1. SUNLIT RIDGE</span>
                <span class="chip-tag">"Shackleton Peak • 95% Solar"</span>
              </div>
            </button>
            <button id="tab-region-2" class="kid-tab-chip" data-region="MOON_M1_COLD">
              <span class="chip-emoji">🧊</span>
              <div class="chip-text">
                <span class="chip-name">2. SHADOWED COLD TRAP</span>
                <span class="chip-tag">"Crater Floor PSR • 98% Ice"</span>
              </div>
            </button>
          </div>

          <!-- Main Graphical Body: Artwork on Left, Telemetry & Gauges on Right -->
          <div class="kid-dossier-body">
            <!-- Left Column: Visual Artwork & Dataset Badge -->
            <div class="kid-dossier-left">
              <div class="kid-image-frame">
                <img id="kid-card-img" src="/assets/images/moon_mission_01.svg" class="kid-site-image" alt="Lunar Landing Site" />
                <div id="kid-image-overlay-badge" class="kid-image-tag">
                  <span id="kid-image-tag-icon">❄️</span>
                  <span id="kid-image-tag-text">SOUTH POLE • SHACKLETON RIM</span>
                </div>
              </div>
              <div class="kid-dataset-verified">
                <span class="verify-icon">📡</span>
                <span>NASA DATA: </span>
                <strong id="kid-dataset-text" style="color: #ffffff; margin-left: 4px;">LOLA Elevation & LEND Water Ice</strong>
              </div>
            </div>

            <!-- Right Column: Visual Telemetry Meters & Mission Objective -->
            <div class="kid-dossier-right">
              <div class="kid-dossier-header">
                <h2 id="kid-card-title">❄️ SHACKLETON CRATER</h2>
                <div id="kid-card-tagline" class="kid-tagline">"The Frozen Ice Vault • Lunar South Pole"</div>
              </div>

              <!-- Segment Meter Gauges Grid -->
              <div class="kid-gauges-grid">
                <!-- Gauge 1: Solar Power -->
                <div class="kid-gauge-card">
                  <div class="gauge-meta">
                    <span class="gauge-label">☀️ SOLAR POWER</span>
                    <span id="kid-text-power" class="gauge-val val-green">SUPER HIGH (95%)</span>
                  </div>
                  <div id="kid-bar-power" class="kid-seg-bar"></div>
                </div>

                <!-- Gauge 2: Temperature -->
                <div class="kid-gauge-card">
                  <div class="gauge-meta">
                    <span class="gauge-label">🌡️ TEMPERATURE</span>
                    <span id="kid-text-temp" class="gauge-val val-blue">SUPER COLD (-233°C)</span>
                  </div>
                  <div id="kid-bar-temp" class="kid-seg-bar"></div>
                </div>

                <!-- Gauge 3: Resource -->
                <div class="kid-gauge-card">
                  <div class="gauge-meta">
                    <span id="kid-label-resource" class="gauge-label">💧 WATER ICE</span>
                    <span id="kid-text-resource" class="gauge-val val-cyan">DETECTED!</span>
                  </div>
                  <div id="kid-bar-resource" class="kid-seg-bar"></div>
                </div>

                <!-- Gauge 4: Radiation -->
                <div class="kid-gauge-card">
                  <div class="gauge-meta">
                    <span class="gauge-label">☢️ RADIATION & SHIELDS</span>
                    <span id="kid-text-rad" class="gauge-val val-amber">SHIELDS OK</span>
                  </div>
                  <div id="kid-bar-rad" class="kid-seg-bar"></div>
                </div>
              </div>

              <!-- 1-Sentence Action Mission Goal -->
              <div class="kid-dossier-goal">
                <span class="goal-tag">🎯 MISSION OBJECTIVE:</span>
                <p id="kid-card-goal" class="goal-desc">
                  Drive your rover to the sunny ridge peak, deploy the parabolic solar mirror, and discover frozen water ice!
                </p>
              </div>

              <!-- Big Touchdown Action Button -->
              <button id="btn-recon-launch" class="kid-launch-btn">
                🚀 TOUCH DOWN AT SOUTH POLE! ▶
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(reconOverlay);
    }
    this.reconOverlay = reconOverlay;
    this.telemetryCard = document.getElementById('recon-telemetry-card');

    // 3. Cinematic Descent Transition Overlay
    let descentCurtain = document.getElementById('descent-cinematic-curtain');
    if (!descentCurtain) {
      descentCurtain = document.createElement('div');
      descentCurtain.id = 'descent-cinematic-curtain';
      descentCurtain.className = 'descent-cinematic-curtain';
      descentCurtain.innerHTML = `
        <div class="descent-box">
          <div class="descent-spinner"></div>
          <div class="descent-title">DE-ORBIT BURN ENGAGED</div>
          <div id="descent-target-label" class="descent-sub">DESCENT TRAJECTORY LOCKED TO SHACKLETON CRATER</div>
          <div class="descent-progress-bar-wrap">
            <div id="descent-progress-bar" class="descent-progress-bar"></div>
          </div>
        </div>
      `;
      document.body.appendChild(descentCurtain);
    }
    this.descentCurtain = descentCurtain;
  }

  _renderSegments(total, filled, colorClass) {
    let html = '';
    for (let i = 0; i < total; i++) {
      if (i < filled) {
        html += `<span class="seg filled ${colorClass}"></span>`;
      } else {
        html += `<span class="seg empty"></span>`;
      }
    }
    return html;
  }

  onEnter() {
    this.isLookingOutside = false;
    this.isDescending = false;
    this.descentProgress = 0;
    this.selectedRegion = null;
    this.hoveredRegion = null;

    if (this.lookoutBtn) this.lookoutBtn.classList.add('visible');
    if (this.reconOverlay) this.reconOverlay.classList.remove('visible');
    if (this.telemetryCard) this.telemetryCard.classList.remove('visible');
    if (this.descentCurtain) this.descentCurtain.classList.remove('visible');

    this.engine.showPanel('hud');
    this.engine.hud.setLocation('SPACECRAFT CABIN • LUNAR ORBIT (110 KM)');
    this.engine.showNotification('🛸 CABIN ENVIRONMENT: Walk inside the spacecraft [WASD]. Approach the panoramic window or press [E] to scan lunar regions below!', 'info', 7500);

    this._bindEvents();
  }

  onExit() {
    if (this._onKeyGlobal) {
      window.removeEventListener('keydown', this._onKeyGlobal);
    }
    if (this.lookoutBtn) this.lookoutBtn.classList.remove('visible');
    if (this.reconOverlay) this.reconOverlay.classList.remove('visible');
    if (this.telemetryCard) this.telemetryCard.classList.remove('visible');
    if (this.descentCurtain) this.descentCurtain.classList.remove('visible');
    this.engine.hud.hideInteractionPrompt();
  }

  _bindEvents() {
    // Lookout Button click
    if (this.lookoutBtn) {
      this.lookoutBtn.onclick = () => {
        this.engine.audio.playUIClick();
        this.enterOrbitalView();
      };
    }

    // Return to Cabin Button
    const btnBack = document.getElementById('btn-recon-back');
    if (btnBack) {
      btnBack.onclick = () => {
        this.engine.audio.playUIClick();
        this.exitOrbitalView();
      };
    }

    // Region Switcher Tabs Click Handlers (Two Candidate Landing Sites)
    const tab1 = document.getElementById('tab-region-1');
    const tab2 = document.getElementById('tab-region-2');

    const setupTab = (tab, regionKey) => {
      if (!tab) return;
      tab.onclick = () => {
        this.engine.audio.playUIClick();
        this._showRegionTelemetry(regionKey);
      };
      tab.onmouseenter = () => this.engine.audio.playUIHover();
    };

    setupTab(tab1, 'MOON_M1');
    setupTab(tab2, 'MOON_M1_COLD');

    // Launch Descent Button
    const btnLaunch = document.getElementById('btn-recon-launch');
    if (btnLaunch) {
      btnLaunch.onclick = () => {
        const target = this.selectedRegion || this.hoveredRegion || 'MOON_M1';
        this.initiateDescent(target);
      };
      btnLaunch.onmouseenter = () => this.engine.audio.playUIHover();
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
      if (e.target.closest('#orbital-recon-overlay')) return; // Ignore clicks inside UI modals

      if (this.hoveredRegion) {
        this.engine.audio.playUIClick();
        this.selectedRegion = this.hoveredRegion;
        this.initiateDescent(this.hoveredRegion);
      }
    };
    window.addEventListener('pointerdown', this._onPointerDown);
  }

  enterOrbitalView() {
    this.isLookingOutside = true;
    this.camera = this.orbitalCamera;
    if (this.lookoutBtn) this.lookoutBtn.classList.remove('visible');
    if (this.reconOverlay) this.reconOverlay.classList.add('visible');
    this.engine.hud.hideInteractionPrompt();
    this.engine.hidePanel('hud'); // Clean orbital view without ground HUD clutter
    this.engine.audio.playTone(880, 0.12, 'sine', 0.2);

    // Default to Region 1 so player immediately sees colorful card and tabs
    this._showRegionTelemetry('MOON_M1');
  }

  exitOrbitalView() {
    this.isLookingOutside = false;
    this.camera = this.character.getCamera();
    if (this.lookoutBtn) this.lookoutBtn.classList.add('visible');
    if (this.reconOverlay) this.reconOverlay.classList.remove('visible');
    if (this.telemetryCard) this.telemetryCard.classList.remove('visible');
    this.engine.showPanel('hud');
    this.engine.hud.setLocation('SPACECRAFT CABIN • LUNAR ORBIT (110 KM)');
    this.engine.audio.playTone(440, 0.1, 'sine', 0.2);
  }

  _showRegionTelemetry(regionKey) {
    if (!this.telemetryCard) return;

    this.selectedRegion = regionKey;

    // Update active tab styling (Two Candidate Sites)
    const tab1 = document.getElementById('tab-region-1');
    const tab2 = document.getElementById('tab-region-2');
    const isSunlit = regionKey === 'MOON_M1';

    if (tab1) tab1.classList.toggle('active', isSunlit);
    if (tab2) tab2.classList.toggle('active', !isSunlit);

    // Visual image & caption badge elements
    const cardImg = document.getElementById('kid-card-img');
    const imageTagIcon = document.getElementById('kid-image-tag-icon');
    const imageTagText = document.getElementById('kid-image-tag-text');

    // DOM references inside kid mission card
    const titleEl = document.getElementById('kid-card-title');
    const taglineEl = document.getElementById('kid-card-tagline');
    const datasetEl = document.getElementById('kid-dataset-text');

    const textPower = document.getElementById('kid-text-power');
    const barPower = document.getElementById('kid-bar-power');

    const textTemp = document.getElementById('kid-text-temp');
    const barTemp = document.getElementById('kid-bar-temp');

    const labelResource = document.getElementById('kid-label-resource');
    const textResource = document.getElementById('kid-text-resource');
    const barResource = document.getElementById('kid-bar-resource');

    const textRad = document.getElementById('kid-text-rad');
    const barRad = document.getElementById('kid-bar-rad');

    const goalEl = document.getElementById('kid-card-goal');
    const btnLaunch = document.getElementById('btn-recon-launch');

    if (isSunlit) {
      if (cardImg) cardImg.src = '/assets/images/moon_mission_01.svg';
      if (imageTagIcon) imageTagIcon.textContent = '☀️';
      if (imageTagText) imageTagText.textContent = 'SOUTH POLE • SHACKLETON SUNLIT RIDGE';

      if (titleEl) titleEl.textContent = '☀️ SHACKLETON SUNLIT RIDGE';
      if (taglineEl) taglineEl.textContent = '"Continuous Solar Peak • 95% Illumination Zone"';
      if (datasetEl) datasetEl.textContent = 'NASA LOLA Altimetry & Diviner Illumination Models';

      if (textPower) {
        textPower.textContent = 'SUPER HIGH (95%) • 100% Base & Rover Starting Power';
        textPower.className = 'gauge-val val-green';
      }
      if (barPower) barPower.innerHTML = this._renderSegments(5, 5, 'green');

      if (textTemp) {
        textTemp.textContent = '-50°C to +20°C • Temperate Ridge (Easy Thermal Control)';
        textTemp.className = 'gauge-val val-orange';
      }
      if (barTemp) barTemp.innerHTML = this._renderSegments(5, 3, 'orange');

      if (labelResource) labelResource.textContent = '💧 WATER ICE';
      if (textResource) {
        textResource.textContent = 'SCARCE (20%) • Conserve Water Carefully';
        textResource.className = 'gauge-val val-amber';
      }
      if (barResource) barResource.innerHTML = this._renderSegments(5, 2, 'amber');

      if (textRad) {
        textRad.textContent = 'SHIELDS NORMAL • Standard Surface Exposure (2.3 µGy/h)';
        textRad.className = 'gauge-val val-amber';
      }
      if (barRad) barRad.innerHTML = this._renderSegments(5, 2, 'amber');

      if (goalEl) {
        goalEl.textContent = 'Touchdown on the sunlit ridge! Starting conditions: 100% Base Power, 100% Rover Cell, 85% Water Reserves. Ideal for rapid solar recharging and long rover exploration!';
      }
      if (btnLaunch) {
        btnLaunch.textContent = '🚀 TOUCH DOWN AT SUNLIT RIDGE! ▶';
      }

      if (this.moonGlobe) this.moonGlobe.rotation.y = 0;
    } else {
      // Shadowed Cold Trap (PSR)
      if (cardImg) cardImg.src = '/assets/images/moon_mission_04.svg';
      if (imageTagIcon) imageTagIcon.textContent = '🧊';
      if (imageTagText) imageTagText.textContent = 'SOUTH POLE • SHADOWED COLD TRAP (PSR)';

      if (titleEl) titleEl.textContent = '🧊 SHADOWED COLD TRAP';
      if (taglineEl) taglineEl.textContent = '"Permanently Shadowed Crater Floor • 40 Kelvin Cryo-Vault"';
      if (datasetEl) datasetEl.textContent = 'NASA LEND Neutron Detector & LCROSS 5.5 wt% H2O Plume';

      if (textPower) {
        textPower.textContent = 'LOW (35%) • Zero Sunlight (High Battery Heater Drain)';
        textPower.className = 'gauge-val val-amber';
      }
      if (barPower) barPower.innerHTML = this._renderSegments(5, 2, 'amber');

      if (textTemp) {
        textTemp.textContent = 'SUPER COLD (40 K / -233°C) • Deepest Space Cold';
        textTemp.className = 'gauge-val val-blue';
      }
      if (barTemp) barTemp.innerHTML = this._renderSegments(5, 5, 'blue');

      if (labelResource) labelResource.textContent = '💧 WATER ICE';
      if (textResource) {
        textResource.textContent = 'ABUNDANT (98%) • 100% Water & Oxygen Starting Levels';
        textResource.className = 'gauge-val val-cyan';
      }
      if (barResource) barResource.innerHTML = this._renderSegments(5, 5, 'cyan');

      if (textRad) {
        textRad.textContent = 'EXCELLENT • Steep Crater Rim Blocks 60% Cosmic Rays';
        textRad.className = 'gauge-val val-green';
      }
      if (barRad) barRad.innerHTML = this._renderSegments(5, 1, 'green');

      if (goalEl) {
        goalEl.textContent = 'Touchdown deep in the cold trap! Starting conditions: 100% Water, 100% Oxygen, 80% Power (due to heater load). Maximizes life support water, but requires careful power management!';
      }
      if (btnLaunch) {
        btnLaunch.textContent = '🚀 TOUCH DOWN AT COLD TRAP! ▶';
      }

      if (this.moonGlobe) this.moonGlobe.rotation.y = Math.PI * 0.25;
    }

    // Decorate scientific terms with interactive 'i' tooltip badges
    if (this.engine.tooltip) {
      if (datasetEl) datasetEl.innerHTML = this.engine.tooltip.decorateHTML(datasetEl.textContent);
      if (goalEl) goalEl.innerHTML = this.engine.tooltip.decorateHTML(goalEl.textContent);
      this.engine.tooltip.bindTooltips(this.telemetryCard);
    }

    this.telemetryCard.classList.add('visible');
  }

  initiateDescent(regionKey) {
    if (this.isDescending) return;
    this.isDescending = true;
    this.selectedRegion = regionKey;

    this.engine.audio.playThrusterRumble();
    this.engine.audio.playTone(550, 0.35, 'triangle', 0.4);

    const isSunlit = regionKey === 'MOON_M1';
    const targetName = isSunlit ? 'SHACKLETON SUNLIT RIDGE' : 'SHADOWED COLD TRAP (40K PSR)';
    const labelEl = document.getElementById('descent-target-label');
    if (labelEl) labelEl.textContent = `DESCENT TRAJECTORY LOCKED TO: ${targetName}`;

    if (this.descentCurtain) this.descentCurtain.classList.add('visible');

    let p = 0;
    const pBar = document.getElementById('descent-progress-bar');
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
    if (this.descentCurtain) this.descentCurtain.classList.remove('visible');

    const isSunlit = regionKey === 'MOON_M1';
    const targetName = isSunlit ? 'Shackleton Sunlit Ridge' : 'Shadowed Cold Trap (PSR)';

    // Initial Campaign Resource Initialization (100% full start for all vital entities)
    const resObj = { power: 100, oxygen: 100, water: 100, food: 100, roverEnergy: 100, crewCondition: 100 };

    this.engine.save.saveCampaignResources(resObj);
    if (this.engine.resources) {
      this.engine.resources.initMissionLevels();
    }

    // Standardized sequential unlock: Complete Mission 0, which unlocks Mission 1
    this.engine.save.completeMission('moon_m0');
    this.engine.save.recordMissionSample('moon_m0', {
      name: `110 km Cupola Reconnaissance (${targetName})`,
      type: 'ORBITAL RECONNAISSANCE SAMPLE',
      isSample: true
    });
    this.engine.scoring.add(1000, 'Mission 0: Cupola Orbital Reconnaissance & Site Selection');

    // Mission 0 Accomplished Celebration Modal with Routing back to Lunar Operations Archive
    this.engine.showMissionCompletedModal({
      title: 'MISSION 0: CUPOLA RECONNAISSANCE ACCOMPLISHED',
      subtitle: `Landing Site Selected: ${targetName}`,
      points: 1000,
      resources: resObj,
      praise: `Outstanding orbital reconnaissance, Astronaut Alex Morgan! Your cupola observations from 110 km high verified NASA datasets, calibrated initial expedition life support, and unlocked Mission 1 on the lunar surface!`,
      onSelectNext: () => {
        this.engine.setState('DESTINATION');
        this.engine.showPanel('moon-mission-modal');
      }
    });
  }

  update(dt) {
    const input = this.engine.input;

    // 1. Slow orbital planetary rotation
    if (this.moonGlobe) {
      this.moonGlobe.rotation.y += 0.015 * dt;
    }
    if (this.starfield) {
      this.starfield.rotation.y += 0.002 * dt;
    }

    // Pulse window beacon ring
    if (this.windowBeacon) {
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

    // 2. Character movement inside cabin (when not looking outside)
    if (!this.isLookingOutside && !this.isDescending) {
      this.character.update(dt);

      // Keep character inside cabin radius (radius 4.4)
      const p = this.character.getPosition();
      const distFromCenter = Math.hypot(p.x, p.z);
      if (distFromCenter > 4.2) {
        const angle = Math.atan2(p.z, p.x);
        p.x = Math.cos(angle) * 4.2;
        p.z = Math.sin(angle) * 4.2;
        this.character.position.copy(p);
      }

      // Observation cupola window is at (0, 1.8, -4.72)
      const distToWindow = Math.hypot(p.x - 0, p.z - (-4.72));
      if (distToWindow < 4.8) {
        this.engine.hud.showInteractionPrompt('LOOK OUTSIDE VIEWPORT / SCAN LUNAR SURFACE', 'E');
      } else {
        this.engine.hud.hideInteractionPrompt();
      }

      // Pressing [E] anywhere in the cabin triggers Viewport
      if (input.isActionPressed('interact')) {
        this.engine.audio.playUIClick();
        this.enterOrbitalView();
        return;
      }
    }

    // 3. Raycasting & Vision Angle while in Orbital Viewport Mode (detect hover over regions on Moon)
    if (this.isLookingOutside && !this.isDescending) {
      if (input.isActionPressed('interact') || (input.isKeyPressed && input.isKeyPressed('Escape'))) {
        this.exitOrbitalView();
        return;
      }

      // Smooth camera vision angle rotation in orbital view
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
