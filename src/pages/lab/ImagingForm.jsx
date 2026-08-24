import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import '../../index.css';

export default function ImagingForm() {
  const { patient_id, id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    modality: '',
    location: '',
    impression: '',
    record_date: '',
    file_url: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEditing) setFormData(prev => ({ ...prev, record_date: new Date().toISOString().split('T')[0] }));
    else fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    const { data, error } = await supabase.from('imaging_reports').select('*').eq('imaging_id', id).single();
    if (error) {
      toast.error('Failed to load Imaging record');
      navigate(`/patients/view/${patient_id}?tab=labs&labCat=imaging`);
    } else if (data) {
      setFormData({
        modality: data.modality || '',
        location: data.location || '',
        impression: data.impression || '',
        record_date: data.record_date || '',
        file_url: data.file_url || ''
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
    const dataToSubmit = { ...formData, patient_id: parseInt(patient_id) };
    Object.keys(dataToSubmit).forEach(k => { if (dataToSubmit[k] === '') dataToSubmit[k] = null; });

    let error;
    if (isEditing) {
      const { error: err } = await supabase.from('imaging_reports').update(dataToSubmit).eq('imaging_id', id);
      error = err;
    } else {
      const { error: err } = await supabase.from('imaging_reports').insert([dataToSubmit]);
      error = err;
    }
    setLoading(false);

    if (error) toast.error(error.message);
    else {
      toast.success('Imaging Report recorded');
      navigate(`/patients/view/${patient_id}?tab=labs&labCat=imaging`);
    }
  };

  return (
    <div className="dashboard-scroll-area"><div className="dashboard-container" style={{ maxWidth: '600px' }}>
      <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
        <Link to={`/patients/view/${patient_id}?tab=labs&labCat=imaging`} className="icon-btn" style={{ padding: '0.5rem' }}><ArrowLeft size={20} /></Link>
        <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>{isEditing ? 'Edit Imaging Report' : 'Upload Imaging Report'}</h1>
      </div>
      <div className="section-panel">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Record Date</label>
            <input type="date" name="record_date" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.record_date} onChange={handleChange} />
          </div>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Modality *</label>
            <SearchableSelect
              name="modality"
              options={[
                { label: 'X-Ray', value: 'X-Ray' },
                { label: 'MRI', value: 'MRI' },
                { label: 'CT Scan', value: 'CT Scan' },
                { label: 'Ultrasound', value: 'Ultrasound' },
                { label: 'ECG', value: 'ECG' },
                { label: 'ULTRASOUND REPORTS', value: 'ULTRASOUND REPORTS' },
                { label: 'ARTERIAL DUPLEX SCAN', value: 'ARTERIAL DUPLEX SCAN' },
                { label: 'VENOUS DUPLEX SCAN', value: 'VENOUS DUPLEX SCAN' },
                { label: 'Other', value: 'Other' }
              ]}
              value={formData.modality}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Body Location / Region</label>
            <input type="text" name="location" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.location} onChange={handleChange} placeholder="e.g. Chest, Abdomen, Left Knee" />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Impression / Findings</label>
            <textarea name="impression" className="form-input" style={{ paddingLeft: '1rem', minHeight: '100px' }} value={formData.impression} onChange={handleChange} placeholder="Radiologist's findings..."></textarea>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">File URL (Optional)</label>
            <input type="text" name="file_url" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.file_url} onChange={handleChange} placeholder="https://..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Link to={`/patients/view/${patient_id}?tab=labs&labCat=imaging`} className="btn btn-cancel" style={{ textDecoration: 'none' }}>Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} />{loading ? 'Saving...' : 'Save Report'}
            </button>
          </div>
        </form>
      </div>
    </div></div>
  );
}
