import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Edit, Trash2, Plus, Receipt } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import '../../index.css';

export default function BillingList() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 5;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchBills();
  }, [page, searchQuery, statusFilter]);

  const fetchBills = async () => {
    setLoading(true);
    let query = supabase
      .from('billing')
      .select('*, patients(first_name, last_name)', { count: 'exact' });

    if (statusFilter !== 'all') {
      query = query.eq('payment_status', statusFilter);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('billing_date', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load billing records');
      console.error(error);
    } else {
      let filteredData = data;
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        filteredData = data.filter(b => 
          (b.patients?.first_name + ' ' + b.patients?.last_name).toLowerCase().includes(lowerQ)
        );
      }
      setBills(filteredData);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('billing')
      .delete()
      .eq('billing_id', id);

    if (error) {
      toast.error('Failed to delete billing record.');
    } else {
      toast.success('Billing record deleted successfully');
      fetchBills();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, bill) => {
    if (action === 'delete') {
      setModalConfig({
        title: 'Delete Billing Record',
        message: `Are you sure you want to permanently delete this billing record?`,
        confirmText: 'Delete',
        confirmType: 'danger',
        onConfirm: () => handleDelete(bill.billing_id)
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
              <Receipt className="text-primary" size={24} />
              Billing
            </h1>
            <p className="card-subtitle">Manage patient invoices and payments</p>
          </div>
          <Link to="/billing/records/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> New Bill
          </Link>
        </div>

        <div className="section-panel">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by patient name..."
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
              <option value="all">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Patient</th>
                <th>Amount ($)</th>
                <th>Payment Status</th>
                <th>Insurance Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No billing records found.</td>
                </tr>
              ) : (
                bills.map(bill => (
                  <tr key={bill.billing_id}>
                    <td>{bill.billing_id}</td>
                    <td>{new Date(bill.billing_date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 500 }}>{bill.patients?.first_name} {bill.patients?.last_name}</td>
                    <td>${Number(bill.amount).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${bill.payment_status === 'paid' ? 'badge-green' : bill.payment_status === 'partial' ? 'badge-blue' : 'badge-yellow'}`}>
                        {bill.payment_status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${bill.insurance_claim_status === 'approved' ? 'badge-green' : bill.insurance_claim_status === 'pending' ? 'badge-yellow' : ''}`}>
                        {bill.insurance_claim_status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/billing/records/edit/${bill.billing_id}`} className="icon-btn edit" title="Edit">
                          <Edit size={18} />
                        </Link>
                        <button className="icon-btn delete" title="Delete" onClick={() => openConfirmModal('delete', bill)}>
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
