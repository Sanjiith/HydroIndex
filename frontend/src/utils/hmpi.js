import { METAL_STANDARDS_MG_L, DEFAULT_WEIGHTS } from './constants';

// Convert mg/L to μg/L for consistent calculations with backend
function toMicrograms(value) {
  return value * 1000;
}

// Get standard limits in μg/L (matching backend)
const STANDARD_LIMITS_UGL = {
  As: 10.0,    // μg/L
  Pb: 10.0,    // μg/L  
  Cd: 3.0,     // μg/L
  Cr: 50.0,    // μg/L
  Hg: 1.0,     // μg/L
  Ni: 20.0,    // μg/L
  Cu: 2000.0,  // μg/L
  Zn: 5000.0,  // μg/L
  Fe: 300.0,   // μg/L
  Mn: 100.0    // μg/L
};

// Calculate Contamination Factor (CF) for each metal
export function computeContaminationFactors(sample) {
  const factors = {};
  Object.keys(STANDARD_LIMITS_UGL).forEach((metal) => {
    const standard = STANDARD_LIMITS_UGL[metal];
    const concentration = toMicrograms(Number(sample[metal] || 0));
    factors[metal] = concentration > 0 && standard > 0 ? concentration / standard : 0;
  });
  return factors;
}

// Calculate Pollution Load Index (PLI) - geometric mean of contamination factors
export function computePLI(sample) {
  const cfDict = computeContaminationFactors(sample);
  const contaminationFactors = Object.values(cfDict).filter(cf => cf > 0);
  
  if (contaminationFactors.length === 0) return 0;
  
  // Geometric mean: PLI = (CF1 × CF2 × ... × CFn)^(1/n)
  const product = contaminationFactors.reduce((acc, cf) => acc * Math.max(cf, 0.0001), 1);
  const pli = Math.pow(product, 1 / contaminationFactors.length);
  return round2(pli);
}

// Calculate Heavy Metal Pollution Index (HMPI) - matching backend formula
export function computeHMPI(sample) {
  const cfDict = computeContaminationFactors(sample);
  const weights = Object.keys(cfDict).reduce((acc, metal) => {
    acc[metal] = 1 / STANDARD_LIMITS_UGL[metal];
    return acc;
  }, {});
  
  let numerator = 0;
  let denominator = 0;
  let availableMetals = 0;
  
  Object.keys(cfDict).forEach((metal) => {
    const cf = cfDict[metal];
    const weight = weights[metal];
    
    if (cf > 0 && weight > 0) {
      // HMPI formula: Σ(Qi × Wi) / ΣWi, where Qi = (Ci / Si) × 100
      const Qi = cf * 100; // Since CF = Ci/Si, then Qi = CF × 100
      numerator += Qi * weight;
      denominator += weight;
      availableMetals++;
    }
  });
  
  const hmpi = denominator > 0 ? numerator / denominator : 0;
  return round2(hmpi);
}

// Calculate total Contamination Factor (sum of individual CFs)
export function computeCF(sample) {
  const cfDict = computeContaminationFactors(sample);
  const totalCF = Object.values(cfDict).reduce((sum, cf) => sum + cf, 0);
  return round2(totalCF);
}

// Classification functions matching backend
export function classifyHMPI(hmpi) {
  if (hmpi < 100) return { label: 'Safe', badge: 'success', description: 'Suitable for drinking purposes' };
  if (hmpi < 200) return { label: 'Moderate', badge: 'warning', description: 'Requires treatment before consumption' };
  return { label: 'Critical', badge: 'danger', description: 'Not suitable for drinking' };
}

export function classifyPLI(pli) {
  if (pli < 1.0) return { label: 'Low', badge: 'success', description: 'Baseline level - suitable for drinking' };
  if (pli < 2.0) return { label: 'Moderate', badge: 'warning', description: 'Moderate level of contamination' };
  if (pli < 5.0) return { label: 'High', badge: 'danger', description: 'High level of contamination' };
  return { label: 'Very High', badge: 'danger', description: 'Very high contamination level' };
}

export function classifyCF(cf) {
  if (cf < 1.0) return { label: 'Low', badge: 'success', description: 'Within acceptable limits' };
  if (cf < 3.0) return { label: 'Moderate', badge: 'warning', description: 'Moderate contamination level' };
  if (cf < 6.0) return { label: 'Considerable', badge: 'danger', description: 'Considerable contamination level' };
  return { label: 'Very High', badge: 'danger', description: 'Very high contamination level' };
}

