import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import '../index.css';

export default function DepartmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    department_name: '',
    location: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchDepartment();
    }
  }, [id]);

  const fetchDepartment = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('department_id', id)
      .single();

    if (error) {
      toast.error('Failed to load department details');
      navigate('/departments');
    } else if (data) {
      setFormData({
        department_name: data.department_name,
        location: data.location || '',
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

    let error;
    if (isEditing) {
      const { error: updateError } = await supabase
        .from('departments')
        .update(formData)
        .eq('department_id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('departments')
        .insert([formData]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? 'Department updated successfully' : 'Department created successfully');
      navigate('/departments');
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to="/departments" className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Department' : 'Add New Department'}
          </h1>
        </div>

        <div className="section-panel">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Department Name *</label>
              <input
                type="text"
                name="department_name"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.department_name}
                onChange={handleChange}
                required
                placeholder="e.g. Cardiology"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Location / Wing</label>
              <input
                type="text"
                name="location"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Building A, Floor 2"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Status</label>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Link to="/departments" className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Department'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
