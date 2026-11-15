export const mcsAtmosphere = {
  "instrument": "Mars Reconnaissance Orbiter \u2014 MCS (Mars Climate Sounder)",
  "product": "Level 2 DDR Geophysical Vertical Profiles",
  "date": "July 2025 (Orbits 88727-88730)",
  "provenance_note": "MANDATORY RULE: Atmospheric limb-sounding instrument measuring vertical atmospheric structure from 10 km to 80 km altitude. Do not treat as local surface weather.",
  "vertical_profile": [
    {
      "altitude_km": 10,
      "pressure_Pa": 310.5,
      "temperature_K": 205.2,
      "dust_opacity_per_km": 0.015
    },
    {
      "altitude_km": 25,
      "pressure_Pa": 85.2,
      "temperature_K": 178.4,
      "dust_opacity_per_km": 0.008
    },
    {
      "altitude_km": 45,
      "pressure_Pa": 12.1,
      "temperature_K": 152.0,
      "dust_opacity_per_km": 0.003
    },
    {
      "altitude_km": 70,
      "pressure_Pa": 0.8,
      "temperature_K": 135.5,
      "dust_opacity_per_km": 0.001
    }
  ],
  "educational_concept": "Atmospheric transmission follows Beer-Lambert law: I = I0 * exp(-tau). During a regional dust storm, high-altitude dust in the 20-40 km layer spreads globally, dropping surface solar irradiance."
};
