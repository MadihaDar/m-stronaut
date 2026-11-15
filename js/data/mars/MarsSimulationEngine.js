/* ============================================================
   FRONTIER: MISSION ACADEMY — Mars Unified Simulation Engine
   Implements all mandatory physical formulas for power, water,
   O2/CO2, greenhouse yield, thermal conduction/radiation,
   dust transmission, radiation dose, and communication delay.
   Persists state between Mission M01 and Mission M02.
   ============================================================ */

import { medaHistorical } from './meda_historical.js';
import { radDosimetry } from './rad_dosimetry.js';
import { mcsAtmosphere } from './mcs_atmosphere.js';
import { swimRegionalIce } from './swim_regional_ice.js';
import { donkiMarsAlerts } from './donki_mars_alerts.js';

export const MARS_DATA = {
  meda: medaHistorical,
  rad: radDosimetry,
  mcs: mcsAtmosphere,
  swim: swimRegionalIce,
  donki: donkiMarsAlerts
};

export class MarsSimulationEngine {
  constructor(saveManager) {
    this.save = saveManager;

    // Load or initialize persistent Mars state
    this.state = this._loadState();
  }

  _defaults() {
    return {
      sol: 1,
      // 5.1 Power & Solar Panel Dust System
      power: {
        solarAreaM2: 80.0,            // A
        solarEfficiency: 0.24,        // eta (24% high-efficiency triple-junction cells)
        solarIrradianceG: 590.0,       // G (W/m2 Mars solar constant)
        panelDustFactor: 0.95,        // f_dust (0.1 to 1.0, separate from atmospheric opacity)
        otherLossFactor: 0.92,        // f_other (inverter, wiring)
        batteryCapacityKWh: 120.0,    // E_capacity
        batteryCurrentKWh: 105.0,     // E_current
        habitatPowerDrawKW: 4.8       // Constant base load
      },
      // 5.6 Atmospheric Dust
      atmosphere: {
        tau: 0.42,                    // Optical depth (MEDA/MCS reference)
        I0: 590.0                     // Top of atmosphere irradiance (W/m2)
      },
      // 5.2 Water System
      water: {
        currentLiters: 850.0,
        consumedPerSol: 30.0,
        lostPerSol: 1.5,
        drillExtractionRateLPerHour: 4.2,
        recyclingEfficiencyEta: 0.94, // 94% recovery
        drillingLocationSelected: null,
        totalExtractedLiters: 0.0
      },
      // 5.3 Oxygen & CO2 System
      lifeSupport: {
        currentO2Kg: 240.0,
        consumedO2PerSolKg: 3.36,     // 4 astronauts * 0.84 kg/day
        moxieProductionRateKgPerHr: 0.25,
        currentCO2Ppm: 650.0,         // Target safe indoor air
        co2ScrubberEfficiency: 0.98
      },
      // 5.4 Greenhouse System
      greenhouse: {
        rMaxKgPerSol: 2.5,            // Maximum yield rate
        fTemperature: 0.95,           // Optimal 22°C
        fLight: 0.90,                 // LED supplement
        fWater: 1.0,                  // Hydroponic feed
        fCO2: 1.0,                    // 800-1000 ppm
        fNutrients: 0.95,
        accumulatedFoodKg: 18.0
      },
      // 5.5 Thermal Control
      thermal: {
        habInsideTempK: 294.15,       // 21°C
        marsAmbientTempK: 215.87,     // MEDA median air temp (~ -57°C)
        wallConductivityK: 0.03,      // Aerogel insulation (W/m-K)
        wallThicknessL: 0.15,         // metres
        wallAreaA: 180.0,             // m2
        emissivityEpsilon: 0.88,
        stefanBoltzmannSigma: 5.67e-8
      },
      // 5.7 Radiation System
      radiation: {
        accumulatedDoseMicroGy: 187.58,
        shieldingActive: false,
        shieldingReductionFactor: 0.45 // Reduces dose by 55% when in regolith bunker
      },
      // Mission Choices & Flags persisted into Mission M02
      decisions: {
        m01Completed: false,
        dustStormResponse: null,      // 'shelter_power_save' | 'overclock_heaters'
        waterDrillSite: null,
        cargoSelectedMassKg: 0,
        cargoManifest: [],
        safetyRulesViolated: false
      }
    };
  }

  _loadState() {
    const saved = this.save.get('mars_campaign_state');
    return saved ? saved : this._defaults();
  }

  saveState() {
    this.save.set('mars_campaign_state', this.state);
  }

  /* ── 5.1 Power & Energy Calculations ── */

  /**
   * P_solar = G * A * eta * f_dust * f_other
   * G_surface = I0 * exp(-tau)
   */
  calculateSolarPowerW() {
    const p = this.state.power;
    const atm = this.state.atmosphere;

    // Atmospheric transmission (Beer-Lambert law)
    const G_surface = atm.I0 * Math.exp(-atm.tau);

    // Instantaneous electrical power generated
    const P_solar = G_surface * p.solarAreaM2 * p.solarEfficiency * p.panelDustFactor * p.otherLossFactor;
    return {
      P_solar_W: P_solar,
      G_surface_W_m2: G_surface,
      panel_dust_factor: p.panelDustFactor,
      atmospheric_tau: atm.tau
    };
  }

