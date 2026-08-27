import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import '../index.css';

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    occupation: '',
    contact_number: '',
    email: '',
    address: '',
    
    // Medical History
    medical_history: '',
    surgical_history: '',
    allergies: '',
    alcoholic_intake: '',
    smoking_history: '',
    medications: '',
    previous_hospitalization: '',
    
    // OBGYN (Optional based on gender, but we'll include it)
    gravida: '',
    para: '',
    lmp: '',
    menopause_age: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    emergency_contact_address: '',
    
    // Guardian
    guardian_name: '',
    guardian_relationship: '',
    guardian_phone: '',
    guardian_address: '',
    
    status: 'active'
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchPatient();
    }
  }, [id]);

  const fetchPatient = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_id', id)
      .single();

    if (error) {
      toast.error('Failed to load patient details');
      navigate('/patients');
    } else if (data) {
      // Handle date_of_birth formatting for input type="date"
      let dob = data.date_of_birth;
      if (dob) dob = dob.split('T')[0];

      setFormData({
        first_name: data.first_name || '',
        middle_name: data.middle_name || '',
        last_name: data.last_name || '',
        date_of_birth: dob || '',
        gender: data.gender || '',
        marital_status: data.marital_status || '',
        occupation: data.occupation || '',
        contact_number: data.contact_number || '',
        email: data.email || '',
        address: data.address || '',
        medical_history: data.medical_history || '',
        surgical_history: data.surgical_history || '',
        allergies: data.allergies || '',
        alcoholic_intake: data.alcoholic_intake || '',
        smoking_history: data.smoking_history || '',
        medications: data.medications || '',
        previous_hospitalization: data.previous_hospitalization || '',
        gravida: data.gravida || '',
        para: data.para || '',
        lmp: data.lmp || '',
        menopause_age: data.menopause_age || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_relationship: data.emergency_contact_relationship || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        emergency_contact_address: data.emergency_contact_address || '',
        guardian_name: data.guardian_name || '',
        guardian_relationship: data.guardian_relationship || '',
        guardian_phone: data.guardian_phone || '',
        guardian_address: data.guardian_address || '',
        status: data.status || 'active'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    
    // Parse ints for specific fields
    if (['gravida', 'para', 'menopause_age'].includes(name) && value !== '') {
      finalValue = parseInt(value, 10);
      if (isNaN(finalValue)) finalValue = '';
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSubmit = { ...formData };
    
    // Nullify empty dates/ints to prevent DB cast errors
    if (!dataToSubmit.date_of_birth) dataToSubmit.date_of_birth = null;
    if (dataToSubmit.gravida === '') dataToSubmit.gravida = null;
    if (dataToSubmit.para === '') dataToSubmit.para = null;
    if (dataToSubmit.menopause_age === '') dataToSubmit.menopause_age = null;

    let error;
    if (isEditing) {
      const { error: updateError } = await supabase
        .from('patients')
        .update(dataToSubmit)
        .eq('patient_id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('patients')
        .insert([dataToSubmit]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? 'Patient updated successfully' : 'Patient created successfully');
      navigate(isEditing ? `/patients/view/${id}` : '/patients');
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '900px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to={isEditing ? `/patients/view/${id}` : "/patients"} className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Patient Demographics' : 'Register New Patient'}
          </h1>
        </div>

        <div className="section-panel">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Demographics */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                Personal Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">First Name *</label>
                  <input type="text" name="first_name" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.first_name} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Last Name *</label>
                  <input type="text" name="last_name" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.last_name} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Middle Name</label>
                  <input type="text" name="middle_name" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.middle_name} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Date of Birth</label>
                  <input type="date" name="date_of_birth" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.date_of_birth} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Gender</label>
                  <SearchableSelect
                    name="gender"
                    options={[
                      { label: 'Male', value: 'male' },
                      { label: 'Female', value: 'female' },
                      { label: 'Other', value: 'other' }
                    ]}
                    value={formData.gender}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Marital Status</label>
                  <SearchableSelect
                    name="marital_status"
                    options={[
                      { label: 'Single', value: 'single' },
                      { label: 'Married', value: 'married' },
                      { label: 'Divorced', value: 'divorced' },
                      { label: 'Widowed', value: 'widowed' }
                    ]}
                    value={formData.marital_status}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Occupation</label>
                  <input type="text" name="occupation" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.occupation} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Status</label>
                  <SearchableSelect
                    name="status"
                    options={[
                      { label: 'Active', value: 'active' },
                      { label: 'Inactive', value: 'inactive' },
                      { label: 'Deceased', value: 'deceased' }
                    ]}
                    value={formData.status}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                Contact Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Contact Number</label>
                  <input type="text" name="contact_number" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.contact_number} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input type="email" name="email" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.email} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label className="form-label">Home Address</label>
                  <textarea name="address" className="form-input" style={{ paddingLeft: '1rem', minHeight: '60px', padding: '0.5rem 1rem' }} value={formData.address} onChange={handleChange}></textarea>
                </div>
              </div>
            </div>

            {/* History */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                General Medical History
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Medical History</label>
                  <textarea name="medical_history" className="form-input" style={{ paddingLeft: '1rem', minHeight: '80px', padding: '0.5rem 1rem' }} value={formData.medical_history} onChange={handleChange}></textarea>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Surgical History</label>
                  <textarea name="surgical_history" className="form-input" style={{ paddingLeft: '1rem', minHeight: '80px', padding: '0.5rem 1rem' }} value={formData.surgical_history} onChange={handleChange}></textarea>
                </div>
                <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label className="form-label">Allergies</label>
                  <input type="text" name="allergies" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.allergies} onChange={handleChange} placeholder="e.g. Penicillin, Peanuts" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Alcohol Intake</label>
                  <input type="text" name="alcoholic_intake" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.alcoholic_intake} onChange={handleChange} placeholder="e.g. Occasional, Heavy, None" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Smoking History</label>
                  <input type="text" name="smoking_history" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.smoking_history} onChange={handleChange} placeholder="e.g. 1 pack/day, Never" />
                </div>
                <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label className="form-label">Medications</label>
                  <textarea name="medications" className="form-input" style={{ paddingLeft: '1rem', minHeight: '80px', padding: '0.5rem 1rem' }} value={formData.medications} onChange={handleChange} placeholder="List current medications"></textarea>
                </div>
                <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label className="form-label">Previous Hospitalization</label>
                  <textarea name="previous_hospitalization" className="form-input" style={{ paddingLeft: '1rem', minHeight: '80px', padding: '0.5rem 1rem' }} value={formData.previous_hospitalization} onChange={handleChange} placeholder="Details of previous hospitalizations"></textarea>
                </div>
              </div>
            </div>

            {/* OBGYN (Conditional rendering or just standard) */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                OBGYN History (If Applicable)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Gravida</label>
                  <input type="number" name="gravida" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.gravida} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Para</label>
                  <input type="number" name="para" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.para} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">LMP</label>
                  <input type="text" name="lmp" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.lmp} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Menopause Age</label>
                  <input type="number" name="menopause_age" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.menopause_age} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                Emergency Contact & Guardian
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                
                {/* Emergency */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-gray)' }}>Primary Emergency Contact</h4>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Name</label>
                    <input type="text" name="emergency_contact_name" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.emergency_contact_name} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Relationship</label>
                    <input type="text" name="emergency_contact_relationship" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.emergency_contact_relationship} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Phone</label>
                    <input type="text" name="emergency_contact_phone" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.emergency_contact_phone} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Address</label>
                    <textarea name="emergency_contact_address" className="form-input" style={{ paddingLeft: '1rem', minHeight: '60px', padding: '0.5rem 1rem' }} value={formData.emergency_contact_address} onChange={handleChange}></textarea>
                  </div>
                </div>

                {/* Guardian */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-gray)' }}>Guardian Information (If minor)</h4>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Guardian Name</label>
                    <input type="text" name="guardian_name" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.guardian_name} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Relationship</label>
                    <input type="text" name="guardian_relationship" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.guardian_relationship} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Guardian Phone</label>
                    <input type="text" name="guardian_phone" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.guardian_phone} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Guardian Address</label>
                    <textarea name="guardian_address" className="form-input" style={{ paddingLeft: '1rem', minHeight: '60px', padding: '0.5rem 1rem' }} value={formData.guardian_address} onChange={handleChange}></textarea>
                  </div>
                </div>

              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <Link to={isEditing ? `/patients/view/${id}` : "/patients"} className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Patient Record'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
