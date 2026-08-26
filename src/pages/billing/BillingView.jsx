import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Trash2, Printer, Receipt, User, Calendar, CreditCard, ShieldCheck, FileText } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { printBillingReceipt } from '../../utils/printDocumentTemplates';
import '../../index.css';

export default function BillingView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchBillDetails();
  }, [id]);

  const fetchBillDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('billing')
      .select('*, patients(patient_id, first_name, last_name, gender, date_of_birth, contact_number, email)')
      .eq('billing_id', id)
      .single();

    if (error) {
      toast.error('Failed to load billing record');
      navigate('/billing/records');
      return;
    }

    setBill(data);
    setLoading(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('billing')
      .delete()
      .eq('billing_id', id);

    if (error) {
      toast.error('Failed to delete billing record');
    } else {
      toast.success('Billing record deleted successfully');
      navigate('/billing/records');
    }
    setModalOpen(false);
  };

  const handlePrint = () => {
    if (bill) {
      printBillingReceipt({ bill });
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading billing details...</div>;
  }

  if (!bill) return null;

  const invoiceNo = `INV-${String(bill.billing_id).padStart(5, '0')}`;
  const amount = Number(bill.total_amount || bill.amount || 0);

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '850px' }}>
        
        {/* Header Panel */}
        <div className="section-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/billing/records" className="icon-btn" style={{ padding: '0.5rem' }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
                Billing Statement {invoiceNo}
              </h1>
              <p className="card-subtitle" style={{ margin: 0 }}>View invoice and payment summary</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Printer size={16} /> Print Receipt
            </button>
            <Link to={`/billing/records/edit/${bill.billing_id}`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={16} /> Edit
            </Link>
            <button className="btn btn-danger" onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>

        {/* Main Details Card */}
        <div className="section-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div className="icon-primary" style={{ width: '4rem', height: '4rem', padding: '1rem', borderRadius: '1rem', backgroundColor: '#F0FDFA', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={32} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: 500 }}>INVOICE NUMBER</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0.2rem 0' }}>
                {invoiceNo}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <span className={`badge ${bill.payment_status === 'paid' ? 'badge-blue' : ''}`} style={{ backgroundColor: bill.payment_status === 'paid' ? '#DBEAFE' : '#FEF3C7', color: bill.payment_status === 'paid' ? '#1D4ED8' : '#D97706', textTransform: 'uppercase', fontWeight: 600 }}>
                  Payment: {bill.payment_status || 'unpaid'}
                </span>
                <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#64748B', textTransform: 'uppercase' }}>
                  Insurance: {bill.insurance_claim_status || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient</div>
              <div style={{ marginTop: '0.25rem' }}>
                {bill.patients ? (
                  <Link to={`/patients/view/${bill.patients.patient_id}`} style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={16} />
                    {bill.patients.first_name} {bill.patients.last_name}
                  </Link>
                ) : (
                  <span style={{ color: 'var(--text-dark)', fontWeight: 500 }}>Unassigned Patient</span>
                )}
              </div>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billing Date</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                <Calendar size={16} color="var(--text-gray)" />
                {bill.billing_date ? new Date(bill.billing_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
              </div>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A', fontWeight: 700, fontSize: '1.3rem', marginTop: '0.25rem' }}>
                <CreditCard size={20} color="var(--primary)" />
                ₱{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insurance Claim Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                <ShieldCheck size={16} color="var(--text-gray)" />
                <span style={{ textTransform: 'capitalize' }}>{bill.insurance_claim_status || 'None / N/A'}</span>
              </div>
            </div>

            {bill.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes / Remarks</div>
                <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem', marginTop: '0.25rem', border: '1px solid var(--border-color)', color: 'var(--text-dark)', whiteSpace: 'pre-wrap' }}>
                  {bill.notes}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <ConfirmModal 
        isOpen={modalOpen} 
        onCancel={() => setModalOpen(false)}
        title="Delete Billing Record"
        message="Are you sure you want to permanently delete this billing record?"
        confirmText="Delete"
        confirmType="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
