import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Edit, Trash2, Plus, Pill } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import '../../index.css';

export default function MedicinesList() {
  const [medicines, setMedicines] = useState([]);
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
    fetchMedicines();
  }, [page, searchQuery]);

  const fetchMedicines = async () => {
    setLoading(true);
    let query = supabase
      .from('medicines')
      .select('*', { count: 'exact' });

    if (searchQuery) {
      query = query.ilike('medicine_name', `%${searchQuery}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('medicine_name', { ascending: true });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load medicines');
      console.error(error);
    } else {
      setMedicines(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('medicines')
      .delete()
      .eq('medicine_id', id);

    if (error) {
      toast.error('Failed to delete medicine. It may be in use.');
    } else {
      toast.success('Medicine deleted successfully');
      fetchMedicines();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, medicine) => {
    if (action === 'delete') {
      setModalConfig({
        title: 'Delete Medicine',
        message: `Are you sure you want to permanently delete "${medicine.medicine_name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmType: 'danger',
        onConfirm: () => handleDelete(medicine.medicine_id)
      });
      setModalOpen(true);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container">
        
        <div className="section-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Pill className="text-primary" size={24} />
              Medicines
            </h1>
            <p className="card-subtitle">Manage hospital medicine database</p>
          </div>
          <Link to="/inventory/medicines/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add Medicine
          </Link>
        </div>

        <div className="section-panel">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search medicines by name..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Medicine Name</th>
                <th>Dosage Form</th>
                <th>Strength</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No medicines found.</td>
                </tr>
              ) : (
                medicines.map(med => (
                  <tr key={med.medicine_id}>
                    <td>{med.medicine_id}</td>
                    <td style={{ fontWeight: 500 }}>{med.medicine_name}</td>
                    <td>{med.dosage_form || '-'}</td>
                    <td>{med.strength || '-'}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/inventory/medicines/edit/${med.medicine_id}`} className="icon-btn edit" title="Edit">
                          <Edit size={18} />
                        </Link>
                        <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal('delete', med)}>
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
