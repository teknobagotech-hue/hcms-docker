import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Eye, Edit, Archive, Trash2, Plus } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import '../index.css';

export default function DepartmentsList() {
  const [departments, setDepartments] = useState([]);
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
    fetchDepartments();
  }, [page, searchQuery, statusFilter]);

  const fetchDepartments = async () => {
    setLoading(true);
    let query = supabase
      .from('departments')
      .select('*', { count: 'exact' });

    if (searchQuery) {
      query = query.ilike('department_name', `%${searchQuery}%`);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('department_name', { ascending: true });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load departments');
      console.error(error);
    } else {
      setDepartments(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleArchive = async (id) => {
    const { error } = await supabase
      .from('departments')
      .update({ status: 'inactive' })
      .eq('department_id', id);

    if (error) {
      toast.error('Failed to archive department');
    } else {
      toast.success('Department archived successfully');
      fetchDepartments();
    }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('department_id', id);

    if (error) {
      toast.error('Failed to delete department. It may be in use.');
    } else {
      toast.success('Department deleted successfully');
      fetchDepartments();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, dept) => {
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive Department',
        message: `Are you sure you want to archive "${dept.department_name}"?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: () => handleArchive(dept.department_id)
      });
    } else if (action === 'delete') {
      setModalConfig({
        title: 'Delete Department',
        message: `Are you sure you want to permanently delete "${dept.department_name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmType: 'danger',
        onConfirm: () => handleDelete(dept.department_id)
      });
    }
    setModalOpen(true);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container">
        
        <div className="page-header-flex">
          <div>
            <h1 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Departments</h1>
            <p className="card-subtitle">Manage hospital departments and locations</p>
          </div>
          <Link to="/departments/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add Department
          </Link>
        </div>

        <div className="section-panel">
          <div className="filter-toolbar">
            <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search departments..."
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
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Department Name</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No departments found.</td>
                  </tr>
                ) : (
                  departments.map(dept => (
                    <tr key={dept.department_id}>
                      <td>{dept.department_id}</td>
                      <td style={{ fontWeight: 500 }}>{dept.department_name}</td>
                      <td>{dept.location || '-'}</td>
                      <td>
                        <span className={`badge ${dept.status === 'active' ? 'badge-blue' : ''}`} style={{ backgroundColor: dept.status === 'active' ? '#DBEAFE' : '#F1F5F9', color: dept.status === 'active' ? '#1D4ED8' : '#64748B' }}>
                          {dept.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/departments/view/${dept.department_id}`} className="icon-btn view" title="View">
                            <Eye size={18} />
                          </Link>
                          <Link to={`/departments/edit/${dept.department_id}`} className="icon-btn edit" title="Edit">
                            <Edit size={18} />
                          </Link>
                          {dept.status === 'active' && (
                            <button className="icon-btn archive" title="Archive" onClick={() => openConfirmModal('archive', dept)}>
                              <Archive size={18} />
                            </button>
                          )}
                          <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal('delete', dept)}>
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
