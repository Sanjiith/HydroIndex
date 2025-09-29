import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { loadSamples, removeSample, saveSamples } from '../utils/storage';
import { computeAllIndices } from '../utils/hmpi';

const h = React.createElement;

export default function DataManagement() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    setRows(loadSamples());
  }, []);

  useEffect(() => {
    setSelectAll(rows.length > 0 && selected.size === rows.length);
  }, [selected, rows]);

  function refresh() {
    setRows(loadSamples());
    setSelected(new Set());
  }

  function toggleRow(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(rows.map(r => r.id));
      setSelected(allIds);
      setSelectAll(true);
    }
  }

  function deleteSelected() {
    if (selected.size === 0) return alert('No rows selected');
    if (!confirm(`Delete ${selected.size} selected samples?`)) return;
    const remaining = rows.filter(r => !selected.has(r.id));
    saveSamples(remaining);
    refresh();
  }

  function deleteByRange() {
    if (!startDate || !endDate) return alert('Provide both start and end date');
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s) || isNaN(e)) return alert('Invalid date(s)');
    if (s > e) return alert('Start date cannot be after end date');
    if (!confirm(`Delete all samples between ${startDate} and ${endDate} (inclusive)?`)) return;
    const remaining = rows.filter(r => {
      const d = r.date ? new Date(r.date) : null;
      if (!d) return true; 
      const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return dd < new Date(s.getFullYear(), s.getMonth(), s.getDate()) || dd > new Date(e.getFullYear(), e.getMonth(), e.getDate());
    });
    saveSamples(remaining);
    refresh();
  }

  function del(id) {
    if (!confirm('Delete this sample?')) return;
    removeSample(id);
    refresh();
  }

  function clearAll() {
    if (!confirm('Clear ALL stored samples? This cannot be undone.')) return;
    saveSamples([]);
    refresh();
  }

  return h('div', { className: 'container-fluid' },
    h('div', { className: 'row g-3' },

      // Controls
      h('div', { className: 'col-12' },
        h(Card, { title: `Stored Samples (${rows.length})` },
          h('div', { className: 'd-flex flex-wrap gap-2 mb-3' },
            // Smaller Delete Selected button
            h('button', { className: 'btn btn-danger btn-sm py-0 px-2 d-flex align-items-center', onClick: deleteSelected }, 
              h('i', { className: 'bi bi-trash me-1' }), 'Delete Selected'
            ),
            // Smaller Clear All button
            h('button', { className: 'btn btn-outline-light btn-sm py-0 px-2 d-flex align-items-center', onClick: clearAll }, 
              h('i', { className: 'bi bi-x-circle me-1' }), 'Clear All'
            ),

            // Date Range Picker Section
            h('div', { className: 'ms-auto d-flex align-items-center gap-2' },
              h('label', { className: 'form-label mb-0 fw-bold me-2' }, 'Date Range:'),
              h('div', { className: 'input-group input-group-sm' },
                h('span', { className: 'input-group-text bg-secondary text-white' }, 'From'),
                h('input', { type: 'date', className: 'form-control', value: startDate, onChange: (e) => setStartDate(e.target.value) }),
              ),
              h('div', { className: 'input-group input-group-sm' },
                h('span', { className: 'input-group-text bg-secondary text-white' }, 'To'),
                h('input', { type: 'date', className: 'form-control', value: endDate, onChange: (e) => setEndDate(e.target.value) }),
              ),
              h('button', { className: 'btn btn-outline-primary btn-sm', onClick: deleteByRange }, 
                h('i', { className: 'bi bi-calendar-x' }), ' Delete Range'
              )
            )
          ),

          // Table
          h('div', { className: 'table-responsive' },
            h('table', { className: 'table table-dark table-striped table-sm align-middle' },
              h('thead', null,
                h('tr', null,
                  h('th', null, h('input', { type: 'checkbox', checked: selectAll, onChange: toggleSelectAll })),
                  h('th', null, 'ID'),
                  h('th', null, 'Location'),
                  h('th', null, 'Date'),
                  h('th', null, 'HMPI'),
                  h('th', null, 'PLI'),
                  h('th', null, 'CF'),
                  h('th', null, 'Actions')
                )
              ),
              h('tbody', null,
                ...rows.map((r) => {
                  const idx = computeAllIndices(r);
                  return h('tr', { key: r.id },
                    h('td', null, h('input', { type: 'checkbox', checked: selected.has(r.id), onChange: () => toggleRow(r.id) })),
                    h('td', null, String(r.id)),
                    h('td', null, String(r.location || '')),
                    h('td', null, String(r.date || '')),
                    h('td', null, String(idx.HMPI?.toFixed(2) || '0.00')),
                    h('td', null, String(idx.PLI?.toFixed(2) || '0.00')),
                    h('td', null, String(idx.CF?.toFixed(2) || '0.00')),
                    h('td', null,
                      h('div', { className: 'd-flex gap-2' },
                        h('button', { className: 'btn btn-sm btn-outline-danger', onClick: () => del(r.id) }, 
                          h('i', { className: 'bi bi-trash' }), ' Delete'
                        )
                      )
                    )
                  );
                })
              )
            )
          )
        )
      )
    )
  );
}