import { METAL_STANDARDS_MG_L, DEFAULT_WEIGHTS } from './constants';

export function computeQi(measured, standard, ideal) {
  if (standard === ideal) return 0;
  const val = 100 * Math.max(0, (measured - ideal) / (standard - ideal));
  return Number.isFinite(val) ? val : 0;
}

export function computeHPI(sample) {
  let numerator = 0;
  let denom = 0;
  Object.keys(DEFAULT_WEIGHTS).forEach((metal) => {
    const s = METAL_STANDARDS_MG_L[metal];
    const w = DEFAULT_WEIGHTS[metal];
    const m = Number(sample[metal] || 0);
    const Qi = computeQi(m, s.standard, s.ideal);
    numerator += w * Qi;
    denom += w;
  });
  const hpi = denom ? numerator / denom : 0;
  return round2(hpi);
}

export function computeHEI(sample) {
  let sum = 0;
  Object.keys(METAL_STANDARDS_MG_L).forEach((metal) => {
    const s = METAL_STANDARDS_MG_L[metal];
    const m = Number(sample[metal] || 0);
    sum += m / s.standard;
  });
  return round2(sum);
}

export function computeCd(sample) {
  let sum = 0;
  Object.keys(METAL_STANDARDS_MG_L).forEach((metal) => {
    const s = METAL_STANDARDS_MG_L[metal];
    const m = Number(sample[metal] || 0);
    const Cf = Math.max(0, m / s.standard - 1);
    sum += Cf;
  });
  return round2(sum);
}

export function computeMPI(sample) {
  const metals = Object.keys(METAL_STANDARDS_MG_L);
  const values = metals.map((metal) => Math.max(1e-9, Number(sample[metal] || 0)));
  const product = values.reduce((acc, v) => acc * v, 1);
  const mpi = Math.pow(product, 1 / values.length);
  return round3(mpi);
}

export function computeNemerowPI(sample) {
  const ratios = Object.keys(METAL_STANDARDS_MG_L).map((metal) => {
    const s = METAL_STANDARDS_MG_L[metal];
    const m = Number(sample[metal] || 0);
    return m / s.standard;
  });
  const pmax = Math.max(...ratios);
  const pave = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  const pn = Math.sqrt((pmax * pmax + pave * pave) / 2);
  return round2(pn);
}

export function classifyHPI(hpi) {
  if (hpi < 25) return { label: 'Excellent', badge: 'success' };
  if (hpi < 50) return { label: 'Good', badge: 'info' };
  if (hpi < 75) return { label: 'Poor', badge: 'warning' };
  return { label: 'Unsuitable', badge: 'danger' };
}

export function classifyHEI(hei) {
  if (hei < 10) return { label: 'Low', badge: 'success' };
  if (hei <= 20) return { label: 'Medium', badge: 'warning' };
  return { label: 'High', badge: 'danger' };
}

export function classifyCd(cd) {
  if (cd < 1) return { label: 'Low', badge: 'success' };
  if (cd <= 3) return { label: 'Medium', badge: 'warning' };
  return { label: 'High', badge: 'danger' };
}

export function computeAllIndices(sample) {
  const HPI = computeHPI(sample);
  const HEI = computeHEI(sample);
  const Cd = computeCd(sample);
  const MPI = computeMPI(sample);
  const NPI = computeNemerowPI(sample);
  return {
    HPI, HEI, Cd, MPI, NPI,
    HPI_Class: classifyHPI(HPI),
    HEI_Class: classifyHEI(HEI),
    Cd_Class: classifyCd(Cd)
  };
}

export function round2(n) { return Math.round(n * 100) / 100; }
export function round3(n) { return Math.round(n * 1000) / 1000; }