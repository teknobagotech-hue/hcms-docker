import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import '../index.css';

export default function CardioHistoryForm() {
  const { patient_id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    history_id: null, // to track if we're updating or inserting
    smoker_status: '',
    hypertension: false,
    diabetes: false,
    family_history_heart_disease: false,
    previous_heart_attack: false,
    pacemaker_details: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchCardioHistory();
  }, [patient_id]);

  const fetchCardioHistory = async () => {
    const { data, error } = await supabase
      .from('patient_cardio_history')
      .select('*')
      .eq('patient_id', patient_id)
      .single();

    if (data) {
      setFormData({
        history_id: data.history_id,
        smoker_status: data.smoker_status || '',
        hypertension: data.hypertension || false,
        diabetes: data.diabetes || false,
        family_history_heart_disease: data.family_history_heart_disease || false,
        previous_heart_attack: data.previous_heart_attack || false,
        pacemaker_details: data.pacemaker_details || ''
      });
    } else if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine (first time editing)
      toast.error('Error fetching cardio history');
    }
    setFetching(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSubmit = { 
      patient_id: parseInt(patient_id),
      smoker_status: formData.smoker_status,
      hypertension: formData.hypertension,
      diabetes: formData.diabetes,
      family_history_heart_disease: formData.family_history_heart_disease,
      previous_heart_attack: formData.previous_heart_attack,
      pacemaker_details: formData.pacemaker_details,
      last_updated: new Date().toISOString()
    };
    
    let error;
    if (formData.history_id) {
      // Update existing
      const { error: updateError } = await supabase
        .from('patient_cardio_history')
        .update(dataToSubmit)
        .eq('history_id', formData.history_id);
      error = updateError;
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from('patient_cardio_history')
        .insert([dataToSubmit]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Cardiovascular history saved');
      navigate(`/patients/view/${patient_id}?tab=records`);
    }
  };

  if (fetching) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '600px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to={`/patients/view/${patient_id}?tab=records`} className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            Cardiovascular History
          </h1>
        </div>

        <div className="section-panel">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Smoker Status</label>
              <SearchableSelect
                name="smoker_status"
                options={[
                  { label: 'Non-smoker', value: 'non_smoker' },
                  { label: 'Former', value: 'former' },
                  { label: 'Current', value: 'current' }
                ]}
                value={formData.smoker_status}
                onChange={(value) => handleChange(value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', margin: '1rem 0', backgroundColor: '#F8FAFC', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 500, color: 'var(--text-dark)' }}>
                <input type="checkbox" name="hypertension" checked={formData.hypertension} onChange={handleChange} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
                Hypertension
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 500, color: 'var(--text-dark)' }}>
                <input type="checkbox" name="diabetes" checked={formData.diabetes} onChange={handleChange} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
                Diabetes
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 500, color: 'var(--text-dark)' }}>
                <input type="checkbox" name="previous_heart_attack" checked={formData.previous_heart_attack} onChange={handleChange} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
                Previous Heart Attack
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 500, color: 'var(--text-dark)' }}>
                <input type="checkbox" name="family_history_heart_disease" checked={formData.family_history_heart_disease} onChange={handleChange} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
                Family History of Heart Disease
              </label>

            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Pacemaker Details (if any)</label>
              <textarea name="pacemaker_details" className="form-input" style={{ paddingLeft: '1rem', minHeight: '80px', padding: '0.75rem 1rem' }} value={formData.pacemaker_details} onChange={handleChange}></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <Link to={`/patients/view/${patient_id}?tab=records`} className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
