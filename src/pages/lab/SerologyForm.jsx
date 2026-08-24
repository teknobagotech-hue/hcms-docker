import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';

export default function SerologyForm() {
  const { patient_id, id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    test_date: '',
    tsh: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEditing) setFormData(prev => ({ ...prev, test_date: new Date().toISOString().split('T')[0] }));
    else fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    const { data, error } = await supabase.from('lab_serology').select('*').eq('serology_id', id).single();
    if (error) {
      toast.error('Failed to load Serology record');
      navigate(`/patients/view/${patient_id}?tab=labs&labCat=serology`);
    } else if (data) {
      setFormData({
        test_date: data.test_date || '',
        tsh: data.tsh ?? ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name !== 'test_date' && value !== '') {
      finalValue = parseFloat(value);
      if (isNaN(finalValue)) finalValue = '';
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const dataToSubmit = { ...formData, patient_id: parseInt(patient_id) };
    if (dataToSubmit.tsh === '') dataToSubmit.tsh = null;

    let error;
    if (isEditing) {
      const { error: err } = await supabase.from('lab_serology').update(dataToSubmit).eq('serology_id', id);
      error = err;
    } else {
      const { error: err } = await supabase.from('lab_serology').insert([dataToSubmit]);
      error = err;
    }
    setLoading(false);

    if (error) toast.error(error.message);
    else {
      toast.success('Serology recorded');
      navigate(`/patients/view/${patient_id}?tab=labs&labCat=serology`);
    }
  };

  return (
    <div className="dashboard-scroll-area"><div className="dashboard-container" style={{ maxWidth: '600px' }}>
      <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
        <Link to={`/patients/view/${patient_id}?tab=labs&labCat=serology`} className="icon-btn" style={{ padding: '0.5rem' }}><ArrowLeft size={20} /></Link>
        <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>{isEditing ? 'Edit Serology' : 'Record Serology'}</h1>
      </div>
      <div className="section-panel">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Test Date *</label>
            <input type="date" name="test_date" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.test_date} onChange={handleChange} required />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">TSH (Thyroid Stimulating Hormone)</label>
            <input type="number" step="0.01" name="tsh" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.tsh} onChange={handleChange} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Link to={`/patients/view/${patient_id}?tab=labs&labCat=serology`} className="btn btn-cancel" style={{ textDecoration: 'none' }}>Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} />{loading ? 'Saving...' : 'Save Serology'}
            </button>
          </div>
        </form>
      </div>
    </div></div>
  );
}
