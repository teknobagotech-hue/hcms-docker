import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import '../../index.css';

export default function BillingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [patients, setPatients] = useState([]);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    billing_date: new Date().toISOString().split('T')[0],
    consultation_fee: 0,
    treatment_fee: 0,
    medication_fee: 0,
    lab_fee: 0,
    other_fees: 0,
    discount: 0,
    amount: 0, // Total
    payment_status: 'pending',
    insurance_claim_status: 'pending'
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDropdowns();
    if (isEditing) {
      fetchBill();
    }
  }, [id]);

  const fetchDropdowns = async () => {
    const { data: pData } = await supabase.from('patients').select('patient_id, first_name, last_name').order('last_name');
    if (pData) setPatients(pData);
  };

  const fetchBill = async () => {
    const { data, error } = await supabase
      .from('billing')
      .select('*')
      .eq('billing_id', id)
      .single();

    if (error) {
      toast.error('Failed to load bill details');
      navigate('/billing/records');
      return;
    }

    setFormData({
      patient_id: data.patient_id || '',
      billing_date: data.billing_date ? data.billing_date.split('T')[0] : '',
      consultation_fee: data.consultation_fee || 0,
      treatment_fee: data.treatment_fee || 0,
      medication_fee: data.medication_fee || 0,
      lab_fee: data.lab_fee || 0,
      other_fees: data.other_fees || 0,
      discount: data.discount || 0,
      amount: data.amount || 0,
      payment_status: data.payment_status || 'pending',
      insurance_claim_status: data.insurance_claim_status || 'pending'
    });
  };

  const calculateTotal = (data) => {
    const subtotal = 
      (parseFloat(data.consultation_fee) || 0) +
      (parseFloat(data.treatment_fee) || 0) +
      (parseFloat(data.medication_fee) || 0) +
      (parseFloat(data.lab_fee) || 0) +
      (parseFloat(data.other_fees) || 0);
    
    const total = subtotal - (parseFloat(data.discount) || 0);
    return Math.max(0, total);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: parsedValue };
      
      // Auto-calculate total if fee fields change
      const feeFields = ['consultation_fee', 'treatment_fee', 'medication_fee', 'lab_fee', 'other_fees', 'discount'];
      if (feeFields.includes(name)) {
        updated.amount = calculateTotal(updated);
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { 
      ...formData, 
      patient_id: formData.patient_id ? parseInt(formData.patient_id) : null 
    };

    let error;

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('billing')
        .update(payload)
        .eq('billing_id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('billing')
        .insert([payload]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? 'Bill updated successfully' : 'Bill created successfully');
      navigate('/billing/records');
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to="/billing/records" className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Bill' : 'New Bill'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="section-panel" style={{ marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Patient & Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Patient *</label>
              <SearchableSelect
                name="patient_id"
                options={patients.map(p => ({ label: `${p.first_name} ${p.last_name}`, value: p.patient_id }))}
                value={formData.patient_id}
                onChange={handleChange}
                placeholder="Select Patient"
                required
              />
            </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  name="billing_date"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.billing_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Payment Status</label>
              <SearchableSelect
                name="payment_status"
                options={[
                  { label: 'Pending', value: 'pending' },
                  { label: 'Partial', value: 'partial' },
                  { label: 'Paid', value: 'paid' }
                ]}
                value={formData.payment_status}
                onChange={handleChange}
              />
            </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Insurance Claim Status</label>
              <SearchableSelect
                name="insurance_claim_status"
                options={[
                  { label: 'Pending', value: 'pending' },
                  { label: 'Submitted', value: 'submitted' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Rejected', value: 'rejected' }
                ]}
                value={formData.insurance_claim_status}
                onChange={handleChange}
              />
            </div>
            </div>
          </div>

          <div className="section-panel">
            <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Fees & Breakdown</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Consultation Fee</label>
                <input
                  type="number"
                  name="consultation_fee"
                  min="0"
                  step="0.01"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.consultation_fee}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Treatment Fee</label>
                <input
                  type="number"
                  name="treatment_fee"
                  min="0"
                  step="0.01"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.treatment_fee}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Medication Fee</label>
                <input
                  type="number"
                  name="medication_fee"
                  min="0"
                  step="0.01"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.medication_fee}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Lab & Diagnostics Fee</label>
                <input
                  type="number"
                  name="lab_fee"
                  min="0"
                  step="0.01"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.lab_fee}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Other Fees</label>
                <input
                  type="number"
                  name="other_fees"
                  min="0"
                  step="0.01"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.other_fees}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Discount</label>
                <input
                  type="number"
                  name="discount"
                  min="0"
                  step="0.01"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.discount}
                  onChange={handleChange}
                />
              </div>

              <hr style={{ gridColumn: '1 / -1', border: 0, borderTop: '1px dashed var(--border-color)', margin: '0.5rem 0' }} />

              <div className="form-group" style={{ margin: 0, gridColumn: '2 / 3' }}>
                <label className="form-label" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Total Amount Due ($)</label>
                <input
                  type="number"
                  name="amount"
                  className="form-input"
                  style={{ paddingLeft: '1rem', backgroundColor: '#f8fafc', fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-color)' }}
                  value={formData.amount}
                  readOnly
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', gridColumn: '1 / -1' }}>
                <Link to="/billing/records" className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Bill'}
                </button>
              </div>

            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
