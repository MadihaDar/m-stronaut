import { audio } from '../engine/AudioManager.js';

export class ScienceMapViewer {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.element = null;
    this.activeLayer = 'lola_dem'; // 'lola_dem' | 'lola_slope' | 'robbins_craters' | 'diviner_thermal' | 'rock_abundance' | 'ghrm'
    this.lolaData = null;
    this.craterData = null;
    this.thermalData = null;
    this.raData = null;
    this.ghrmData = null;

    this.render();
    this.loadData();
  }

  async loadData() {
    try {
      const [lola, craters, thermal, ra, ghrm] = await Promise.all([
        fetch('/data/lola_south_pole.json').then((r) => r.json()),
        fetch('/data/robbins_craters.json').then((r) => r.json()),
        fetch('/data/diviner_thermal_gcp.json').then((r) => r.json()),
        fetch('/data/diviner_rock_abundance.json').then((r) => r.json()),
        fetch('/data/diviner_ghrm.json').then((r) => r.json())
      ]);
      this.lolaData = lola;
      this.craterData = craters;
      this.thermalData = thermal;
      this.raData = ra;
      this.ghrmData = ghrm;
      this.redrawMap();
    } catch (e) {
      console.warn('Map data load error:', e);
    }
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop hidden';
    this.element.id = 'modal-science-map';

    this.element.innerHTML = `
      <div class="modal-content science-map-modal">
        <div class="modal-header">
          <h2>🗺️ LUNAR SCIENCE MAP & GIS ATLAS</h2>
          <button class="modal-close" data-close>&times;</button>
        </div>

        <div class="map-controls-row">
          <div class="map-layer-selector">
            <button class="layer-btn active" data-layer="lola_dem">LOLA South Pole Elevation</button>
            <button class="layer-btn" data-layer="lola_slope">LOLA Slope Gradient</button>
            <button class="layer-btn" data-layer="robbins_craters">Robbins Crater Database</button>
            <button class="layer-btn" data-layer="diviner_thermal">Diviner GCP Thermal (20°N-30°N)</button>
            <button class="layer-btn" data-layer="ghrm">Diviner GHRM</button>
            <button class="layer-btn" data-layer="rock_abundance">Diviner Rock Abundance</button>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-inspect-prov">📋 DATA PROVENANCE</button>
        </div>

        <div class="map-view-body">
          <div class="canvas-container">
            <canvas id="map-canvas" width="460" height="460"></canvas>
            <div class="map-crosshair-label" id="map-hover-info">Hover over terrain cell</div>
          </div>

          <div class="map-sidebar" id="map-sidebar-content">
            <!-- Dynamic layer info & stats -->
          </div>
        </div>

        <div class="modal-footer">
          <span class="coverage-warning">⚠️ Note: LOLA covers 85°S–90°S. Diviner GCP tables cover 20°S–30°N. Products do not overlap.</span>
          <button class="btn btn-secondary" data-close>CLOSE MAP</button>
        </div>
      </div>
    `;

    // Events
    this.element.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.hide();
      });
    });

    this.element.querySelectorAll('.layer-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playClick();
        this.element.querySelectorAll('.layer-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeLayer = btn.getAttribute('data-layer');
        this.redrawMap();
      });
    });

    this.element.querySelector('#btn-inspect-prov').addEventListener('click', () => {
      audio.playClick();
      let key = 'lola';
      if (this.activeLayer === 'diviner_thermal') key = 'diviner_gcp';
      if (this.activeLayer === 'ghrm') key = 'diviner_ghrm';
      if (this.activeLayer === 'rock_abundance') key = 'diviner_ra';
      if (this.activeLayer === 'robbins_craters') key = 'robbins';
      this.uiManager.datasetInfoModal.show(key);
    });

    // Canvas hover inspection
    const canvas = this.element.querySelector('#map-canvas');
    canvas.addEventListener('mousemove', (e) => {
      this.handleMapHover(e, canvas);
    });
  }

  handleMapHover(e, canvas) {
    if (!this.lolaData) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const label = this.element.querySelector('#map-hover-info');

    const gridSize = this.lolaData.gridSize || 21;
    const cellW = canvas.width / gridSize;
    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellW);

    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      if (this.activeLayer === 'lola_dem') {
        const elev = this.lolaData.demMatrix[row][col];
        label.textContent = `Cell [${col}, ${row}] | LOLA Elevation: ${elev} m relative to Selenoid`;
      } else if (this.activeLayer === 'lola_slope') {
        const slope = this.lolaData.slopeMatrix[row][col];
        label.textContent = `Cell [${col}, ${row}] | Local Slope: ${slope}° (${slope > 12 ? 'ROVER HAZARD' : 'SAFE PASSAGE'})`;
      } else if (this.activeLayer === 'robbins_craters') {
        label.textContent = `Coordinate: ~${(-89.9 + (row/gridSize)*4.5).toFixed(2)}°S, ${(col/gridSize*360).toFixed(1)}°E`;
      }
    }
  }

  redrawMap() {
    const canvas = this.element.querySelector('#map-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sidebar = this.element.querySelector('#map-sidebar-content');

    if (this.activeLayer === 'lola_dem' && this.lolaData) {
      this.drawLolaGrid(ctx, canvas, this.lolaData.demMatrix, false);
      sidebar.innerHTML = `
        <div class="sidebar-block">
          <h3>LOLA Digital Elevation Model (DEM)</h3>
          <p class="tagline">85°S to 90°S South Polar Relief</p>
          <div class="stat-box">
            <span class="stat-lbl">Elevation Formula:</span>
            <code>h_m = (POINT_RADIUS - SELENOID_RADIUS) * 1000</code>
          </div>
          <div class="stat-box">
            <span class="stat-lbl">Peak Elevation (Connecting Ridge):</span>
            <strong>+720.0 m (Peak of Eternal Light)</strong>
          </div>
          <div class="stat-box">
            <span class="stat-lbl">Lowest Floor (Shackleton PSR):</span>
            <strong>-1,200.0 m (Permanent Cold Trap)</strong>
          </div>
          <p class="guide-text">The circular ring in the center represents the rim of Shackleton Crater. Towering peaks receive sunlight, while the interior is plunged in total cryogenic darkness.</p>
        </div>
      `;
    } else if (this.activeLayer === 'lola_slope' && this.lolaData) {
      this.drawLolaGrid(ctx, canvas, this.lolaData.slopeMatrix, true);
      sidebar.innerHTML = `
        <div class="sidebar-block">
          <h3>LOLA Local Slope Gradient</h3>
          <p class="tagline">Approximate Traversal Risk Map</p>
          <div class="stat-box">
            <span class="stat-lbl">Slope Formula:</span>
            <code>atan(sqrt((dz/dx)² + (dz/dy)²)) * 180 / π</code>
          </div>
          <div class="stat-box">
            <span class="stat-lbl">Safe Traversal Gradient:</span>
            <span style="color: var(--accent-green);">0° to 8° (Green/Blue)</span>
          </div>
          <div class="stat-box">
            <span class="stat-lbl">Rollover Hazard Threshold:</span>
            <span style="color: var(--accent-red);">&gt; 14° (Red/Orange)</span>
          </div>
          <p class="guide-text">Slopes exceeding 15° cause rover wheels to slip in fine regolith dust. Route planning requires skirting around steep crater rims.</p>
        </div>
      `;
    } else if (this.activeLayer === 'robbins_craters' && this.craterData) {
      this.drawCraters(ctx, canvas);
      const craters = this.craterData.southPoleCraters;
      sidebar.innerHTML = `
        <div class="sidebar-block">
          <h3>Robbins Lunar Crater Catalog (2018)</h3>
          <p class="tagline">South-Polar Impact Basins</p>
          <div class="stat-box">
            <span class="stat-lbl">Total Catalog Size:</span>
            <strong>1,296,796 Catalogued Craters</strong>
          </div>
          <div class="crater-list-scroll">
            ${craters.slice(0, 5).map((c) => `
              <div class="crater-item">
                <span class="c-name">${c.name || c.id}</span>
                <span class="c-spec">Diam: ${c.diam_km} km | Lat: ${c.lat}°</span>
                <p class="c-morph">${c.morphology || 'Impact crater feature'}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (this.activeLayer === 'diviner_thermal' && this.thermalData) {
      this.drawThermalCurve(ctx, canvas);
      const d = this.thermalData;
      sidebar.innerHTML = `
        <div class="sidebar-block">
          <h3>Diviner GCP Thermal Brightness</h3>
          <p class="tagline">Coverage: 20°N to 30°N (Mission 02 Region)</p>
          <div class="stat-box">
            <span class="stat-lbl">Noon Brightness Temp (12:00):</span>
            <strong style="color: #f97316;">${d.deltaT_noon_midnight.t_noon_kelvin} K (+109.3°C)</strong>
          </div>
          <div class="stat-box">
            <span class="stat-lbl">Midnight Cryogenic Temp (00:00):</span>
            <strong style="color: #38bdf8;">${d.deltaT_noon_midnight.t_midnight_kelvin} K (-176.4°C)</strong>
          </div>
          <div class="stat-box">
            <span class="stat-lbl">Diurnal Thermal Swing (ΔT):</span>
            <strong>${d.deltaT_noon_midnight.delta_kelvin} K amplitude</strong>
          </div>
          <p class="guide-text">${d.deltaT_noon_midnight.explanation}</p>
        </div>
      `;
    } else if (this.activeLayer === 'ghrm' && this.ghrmData) {
      this.drawGhrmDiagram(ctx, canvas);
      sidebar.innerHTML = `
        <div class="sidebar-block">
          <h3>Diviner GHRM High-Resolution Mapping</h3>
          <p class="tagline">Global Coverage: 70°S to 70°N</p>
          <div class="stat-box">
            <span class="stat-lbl">Resolution:</span>
            <strong>128 pixels per degree (~237 m)</strong>
          </div>
          <div class="stat-box">
            <span class="stat-lbl">Bolometric Anomaly:</span>
            <strong>TBOL_ANOM (Ejecta blanket thermals)</strong>
          </div>
          <p class="guide-text">${this.ghrmData.scienceContext}</p>
        </div>
      `;
    } else if (this.activeLayer === 'rock_abundance' && this.raData) {
      this.drawRockAbundance(ctx, canvas);
      sidebar.innerHTML = `
        <div class="sidebar-block">
          <h3>Diviner GDR L3 Rock Abundance</h3>
          <p class="tagline">Coverage: 80°S to 80°N | Formula: RA = DN * 0.001</p>
          ${this.raData.surveyRegions.map((r) => `
            <div class="stat-box">
              <span class="stat-lbl">${r.region}:</span>
              <strong>RA: ${(r.mean_RA * 100).toFixed(1)}% (${r.hazard_level} HAZARD)</strong>
              <p class="c-morph">${r.interpretation}</p>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  drawLolaGrid(ctx, canvas, matrix, isSlope) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r][c];
        if (isSlope) {
          // Color ramp for slope: Green (0-5 deg) -> Yellow (6-10) -> Red (>14)
          const norm = Math.min(1.0, val / 20.0);
          const red = Math.floor(norm * 255);
          const green = Math.floor((1 - norm) * 200);
          ctx.fillStyle = `rgb(${red}, ${green}, 40)`;
        } else {
          // Color ramp for elevation: Deep Purple (-1200) -> Cyan (0) -> Bright Gold (+700)
          const norm = (val + 1200) / 2000.0;
          const blue = Math.floor(Math.max(0, 1 - norm) * 255);
          const red = Math.floor(Math.min(1, norm * 1.5) * 255);
          const green = Math.floor(Math.sin(norm * Math.PI) * 200);
          ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        }
        ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1);
      }
    }

    // Overlay grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellH);
      ctx.lineTo(canvas.width, i * cellH);
      ctx.stroke();
    }
  }

  drawCraters(ctx, canvas) {
    ctx.fillStyle = '#070b19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const craters = this.craterData.southPoleCraters;
    craters.forEach((c, idx) => {
      // Map polar coordinates onto canvas
      const normR = ((c.lat + 90.0) / 5.5) * (canvas.width * 0.42);
      const angle = (c.lon * Math.PI) / 180.0;
      const x = canvas.width / 2 + normR * Math.cos(angle);
      const y = canvas.height / 2 + normR * Math.sin(angle);
      const r = Math.max(4, (c.diam_km / 120.0) * 45);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = idx === 0 ? '#facc15' : '#38bdf8';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(c.name || c.id, x + r + 3, y + 3);
    });
  }

  drawThermalCurve(ctx, canvas) {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const curve = this.thermalData.diurnalCurve;
    if (!curve || curve.length === 0) return;

    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.lineTo(40, canvas.height - 40);
    ctx.lineTo(canvas.width - 20, canvas.height - 40);
    ctx.stroke();

    // Plot tbol curve
    ctx.beginPath();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    curve.forEach((pt, idx) => {
      const x = 40 + (pt.local_time_hours / 24.0) * (canvas.width - 70);
      const y = canvas.height - 40 - (pt.tbol_kelvin / 420.0) * (canvas.height - 70);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('0h (Night)', 40, canvas.height - 20);
    ctx.fillText('12h (Noon: 382 K)', canvas.width / 2 - 40, canvas.height - 20);
    ctx.fillText('24h (Night)', canvas.width - 70, canvas.height - 20);
    ctx.fillText('400 K', 6, 30);
    ctx.fillText('100 K', 6, canvas.height - 60);
  }

  drawGhrmDiagram(ctx, canvas) {
    ctx.fillStyle = '#0d1322';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Diviner GHRM 70°S–70°N Multispectral Channels', 30, 40);

    const channels = ['TB6 (13-23 µm)', 'TB7 (25-41 µm)', 'TB8 (50-100 µm)', 'TB9 (100-400 µm)', 'TBOL (Bolometric)', 'TBOL_ANOM (Thermal Anomaly)'];
    channels.forEach((ch, idx) => {
      const y = 80 + idx * 55;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.fillRect(30, y, canvas.width - 60, 42);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.strokeRect(30, y, canvas.width - 60, 42);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(`📡 Product Layer: ${ch}`, 45, y + 25);
    });
  }

  drawRockAbundance(ctx, canvas) {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f97316';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Diviner GDR L3 Rock Abundance Heatmap (80°S to 80°N)', 30, 40);

    // Three representative patches
    const patches = [
      { name: 'Smooth Mare Plains (RA = 0.8%)', color: '#22c55e', y: 80 },
      { name: 'Aristillus Ejecta Blanket (RA = 8.4%)', color: '#f59e0b', y: 180 },
      { name: 'Autolycus Rim Breccia (RA = 14.2%)', color: '#ef4444', y: 280 }
    ];

    patches.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.fillRect(30, p.y, 100, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(p.name, 145, p.y + 35);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Scale: Fractional areal coverage of rocks > 1m', 145, p.y + 55);
    });
  }

  show() {
    this.element.classList.remove('hidden');
    this.redrawMap();
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
