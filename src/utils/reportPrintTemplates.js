import { executePrint } from './printDocumentTemplates';

/**
 * Formats a currency amount in PHP
 */
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generates and prints a comprehensive Sales Report document
 */
export function printSalesReportDocument({
  reportTitle = 'Sales & Revenue Summary Report',
  periodType = 'daily',
  dateRangeStr = '',
  kpis = {},
  salesData = [],
  topItems = [],
  salesSource = 'all',
  userProfile = null,
}) {
  const printDateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const generatedBy = userProfile?.full_name || 'Authorized Staff';
  const role = (userProfile?.role || 'Staff').toUpperCase();

  // Render Ledger Rows (limited to first 100 on print if massive, with summary indicator)
  const maxPrintRows = 120;
  const rowsToPrint = salesData.slice(0, maxPrintRows);

  const ledgerRowsHtml = rowsToPrint.map((item, idx) => {
    const dateFormatted = item.date
      ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—';
    const refNo = item.reference_no || `#${item.id}`;
    const customer = item.customer_name || 'Walk-in / General';
    const sourceLabel = item.source === 'pharmacy' ? 'Pharmacy' : 'Clinic Billing';
    const statusClass = item.status === 'paid' || item.status === 'completed' ? 'badge-paid' : 'badge-pending';
    const statusLabel = (item.status || 'pending').toUpperCase();

    return `
      <tr>
        <td style="text-align: center; width: 35px;">${idx + 1}</td>
        <td style="white-space: nowrap;">${dateFormatted}</td>
        <td style="font-weight: 600; font-family: monospace;">${refNo}</td>
        <td>${customer}</td>
        <td style="text-align: center;">
          <span class="source-tag ${item.source}">${sourceLabel}</span>
        </td>
        <td style="text-align: center;">
          <span class="badge ${statusClass}">${statusLabel}</span>
        </td>
        <td style="text-align: right; font-weight: 600;">${formatCurrency(item.amount_due || item.amount)}</td>
        <td style="text-align: right; color: #047857; font-weight: 600;">${formatCurrency(item.amount_paid || 0)}</td>
      </tr>
    `;
  }).join('');

  // Top Items HTML (if available)
  let topItemsHtml = '';
  if (topItems && topItems.length > 0) {
    const topRows = topItems.slice(0, 8).map((ti, i) => `
      <tr>
        <td style="text-align: center; width: 30px;">${i + 1}</td>
        <td><strong>${ti.name}</strong></td>
        <td style="text-align: center;">${ti.quantity}</td>
        <td style="text-align: right; font-weight: 600;">${formatCurrency(ti.revenue)}</td>
      </tr>
    `).join('');

    topItemsHtml = `
      <div style="margin-top: 18px; margin-bottom: 20px;">
        <div class="section-title">Top Selling Products / Items</div>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th>Product / Medicine Name</th>
              <th style="text-align: center; width: 100px;">Units Sold</th>
              <th style="text-align: right; width: 140px;">Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${topRows}
          </tbody>
        </table>
      </div>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Sales Report - ${dateRangeStr}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 12mm 12mm 12mm;
        }
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
        }
        body {
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.4;
          background: #fff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0d9488;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .clinic-brand {
          display: flex;
          flex-direction: column;
        }
        .clinic-name {
          font-size: 18px;
          font-weight: 800;
          color: #0f766e;
          letter-spacing: -0.02em;
        }
        .clinic-sub {
          font-size: 10.5px;
          color: #475569;
          margin-top: 2px;
        }
        .doc-meta {
          text-align: right;
        }
        .report-badge {
          display: inline-block;
          background: #e0f2fe;
          color: #0369a1;
          font-weight: 700;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 4px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .meta-line {
          font-size: 10px;
          color: #64748b;
        }
        .report-header-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .report-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }
        .report-period {
          font-size: 11.5px;
          font-weight: 600;
          color: #0d9488;
        }
        /* KPI Cards Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .kpi-card {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px;
          background: #ffffff;
          border-top: 3px solid #0d9488;
        }
        .kpi-card.success { border-top-color: #10b981; }
        .kpi-card.warning { border-top-color: #f59e0b; }
        .kpi-card.info { border-top-color: #3b82f6; }
        .kpi-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.05em;
          margin-bottom: 3px;
        }
        .kpi-val {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }
        .kpi-sub {
          font-size: 9px;
          color: #94a3b8;
          margin-top: 2px;
        }
        .section-title {
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        /* Table Styles */
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        .report-table th {
          background-color: #f1f5f9;
          color: #334155;
          font-weight: 700;
          text-align: left;
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 6px 8px;
          border-top: 1px solid #cbd5e1;
          border-bottom: 2px solid #94a3b8;
        }
        .report-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 10px;
        }
        .report-table tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 8.5px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .badge-paid {
          background-color: #d1fae5;
          color: #065f46;
        }
        .badge-pending {
          background-color: #fef3c7;
          color: #92400e;
        }
        .source-tag {
          display: inline-block;
          padding: 2px 5px;
          border-radius: 3px;
          font-size: 8.5px;
          font-weight: 600;
        }
        .source-tag.pharmacy {
          background-color: #e0e7ff;
          color: #3730a3;
        }
        .source-tag.billing {
          background-color: #dbeafe;
          color: #1e40af;
        }
        /* Summary Footer Box */
        .report-footer-summary {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
          margin-bottom: 24px;
        }
        .summary-totals-box {
          width: 260px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px 12px;
          background: #f8fafc;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-size: 10px;
        }
        .summary-row.bold {
          font-weight: 700;
          font-size: 11.5px;
          border-top: 1px dashed #cbd5e1;
          margin-top: 4px;
          padding-top: 5px;
          color: #0f172a;
        }
        /* Signature section */
        .signature-section {
          margin-top: 36px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .sig-box {
          width: 220px;
          text-align: center;
        }
        .sig-line {
          border-bottom: 1px solid #0f172a;
          margin-bottom: 5px;
          height: 35px;
        }
        .sig-name {
          font-weight: 700;
          font-size: 10.5px;
        }
        .sig-title {
          font-size: 9px;
          color: #64748b;
        }
        .footer-note {
          margin-top: 24px;
          text-align: center;
          font-size: 8.5px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="clinic-brand">
          <div class="clinic-name">MedDesk Healthcare & Medical Clinic</div>
          <div class="clinic-sub">Internal Medicine • Adult Cardiology • Pharmacy • Clinical Laboratory</div>
          <div class="clinic-sub" style="margin-top: 1px;">Adventist Medical Center / Valencia Polymedic, Bukidnon</div>
        </div>
        <div class="doc-meta">
          <div class="report-badge">FINANCIAL & SALES AUDIT</div>
          <div class="meta-line">Printed: ${printDateStr}</div>
          <div class="meta-line">Auditor / User: ${generatedBy} (${role})</div>
        </div>
      </div>

      <!-- Report Subject -->
      <div class="report-header-box">
        <div>
          <div class="report-title">${reportTitle}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
            Stream Scope: <strong>${salesSource === 'all' ? 'All Revenue (Pharmacy & Clinic Billing)' : salesSource === 'pharmacy' ? 'Pharmacy Dispensing Sales' : 'Clinic Patient Billing'}</strong>
          </div>
        </div>
        <div class="report-period">
          Period: ${dateRangeStr}
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Gross Revenue</div>
          <div class="kpi-val">${formatCurrency(kpis.grossRevenue || 0)}</div>
          <div class="kpi-sub">Total billed sales</div>
        </div>
        <div class="kpi-card success">
          <div class="kpi-label">Total Collected / Paid</div>
          <div class="kpi-val" style="color: #047857;">${formatCurrency(kpis.collectedAmount || 0)}</div>
          <div class="kpi-sub">Cash / Completed payments</div>
        </div>
        <div class="kpi-card warning">
          <div class="kpi-label">Outstanding / Receivables</div>
          <div class="kpi-val" style="color: #b45309;">${formatCurrency(kpis.unpaidAmount || 0)}</div>
          <div class="kpi-sub">Pending / Unpaid balance</div>
        </div>
        <div class="kpi-card info">
          <div class="kpi-label">Transactions Count</div>
          <div class="kpi-val" style="color: #1d4ed8;">${(kpis.totalCount || salesData.length).toLocaleString()}</div>
          <div class="kpi-sub">Avg: ${formatCurrency(kpis.avgTicket || 0)} / bill</div>
        </div>
      </div>

      <!-- Top Items (if any) -->
      ${topItemsHtml}

      <!-- Itemized Ledger -->
      <div class="section-title">
        Itemized Sales Ledger (${salesData.length} records ${salesData.length > maxPrintRows ? `- Top ${maxPrintRows} shown` : ''})
      </div>
      <table class="report-table">
        <thead>
          <tr>
            <th style="text-align: center; width: 35px;">#</th>
            <th style="width: 85px;">Date</th>
            <th style="width: 110px;">Ref / Inv #</th>
            <th>Customer / Patient</th>
            <th style="text-align: center; width: 95px;">Stream</th>
            <th style="text-align: center; width: 75px;">Status</th>
            <th style="text-align: right; width: 100px;">Amount Due</th>
            <th style="text-align: right; width: 100px;">Amount Paid</th>
          </tr>
        </thead>
        <tbody>
          ${ledgerRowsHtml || '<tr><td colspan="8" style="text-align:center; padding: 16px;">No transactions recorded for this period.</td></tr>'}
        </tbody>
      </table>

      <!-- Summary Box -->
      <div class="report-footer-summary">
        <div class="summary-totals-box">
          <div class="summary-row">
            <span>Total Gross Sales:</span>
            <span>${formatCurrency(kpis.grossRevenue || 0)}</span>
          </div>
          <div class="summary-row">
            <span>Total Discounts Granted:</span>
            <span style="color: #b91c1c;">-${formatCurrency(kpis.totalDiscounts || 0)}</span>
          </div>
          <div class="summary-row">
            <span>Total Paid Collections:</span>
            <span style="color: #047857; font-weight: 600;">${formatCurrency(kpis.collectedAmount || 0)}</span>
          </div>
          <div class="summary-row">
            <span>Uncollected Receivables:</span>
            <span style="color: #b45309; font-weight: 600;">${formatCurrency(kpis.unpaidAmount || 0)}</span>
          </div>
          <div class="summary-row bold">
            <span>Net Financial Balance:</span>
            <span>${formatCurrency(kpis.grossRevenue || 0)}</span>
          </div>
        </div>
      </div>

      <!-- Signature Blocks -->
      <div class="signature-section">
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-name">${generatedBy}</div>
          <div class="sig-title">Prepared By (${role})</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-name">DR. GLADDAYS CASUGA-NAPIGKIT</div>
          <div class="sig-title">Medical Director / Clinic Head</div>
        </div>
      </div>

      <!-- Footer Note -->
      <div class="footer-note">
        Confidential Medical Center Document • MedDesk Health System • Generated automatically on ${printDateStr}
      </div>
    </body>
    </html>
  `;

  executePrint(htmlContent);
}

/**
 * Generates and prints an official Inventory & Stock Valuation Report or Reorder Sheet
 */
export function printInventoryReportDocument({
  reportTitle = 'Inventory Valuation & Stock Status Report',
  viewType = 'all', // 'all', 'low_stock', 'expiring', 'categories'
  kpis = {},
  itemsData = [],
  categoryBreakdown = [],
  expiringBatches = [],
  userProfile = null,
}) {
  const printDateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const generatedBy = userProfile?.full_name || 'Inventory Manager';
  const role = (userProfile?.role || 'Staff').toUpperCase();

  // Generate Table Content based on viewType
  let tableRowsHtml = '';

  if (viewType === 'expiring') {
    tableRowsHtml = expiringBatches.map((b, idx) => {
      const expiryFormatted = b.expiry_date
        ? new Date(b.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Unknown';
      const daysUntil = b.daysUntil !== undefined ? b.daysUntil : Math.round((new Date(b.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      const statusClass = daysUntil < 0 ? 'badge-expired' : daysUntil <= 30 ? 'badge-critical' : 'badge-warning';
      const statusText = daysUntil < 0 ? 'EXPIRED' : `${daysUntil} days left`;

      return `
        <tr>
          <td style="text-align: center; width: 35px;">${idx + 1}</td>
          <td style="font-weight: 600;">${b.item_name || `Item #${b.item_id}`}</td>
          <td>${b.category_name || 'General'}</td>
          <td style="font-family: monospace;">${b.batch_number || '—'}</td>
          <td style="text-align: center;">${b.quantity_received || 0}</td>
          <td style="text-align: center; font-weight: 600;">${expiryFormatted}</td>
          <td style="text-align: center;">
            <span class="badge ${statusClass}">${statusText}</span>
          </td>
        </tr>
      `;
    }).join('');
  } else {
    // Standard Stock / Low stock items
    tableRowsHtml = itemsData.map((item, idx) => {
      const qty = Number(item.quantity_in_stock || 0);
      const reorder = Number(item.reorder_level || 0);
      const price = Number(item.price || item.unit_cost || 0);
      const valuation = qty * price;
      
      let badgeClass = 'badge-stock';
      let badgeText = 'IN STOCK';
      if (qty === 0) {
        badgeClass = 'badge-out';
        badgeText = 'OUT OF STOCK';
      } else if (qty <= reorder) {
        badgeClass = 'badge-low';
        badgeText = 'LOW STOCK';
      }

      return `
        <tr>
          <td style="text-align: center; width: 35px;">${idx + 1}</td>
          <td>
            <strong>${item.item_name}</strong>
            ${item.product_number ? `<div style="font-size: 8.5px; color: #64748b;">SKU: ${item.product_number}</div>` : ''}
          </td>
          <td>${item.inventory_categories?.category_name || item.category_name || 'General'}</td>
          <td style="text-align: center; font-weight: 700; ${qty <= reorder ? 'color: #dc2626;' : ''}">
            ${qty} ${item.unit || 'units'}
          </td>
          <td style="text-align: center; color: #64748b;">${reorder} ${item.unit || ''}</td>
          <td style="text-align: right;">${formatCurrency(price)}</td>
          <td style="text-align: right; font-weight: 700; color: #0f766e;">${formatCurrency(valuation)}</td>
          <td style="text-align: center;">
            <span class="badge ${badgeClass}">${badgeText}</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Category breakdown table
  let categoryTableHtml = '';
  if (categoryBreakdown && categoryBreakdown.length > 0 && viewType !== 'expiring') {
    const catRows = categoryBreakdown.map((cat, i) => `
      <tr>
        <td style="text-align: center;">${i + 1}</td>
        <td><strong>${cat.name}</strong></td>
        <td style="text-align: center;">${cat.itemCount} SKUs</td>
        <td style="text-align: center;">${cat.totalUnits.toLocaleString()}</td>
        <td style="text-align: right; font-weight: 600;">${formatCurrency(cat.totalValue)}</td>
      </tr>
    `).join('');

    categoryTableHtml = `
      <div style="margin-top: 14px; margin-bottom: 20px;">
        <div class="section-title">Stock Valuation by Category</div>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th>Category Name</th>
              <th style="text-align: center; width: 110px;">Item Variety</th>
              <th style="text-align: center; width: 110px;">Units On Hand</th>
              <th style="text-align: right; width: 140px;">Valuation</th>
            </tr>
          </thead>
          <tbody>
            ${catRows}
          </tbody>
        </table>
      </div>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${reportTitle}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 12mm 12mm 12mm;
        }
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
        }
        body {
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.4;
          background: #fff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0d9488;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .clinic-brand {
          display: flex;
          flex-direction: column;
        }
        .clinic-name {
          font-size: 18px;
          font-weight: 800;
          color: #0f766e;
          letter-spacing: -0.02em;
        }
        .clinic-sub {
          font-size: 10.5px;
          color: #475569;
          margin-top: 2px;
        }
        .doc-meta {
          text-align: right;
        }
        .report-badge {
          display: inline-block;
          background: #f0fdf4;
          color: #166534;
          font-weight: 700;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 4px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .meta-line {
          font-size: 10px;
          color: #64748b;
        }
        .report-header-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .report-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }
        .report-subtitle {
          font-size: 10.5px;
          color: #64748b;
          margin-top: 2px;
        }
        /* KPI Cards Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .kpi-card {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px;
          background: #ffffff;
          border-top: 3px solid #0d9488;
        }
        .kpi-card.danger { border-top-color: #ef4444; }
        .kpi-card.warning { border-top-color: #f59e0b; }
        .kpi-card.info { border-top-color: #3b82f6; }
        .kpi-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.05em;
          margin-bottom: 3px;
        }
        .kpi-val {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }
        .kpi-sub {
          font-size: 9px;
          color: #94a3b8;
          margin-top: 2px;
        }
        .section-title {
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        /* Table Styles */
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        .report-table th {
          background-color: #f1f5f9;
          color: #334155;
          font-weight: 700;
          text-align: left;
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 6px 8px;
          border-top: 1px solid #cbd5e1;
          border-bottom: 2px solid #94a3b8;
        }
        .report-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 10px;
        }
        .report-table tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 8.5px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .badge-stock {
          background-color: #d1fae5;
          color: #065f46;
        }
        .badge-low {
          background-color: #fef3c7;
          color: #92400e;
        }
        .badge-out {
          background-color: #fee2e2;
          color: #991b1b;
        }
        .badge-expired {
          background-color: #fee2e2;
          color: #991b1b;
        }
        .badge-critical {
          background-color: #ffedd5;
          color: #9a3412;
        }
        .badge-warning {
          background-color: #fef9c3;
          color: #854d0e;
        }
        /* Signature section */
        .signature-section {
          margin-top: 36px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .sig-box {
          width: 220px;
          text-align: center;
        }
        .sig-line {
          border-bottom: 1px solid #0f172a;
          margin-bottom: 5px;
          height: 35px;
        }
        .sig-name {
          font-weight: 700;
          font-size: 10.5px;
        }
        .sig-title {
          font-size: 9px;
          color: #64748b;
        }
        .footer-note {
          margin-top: 24px;
          text-align: center;
          font-size: 8.5px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="clinic-brand">
          <div class="clinic-name">MedDesk Healthcare & Medical Clinic</div>
          <div class="clinic-sub">Pharmacy & Medical Supplies Inventory Control Management</div>
          <div class="clinic-sub" style="margin-top: 1px;">Adventist Medical Center / Valencia Polymedic, Bukidnon</div>
        </div>
        <div class="doc-meta">
          <div class="report-badge">INVENTORY AUDIT</div>
          <div class="meta-line">Printed: ${printDateStr}</div>
          <div class="meta-line">Inspector: ${generatedBy} (${role})</div>
        </div>
      </div>

      <!-- Report Header -->
      <div class="report-header-box">
        <div>
          <div class="report-title">${reportTitle}</div>
          <div class="report-subtitle">
            Target View: <strong>${viewType === 'low_stock' ? 'Critical & Low Stock Alert List' : viewType === 'expiring' ? 'Batch Expiration Control' : 'Master Inventory Valuation'}</strong>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; font-weight: 600; color: #0d9488;">
            Total Asset Value: ${formatCurrency(kpis.totalValuation || 0)}
          </div>
          <div style="font-size: 9.5px; color: #64748b;">
            Active SKU Count: ${(kpis.totalItems || itemsData.length).toLocaleString()}
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total Inventory Value</div>
          <div class="kpi-val" style="color: #0f766e;">${formatCurrency(kpis.totalValuation || 0)}</div>
          <div class="kpi-sub">Total on-hand worth</div>
        </div>
        <div class="kpi-card info">
          <div class="kpi-label">Total Unique SKUs</div>
          <div class="kpi-val" style="color: #1d4ed8;">${(kpis.totalItems || itemsData.length).toLocaleString()}</div>
          <div class="kpi-sub">Active inventory items</div>
        </div>
        <div class="kpi-card warning">
          <div class="kpi-label">Low Stock Items</div>
          <div class="kpi-val" style="color: #b45309;">${(kpis.lowStockCount || 0).toLocaleString()}</div>
          <div class="kpi-sub">Reorder threshold reached</div>
        </div>
        <div class="kpi-card danger">
          <div class="kpi-label">Out of Stock Items</div>
          <div class="kpi-val" style="color: #dc2626;">${(kpis.outOfStockCount || 0).toLocaleString()}</div>
          <div class="kpi-sub">Zero quantity on shelf</div>
        </div>
      </div>

      <!-- Category Summary (if available) -->
      ${categoryTableHtml}

      <!-- Detailed Items Table -->
      <div class="section-title">
        ${viewType === 'expiring' ? 'Expiring Batches Ledger' : 'Inventory Items Ledger'} (${viewType === 'expiring' ? expiringBatches.length : itemsData.length} records)
      </div>
      <table class="report-table">
        <thead>
          ${viewType === 'expiring' ? `
            <tr>
              <th style="text-align: center; width: 35px;">#</th>
              <th>Product / Medicine Name</th>
              <th>Category</th>
              <th>Batch / Lot #</th>
              <th style="text-align: center; width: 70px;">Quantity</th>
              <th style="text-align: center; width: 100px;">Expiry Date</th>
              <th style="text-align: center; width: 90px;">Urgency</th>
            </tr>
          ` : `
            <tr>
              <th style="text-align: center; width: 35px;">#</th>
              <th>Product / Medicine Name</th>
              <th>Category</th>
              <th style="text-align: center; width: 80px;">In Stock</th>
              <th style="text-align: center; width: 80px;">Reorder At</th>
              <th style="text-align: right; width: 90px;">Unit Price</th>
              <th style="text-align: right; width: 100px;">Total Valuation</th>
              <th style="text-align: center; width: 85px;">Status</th>
            </tr>
          `}
        </thead>
        <tbody>
          ${tableRowsHtml || '<tr><td colspan="8" style="text-align:center; padding: 16px;">No inventory records matching filter.</td></tr>'}
        </tbody>
      </table>

      <!-- Signature Blocks -->
      <div class="signature-section">
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-name">${generatedBy}</div>
          <div class="sig-title">Inventory Controller (${role})</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-name">DR. GLADDAYS CASUGA-NAPIGKIT</div>
          <div class="sig-title">Clinic Head / Pharmacist In-Charge</div>
        </div>
      </div>

      <!-- Footer Note -->
      <div class="footer-note">
        Confidential Inventory Control Audit • MedDesk Health System • Generated automatically on ${printDateStr}
      </div>
    </body>
    </html>
  `;

  executePrint(htmlContent);
}
