import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Edit, Archive, Trash2, Plus, Truck, Eye } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import '../../index.css';

export default function SuppliersList() {
  const [suppliers, setSuppliers] = useState([]);
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
    fetchSuppliers();
  }, [page, searchQuery, statusFilter]);

  const fetchSuppliers = async () => {
    setLoading(true);
    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' });

    if (searchQuery) {
      query = query.ilike('supplier_name', `%${searchQuery}%`);
    }
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('supplier_name', { ascending: true });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load suppliers');
      console.error(error);
    } else {
      setSuppliers(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleArchive = async (id) => {
    const { error } = await supabase
      .from('suppliers')
      .update({ status: 'inactive' })
      .eq('supplier_id', id);

    if (error) {
      toast.error('Failed to archive supplier');
    } else {
      toast.success('Supplier archived successfully');
      fetchSuppliers();
    }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('supplier_id', id);

    if (error) {
      toast.error('Failed to delete supplier. They may be linked to stock receipts.');
    } else {
      toast.success('Supplier deleted successfully');
      fetchSuppliers();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, supplier) => {
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive Supplier',
        message: `Are you sure you want to archive "${supplier.supplier_name}"?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: () => handleArchive(supplier.supplier_id)
      });
    } else if (action === 'delete') {
      setModalConfig({
        title: 'Delete Supplier',
        message: `Are you sure you want to permanently delete "${supplier.supplier_name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmType: 'danger',
        onConfirm: () => handleDelete(supplier.supplier_id)
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
              <Truck className="text-primary" size={24} />
              Suppliers
            </h1>
            <p className="card-subtitle">Manage medical and inventory suppliers</p>
          </div>
          <Link to="/inventory/suppliers/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add Supplier
          </Link>
        </div>

        <div className="section-panel">
          <div className="filter-toolbar">
            <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search suppliers by name..."
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
                  <th>Supplier Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No suppliers found.</td>
                  </tr>
                ) : (
                  suppliers.map(sup => (
                    <tr key={sup.supplier_id}>
                      <td style={{ color: 'var(--text-gray)' }}>#{sup.supplier_id}</td>
                      <td style={{ fontWeight: 500 }}>{sup.supplier_name}</td>
                      <td>{sup.contact_person || '-'}</td>
                      <td>{sup.phone || '-'}</td>
                      <td>
                        <span className={`badge ${sup.status === 'active' ? 'badge-blue' : ''}`} style={{ backgroundColor: sup.status === 'active' ? '#DBEAFE' : '#F1F5F9', color: sup.status === 'active' ? '#1D4ED8' : '#64748B' }}>
                          {sup.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/inventory/suppliers/view/${sup.supplier_id}`} className="icon-btn view" title="View Supplier">
                            <Eye size={18} />
                          </Link>
                          <Link to={`/inventory/suppliers/edit/${sup.supplier_id}`} className="icon-btn edit" title="Edit Supplier">
                            <Edit size={18} />
                          </Link>
                          {sup.status === 'active' && (
                            <button className="icon-btn archive" title="Archive" onClick={() => openConfirmModal('archive', sup)}>
                              <Archive size={18} />
                            </button>
                          )}
                          <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal('delete', sup)}>
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
