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