import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Edit, Trash2, Plus, ShoppingCart, Printer, Eye } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { printPharmacyReceipt } from '../../utils/printDocumentTemplates';
import '../../index.css';

export default function WithdrawalsList() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchWithdrawals();
  }, [page, searchQuery, statusFilter]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    let query = supabase
      .from('inventory_withdrawals')
      .select('*, patients(first_name, last_name)', { count: 'exact' });

    if (searchQuery) {
      query = query.ilike('customer_name', `%${searchQuery}%`);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('withdrawal_date', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load pharmacy sales');
      console.error(error);
    } else {
      setWithdrawals(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handlePrintReceipt = async (sale) => {
    try {
      // Fetch withdrawal items with linked inventory items info
      const { data: itemsData, error } = await supabase
        .from('inventory_withdrawal_items')
        .select('*, inventory_items(item_name, price, unit)')
        .eq('withdrawal_id', sale.withdrawal_id);

      if (error) {
        toast.error('Could not load sale items for receipt.');
        console.error(error);
        return;
      }

      let items = itemsData || [];
      
      // Fallback if inventory_items join was not returned directly
      if (items.some(i => !i.inventory_items)) {
        const { data: allInv } = await supabase.from('inventory_items').select('item_id, item_name, price, unit');
        if (allInv) {
          const invMap = new Map(allInv.map(inv => [inv.item_id, inv]));
          items = items.map(i => ({
            ...i,
            inventory_items: i.inventory_items || invMap.get(i.item_id)
          }));
        }
      }

      printPharmacyReceipt({ sale, items });
    } catch (err) {
      console.error(err);
      toast.error('Error generating receipt.');
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('inventory_withdrawals')
      .delete()
      .eq('withdrawal_id', id);

    if (error) {
      toast.error('Failed to delete record.');
    } else {
      toast.success('Record deleted successfully');
      fetchWithdrawals();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, withdrawal) => {
    if (action === 'delete') {
      setModalConfig({
        title: 'Delete Sale Record',
        message: `Are you sure you want to permanently delete this record? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmType: 'danger',
        onConfirm: () => handleDelete(withdrawal.withdrawal_id)
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
              <ShoppingCart className="text-primary" size={24} />
              Pharmacy Sales
            </h1>
            <p className="card-subtitle">Manage inventory withdrawals and retail sales</p>
          </div>
          <Link to="/pharmacy/sales/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> New Sale
          </Link>
        </div>

        <div className="section-panel">
          <div className="filter-toolbar">
            <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by customer name..."
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
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Amount Due</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                  </tr>
                ) : withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No sales or withdrawals found.</td>
                  </tr>
                ) : (
                  withdrawals.map(w => (
                    <tr key={w.withdrawal_id}>
                      <td style={{ color: 'var(--text-gray)' }}>#{w.withdrawal_id}</td>
                      <td>{new Date(w.withdrawal_date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 500 }}>{w.customer_name || 'Walk-in'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{w.sale_type}</td>
                      <td style={{ fontWeight: 600 }}>₱{Number(w.amount_due || 0).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${w.payment_status === 'paid' ? 'badge-blue' : ''}`} style={{ backgroundColor: w.payment_status === 'paid' ? '#DBEAFE' : '#FEF3C7', color: w.payment_status === 'paid' ? '#1D4ED8' : '#D97706' }}>
                          {w.payment_status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${w.status === 'completed' ? 'badge-blue' : ''}`} style={{ backgroundColor: w.status === 'completed' ? '#DBEAFE' : w.status === 'pending' ? '#FEF3C7' : '#F1F5F9', color: w.status === 'completed' ? '#1D4ED8' : w.status === 'pending' ? '#D97706' : '#64748B' }}>
                          {w.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/pharmacy/sales/edit/${w.withdrawal_id}`} className="icon-btn view" title="View/Edit Sale">
                            <Eye size={18} />
                          </Link>
                          <button className="icon-btn" style={{ color: 'var(--text-gray)' }} title="Print Receipt" onClick={() => handlePrintReceipt(w)}>
                            <Printer size={18} />
                          </button>
                          <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal('delete', w)}>
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
