import { UserPlus, CalendarPlus, Activity } from 'lucide-react';

export default function QuickActions() {
  return (
    <div className="section-panel">
      <div className="section-header">
        <h2 className="section-title">Quick Actions</h2>
      </div>
      
      <div className="quick-actions-grid">
        <button className="action-btn">
          <div className="icon-blue">
            <UserPlus />
          </div>
          <span className="action-label">Add Patient</span>
        </button>
        
        <button className="action-btn">
          <div className="icon-primary">
            <CalendarPlus />
          </div>
          <span className="action-label">New Appt</span>
        </button>
        
        <button className="action-btn action-btn-full">
          <div className="icon-blue" style={{ background: 'transparent', padding: '0', color: '#2563EB' }}>
            <Activity />
          </div>
          <span className="action-label">Record Vitals</span>
        </button>
      </div>
    </div>
  );
}