// Main function to compute all indices
export function computeAllIndices(sample) {
  // Convert sample concentrations to proper format
  const processedSample = {};
  Object.keys(sample).forEach(key => {
    if (['As', 'Pb', 'Cd', 'Cr', 'Hg', 'Ni', 'Cu', 'Zn', 'Fe', 'Mn'].includes(key)) {
      processedSample[key] = Number(sample[key] || 0);
    } else {
      processedSample[key] = sample[key];
    }
  });
  
  const HMPI = computeHMPI(processedSample);
  const PLI = computePLI(processedSample);
  const CF = computeCF(processedSample);
  
  return {
    HMPI, 
    PLI, 
    CF,
    HMPI_Class: classifyHMPI(HMPI),
    PLI_Class: classifyPLI(PLI),
    CF_Class: classifyCF(CF)
  };
}

// Utility functions
export function round2(n) { return Math.round(n * 100) / 100; }
export function round3(n) { return Math.round(n * 1000) / 1000; }

// Backward compatibility aliases - FIXED: Added proper function references
export const computeHPI = computeHMPI;
export const computeHEI = computePLI;
export const computeCd = computeCF;

// Enhanced function to get detailed analysis (matching backend)
export function getDetailedAnalysis(sample) {
  const indices = computeAllIndices(sample);
  const contaminationFactors = computeContaminationFactors(sample);
  
  // Get individual metal contributions
  const contributions = {};
  Object.keys(contaminationFactors).forEach(metal => {
    contributions[metal] = {
      concentration: toMicrograms(Number(sample[metal] || 0)),
      standard_limit: STANDARD_LIMITS_UGL[metal],
      cf_value: contaminationFactors[metal],
      level: classifyCF(contaminationFactors[metal]).label
    };
  });
  
  return {
    ...indices,
    contaminationFactors: contributions,
    unit_detected: 'mg/L', // Assuming frontend uses mg/L
    recommendations: generateRecommendations(indices)
  };
}

function generateRecommendations(indices) {
  const { HMPI, PLI, CF } = indices;
  
  if (HMPI < 100 && PLI < 1 && CF < 1) {
    return [
      "Water is safe for drinking",
      "Regular monitoring recommended",
      "Maintain current water treatment processes"
    ];
  } else if (HMPI < 200 && PLI < 2 && CF < 3) {
    return [
      "Water requires treatment before consumption",
      "Consider filtration systems",
      "Increase monitoring frequency"
    ];
  } else {
    return [
      "Water is not safe for drinking",
      "Immediate treatment required",
      "Consider alternative water sources",
      "Consult with water quality experts"
    ];
  }
}

// Validation function for sample data
export function validateSampleData(sample) {
  const errors = [];
  const warnings = [];
  
  Object.keys(STANDARD_LIMITS_UGL).forEach(metal => {
    const concentration = Number(sample[metal] || 0);
    const standardMgL = STANDARD_LIMITS_UGL[metal] / 1000; // Convert to mg/L for comparison
    
    if (concentration < 0) {
      errors.push(`${metal} concentration cannot be negative`);
    }
    
    if (concentration > standardMgL * 10) {
      warnings.push(`${metal} concentration is significantly elevated`);
    }
  });
  
  return { errors, warnings, isValid: errors.length === 0 };
}

// Unit conversion helper
export function autoDetectUnit(sample) {
  const metalValues = [];
  Object.keys(STANDARD_LIMITS_UGL).forEach(metal => {
    const value = Number(sample[metal] || 0);
    if (value > 0) metalValues.push(value);
  });
  
  if (metalValues.length === 0) return 'mg/L';
  
  const medianValue = metalValues.sort((a, b) => a - b)[Math.floor(metalValues.length / 2)];
  
  // If median is very low, likely in mg/L; if high, likely in μg/L
  return medianValue < 0.01 ? 'mg/L' : 'μg/L';
}

// NEW: Helper function to get HPI value for backward compatibility
export function getHPI(sample) {
  return computeHMPI(sample);
}

// NEW: Helper function to get all indices with backward compatible property names
export function computeAllIndicesWithAliases(sample) {
  const indices = computeAllIndices(sample);
  return {
    ...indices,
    // Add backward compatible aliases
    HPI: indices.HMPI,
    HEI: indices.PLI,
    Cd: indices.CF,
    HPI_Class: indices.HMPI_Class,
    HEI_Class: indices.PLI_Class,
    Cd_Class: indices.CF_Class
  };
}