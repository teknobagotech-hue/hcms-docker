import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Eye, Edit, Archive, Trash2, Plus } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import '../index.css';

export default function DoctorsList() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, [page, searchQuery, statusFilter]);

  const fetchDoctors = async () => {
    setLoading(true);
    let query = supabase
      .from('doctors')
      .select('*, departments(department_name)', { count: 'exact' });

    if (searchQuery) {
      // Search by either first name or last name
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
      toast.error('Failed to load doctors');
      console.error(error);
    } else {
      setDoctors(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleArchive = async (id) => {
    const { error } = await supabase
      .from('doctors')
      .update({ status: 'inactive' })
      .eq('doctor_id', id);

    if (error) {
      toast.error('Failed to archive doctor');
    } else {
      toast.success('Doctor archived successfully');
      fetchDoctors();
    }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('doctor_id', id);

    if (error) {
      toast.error('Failed to delete doctor. They may have active records.');
    } else {
      toast.success('Doctor deleted successfully');
      fetchDoctors();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, doc) => {
    const fullName = `Dr. ${doc.first_name} ${doc.last_name}`;
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive Doctor',
        message: `Are you sure you want to archive ${fullName}?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: () => handleArchive(doc.doctor_id)
      });
    } else if (action === 'delete') {
      setModalConfig({
        title: 'Delete Doctor',
        message: `Are you sure you want to permanently delete ${fullName}? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmType: 'danger',
        onConfirm: () => handleDelete(doc.doctor_id)
      });
    }
    setModalOpen(true);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container">
        
        <div className="section-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Doctors</h1>
            <p className="card-subtitle">Manage medical personnel and specialists</p>
          </div>
          <Link to="/doctors/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add Doctor
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
                <th>Name</th>
                <th>Specialty</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No doctors found.</td>
                </tr>
              ) : (
                doctors.map(doc => (
                  <tr key={doc.doctor_id}>
                    <td style={{ fontWeight: 500 }}>
                      Dr. {doc.first_name} {doc.last_name}
                    </td>
                    <td>{doc.specialty || '-'}</td>
                    <td>{doc.departments?.department_name || '-'}</td>
                    <td>
                      <span className={`badge ${doc.status === 'active' ? 'badge-blue' : ''}`} style={{ backgroundColor: doc.status === 'active' ? '#DBEAFE' : '#F1F5F9', color: doc.status === 'active' ? '#1D4ED8' : '#64748B' }}>
                        {doc.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/doctors/view/${doc.doctor_id}`} className="icon-btn view" title="View">
                          <Eye size={18} />
                        </Link>
                        <Link to={`/doctors/edit/${doc.doctor_id}`} className="icon-btn edit" title="Edit">
                          <Edit size={18} />
                        </Link>
                        {doc.status === 'active' && (
                          <button className="icon-btn archive" title="Archive" onClick={() => openConfirmModal('archive', doc)}>
                            <Archive size={18} />
                          </button>
                        )}
                        <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal('delete', doc)}>
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
