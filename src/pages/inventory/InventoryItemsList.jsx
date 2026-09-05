import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Edit, Archive, Plus, Package, Eye } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import '../../index.css';

export default function InventoryItemsList() {
  const [items, setItems] = useState([]);
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
    fetchItems();
  }, [page, searchQuery, statusFilter]);

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase
      .from('inventory_items')
      .select('*, inventory_categories(category_name)', { count: 'exact' });

    if (searchQuery) {
      query = query.ilike('item_name', `%${searchQuery}%`);
    }
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('item_name', { ascending: true });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load inventory items');
      console.error(error);
    } else {
      setItems(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleArchive = async (id) => {
    const { error } = await supabase
      .from('inventory_items')
      .update({ status: 'inactive' })
      .eq('item_id', id);

    if (error) {
      toast.error('Failed to archive item');
    } else {
      toast.success('Item archived successfully');
      fetchItems();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, item) => {
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive Item',
        message: `Are you sure you want to archive "${item.item_name}"?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: () => handleArchive(item.item_id)
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
              <Package className="text-primary" size={24} />
              Inventory Items
            </h1>
            <p className="card-subtitle">Manage all hospital inventory stock</p>
          </div>
          <Link to="/inventory/items/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add Item
          </Link>
        </div>

        <div className="section-panel">
          <div className="filter-toolbar">
            <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search items by name..."
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
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No inventory items found.</td>
                  </tr>
                ) : (
                  items.map(item => (
                    <tr key={item.item_id}>
                      <td style={{ color: 'var(--text-gray)' }}>#{item.item_id}</td>
                      <td style={{ fontWeight: 500 }}>{item.item_name}</td>
                      <td>{item.inventory_categories?.category_name || '-'}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: item.quantity_in_stock <= item.reorder_level ? 'var(--danger)' : 'var(--text-dark)' }}>
                          {item.quantity_in_stock} {item.unit || ''}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>₱{Number(item.price || 0).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${item.status === 'active' ? 'badge-blue' : ''}`} style={{ backgroundColor: item.status === 'active' ? '#DBEAFE' : '#F1F5F9', color: item.status === 'active' ? '#1D4ED8' : '#64748B' }}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/inventory/items/view/${item.item_id}`} className="icon-btn view" title="View Item">
                            <Eye size={18} />
                          </Link>
                          <Link to={`/inventory/items/edit/${item.item_id}`} className="icon-btn edit" title="Edit Item">
                            <Edit size={18} />
                          </Link>
                          {item.status === 'active' && (
                            <button className="icon-btn archive" title="Archive" onClick={() => openConfirmModal('archive', item)}>
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
