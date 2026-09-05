import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Archive, Package, Tag, Layers, DollarSign, AlertTriangle, Calendar, Receipt, ExternalLink } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import '../../index.css';

export default function InventoryItemView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [receiptHistory, setReceiptHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    setLoading(true);
    // Fetch item details with category
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*, inventory_categories(category_name)')
      .eq('item_id', id)
      .single();

    if (error) {
      toast.error('Failed to load item details');
      navigate('/inventory/items');
      return;
    }

    setItem(data);

    // Fetch stock receipt history for this item
    const { data: historyData } = await supabase
      .from('stock_receipt_items')
      .select('*, stock_receipts(receipt_id, reference_number, receipt_date, suppliers(supplier_name))')
      .eq('item_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    setReceiptHistory(historyData || []);
    setLoading(false);
  };

  const handleArchive = async () => {
    const { error } = await supabase
      .from('inventory_items')
      .update({ status: 'inactive' })
      .eq('item_id', id);

    if (error) {
      toast.error('Failed to archive item');
    } else {
      toast.success('Item archived successfully');
      fetchItemDetails();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action) => {
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive Item',
        message: `Are you sure you want to archive "${item.item_name}"?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: handleArchive
      });
    }
    setModalOpen(true);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading item details...</div>;
  }

  if (!item) return null;

  const isLowStock = Number(item.quantity_in_stock || 0) <= Number(item.reorder_level || 0);

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '900px' }}>
        
        {/* Header Panel */}
        <div className="section-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/inventory/items" className="icon-btn" style={{ padding: '0.5rem' }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
              Inventory Item Details
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/inventory/items/edit/${item.item_id}`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={16} /> Edit
            </Link>
            {item.status === 'active' && (
              <button className="btn btn-warning" onClick={() => openConfirmModal('archive')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Archive size={16} /> Archive
              </button>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="section-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="icon-primary" style={{ width: '4rem', height: '4rem', padding: '1rem', borderRadius: '1rem', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                {item.item_name}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className={`badge ${item.status === 'active' ? 'badge-blue' : ''}`} style={{ backgroundColor: item.status === 'active' ? '#DBEAFE' : '#F1F5F9', color: item.status === 'active' ? '#1D4ED8' : '#64748B' }}>
                  {item.status ? item.status.toUpperCase() : 'ACTIVE'}
                </span>
                {isLowStock && (
                  <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                    <AlertTriangle size={12} /> LOW STOCK WARNING
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item ID</div>
              <p style={{ color: 'var(--text-dark)', fontWeight: 600, marginTop: '0.25rem' }}>#{item.item_id}</p>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                <Tag size={16} color="var(--text-gray)" />
                {item.inventory_categories?.category_name || 'Unassigned Category'}
              </div>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity in Stock</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isLowStock ? '#DC2626' : 'var(--text-dark)', fontWeight: 700, fontSize: '1.2rem', marginTop: '0.25rem' }}>
                <Layers size={18} color={isLowStock ? '#DC2626' : 'var(--primary)'} />
                {item.quantity_in_stock || 0} {item.unit || 'units'}
              </div>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reorder Level</div>
              <p style={{ color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                {item.reorder_level || 0} {item.unit || 'units'}
              </p>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit Price / Cost</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dark)', fontWeight: 600, fontSize: '1.1rem', marginTop: '0.25rem' }}>
                <DollarSign size={16} color="var(--text-gray)" />
                ₱{Number(item.price || item.unit_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Packaging Unit</div>
              <p style={{ color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>{item.unit || 'Not specified'}</p>
            </div>

            {item.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description / Notes</div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem', marginTop: '0.25rem', border: '1px solid var(--border-color)', color: 'var(--text-dark)', whiteSpace: 'pre-wrap' }}>
                  {item.description}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stock In History */}
        <div className="section-panel" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={18} color="var(--primary)" />
              Stock Receiving History
            </h3>
          </div>

          {receiptHistory.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-gray)', backgroundColor: '#F8FAFC', borderRadius: '0.5rem' }}>
              No stock receipt history recorded for this item yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt Ref.</th>
                    <th>Supplier</th>
                    <th>Date Received</th>
                    <th>Qty Received</th>
                    <th>Unit Cost</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptHistory.map(row => (
                    <tr key={row.receipt_item_id || row.id}>
                      <td style={{ fontWeight: 500 }}>{row.stock_receipts?.reference_number || `SR-#${row.receipt_id}`}</td>
                      <td>{row.stock_receipts?.suppliers?.supplier_name || '-'}</td>
                      <td>{row.stock_receipts?.receipt_date ? new Date(row.stock_receipts.receipt_date).toLocaleDateString() : '-'}</td>
                      <td style={{ fontWeight: 600 }}>+{row.quantity_received} {item.unit || ''}</td>
                      <td>₱{Number(row.unit_cost || 0).toFixed(2)}</td>
                      <td>
                        <Link to={`/inventory/receipts/view/${row.receipt_id}`} className="icon-btn view" title="View Receipt">
                          <ExternalLink size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
