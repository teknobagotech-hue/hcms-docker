import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Printer, Receipt, User, Calendar, CreditCard, ShieldCheck } from 'lucide-react';
import { printBillingReceipt } from '../../utils/printDocumentTemplates';
import '../../index.css';

export default function BillingView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

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
  
  // Breakdown
  const consultFee = Number(bill.consultation_fee || 0);
  const treatFee = Number(bill.treatment_fee || 0);
  const medFee = Number(bill.medication_fee || 0);
  const labFee = Number(bill.lab_fee || 0);
  const otherFee = Number(bill.other_fees || 0);
  const discount = Number(bill.discount || 0);

  const subtotal = consultFee + treatFee + medFee + labFee + otherFee;
  const totalAmount = Number(bill.amount || bill.total_amount || (subtotal - discount) || 0);
  const isPaid = (bill.payment_status || '').toLowerCase() === 'paid';

  const formatCurrency = (val) => `₱${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        
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
          </div>
        </div>

        {/* Main Details Card */}
        <div className="section-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div className="icon-primary" style={{ width: '3.75rem', height: '3.75rem', borderRadius: '1rem', backgroundColor: '#F0FDFA', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={30} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontWeight: 500 }}>INVOICE NUMBER</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-dark)', margin: '0.15rem 0' }}>
                {invoiceNo}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                <span className={`badge ${isPaid ? 'badge-blue' : ''}`} style={{ backgroundColor: isPaid ? '#DBEAFE' : '#FEF3C7', color: isPaid ? '#1D4ED8' : '#D97706', textTransform: 'uppercase', fontWeight: 600 }}>
                  Payment: {bill.payment_status || 'unpaid'}
                </span>
                <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#64748B', textTransform: 'uppercase' }}>
                  Insurance: {bill.insurance_claim_status || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <div className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient</div>
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
              <div className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billing Date</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                <Calendar size={16} color="var(--text-gray)" />
                {bill.billing_date ? new Date(bill.billing_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
              </div>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insurance Claim Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                <ShieldCheck size={16} color="var(--text-gray)" />
                <span style={{ textTransform: 'capitalize' }}>{bill.insurance_claim_status || 'None / N/A'}</span>
              </div>
            </div>
          </div>

          {/* Transparent Fee Breakdown */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Billing Transparency & Fee Breakdown
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: '#F1F5F9', color: 'var(--text-gray)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ textAlign: 'left', padding: '0.6rem 1rem' }}>Service / Item</th>
                    <th style={{ textAlign: 'right', padding: '0.6rem 1rem' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-dark)' }}>Consultation Fee</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(consultFee)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-dark)' }}>Treatment Fee</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 500, color: treatFee > 0 ? 'var(--text-dark)' : 'var(--text-light)' }}>{formatCurrency(treatFee)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-dark)' }}>Medication Fee</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(medFee)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-dark)' }}>Lab & Diagnostics Fee</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 500, color: labFee > 0 ? 'var(--text-dark)' : 'var(--text-light)' }}>{formatCurrency(labFee)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-dark)' }}>Other Fees</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 500, color: otherFee > 0 ? 'var(--text-dark)' : 'var(--text-light)' }}>{formatCurrency(otherFee)}</td>
                  </tr>
                  {discount > 0 && (
                    <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#DC2626' }}>
                      <td style={{ padding: '0.65rem 1rem' }}>Discount</td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 500 }}>-{formatCurrency(discount)}</td>
                    </tr>
                  )}
                  <tr style={{ background: '#FFFFFF' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)' }}>
                      Total Amount
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)' }}>
                      {formatCurrency(totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {bill.notes && (
            <div style={{ marginTop: '1.25rem' }}>
              <div className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes / Remarks</div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginTop: '0.25rem', border: '1px solid var(--border-color)', color: 'var(--text-dark)', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                {bill.notes}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
