import { useNavigate } from 'react-router-dom';
import { UserPlus, CalendarPlus, ShoppingBag } from 'lucide-react';

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
        
        <button className="action-btn action-btn-full" onClick={() => navigate('/pharmacy/sales/add')}>
          <div className="icon-blue" style={{ background: 'transparent', padding: '0', color: '#0d9488' }}>
            <ShoppingBag />
          </div>
          <span className="action-label">New Pharmacy Sale</span>
        </button>
      </div>
    </div>
  );
}
