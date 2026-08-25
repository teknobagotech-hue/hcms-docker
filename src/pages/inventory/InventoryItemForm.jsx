import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import '../../index.css';

export default function InventoryItemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    item_name: '',
    item_description: '',
    serial_number: '',
    product_number: '',
    category_id: '',
    unit: '',
    price: 0,
    reorder_level: 0,
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchItem();
    }
  }, [id]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('inventory_categories').select('category_id, category_name').order('category_name');
    if (data) setCategories(data);
  };

  const fetchItem = async () => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('item_id', id)
      .single();

    if (error) {
      toast.error('Failed to load item details');
      navigate('/inventory/items');
    } else if (data) {
      setFormData({
        item_name: data.item_name,
        item_description: data.item_description || '',
        serial_number: data.serial_number || '',
        product_number: data.product_number || '',
        category_id: data.category_id || '',
        unit: data.unit || '',
        price: data.price || 0,
        reorder_level: data.reorder_level || 0,
        status: data.status
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...formData, category_id: formData.category_id ? parseInt(formData.category_id) : null };

    let error;
    if (isEditing) {
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update(payload)
        .eq('item_id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('inventory_items')
        .insert([payload]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? 'Item updated successfully' : 'Item created successfully');
      navigate('/inventory/items');
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to="/inventory/items" className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </h1>
        </div>

        <div className="section-panel">
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label className="form-label">Item Name *</label>
              <input
                type="text"
                name="item_name"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.item_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea
                name="item_description"
                className="form-input"
                style={{ paddingLeft: '1rem', paddingTop: '0.5rem', minHeight: '80px', resize: 'vertical' }}
                value={formData.item_description}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Category *</label>
              <SearchableSelect
                name="category_id"
                options={categories.map(c => ({ label: c.category_name, value: c.category_id }))}
                value={formData.category_id}
                onChange={handleChange}
                placeholder="Select Category"
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Unit (e.g., Box, Pcs, Bottle)</label>
              <input
                type="text"
                name="unit"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.unit}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Price (₱)</label>
              <input
                type="number"
                name="price"
                step="0.01"
                min="0"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Reorder Level</label>
              <input
                type="number"
                name="reorder_level"
                min="0"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.reorder_level}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Product Number</label>
              <input
                type="text"
                name="product_number"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.product_number}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Serial Number</label>
              <input
                type="text"
                name="serial_number"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.serial_number}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', gridColumn: '1 / -1' }}>
              <Link to="/inventory/items" className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
