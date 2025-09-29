export const METAL_STANDARDS_MG_L = {
  As: { standard: 0.01, ideal: 0 },
  Pb: { standard: 0.01, ideal: 0 },
  Cd: { standard: 0.003, ideal: 0 },
  Cr: { standard: 0.05, ideal: 0 },
  Hg: { standard: 0.001, ideal: 0 },
  Ni: { standard: 0.07, ideal: 0 },
  Cu: { standard: 2.0, ideal: 0 },
  Zn: { standard: 3.0, ideal: 0 },
  Fe: { standard: 0.3, ideal: 0 },
  Mn: { standard: 0.1, ideal: 0 }
};

export const DEFAULT_WEIGHTS = (() => {
  // Wi = k/Si normalized so sum Wi = 1
  const entries = Object.entries(METAL_STANDARDS_MG_L);
  const inv = entries.map(([k, v]) => [k, 1 / v.standard]);
  const totalInv = inv.reduce((acc, [, val]) => acc + val, 0);
  const map = {};
  inv.forEach(([k, val]) => {
    map[k] = val / totalInv;
  });
  return map;
})();

export const CATEGORY_COLORS = {
  good: 'success',
  moderate: 'warning',
  poor: 'danger',
  info: 'info',
  dark: 'dark'
};

// Additional constants for the three-index system
export const HMPI_CLASSIFICATION = {
  Safe: { threshold: 1, color: 'success', description: 'Water is safe for consumption' },
  Moderate: { threshold: 2, color: 'warning', description: 'Water requires treatment' },
  Critical: { threshold: Infinity, color: 'danger', description: 'Water is not safe for drinking' }
};

export const PLI_CLASSIFICATION = {
  Low: { threshold: 1, color: 'success', description: 'Low pollution load' },
  Moderate: { threshold: 2, color: 'warning', description: 'Moderate pollution load' },
  High: { threshold: Infinity, color: 'danger', description: 'High pollution load' }
};

export const CF_CLASSIFICATION = {
  Low: { threshold: 1, color: 'success', description: 'Low contamination' },
  Moderate: { threshold: 3, color: 'warning', description: 'Moderate contamination' },
  High: { threshold: Infinity, color: 'danger', description: 'High contamination' }
};

// Metal display names for UI
export const METAL_DISPLAY_NAMES = {
  As: 'Arsenic',
  Pb: 'Lead', 
  Cd: 'Cadmium',
  Cr: 'Chromium',
  Hg: 'Mercury',
  Ni: 'Nickel',
  Cu: 'Copper',
  Zn: 'Zinc',
  Fe: 'Iron',
  Mn: 'Manganese'
};

// Metal units
export const METAL_UNITS = {
  As: 'mg/L',
  Pb: 'mg/L',
  Cd: 'mg/L',
  Cr: 'mg/L',
  Hg: 'mg/L',
  Ni: 'mg/L',
  Cu: 'mg/L',
  Zn: 'mg/L',
  Fe: 'mg/L',
  Mn: 'mg/L'
};

// Standard limits array for easy access
export const STANDARD_LIMITS = Object.fromEntries(
  Object.entries(METAL_STANDARDS_MG_L).map(([metal, data]) => [metal, data.standard])
);

// For backward compatibility with existing code
export const METAL_STANDARDS = METAL_STANDARDS_MG_L;

// Default metal keys array
export const METAL_KEYS = Object.keys(METAL_STANDARDS_MG_L);

// Water quality thresholds
export const WATER_QUALITY_THRESHOLDS = {
  HMPI_SAFE: 1,
  HMPI_MODERATE: 2,
  PLI_SAFE: 1,
  PLI_MODERATE: 2,
  CF_LOW: 1,
  CF_MODERATE: 3
};

// Recommendation messages based on indices
export const RECOMMENDATIONS = {
  EXCELLENT: {
    condition: (hmpi, pli, cf) => hmpi < 1 && pli < 1 && cf < 1,
    message: 'Water quality is excellent. Safe for all uses.',
    action: 'No treatment required. Regular monitoring recommended.'
  },
  GOOD: {
    condition: (hmpi, pli, cf) => hmpi < 2 && pli < 2 && cf < 3,
    message: 'Water quality is acceptable but requires basic treatment.',
    action: 'Use filtration before drinking. Monitor monthly.'
  },
  POOR: {
    condition: (hmpi, pli, cf) => hmpi >= 2 || pli >= 2 || cf >= 3,
    message: 'Water quality is poor. Not safe for consumption.',
    action: 'Immediate treatment required. Avoid drinking without proper purification.'
  }
};