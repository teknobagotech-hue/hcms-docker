import React, { useState } from 'react';
import { Printer, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TablePrintControls({
  records = [],
  title,
  columns = [],
  dateField = 'created_at',
  searchTerm = '',
  onSearchChange,
  patientName = '',
  patient = null
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [localSearch, setLocalSearch] = useState(searchTerm || '');

  const getFormattedPatientName = () => {
    if (patientName) return patientName;
    if (patient) {
      if (typeof patient === 'string') return patient;
      const lastName = patient.last_name || '';
      const firstName = patient.first_name || '';
      const middleName = patient.middle_name || '';
      if (lastName && firstName) {
        return `${lastName}, ${firstName} ${middleName}`.trim();
      }
      return `${firstName} ${lastName}`.trim();
    }
    return '';
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearch.trim());
    }
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const handlePrint = () => {
    let filteredRecords = records;
    if (startDate) {
      filteredRecords = filteredRecords.filter(r => new Date(r[dateField]) >= new Date(startDate));
    }
    if (endDate) {
      filteredRecords = filteredRecords.filter(r => new Date(r[dateField]) <= new Date(endDate));
    }
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase().trim();
      filteredRecords = filteredRecords.filter(r => {
        return Object.values(r).some(val => val !== null && val !== undefined && String(val).toLowerCase().includes(q));
      });
    }

    if (filteredRecords.length === 0) {
      toast.error('No records found for the selected filter criteria.');
      return;
    }

    const printWindow = window.open('', '_blank');
    const pName = getFormattedPatientName();

    let tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed;">
        <thead>
          <tr>
            ${columns.map(c => `<th style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; background-color: #f1f5f9; font-size: 9pt; font-weight: bold; width: ${c.width || 'auto'};">${c.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${filteredRecords.map(r => `
            <tr>
              ${columns.map(c => {
      const val = c.render ? c.render(r) : r[c.key] || '-';
      return `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 8.5pt; vertical-align: top; word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap;">${val}</td>`;
    }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print - ${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #333; padding: 20px; }
            h1 { color: #1e293b; font-size: 22px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
            .patient-banner { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 12px; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border-left: 4px solid #0d9488; }
            .meta-info { font-size: 12px; color: #64748b; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; table-layout: fixed; }
            th { word-break: break-word; overflow-wrap: break-word; white-space: normal; }
            td { word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap; }
            @media print {
              @page { margin: 0; size: A4 portrait; }
              body { padding: 10mm; margin: 0; }
              button { display: none !important; }
              table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; }
              th { word-break: break-word !important; overflow-wrap: break-word !important; white-space: normal !important; }
              td { word-break: break-word !important; overflow-wrap: break-word !important; white-space: pre-wrap !important; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${pName ? `<div class="patient-banner">Patient: <strong>${pName}</strong></div>` : ''}
          <div class="meta-info">
            <p style="margin: 2px 0;">Date Printed: ${new Date().toLocaleDateString()}</p>
            ${startDate || endDate ? `<p style="margin: 2px 0;">Filtered Date: ${startDate || 'Any'} to ${endDate || 'Any'}</p>` : ''}
            ${localSearch ? `<p style="margin: 2px 0;">Search Query: "${localSearch}"</p>` : ''}
          </div>
          ${tableHtml}
          <div style="margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #0f172a; color: white; border: none; cursor: pointer; border-radius: 4px;">Print Now</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-gray)' }}>From:</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-control" style={{ width: 'auto', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-gray)' }}>To:</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-control" style={{ width: 'auto', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} />
      </div>

      <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
        <Printer size={16} /> Print
      </button>

      {/* Search Bar & Search Button beside Print */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search table..."
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            className="form-control"
            style={{
              paddingLeft: '2rem',
              paddingRight: localSearch ? '2rem' : '0.6rem',
              paddingTop: '0.35rem',
              paddingBottom: '0.35rem',
              fontSize: '0.85rem',
              width: '180px',
              borderRadius: '0.375rem'
            }}
          />
          <Search size={14} style={{ position: 'absolute', left: '0.6rem', color: '#94a3b8' }} />
          {localSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '0.4rem',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.9rem',
            fontSize: '0.85rem'
          }}
        >
          <Search size={14} /> Search
        </button>
      </form>
    </div>
  );
}
