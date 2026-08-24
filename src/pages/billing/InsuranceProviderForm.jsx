import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import '../../index.css';

export default function InsuranceProviderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    provider_name: '',
    contact_number: '',
    address: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchProvider();
    }
  }, [id]);

  const fetchProvider = async () => {
    const { data, error } = await supabase
      .from('insurance_providers')
      .select('*')
      .eq('insurance_provider_id', id)
      .single();

    if (error) {
      toast.error('Failed to load provider details');
      navigate('/billing/insurance');
    } else if (data) {
      setFormData({
        provider_name: data.provider_name,
        contact_number: data.contact_number || '',
        address: data.address || '',
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
        .from('insurance_providers')
        .update(formData)
        .eq('insurance_provider_id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('insurance_providers')
        .insert([formData]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? 'Provider updated successfully' : 'Provider created successfully');
      navigate('/billing/insurance');
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to="/billing/insurance" className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Insurance Provider' : 'Add New Provider'}
          </h1>
        </div>

        <div className="section-panel">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Provider Name *</label>
              <input
                type="text"
                name="provider_name"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.provider_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                name="contact_number"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.contact_number}
                onChange={handleChange}
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

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Address</label>
              <textarea
                name="address"
                className="form-input"
                style={{ paddingLeft: '1rem', paddingTop: '0.5rem', minHeight: '80px', resize: 'vertical' }}
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Link to="/billing/insurance" className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Provider'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
