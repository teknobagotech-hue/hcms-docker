import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Boxes } from 'lucide-react';
import SalesReport from './SalesReport';
import InventoryReport from './InventoryReport';
import '../../index.css';

export default function ReportsHub({ defaultTab }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from prop or URL
  const [activeTab, setActiveTab] = useState(() => {
    if (defaultTab) return defaultTab;
    if (location.pathname.includes('inventory')) return 'inventory';
    return 'sales';
  });

  useEffect(() => {
    if (location.pathname.includes('inventory')) {
      setActiveTab('inventory');
    } else if (location.pathname.includes('sales')) {
      setActiveTab('sales');
    } else if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [location.pathname, defaultTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/reports/${tabId}`);
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '1280px' }}>
        
        {/* Page Header */}
        <div className="page-header-flex" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h1 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BarChart3 className="text-primary" size={26} />
              Reports & Analytics
            </h1>
            <p className="card-subtitle">
              Audits, financial summaries, sales performance, and stock valuation
            </p>
          </div>

          {/* Module Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F1F5F9',
              padding: '0.25rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              className="btn"
              onClick={() => handleTabChange('sales')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.15rem',
                fontSize: '0.875rem',
                fontWeight: activeTab === 'sales' ? 700 : 500,
                backgroundColor: activeTab === 'sales' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'sales' ? 'var(--primary)' : 'var(--text-gray)',
                borderRadius: '6px',
                border: 'none',
                boxShadow: activeTab === 'sales' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <TrendingUp size={16} />
              <span>Sales Reports</span>
            </button>

            <button
              className="btn"
              onClick={() => handleTabChange('inventory')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.15rem',
                fontSize: '0.875rem',
                fontWeight: activeTab === 'inventory' ? 700 : 500,
                backgroundColor: activeTab === 'inventory' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'inventory' ? 'var(--primary)' : 'var(--text-gray)',
                borderRadius: '6px',
                border: 'none',
                boxShadow: activeTab === 'inventory' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Boxes size={16} />
              <span>Inventory & Stocks</span>
            </button>
          </div>
        </div>

        {/* Tab Content Rendering */}
        {activeTab === 'sales' ? (
          <SalesReport />
        ) : (
          <InventoryReport />
        )}

      </div>
    </div>
  );
}
