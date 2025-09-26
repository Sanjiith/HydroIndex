const KEY = 'hydro-index-samples-v1';

export function loadSamples() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSamples(samples) {
  localStorage.setItem(KEY, JSON.stringify(samples));
}

export function addSample(sample) {
  const all = loadSamples();
  all.push(sample);
  saveSamples(all);
}

export function removeSample(id) {
  const all = loadSamples().filter(s => s.id !== id);
  saveSamples(all);
}

export function updateSample(id, updates) {
  const all = loadSamples().map(s => s.id === id ? { ...s, ...updates } : s);
  saveSamples(all);
}