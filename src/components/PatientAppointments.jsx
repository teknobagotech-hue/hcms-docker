import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, Archive } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import TablePrintControls from './TablePrintControls';

export default function PatientAppointments({ patientId }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const printColumns = [
    { label: 'Date & Time', render: (r) => new Date(r.appointment_date).toLocaleString() },
    { label: 'Doctor', render: (r) => r.doctors ? `Dr. ${r.doctors.first_name} ${r.doctors.last_name}` : 'Unassigned' },
    { label: 'Purpose', key: 'purpose' },
    { label: 'Status', render: (r) => r.status.toUpperCase() }
  ];

  useEffect(() => {
    fetchAppointments();
  }, [page, patientId]);

  const fetchAppointments = async () => {
    setLoading(true);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('appointments')
      .select('*, doctors(first_name, last_name, specialty)', { count: 'exact' })
      .eq('patient_id', patientId)
      .range(from, to)
      .order('appointment_date', { ascending: false });

    if (error) {
      toast.error('Failed to load appointments');
    } else {
      setAppointments(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('appointment_id', selectedId);

    if (error) {
      toast.error('Failed to delete appointment');
    } else {
      toast.success('Appointment deleted');
      fetchAppointments();
    }
    setModalOpen(false);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="section-panel" style={{ margin: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)' }}>
          Appointment History
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <TablePrintControls records={appointments} title="Appointment History" columns={printColumns} dateField="appointment_date" />
          <Link to={`/patients/${patientId}/appointments/add`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <Plus size={16} /> Schedule
          </Link>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Doctor</th>
              <th>Purpose</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-gray)' }}>No appointments found.</td></tr>
            ) : (
              appointments.map(appt => (
                <tr key={appt.appointment_id}>
                  <td style={{ fontWeight: 500 }}>
                    {new Date(appt.appointment_date).toLocaleString()}
                  </td>
                  <td>
                    {appt.doctors ? `Dr. ${appt.doctors.first_name} ${appt.doctors.last_name}` : 'Unassigned'}
                    {appt.doctors?.specialty && <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{appt.doctors.specialty}</div>}
                  </td>
                  <td>{appt.purpose}</td>
                  <td>
                    <span className={`badge`} style={{ 
                      backgroundColor: appt.status === 'completed' ? '#DBEAFE' : appt.status === 'cancelled' ? '#FEE2E2' : '#FEF3C7',
                      color: appt.status === 'completed' ? '#1D4ED8' : appt.status === 'cancelled' ? '#EF4444' : '#D97706'
                    }}>
                      {appt.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/patients/${patientId}/appointments/edit/${appt.appointment_id}`} className="icon-btn edit" title="Edit">
                        <Edit size={18} />
                      </Link>
                      {appt.status === 'scheduled' && (
                        <button className="icon-btn archive" title="Cancel Appointment" onClick={() => openConfirmModal('cancel', appt)}>
                          <Archive size={18} />
                        </button>
                      )}
                      <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal('delete', appt)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '1rem' }}>
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
            <button key={num} className={`page-btn ${page === num ? 'active' : ''}`} onClick={() => setPage(num)}>{num}</button>
          ))}
          <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      <ConfirmModal 
        isOpen={modalOpen} 
        onCancel={() => setModalOpen(false)}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment?"
        confirmText="Delete"
        confirmType="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
