import React, { useState } from 'react';
import Card from '../components/Card';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { computeAllIndices } from '../utils/hmpi';
import { addSample } from '../utils/storage';

const h = React.createElement;

export default function BatchProcessing() {
  const [rows, setRows] = useState([]);
  const [computedRows, setComputedRows] = useState([]);

  function parseCSV(file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => setRows(res.data)
    });
  }

  function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      setRows(data);
    };
    reader.readAsArrayBuffer(file);
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith('.csv')) parseCSV(file);
    else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) parseExcel(file);
    else alert('Upload CSV or Excel');
  }

  function analyzeSamples() {
    const computed = rows.map((r) => {
      const indices = computeAllIndices(r);
      return { ...r, ...indices };
    });
    setComputedRows(computed);

    // Save analyzed samples
    computed.forEach((r) =>
      addSample({
        ...r,
        id: r.id || String(Date.now() + Math.random()),
        lat: Number(r.lat || 0),
        lng: Number(r.lng || 0)
      })
    );
    alert('Samples analyzed and saved');
  }

  // Download only HMPI, PLI, CF
  function downloadCSV() {
    if (!computedRows.length) return alert('Analyze samples first');
    const csvData = computedRows.map(r => ({
      HMPI: r.HPI,
      PLI: r.HEI,
      CF: r.Cd
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'batch_results.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPDF() {
    if (!computedRows.length) return alert('Analyze samples first');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.text('HYDRO INDEX - Batch Results', 40, 40);
    const cols = ['HMPI', 'PLI', 'CF'];
    const body = computedRows.map(r => [String(r.HPI), String(r.HEI), String(r.Cd)]);
    doc.autoTable({
      head: [cols],
      body,
      startY: 60,
      styles: { fontSize: 8 }
    });
    doc.save('batch_results.pdf');
  }

  return h('div', { className: 'container-fluid' },
    h('div', { className: 'row g-3' },

      // Upload Card
      h('div', { className: 'col-12' },
        h(Card, { title: 'Upload CSV/Excel for Batch Processing' },
          h('input', { type: 'file', className: 'form-control', accept: '.csv,.xlsx,.xls', onChange: onFile }),
          h('div', { className: 'mt-3' },
            h('button', { className: 'btn btn-brand', onClick: analyzeSamples }, h('i', { className: 'bi bi-save' }), ' Analyze Sample')
          )
        )
      ),

      // Parsed Rows Card
      h('div', { className: 'col-12' },
        h(Card, { title: `Parsed Rows (${computedRows.length || rows.length})` },
          h('div', { className: 'table-responsive' },
            h('table', { className: 'table table-dark table-striped table-sm align-middle' },
              h('thead', null,
                h('tr', null,
                  ...(Object.keys(rows[0] || { sample: 0 }).map(k => h('th', { key: k }, k))),
                  h('th', null, 'HMPI'),
                  h('th', null, 'PLI'),
                  h('th', null, 'CF')
                )
              ),
              h('tbody', null,
                ...(computedRows.length ? computedRows : rows).map((r, idx) =>
                  h('tr', { key: idx },
                    ...(Object.keys(rows[0] || r).map(k => h('td', { key: k }, String(r[k])))),
                    h('td', null, String(r.HPI)),
                    h('td', null, String(r.HEI)),
                    h('td', null, String(r.Cd))
                  )
                )
              )
            )
          ),

          // Download buttons below table
          h('div', { className: 'mt-3 d-flex gap-2' },
            h('button', { className: 'btn btn-outline-light', onClick: downloadCSV }, h('i', { className: 'bi bi-filetype-csv' }), ' Download CSV'),
            h('button', { className: 'btn btn-outline-light', onClick: downloadPDF }, h('i', { className: 'bi bi-filetype-pdf' }), ' Download PDF')
          )
        )
      )
    )
  );
}
