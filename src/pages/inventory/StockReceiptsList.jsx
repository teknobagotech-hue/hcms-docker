import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { Search, Edit, Archive, Plus, Receipt, Eye, Printer } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { printStockReceipt } from '../../utils/printDocumentTemplates';
import '../../index.css';

export default function StockReceiptsList() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Confirm Delete Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchReceipts();
  }, [page, searchQuery]);

  const fetchReceipts = async () => {
    setLoading(true);
    let query = supabase
      .from('stock_receipts')
      .select('*, suppliers(supplier_name)', { count: 'exact' });

    if (searchQuery) {
      query = query.ilike('reference_number', `%${searchQuery}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('receipt_date', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      toast.error('Failed to load stock receipts');
      console.error(error);
    } else {
      setReceipts(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handlePrint = async (receipt) => {
    try {
      const { data: itemsData, error } = await supabase
        .from('stock_receipt_items')
        .select('*, inventory_items(item_name)')
        .eq('receipt_id', receipt.receipt_id);

      if (error) {
        toast.error('Failed to load receipt items');
        return;
      }

      let items = itemsData || [];
      if (items.some(i => !i.inventory_items)) {
        const { data: allInv } = await supabase.from('inventory_items').select('item_id, item_name');
        if (allInv) {
          const invMap = new Map(allInv.map(inv => [inv.item_id, inv]));
          items = items.map(i => ({
            ...i,
            inventory_items: i.inventory_items || invMap.get(i.item_id)
          }));
        }
      }

      printStockReceipt({ receipt, items });
    } catch (err) {
      console.error(err);
      toast.error('Error printing receipt.');
    }
  };

  const handleArchive = async (id) => {
    const { error } = await supabase
      .from('stock_receipts')
      .update({ status: 'archived' })
      .eq('receipt_id', id);

    if (error) {
      toast.error('Failed to archive receipt.');
    } else {
      toast.success('Receipt archived successfully');
      fetchReceipts();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action, receipt) => {
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive Stock Receipt',
        message: `Are you sure you want to archive receipt "${receipt.reference_number || receipt.receipt_id}"?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: () => handleArchive(receipt.receipt_id)
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
              <Receipt className="text-primary" size={24} />
              Stock Receipts
            </h1>
            <p className="card-subtitle">Manage incoming inventory from suppliers</p>
          </div>
          <Link to="/inventory/receipts/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> New Receipt
          </Link>
        </div>

        <div className="section-panel">
          <div className="filter-toolbar">
            <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <Search className="input-icon" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by Reference Number..."
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
                  <th>Date</th>
                  <th>Ref No.</th>
                  <th>Supplier</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td>
                  </tr>
                ) : receipts.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No receipts found.</td>
                  </tr>
                ) : (
                  receipts.map(receipt => (
                    <tr key={receipt.receipt_id}>
                      <td style={{ color: 'var(--text-gray)' }}>#{receipt.receipt_id}</td>
                      <td>{new Date(receipt.receipt_date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 500 }}>{receipt.reference_number || '-'}</td>
                      <td>{receipt.suppliers?.supplier_name || '-'}</td>
                      <td style={{ fontWeight: 600 }}>₱{Number(receipt.total_cost || 0).toFixed(2)}</td>
                      <td>
                        <span className="badge badge-blue">
                          {receipt.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/inventory/receipts/view/${receipt.receipt_id}`} className="icon-btn view" title="View Receipt Details">
                            <Eye size={18} />
                          </Link>
                          <button className="icon-btn" style={{ color: 'var(--text-gray)' }} title="Print Stock Receipt" onClick={() => handlePrint(receipt)}>
                            <Printer size={18} />
                          </button>
                          <Link to={`/inventory/receipts/edit/${receipt.receipt_id}`} className="icon-btn edit" title="Edit">
                            <Edit size={18} />
                          </Link>
                          {receipt.status !== 'archived' && (
                            <button className="icon-btn archive" title="Archive" onClick={() => openConfirmModal('archive', receipt)}>
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
