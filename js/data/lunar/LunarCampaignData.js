/* ============================================================
   FRONTIER: MISSION ACADEMY — Lunar Campaign Data & Physics Models
   Strictly verified NASA Lunar Datasets (LOLA, Diviner, LEND, Robbins, DONKI)
   ============================================================ */

import { lolaData } from './lola_south_pole.js';
import { lendData } from './lend_observations.js';
import { craterCatalogue } from './robbins_craters.js';
import { divinerGCP } from './diviner_gcp_thermal.js';
import { ghrmData } from './diviner_ghrm_anomalies.js';
import { donkiAlerts } from './donki_moon_alerts.js';

export const MOON_DATA = {
  lola: lolaData,
  lend: lendData,
  craters: craterCatalogue,
  divinerGCP: divinerGCP,
  ghrm: ghrmData,
  donki: donkiAlerts
};

/* ── Scientific Formulas & Data Conversions ── */

/**
 * 3.1 LOLA Elevation formula
 * h_metres = (POINT_RADIUS - SELENOID_RADIUS) * 1000
 * Both radius values in kilometres
 */
export function calculateLolaElevation(pointRadiusKm, selenoidRadiusKm) {
  return (pointRadiusKm - selenoidRadiusKm) * 1000.0;
}

/**
 * 3.1 Slope calculation
 * slope_radians = atan(sqrt((dz/dx)^2 + (dz/dy)^2))
 * slope_degrees = slope_radians * 180 / pi
 */
export function calculateSlopeDegrees(dzMetres, horizontalDistMetres) {
  if (horizontalDistMetres <= 0.001) return 0.0;
  const slopeRad = Math.atan(Math.abs(dzMetres) / horizontalDistMetres);
  return (slopeRad * 180.0) / Math.PI;
}

/**
 * 3.1 Route Cost model
 * route_cost = sum over segments of: distance * (1 + slope_weight * norm_slope + risk_weight * norm_risk)
 */
export function calculateRouteCost(segments, slopeWeight = 2.0, riskWeight = 1.5) {
  let totalCost = 0;
  let totalDist = 0;

  for (const seg of segments) {
    const dist = seg.distanceM;
    const normSlope = Math.min(1.0, seg.slopeDeg / 25.0); // 25° max safe climb
    const normRisk = seg.roughnessRisk || 0.0; // 0.0 - 1.0 (craters, boulders)

    const segmentCost = dist * (1.0 + (slopeWeight * normSlope) + (riskWeight * normRisk));
    totalCost += segmentCost;
    totalDist += dist;
  }

  return { totalCost: Math.round(totalCost), totalDistanceM: Math.round(totalDist) };
}

/**
 * 3.2 Diviner GDR L3 Rock Abundance Conversion
 * RA = DN * 0.001
 * Missing value: -32768
 */
export function convertRockAbundance(dn) {
  if (dn === -32768 || dn == null) return null; // Missing data must not be treated as zero
  return dn * 0.001;
}

/**
 * 3.4 Diviner JD AVG Conversion
 * JD = DN * 0.01190476 + 2457338.0
 * For observation timing only — NOT temperature!
 */
export function convertJulianDate(dn) {
  if (dn === -32768 || dn == null) return null;
  return dn * 0.01190476 + 2457338.0;
}

/**
 * 3.6 Robbins Lunar Great-Circle Distance
 * Spherical Law of Cosines:
 * d = R * arccos(sin(lat1)*sin(lat2) + cos(lat1)*cos(lat2)*cos(lon1 - lon2))
 * Radians with R = 1737.4 km
 */
export function calculateLunarGreatCircleDistance(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
  const R = 1737.4; // Moon radius in km
  const rad = Math.PI / 180.0;

  const phi1 = lat1Deg * rad;
  const phi2 = lat2Deg * rad;
  const dLambda = (lon2Deg - lon1Deg) * rad;

  const cosTheta = Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const clampedCos = Math.max(-1.0, Math.min(1.0, cosTheta));
  const angularDist = Math.acos(clampedCos);

  return R * angularDist;
}

/**
 * Diviner GCP Thermal Validator
 * Filters out missing constants -9999 and -9998
 */
export function isDivinerTempValid(valK) {
  return valK != null && valK > 0 && valK !== -9999 && valK !== -9998;
}
