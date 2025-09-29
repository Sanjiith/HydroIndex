import React, { useState, useMemo } from 'react';
import Card, { MetricCard } from '../components/Card'; // Fixed import path
import { computeAllIndices, computeContaminationFactors } from '../utils/hmpi'; // Fixed function name
import { addSample } from '../utils/storage';
import { analyzeSingleSample } from '../utils/api';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const h = React.createElement;

const metals = ['As', 'Pb', 'Cd', 'Cr', 'Hg', 'Ni', 'Cu', 'Zn', 'Fe', 'Mn'];
const metalLabels = {
  As: 'Arsenic (mg/L)',
  Pb: 'Lead (mg/L)', 
  Cd: 'Cadmium (mg/L)',
  Cr: 'Chromium (mg/L)',
  Hg: 'Mercury (mg/L)',
  Ni: 'Nickel (mg/L)',
  Cu: 'Copper (mg/L)',
  Zn: 'Zinc (mg/L)',
  Fe: 'Iron (mg/L)',
  Mn: 'Manganese (mg/L)'
};

export default function SingleSample() {
  const [form, setForm] = useState(() => {
    const obj = { 
      location: '', 
      lat: '', 
      lng: '', 
      date: new Date().toISOString().slice(0,10) 
    };
    metals.forEach(m => { obj[m] = ''; });
    return obj;
  });

  const [backendResult, setBackendResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableData = useMemo(() => {
    const data = {
      location: form.location,
      lat: Number(form.lat || 0),
      lng: Number(form.lng || 0),
      date: form.date
    };
    
    metals.forEach(metal => {
      const value = form[metal];
      data[metal] = value && value !== '' ? Number(value) : 0;
    });
    
    return data;
  }, [form]);

 const indices = useMemo(() => computeAllIndices(availableData), [availableData]);
 const contaminationFactors = useMemo(() => computeContaminationFactors(availableData), [availableData]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  }

  async function onSave() {
  if (!form.location.trim()) {
    setError('Please enter location details');
    return;
  }

  const hasMetalData = metals.some(m => form[m] && form[m] !== '');
  if (!hasMetalData) {
    setError('Please enter at least one metal concentration');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const frontendSample = {
      ...availableData,
      ...indices,
      contaminationFactors,
      source: 'frontend',
      timestamp: new Date().toISOString()
    };
    
    addSample(frontendSample);

    // Test backend connection first
    try {
      console.log('Testing backend connection...');
      const testResponse = await fetch('http://localhost:8000/');
      if (!testResponse.ok) {
        throw new Error('Backend not responding');
      }
      console.log('Backend is running, proceeding with analysis...');
    } catch (testError) {
      console.warn('Backend not available:', testError.message);
      setError('Backend server not running. Sample saved with frontend calculation.');
      alert('✓ Sample analyzed with frontend calculation (backend unavailable)');
      setLoading(false);
      return;
    }

    // Backend is running, proceed with analysis
    const backendResponse = await analyzeSingleSample(form);
    setBackendResult(backendResponse);

    if (backendResponse.sample_id) {
      const backendSample = {
        ...availableData,
        hmpi_score: backendResponse.analysis_results?.hmpi?.score || 0,
        pli_score: backendResponse.analysis_results?.pli?.score || 0,
        pollution_level: backendResponse.analysis_results?.hmpi?.level || 'Unknown',
        source: 'backend',
        id: backendResponse.sample_id,
        timestamp: backendResponse.timestamp
      };
      addSample(backendSample);
    }

    alert('Sample analyzed successfully with backend!');
  } catch (error) {
    console.error('Error:', error);
    setError('Backend connection failed. Sample saved with frontend calculation.');
  } finally {
    setLoading(false);
  }
}

  const chartData = useMemo(() => {
    const availableMetals = metals.filter(m => form[m] && form[m] !== '');
    const values = availableMetals.map(m => Number(form[m]));
    
    const colors = [
      'rgba(14, 165, 168, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(234, 179, 8, 0.7)',
      'rgba(239, 68, 68, 0.7)', 'rgba(168, 85, 247, 0.7)', 'rgba(16, 185, 129, 0.7)',
      'rgba(249, 115, 22, 0.7)'
    ];

    return {
      labels: availableMetals.map(m => metalLabels[m].split(' ')[0]),
      datasets: [
        {
          label: 'Concentration (mg/L)',
          data: values,
          backgroundColor: availableMetals.map((_, i) => colors[i % colors.length]),
          borderColor: availableMetals.map((_, i) => colors[i % colors.length].replace('0.7', '1')),
          borderWidth: 2,
        }
      ]
    };
  }, [form]);

  function BackendResultCard() {
    if (!backendResult) return null;
    
    const analysis = backendResult.analysis_results || {};
    
    return h(Card, { 
      title: 'Backend Analysis Results',
      variant: 'info'
    },
      h('div', { className: 'row g-3' },
        h('div', { className: 'col-12 col-md-4' },
          h(MetricCard, {
            title: 'HMPI Score',
            value: analysis.hmpi?.score?.toFixed(2) || '0.00',
            subtitle: analysis.hmpi?.level || 'Unknown',
            badge: { 
              text: analysis.hmpi?.level || 'Unknown', 
              color: analysis.hmpi?.level === 'Safe' ? 'success' : 
                     analysis.hmpi?.level === 'Moderate' ? 'warning' : 'danger' 
            }
          })
        ),
        h('div', { className: 'col-12 col-md-4' },
          h(MetricCard, {
            title: 'PLI Score',
            value: analysis.pli?.score?.toFixed(2) || '0.00',
            subtitle: analysis.pli?.level || 'Unknown',
            badge: { 
              text: analysis.pli?.level || 'Unknown', 
              color: analysis.pli?.level === 'Low' ? 'success' : 
                     analysis.pli?.level === 'Moderate' ? 'warning' : 'danger' 
            }
          })
        ),
        h('div', { className: 'col-12 col-md-4' },
          h(MetricCard, {
            title: 'Sample Info',
            value: '',
            subtitle: `ID: ${backendResult.sample_id || 'N/A'}`,
            badge: { 
              text: 'Backend', 
              color: 'info' 
            }
          })
        )
      ),
      
      analysis.contamination_factors && h('div', { className: 'mt-3' },
        h('h6', null, 'Contamination Factors:'),
        h('div', { className: 'table-responsive' },
          h('table', { className: 'table table-sm table-dark' },
            h('thead', null,
              h('tr', null,
                h('th', null, 'Metal'),
                h('th', null, 'CF Value'),
                h('th', null, 'Level')
              )
            ),
            h('tbody', null,
              Object.entries(analysis.contamination_factors).map(([metal, data]) =>
                h('tr', { key: metal },
                  h('td', null, metal.charAt(0).toUpperCase() + metal.slice(1)),
                  h('td', null, data.cf_value?.toFixed(3) || '0.000'),
                  h('td', null, 
                    h('span', { className: 'badge bg-secondary' }, data.level || 'Unknown')
                  )
                )
              )
            )
          )
        )
      )
    );
  }

  const hasMetalData = metals.some(m => form[m] && form[m] !== '');

  return h('div', { className: 'container-fluid' },
    error && h('div', { className: 'alert alert-danger alert-dismissible fade show' },
      h('strong', null, 'Error: '), error,
      h('button', { 
        type: 'button', 
        className: 'btn-close', 
        onClick: () => setError('') 
      })
    ),

    h('div', { className: 'row g-3' },
      h('div', { className: 'col-12 col-xl-6' },
        h(Card, { 
          title: 'Water Sample Analysis',
          variant: 'dark'
        },
          h('div', { className: 'row g-3' },
            h('div', { className: 'col-12' },
              h('label', { className: 'form-label' }, 'Location *'),
              h('input', { 
                name: 'location', 
                value: form.location, 
                onChange, 
                className: 'form-control', 
                placeholder: 'Enter location name',
                required: true 
              })
            ),
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label' }, 'Latitude'),
              h('input', { 
                name: 'lat', 
                value: form.lat, 
                onChange, 
                className: 'form-control', 
                placeholder: 'e.g., 12.97',
                type: 'number',
                step: '0.0001'
              })
            ),
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label' }, 'Longitude'),
              h('input', { 
                name: 'lng', 
                value: form.lng, 
                onChange, 
                className: 'form-control', 
                placeholder: 'e.g., 77.59',
                type: 'number',
                step: '0.0001'
              })
            ),
            h('div', { className: 'col-12' },
              h('label', { className: 'form-label' }, 'Sample Date'),
              h('input', { 
                type: 'date', 
                name: 'date', 
                value: form.date, 
                onChange, 
                className: 'form-control' 
              })
            )
          ),
          
          h('hr', null),
          
          h('h5', null, 'Metal Concentrations (mg/L)'),
          h('div', { className: 'row g-2' },
            metals.map((m) =>
              h('div', { key: m, className: 'col-6 col-md-4' },
                h('label', { className: 'form-label small' }, metalLabels[m]),
                h('input', { 
                  className: 'form-control form-control-sm', 
                  placeholder: '0.000', 
                  name: m, 
                  value: form[m], 
                  onChange,
                  type: 'number',
                  step: '0.0001',
                  min: '0'
                })
              )
            )
          ),
        )
      ),

      h('div', { className: 'col-12 col-xl-6' },
        h('div', { className: 'row g-3' },
          h('div', { className: 'col-12' }, 
            h(MetricCard, { 
              title: 'Heavy Metal Pollution Index (HMPI)', 
              value: indices.HMPI?.toFixed(2), 
              subtitle: 'Overall pollution assessment',
              badge: { 
                text: indices.HMPI_Class?.label, 
                color: indices.HMPI_Class?.badge 
              }
            })
          ),
          h('div', { className: 'col-12 col-md-6' }, 
            h(MetricCard, { 
              title: 'Pollution Load Index (PLI)', 
              value: indices.PLI?.toFixed(2), 
              subtitle: 'Pollution intensity',
              badge: { 
                text: indices.PLI_Class?.label, 
                color: indices.PLI_Class?.badge 
              }
            })
          ),
          h('div', { className: 'col-12 col-md-6' }, 
            h(MetricCard, { 
              title: 'Contamination Factor (CF)', 
              value: indices.CF?.toFixed(2), 
              subtitle: 'Total contamination level',
              badge: { 
                text: indices.CF_Class?.label, 
                color: indices.CF_Class?.badge 
              }
            })
          )
        )
      )
    ),

    h(BackendResultCard),

    hasMetalData && h('div', { className: 'row g-3 mt-3' },
      h('div', { className: 'col-12' },
        h(Card, { 
          title: 'Metal Concentration Visualization',
          variant: 'dark'
        },
          h(Bar, {
            data: chartData,
            options: {
              responsive: true,
              plugins: {
                legend: { display: true, labels: { color: 'white' } },
                title: { display: true, text: 'Metal Concentrations', color: 'white' },
              },
              scales: {
                x: { 
                  ticks: { color: 'white' }, 
                  grid: { color: 'rgba(255,255,255,0.1)' } 
                },
                y: { 
                  beginAtZero: true, 
                  ticks: { color: 'white' }, 
                  grid: { color: 'rgba(255,255,255,0.1)' },
                  title: { display: true, text: 'Concentration (mg/L)', color: 'white' }
                }
              }
            }
          })
        )
      )
    )
  );
}