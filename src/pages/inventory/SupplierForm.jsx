import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import '../../index.css';

export default function SupplierForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    supplier_name: '',
    contact_person: '',
    contact_number: '',
    email: '',
    address: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchSupplier();
    }
  }, [id]);

  const fetchSupplier = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('supplier_id', id)
      .single();

    if (error) {
      toast.error('Failed to load supplier details');
      navigate('/inventory/suppliers');
    } else if (data) {
      setFormData({
        supplier_name: data.supplier_name,
        contact_person: data.contact_person || '',
        contact_number: data.contact_number || '',
        email: data.email || '',
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
        .from('suppliers')
        .update(formData)
        .eq('supplier_id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('suppliers')
        .insert([formData]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? 'Supplier updated successfully' : 'Supplier created successfully');
      navigate('/inventory/suppliers');
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to="/inventory/suppliers" className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
          </h1>
        </div>

        <div className="section-panel">
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label className="form-label">Supplier Name *</label>
              <input
                type="text"
                name="supplier_name"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.supplier_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                name="contact_person"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.contact_person}
                onChange={handleChange}
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
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.email}
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

            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label className="form-label">Address</label>
              <textarea
                name="address"
                className="form-input"
                style={{ paddingLeft: '1rem', paddingTop: '0.5rem', minHeight: '80px', resize: 'vertical' }}
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', gridColumn: '1 / -1' }}>
              <Link to="/inventory/suppliers" className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Supplier'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
