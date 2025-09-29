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
    
    // Fix: Ensure we're comparing strings and handle null/undefined values
    const entries = Array.from(m.entries()).sort((a, b) => {
      const dateA = a[0] || 'NA';
      const dateB = b[0] || 'NA';
      
      // Convert to string and compare
      return String(dateA).localeCompare(String(dateB));
    });
    
    return entries.map(([date, arr]) => ({
      date,
      // FIX: Changed HPI to HMPI to match the actual property name
      avgHMPI: Math.round(arr.reduce((acc, s) => acc + computeAllIndices(s).HMPI, 0) / arr.length)
    }));
  }, [samples]);

  const chartData = {
    labels: byDate.map(d => d.date),
    datasets: [{
      type: 'bar',
      label: 'Avg HMPI',
      // FIX: Changed avgHPI to avgHMPI
      data: byDate.map(d => d.avgHMPI),
      backgroundColor: 'rgba(99,102,241,0.5)'
    }]
  };

  const markers = samples
    .filter(s => s.lat && s.lng)
    .map(s => ({ 
      lat: s.lat, 
      lng: s.lng, 
      // FIX: Use HMPI instead of HPI
      HMPI: computeAllIndices(s).HMPI, 
      name: s.location || s.id 
    }));

  return h('div', { className: 'container-fluid' },
    h('div', { className: 'row g-3' },
      h('div', { className: 'col-12 col-xl-7' },
        h(Card, { title: 'Historical Trend (Avg by Date)' },
          h(ChartCanvas, { 
            type: 'bar', 
            data: chartData, 
            options: { 
              scales: { 
                x: { 
                  ticks: { color: '#94a3b8' } 
                }, 
                y: { 
                  ticks: { color: '#94a3b8' } 
                } 
              } 
            } 
          })
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