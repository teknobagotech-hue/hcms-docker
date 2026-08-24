import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import '../index.css';

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    full_name: '',
    role: 'staff',
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [hasServiceKey, setHasServiceKey] = useState(!!supabaseAdmin);

  useEffect(() => {
    if (isEditing) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Failed to load user details');
      navigate('/users');
    } else if (data) {
      setFormData(prev => ({
        ...prev,
        full_name: data.full_name || '',
        role: data.role || 'staff'
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isEditing) {
      // Editing just updates the profile
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          role: formData.role
        })
        .eq('id', id);

      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('User profile updated successfully');
        navigate('/users');
      }
    } else {
      // Creating a new user requires supabaseAdmin
      if (!supabaseAdmin) {
        toast.error('Cannot create users. VITE_SUPABASE_SERVICE_ROLE_KEY is missing from .env');
        setLoading(false);
        return;
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: { full_name: formData.full_name }
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // The trigger in Supabase should create the user_profiles row automatically,
      // but we can update the role directly.
      const userId = data.user.id;
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          role: formData.role
        })
        .eq('id', userId);
      
      setLoading(false);

      if (profileError) {
        toast.error('User created, but failed to assign role.');
      } else {
        toast.success('User created successfully');
      }
      navigate('/users');
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '600px' }}>
        
        {!isEditing && !hasServiceKey && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #F87171', color: '#B91C1C', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <strong style={{ fontSize: '0.875rem' }}>Configuration Required</strong>
            <span style={{ fontSize: '0.875rem' }}>To create new users, you must add <code>VITE_SUPABASE_SERVICE_ROLE_KEY</code> to your <code>.env</code> file. Without it, user creation will fail.</span>
          </div>
        )}

        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to="/users" className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit User Profile' : 'Create New User'}
          </h1>
        </div>

        <div className="section-panel">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Full Name *</label>
              <input type="text" name="full_name" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.full_name} onChange={handleChange} required />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Role *</label>
              <SearchableSelect
                name="role"
                options={[
                  { label: 'Administrator', value: 'admin' },
                  { label: 'Doctor', value: 'doctor' },
                  { label: 'Nurse', value: 'nurse' },
                  { label: 'Pharmacist', value: 'pharmacist' },
                  { label: 'Receptionist', value: 'receptionist' },
                  { label: 'Lab Technician', value: 'lab_technician' }
                ]}
                value={formData.role}
                onChange={handleChange}
                required
              />
            </div>

            {!isEditing && (
              <>
                <div className="divider" style={{ margin: '1rem 0' }}></div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '-0.5rem' }}>Login Credentials</h3>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address *</label>
                  <input type="email" name="email" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.email} onChange={handleChange} required />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Temporary Password *</label>
                  <input type="password" name="password" className="form-input" style={{ paddingLeft: '1rem' }} value={formData.password} onChange={handleChange} required minLength={6} />
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Link to="/users" className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : (isEditing ? 'Save Profile' : 'Create User')}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
