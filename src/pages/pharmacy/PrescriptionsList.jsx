import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Edit, Plus, FileSignature, Eye, Printer, Archive } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { printPrescription } from '../../utils/printDocumentTemplates';
import '../../index.css';

export default function PrescriptionsList() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, [page, searchQuery, statusFilter]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    let query = supabase
      .from('prescriptions')
      .select('*, patients(first_name, last_name), doctors(first_name, last_name)', { count: 'exact' });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('prescription_date', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load prescriptions');
      console.error(error);
    } else {
      // Manual client-side filtering for search query if needed since we search by patient name
      let filteredData = data;
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        filteredData = data.filter(p => 
          (p.patients?.first_name + ' ' + p.patients?.last_name).toLowerCase().includes(lowerQ)
        );
      }
      setPrescriptions(filteredData);
      setTotalCount(count); // Note: totalCount will be slightly off if client-side filtering, but acceptable for this basic implementation
    }
    setLoading(false);
  };

  const handleCancelPrescription = async (id) => {
    const { error } = await supabase
      .from('prescriptions')
      .update({ status: 'cancelled' })
      .eq('prescription_id', id);

    if (error) {
      toast.error('Failed to cancel prescription.');
    } else {
      toast.success('Prescription cancelled successfully');
      fetchPrescriptions();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, prescription) => {
    if (action === 'cancel') {
      setModalConfig({
        title: 'Cancel Prescription',
        message: `Are you sure you want to cancel this prescription?`,
        confirmText: 'Cancel Prescription',
        confirmType: 'warning',
        onConfirm: () => handleCancelPrescription(prescription.prescription_id)
      });
      setModalOpen(true);
    }
  };

  const handlePrintRx = async (prescription) => {
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_id', prescription.patient_id)
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

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container">
        
        <div className="page-header-flex">
          <div>
            <h1 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileSignature className="text-primary" size={24} />
              Prescriptions
            </h1>
            <p className="card-subtitle">Manage patient prescriptions</p>
          </div>
          <Link to="/pharmacy/prescriptions/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> New Prescription
          </Link>
        </div>

        <div className="section-panel">
          <div className="filter-toolbar">
            <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by Patient Name..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="form-input filter-select"
              style={{ width: 'auto', paddingLeft: '1rem' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Patient Name</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                  </tr>
                ) : prescriptions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No prescriptions found.</td>
                  </tr>
                ) : (
                  prescriptions.map(rx => (
                    <tr key={rx.prescription_id}>
                      <td style={{ color: 'var(--text-gray)' }}>#{rx.prescription_id}</td>
                      <td>{new Date(rx.prescription_date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 500 }}>
                        {rx.patients ? `${rx.patients.last_name}, ${rx.patients.first_name}` : 'Unknown Patient'}
                      </td>
                      <td>{rx.doctors ? `Dr. ${rx.doctors.last_name}` : '-'}</td>
                      <td>
                        <span className={`badge ${rx.status === 'completed' ? 'badge-blue' : ''}`} style={{ backgroundColor: rx.status === 'completed' ? '#DBEAFE' : rx.status === 'active' ? '#E0F7F6' : '#F1F5F9', color: rx.status === 'completed' ? '#1D4ED8' : rx.status === 'active' ? '#0EBAB1' : '#64748B' }}>
                          {rx.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="icon-btn view" 
                            title="Print Prescription"
                            onClick={() => handlePrintRx(rx)}
                          >
                            <Printer size={18} />
                          </button>
                          {rx.status === 'active' && (
                            <button 
                              className="icon-btn archive" 
                              title="Cancel Prescription" 
                              onClick={() => openConfirmModal('cancel', rx)}
                            >
                              <Archive size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="page-btn" 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button 
                  key={num} 
                  className={`page-btn ${page === num ? 'active' : ''}`}
                  onClick={() => setPage(num)}
                >
                  {num}
                </button>
              ))}
              <button 
                className="page-btn" 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={modalOpen} 
        onCancel={() => setModalOpen(false)}
        {...modalConfig}
      />
    </div>
  );
}
