import React, { useMemo } from 'react';
import Card from '../components/Card';
import ChartCanvas from '../components/ChartCanvas';
import LeafletMap from '../components/LeafletMap';
import { loadSamples } from '../utils/storage';
import { computeAllIndices } from '../utils/hmpi';

const h = React.createElement;

export default function Historical() {
  const samples = loadSamples();

  const byDate = useMemo(() => {
    const m = new Map();
    samples.forEach((s) => {
      const d = s.date || 'NA';
      if (!m.has(d)) m.set(d, []);
      m.get(d).push(s);
    });
    const entries = Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return entries.map(([date, arr]) => ({
      date,
      avgHPI: Math.round(arr.reduce((acc, s) => acc + computeAllIndices(s).HPI, 0) / arr.length)
    }));
  }, [samples]);

  const chartData = {
    labels: byDate.map(d => d.date),
    datasets: [{
      type: 'bar',
      label: 'Avg HMPI',
      data: byDate.map(d => d.avgHPI),
      backgroundColor: 'rgba(99,102,241,0.5)'
    }]
  };

  const markers = samples
    .filter(s => s.lat && s.lng)
    .map(s => ({ lat: s.lat, lng: s.lng, HPI: computeAllIndices(s).HPI, name: s.location || s.id }));

  return h('div', { className: 'container-fluid' },
    h('div', { className: 'row g-3' },
      h('div', { className: 'col-12 col-xl-7' },
        h(Card, { title: 'Historical Trend (Avg by Date)' },
          h(ChartCanvas, { type: 'bar', data: chartData, options: { scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } } })
        )
      ),
      h('div', { className: 'col-12 col-xl-5' },
        h(Card, { title: 'Map Overview' },
          h(LeafletMap, { markers })
        )
      )
    )
  );
}