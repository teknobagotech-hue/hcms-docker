import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';

export default function ChemForm() {
  const { patient_id, id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    test_date: '',
    creatinine: '', sodium: '', potassium: '', chloride: '', ionized_calcium: '',
    bun: '', uric_acid: '', phosphorous: '', sgpt_alt: '', sgot_ast: '',
    hba1c: '', fbs: '', rbs: '', total_cholesterol: '', triglycerides: '',
    hdl: '', ldl: '', vldl: '', chol_hdl_ratio: '', d_dimer: '',
    procalcitonin: '', albumin: '', trop_i: '', pro_bnp: '',
    ptpa_patient: '', ptpa_control: '', percent_activity: '', inr: '', ptpa_ratio: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEditing) setFormData(prev => ({ ...prev, test_date: new Date().toISOString().split('T')[0] }));
    else fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    const { data, error } = await supabase.from('lab_chemistry').select('*').eq('chem_id', id).single();
    if (error) {
      toast.error('Failed to load Chemistry record');
      navigate(`/patients/view/${patient_id}?tab=labs&labCat=chem`);
    } else if (data) {
      const parsedData = { test_date: data.test_date || '' };
      Object.keys(formData).forEach(k => {
        if (k !== 'test_date') parsedData[k] = data[k] ?? '';
      });
      setFormData(parsedData);
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
      const { error: err } = await supabase.from('lab_chemistry').update(dataToSubmit).eq('chem_id', id);
      error = err;
    } else {
      const { error: err } = await supabase.from('lab_chemistry').insert([dataToSubmit]);
      error = err;
    }
    setLoading(false);

    if (error) toast.error(error.message);
    else {
      toast.success('Chemistry recorded');
      navigate(`/patients/view/${patient_id}?tab=labs&labCat=chem`);
    }
  };

  const inputFields = [
    { name: 'creatinine', label: 'Creatinine' }, { name: 'sodium', label: 'Sodium' },
    { name: 'potassium', label: 'Potassium' }, { name: 'chloride', label: 'Chloride' },
    { name: 'ionized_calcium', label: 'Ionized Calcium' }, { name: 'bun', label: 'BUN' },
    { name: 'uric_acid', label: 'Uric Acid' }, { name: 'phosphorous', label: 'Phosphorous' },
    { name: 'sgpt_alt', label: 'SGPT/ALT' }, { name: 'sgot_ast', label: 'SGOT/AST' },
    { name: 'hba1c', label: 'HbA1c' }, { name: 'fbs', label: 'FBS' }, { name: 'rbs', label: 'RBS' },
    { name: 'total_cholesterol', label: 'Total Cholesterol' }, { name: 'triglycerides', label: 'Triglycerides' },
    { name: 'hdl', label: 'HDL' }, { name: 'ldl', label: 'LDL' }, { name: 'vldl', label: 'VLDL' },
    { name: 'chol_hdl_ratio', label: 'Chol/HDL Ratio' }, { name: 'd_dimer', label: 'D-Dimer' },
    { name: 'procalcitonin', label: 'Procalcitonin' }, { name: 'albumin', label: 'Albumin' },
    { name: 'trop_i', label: 'Trop I' }, { name: 'pro_bnp', label: 'Pro BNP' },
    { name: 'ptpa_patient', label: 'PTPA Patient' }, { name: 'ptpa_control', label: 'PTPA Control' },
    { name: 'percent_activity', label: '% Activity' }, { name: 'inr', label: 'INR' },
    { name: 'ptpa_ratio', label: 'PTPA Ratio' }
  ];

  return (
    <div className="dashboard-scroll-area"><div className="dashboard-container" style={{ maxWidth: '1000px' }}>
      <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
        <Link to={`/patients/view/${patient_id}?tab=labs&labCat=chem`} className="icon-btn" style={{ padding: '0.5rem' }}><ArrowLeft size={20} /></Link>
        <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>{isEditing ? 'Edit Clinical Chemistry' : 'Record Clinical Chemistry'}</h1>
      </div>
      <div className="section-panel">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Test Date *</label>
            <input type="date" name="test_date" className="form-input" style={{ paddingLeft: '1rem', maxWidth: '300px' }} value={formData.test_date} onChange={handleChange} required />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {inputFields.map(field => (
              <div key={field.name} className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{field.label}</label>
                <input type="number" step="0.01" name={field.name} className="form-input" style={{ paddingLeft: '1rem' }} value={formData[field.name]} onChange={handleChange} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Link to={`/patients/view/${patient_id}?tab=labs&labCat=chem`} className="btn btn-cancel" style={{ textDecoration: 'none' }}>Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} />{loading ? 'Saving...' : 'Save Chemistry'}
            </button>
          </div>
        </form>
      </div>
    </div></div>
  );
}
