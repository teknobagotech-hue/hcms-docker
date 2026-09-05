import { useNavigate } from 'react-router-dom';
import { UserPlus, CalendarPlus, ShoppingBag, BarChart3 } from 'lucide-react';

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="section-panel">
      <div className="section-header">
        <h2 className="section-title">Quick Actions</h2>
      </div>
      
      <div className="quick-actions-grid">
        <button className="action-btn" onClick={() => navigate('/patients/add')}>
          <div className="icon-blue">
            <UserPlus />
          </div>
          <span className="action-label">Add Patient</span>
        </button>
        
        <button className="action-btn" onClick={() => navigate('/appointments/add')}>
          <div className="icon-primary">
            <CalendarPlus />
          </div>
          <span className="action-label">New Appt</span>
        </button>
        
        <button className="action-btn" onClick={() => navigate('/pharmacy/sales/add')}>
          <div className="icon-blue" style={{ background: 'transparent', padding: '0', color: '#0d9488' }}>
            <ShoppingBag />
          </div>
          <span className="action-label">Pharmacy Sale</span>
        </button>

        <button className="action-btn" onClick={() => navigate('/reports')}>
          <div className="icon-primary" style={{ background: '#E0F7F6', color: '#0EBAB1' }}>
            <BarChart3 />
          </div>
          <span className="action-label">Reports & Audit</span>
        </button>
      </div>
    </div>
  );
}
