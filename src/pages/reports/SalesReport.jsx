import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Printer,
  Download,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  Sparkles,
  PieChart as PieIcon,
  Tag,
  FileSpreadsheet
} from 'lucide-react';
import { StatCard, SimpleBarChart, exportToCSV, exportToExcel } from './ReportsComponents';
import { printSalesReportDocument } from '../../utils/reportPrintTemplates';
import '../../index.css';

export default function SalesReport() {
  const { profile } = useAuth();

  // Period Preset: 'daily', 'weekly', 'monthly', 'yearly', 'custom'
  const [periodPreset, setPeriodPreset] = useState('monthly');
  
  // Custom or specific dates
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; // 1st of current month
  });
  const [endDate, setEndDate] = useState(todayStr);

  // Filters
  const [salesSource, setSalesSource] = useState('all'); // 'all', 'pharmacy', 'billing'
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all'); // 'all', 'paid', 'unpaid'
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [loading, setLoading] = useState(true);
  const [pharmacySales, setPharmacySales] = useState([]);
  const [billingSales, setBillingSales] = useState([]);
  const [topItems, setTopItems] = useState([]);

  // Handle Preset changes
  const applyPreset = (preset) => {
    setPeriodPreset(preset);
    const now = new Date();

    if (preset === 'daily') {
      const today = now.toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'weekly') {
      // Past 7 days
      const past7 = new Date();
      past7.setDate(now.getDate() - 6);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'monthly') {
      // 1st day of current month to today (or end of month)
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'yearly') {
      // Jan 1 to Dec 31 of current year
      const firstDayYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const lastDayYear = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      setStartDate(firstDayYear);
      setEndDate(lastDayYear);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const startDateTime = `${startDate}T00:00:00`;
      const endDateTime = `${endDate}T23:59:59`;

      // 1. Fetch Pharmacy Sales (inventory_withdrawals)
      const { data: withdrawalsData, error: withErr } = await supabase
        .from('inventory_withdrawals')
        .select('*, patients(first_name, last_name)')
        .gte('withdrawal_date', startDateTime)
        .lte('withdrawal_date', endDateTime)
        .order('withdrawal_date', { ascending: false });

      if (withErr) console.error('Error fetching pharmacy withdrawals:', withErr);

      // 2. Fetch Clinic Invoices (billing)
      const { data: billsData, error: billErr } = await supabase
        .from('billing')
        .select('*, patients(first_name, last_name)')
        .gte('billing_date', startDateTime)
        .lte('billing_date', endDateTime)
        .order('billing_date', { ascending: false });

      if (billErr) console.error('Error fetching billing:', billErr);

      setPharmacySales(withdrawalsData || []);
      setBillingSales(billsData || []);

      // 3. Fetch Top Items from inventory_withdrawal_items for this range
      if (withdrawalsData && withdrawalsData.length > 0) {
        const withdrawalIds = withdrawalsData.map(w => w.withdrawal_id);
        const { data: itemsData } = await supabase
          .from('inventory_withdrawal_items')
          .select('quantity, item_id, inventory_items(item_name, price)')
          .in('withdrawal_id', withdrawalIds);

        if (itemsData && itemsData.length > 0) {
          const itemAgg = {};
          itemsData.forEach(row => {
            const name = row.inventory_items?.item_name || `Item #${row.item_id}`;
            const qty = Number(row.quantity || 0);
            const price = Number(row.inventory_items?.price || 0);
            if (!itemAgg[name]) {
              itemAgg[name] = { name, quantity: 0, revenue: 0 };
            }
            itemAgg[name].quantity += qty;
            itemAgg[name].revenue += qty * price;
          });

          const sortedTop = Object.values(itemAgg).sort((a, b) => b.revenue - a.revenue);
          setTopItems(sortedTop);
        } else {
          setTopItems([]);
        }
      } else {
        setTopItems([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sales report data.');
    } finally {
      setLoading(false);
    }
  };

  // Harmonize unified sales records
  const unifiedSales = useMemo(() => {
    const list = [];

    // Map pharmacy withdrawals
    if (salesSource === 'all' || salesSource === 'pharmacy') {
      pharmacySales.forEach(w => {
        const custName = w.customer_id && w.patients
          ? `${w.patients.first_name || ''} ${w.patients.last_name || ''}`.trim()
          : w.customer_name || 'Walk-in Customer';

        const amountDue = Number(w.amount_due || 0);
        const amountPaid = Number(w.amount_paid || 0);
        const isPaid = w.payment_status === 'paid' || w.status === 'completed';

        list.push({
          id: w.withdrawal_id,
          reference_no: `RX-${String(w.withdrawal_id).padStart(5, '0')}`,
          date: w.withdrawal_date,
          customer_name: custName,
          source: 'pharmacy',
          sale_type: w.sale_type || 'retail',
          status: isPaid ? 'paid' : 'pending',
          amount_due: amountDue,
          amount_paid: amountPaid,
          discount_val: Number(w.discount_value || 0),
          discount_type: w.discount_type,
          original: w
        });
      });
    }

    // Map clinic patient billing
    if (salesSource === 'all' || salesSource === 'billing') {
      billingSales.forEach(b => {
        const patientName = b.patients
          ? `${b.patients.first_name || ''} ${b.patients.last_name || ''}`.trim()
          : 'Patient Invoice';

        const totalAmount = Number(b.amount || 0);
        const isPaid = b.payment_status === 'paid';
        const amountPaid = isPaid ? totalAmount : 0; // if pending, paid amount is 0 unless specified

        list.push({
          id: b.billing_id,
          reference_no: `INV-${String(b.billing_id).padStart(5, '0')}`,
          date: b.billing_date,
          customer_name: patientName,
          source: 'billing',
          sale_type: 'clinical',
          status: isPaid ? 'paid' : 'pending',
          amount_due: totalAmount,
          amount_paid: amountPaid,
          discount_val: Number(b.discount || 0),
          discount_type: 'fixed',
          original: b
        });
      });
    }

    // Sort by date descending
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [pharmacySales, billingSales, salesSource]);

  // Filtered by payment status & search
  const filteredSales = useMemo(() => {
    return unifiedSales.filter(item => {
      // Payment status filter
      if (paymentStatusFilter === 'paid' && item.status !== 'paid') return false;
      if (paymentStatusFilter === 'unpaid' && item.status !== 'pending') return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.customer_name?.toLowerCase().includes(q);
        const matchesRef = item.reference_no?.toLowerCase().includes(q);
        if (!matchesName && !matchesRef) return false;
      }

      return true;
    });
  }, [unifiedSales, paymentStatusFilter, searchQuery]);

  // Pagination state (limit to 10 records per page)
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, salesSource, paymentStatusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredSales.length / pageSize) || 1;
  const paginatedSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, page, pageSize]);

  // Financial KPIs
  const kpis = useMemo(() => {
    let grossRevenue = 0;
    let collectedAmount = 0;
    let totalDiscounts = 0;

    filteredSales.forEach(item => {
      grossRevenue += item.amount_due;
      collectedAmount += item.amount_paid;
      totalDiscounts += item.discount_val;
    });

    const unpaidAmount = Math.max(0, grossRevenue - collectedAmount);
    const totalCount = filteredSales.length;
    const avgTicket = totalCount > 0 ? grossRevenue / totalCount : 0;

    return {
      grossRevenue,
      collectedAmount,
      unpaidAmount,
      totalDiscounts,
      totalCount,
      avgTicket,
    };
  }, [filteredSales]);

  // Timeline Chart Data Aggregation
  const chartData = useMemo(() => {
    if (!filteredSales.length) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // If range is within 31 days, group by day
    if (dayDiff <= 31) {
      const dayMap = {};
      // Initialize days
      for (let i = 0; i < dayDiff; i++) {
        const curr = new Date(start);
        curr.setDate(start.getDate() + i);
        const iso = curr.toISOString().split('T')[0];
        const dayLabel = curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dayMap[iso] = { label: dayLabel, fullLabel: iso, value: 0, subCount: 0 };
      }

      filteredSales.forEach(s => {
        const d = s.date ? s.date.split('T')[0] : '';
        if (dayMap[d]) {
          dayMap[d].value += s.amount_due;
          dayMap[d].subCount += 1;
        }
      });

      return Object.values(dayMap);
    } else {
      // Group by Month
      const monthMap = {};
      filteredSales.forEach(s => {
        if (!s.date) return;
        const d = new Date(s.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const fullLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!monthMap[key]) {
          monthMap[key] = { label, fullLabel, value: 0, subCount: 0 };
        }
        monthMap[key].value += s.amount_due;
        monthMap[key].subCount += 1;
      });

      return Object.values(monthMap);
    }
  }, [filteredSales, startDate, endDate]);

  // Format Date Range string for printing
  const dateRangeStr = useMemo(() => {
    const s = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const e = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return startDate === endDate ? s : `${s} — ${e}`;
  }, [startDate, endDate]);

  // Print Report Handler
  const handlePrint = () => {
    let title = 'Sales Summary Report';
    if (periodPreset === 'daily') title = `Daily Sales Report (${startDate})`;
    else if (periodPreset === 'weekly') title = `Weekly Sales Audit (${dateRangeStr})`;
    else if (periodPreset === 'monthly') title = `Monthly Financial & Sales Report`;
    else if (periodPreset === 'yearly') title = `Annual Sales & Revenue Report`;

    printSalesReportDocument({
      reportTitle: title,
      periodType: periodPreset,
      dateRangeStr,
      kpis,
      salesData: filteredSales,
      topItems,
      salesSource,
      userProfile: profile
    });
  };

  // Excel (.xlsx) Export Handler with Auto-fit columns & design
  const handleExportExcel = () => {
    const filename = `sales_report_${startDate}_to_${endDate}`;
    const headers = [
      { key: 'dateFormatted', label: 'Date & Time' },
      { key: 'reference_no', label: 'Reference / Invoice #' },
      { key: 'customer_name', label: 'Customer / Patient' },
      { key: 'source_label', label: 'Revenue Stream' },
      { key: 'status_label', label: 'Payment Status' },
      { key: 'amount_due', label: 'Amount Due (PHP)' },
      { key: 'amount_paid', label: 'Amount Paid (PHP)' },
    ];
    const rows = filteredSales.map(s => ({
      dateFormatted: s.date ? new Date(s.date).toLocaleString() : '—',
      reference_no: s.reference_no,
      customer_name: s.customer_name,
      source_label: s.source === 'pharmacy' ? 'Pharmacy' : 'Clinic Billing',
      status_label: s.status.toUpperCase(),
      amount_due: s.amount_due,
      amount_paid: s.amount_paid,
    }));
    const summaryRows = [
      ['TOTALS', '', '', '', '', kpis.grossRevenue, kpis.collectedAmount],
      ['UNPAID BALANCE', '', '', '', '', kpis.unpaidAmount, '']
    ];
    exportToExcel({
      filename,
      sheetName: 'Sales Report',
      reportTitle: 'Sales & Revenue Summary Audit Report',
      metadata: [
        `Period: ${dateRangeStr}`,
        `Revenue Stream Scope: ${salesSource === 'all' ? 'All Revenue (Pharmacy & Billing)' : salesSource === 'pharmacy' ? 'Pharmacy Dispensing Sales' : 'Clinic Patient Billing'}`,
        `Total Transactions: ${filteredSales.length} | Generated: ${new Date().toLocaleString()}`
      ],
      headers,
      rows,
      summaryRows
    });
    toast.success('Sales report exported to Excel (.xlsx)!');
  };

  // CSV Export Handler with clean header layout
  const handleExportCSV = () => {
    const filename = `sales_report_${startDate}_to_${endDate}`;
    const headers = [
      { key: 'dateFormatted', label: 'Date & Time' },
      { key: 'reference_no', label: 'Reference / Invoice #' },
      { key: 'customer_name', label: 'Customer / Patient' },
      { key: 'source_label', label: 'Revenue Stream' },
      { key: 'status_label', label: 'Payment Status' },
      { key: 'amount_due', label: 'Amount Due (PHP)' },
      { key: 'amount_paid', label: 'Amount Paid (PHP)' },
    ];
    const rows = filteredSales.map(s => ({
      dateFormatted: s.date ? new Date(s.date).toLocaleString() : '—',
      reference_no: s.reference_no,
      customer_name: s.customer_name,
      source_label: s.source === 'pharmacy' ? 'Pharmacy' : 'Clinic Billing',
      status_label: s.status.toUpperCase(),
      amount_due: s.amount_due.toFixed(2),
      amount_paid: s.amount_paid.toFixed(2),
    }));
    const summaryRows = [
      ['TOTALS', '', '', '', '', kpis.grossRevenue.toFixed(2), kpis.collectedAmount.toFixed(2)],
      ['UNPAID BALANCE', '', '', '', '', kpis.unpaidAmount.toFixed(2), '']
    ];
    exportToCSV({
      filename,
      reportTitle: 'Sales & Revenue Summary Audit Report',
      metadata: [
        `Period: ${dateRangeStr}`,
        `Revenue Stream: ${salesSource === 'all' ? 'All Revenue (Pharmacy & Billing)' : salesSource}`,
        `Total Records: ${filteredSales.length} | Generated: ${new Date().toLocaleString()}`
      ],
      headers,
      rows,
      summaryRows
    });
    toast.success('Sales report exported to CSV!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Filter and Period Toolbar */}
      <div className="section-panel" style={{ margin: 0, padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          
          {/* Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', marginRight: '0.25rem' }}>
              Period:
            </span>
            {[
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'yearly', label: 'Yearly' },
              { id: 'custom', label: 'Custom' },
            ].map(p => (
              <button
                key={p.id}
                className={`btn ${periodPreset === p.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: periodPreset === p.id ? 700 : 500,
                  borderRadius: '6px',
                  backgroundColor: periodPreset === p.id ? 'var(--primary)' : '#F1F5F9',
                  color: periodPreset === p.id ? '#FFFFFF' : 'var(--text-dark)',
                  border: 'none',
                }}
                onClick={() => applyPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Pickers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div className="input-wrapper" style={{ minWidth: '140px' }}>
              <Calendar className="input-icon" size={15} />
              <input
                type="date"
                className="form-input"
                style={{ paddingLeft: '2.2rem', paddingRight: '0.5rem', fontSize: '0.82rem', height: '36px' }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
              />
            </div>
            <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>to</span>
            <div className="input-wrapper" style={{ minWidth: '140px' }}>
              <Calendar className="input-icon" size={15} />
              <input
                type="date"
                className="form-input"
                style={{ paddingLeft: '2.2rem', paddingRight: '0.5rem', fontSize: '0.82rem', height: '36px' }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
              />
            </div>

            {/* Print & Export Actions */}
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '36px', fontSize: '0.82rem', padding: '0 0.9rem' }}
              onClick={handlePrint}
              title="Print formatted sales report"
            >
              <Printer size={16} /> Print
            </button>
            <button
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '36px', fontSize: '0.82rem', padding: '0 0.85rem', backgroundColor: '#F1F5F9' }}
              onClick={handleExportExcel}
              title="Export to Excel (.xlsx) with auto-fit columns"
            >
              <FileSpreadsheet size={16} color="#059669" /> Excel
            </button>
            <button
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '36px', fontSize: '0.82rem', padding: '0 0.85rem', backgroundColor: '#F1F5F9' }}
              onClick={handleExportCSV}
              title="Export to CSV (.csv) with clean design layout"
            >
              <Download size={16} /> CSV
            </button>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', alignItems: 'center' }}>
          {/* Revenue Stream Scope */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontWeight: 600 }}>Stream:</span>
            <select
              className="form-input filter-select"
              style={{ fontSize: '0.82rem', padding: '0.35rem 1.8rem 0.35rem 0.75rem', height: '34px', width: 'auto' }}
              value={salesSource}
              onChange={(e) => setSalesSource(e.target.value)}
            >
              <option value="all">All Revenue (Pharmacy & Billing)</option>
              <option value="pharmacy">Pharmacy Sales Only</option>
              <option value="billing">Clinic Patient Billing Only</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontWeight: 600 }}>Payment:</span>
            <select
              className="form-input filter-select"
              style={{ fontSize: '0.82rem', padding: '0.35rem 1.8rem 0.35rem 0.75rem', height: '34px', width: 'auto' }}
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Fully Paid / Completed</option>
              <option value="unpaid">Pending / Unpaid Only</option>
            </select>
          </div>

          {/* Search within records */}
          <div className="input-wrapper" style={{ flex: 1, minWidth: '220px', maxWidth: '380px', marginLeft: 'auto' }}>
            <Search className="input-icon" size={15} />
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.82rem', height: '34px', paddingLeft: '2.2rem' }}
              placeholder="Search reference # or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Gross Revenue"
          value={`₱${kpis.grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`Across ${kpis.totalCount} transactions`}
          icon={TrendingUp}
          color="teal"
        />
        <StatCard
          title="Total Collected"
          value={`₱${kpis.collectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Realized cash payments"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Unpaid / Balance"
          value={`₱${kpis.unpaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Outstanding receivables"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Average Ticket"
          value={`₱${kpis.avgTicket.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Avg sale per transaction"
          icon={Receipt}
          color="primary"
        />
        <StatCard
          title="Discounts Given"
          value={`₱${kpis.totalDiscounts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Promotional / Senior / PWD"
          icon={Tag}
          color="rose"
        />
      </div>

      {/* Visual Analytics Grid: Timeline Chart + Top Selling Items */}
      <div style={{ display: 'grid', gridTemplateColumns: topItems.length > 0 ? '2fr 1.2fr' : '1fr', gap: '1.25rem' }}>
        
        {/* Timeline Bar Chart */}
        <div className="section-panel" style={{ margin: 0, padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 className="section-title" style={{ fontSize: '1rem', margin: 0 }}>
                Revenue Distribution Trend
              </h2>
              <p className="card-subtitle" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                Sales volume for {dateRangeStr}
              </p>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              ₱{kpis.grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} TOTAL
            </div>
          </div>

          <SimpleBarChart data={chartData} height={200} />
        </div>

        {/* Top Selling Products / Medicines */}
        {topItems.length > 0 && (
          <div className="section-panel" style={{ margin: 0, padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 className="section-title" style={{ fontSize: '1rem', margin: 0 }}>
                  Top Selling Products
                </h2>
                <p className="card-subtitle" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                  Ranked by revenue generated
                </p>
              </div>
              <Sparkles size={16} color="var(--primary)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '220px' }}>
              {topItems.slice(0, 6).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: idx === 0 ? '#FEF08A' : idx === 1 ? '#E2E8F0' : '#F1F5F9',
                        color: idx === 0 ? '#854D0E' : 'var(--text-gray)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>
                        {item.quantity} units dispensed
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F766E' }}>
                    ₱{item.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Itemized Sales Ledger Table */}
      <div className="section-panel" style={{ margin: 0, padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 className="section-title" style={{ fontSize: '1rem', margin: 0 }}>
              Itemized Sales Ledger
            </h2>
            <p className="card-subtitle" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
              Showing {filteredSales.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredSales.length)} of {filteredSales.length} transaction records
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-gray)' }}>
            Loading sales data...
          </div>
        ) : filteredSales.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-gray)' }}>
            No sales records found for the selected dates and filters.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                    <th>Date & Time</th>
                    <th>Reference #</th>
                    <th>Customer / Patient</th>
                    <th>Stream</th>
                    <th>Payment Status</th>
                    <th style={{ textAlign: 'right' }}>Amount Due</th>
                    <th style={{ textAlign: 'right' }}>Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSales.map((sale, index) => {
                    const globalIdx = (page - 1) * pageSize + index + 1;
                    const dateStr = sale.date
                      ? new Date(sale.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';

                    const isPaid = sale.status === 'paid';

                    return (
                      <tr key={`${sale.source}-${sale.id}`}>
                        <td style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.75rem' }}>
                          {globalIdx}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{dateStr}</td>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {sale.reference_no}
                        </td>
                        <td style={{ fontWeight: 500 }}>{sale.customer_name}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: sale.source === 'pharmacy' ? '#EEF2FF' : '#E0F2FE',
                              color: sale.source === 'pharmacy' ? '#4338CA' : '#0369A1',
                              fontSize: '0.72rem',
                            }}
                          >
                            {sale.source === 'pharmacy' ? 'Pharmacy' : 'Clinic Bill'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${isPaid ? 'badge-green' : 'badge-amber'}`}
                            style={{
                              backgroundColor: isPaid ? '#DCFCE7' : '#FEF3C7',
                              color: isPaid ? '#15803D' : '#B45309',
                              fontSize: '0.72rem',
                            }}
                          >
                            {sale.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ₱{sale.amount_due.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#047857' }}>
                          ₱{sale.amount_paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: '1.25rem' }}>
                <button
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    className={`page-btn ${page === num ? 'active' : ''}`}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  className="page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
