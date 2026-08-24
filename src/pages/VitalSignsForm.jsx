import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import '../index.css';

export default function VitalSignsForm() {
  const { patient_id, id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    record_date: '',
    age: '',
    weight_kg: '',
    bp: '',
    spo2: '',
    pr: '',
    temperature_c: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Default to today if adding
    if (!isEditing) {
      setFormData(prev => ({ ...prev, record_date: new Date().toISOString().split('T')[0] }));
    } else {
      fetchVitals();
    }
  }, [id]);

  const fetchVitals = async () => {
    const { data, error } = await supabase
      .from('vital_signs')
      .select('*')
      .eq('vital_id', id)
      .single();

    if (error) {
      toast.error('Failed to load vital signs details');
      navigate(`/patients/view/${patient_id}`);
    } else if (data) {
      setFormData({
        record_date: data.record_date || '',
        age: data.age || '',
        weight_kg: data.weight_kg || '',
        bp: data.bp || '',
        spo2: data.spo2 || '',
        pr: data.pr || '',
        temperature_c: data.temperature_c || '',
        notes: data.notes || ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Parse floats/ints
    if (['age', 'pr'].includes(name) && value !== '') {
      finalValue = parseInt(value, 10);
      if (isNaN(finalValue)) finalValue = '';
    }
    if (['weight_kg', 'spo2', 'temperature_c'].includes(name) && value !== '') {
      finalValue = parseFloat(value);
      if (isNaN(finalValue)) finalValue = '';
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSubmit = { 
      ...formData,
      patient_id: parseInt(patient_id)
    };
    
    // Nullify empty numeric fields
    ['age', 'weight_kg', 'spo2', 'pr', 'temperature_c'].forEach(field => {
      if (dataToSubmit[field] === '') dataToSubmit[field] = null;
    });

    let error;
    if (isEditing) {
      const { error: updateError } = await supabase
        .from('vital_signs')
        .update(dataToSubmit)
        .eq('vital_id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('vital_signs')
        .insert([dataToSubmit]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? 'Vital signs updated' : 'Vital signs recorded');
      navigate(`/patients/view/${patient_id}`);
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to={`/patients/view/${patient_id}`} className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Vital Signs' : 'Record New Vital Signs'}
          </h1>
        </div>

        <div className="section-panel">
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label className="form-label">Record Date *</label>
              <input type="date" name="record_date" className="form-input" style={{ paddingLeft: '1rem', maxWidth: '300px' }} value={formData.record_date} onChange={handleChange} required />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Patient Age (at recording)</label>
              <input type="number" name="age" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.age} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Weight (kg)</label>
              <input type="number" step="0.1" name="weight_kg" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.weight_kg} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Blood Pressure (mmHg)</label>
              <input type="text" name="bp" className="form-input" placeholder="e.g. 120/80" style={{ paddingLeft: '1rem' }} value={formData.bp} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Pulse Rate (bpm)</label>
              <input type="number" name="pr" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.pr} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">SpO2 (%)</label>
              <input type="number" step="0.1" name="spo2" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.spo2} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Temperature (°C)</label>
              <input type="number" step="0.1" name="temperature_c" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.temperature_c} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label className="form-label">Clinical Notes</label>
              <textarea name="notes" className="form-input" style={{ paddingLeft: '1rem', minHeight: '80px', padding: '0.75rem 1rem' }} value={formData.notes} onChange={handleChange}></textarea>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <Link to={`/patients/view/${patient_id}`} className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Vital Signs'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
