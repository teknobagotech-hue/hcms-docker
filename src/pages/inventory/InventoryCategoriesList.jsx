import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Edit, Trash2, Plus, Tags } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import '../../index.css';

export default function InventoryCategoriesList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, [page, searchQuery]);

  const fetchCategories = async () => {
    setLoading(true);
    let query = supabase
      .from('inventory_categories')
      .select('*', { count: 'exact' });

    if (searchQuery) {
      query = query.ilike('category_name', `%${searchQuery}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('category_name', { ascending: true });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load categories');
      console.error(error);
    } else {
      setCategories(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('inventory_categories')
      .delete()
      .eq('category_id', id);

    if (error) {
      toast.error('Failed to delete category. It may be in use.');
    } else {
      toast.success('Category deleted successfully');
      fetchCategories();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, category) => {
    if (action === 'delete') {
      setModalConfig({
        title: 'Delete Category',
        message: `Are you sure you want to permanently delete "${category.category_name}"?`,
        confirmText: 'Delete',
        confirmType: 'danger',
        onConfirm: () => handleDelete(category.category_id)
      });
      setModalOpen(true);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container">
        
        <div className="page-header-flex">
          <div>
            <h1 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tags className="text-primary" size={24} />
              Inventory Categories
            </h1>
            <p className="card-subtitle">Manage categorization for inventory items</p>
          </div>
          <Link to="/inventory/categories/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add Category
          </Link>
        </div>

        <div className="section-panel">
          <div className="filter-toolbar">
            <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category Name</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No categories found.</td>
                  </tr>
                ) : (
                  categories.map(cat => (
                    <tr key={cat.category_id}>
                      <td style={{ color: 'var(--text-gray)' }}>#{cat.category_id}</td>
                      <td style={{ fontWeight: 500 }}>{cat.category_name}</td>
                      <td>{cat.created_at ? new Date(cat.created_at).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/inventory/categories/edit/${cat.category_id}`} className="icon-btn edit" title="Edit">
                            <Edit size={18} />
                          </Link>
                          <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal('delete', cat)}>
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
