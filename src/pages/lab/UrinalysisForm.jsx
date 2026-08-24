import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';

export default function UrinalysisForm() {
  const { patient_id, id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    test_date: '',
    color: '', transparency: '', protein: '', ph: '', specific_gravity: '',
    glucose: '', pus_cells: '', rbc_micro: '', epithelial_cells: '', bacteria: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEditing) setFormData(prev => ({ ...prev, test_date: new Date().toISOString().split('T')[0] }));
    else fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    const { data, error } = await supabase.from('lab_urinalysis').select('*').eq('ua_id', id).single();
    if (error) {
      toast.error('Failed to load Urinalysis record');
      navigate(`/patients/view/${patient_id}?tab=labs&labCat=ua`);
    } else if (data) {
      setFormData({
        test_date: data.test_date || '',
        color: data.color || '', transparency: data.transparency || '', protein: data.protein || '',
        ph: data.ph ?? '', specific_gravity: data.specific_gravity ?? '',
        glucose: data.glucose || '', pus_cells: data.pus_cells || '', rbc_micro: data.rbc_micro || '',
        epithelial_cells: data.epithelial_cells || '', bacteria: data.bacteria || ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (['ph', 'specific_gravity'].includes(name) && value !== '') {
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
      const { error: err } = await supabase.from('lab_urinalysis').update(dataToSubmit).eq('ua_id', id);
      error = err;
    } else {
      const { error: err } = await supabase.from('lab_urinalysis').insert([dataToSubmit]);
      error = err;
    }
    setLoading(false);

    if (error) toast.error(error.message);
    else {
      toast.success('Urinalysis recorded');
      navigate(`/patients/view/${patient_id}?tab=labs&labCat=ua`);
    }
  };

  return (
    <div className="dashboard-scroll-area"><div className="dashboard-container" style={{ maxWidth: '800px' }}>
      <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
        <Link to={`/patients/view/${patient_id}?tab=labs&labCat=ua`} className="icon-btn" style={{ padding: '0.5rem' }}><ArrowLeft size={20} /></Link>
        <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>{isEditing ? 'Edit Urinalysis' : 'Record Urinalysis'}</h1>
      </div>
      <div className="section-panel">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Test Date *</label>
            <input type="date" name="test_date" className="form-input" style={{ paddingLeft: '1rem', maxWidth: '300px' }} value={formData.test_date} onChange={handleChange} required />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Color</label><input type="text" name="color" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.color} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Transparency</label><input type="text" name="transparency" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.transparency} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">pH</label><input type="number" step="0.01" name="ph" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.ph} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Specific Gravity</label><input type="number" step="0.001" name="specific_gravity" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.specific_gravity} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Protein</label><input type="text" name="protein" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.protein} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Glucose</label><input type="text" name="glucose" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.glucose} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Pus Cells (WBC)</label><input type="text" name="pus_cells" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.pus_cells} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">RBC (Micro)</label><input type="text" name="rbc_micro" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.rbc_micro} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Epithelial Cells</label><input type="text" name="epithelial_cells" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.epithelial_cells} onChange={handleChange} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Bacteria</label><input type="text" name="bacteria" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.bacteria} onChange={handleChange} /></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Link to={`/patients/view/${patient_id}?tab=labs&labCat=ua`} className="btn btn-cancel" style={{ textDecoration: 'none' }}>Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} />{loading ? 'Saving...' : 'Save Urinalysis'}
            </button>
          </div>
        </form>
      </div>
    </div></div>
  );
}
