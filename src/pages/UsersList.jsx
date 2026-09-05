import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Eye, Edit, Archive, Plus, UserCog, CheckCircle } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import '../index.css';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page, searchQuery, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    const client = supabaseAdmin || supabase;
    let query = client
      .from('user_profiles')
      .select('*', { count: 'exact' });

    if (searchQuery) {
      query = query.ilike('full_name', `%${searchQuery}%`);
    }

    if (roleFilter !== 'all') {
      query = query.ilike('role', roleFilter);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load users');
      console.error(error);
    } else {
      setUsers(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const handleArchive = async (id) => {
    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('user_profiles')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to archive user');
    } else {
      toast.success('User archived successfully');
      fetchUsers();
    }
    setModalOpen(false);
  };

  const handleActivate = async (id) => {
    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('user_profiles')
      .update({ status: 'active' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to activate user');
    } else {
      toast.success('User activated successfully');
      fetchUsers();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, user) => {
    const name = user.full_name || 'Unnamed User';
    const userId = user.id || user.user_id;
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive User',
        message: `Are you sure you want to archive ${name}?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: () => handleArchive(userId)
      });
    } else if (action === 'activate') {
      setModalConfig({
        title: 'Activate User',
        message: `Are you sure you want to activate ${name}?`,
        confirmText: 'Activate',
        confirmType: 'primary',
        onConfirm: () => handleActivate(userId)
      });
    }
    setModalOpen(true);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container">
        
        <div className="page-header-flex">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="icon-primary" style={{ padding: '0.75rem', borderRadius: '0.5rem' }}>
              <UserCog size={24} />
            </div>
            <div>
              <h1 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>User Management</h1>
              <p className="card-subtitle">Manage system access and staff profiles</p>
            </div>
          </div>
          <Link to="/users/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add User
          </Link>
        </div>

        <div className="section-panel">
          <div className="filter-toolbar">
            <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by full name..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="form-input filter-select"
              style={{ width: 'auto', paddingLeft: '1rem' }}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="receptionist">Receptionist</option>
              <option value="lab_technician">Lab Technician</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No users found.</td>
                  </tr>
                ) : (
                  users.map((user, index) => {
                    const userId = user.id || user.user_id;
                    return (
                      <tr key={userId || index}>
                        <td style={{ fontWeight: 500 }}>
                          {user.full_name || 'N/A'}
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: '#E2E8F0', color: '#334155', textTransform: 'capitalize' }}>
                            {(user.roles?.role_name || user.role || 'Staff').replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${user.status === 'active' ? 'badge-blue' : ''}`} style={{ backgroundColor: user.status === 'active' ? '#DBEAFE' : '#F1F5F9', color: user.status === 'active' ? '#1D4ED8' : '#64748B', textTransform: 'capitalize' }}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-gray)' }}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <div className="table-actions">
                            <Link to={`/users/view/${userId}`} className="icon-btn view" title="View Details">
                              <Eye size={18} />
                            </Link>
                            <Link to={`/users/edit/${userId}`} className="icon-btn edit" title="Edit User">
                              <Edit size={18} />
                            </Link>
                            {user.status === 'inactive' ? (
                              <button 
                                className="icon-btn activate" 
                                title="Activate User" 
                                style={{ color: '#16A34A' }} 
                                onClick={() => openConfirmModal('activate', user)}
                              >
                                <CheckCircle size={18} />
                              </button>
                            ) : (
                              <button 
                                className="icon-btn archive" 
                                title="Archive User" 
                                onClick={() => openConfirmModal('archive', user)}
                              >
                                <Archive size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
