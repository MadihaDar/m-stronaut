/* ============================================================
   FRONTIER: MISSION ACADEMY — Guided Purple Aura Waypoint System
   Spawns glowing purple beacon aura at objective coordinates,
   locks navigation guidance, auto-triggers cinematic zoom & rewards
   ============================================================ */

import * as THREE from 'three';

export class WaypointSystem {
  constructor(scene, engine, getTerrainHeight = null) {
    this.scene = scene;
    this.engine = engine;
    this.getTerrainHeight = getTerrainHeight;

    this.activeWaypoint = null;
    this.triggerRadius = 6.5; // auto-trigger radius (accessible outside obstacle colliders)
    this.isTriggered = false;
    this.cooldown = 0;

    this._buildMesh();
  }

  _buildMesh() {
    this.group = new THREE.Group();
    this.group.visible = false;
    this.currentColorHex = 0xff00ff;
    this.currentColorName = 'PINK';

    // 1. Massive 180m Towering Neon Light Pillar (Visible across entire crater/horizon)
    const cylGeo = new THREE.CylinderGeometry(3.5, 6.0, 180, 32, 1, true);
    this.cylMat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.cylinder = new THREE.Mesh(cylGeo, this.cylMat);
    this.cylinder.position.y = 90.0;
    this.cylinder.renderOrder = 998;
    this.group.add(this.cylinder);

    // Inner high-intensity laser core beam (220m into the sky)
    const coreGeo = new THREE.CylinderGeometry(0.9, 0.9, 220, 16, 1, true);
    this.coreMat = new THREE.MeshBasicMaterial({
      color: 0xff66ff,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.coreBeam = new THREE.Mesh(coreGeo, this.coreMat);
    this.coreBeam.position.y = 110.0;
    this.coreBeam.renderOrder = 999;
    this.group.add(this.coreBeam);

    // 2. Physical 3D Mission Post (Ground-anchored survey mast)
    this.missionPost = new THREE.Group();
    const mastGeo = new THREE.CylinderGeometry(0.25, 0.38, 4.8, 16);
    const mastMat = new THREE.MeshStandardMaterial({
      color: 0x222630,
      metalness: 0.85,
      roughness: 0.25
    });
    const mastMesh = new THREE.Mesh(mastGeo, mastMat);
    mastMesh.position.y = 2.4;
    this.missionPost.add(mastMesh);

    // Flashing Neon LED Rings around mast
    this.postRingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xff00ff,
      emissiveIntensity: 2.5,
      roughness: 0.2,
      metalness: 0.6
    });
    const ringBandGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.25, 16);
    const ringMesh1 = new THREE.Mesh(ringBandGeo, this.postRingMat);
    ringMesh1.position.y = 1.6;
    this.missionPost.add(ringMesh1);

    const ringMesh2 = new THREE.Mesh(ringBandGeo, this.postRingMat);
    ringMesh2.position.y = 3.2;
    this.missionPost.add(ringMesh2);

