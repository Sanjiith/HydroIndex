import React, { useMemo } from 'react';
import Card from '../components/Card';
import { loadSamples } from '../utils/storage';
import { computeAllIndices } from '../utils/hmpi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

const h = React.createElement;

export default function Reports() {
  const samples = loadSamples();
  const computed = useMemo(() =>
    samples.map(s => ({ ...s, ...computeAllIndices(s) })), [samples]);

  function downloadPDF() {
    if (!computed.length) return alert('No data');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.text('HYDRO INDEX - Report', 40, 40);

    const cols = ['ID', 'Location', 'Date', 'HMPI', 'PLI', 'CF'];
    const data = computed.map(r => [
      String(r.id ?? ''),
      String(r.location ?? ''),
      String(r.date ?? ''),
      String(r.HPI),   // internal HPI as HMPI
      String(r.HEI),   // internal HEI as PLI
      String(r.Cd)     // internal Cd as CF
    ]);

    doc.autoTable({
      head: [cols],
      body: data,
      startY: 60,
      styles: { fontSize: 8 }
    });

    doc.save('hydro_index_report.pdf');
  }

  function downloadCSV() {
    if (!computed.length) return alert('No data');
    const csvData = computed.map(r => ({
      HMPI: r.HPI,
      PLI: r.HEI,
      CF: r.Cd
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'hydro_index_report.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return h('div', { className: 'container-fluid' },
    h('div', { className: 'row g-3' },
      h('div', { className: 'col-12' },
        h(Card, { title: 'Report Export' },
          h('div', { className: 'd-flex gap-2' },
            h('button', { className: 'btn btn-brand', onClick: downloadPDF }, h('i', { className: 'bi bi-file-earmark-pdf' }), ' PDF'),
            h('button', { className: 'btn btn-outline-light', onClick: downloadCSV }, h('i', { className: 'bi bi-filetype-csv' }), ' CSV')
          )
        )
      ),
      h('div', { className: 'col-12' },
        h(Card, { title: `Preview (${computed.length})` },
          h('div', { className: 'table-responsive' },
            h('table', { className: 'table table-dark table-striped table-sm align-middle' },
              h('thead', null,
                h('tr', null,
                  h('th', null, 'ID'), h('th', null, 'Location'), h('th', null, 'Date'),
                  h('th', null, 'HMPI'), h('th', null, 'PLI'), h('th', null, 'CF')
                )
              ),
              h('tbody', null,
                ...computed.map((r) =>
                  h('tr', { key: r.id },
                    h('td', null, String(r.id ?? '')),
                    h('td', null, String(r.location ?? '')),
                    h('td', null, String(r.date ?? '')),
                    h('td', null, String(r.HPI)),  // HMPI
                    h('td', null, String(r.HEI)),  // PLI
                    h('td', null, String(r.Cd))    // CF
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}
