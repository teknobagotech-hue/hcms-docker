import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Edit, Trash2, Plus, FileSignature, Eye, Printer } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import TablePrintControls from './TablePrintControls';
import { printPrescription } from '../utils/printDocumentTemplates';
import '../index.css';

export default function PatientPrescriptions({ patientId }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const printColumns = [
    { label: 'ID', key: 'prescription_id' },
    { label: 'Date', render: (r) => new Date(r.prescription_date).toLocaleDateString() },
    { label: 'Doctor', render: (r) => r.doctors ? `Dr. ${r.doctors.first_name} ${r.doctors.last_name}` : '-' },
    { label: 'Status', key: 'status' }
  ];

  useEffect(() => {
    fetchPrescriptions();
  }, [page, patientId]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('prescriptions')
      .select('*, doctors(first_name, last_name)', { count: 'exact' })
      .eq('patient_id', patientId)
      .range(from, to)
      .order('prescription_date', { ascending: false });

    if (error) {
      toast.error('Failed to load prescriptions');
    } else {
      setPrescriptions(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('prescription_id', selectedId);

    if (error) {
      toast.error('Failed to delete prescription.');
    } else {
      toast.success('Prescription deleted successfully');
      fetchPrescriptions();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, presc) => {
    setSelectedId(typeof presc === 'object' ? presc.prescription_id : presc);
    setModalOpen(true);
  };

  const handlePrintRx = async (prescription) => {
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_id', patientId)
      .single();

    if (!patient) {
      toast.error('Could not load patient details for printing.');
      return;
    }

    const { data: items } = await supabase
      .from('prescription_items')
      .select('*, medicines(medicine_name)')
      .eq('prescription_id', prescription.prescription_id);

    let doctor = prescription.doctors || null;
    if (prescription.doctor_id) {
      const { data: docData } = await supabase
        .from('doctors')
        .select('*')
        .eq('doctor_id', prescription.doctor_id)
        .single();
      if (docData) doctor = docData;
    }

    printPrescription({ patient, prescription, items, doctor });
  };

  return (
    <div className="section-panel" style={{ margin: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)' }}>
          Prescriptions
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <TablePrintControls records={prescriptions} title="Prescriptions" columns={printColumns} dateField="prescription_date" />
          <Link to={`/pharmacy/prescriptions/add?patientId=${patientId}`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            <Plus size={16} /> New Prescription
          </Link>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Doctor</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
              </tr>
            ) : prescriptions.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No prescriptions found.</td>
              </tr>
            ) : (
              prescriptions.map(presc => (
                <tr key={presc.prescription_id}>
                  <td style={{ color: 'var(--text-gray)' }}>#{presc.prescription_id}</td>
                  <td>{new Date(presc.prescription_date).toLocaleDateString()}</td>
                  <td>Dr. {presc.doctors?.first_name} {presc.doctors?.last_name}</td>
                  <td>
                    <span className={`badge ${presc.status === 'active' ? 'badge-blue' : presc.status === 'completed' ? 'badge-green' : ''}`}>
                      {presc.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-btn" onClick={() => handlePrintRx(presc)} style={{ color: 'var(--text-gray)' }} title="Print Rx">
                        <Printer size={18} />
                      </button>
                      <Link to={`/pharmacy/prescriptions/edit/${presc.prescription_id}`} className="icon-btn edit" title="Edit">
                        <Edit size={18} />
                      </Link>
                      <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal('delete', presc)}>
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

      {Math.ceil(totalCount / limit) > 1 && (
        <div className="pagination" style={{ marginTop: '1rem' }}>
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          {Array.from({ length: Math.ceil(totalCount / limit) }, (_, i) => i + 1).map(num => (
            <button key={num} className={`page-btn ${page === num ? 'active' : ''}`} onClick={() => setPage(num)}>{num}</button>
          ))}
          <button className="page-btn" disabled={page === Math.ceil(totalCount / limit)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      <ConfirmModal 
        isOpen={modalOpen} 
        onCancel={() => setModalOpen(false)}
        title="Delete Prescription"
        message="Are you sure you want to permanently delete this prescription?"
        confirmText="Delete"
        confirmType="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
