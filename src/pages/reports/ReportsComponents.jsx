import { useState } from 'react';
import * as XLSX from 'xlsx';

/**
 * Metric KPI Card Component
 */
export function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', badgeText }) {
  const colorMap = {
    primary: { bg: '#EFF6FF', text: '#2563EB', border: '#3B82F6' },
    teal: { bg: '#E0F7F6', text: '#0EBAB1', border: '#0EBAB1' },
    emerald: { bg: '#ECFDF5', text: '#059669', border: '#10B981' },
    amber: { bg: '#FFFBEB', text: '#D97706', border: '#F59E0B' },
    rose: { bg: '#FFF1F2', text: '#E11D48', border: '#F43F5E' },
    indigo: { bg: '#EEF2FF', text: '#4F46E5', border: '#6366F1' },
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <div
      className="section-panel"
      style={{
        margin: 0,
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: `4px solid ${scheme.border}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.5rem',
              backgroundColor: scheme.bg,
              color: scheme.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {value}
        </div>
        {(subtitle || badgeText) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-gray)' }}>
            {badgeText && (
              <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: scheme.bg, color: scheme.text }}>
                {badgeText}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Responsive SVG Bar Chart for Sales Timeline
 */
export function SimpleBarChart({ data = [], height = 220, valuePrefix = '₱' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-gray)', fontSize: '0.9rem' }}>
        No chart data available for this range.
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight = height - 45; // Space for labels

  return (
    <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
      {/* Tooltip Overlay */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            background: '#1E293B',
            color: '#FFFFFF',
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            zIndex: 10,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 600 }}>{data[hoveredIdx].fullLabel || data[hoveredIdx].label}</div>
          <div style={{ color: '#38BDF8', fontWeight: 700, fontSize: '0.85rem' }}>
            {valuePrefix}{Number(data[hoveredIdx].value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {data[hoveredIdx].subCount !== undefined && (
            <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>
              {data[hoveredIdx].subCount} transactions
            </div>
          )}
        </div>
      )}

      {/* SVG Container */}
      <svg
        width="100%"
        height={height}
        style={{ overflow: 'visible' }}
        preserveAspectRatio="none"
      >
        {/* Subtle Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = chartHeight - (chartHeight * ratio);
          return (
            <g key={i}>
              <line
                x1="0"
                y1={y}
                x2="100%"
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const totalBars = data.length;
          const barWidthPercent = Math.min(75 / totalBars, 8); // %
          const barGapPercent = (100 - (barWidthPercent * totalBars)) / (totalBars + 1);
          const xPercent = barGapPercent + index * (barWidthPercent + barGapPercent);
          
          const barH = (item.value / maxValue) * (chartHeight - 15);
          const y = chartHeight - barH;
          const isHovered = hoveredIdx === index;

          return (
            <g
              key={index}
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hover highlight background column */}
              <rect
                x={`${xPercent - 1}%`}
                y="0"
                width={`${barWidthPercent + 2}%`}
                height={chartHeight}
                fill={isHovered ? 'rgba(14, 186, 177, 0.08)' : 'transparent'}
                rx="4"
              />

              {/* Gradient / Solid Bar */}
              <rect
                x={`${xPercent}%`}
                y={y}
                width={`${barWidthPercent}%`}
                height={Math.max(barH, 2)}
                fill={isHovered ? '#0D9488' : '#0EBAB1'}
                rx="4"
                style={{ transition: 'all 0.2s ease' }}
              />

              {/* X Axis Label */}
              <text
                x={`${xPercent + barWidthPercent / 2}%`}
                y={height - 12}
                textAnchor="middle"
                fontSize="10"
                fontWeight={isHovered ? '700' : '500'}
                fill={isHovered ? '#0F766E' : '#64748B'}
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Excel (.xlsx) Exporter with Auto-fit columns and clean header design
 */
export function exportToExcel(config) {
  const {
    filename = 'report',
    sheetName = 'Report',
    reportTitle = 'MedDesk Health System Report',
    metadata = [],
    headers = [],
    rows = [],
    summaryRows = []
  } = config;

  if (!rows || !rows.length) return;

  const wb = XLSX.utils.book_new();
  const sheetData = [];

  // 1. Clinic Branding Header
  sheetData.push(['MEDDESK HEALTHCARE MANAGEMENT SYSTEM']);
  sheetData.push([reportTitle.toUpperCase()]);
  
  // 2. Metadata lines
  if (metadata && metadata.length > 0) {
    metadata.forEach(m => sheetData.push([m]));
  } else {
    sheetData.push([`Exported on: ${new Date().toLocaleString()}`]);
  }
  
  // Blank spacer row
  sheetData.push([]);

  // 3. Table Headers
  const headerKeys = headers.map(h => h.key);
  const headerLabels = headers.map(h => h.label);
  const headerRowIdx = sheetData.length;
  sheetData.push(headerLabels);

  // 4. Data Rows
  rows.forEach(row => {
    const rowValues = headerKeys.map(key => {
      const val = row[key];
      return val === null || val === undefined ? '' : val;
    });
    sheetData.push(rowValues);
  });

  // 5. Summary / Totals Rows
  if (summaryRows && summaryRows.length > 0) {
    sheetData.push([]);
    summaryRows.forEach(sr => sheetData.push(sr));
  }

  // Convert array-of-arrays to worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // 6. Calculate Automatic Column Widths with generous padding to prevent text clipping
  const colWidths = headerLabels.map((hLabel, colIdx) => {
    let maxLen = String(hLabel).length;
    // Inspect data rows for this column
    for (let r = headerRowIdx + 1; r < sheetData.length; r++) {
      const cellVal = sheetData[r] && sheetData[r][colIdx] !== undefined ? String(sheetData[r][colIdx]) : '';
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    }
    // Set auto-fit width with extra breathing room
    return { wch: Math.max(maxLen + 4, 15) };
  });

  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Enhanced CSV Exporter with UTF-8 BOM and clean structured layout
 */
export function exportToCSV(arg1, arg2, arg3) {
  let filename, rows, headers, reportTitle, metadata, summaryRows;
  if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1)) {
    filename = arg1.filename;
    rows = arg1.rows || [];
    headers = arg1.headers || [];
    reportTitle = arg1.reportTitle || 'MedDesk Health Report';
    metadata = arg1.metadata || [];
    summaryRows = arg1.summaryRows || [];
  } else {
    filename = arg1;
    rows = arg2 || [];
    headers = arg3 || [];
    reportTitle = filename ? filename.replace(/_/g, ' ').toUpperCase() : 'REPORT';
    metadata = [];
    summaryRows = [];
  }

  if (!rows || !rows.length) return;

  const headerKeys = headers.map(h => h.key);
  const headerLabels = headers.map(h => `"${h.label.replace(/"/g, '""')}"`);

  const csvLines = [];

  // Header Title & Metadata Section
  csvLines.push(`"MEDDESK HEALTHCARE MANAGEMENT SYSTEM"`);
  csvLines.push(`"${reportTitle.replace(/"/g, '""')}"`);
  if (metadata && metadata.length > 0) {
    metadata.forEach(m => csvLines.push(`"${String(m).replace(/"/g, '""')}"`));
  } else {
    csvLines.push(`"Exported Date: ${new Date().toLocaleString()}"`);
  }
  csvLines.push('""'); // Blank separator line

  // Column Headers
  csvLines.push(headerLabels.join(','));

  // Data Rows
  rows.forEach(row => {
    const values = headerKeys.map(key => {
      let val = row[key];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'number') return val;
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvLines.push(values.join(','));
  });

  // Summary Rows
  if (summaryRows && summaryRows.length > 0) {
    csvLines.push('""');
    summaryRows.forEach(sr => {
      const sVals = sr.map(sv => `"${String(sv).replace(/"/g, '""')}"`);
      csvLines.push(sVals.join(','));
    });
  }

  // Prepend UTF-8 BOM (\uFEFF) so Excel on Windows recognizes character encodings properly
  const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
