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
  const sampleWithDefaults = {
    id: sample.id || `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: sample.timestamp || new Date().toISOString(),
    location: sample.location || 'Unknown Location',
    ...sample
  };
  all.push(sampleWithDefaults);
  saveSamples(all);
  return sampleWithDefaults;
}

export function removeSample(id) {
  const all = loadSamples().filter(s => s.id !== id);
  saveSamples(all);
}

export function getSampleById(id) {
  return loadSamples().find(s => s.id === id);
}

export function clearAllSamples() {
  localStorage.removeItem(KEY);
}