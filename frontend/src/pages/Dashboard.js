// Dashboard.js
import React, { useMemo } from 'react';
import Card from '../components/Card';
import LeafletMap from '../components/LeafletMap';
import { loadSamples } from '../utils/storage';
import { computeAllIndices } from '../utils/hmpi';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const samples = loadSamples();

  // Compute basic metrics
  const metrics = useMemo(() => {
    if (!samples.length) return { count: 0, unsafe: 0, avgHMPI: 0, safe: 0 };
    const indices = samples.map(s => computeAllIndices(s));
    const avgHMPI = Math.round(indices.reduce((a, i) => a + (i.HMPI || 0), 0) / samples.length);
    
    const safe = indices.filter(i => (i.HMPI || 0) < 100).length;
    const moderate = indices.filter(i => (i.HMPI || 0) >= 100 && (i.HMPI || 0) < 200).length;
    const critical = indices.filter(i => (i.HMPI || 0) >= 200).length;
    
    return { 
      count: samples.length, 
      safe, 
      moderate, 
      critical,
      avgHMPI 
    };
  }, [samples]);

  // Line chart data
  const lineChartData = useMemo(() => {
    if (!samples.length) return { labels: [], datasets: [] };
    
    const sortedSamples = [...samples]
      .sort((a, b) => new Date(a.date || a.timestamp || a.id) - new Date(b.date || b.timestamp || b.id))
      .slice(-12);
    
    const labels = sortedSamples.map(s => {
      if (s.date) return s.date;
      if (s.timestamp) return new Date(s.timestamp).toLocaleDateString();
      return 'Sample';
    });
    
    const values = sortedSamples.map(s => computeAllIndices(s).HMPI || 0);
    
    return {
      labels,
      datasets: [{
        label: 'HMPI Trend',
        data: values,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34,211,238,0.2)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#22d3ee',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    };
  }, [samples]);

  // Pie chart data
  const pieChartData = useMemo(() => {
    return {
      labels: ['Safe (HMPI < 100)', 'Moderate (100-200)', 'Critical (HMPI ≥ 200)'],
      datasets: [{
        data: [metrics.safe, metrics.moderate, metrics.critical],
        backgroundColor: ['#059669', '#fbbf24', '#ef4444'],
        borderColor: ['#059669', '#d97706', '#dc2626'],
        borderWidth: 2
      }]
    };
  }, [metrics]);

  // Map markers
  const markers = useMemo(() => {
    return samples
      .filter(s => {
        const lat = parseFloat(s.lat);
        const lng = parseFloat(s.lng);
        return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      })
      .map(s => {
        const indices = computeAllIndices(s);
        const hmpiValue = indices.HMPI || 0;
        
        let color = 'green';
        if (hmpiValue >= 200) color = 'red';
        else if (hmpiValue >= 100) color = 'orange';
        
        return { 
          lat: parseFloat(s.lat), 
          lng: parseFloat(s.lng), 
          HMPI: hmpiValue, 
          name: s.location || s.id || 'Unknown Location',
          color: color
        };
      });
  }, [samples]);

  // Fallback content when no data
  if (samples.length === 0) {
    return (
      <div className="container-fluid">
        <div className="row g-3">
          <div className="col-12">
            <Card title="Dashboard">
              <div className="text-center text-muted py-5">
                <i className="bi bi-database display-4"></i>
                <h4 className="mt-3">No Data Available</h4>
                <p>Analyze some water samples to see dashboard metrics and charts.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* KPI Cards */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-md-3">
          <Card title="Total Samples" className="h-100">
            <div className="kpi-value display-6 fw-bold text-primary">{metrics.count}</div>
            <small className="text-muted">Samples analyzed</small>
          </Card>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <Card title="Avg HMPI" className="h-100">
            <div className="kpi-value display-6 fw-bold text-info">{metrics.avgHMPI}</div>
            <small className="text-muted">Average pollution index</small>
          </Card>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <Card title="Safe Samples" className="h-100">
            <div className="kpi-value display-6 fw-bold text-success">{metrics.safe}</div>
            <small className="text-muted">HMPI &lt; 100</small>
          </Card>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <Card title="Critical Samples" className="h-100">
            <div className="kpi-value display-6 fw-bold text-danger">{metrics.critical}</div>
            <small className="text-muted">HMPI ≥ 200</small>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3 mt-3">
        {/* Line Chart */}
        <div className="col-12 col-xl-6">
          <Card title="Recent HMPI Trend" className="h-100">
            <div className="chart-container">
              {lineChartData.labels.length > 0 ? (
                <Line
                  data={lineChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                      legend: { 
                        display: true,
                        position: 'top',
                        labels: { 
                          color: '#cbd5e1',
                          font: { size: 12 }
                        } 
                      },
                      tooltip: { 
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff'
                      },
                      title: { 
                        display: true, 
                        text: 'HMPI Trend Over Recent Samples',
                        color: '#cbd5e1',
                        font: { size: 16 }
                      }
                    },
                    scales: {
                      x: { 
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                      },
                      y: { 
                        beginAtZero: true,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        title: {
                          display: true,
                          text: 'HMPI Value',
                          color: '#94a3b8'
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-graph-up display-4"></i>
                  <p>No trend data available</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Pie Chart */}
        <div className="col-12 col-xl-6">
          <Card title="Sample Safety Distribution" className="h-100">
            <div className="chart-container">
              {metrics.count > 0 ? (
                <Pie
                  data={pieChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'bottom', 
                        labels: { 
                          color: '#cbd5e1', 
                          boxWidth: 15,
                          font: { size: 11 }
                        } 
                      },
                      tooltip: { 
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff'
                      },
                      title: { 
                        display: true, 
                        text: 'Water Quality Distribution',
                        color: '#cbd5e1',
                        font: { size: 16 }
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-pie-chart display-4"></i>
                  <p>No distribution data available</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Map */}
      <div className="row g-3 mt-3">
        <div className="col-12">
          <Card title="Geographical Distribution">
            <div style={{ height: '400px', position: 'relative' }}>
              {markers.length > 0 ? (
                <LeafletMap markers={markers} />
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-map display-4"></i>
                  <h5>No Geographical Data</h5>
                  <p>Add location coordinates to samples to see them on the map</p>
                </div>
              )}
            </div>
            {markers.length > 0 && (
              <div className="mt-3">
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <span className="badge bg-success">Safe (HMPI &lt; 100)</span>
                  <span className="badge bg-warning">Moderate (100-200)</span>
                  <span className="badge bg-danger">Critical (HMPI ≥ 200)</span>
                </div>
                <small className="text-muted d-block text-center mt-2">
                  {markers.length} samples with location data
                </small>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}