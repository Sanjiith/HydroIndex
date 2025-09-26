import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { computeAllIndices } from '../utils/hmpi';
import { addSample } from '../utils/storage';
import { METAL_STANDARDS_MG_L } from '../utils/constants';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const h = React.createElement;
const metals = Object.keys(METAL_STANDARDS_MG_L);

export default function SingleSample() {
  const [form, setForm] = useState(() => {
    const obj = { id: String(Date.now()), location: '', lat: '', lng: '', date: new Date().toISOString().slice(0,10) };
    metals.forEach(m => { obj[m] = ''; });
    return obj;
  });

  function sanitize(input) {
    const copy = { ...input };
    metals.forEach(m => { copy[m] = Number(copy[m] || 0); });
    copy.lat = Number(copy.lat || 0);
    copy.lng = Number(copy.lng || 0);
    return copy;
  }

  const indices = useMemo(() => computeAllIndices(sanitize(form)), [form]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function onSave() {
    addSample(sanitize(form));
    alert('Sample saved');
  }

  // Real-time Bar chart data (metal concentrations) with visible colors
  const barChartData = useMemo(() => {
    const colors = [
      'rgba(14, 165, 168, 0.7)',  // teal
      'rgba(59, 130, 246, 0.7)',  // blue
      'rgba(234, 179, 8, 0.7)',   // yellow
      'rgba(239, 68, 68, 0.7)',   // red
      'rgba(168, 85, 247, 0.7)',  // purple
      'rgba(16, 185, 129, 0.7)',  // green
      'rgba(249, 115, 22, 0.7)',  // orange
    ];

    return {
      labels: metals,
      datasets: [
        {
          label: 'Metal Concentration (mg/L)',
          data: metals.map(m => Number(form[m] || 0)),
          backgroundColor: metals.map((_, i) => colors[i % colors.length]),
          borderColor: metals.map((_, i) => colors[i % colors.length].replace('0.7', '1')),
          borderWidth: 1,
        }
      ]
    };
  }, [form]);

  function MetricCard({ title, value, clsObj }) {
    return h(Card, { title },
      h('div', { className: 'd-flex align-items-center justify-content-between' },
        h('div', null, h('div', { className: 'h3 mb-1' }, String(value)), h('div', { className: 'small text-muted' }, `Status: ${clsObj.label}`)),
        h('div', null, h('span', { className: `badge text-bg-${clsObj.badge} p-2` }, clsObj.label))
      )
    );
  }

  return h('div', { className: 'container-fluid' },
    h('div', { className: 'row g-3' },
      // Sample form (left)
      h('div', { className: 'col-12 col-xl-6' },
        h(Card, { title: 'Sample Details' },
          h('div', { className: 'row g-2' },
            h('div', { className: 'col-12 col-md-6' },
              h('label', { className: 'form-label' }, 'Location'),
              h('input', { name: 'location', value: form.location, onChange, className: 'form-control', placeholder: 'City / Site' })
            ),
            h('div', { className: 'col-6 col-md-3' },
              h('label', { className: 'form-label' }, 'Latitude'),
              h('input', { name: 'lat', value: form.lat, onChange, className: 'form-control', placeholder: 'e.g., 12.97' })
            ),
            h('div', { className: 'col-6 col-md-3' },
              h('label', { className: 'form-label' }, 'Longitude'),
              h('input', { name: 'lng', value: form.lng, onChange, className: 'form-control', placeholder: 'e.g., 77.59' })
            ),
            h('div', { className: 'col-12 col-md-4' },
              h('label', { className: 'form-label' }, 'Date'),
              h('input', { type: 'date', name: 'date', value: form.date, onChange, className: 'form-control' })
            )
          ),
          h('hr', null),
          h('div', { className: 'row g-2' },
            ...metals.map((m) =>
              h('div', { key: m, className: 'col-6 col-md-4' },
                h('label', { className: 'form-label' }, `${m} (mg/L)`),
                h('input', { className: 'form-control', placeholder: '0.000', name: m, value: form[m], onChange })
              )
            )
          ),
          h('div', { className: 'mt-3 d-flex gap-2' },
            h('button', { className: 'btn btn-brand', onClick: onSave }, h('i', { className: 'bi bi-save' }), ' Analyze Sample')
          )
        )
      ),

      // Computed indices (right)
      h('div', { className: 'col-12 col-xl-6' },
        h('div', { className: 'row g-3' },
          h('div', { className: 'col-12' }, h(MetricCard, { title: 'Heavy-Metal Pollution Index (HMPI)', value: indices.HPI, clsObj: indices.HPI_Class })),
          h('div', { className: 'col-12' }, h(MetricCard, { title: 'Pollution Level Index(PLI)', value: indices.HEI, clsObj: indices.HEI_Class })),
          h('div', { className: 'col-12' }, h(MetricCard, { title: 'Contamination Factor (CF)', value: indices.Cd, clsObj: indices.Cd_Class }))
        )
      )
    ),

    // Real-time Bar chart
    h('div', { className: 'row g-3 mt-3' },
      h('div', { className: 'col-12' },
        h(Card, { title: 'Real-time Visualization' },
          h(Bar, {
            data: barChartData,
            options: {
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: true, text: 'Metal Concentration (mg/L)', color: 'white' },
              },
              scales: {
                x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { beginAtZero: true, ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
              }
            }
          })
        )
      )
    )
  );
}
