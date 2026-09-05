import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Package,
  AlertTriangle,
  Clock,
  Layers,
  Search,
  Printer,
  Download,
  Boxes,
  Tag,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import { StatCard, exportToCSV, exportToExcel } from './ReportsComponents';
import { printInventoryReportDocument } from '../../utils/reportPrintTemplates';
import '../../index.css';

export default function InventoryReport() {
  const { profile } = useAuth();

  // Active view: 'all', 'low_stock', 'expiring', 'categories'
  const [viewType, setViewType] = useState('all');

  // Search and Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all'); // 'all', 'in_stock', 'low_stock', 'out_of_stock'

  // Data states
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expiringBatches, setExpiringBatches] = useState([]);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Categories
      const { data: catData } = await supabase
        .from('inventory_categories')
        .select('category_id, category_name')
        .order('category_name');
      setCategories(catData || []);

      // 2. Fetch Inventory Items
      const { data: itemsData, error: itemsErr } = await supabase
        .from('inventory_items')
        .select('*, inventory_categories(category_name)')
        .eq('status', 'active')
        .order('item_name');

      if (itemsErr) {
        console.error('Error fetching inventory items:', itemsErr);
        toast.error('Failed to load inventory items');
      } else {
        setItems(itemsData || []);
      }

      // 3. Fetch Stock Receipts Items with Expiry Date
      const { data: batchData, error: batchErr } = await supabase
        .from('stock_receipt_items')
        .select('receipt_item_id, item_id, batch_number, expiry_date, quantity_received, inventory_items(item_name, category_id, inventory_categories(category_name))')
        .not('expiry_date', 'is', null)
        .order('expiry_date', { ascending: true });

      if (batchErr) {
        console.error('Error fetching expiring batches:', batchErr);
      } else if (batchData) {
        const now = new Date();
        const enrichedBatches = batchData.map(b => {
          const exp = new Date(b.expiry_date);
          const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
          return {
            ...b,
            item_name: b.inventory_items?.item_name || `Item #${b.item_id}`,
            category_name: b.inventory_items?.inventory_categories?.category_name || 'General',
            daysUntil: diffDays,
          };
        });
        setExpiringBatches(enrichedBatches);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error loading inventory report data');
    } finally {
      setLoading(false);
    }
  };

  // KPIs Calculations
  const kpis = useMemo(() => {
    let totalValuation = 0;
    let totalUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let healthyCount = 0;

    items.forEach(item => {
      const qty = Number(item.quantity_in_stock || 0);
      const reorder = Number(item.reorder_level || 0);
      const price = Number(item.price || item.unit_cost || 0);

      totalValuation += qty * price;
      totalUnits += qty;

      if (qty === 0) {
        outOfStockCount += 1;
      } else if (qty <= reorder) {
        lowStockCount += 1;
      } else {
        healthyCount += 1;
      }
    });

    const expiringCount = expiringBatches.filter(b => b.daysUntil <= 60).length;

    return {
      totalValuation,
      totalUnits,
      totalItems: items.length,
      healthyCount,
      lowStockCount,
      outOfStockCount,
      expiringCount,
    };
  }, [items, expiringBatches]);

  // Category Breakdown Summary
  const categoryBreakdown = useMemo(() => {
    const map = {};
    items.forEach(item => {
      const catId = item.category_id || 'unassigned';
      const catName = item.inventory_categories?.category_name || 'Unassigned Category';
      const qty = Number(item.quantity_in_stock || 0);
      const price = Number(item.price || item.unit_cost || 0);

      if (!map[catId]) {
        map[catId] = {
          id: catId,
          name: catName,
          itemCount: 0,
          totalUnits: 0,
          totalValue: 0,
        };
      }
      map[catId].itemCount += 1;
      map[catId].totalUnits += qty;
      map[catId].totalValue += qty * price;
    });

    return Object.values(map).sort((a, b) => b.totalValue - a.totalValue);
  }, [items]);

  // Filtered Items for Display
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const qty = Number(item.quantity_in_stock || 0);
      const reorder = Number(item.reorder_level || 0);

      // View Type filtering
      if (viewType === 'low_stock') {
        if (qty > reorder) return false;
      }

      // Stock status dropdown filtering
      if (stockStatusFilter === 'in_stock' && qty <= reorder) return false;
      if (stockStatusFilter === 'low_stock' && (qty === 0 || qty > reorder)) return false;
      if (stockStatusFilter === 'out_of_stock' && qty !== 0) return false;

      // Category filter
      if (selectedCategory !== 'all' && String(item.category_id) !== String(selectedCategory)) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.item_name?.toLowerCase().includes(q);
        const matchesSKU = item.product_number?.toLowerCase().includes(q);
        const matchesSerial = item.serial_number?.toLowerCase().includes(q);
        if (!matchesName && !matchesSKU && !matchesSerial) return false;
      }

      return true;
    });
  }, [items, viewType, stockStatusFilter, selectedCategory, searchQuery]);

  // Filtered Expiring Batches
  const filteredBatches = useMemo(() => {
    return expiringBatches.filter(b => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = b.item_name?.toLowerCase().includes(q);
        const matchesBatch = b.batch_number?.toLowerCase().includes(q);
        if (!matchesName && !matchesBatch) return false;
      }
      return true;
    });
  }, [expiringBatches, searchQuery]);

  // Pagination state (limit to 10 records per page)
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [viewType, selectedCategory, stockStatusFilter, searchQuery]);

  const activeTotalCount = viewType === 'expiring' ? filteredBatches.length : filteredItems.length;
  const totalPages = Math.ceil(activeTotalCount / pageSize) || 1;

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const paginatedBatches = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBatches.slice(start, start + pageSize);
  }, [filteredBatches, page, pageSize]);

  // Print Report Handler
  const handlePrint = () => {
    let title = 'Master Inventory Valuation & Stock Report';
    if (viewType === 'low_stock') title = 'Low Stock & Reorder Advice Sheet';
    else if (viewType === 'expiring') title = 'Batch Expiration Control & Audit Sheet';
    else if (viewType === 'categories') title = 'Inventory Valuation by Category';

    printInventoryReportDocument({
      reportTitle: title,
      viewType,
      kpis,
      itemsData: filteredItems,
      categoryBreakdown,
      expiringBatches: filteredBatches,
      userProfile: profile
    });
  };

  // Excel (.xlsx) Export Handler with Auto-fit columns & design
  const handleExportExcel = () => {
    const today = new Date().toISOString().split('T')[0];
    if (viewType === 'expiring') {
      const filename = `expiring_batches_report_${today}`;
      const headers = [
        { key: 'item_name', label: 'Product / Medicine Name' },
        { key: 'category_name', label: 'Category' },
        { key: 'batch_number', label: 'Batch / Lot #' },
        { key: 'quantity_received', label: 'Quantity' },
        { key: 'expiry_date', label: 'Expiry Date' },
        { key: 'daysUntil', label: 'Days Until Expiry' },
        { key: 'urgency', label: 'Urgency Status' },
      ];
      const rows = filteredBatches.map(b => ({
        item_name: b.item_name,
        category_name: b.category_name,
        batch_number: b.batch_number || '—',
        quantity_received: b.quantity_received,
        expiry_date: b.expiry_date,
        daysUntil: b.daysUntil,
        urgency: b.daysUntil < 0 ? 'EXPIRED' : b.daysUntil <= 30 ? 'CRITICAL' : b.daysUntil <= 90 ? 'EXPIRING SOON' : 'HEALTHY',
      }));
      exportToExcel({
        filename,
        sheetName: 'Expiring Batches',
        reportTitle: 'Batch Expiration Control Audit Sheet',
        metadata: [
          `Total Batches Recorded: ${filteredBatches.length}`,
          `Expiring Soon / Critical: ${kpis.expiringCount}`,
          `Generated: ${new Date().toLocaleString()}`
        ],
        headers,
        rows
      });
    } else {
      const filename = `inventory_stock_report_${today}`;
      const headers = [
        { key: 'item_name', label: 'Product / Medicine Name' },
        { key: 'category', label: 'Category' },
        { key: 'sku', label: 'SKU / Product #' },
        { key: 'quantity_in_stock', label: 'Quantity in Stock' },
        { key: 'unit', label: 'Unit' },
        { key: 'reorder_level', label: 'Reorder Level' },
        { key: 'unit_price', label: 'Unit Price (PHP)' },
        { key: 'total_valuation', label: 'Total Valuation (PHP)' },
        { key: 'status', label: 'Stock Health Status' },
      ];
      const rows = filteredItems.map(item => {
        const qty = Number(item.quantity_in_stock || 0);
        const price = Number(item.price || item.unit_cost || 0);
        const reorder = Number(item.reorder_level || 0);
        return {
          item_name: item.item_name,
          category: item.inventory_categories?.category_name || 'General',
          sku: item.product_number || '',
          quantity_in_stock: qty,
          unit: item.unit || 'units',
          reorder_level: reorder,
          unit_price: price,
          total_valuation: qty * price,
          status: qty === 0 ? 'Out of Stock' : qty <= reorder ? 'Low Stock' : 'In Stock',
        };
      });
      const summaryRows = [
        ['TOTAL INVENTORY VALUATION', '', '', '', '', '', '', kpis.totalValuation, ''],
        ['TOTAL UNIQUE SKUs', '', '', kpis.totalItems, '', '', '', '', '']
      ];
      exportToExcel({
        filename,
        sheetName: 'Inventory Valuation',
        reportTitle: viewType === 'low_stock' ? 'Low Stock & Critical Reorder Advice Sheet' : 'Master Inventory Valuation & Stock Report',
        metadata: [
          `Report Scope: ${viewType === 'low_stock' ? 'Critical & Low Stock Items' : 'All Inventory Assets'}`,
          `Total Unique SKUs: ${filteredItems.length} | Total Asset Valuation: ₱${kpis.totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          `Generated: ${new Date().toLocaleString()}`
        ],
        headers,
        rows,
        summaryRows
      });
    }
    toast.success('Inventory report exported to Excel (.xlsx)!');
  };

  // CSV Export Handler with clean header design layout
  const handleExportCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    if (viewType === 'expiring') {
      const filename = `expiring_batches_report_${today}`;
      const headers = [
        { key: 'item_name', label: 'Product / Medicine Name' },
        { key: 'category_name', label: 'Category' },
        { key: 'batch_number', label: 'Batch / Lot #' },
        { key: 'quantity_received', label: 'Quantity' },
        { key: 'expiry_date', label: 'Expiry Date' },
        { key: 'daysUntil', label: 'Days Until Expiry' },
        { key: 'urgency', label: 'Urgency Status' },
      ];
      const rows = filteredBatches.map(b => ({
        item_name: b.item_name,
        category_name: b.category_name,
        batch_number: b.batch_number || '—',
        quantity_received: b.quantity_received,
        expiry_date: b.expiry_date,
        daysUntil: b.daysUntil,
        urgency: b.daysUntil < 0 ? 'EXPIRED' : b.daysUntil <= 30 ? 'CRITICAL' : b.daysUntil <= 90 ? 'EXPIRING SOON' : 'HEALTHY',
      }));
      exportToCSV({
        filename,
        reportTitle: 'Batch Expiration Control Audit Sheet',
        metadata: [
          `Total Batches Recorded: ${filteredBatches.length}`,
          `Expiring Soon / Critical: ${kpis.expiringCount}`,
          `Generated: ${new Date().toLocaleString()}`
        ],
        headers,
        rows
      });
    } else {
      const filename = `inventory_stock_report_${today}`;
      const headers = [
        { key: 'item_name', label: 'Product / Medicine Name' },
        { key: 'category', label: 'Category' },
        { key: 'sku', label: 'SKU / Product #' },
        { key: 'quantity_in_stock', label: 'Quantity In Stock' },
        { key: 'unit', label: 'Unit' },
        { key: 'reorder_level', label: 'Reorder Level' },
        { key: 'unit_price', label: 'Unit Price (PHP)' },
        { key: 'total_valuation', label: 'Total Valuation (PHP)' },
        { key: 'status', label: 'Stock Health Status' },
      ];
      const rows = filteredItems.map(item => {
        const qty = Number(item.quantity_in_stock || 0);
        const price = Number(item.price || item.unit_cost || 0);
        const reorder = Number(item.reorder_level || 0);
        return {
          item_name: item.item_name,
          category: item.inventory_categories?.category_name || 'General',
          sku: item.product_number || '',
          quantity_in_stock: qty,
          unit: item.unit || '',
          reorder_level: reorder,
          unit_price: price.toFixed(2),
          total_valuation: (qty * price).toFixed(2),
          status: qty === 0 ? 'Out of Stock' : qty <= reorder ? 'Low Stock' : 'In Stock',
        };
      });
      const summaryRows = [
        ['TOTAL INVENTORY VALUATION', '', '', '', '', '', '', kpis.totalValuation.toFixed(2), '']
      ];
      exportToCSV({
        filename,
        reportTitle: viewType === 'low_stock' ? 'Low Stock & Critical Reorder Advice Sheet' : 'Master Inventory Valuation & Stock Report',
        metadata: [
          `Report Scope: ${viewType === 'low_stock' ? 'Critical & Low Stock Items' : 'All Inventory Assets'}`,
          `Total SKUs: ${filteredItems.length} | Valuation: ₱${kpis.totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          `Generated: ${new Date().toLocaleString()}`
        ],
        headers,
        rows,
        summaryRows
      });
    }
    toast.success('Inventory report exported to CSV!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Filter and View Mode Toolbar */}
      <div className="section-panel" style={{ margin: 0, padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          
          {/* View Mode Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-gray)', textTransform: 'uppercase', marginRight: '0.25rem' }}>
              Report View:
            </span>
            {[
              { id: 'all', label: 'All Stock & Valuation', icon: Boxes },
              { id: 'low_stock', label: 'Low Stock Alerts', icon: AlertTriangle, count: kpis.lowStockCount + kpis.outOfStockCount },
              { id: 'expiring', label: 'Batch Expirations', icon: Clock, count: kpis.expiringCount },
              { id: 'categories', label: 'Category Summary', icon: Tag },
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = viewType === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: '6px',
                    backgroundColor: isActive ? 'var(--primary)' : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : 'var(--text-dark)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                  onClick={() => setViewType(tab.id)}
                >
                  <TabIcon size={14} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      style={{
                        padding: '0.1rem 0.35rem',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#FEE2E2',
                        color: isActive ? '#FFFFFF' : '#DC2626',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Buttons: Print & Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '36px', fontSize: '0.82rem', padding: '0 0.9rem' }}
              onClick={handlePrint}
              title="Print formatted inventory report"
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
              title="Export inventory to CSV"
            >
              <Download size={16} /> CSV
            </button>
          </div>
        </div>

        {/* Secondary Filter Row (Only for item-based views) */}
        {viewType !== 'categories' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', alignItems: 'center' }}>
            
            {viewType !== 'expiring' && (
              <>
                {/* Category Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontWeight: 600 }}>Category:</span>
                  <select
                    className="form-input filter-select"
                    style={{ fontSize: '0.82rem', padding: '0.35rem 1.8rem 0.35rem 0.75rem', height: '34px', width: 'auto' }}
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(c => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock Status Filter */}
                {viewType === 'all' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontWeight: 600 }}>Stock Status:</span>
                    <select
                      className="form-input filter-select"
                      style={{ fontSize: '0.82rem', padding: '0.35rem 1.8rem 0.35rem 0.75rem', height: '34px', width: 'auto' }}
                      value={stockStatusFilter}
                      onChange={(e) => setStockStatusFilter(e.target.value)}
                    >
                      <option value="all">All Stock Levels</option>
                      <option value="in_stock">Healthy (In Stock)</option>
                      <option value="low_stock">Low Stock Warning</option>
                      <option value="out_of_stock">Critical Out of Stock</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Search Input */}
            <div className="input-wrapper" style={{ flex: 1, minWidth: '220px', maxWidth: '380px', marginLeft: 'auto' }}>
              <Search className="input-icon" size={15} />
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.82rem', height: '34px', paddingLeft: '2.2rem' }}
                placeholder={viewType === 'expiring' ? "Search batch or item name..." : "Search item name or SKU..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Total Valuation"
          value={`₱${kpis.totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Total on-hand asset worth"
          icon={Boxes}
          color="teal"
        />
        <StatCard
          title="Unique SKUs"
          value={kpis.totalItems.toLocaleString()}
          subtitle={`${kpis.totalUnits.toLocaleString()} total units on shelf`}
          icon={Layers}
          color="primary"
        />
        <StatCard
          title="Low Stock Items"
          value={kpis.lowStockCount.toLocaleString()}
          subtitle="Requires reorder soon"
          icon={TrendingDown}
          color="amber"
          badgeText={kpis.lowStockCount > 0 ? "REORDER" : "NORMAL"}
        />
        <StatCard
          title="Out of Stock"
          value={kpis.outOfStockCount.toLocaleString()}
          subtitle="Critical zero inventory"
          icon={AlertTriangle}
          color="rose"
          badgeText={kpis.outOfStockCount > 0 ? "URGENT" : "CLEAR"}
        />
        <StatCard
          title="Expiring Batches"
          value={kpis.expiringCount.toLocaleString()}
          subtitle="Within 60 days / expired"
          icon={Clock}
          color="indigo"
        />
      </div>

      {/* Main Content Area based on ViewType */}
      {viewType === 'categories' ? (
        /* Categories Summary Table & Visual Breakdown */
        <div className="section-panel" style={{ margin: 0, padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 className="section-title" style={{ fontSize: '1rem', margin: 0 }}>
              Inventory Valuation by Category
            </h2>
            <p className="card-subtitle" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
              Financial distribution of on-hand inventory across departments
            </p>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                  <th>Category Name</th>
                  <th style={{ textAlign: 'center' }}>Active SKUs</th>
                  <th style={{ textAlign: 'center' }}>Total Units on Hand</th>
                  <th style={{ textAlign: 'right' }}>Total Valuation (PHP)</th>
                  <th style={{ textAlign: 'right' }}>% of Total Value</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map((cat, idx) => {
                  const percentOfTotal = kpis.totalValuation > 0
                    ? ((cat.totalValue / kpis.totalValuation) * 100).toFixed(1)
                    : '0.0';

                  return (
                    <tr key={cat.id}>
                      <td style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.75rem' }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontWeight: 600 }}>{cat.name}</td>
                      <td style={{ textAlign: 'center' }}>{cat.itemCount} items</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{cat.totalUnits.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F766E' }}>
                        ₱{cat.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{percentOfTotal}%</span>
                          <div style={{ width: '60px', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentOfTotal}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewType === 'expiring' ? (
        /* Expiring Batches Table */
        <div className="section-panel" style={{ margin: 0, padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 className="section-title" style={{ fontSize: '1rem', margin: 0 }}>
              Batch Expiration Control List
            </h2>
            <p className="card-subtitle" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
              Showing {filteredBatches.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredBatches.length)} of {filteredBatches.length} batches
            </p>
          </div>

          {filteredBatches.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-gray)' }}>
              No expiring batches found.
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                      <th>Product / Medicine Name</th>
                      <th>Category</th>
                      <th>Batch / Lot #</th>
                      <th style={{ textAlign: 'center' }}>Quantity</th>
                      <th style={{ textAlign: 'center' }}>Expiry Date</th>
                      <th style={{ textAlign: 'center' }}>Status / Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBatches.map((b, idx) => {
                      const globalIdx = (page - 1) * pageSize + idx + 1;
                      const expiryFormatted = b.expiry_date
                        ? new Date(b.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—';

                      const isExpired = b.daysUntil < 0;
                      const isCritical = !isExpired && b.daysUntil <= 30;
                      const isWarning = !isExpired && b.daysUntil <= 90;

                      return (
                        <tr key={b.receipt_item_id}>
                          <td style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.75rem' }}>
                            {globalIdx}
                          </td>
                          <td style={{ fontWeight: 600 }}>{b.item_name}</td>
                          <td>{b.category_name}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{b.batch_number || '—'}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{b.quantity_received}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.82rem' }}>{expiryFormatted}</td>
                          <td style={{ textAlign: 'center' }}>
                            {isExpired ? (
                              <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 700, fontSize: '0.72rem' }}>
                                EXPIRED ({Math.abs(b.daysUntil)}d ago)
                              </span>
                            ) : isCritical ? (
                              <span className="badge" style={{ backgroundColor: '#FFEDD5', color: '#9A3412', fontWeight: 700, fontSize: '0.72rem' }}>
                                CRITICAL ({b.daysUntil} days left)
                              </span>
                            ) : isWarning ? (
                              <span className="badge" style={{ backgroundColor: '#FEF9C3', color: '#854D0E', fontWeight: 700, fontSize: '0.72rem' }}>
                                EXPIRING SOON ({b.daysUntil}d)
                              </span>
                            ) : (
                              <span className="badge" style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '0.72rem' }}>
                                HEALTHY ({b.daysUntil}d)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Batches Pagination */}
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
      ) : (
        /* Inventory Items Ledger (All or Low Stock) */
        <div className="section-panel" style={{ margin: 0, padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 className="section-title" style={{ fontSize: '1rem', margin: 0 }}>
                {viewType === 'low_stock' ? 'Low Stock & Critical Reorder Sheet' : 'Comprehensive Inventory Ledger'}
              </h2>
              <p className="card-subtitle" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                Showing {filteredItems.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length} items
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-gray)' }}>
              Loading inventory records...
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-gray)' }}>
              No inventory items found matching your current filter.
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                      <th>Product / Medicine Name</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Quantity in Stock</th>
                      <th style={{ textAlign: 'center' }}>Reorder Level</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total Valuation</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item, index) => {
                      const globalIdx = (page - 1) * pageSize + index + 1;
                      const qty = Number(item.quantity_in_stock || 0);
                      const reorder = Number(item.reorder_level || 0);
                      const price = Number(item.price || item.unit_cost || 0);
                      const valuation = qty * price;

                      const isOut = qty === 0;
                      const isLow = !isOut && qty <= reorder;

                      return (
                        <tr key={item.item_id}>
                          <td style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.75rem' }}>
                            {globalIdx}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.item_name}</div>
                            {item.product_number && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>
                                SKU: {item.product_number}
                              </div>
                            )}
                          </td>
                          <td>{item.inventory_categories?.category_name || 'General'}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: isOut ? '#DC2626' : isLow ? '#D97706' : 'var(--text-dark)' }}>
                            {qty} {item.unit || 'units'}
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--text-gray)' }}>
                            {reorder} {item.unit || ''}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            ₱{price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F766E' }}>
                            ₱{valuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isOut ? (
                              <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 700, fontSize: '0.72rem' }}>
                                OUT OF STOCK
                              </span>
                            ) : isLow ? (
                              <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 700, fontSize: '0.72rem' }}>
                                LOW STOCK
                              </span>
                            ) : (
                              <span className="badge" style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '0.72rem' }}>
                                IN STOCK
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Items Pagination */}
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
      )}

    </div>
  );
}
