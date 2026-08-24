import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import '../index.css';

export default function AppointmentForm() {
  const { patient_id, id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    doctor_id: '',
    appointment_date: '',
    purpose: '',
    status: 'scheduled'
  });
  
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    if (isEditing) {
      fetchAppointment();
    }
  }, [id]);

  const fetchDoctors = async () => {
    const { data } = await supabase
      .from('doctors')
      .select('doctor_id, first_name, last_name, specialty')
      .eq('status', 'active');
    if (data) {
      setDoctors(data);
    }
  };

  const fetchAppointment = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_id', id)
      .single();

    if (error) {
      toast.error('Failed to load appointment details');
      navigate(`/patients/view/${patient_id}`);
    } else if (data) {
      // Handle datetime-local formatting
      let apptDate = data.appointment_date;
      if (apptDate) {
        // Strip out Z or fractional seconds to make it compatible with datetime-local
        apptDate = new Date(apptDate).toISOString().slice(0, 16);
      }

      setFormData({
        doctor_id: data.doctor_id || '',
        appointment_date: apptDate || '',
        purpose: data.purpose || '',
        status: data.status || 'scheduled'
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
    
    if (!dataToSubmit.appointment_date) {
      dataToSubmit.appointment_date = null;
    }

    let error;
    if (isEditing) {
      const { error: updateError } = await supabase
        .from('appointments')
        .update(dataToSubmit)
        .eq('appointment_id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('appointments')
        .insert([dataToSubmit]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? 'Appointment updated' : 'Appointment scheduled');
      navigate(`/patients/view/${patient_id}`);
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '600px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to={`/patients/view/${patient_id}`} className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Appointment' : 'Schedule Appointment'}
          </h1>
        </div>

        <div className="section-panel">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
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
              <label className="form-label">Appointment Date & Time</label>
              <input type="datetime-local" name="appointment_date" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.appointment_date} onChange={handleChange} required />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Purpose of Visit</label>
              <textarea name="purpose" className="form-input" style={{ paddingLeft: '1rem', minHeight: '80px', padding: '0.75rem 1rem' }} value={formData.purpose} onChange={handleChange} required></textarea>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Status</label>
              <SearchableSelect
                name="status"
                options={[
                  { label: 'Scheduled', value: 'scheduled' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Cancelled', value: 'cancelled' },
                  { label: 'No Show', value: 'no_show' }
                ]}
                value={formData.status}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Link to={`/patients/view/${patient_id}`} className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Schedule Appointment')}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
