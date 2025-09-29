import React, { useState } from 'react';
import Card, { StatsCard } from '../components/Card';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { computeAllIndices } from '../utils/hmpi';
import { addSample } from '../utils/storage';
import { analyzeBatchSamples } from '../utils/api';

const h = React.createElement;

const expectedMetals = ['As', 'Pb', 'Cd', 'Cr', 'Hg', 'Ni', 'Cu', 'Zn', 'Fe', 'Mn'];
const metalDisplayNames = {
  As: 'Arsenic',
  Pb: 'Lead', 
  Cd: 'Cadmium',
  Cr: 'Chromium',
  Hg: 'Mercury',
  Ni: 'Nickel',
  Cu: 'Copper',
  Zn: 'Zinc',
  Fe: 'Iron',
  Mn: 'Manganese'
};

export default function BatchProcessing() {
  const [rows, setRows] = useState([]);
  const [computedRows, setComputedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function normalizeColumnName(colName) {
    if (!colName) return '';
    
    const name = colName.toString().toLowerCase().trim();
    const cleanName = name.replace(/\([^)]*\)/g, '').trim();
    
    const nameMapping = {
      'as': 'As', 'arsenic': 'As', 'ars': 'As',
      'pb': 'Pb', 'lead': 'Pb', 
      'cd': 'Cd', 'cadmium': 'Cd', 
      'cr': 'Cr', 'chromium': 'Cr',
      'hg': 'Hg', 'mercury': 'Hg',
      'ni': 'Ni', 'nickel': 'Ni',
      'cu': 'Cu', 'copper': 'Cu',
      'zn': 'Zn', 'zinc': 'Zn',
      'fe': 'Fe', 'iron': 'Fe',
      'mn': 'Mn', 'manganese': 'Mn',
      'latitude': 'lat', 'lat': 'lat',
      'longitude': 'lng', 'long': 'lng', 'lng': 'lng',
      'location_name': 'location', 'location': 'location',
      'sample_id': 'id', 'id': 'id'
    };
    
    return nameMapping[cleanName] || cleanName;
  }

  function parseCSV(file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors.length > 0) {
          setError('Error parsing CSV: ' + res.errors[0].message);
          return;
        }
        
        const normalizedData = res.data.map((row, index) => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = normalizeColumnName(key);
            newRow[normalizedKey] = row[key];
          });
          newRow.id = newRow.id || `row_${index + 1}`;
          return newRow;
        });
        
        setRows(normalizedData);
        setError('');
      },
      error: (error) => {
        setError('CSV parsing error: ' + error.message);
      }
    });
  }

  function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const normalizedData = data.map((row, index) => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = normalizeColumnName(key);
            newRow[normalizedKey] = row[key];
          });
          newRow.id = newRow.id || `row_${index + 1}`;
          return newRow;
        });
        
        setRows(normalizedData);
        setError('');
      } catch (err) {
        setError('Excel parsing error: ' + err.message);
      }
    };
    reader.onerror = () => setError('Error reading Excel file');
    reader.readAsArrayBuffer(file);
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setRows([]);
    setComputedRows([]);
    setError('');
    
    if (file.name.endsWith('.csv')) parseCSV(file);
    else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) parseExcel(file);
    else setError('Please upload a CSV or Excel file');
  }

  function prepareRowForCalculation(row) {
    const preparedRow = {
      id: row.id || row.sample_id || `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      location: row.location || row.location_name || 'Unknown Location',
      lat: parseFloat(row.lat || row.latitude || 0),
      lng: parseFloat(row.lng || row.longitude || 0),
      date: row.date || new Date().toISOString().slice(0,10)
    };
    
    expectedMetals.forEach(metal => {
      const value = row[metal];
      preparedRow[metal] = (value !== undefined && value !== null && value !== '') ? 
        parseFloat(value) : 0;
    });
    
    return preparedRow;
  }

  async function analyzeSamples() {
    if (rows.length === 0) {
      setError('Please upload a file first');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const computed = rows.map((row) => {
        const preparedRow = prepareRowForCalculation(row);
        const indices = computeAllIndices(preparedRow);
        return { 
          ...preparedRow, 
          ...indices,
          timestamp: new Date().toISOString()
        };
      });
      
      setComputedRows(computed);
      computed.forEach((sample) => addSample(sample));

      // REMOVED: Backend analysis call to avoid the summary card
      // const fileInput = document.querySelector('input[type="file"]');
      // if (fileInput && fileInput.files.length > 0) {
      //   try {
      //     const backendResponse = await analyzeBatchSamples(fileInput.files[0]);
      //     setBackendResults(backendResponse);
      //   } catch (backendError) {
      //     console.warn('Backend analysis failed:', backendError);
      //   }
      // }

      alert(`Successfully analyzed ${computed.length} samples`);
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Error analyzing samples: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    if (!computedRows.length) {
      setError('Please analyze samples first');
      return;
    }
    
    const csvData = computedRows.map(r => ({
      'Sample ID': r.id,
      'Location': r.location,
      'Latitude': r.lat,
      'Longitude': r.lng,
      'Date': r.date,
      'HMPI': r.HMPI?.toFixed(2) || '0.00',
      'PLI': r.PLI?.toFixed(2) || '0.00',
      'CF': r.CF?.toFixed(2) || '0.00',
      'HMPI Status': r.HMPI_Class?.label || 'Unknown',
      'PLI Status': r.PLI_Class?.label || 'Unknown',
      'CF Status': r.CF_Class?.label || 'Unknown',
      ...Object.fromEntries(expectedMetals.map(metal => [
        metalDisplayNames[metal] || metal, 
        r[metal]?.toFixed(6) || '0.000000'
      ]))
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `water_quality_analysis_${new Date().toISOString().slice(0,10)}.csv`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadPDF() {
    if (!computedRows.length) {
      setError('Please analyze samples first');
      return;
    }
    
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Water Quality Analysis Report', 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
    
    const safeCount = computedRows.filter(r => r.HMPI_Class?.label === 'Safe').length;
    const moderateCount = computedRows.filter(r => r.HMPI_Class?.label === 'Moderate').length;
    const criticalCount = computedRows.filter(r => r.HMPI_Class?.label === 'Critical').length;
    
    const summaryData = [
      ['Total Samples', computedRows.length],
      ['Average HMPI', (computedRows.reduce((sum, r) => sum + (r.HMPI || 0), 0) / computedRows.length).toFixed(2)],
      ['Safe Samples', safeCount],
      ['Moderate Samples', moderateCount],
      ['Critical Samples', criticalCount]
    ];
    
    doc.autoTable({
      startY: 40,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    doc.save(`water_quality_report_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  const displayRows = computedRows.length > 0 ? computedRows : rows;
  const availableMetals = expectedMetals.filter(metal => 
    displayRows.some(row => row[metal] !== undefined && row[metal] !== null && row[metal] !== '')
  );

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
      h('div', { className: 'col-12' },
        h(Card, { 
          title: 'Batch File Processing',
          variant: 'dark'
        },
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label' }, 'Upload CSV or Excel File'),
            h('input', { 
              type: 'file', 
              className: 'form-control', 
              accept: '.csv,.xlsx,.xls', 
              onChange: onFile 
            }),
            h('div', { className: 'form-text' }, 
              'Supported metals: ' + expectedMetals.map(m => metalDisplayNames[m] || m).join(', ')
            )
          ),
          
          h('div', { className: 'mt-3' },
            h('button', { 
              className: `btn btn-success ${loading ? 'disabled' : ''}`, 
              onClick: analyzeSamples,
              disabled: loading || rows.length === 0
            }, 
              loading ? [
                h('span', { className: 'spinner-border spinner-border-sm me-2', key: 'spinner' }),
                ` Analyzing ${rows.length} Samples...`
              ] : [
                h('i', { className: 'bi bi-calculator me-2', key: 'icon' }),
                ` Analyze ${rows.length} Samples`
              ]
            )
          ),
          
          rows.length > 0 && h('div', { className: 'mt-2 text-info' },
            h('small', null, 
              `Loaded ${rows.length} sample(s) with ${availableMetals.length} metal types`
            )
          )
        )
      ),

      // REMOVED: BackendSummaryCard component entirely

      h('div', { className: 'col-12' },
        h(Card, { 
          title: `Analysis Results (${displayRows.length} samples)`,
          variant: 'dark'
        },
          rows.length === 0 ? 
            h('div', { className: 'text-center text-muted py-4' },
              h('i', { className: 'bi bi-upload display-4' }),
              h('p', { className: 'mt-2' }, 'Upload a CSV or Excel file to begin analysis')
            ) :
            h('div', { className: 'table-responsive', style: { maxHeight: '500px' } },
              h('table', { className: 'table table-dark table-striped table-sm align-middle' },
                h('thead', { className: 'sticky-top' },
                  h('tr', null,
                    ['ID', 'Location', 'HMPI', 'PLI', 'CF', 'Status'].map(k => 
                      h('th', { key: k }, k)
                    )
                  )
                ),
                h('tbody', null,
                  displayRows.slice(0, 50).map((r, idx) =>
                    h('tr', { key: idx },
                      h('td', null, r.id?.substring(0, 10) + '...'),
                      h('td', null, r.location?.substring(0, 15) + (r.location?.length > 15 ? '...' : '')),
                      h('td', null, r.HMPI?.toFixed(2) || '0.00'),
                      h('td', null, r.PLI?.toFixed(2) || '0.00'),
                      h('td', null, r.CF?.toFixed(2) || '0.00'),
                      h('td', null, 
                        h('span', { className: `badge bg-${r.HMPI_Class?.badge || 'secondary'}` }, 
                          r.HMPI_Class?.label || 'Unknown')
                      )
                    )
                  )
                )
              )
            ),

          computedRows.length > 0 && h('div', { className: 'mt-3 d-flex gap-2 flex-wrap' },
            h('button', { 
              className: 'btn btn-outline-success', 
              onClick: downloadCSV
            }, h('i', { className: 'bi bi-filetype-csv me-2' }), ' Download CSV'),
            h('button', { 
              className: 'btn btn-outline-danger', 
              onClick: downloadPDF
            }, h('i', { className: 'bi bi-filetype-pdf me-2' }), ' Download PDF')
          )
        )
      )
    )
  );
}