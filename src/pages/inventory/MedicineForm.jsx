import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import '../../index.css';

export default function MedicineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    medicine_name: '',
    dosage_form: '',
    strength: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchMedicine();
    }
  }, [id]);

  const fetchMedicine = async () => {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('medicine_id', id)
      .single();

    if (error) {
      toast.error('Failed to load medicine details');
      navigate('/inventory/medicines');
    } else if (data) {
      setFormData({
        medicine_name: data.medicine_name,
        dosage_form: data.dosage_form || '',
        strength: data.strength || ''
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
        .from('medicines')
        .update(formData)
        .eq('medicine_id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('medicines')
        .insert([formData]);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? 'Medicine updated successfully' : 'Medicine created successfully');
      navigate('/inventory/medicines');
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to="/inventory/medicines" className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Medicine' : 'Add New Medicine'}
          </h1>
        </div>

        <div className="section-panel">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Medicine Name *</label>
              <input
                type="text"
                name="medicine_name"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.medicine_name}
                onChange={handleChange}
                required
                placeholder="e.g. Paracetamol, Amoxicillin"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Dosage Form</label>
              <input
                type="text"
                name="dosage_form"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.dosage_form}
                onChange={handleChange}
                placeholder="e.g. Tablet, Syrup, Injection"
              />
            </div>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Strength</label>
              <input
                type="text"
                name="strength"
                className="form-input"
                style={{ paddingLeft: '1rem' }}
                value={formData.strength}
                onChange={handleChange}
                placeholder="e.g. 500mg, 10mg/ml"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Link to="/inventory/medicines" className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Medicine'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
