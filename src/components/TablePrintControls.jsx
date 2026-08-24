import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TablePrintControls({ records, title, columns, dateField }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePrint = () => {
    let filteredRecords = records;
    if (startDate) {
      filteredRecords = filteredRecords.filter(r => new Date(r[dateField]) >= new Date(startDate));
    }
    if (endDate) {
      filteredRecords = filteredRecords.filter(r => new Date(r[dateField]) <= new Date(endDate));
    }

    if (filteredRecords.length === 0) {
      toast.error('No records found for the selected date range.');
      return;
    }

    const printWindow = window.open('', '_blank');
    
    let tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr>
            ${columns.map(c => `<th style="border: 1px solid #ccc; padding: 8px; text-align: left; background-color: #f8fafc;">${c.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${filteredRecords.map(r => `
            <tr>
              ${columns.map(c => {
                const val = c.render ? c.render(r) : r[c.key] || '-';
                return `<td style="border: 1px solid #ccc; padding: 8px;">${val}</td>`;
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
            h1 { color: #1e293b; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            @media print {
              @page { margin: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Date Printed: ${new Date().toLocaleDateString()}</p>
          ${startDate || endDate ? `<p>Filtered: ${startDate || 'Any'} to ${endDate || 'Any'}</p>` : ''}
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-gray)' }}>From:</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-control" style={{ width: 'auto', padding: '0.35rem 0.5rem' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-gray)' }}>To:</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-control" style={{ width: 'auto', padding: '0.35rem 0.5rem' }} />
      </div>
      <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem' }}>
        <Printer size={16} /> Print
      </button>
    </div>
  );
}
