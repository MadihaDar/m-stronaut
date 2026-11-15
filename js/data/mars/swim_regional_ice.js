export const swimRegionalIce = {
  "dataset": "Subsurface Water Ice Mapping (SWIM4MIM) Project",
  "coverage": "Regional Northern Plains & Jezero Outskirts",
  "pixel_resolution_km": 2.96,
  "provenance_note": "MANDATORY RULE: Regional evidence layers (~2.96 km scale), not a precise local drilling map. SWIM does not determine the exact volume of extractable water litres.",
  "depth_intervals": [
    {
      "depth_range": "0 to 1 metre",
      "ice_consistency_ci": 0.18,
      "evidence_strength": "Low probability of pure ice in top meter at 18.4\u00b0N due to sublimation instability",
      "drilling_energy_factor": 1.0
    },
    {
      "depth_range": "1 to 5 metres",
      "ice_consistency_ci": 0.54,
      "evidence_strength": "Moderate consistency index: candidate pore ice / cemented permafrost",
      "drilling_energy_factor": 2.4
    },
    {
      "depth_range": "> 5 metres (Deep)",
      "ice_consistency_ci": 0.72,
      "evidence_strength": "High consistency index: ancient glacially-derived deposit under protective regolith lag",
      "drilling_energy_factor": 5.0
    }
  ]
};