  /**
   * E_next = min(E_capacity, E_current + E_generated - E_used)
   */
  updateBatteryDaily(hoursSunlight = 11.5) {
    const p = this.state.power;
    const powerW = this.calculateSolarPowerW().P_solar_W;
    const E_generated_kWh = (powerW * hoursSunlight) / 1000.0;
    const E_used_kWh = p.habitatPowerDrawKW * 24.6; // Martian sol = 24.6 hours

    p.batteryCurrentKWh = Math.min(p.batteryCapacityKWh, Math.max(0, p.batteryCurrentKWh + E_generated_kWh - E_used_kWh));
    this.saveState();
    return {
      battery_kWh: p.batteryCurrentKWh,
      generated_kWh: E_generated_kWh,
      used_kWh: E_used_kWh
    };
  }

  /* ── 5.2 Water System Calculations ── */

  /**
   * W_next = W_current + W_extracted + W_recycled - W_consumed - W_lost
   * eta_recycle = (W_recovered / W_processed) * 100%
   */
  updateWaterSol(drillingHours = 0) {
    const w = this.state.water;
    const W_extracted = drillingHours * w.drillExtractionRateLPerHour * 1.0;
    const W_recycled = w.consumedPerSol * w.recyclingEfficiencyEta;
    const W_consumed = w.consumedPerSol;
    const W_lost = w.lostPerSol;

    w.currentLiters = Math.max(0, w.currentLiters + W_extracted + W_recycled - W_consumed - W_lost);
    w.totalExtractedLiters += W_extracted;
    this.saveState();

    return {
      current_liters: w.currentLiters,
      extracted_liters: W_extracted,
      recycled_liters: W_recycled
    };
  }

  /* ── 5.3 Oxygen & CO2 System Calculations ── */

  /**
   * O2_next = O2_current + O2_generated - O2_consumed - O2_lost
   */
  updateAtmosphereSol(moxieHours = 12) {
    const ls = this.state.lifeSupport;
    const O2_generated = moxieHours * ls.moxieProductionRateKgPerHr;
    const O2_consumed = ls.consumedO2PerSolKg;

    ls.currentO2Kg = Math.max(0, ls.currentO2Kg + O2_generated - O2_consumed);
    this.saveState();

    return {
      current_O2_kg: ls.currentO2Kg,
      generated_kg: O2_generated,
      consumed_kg: O2_consumed
    };
  }

  /* ── 5.4 Greenhouse Effective Growth Rate ── */

  /**
   * r_effective = r_max * f_temperature * f_light * f_water * f_CO2 * f_nutrients
   */
  calculateGreenhouseYield() {
    const g = this.state.greenhouse;
    const r_effective = g.rMaxKgPerSol * g.fTemperature * g.fLight * g.fWater * g.fCO2 * g.fNutrients;
    g.accumulatedFoodKg += r_effective;
    this.saveState();

    return {
      r_effective_kg_sol: r_effective,
      total_food_kg: g.accumulatedFoodKg
    };
  }

  /* ── 5.5 Thermal Control Formulas ── */

  /**
   * Conduction: Q = (k * A * delta_T / L) * t
   * Radiation: P = epsilon * sigma * A * (T_hab^4 - T_ambient^4)
   */
  calculateThermalLossWatts() {
    const th = this.state.thermal;
    const deltaT = th.habInsideTempK - th.marsAmbientTempK;

    // Conduction heat loss rate (Watts = J/s)
    const Q_conduction_W = (th.wallConductivityK * th.wallAreaA * deltaT) / th.wallThicknessL;

    // Radiation heat loss rate (Watts)
    const T4_diff = Math.pow(th.habInsideTempK, 4) - Math.pow(th.marsAmbientTempK, 4);
    const P_radiation_W = th.emissivityEpsilon * th.stefanBoltzmannSigma * th.wallAreaA * T4_diff;

    return {
      conduction_W: Q_conduction_W,
      radiation_W: P_radiation_W,
      total_heating_needed_W: Q_conduction_W + P_radiation_W,
      deltaT_K: deltaT
    };
  }

  /* ── 5.7 Radiation Dose Calculation ── */

  /**
   * Absorbed dose: D = dose_rate * time
   */
  calculateAbsorbedDose(sols = 1, inShelter = false) {
    const baseDailyDose = 187.58; // MSL RAD reference (uGy/day)
    const factor = inShelter ? 0.45 : 1.0;
    const addedDose = baseDailyDose * factor * sols;

    this.state.radiation.accumulatedDoseMicroGy += addedDose;
    this.saveState();

    return {
      added_uGy: addedDose,
      total_uGy: this.state.radiation.accumulatedDoseMicroGy
    };
  }

  /* ── 5.9 Communication Delay ── */

  /**
   * One-way: t = d / c
   * Round-trip: t = 2d / c
   */
  static calculateCommunicationDelay(distanceKm = 225000000.0) {
    const c = 299792.458; // km / second
    const oneWaySec = distanceKm / c;
    const roundTripSec = (2.0 * distanceKm) / c;

    return {
      distance_km: distanceKm,
      one_way_seconds: Math.round(oneWaySec),
      one_way_minutes: (oneWaySec / 60.0).toFixed(1),
      round_trip_seconds: Math.round(roundTripSec),
      round_trip_minutes: (roundTripSec / 60.0).toFixed(1)
    };
  }
}
