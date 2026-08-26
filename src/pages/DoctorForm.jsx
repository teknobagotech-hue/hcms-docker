import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import '../index.css';

export default function DoctorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    specialty: '',
    contact_number: '',
    email: '',
    department_id: '',
    schedule: '',
    license_number: '',
    ptr_number: '',
    s2_license: '',
    status: 'active'
  });
  
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
    if (isEditing) {
      fetchDoctor();
    }
  }, [id]);

  const fetchDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('department_id, department_name')
      .eq('status', 'active')
      .order('department_name');
    if (data) {
      setDepartments(data);
    }
  };

  const fetchDoctor = async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('doctor_id', id)
      .single();

    if (error) {
      toast.error('Failed to load doctor details');
      navigate('/doctors');
    } else if (data) {
      setFormData({
        first_name: data.first_name || '',
        middle_name: data.middle_name || '',
        last_name: data.last_name || '',
        specialty: data.specialty || '',
        contact_number: data.contact_number || '',
        email: data.email || '',
        department_id: data.department_id || '',
        schedule: data.schedule || '',
        license_number: data.license_number || '',
        ptr_number: data.ptr_number || '',
        s2_license: data.s2_license || '',
        status: data.status
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

    const dataToSubmit = { ...formData };
    if (!dataToSubmit.department_id) {
      dataToSubmit.department_id = null;
    } else {
      dataToSubmit.department_id = parseInt(dataToSubmit.department_id);
    }

    let error;
    if (isEditing) {
      const { error: updateError } = await supabase
        .from('doctors')
        .update(dataToSubmit)
        .eq('doctor_id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('doctors')
        .insert([dataToSubmit]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? 'Doctor updated successfully' : 'Doctor created successfully');
      navigate('/doctors');
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to="/doctors" className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Doctor' : 'Add New Doctor'}
          </h1>
        </div>

        <div className="section-panel">
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
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
              <label className="form-label">Specialty</label>
              <input type="text" name="specialty" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.specialty} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Department *</label>
              <SearchableSelect
                name="department_id"
                options={departments.map(d => ({ label: d.department_name, value: d.department_id }))}
                value={formData.department_id}
                onChange={handleChange}
                placeholder="Select Department"
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Lic # (PRC License Number)</label>
              <input type="text" name="license_number" className="form-input" style={{ paddingLeft: '1rem' }} placeholder="e.g. 0110138" value={formData.license_number} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">PTR # (PTR Number)</label>
              <input type="text" name="ptr_number" className="form-input" style={{ paddingLeft: '1rem' }} placeholder="e.g. 6226871" value={formData.ptr_number} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">S2 Lic # (S2 License Number)</label>
              <input type="text" name="s2_license" className="form-input" style={{ paddingLeft: '1rem' }} placeholder="e.g. S2015621FNP071328-K" value={formData.s2_license} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Contact Number</label>
              <input type="text" name="contact_number" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.contact_number} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.email} onChange={handleChange} />
            </div>

            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label className="form-label">Schedule Notes</label>
              <textarea name="schedule" className="form-input" style={{ paddingLeft: '1rem', minHeight: '80px', padding: '0.75rem 1rem' }} value={formData.schedule} onChange={handleChange}></textarea>
            </div>

            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label className="form-label">Status</label>
              <div style={{ maxWidth: '300px' }}>
                <SearchableSelect
                  name="status"
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' }
                  ]}
                  value={formData.status}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <Link to="/doctors" className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Doctor'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
