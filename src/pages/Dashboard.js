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
    if (!samples.length) return { count: 0, unsafe: 0, avgHPI: 0 };
    const indices = samples.map(s => computeAllIndices(s));
    const avgHPI = Math.round(indices.reduce((a, i) => a + (i.HPI || 0), 0) / samples.length);
    const unsafe = indices.filter(i => i.HPI >= 75).length;
    return { count: samples.length, unsafe, avgHPI };
  }, [samples]);

  // Line chart data
  const lineChartData = useMemo(() => {
    if (!samples.length) return { labels: [], datasets: [] };
    const labels = samples.slice(-12).map(s => s.date || s.id);
    const values = samples.slice(-12).map(s => computeAllIndices(s).HPI || 0);
    return {
      labels,
      datasets: [{
        label: 'HPI (last entries)',
        data: values,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34,211,238,0.2)',
        tension: 0.35,
        fill: true
      }]
    };
  }, [samples]);

  // Pie chart data
  const pieChartData = useMemo(() => {
    const unsafeCount = metrics.unsafe;
    const safeCount = metrics.count - unsafeCount;
    return {
      labels: ['Safe Samples', 'Unsafe Samples (HPI ≥ 75)'],
      datasets: [{
        data: [safeCount, unsafeCount],
        backgroundColor: ['#34d399', '#f87171'],
        borderColor: ['#059669', '#b91c1c'],
        borderWidth: 1
      }]
    };
  }, [metrics]);

  // Map markers
  const markers = useMemo(() => samples
    .filter(s => s.lat && s.lng)
    .map(s => ({ lat: s.lat, lng: s.lng, HPI: computeAllIndices(s).HPI, name: s.location || s.id })),
    [samples]
  );

  return (
    <div className="container-fluid">
      {/* KPI Cards */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <Card title="Total Samples">
            <div className="kpi-value">{metrics.count}</div>
          </Card>
        </div>
        <div className="col-12 col-md-4">
          <Card title="Avg HMPI">
            <div className="kpi-value">{metrics.avgHPI}</div>
          </Card>
        </div>
        <div className="col-12 col-md-4">
          <Card title="Unsafe Samples (HMPI ≥ 75)">
            <div className="kpi-value text-danger">{metrics.unsafe}</div>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3 mt-3">
        {/* Line Chart */}
        <div className="col-12 col-xl-6">
          <Card title="Recent HMPI Trend">
            <div style={{ height: '350px' }}>
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: {
                    legend: { labels: { color: '#cbd5e1', onClick: null } },
                    tooltip: { enabled: true },
                    title: { display: true, text: 'HPI Trend' }
                  },
                  scales: {
                    x: { ticks: { color: '#94a3b8' } },
                    y: { ticks: { color: '#94a3b8' } }
                  }
                }}
              />
            </div>
          </Card>
        </div>

        {/* Pie Chart */}
        <div className="col-12 col-xl-6">
          <Card title="Sample Safety Distribution">
            <div style={{ height: '350px' }}>
              <Pie
                data={pieChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { color: '#cbd5e1', boxWidth: 20 } },
                    tooltip: { enabled: true },
                    title: { display: true, text: 'Safe vs Unsafe Samples' }
                  }
                }}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Map */}
      <div className="row g-3 mt-3">
        <div className="col-12">
          <Card title="Geographical Distribution">
            <LeafletMap markers={markers} />
          </Card>
        </div>
      </div>
    </div>
  );
}
