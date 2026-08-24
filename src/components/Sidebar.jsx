import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserRound, Calendar, FileText, Activity, ShieldPlus, Pill, FileSignature, Receipt, ShieldCheck, FileHeart, Library, Blocks, Truck, Package, MonitorSmartphone, BarChart3, UserCog, Settings, Menu, ShoppingCart } from 'lucide-react';

export default function Sidebar({ isOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const menuGroups = [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', icon: <LayoutDashboard className="sidebar-icon" />, path: '/' },
        { name: 'Departments', icon: <Users className="sidebar-icon" />, path: '/departments' },
        { name: 'Doctors', icon: <UserRound className="sidebar-icon" />, path: '/doctors' },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { name: 'User Management', icon: <UserCog className="sidebar-icon" />, path: '/users' },
        { name: 'My Profile', icon: <ShieldCheck className="sidebar-icon" />, path: '/profile' },
      ],
    },
    {
      title: 'CLINICAL',
      items: [
        { name: 'Patients', icon: <UserRound className="sidebar-icon" />, path: '/patients' },
        { name: 'Document Scanner', icon: <FileSignature className="sidebar-icon" />, path: '/patients/scan' },
      ],
    },
    {
      title: 'PHARMACY & INVENTORY',
      items: [
        { name: 'Pharmacy Sales', icon: <ShoppingCart className="sidebar-icon" />, path: '/pharmacy/sales' },
        { name: 'Inventory Items', icon: <Package className="sidebar-icon" />, path: '/inventory/items' },
        { name: 'Medicines', icon: <Pill className="sidebar-icon" />, path: '/inventory/medicines' },
        { name: 'Categories', icon: <Library className="sidebar-icon" />, path: '/inventory/categories' },
        { name: 'Stock Receipts', icon: <Receipt className="sidebar-icon" />, path: '/inventory/receipts' },
        { name: 'Suppliers', icon: <Truck className="sidebar-icon" />, path: '/inventory/suppliers' },
      ],
    },
    {
      title: 'BILLING & INSURANCE',
      items: [
        { name: 'Billing Records', icon: <Receipt className="sidebar-icon" />, path: '/billing/records' },
        { name: 'Insurance Providers', icon: <ShieldPlus className="sidebar-icon" />, path: '/billing/insurance' },
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
      
      {menuGroups.map((group, index) => (
        <div className="sidebar-section" key={index}>
          <div className="sidebar-heading">{group.title}</div>
          {group.items.map((item, i) => {
            const isActive = item.path ? location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) : false;
            
            return item.path ? (
              <Link to={item.path} className={`sidebar-item ${isActive ? 'active' : ''}`} key={i} title={isCollapsed ? item.name : ''}>
                {item.icon}
                <span className="sidebar-item-text">{item.name}</span>
              </Link>
            ) : null;
          })}
        </div>
      ))}
      <div style={{ height: '2rem' }}></div>
    </aside>
  );
}
