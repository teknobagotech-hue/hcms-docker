import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import '../index.css';

export default function MedicalRecordForm() {
  const { patient_id, id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    doctor_id: '',
    record_date: '',
    chief_complaint: '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    diagnosis: '',
    treatment: '',
    
    // Vitals Snapshot
    height_cm: '',
    weight_kg: '',
    bmi: '',
    blood_pressure: '',
    heart_rate: '',
    temperature_c: '',
    respiratory_rate: '',
    spo2: '',
    
    // Cardio specific
    ecg_findings: '',
    echo_findings: '',
    ejection_fraction: '',
    lipid_profile_ldl: '',
    lipid_profile_hdl: '',
    triglycerides: '',
    cardiovascular_risk_score: '',
    
    status: 'active'
  });
  
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    if (!isEditing) {
      setFormData(prev => ({ ...prev, record_date: new Date().toISOString().slice(0, 16) }));
    } else {
      fetchRecord();
    }
  }, [id]);

  const fetchDoctors = async () => {
    const { data } = await supabase.from('doctors').select('doctor_id, first_name, last_name, specialty').eq('status', 'active');
    if (data) setDoctors(data);
  };

  const fetchRecord = async () => {
    const { data, error } = await supabase.from('medical_records').select('*').eq('record_id', id).single();
    if (error) {
      toast.error('Failed to load medical record');
      navigate(`/patients/view/${patient_id}`);
    } else if (data) {
      let recDate = data.record_date;
      if (recDate) recDate = new Date(recDate).toISOString().slice(0, 16);

      setFormData({
        ...data,
        record_date: recDate || '',
        doctor_id: data.doctor_id || '',
        // Ensure nulls become empty strings for inputs
        height_cm: data.height_cm ?? '',
        weight_kg: data.weight_kg ?? '',
        bmi: data.bmi ?? '',
        blood_pressure: data.blood_pressure || '',
        heart_rate: data.heart_rate ?? '',
        temperature_c: data.temperature_c ?? '',
        respiratory_rate: data.respiratory_rate ?? '',
        spo2: data.spo2 ?? '',
        ejection_fraction: data.ejection_fraction ?? '',
        lipid_profile_ldl: data.lipid_profile_ldl ?? '',
        lipid_profile_hdl: data.lipid_profile_hdl ?? '',
        triglycerides: data.triglycerides ?? '',
        cardiovascular_risk_score: data.cardiovascular_risk_score ?? ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Parse numbers
    if (['heart_rate', 'respiratory_rate'].includes(name) && value !== '') {
      finalValue = parseInt(value, 10);
      if (isNaN(finalValue)) finalValue = '';
    }
    if (['height_cm', 'weight_kg', 'bmi', 'temperature_c', 'spo2', 'ejection_fraction', 'lipid_profile_ldl', 'lipid_profile_hdl', 'triglycerides', 'cardiovascular_risk_score'].includes(name) && value !== '') {
      finalValue = parseFloat(value);
      if (isNaN(finalValue)) finalValue = '';
    }

    setFormData(prev => {
      const nextState = { ...prev, [name]: finalValue };
      // Auto-calculate BMI if height and weight change
      if (name === 'height_cm' || name === 'weight_kg') {
        const h = name === 'height_cm' ? finalValue : prev.height_cm;
        const w = name === 'weight_kg' ? finalValue : prev.weight_kg;
        if (h && w) {
          const heightM = h / 100;
          nextState.bmi = (w / (heightM * heightM)).toFixed(1);
        }
      }
      return nextState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSubmit = { 
      ...formData,
      patient_id: parseInt(patient_id),
      doctor_id: formData.doctor_id ? parseInt(formData.doctor_id) : null
    };
    
    // Cleanup empty strings to null for numerics/dates
    Object.keys(dataToSubmit).forEach(key => {
      if (dataToSubmit[key] === '') dataToSubmit[key] = null;
    });
    // JSONB fields must be removed or properly formatted if present in state. We didn't include them in state, but let's be safe.
    delete dataToSubmit.lab_results;
    delete dataToSubmit.radiology_reports;
    delete dataToSubmit.lab_images;

    let error;
    if (isEditing) {
      const { error: updateError } = await supabase.from('medical_records').update(dataToSubmit).eq('record_id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('medical_records').insert([dataToSubmit]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? 'Medical record updated' : 'Medical record saved');
      navigate(`/patients/view/${patient_id}`);
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '1000px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to={`/patients/view/${patient_id}`} className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Medical Record (Encounter)' : 'New Medical Record (Encounter)'}
          </h1>
        </div>

        <div className="section-panel">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Encounter Meta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Doctor *</label>
                <SearchableSelect
                  name="doctor_id"
                  options={doctors.map(d => ({ label: `Dr. ${d.first_name} ${d.last_name}`, value: d.doctor_id }))}
                  value={formData.doctor_id}
                  onChange={handleChange}
                  placeholder="Select Doctor"
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Encounter Date & Time *</label>
                <input type="datetime-local" name="record_date" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.record_date || ''} onChange={handleChange} required />
              </div>
            </div>

            {/* Core Clinical */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Chief Complaint & Diagnosis
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Chief Complaint *</label>
                  <textarea name="chief_complaint" className="form-input" style={{ paddingLeft: '1rem', minHeight: '60px' }} value={formData.chief_complaint || ''} onChange={handleChange} required></textarea>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Diagnosis</label>
                    <textarea name="diagnosis" className="form-input" style={{ paddingLeft: '1rem', minHeight: '80px' }} value={formData.diagnosis || ''} onChange={handleChange}></textarea>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Treatment Provided</label>
                    <textarea name="treatment" className="form-input" style={{ paddingLeft: '1rem', minHeight: '80px' }} value={formData.treatment || ''} onChange={handleChange}></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* SOAP Notes */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                SOAP Notes
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Subjective</label>
                  <textarea name="subjective" className="form-input" style={{ paddingLeft: '1rem', minHeight: '100px' }} value={formData.subjective || ''} onChange={handleChange} placeholder="Patient's reported symptoms..."></textarea>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Objective</label>
                  <textarea name="objective" className="form-input" style={{ paddingLeft: '1rem', minHeight: '100px' }} value={formData.objective || ''} onChange={handleChange} placeholder="Clinical observations and exam findings..."></textarea>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Assessment</label>
                  <textarea name="assessment" className="form-input" style={{ paddingLeft: '1rem', minHeight: '100px' }} value={formData.assessment || ''} onChange={handleChange} placeholder="Diagnosis or condition analysis..."></textarea>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Plan</label>
                  <textarea name="plan" className="form-input" style={{ paddingLeft: '1rem', minHeight: '100px' }} value={formData.plan || ''} onChange={handleChange} placeholder="Treatment plan, medications, follow-up..."></textarea>
                </div>
              </div>
            </div>

            {/* Vitals Snapshot */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Vitals Snapshot
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Height (cm)</label><input type="number" step="0.1" name="height_cm" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.height_cm} onChange={handleChange} /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Weight (kg)</label><input type="number" step="0.1" name="weight_kg" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.weight_kg} onChange={handleChange} /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">BMI</label><input type="number" step="0.1" name="bmi" className="form-input" style={{ paddingLeft: '1rem', backgroundColor: '#F1F5F9' }} value={formData.bmi} readOnly title="Auto-calculated" /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">BP (mmHg)</label><input type="text" name="blood_pressure" className="form-input" style={{ paddingLeft: '1rem' }} placeholder="120/80" value={formData.blood_pressure || ''} onChange={handleChange} /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">HR (bpm)</label><input type="number" name="heart_rate" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.heart_rate} onChange={handleChange} /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">RR (bpm)</label><input type="number" name="respiratory_rate" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.respiratory_rate} onChange={handleChange} /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Temp (°C)</label><input type="number" step="0.1" name="temperature_c" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.temperature_c} onChange={handleChange} /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">SpO2 (%)</label><input type="number" step="0.1" name="spo2" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.spo2} onChange={handleChange} /></div>
              </div>
            </div>

            {/* Cardio Specific */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Cardiovascular Findings
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">ECG Findings</label>
                  <textarea name="ecg_findings" className="form-input" style={{ paddingLeft: '1rem', minHeight: '60px' }} value={formData.ecg_findings || ''} onChange={handleChange}></textarea>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Echo Findings</label>
                  <textarea name="echo_findings" className="form-input" style={{ paddingLeft: '1rem', minHeight: '60px' }} value={formData.echo_findings || ''} onChange={handleChange}></textarea>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Ejection Fraction (%)</label><input type="number" step="0.1" name="ejection_fraction" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.ejection_fraction} onChange={handleChange} /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">LDL</label><input type="number" step="0.1" name="lipid_profile_ldl" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.lipid_profile_ldl} onChange={handleChange} /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">HDL</label><input type="number" step="0.1" name="lipid_profile_hdl" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.lipid_profile_hdl} onChange={handleChange} /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Triglycerides</label><input type="number" step="0.1" name="triglycerides" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.triglycerides} onChange={handleChange} /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">CV Risk Score</label><input type="number" step="0.1" name="cardiovascular_risk_score" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.cardiovascular_risk_score} onChange={handleChange} /></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <Link to={`/patients/view/${patient_id}`} className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Medical Record'}
              </button>
            </div>
            
          </form>
        </div>

      </div>
    </div>
  );
}
