import { Users, Calendar, AlertTriangle } from 'lucide-react';

export default function SummaryCards() {
  return (
    <div className="summary-cards">
      {/* Total Patients */}
      <div className="card card-primary">
        <div className="card-header">
          <div className="card-title">Total Patients</div>
          <div className="card-icon-wrapper">
            <Users />
          </div>
        </div>
        <div className="card-value">
          3 <span>Active Database</span>
        </div>
        <div className="card-subtitle">
          Registered patients
        </div>
      </div>

      {/* Appointments Today */}
      <div className="card card-blue">
        <div className="card-header">
          <div className="card-title">Appointments Today</div>
          <div className="card-icon-wrapper">
            <Calendar />
          </div>
        </div>
        <div className="card-value">
          0 <span>Scheduled</span>
        </div>
        <div className="card-subtitle">
          0 pending triage
        </div>
      </div>

      {/* Inventory Alerts */}
      <div className="card card-danger">
        <div className="card-header">
          <div className="card-title">Inventory Alerts</div>
          <div className="card-icon-wrapper">
            <AlertTriangle />
          </div>
        </div>
        <div className="card-value">
          0 <span>Critical</span>
        </div>
        <div className="card-subtitle">
          Low Stock items
        </div>
      </div>
    </div>
  );
}
