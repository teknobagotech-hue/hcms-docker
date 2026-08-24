import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Eye, Edit, Archive, Trash2, Plus, UserCog } from 'lucide-react';
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
  const limit = 5;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page, searchQuery, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' });

    if (searchQuery) {
      query = query.ilike('full_name', `%${searchQuery}%`);
    }

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load users');
      console.error(error);
    } else {
      setUsers(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleArchive = async (id) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to archive user (Ensure status column exists)');
    } else {
      toast.success('User archived successfully');
      fetchUsers();
    }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    // Note: Deleting from user_profiles might fail if there are foreign keys (e.g. doctors table).
    // And it doesn't delete the user from auth.users unless we use supabaseAdmin.
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete user. They may have active records.');
    } else {
      toast.success('User profile deleted successfully');
      fetchUsers();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, user) => {
    const name = user.full_name || 'Unnamed User';
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive User',
        message: `Are you sure you want to archive ${name}?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: () => handleArchive(user.id)
      });
    } else if (action === 'delete') {
      setModalConfig({
        title: 'Delete User',
        message: `Are you sure you want to permanently delete ${name}'s profile? (This does not delete their authentication record).`,
        confirmText: 'Delete',
        confirmType: 'danger',
        onConfirm: () => handleDelete(user.id)
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
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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
              className="form-input"
              style={{ width: 'auto', paddingLeft: '1rem' }}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Doctor">Doctor</option>
              <option value="Nurse">Nurse</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

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
                users.map(user => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 500 }}>
                      {user.full_name || 'N/A'}
                    </td>
                    <td>{user.role || '-'}</td>
                    <td>
                      <span className={`badge ${user.status === 'active' || !user.status ? 'badge-blue' : ''}`} style={{ backgroundColor: user.status === 'active' || !user.status ? '#DBEAFE' : '#F1F5F9', color: user.status === 'active' || !user.status ? '#1D4ED8' : '#64748B' }}>
                        {user.status ? user.status.toUpperCase() : 'ACTIVE'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/users/view/${user.id}`} className="icon-btn view" title="View">
                          <Eye size={18} />
                        </Link>
                        <Link to={`/users/edit/${user.id}`} className="icon-btn edit" title="Edit">
                          <Edit size={18} />
                        </Link>
                        {user.status !== 'inactive' && (
                          <button className="icon-btn archive" title="Archive" onClick={() => openConfirmModal('archive', user)}>
                            <Archive size={18} />
                          </button>
                        )}
                        <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal('delete', user)}>
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
