export default function UpcomingAppointments() {
  return (
    <div className="section-panel">
      <div className="section-header">
        <h2 className="section-title">Upcoming Appointments</h2>
        <a href="#" className="section-link">View Full Schedule &gt;</a>
      </div>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>Patient Name</th>
            <th>Doctor</th>
            <th>Time</th>
            <th>Purpose</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div className="patient-info">
                <div className="patient-avatar-placeholder">SG</div>
                Sarah Geoh
              </div>
            </td>
            <td>Dr. Aly Jayan</td>
            <td>09:00 AM<br/><span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>Today</span></td>
            <td>Visit</td>
            <td>
              <span className="badge badge-blue">Scheduled</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
