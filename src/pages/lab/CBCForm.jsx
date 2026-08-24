import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';

export default function CBCForm() {
  const { patient_id, id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    test_date: '',
    wbc: '',
    rbc: '',
    hemoglobin: '',
    hematocrit: '',
    platelet_count: '',
    segmenters: '',
    neutrophils: '',
    lymphocytes: '',
    monocytes: '',
    eosinophils: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEditing) setFormData(prev => ({ ...prev, test_date: new Date().toISOString().split('T')[0] }));
    else fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    const { data, error } = await supabase.from('lab_cbc').select('*').eq('cbc_id', id).single();
    if (error) {
      toast.error('Failed to load CBC record');
      navigate(`/patients/view/${patient_id}?tab=labs&labCat=cbc`);
    } else if (data) {
      setFormData({
        test_date: data.test_date || '',
        wbc: data.wbc ?? '', rbc: data.rbc ?? '', hemoglobin: data.hemoglobin ?? '',
        hematocrit: data.hematocrit ?? '', platelet_count: data.platelet_count ?? '',
        segmenters: data.segmenters ?? '', neutrophils: data.neutrophils ?? '',
        lymphocytes: data.lymphocytes ?? '', monocytes: data.monocytes ?? '',
        eosinophils: data.eosinophils ?? ''
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
    Object.keys(dataToSubmit).forEach(k => { if (dataToSubmit[k] === '') dataToSubmit[k] = null; });

    let error;
    if (isEditing) {
      const { error: err } = await supabase.from('lab_cbc').update(dataToSubmit).eq('cbc_id', id);
      error = err;
    } else {
      const { error: err } = await supabase.from('lab_cbc').insert([dataToSubmit]);
      error = err;
    }
    setLoading(false);

    if (error) toast.error(error.message);
    else {
      toast.success('CBC recorded');
      navigate(`/patients/view/${patient_id}?tab=labs&labCat=cbc`);
    }
  };

  return (
    <div className="dashboard-scroll-area"><div className="dashboard-container" style={{ maxWidth: '800px' }}>
      <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
        <Link to={`/patients/view/${patient_id}?tab=labs&labCat=cbc`} className="icon-btn" style={{ padding: '0.5rem' }}><ArrowLeft size={20} /></Link>
        <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>{isEditing ? 'Edit CBC' : 'Record CBC'}</h1>
      </div>
      <div className="section-panel">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Test Date *</label>
            <input type="date" name="test_date" className="form-input" style={{ paddingLeft: '1rem', maxWidth: '300px' }} value={formData.test_date} onChange={handleChange} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">WBC</label><input type="number" step="0.01" name="wbc" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.wbc} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">RBC</label><input type="number" step="0.01" name="rbc" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.rbc} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Hemoglobin</label><input type="number" step="0.01" name="hemoglobin" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.hemoglobin} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Hematocrit</label><input type="number" step="0.01" name="hematocrit" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.hematocrit} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Platelet Count</label><input type="number" step="0.01" name="platelet_count" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.platelet_count} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Segmenters</label><input type="number" step="0.01" name="segmenters" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.segmenters} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Neutrophils</label><input type="number" step="0.01" name="neutrophils" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.neutrophils} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Lymphocytes</label><input type="number" step="0.01" name="lymphocytes" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.lymphocytes} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Monocytes</label><input type="number" step="0.01" name="monocytes" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.monocytes} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Eosinophils</label><input type="number" step="0.01" name="eosinophils" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.eosinophils} onChange={handleChange} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Link to={`/patients/view/${patient_id}?tab=labs&labCat=cbc`} className="btn btn-cancel" style={{ textDecoration: 'none' }}>Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} />{loading ? 'Saving...' : 'Save CBC'}
            </button>
          </div>
        </form>
      </div>
    </div></div>
  );
}
