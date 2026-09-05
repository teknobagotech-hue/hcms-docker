import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserRound, ShieldPlus, Pill, FileSignature, Receipt, ShieldCheck, Library, Truck, Package, UserCog, Menu, ShoppingCart, Activity, Shield, BarChart3, TrendingUp, Boxes } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { profile, role, hasRole } = useAuth();

  const menuGroups = [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', icon: <LayoutDashboard className="sidebar-icon" />, path: '/', roles: ['*'] },
        { name: 'Departments', icon: <Users className="sidebar-icon" />, path: '/departments', roles: ['admin', 'doctor'] },
        { name: 'Doctors', icon: <UserRound className="sidebar-icon" />, path: '/doctors', roles: ['admin', 'doctor', 'receptionist'] },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { name: 'User Management', icon: <UserCog className="sidebar-icon" />, path: '/users', roles: ['admin'] },
        { name: 'My Profile', icon: <ShieldCheck className="sidebar-icon" />, path: '/profile', roles: ['*'] },
      ],
    },
    {
      title: 'CLINICAL',
      items: [
        { name: 'Patients', icon: <UserRound className="sidebar-icon" />, path: '/patients', roles: ['admin', 'doctor', 'nurse', 'receptionist', 'lab_technician', 'staff'] },
        { name: 'Document Scanner', icon: <FileSignature className="sidebar-icon" />, path: '/patients/scan', roles: ['admin', 'doctor', 'nurse'] },
      ],
    },
    {
      title: 'PHARMACY & INVENTORY',
      items: [
        { name: 'Pharmacy Sales', icon: <ShoppingCart className="sidebar-icon" />, path: '/pharmacy/sales', roles: ['admin', 'pharmacist'] },
        { name: 'Inventory Items', icon: <Package className="sidebar-icon" />, path: '/inventory/items', roles: ['admin', 'pharmacist'] },
        { name: 'Medicines', icon: <Pill className="sidebar-icon" />, path: '/inventory/medicines', roles: ['admin', 'pharmacist', 'doctor'] },
        { name: 'Categories', icon: <Library className="sidebar-icon" />, path: '/inventory/categories', roles: ['admin', 'pharmacist'] },
        { name: 'Stock Receipts', icon: <Receipt className="sidebar-icon" />, path: '/inventory/receipts', roles: ['admin', 'pharmacist'] },
        { name: 'Suppliers', icon: <Truck className="sidebar-icon" />, path: '/inventory/suppliers', roles: ['admin', 'pharmacist'] },
        { name: 'Prescriptions', icon: <FileSignature className="sidebar-icon" />, path: '/pharmacy/prescriptions', roles: ['admin', 'pharmacist', 'doctor'] },
      ],
    },
    {
      title: 'BILLING & INSURANCE',
      items: [
        { name: 'Billing Records', icon: <Receipt className="sidebar-icon" />, path: '/billing/records', roles: ['admin', 'receptionist'] },
        { name: 'Insurance Providers', icon: <ShieldPlus className="sidebar-icon" />, path: '/billing/insurance', roles: ['admin', 'receptionist'] },
        { name: 'Patient Insurance', icon: <ShieldCheck className="sidebar-icon" />, path: '/billing/patient-insurance', roles: ['admin', 'receptionist', 'doctor'] },
      ],
    },
    {
      title: 'REPORTS & ANALYTICS',
      items: [
        { name: 'Sales Reports', icon: <TrendingUp className="sidebar-icon" />, path: '/reports/sales', roles: ['admin', 'pharmacist', 'doctor', 'receptionist'] },
        { name: 'Inventory Reports', icon: <Boxes className="sidebar-icon" />, path: '/reports/inventory', roles: ['admin', 'pharmacist', 'doctor'] },
      ],
    }
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Activity size={24} />
          </div>
          <span className="sidebar-logo-text">MedDesk</span>
        </div>
        <button className="sidebar-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          <Menu size={20} />
        </button>
      </div>
      
      {menuGroups.map((group, index) => {
        // Filter visible items based on current role
        const visibleItems = group.items.filter(item => 
          item.roles.includes('*') || hasRole(item.roles)
        );

        if (visibleItems.length === 0) return null;

        return (
          <div className="sidebar-section" key={index}>
            <div className="sidebar-heading">{group.title}</div>
            {visibleItems.map((item, i) => {
              const isActive = item.path ? location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) : false;
              
              return (
                <Link 
                  to={item.path} 
                  className={`sidebar-item ${isActive ? 'active' : ''}`} 
                  key={i} 
                  onClick={onClose} 
                  title={isCollapsed ? item.name : ''}
                >
                  {item.icon}
                  <span className="sidebar-item-text">{item.name}</span>
                </Link>
              );
            })}
          </div>
        );
      })}

      {/* User Role Card at Bottom */}
      <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', backgroundColor: 'var(--primary-light, #DBEAFE)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={18} />
          </div>
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name || 'User'}
              </div>
              <span className="badge" style={{ backgroundColor: '#E2E8F0', color: '#334155', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', textTransform: 'uppercase' }}>
                {role}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