    // Beacon Sensor Head
    const headGeo = new THREE.SphereGeometry(0.5, 16, 16);
    this.postHeadMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xff00ff,
      emissiveIntensity: 3.0
    });
    const headMesh = new THREE.Mesh(headGeo, this.postHeadMat);
    headMesh.position.y = 4.8;
    this.missionPost.add(headMesh);
    this.group.add(this.missionPost);

    // 3. Rotating Floating Diamond Crystal Beacon (Tactile 3D Target Marker)
    const crystalGeo = new THREE.OctahedronGeometry(2.4, 0);
    this.crystalMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xff00ff,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.95
    });
    this.crystal = new THREE.Mesh(crystalGeo, this.crystalMat);
    this.crystal.position.y = 7.2;
    this.crystal.renderOrder = 999;
    this.group.add(this.crystal);

    // 4. Floating 3D Bobbing Billboard Indicator ("🎯 MISSION TARGET")
    this.targetBillboard = this._createBillboardSprite('🎯 MISSION TARGET', '#ff00ff');
    this.targetBillboard.position.y = 11.2;
    this.group.add(this.targetBillboard);

    // 5. Massive Glowing Ground Highlight Zone (16m radius / 32m diameter target zone)
    this.groundTargetGroup = new THREE.Group();

    // Outer radiant glowing ground disc
    const discGeo = new THREE.CircleGeometry(16.0, 48);
    this.groundDiscMat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.groundDisc = new THREE.Mesh(discGeo, this.groundDiscMat);
    this.groundDisc.rotation.x = -Math.PI / 2;
    this.groundDisc.position.y = 0.08;
    this.groundDisc.renderOrder = 997;
    this.groundTargetGroup.add(this.groundDisc);

    // Outer perimeter neon ring (16m)
    const ringGeo1 = new THREE.RingGeometry(15.2, 16.0, 48);
    this.ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.groundRing1 = new THREE.Mesh(ringGeo1, this.ringMat1);
    this.groundRing1.rotation.x = -Math.PI / 2;
    this.groundRing1.position.y = 0.12;
    this.groundRing1.renderOrder = 998;
    this.groundTargetGroup.add(this.groundRing1);

    // Mid pulsing target ring (8m)
    const ringGeo2 = new THREE.RingGeometry(7.5, 8.5, 36);
    this.groundRing2 = new THREE.Mesh(ringGeo2, this.ringMat1);
    this.groundRing2.rotation.x = -Math.PI / 2;
    this.groundRing2.position.y = 0.14;
    this.groundRing2.renderOrder = 998;
    this.groundTargetGroup.add(this.groundRing2);

    // Inner bullseye ring (3m)
    const ringGeo3 = new THREE.RingGeometry(2.4, 3.2, 24);
    this.groundRing3 = new THREE.Mesh(ringGeo3, this.ringMat1);
    this.groundRing3.rotation.x = -Math.PI / 2;
    this.groundRing3.position.y = 0.16;
    this.groundRing3.renderOrder = 998;
    this.groundTargetGroup.add(this.groundRing3);

    // High-power downward ground spotlight shining onto the terrain
    this.groundSpot = new THREE.SpotLight(0xff00ff, 14.0, 40, Math.PI * 0.45, 0.4);
    this.groundSpot.position.set(0, 18, 0);
    this.groundSpot.target.position.set(0, 0, 0);
    this.groundTargetGroup.add(this.groundSpot);
    this.groundTargetGroup.add(this.groundSpot.target);

    this.group.add(this.groundTargetGroup);

    // 6. Floating Ascending Particle Dust
    const particleCount = 50;
    const partGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    this.particleSpeeds = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.random() * 2.8;
      positions[i * 3] = Math.cos(angle) * rad;
      positions[i * 3 + 1] = Math.random() * 16.0;
      positions[i * 3 + 2] = Math.sin(angle) * rad;
      this.particleSpeeds.push(1.0 + Math.random() * 2.2);
    }

    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleMat = new THREE.PointsMaterial({
      color: 0xff88ff,
      size: 0.45,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(partGeo, this.particleMat);
    this.group.add(this.particles);

    // 7. Radiance Point Light
    this.light = new THREE.PointLight(0xff00ff, 5.5, 45);
    this.light.position.y = 7.5;
    this.group.add(this.light);

    this.scene.add(this.group);
  }

  _createBillboardSprite(text, colorHexStr) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // High-contrast pill container
    ctx.fillStyle = 'rgba(10, 8, 22, 0.92)';
    ctx.strokeStyle = colorHexStr || '#ff00ff';
    ctx.lineWidth = 6;
    ctx.shadowColor = colorHexStr || '#ff00ff';
    ctx.shadowBlur = 18;

    const r = 28;
    ctx.beginPath();
    ctx.roundRect(14, 14, 484, 100, r);
    ctx.fill();
    ctx.stroke();

    // High-contrast neon text
    ctx.shadowBlur = 12;
    ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false, // Prevents clipping under terrain or behind small rocks
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(13.0, 3.25, 1.0);
    sprite.renderOrder = 1000;
    return sprite;
  }

  /**
   * Sets dynamic sequential objective beacon color (e.g. Purple, Green, Cyan, Gold)
   */
  setColor(colorHex, colorName = '') {
    this.currentColorHex = colorHex;
    this.currentColorName = colorName || 'OBJECTIVE';

    if (this.cylMat) this.cylMat.color.setHex(colorHex);
    if (this.coreMat) this.coreMat.color.setHex(colorHex);
    if (this.crystalMat) this.crystalMat.emissive.setHex(colorHex);
    if (this.postRingMat) this.postRingMat.emissive.setHex(colorHex);
    if (this.postHeadMat) this.postHeadMat.emissive.setHex(colorHex);
    if (this.groundDiscMat) this.groundDiscMat.color.setHex(colorHex);
    if (this.ringMat1) this.ringMat1.color.setHex(colorHex);
    if (this.particleMat) this.particleMat.color.setHex(colorHex);
    if (this.light) this.light.color.setHex(colorHex);
    if (this.groundSpot) this.groundSpot.color.setHex(colorHex);

    // Recreate billboard with matching neon accent color if needed
    if (this.targetBillboard) {
      this.group.remove(this.targetBillboard);
      const hexStr = `#${colorHex.toString(16).padStart(6, '0')}`;
      const label = this.activeWaypoint?.billboardText || (colorName ? `🎯 ${colorName.toUpperCase()} TARGET` : '🎯 MISSION TARGET');
      this.targetBillboard = this._createBillboardSprite(label, hexStr);
      this.targetBillboard.position.y = 11.2;
      this.group.add(this.targetBillboard);
    }

    // Update HUD radar indicator if available
    const radarPill = document.getElementById('radar-target-pill');
    if (radarPill) {
      radarPill.style.borderColor = `#${colorHex.toString(16).padStart(6, '0')}`;
    }
  }

  /**
   * Sets the current active objective waypoint.
   * Guides player with towering 3D beacon marker visible from across the sector.
   */
  setWaypoint(wp) {
    this.activeWaypoint = wp;
    this.isTriggered = false;
    this.triggerRadius = (wp && wp.triggerRadius) ? wp.triggerRadius : 6.5;
    this.requireRover = !!(wp && wp.requireRover);

    if (!wp) {
      this.group.visible = false;
      return;
    }

    // Apply custom sequential objective color if provided
    if (wp.color !== undefined) {
      this.setColor(wp.color, wp.colorName || '');
    }

    const groundY = this.getTerrainHeight
      ? this.getTerrainHeight(wp.position.x, wp.position.z)
      : (wp.position.y || 0);

    // If position explicitly specifies subterranean cave floor, respect it
    const finalY = (wp.position.y !== undefined && wp.position.y < -10) ? wp.position.y : groundY;

    this.group.position.set(wp.position.x, finalY, wp.position.z);
    this.group.visible = true;

    const beaconDesc = wp.colorName ? `${wp.colorName} 3D Beacon` : 'Glowing 3D Beacon';
    this.engine.showNotification(`📍 NEW OBJECTIVE: Head towards the ${beaconDesc}!`, 'info', 4500);
  }

  /**
   * Clears the current active waypoint and hides the 3D beacon marker.
   */
  clearWaypoint() {
    this.setWaypoint(null);
  }

  getActiveWaypoint() {
    return this.activeWaypoint;
  }

  update(dt, playerPos, characterController = null) {
    if (!this.activeWaypoint || !this.group.visible) return;

    const time = Date.now() * 0.003;

    // 1. Aura Visual Animation (Pulse & Rotate)
    this.cylinder.rotation.y += 0.45 * dt;
    this.coreBeam.rotation.y -= 0.65 * dt;

    if (this.crystal) {
      this.crystal.rotation.y += 1.2 * dt;
      this.crystal.rotation.x = Math.sin(time) * 0.25;
      this.crystal.position.y = 7.2 + Math.sin(time * 2.2) * 0.8;
    }

    // Floating bobbing 3D text/icon billboard
    if (this.targetBillboard) {
      this.targetBillboard.position.y = 11.2 + Math.sin(time * 2.5) * 0.8;
    }

    // Flashing LED post pulse
    if (this.postRingMat) {
      this.postRingMat.emissiveIntensity = 2.2 + Math.sin(time * 3.5) * 1.2;
    }
    if (this.postHeadMat) {
      this.postHeadMat.emissiveIntensity = 2.8 + Math.cos(time * 3.5) * 1.2;
    }

    const pulse = 0.85 + Math.sin(time * 2.5) * 0.15;
    this.cylMat.opacity = 0.55 * pulse;
    if (this.groundDiscMat) {
      this.groundDiscMat.opacity = 0.28 + Math.sin(time * 2.5) * 0.14;
    }
    this.groundRing1.scale.set(pulse, pulse, pulse);
    this.groundRing2.rotation.z += 1.2 * dt;
    if (this.groundRing3) {
      this.groundRing3.rotation.z -= 1.6 * dt;
    }

    // 2. Ascending Particle Movement
    const posAttr = this.particles.geometry.attributes.position;
    for (let i = 0; i < this.particleSpeeds.length; i++) {
      let y = posAttr.getY(i) + this.particleSpeeds[i] * dt;
      if (y > 8.5) y = 0.1;
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;

    // 3. Auto-Trigger Cinematic Collision Detection (Supports Rover-Enforced Objectives)
    if (!this.isTriggered && playerPos) {
      const dx = playerPos.x - this.group.position.x;
      const dz = playerPos.z - this.group.position.z;
      const dist = Math.hypot(dx, dz);

      const isRover = (this.engine.resources && this.engine.resources.isRoverActive) || 
                      (this.engine.currentScene && this.engine.currentScene.mode === 'rover');

      if (this.requireRover && !isRover) {
        // Enforce Rover use: Player on foot cannot trigger objective!
        if (dist <= this.triggerRadius + 6.0 && this.engine.hud) {
          this.engine.hud.showInteractionPrompt('🚜 ROVER REQUIRED: Must be driving Lunar Rover [R] to survey objective!', 'R');
        }
      } else {
        if (dist <= this.triggerRadius) {
          this.isTriggered = true;
          this._triggerCinematicReward(characterController);
        }
      }
    }
  }

  _triggerCinematicReward(characterController) {
    const wp = this.activeWaypoint;
    if (!wp) return;

    // 1. Instantly disable player movement & start dramatic cinematic camera zoom
    if (characterController) {
      characterController.startCinematicZoom(3.0);
    }

    // 2. Play Audio Fanfare
    this.engine.audio.playSuccess();
    this.engine.audio.playTone(880, 0.18, 'sine', 0.4);
    setTimeout(() => this.engine.audio.playTone(1174, 0.25, 'sine', 0.35), 180);

    // 3. Record Sample / Finding into SaveManager
    if (this.engine.save) {
      this.engine.save.recordSample({
        id: wp.id || `sample_${Date.now()}`,
        name: wp.name || 'Objective Finding',
        type: wp.type || 'GEOLOGICAL SAMPLE',
        measurements: (wp.bullets || []).map((b, i) => ({
          label: `Finding ${i + 1}`,
          value: b,
          unit: '',
          source: 'measured',
          sourceLabel: 'NASA Surface Sensor'
        })),
        explain: {
          simple: wp.funFact || 'Planetary objective explored and verified.',
          advanced: 'Telemetry recorded to expedition logbook.',
          nasaDataset: 'NASA Mission Academy Datasets'
        }
      });
    }

    if (this.engine.scoring) {
      this.engine.scoring.add(wp.sciencePoints || 300, wp.name || 'Waypoint Objective');
    }

    // 4. Show Stylized "MISSION ACCOMPLISHED" Popup with Bullet Points & Fun Facts
    this._showAccomplishedModal(wp, () => {
      // Restore camera after player dismisses / continues
      if (characterController) {
        characterController.stopCinematicZoom();
      }
      if (wp.onComplete) {
        wp.onComplete();
      }
    });
  }

  _showAccomplishedModal(wp, onDismiss) {
    let modal = document.getElementById('mission-accomplished-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mission-accomplished-modal';
      modal.className = 'side-panel accomplished-modal';
      document.body.appendChild(modal);
    }

    // Build punchy bullet points & fun facts (child-friendly 7-12)
    const bulletList = (wp.bullets || [
      `Target Reached: ${wp.name || 'Scientific Sample'}`,
      `Data verified with official NASA mission records`,
      `Telemetry logged into expedition logbook`
    ]).map(b => `<li class="acc-bullet-item"><span class="acc-check">✓</span> <span>${b}</span></li>`).join('');

    const funFact = wp.funFact || 'Fact: Space scientists use rovers to explore rocky ground humans cannot reach yet!';

    modal.innerHTML = `
      <div class="accomplished-card">
        <div class="acc-badge-pill">★ WAYPOINT DISCOVERY ★</div>
        <h2 class="acc-title">MISSION ACCOMPLISHED!</h2>
        <div class="acc-subtitle">${wp.name || 'Exploration Site'}</div>

        <div class="acc-body">
          <ul class="acc-bullets">
            ${bulletList}
          </ul>

          <div class="acc-fun-fact-box">
            <span class="fact-icon">🌟</span>
            <div class="fact-content">
              <strong class="fact-label">PUNCHY SPACE FACT:</strong>
              <p class="fact-text">${funFact}</p>
            </div>
          </div>
        </div>

        <button id="btn-acc-continue" class="btn btn-primary acc-continue-btn">
          CONTINUE EXPEDITION ▶
        </button>
      </div>
    `;

    modal.classList.add('visible');
    const backdrop = document.getElementById('panel-backdrop');
    if (backdrop) backdrop.classList.add('visible');

    const btnCont = document.getElementById('btn-acc-continue');
    if (btnCont) {
      btnCont.onclick = () => {
        this.engine.audio.playUIClick();
        modal.classList.remove('visible');
        if (backdrop) backdrop.classList.remove('visible');
        if (onDismiss) onDismiss();
      };
    }
  }
}
