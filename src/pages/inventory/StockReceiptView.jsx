import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Trash2, Printer, Receipt, Truck, Calendar, FileText, Tag } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { printStockReceipt } from '../../utils/printDocumentTemplates';
import '../../index.css';

export default function StockReceiptView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [receiptItems, setReceiptItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchStockReceiptDetails();
  }, [id]);

  const fetchStockReceiptDetails = async () => {
    setLoading(true);
    // Fetch receipt data with supplier info
    const { data, error } = await supabase
      .from('stock_receipts')
      .select('*, suppliers(*)')
      .eq('receipt_id', id)
      .maybeSingle();

    if (error) {
      toast.error('Failed to load stock receipt details');
      navigate('/inventory/receipts');
      return;
    }

    setReceipt(data);

    // Fetch items received in this receipt
    const { data: itemsData } = await supabase
      .from('stock_receipt_items')
      .select('*, inventory_items(item_name, unit)')
      .eq('receipt_id', id);

    let items = itemsData || [];
    if (items.some(i => !i.inventory_items)) {
      const { data: allInv } = await supabase.from('inventory_items').select('item_id, item_name, unit');
      if (allInv) {
        const invMap = new Map(allInv.map(inv => [inv.item_id, inv]));
        items = items.map(i => ({
          ...i,
          inventory_items: i.inventory_items || invMap.get(i.item_id)
        }));
      }
    }

    setReceiptItems(items);
    setLoading(false);
  };

  const handlePrint = () => {
    if (receipt) {
      printStockReceipt({ receipt, items: receiptItems });
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('stock_receipts')
      .delete()
      .eq('receipt_id', id);

    if (error) {
      toast.error('Failed to delete receipt.');
    } else {
      toast.success('Stock receipt deleted successfully');
      navigate('/inventory/receipts');
    }
    setModalOpen(false);
  };

  const openConfirmModal = () => {
    setModalConfig({
      title: 'Delete Stock Receipt',
      message: `Are you sure you want to permanently delete receipt "${receipt.reference_number || receipt.receipt_id}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmType: 'danger',
      onConfirm: handleDelete
    });
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="dashboard-scroll-area">
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-gray)' }}>
          Loading receipt details...
        </div>
      </div>
    );
  }

  if (!receipt) return null;

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '900px' }}>
        
        {/* Top Action Header */}
        <div className="section-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/inventory/receipts" className="icon-btn" style={{ padding: '0.5rem' }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
                Stock Receipt Details
              </h1>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                Ref #: {receipt.reference_number || `SR-${receipt.receipt_id}`}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0d9488' }}>
              <Printer size={16} /> Print Receipt
            </button>
            <Link to={`/inventory/receipts/edit/${receipt.receipt_id}`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={16} /> Edit
            </Link>
            <button className="btn btn-danger" onClick={openConfirmModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>

        {/* Receipt Information Card */}
        <div className="section-panel" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div className="icon-primary" style={{ width: '3.5rem', height: '3.5rem', padding: '0.875rem', borderRadius: '0.75rem' }}>
              <Receipt size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
                Stock Receipt #{receipt.receipt_id}
              </h2>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                Recorded on {new Date(receipt.receipt_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Truck size={14} /> Supplier
              </div>
              <div style={{ color: 'var(--text-dark)', fontWeight: 600, fontSize: '1.05rem' }}>
                {receipt.suppliers?.supplier_name || 'N/A'}
              </div>
              {receipt.suppliers?.contact_person && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
                  Contact: {receipt.suppliers.contact_person}
                </div>
              )}
            </div>

            <div>
              <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} /> Receipt Date
              </div>
              <div style={{ color: 'var(--text-dark)', fontWeight: 500 }}>
                {new Date(receipt.receipt_date).toLocaleDateString()}
              </div>
            </div>

            <div>
              <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Tag size={14} /> Reference Number
              </div>
              <div style={{ color: 'var(--text-dark)', fontWeight: 500 }}>
                {receipt.reference_number || '-'}
              </div>
            </div>

            <div>
              <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Total Cost
              </div>
              <div style={{ color: '#0d9488', fontWeight: 700, fontSize: '1.25rem' }}>
                ₱{Number(receipt.total_cost || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {receipt.notes && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)' }}>
              <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={14} /> Notes
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '0.875rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-dark)', whiteSpace: 'pre-wrap' }}>
                {receipt.notes}
              </div>
            </div>
          )}
        </div>

        {/* Received Items Table */}
        <div className="section-panel">
          <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>
            Items Received ({receiptItems.length})
          </h2>

          {receiptItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              No item details recorded for this receipt.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>#</th>
                    <th>Item Name</th>
                    <th style={{ textAlign: 'center' }}>Qty Received</th>
                    <th style={{ textAlign: 'right' }}>Unit Cost</th>
                    <th style={{ textAlign: 'right' }}>Line Total</th>
                    <th style={{ textAlign: 'center' }}>Batch No.</th>
                    <th style={{ textAlign: 'center' }}>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptItems.map((item, index) => {
                    const itemName = item.inventory_items?.item_name || `Item #${item.item_id}`;
                    const qty = Number(item.quantity_received || 0);
                    const unitCost = Number(item.unit_cost || 0);
                    const lineTotal = qty * unitCost;

                    return (
                      <tr key={item.item_id || index}>
                        <td>{index + 1}</td>
                        <td style={{ fontWeight: 600 }}>{itemName}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-blue">
                            {qty} {item.inventory_items?.unit || ''}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>₱{unitCost.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary-color)' }}>₱{lineTotal.toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>{item.batch_number || '-'}</td>
                        <td style={{ textAlign: 'center' }}>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}</td>
                      </tr>
                    );
                  })}
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
