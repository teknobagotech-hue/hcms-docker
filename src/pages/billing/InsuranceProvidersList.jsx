import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Edit, Archive, Trash2, Plus, ShieldPlus, Eye } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import '../../index.css';

export default function InsuranceProvidersList() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchProviders();
  }, [page, searchQuery, statusFilter]);

  const fetchProviders = async () => {
    setLoading(true);
    let query = supabase
      .from('insurance_providers')
      .select('*', { count: 'exact' });

    if (searchQuery) {
      query = query.ilike('provider_name', `%${searchQuery}%`);
    }
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('provider_name', { ascending: true });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load insurance providers');
      console.error(error);
    } else {
      setProviders(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleArchive = async (id) => {
    const { error } = await supabase
      .from('insurance_providers')
      .update({ status: 'inactive' })
      .eq('insurance_provider_id', id);

    if (error) {
      toast.error('Failed to archive provider');
    } else {
      toast.success('Provider archived successfully');
      fetchProviders();
    }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('insurance_providers')
      .delete()
      .eq('insurance_provider_id', id);

    if (error) {
      toast.error('Failed to delete provider. They may be linked to patient insurance records.');
    } else {
      toast.success('Provider deleted successfully');
      fetchProviders();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, provider) => {
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive Provider',
        message: `Are you sure you want to archive "${provider.provider_name}"?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: () => handleArchive(provider.insurance_provider_id)
      });
    } else if (action === 'delete') {
      setModalConfig({
        title: 'Delete Provider',
        message: `Are you sure you want to permanently delete "${provider.provider_name}"?`,
        confirmText: 'Delete',
        confirmType: 'danger',
        onConfirm: () => handleDelete(provider.insurance_provider_id)
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
            <h1 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldPlus className="text-primary" size={24} />
              Insurance Providers
            </h1>
            <p className="card-subtitle">Manage health insurance partners</p>
          </div>
          <Link to="/billing/insurance/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add Provider
          </Link>
        </div>

        <div className="section-panel">
          <div className="filter-toolbar">
            <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search providers by name..."
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
                  <th>Provider Name</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                  </tr>
                ) : providers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No insurance providers found.</td>
                  </tr>
                ) : (
                  providers.map(prov => (
                    <tr key={prov.insurance_provider_id}>
                      <td style={{ color: 'var(--text-gray)' }}>#{prov.insurance_provider_id}</td>
                      <td style={{ fontWeight: 500 }}>{prov.provider_name}</td>
                      <td>{prov.contact_number || prov.email || '-'}</td>
                      <td>
                        <span className={`badge ${prov.status === 'active' ? 'badge-blue' : ''}`} style={{ backgroundColor: prov.status === 'active' ? '#DBEAFE' : '#F1F5F9', color: prov.status === 'active' ? '#1D4ED8' : '#64748B' }}>
                          {prov.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/billing/insurance/view/${prov.insurance_provider_id}`} className="icon-btn view" title="View Provider">
                            <Eye size={18} />
                          </Link>
                          <Link to={`/billing/insurance/edit/${prov.insurance_provider_id}`} className="icon-btn edit" title="Edit Provider">
                            <Edit size={18} />
                          </Link>
                          {prov.status === 'active' && (
                            <button className="icon-btn archive" title="Archive" onClick={() => openConfirmModal('archive', prov)}>
                              <Archive size={18} />
                            </button>
                          )}
                          <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal('delete', prov)}>
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
