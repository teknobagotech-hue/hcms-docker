import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Eye, Edit, Archive, Trash2, Plus, Users } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import '../index.css';

export default function PatientsList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 5;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, [page, searchQuery, statusFilter]);

  const fetchPatients = async () => {
    setLoading(true);
    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' });

    if (searchQuery) {
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('last_name', { ascending: true });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load patients');
      console.error(error);
    } else {
      setPatients(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleArchive = async (id) => {
    const { error } = await supabase
      .from('patients')
      .update({ status: 'inactive' })
      .eq('patient_id', id);

    if (error) {
      toast.error('Failed to archive patient');
    } else {
      toast.success('Patient archived successfully');
      fetchPatients();
    }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('patient_id', id);

    if (error) {
      toast.error('Failed to delete patient. They have active clinical records.');
    } else {
      toast.success('Patient deleted successfully');
      fetchPatients();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, patient) => {
    const fullName = `${patient.first_name} ${patient.last_name}`;
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive Patient',
        message: `Are you sure you want to archive ${fullName}?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: () => handleArchive(patient.patient_id)
      });
    } else if (action === 'delete') {
      setModalConfig({
        title: 'Delete Patient',
        message: `Are you sure you want to permanently delete ${fullName}? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmType: 'danger',
        onConfirm: () => handleDelete(patient.patient_id)
      });
    }
    setModalOpen(true);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container">
        
        <div className="section-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="icon-primary" style={{ padding: '0.75rem', borderRadius: '0.5rem' }}>
              <Users size={24} />
            </div>
            <div>
              <h1 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Patients</h1>
              <p className="card-subtitle">Manage patient records and clinical history</p>
            </div>
          </div>
          <Link to="/patients/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Register Patient
          </Link>
        </div>

        <div className="section-panel">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by first or last name..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="form-input"
              style={{ width: 'auto', paddingLeft: '1rem' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Date of Birth</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No patients found.</td>
                </tr>
              ) : (
                patients.map(patient => (
                  <tr key={patient.patient_id}>
                    <td style={{ color: 'var(--text-gray)' }}>#{patient.patient_id}</td>
                    <td style={{ fontWeight: 500 }}>
                      {patient.last_name}, {patient.first_name} {patient.middle_name}
                    </td>
                    <td>{new Date(patient.date_of_birth).toLocaleDateString()}</td>
                    <td>{patient.gender || '-'}</td>
                    <td>
                      <span className={`badge ${patient.status === 'active' ? 'badge-blue' : ''}`} style={{ backgroundColor: patient.status === 'active' ? '#DBEAFE' : '#F1F5F9', color: patient.status === 'active' ? '#1D4ED8' : '#64748B' }}>
                        {patient.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/patients/view/${patient.patient_id}`} className="icon-btn view" title="Clinical Dashboard">
                          <Eye size={18} />
                        </Link>
                        <Link to={`/patients/edit/${patient.patient_id}`} className="icon-btn edit" title="Edit Demographics">
                          <Edit size={18} />
                        </Link>
                        {patient.status === 'active' && (
                          <button className="icon-btn archive" title="Archive" onClick={() => openConfirmModal('archive', patient)}>
                            <Archive size={18} />
                          </button>
                        )}
                        <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal('delete', patient)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

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
