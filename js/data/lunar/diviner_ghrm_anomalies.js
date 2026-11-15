export const ghrmData = {
  "dataset": "LRO Diviner Global High-Resolution Mosaic (GHRM) & GDR L3 Rock Abundance",
  "coverage": "20\u00b0N to 30\u00b0N, Aristillus Ray Ejecta",
  "formulas": {
    "rock_abundance": "RA = DN * 0.001 (Missing: -32768)",
    "observation_timing": "JD = DN * 0.01190476 + 2457338.0 (Missing: -32768)"
  },
  "anomaly_regions": [
    {
      "site": "Aristillus Central Peak & Interior Ejecta",
      "lat": 23.66,
      "lon": 358.72,
      "tbol_midnight_K": 114.8,
      "slope_adjusted_midnight_sam_K": 118.2,
      "surrounding_background_K": 94.5,
      "thermal_anomaly_delta_K": 23.7,
      "raw_dn_rock_abundance": 84,
      "calculated_rock_abundance_fraction": 0.084,
      "rock_abundance_percent": "8.4%",
      "explanation": "Model-adjusted midnight temperatures reveal a strong positive thermal anomaly (+23.7K above ambient). Cross-referencing with Diviner Rock Abundance (8.4% vs 1.2% mare average) confirms large exposed boulders that retain daytime heat far into the lunar night."
    },
    {
      "site": "Mare Imbrium Smooth Plain Baseline",
      "lat": 25.1,
      "lon": 345.5,
      "tbol_midnight_K": 93.2,
      "slope_adjusted_midnight_sam_K": 94.0,
      "surrounding_background_K": 94.0,
      "thermal_anomaly_delta_K": -0.8,
      "raw_dn_rock_abundance": 11,
      "calculated_rock_abundance_fraction": 0.011,
      "rock_abundance_percent": "1.1%",
      "explanation": "Fine-grained regolith dust (insulating layer) loses heat rapidly after sunset. Thermal anomaly is near zero and rock abundance is very low (1.1%). Safe driving terrain for rovers."
    }
  ]
};
