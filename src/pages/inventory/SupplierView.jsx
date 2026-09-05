import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Archive, Truck, User, Phone, Mail, MapPin, Calendar, Receipt, ExternalLink } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import '../../index.css';

export default function SupplierView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchSupplierDetails();
  }, [id]);

  const fetchSupplierDetails = async () => {
    setLoading(true);
    // Fetch supplier
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('supplier_id', id)
      .single();

    if (error) {
      toast.error('Failed to load supplier details');
      navigate('/inventory/suppliers');
      return;
    }

    setSupplier(data);

    // Fetch related stock receipts
    const { data: receiptsData } = await supabase
      .from('stock_receipts')
      .select('*')
      .eq('supplier_id', id)
      .order('receipt_date', { ascending: false })
      .limit(10);

    setReceipts(receiptsData || []);
    setLoading(false);
  };

  const handleArchive = async () => {
    const { error } = await supabase
      .from('suppliers')
      .update({ status: 'inactive' })
      .eq('supplier_id', id);

    if (error) {
      toast.error('Failed to archive supplier');
    } else {
      toast.success('Supplier archived successfully');
      fetchSupplierDetails();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action) => {
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive Supplier',
        message: `Are you sure you want to archive "${supplier.supplier_name}"?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: handleArchive
      });
    }
    setModalOpen(true);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading supplier details...</div>;
  }

  if (!supplier) return null;

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '900px' }}>
        
        {/* Header Panel */}
        <div className="section-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/inventory/suppliers" className="icon-btn" style={{ padding: '0.5rem' }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
              Supplier Details
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/inventory/suppliers/edit/${supplier.supplier_id}`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={16} /> Edit
            </Link>
            {supplier.status === 'active' && (
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
              <Truck size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                {supplier.supplier_name}
              </h2>
              <span className={`badge ${supplier.status === 'active' ? 'badge-blue' : ''}`} style={{ backgroundColor: supplier.status === 'active' ? '#DBEAFE' : '#F1F5F9', color: supplier.status === 'active' ? '#1D4ED8' : '#64748B' }}>
                {supplier.status ? supplier.status.toUpperCase() : 'ACTIVE'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier ID</div>
              <p style={{ color: 'var(--text-dark)', fontWeight: 600, marginTop: '0.25rem' }}>#{supplier.supplier_id}</p>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Person</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                <User size={16} color="var(--text-gray)" />
                {supplier.contact_person || 'Not specified'}
              </div>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Number / Phone</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                <Phone size={16} color="var(--text-gray)" />
                {supplier.contact_number || supplier.phone || 'Not specified'}
              </div>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                <Mail size={16} color="var(--text-gray)" />
                {supplier.email ? (
                  <a href={`mailto:${supplier.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                    {supplier.email}
                  </a>
                ) : 'Not specified'}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                <MapPin size={16} color="var(--text-gray)" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span>{supplier.address || 'No address provided'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Stock Receipts */}
        <div className="section-panel" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={18} color="var(--primary)" />
              Stock Receipts from Supplier
            </h3>
            <Link to="/inventory/receipts/add" className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
              + New Stock Receipt
            </Link>
          </div>

          {receipts.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-gray)', backgroundColor: '#F8FAFC', borderRadius: '0.5rem' }}>
              No stock receipts recorded for this supplier yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt ID</th>
                    <th>Reference No.</th>
                    <th>Receipt Date</th>
                    <th>Total Cost</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map(rcpt => (
                    <tr key={rcpt.receipt_id}>
                      <td style={{ color: 'var(--text-gray)' }}>#{rcpt.receipt_id}</td>
                      <td style={{ fontWeight: 500 }}>{rcpt.reference_number || '-'}</td>
                      <td>{rcpt.receipt_date ? new Date(rcpt.receipt_date).toLocaleDateString() : '-'}</td>
                      <td style={{ fontWeight: 600 }}>₱{Number(rcpt.total_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>
                        <span className="badge badge-blue" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
                          {rcpt.status || 'Completed'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/inventory/receipts/view/${rcpt.receipt_id}`} className="icon-btn view" title="View Receipt">
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
