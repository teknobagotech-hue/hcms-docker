import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import '../../index.css';

export default function MedicalDocumentForm() {
  const { patient_id, id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    doctor_id: '',
    document_type: '',
    diagnosis_impression: '',
    remarks_recommendations: '',
    purpose: '',
    referred_to_doctor: '',
    issue_date: ''
  });
  
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    if (!isEditing) setFormData(prev => ({ ...prev, issue_date: new Date().toISOString().slice(0, 16) }));
    else fetchRecord();
  }, [id]);

  const fetchDoctors = async () => {
    const { data } = await supabase.from('doctors').select('doctor_id, first_name, last_name, specialty').eq('status', 'active');
    if (data) setDoctors(data);
  };

  const fetchRecord = async () => {
    const { data, error } = await supabase.from('medical_documents').select('*').eq('document_id', id).single();
    if (error) {
      toast.error('Failed to load Document');
      navigate(`/patients/view/${patient_id}?tab=documents`);
    } else if (data) {
      let recDate = data.issue_date;
      if (recDate) recDate = new Date(recDate).toISOString().slice(0, 16);
      
      setFormData({
        doctor_id: data.doctor_id || '',
        document_type: data.document_type || '',
        diagnosis_impression: data.diagnosis_impression || '',
        remarks_recommendations: data.remarks_recommendations || '',
        purpose: data.purpose || '',
        referred_to_doctor: data.referred_to_doctor || '',
        issue_date: recDate || ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const dataToSubmit = { 
      ...formData, 
      patient_id: parseInt(patient_id),
      doctor_id: formData.doctor_id ? parseInt(formData.doctor_id) : null
    };
    Object.keys(dataToSubmit).forEach(k => { if (dataToSubmit[k] === '') dataToSubmit[k] = null; });

    let error;
    if (isEditing) {
      const { error: err } = await supabase.from('medical_documents').update(dataToSubmit).eq('document_id', id);
      error = err;
    } else {
      const { error: err } = await supabase.from('medical_documents').insert([dataToSubmit]);
      error = err;
    }
    setLoading(false);

    if (error) toast.error(error.message);
    else {
      toast.success('Document recorded');
      navigate(`/patients/view/${patient_id}?tab=documents`);
    }
  };

  return (
    <div className="dashboard-scroll-area"><div className="dashboard-container" style={{ maxWidth: '800px' }}>
      <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
        <Link to={`/patients/view/${patient_id}?tab=documents`} className="icon-btn" style={{ padding: '0.5rem' }}><ArrowLeft size={20} /></Link>
        <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>{isEditing ? 'Edit Document' : 'Generate Document'}</h1>
      </div>
      <div className="section-panel">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Document Type *</label>
              <SearchableSelect
                name="document_type"
                options={[
                  { label: 'Medical Certificate', value: 'Medical Certificate' },
                  { label: 'Clearance', value: 'Clearance' },
                  { label: 'Referral', value: 'Referral' },
                  { label: 'Prescription', value: 'Prescription' },
                  { label: 'Other', value: 'Other' }
                ]}
                value={formData.document_type}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Issue Date *</label>
              <input type="datetime-local" name="issue_date" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.issue_date} onChange={handleChange} required />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Attending Doctor</label>
              <SearchableSelect
                name="doctor_id"
                options={doctors.map(d => ({ label: `Dr. ${d.first_name} ${d.last_name}`, value: d.doctor_id }))}
                value={formData.doctor_id}
                onChange={handleChange}
                placeholder="Select..."
              />
            </div>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Referred To (If Referral)</label>
              <input type="text" name="referred_to_doctor" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.referred_to_doctor} onChange={handleChange} placeholder="Dr. Name / Hospital" />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Purpose</label>
            <input type="text" name="purpose" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.purpose} onChange={handleChange} />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Diagnosis / Impression</label>
            <textarea name="diagnosis_impression" className="form-input" style={{ paddingLeft: '1rem', minHeight: '80px' }} value={formData.diagnosis_impression} onChange={handleChange}></textarea>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Remarks / Recommendations</label>
            <textarea name="remarks_recommendations" className="form-input" style={{ paddingLeft: '1rem', minHeight: '80px' }} value={formData.remarks_recommendations} onChange={handleChange}></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Link to={`/patients/view/${patient_id}?tab=documents`} className="btn btn-cancel" style={{ textDecoration: 'none' }}>Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} />{loading ? 'Saving...' : 'Save Document'}
            </button>
          </div>
        </form>
      </div>
    </div></div>
  );
}
