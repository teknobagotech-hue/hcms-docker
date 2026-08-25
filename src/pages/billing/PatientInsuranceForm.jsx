import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import '../../index.css';

export default function PatientInsuranceForm() {
  const { id, patient_id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isEditing = !!id;
  const initialPatientId = patient_id || searchParams.get('patient_id') || '';

  const [patients, setPatients] = useState([]);
  const [providers, setProviders] = useState([]);

  const [formData, setFormData] = useState({
    patient_id: initialPatientId,
    insurance_provider_id: '',
    insurance_number: '',
    coverage_details: '',
    effective_date: '',
    expiration_date: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDropdowns();
    if (isEditing) {
      fetchPolicy();
    }
  }, [id]);

  const fetchDropdowns = async () => {
    const { data: pData } = await supabase
      .from('patients')
      .select('patient_id, first_name, last_name')
      .order('last_name');
    if (pData) setPatients(pData);

    const { data: provData } = await supabase
      .from('insurance_providers')
      .select('insurance_provider_id, provider_name')
      .eq('status', 'active')
      .order('provider_name');
    if (provData) setProviders(provData);
  };

  const fetchPolicy = async () => {
    const { data, error } = await supabase
      .from('patient_insurance')
      .select('*')
      .eq('patient_insurance_id', id)
      .single();

    if (error) {
      toast.error('Failed to load patient insurance policy details');
      navigate('/billing/patient-insurance');
      return;
    }

    setFormData({
      patient_id: data.patient_id || '',
      insurance_provider_id: data.insurance_provider_id || '',
      insurance_number: data.insurance_number || '',
      coverage_details: data.coverage_details || '',
      effective_date: data.effective_date ? data.effective_date.split('T')[0] : '',
      expiration_date: data.expiration_date ? data.expiration_date.split('T')[0] : '',
      status: data.status || 'active'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.patient_id) {
      toast.error('Please select a patient');
      return;
    }

    if (!formData.insurance_provider_id) {
      toast.error('Please select an insurance provider');
      return;
    }

    if (!formData.insurance_number.trim()) {
      toast.error('Policy / Card number is required');
      return;
    }

    setLoading(true);

    const fullPayload = {
      patient_id: parseInt(formData.patient_id),
      insurance_provider_id: parseInt(formData.insurance_provider_id),
      insurance_number: formData.insurance_number.trim(),
      coverage_details: formData.coverage_details.trim() || null,
      effective_date: formData.effective_date || null,
      expiration_date: formData.expiration_date || null,
      status: formData.status
    };

    const corePayload = {
      patient_id: parseInt(formData.patient_id),
      insurance_provider_id: parseInt(formData.insurance_provider_id),
      insurance_number: formData.insurance_number.trim(),
      status: formData.status
    };

    let error;
    if (isEditing) {
      const res = await supabase
        .from('patient_insurance')
        .update(fullPayload)
        .eq('patient_insurance_id', id);
      error = res.error;

      // Fallback if schema cache is missing new columns
      if (error && (error.message?.includes('schema cache') || error.message?.includes('coverage_details'))) {
        const retryRes = await supabase
          .from('patient_insurance')
          .update(corePayload)
          .eq('patient_insurance_id', id);
        error = retryRes.error;
        if (!error) {
          toast('Saved core fields. Please run patient_insurance_setup.sql in Supabase SQL Editor for extra columns.', { icon: '⚠️', duration: 6000 });
        }
      }
    } else {
      const res = await supabase
        .from('patient_insurance')
        .insert([fullPayload]);
      error = res.error;

      // Fallback if schema cache is missing new columns
      if (error && (error.message?.includes('schema cache') || error.message?.includes('coverage_details'))) {
        const retryRes = await supabase
          .from('patient_insurance')
          .insert([corePayload]);
        error = retryRes.error;
        if (!error) {
          toast('Saved core fields. Please run patient_insurance_setup.sql in Supabase SQL Editor for extra columns.', { icon: '⚠️', duration: 6000 });
        }
      }
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? 'Insurance policy updated' : 'Insurance policy added successfully');
      
      if (initialPatientId) {
        navigate(`/patients/view/${initialPatientId}?tab=insurance`);
      } else {
        navigate('/billing/patient-insurance');
      }
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="icon-btn" 
            style={{ padding: '0.5rem' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Patient Insurance Policy' : 'Add Patient Insurance Policy'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="section-panel" style={{ marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Patient & Insurance Provider</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Patient *</label>
                <SearchableSelect
                  name="patient_id"
                  options={patients.map(p => ({ label: `${p.last_name}, ${p.first_name}`, value: p.patient_id }))}
                  value={formData.patient_id}
                  onChange={handleChange}
                  placeholder="Select Patient"
                  disabled={!!initialPatientId && isEditing}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Insurance Provider *</label>
                <SearchableSelect
                  name="insurance_provider_id"
                  options={providers.map(prov => ({ label: prov.provider_name, value: prov.insurance_provider_id }))}
                  value={formData.insurance_provider_id}
                  onChange={handleChange}
                  placeholder="Select Provider"
                  required
                />
              </div>

            </div>
          </div>

          <div className="section-panel" style={{ marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Policy & Coverage Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Policy / Member / Card Number *</label>
                <input
                  type="text"
                  name="insurance_number"
                  className="form-input"
                  placeholder="e.g. POL-99823411"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.insurance_number}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Status</label>
                <select
                  name="status"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Effective Date</label>
                <input
                  type="date"
                  name="effective_date"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.effective_date}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Expiration Date</label>
                <input
                  type="date"
                  name="expiration_date"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.expiration_date}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label className="form-label">Plan / Coverage Notes</label>
                <textarea
                  name="coverage_details"
                  className="form-input"
                  style={{ paddingLeft: '1rem', minHeight: '80px' }}
                  placeholder="Describe policy coverage (e.g. Inpatient 100%, Outpatient 80%, Max Benefit ₱500,000)..."
                  value={formData.coverage_details}
                  onChange={handleChange}
                />
              </div>

            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="btn btn-cancel" 
              style={{ textDecoration: 'none' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
