import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Calendar } from 'lucide-react';

export default function UpcomingAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, patients(first_name, last_name), doctors(first_name, last_name)')
      .order('appointment_date', { ascending: true })
      .limit(5);

    if (data) {
      setAppointments(data);
    }
    setLoading(false);
  };

  return (
    <div className="section-panel">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Calendar size={18} className="text-primary" />
          Upcoming Appointments
        </h2>
        <Link to="/appointments" className="section-link" style={{ textDecoration: 'none', color: 'var(--primary-color)', fontSize: '0.875rem', fontWeight: 500 }}>View All &gt;</Link>
      </div>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>Patient Name</th>
            <th>Doctor</th>
            <th>Date & Time</th>
            <th>Reason</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem' }}>Loading appointments...</td>
            </tr>
          ) : appointments.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-light)' }}>No upcoming appointments found.</td>
            </tr>
          ) : (
            appointments.map(app => {
              const patientName = app.patients ? `${app.patients.first_name} ${app.patients.last_name}` : 'Patient';
              const doctorName = app.doctors ? `Dr. ${app.doctors.first_name} ${app.doctors.last_name}` : 'Doctor';
              const initials = app.patients ? `${app.patients.first_name[0] || ''}${app.patients.last_name[0] || ''}` : 'PT';

              return (
                <tr key={app.appointment_id}>
                  <td>
                    <div className="patient-info">
                      <div className="patient-avatar-placeholder">{initials}</div>
                      {patientName}
                    </div>
                  </td>
                  <td>{doctorName}</td>
                  <td>
                    {app.appointment_date ? new Date(app.appointment_date).toLocaleDateString() : '-'}<br/>
                    <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{app.appointment_time || 'Scheduled'}</span>
                  </td>
                  <td>{app.reason_for_visit || 'Consultation'}</td>
                  <td>
                    <span className={`badge ${app.status === 'completed' ? 'badge-green' : app.status === 'cancelled' ? '' : 'badge-blue'}`}>
                      {app.status || 'scheduled'}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
