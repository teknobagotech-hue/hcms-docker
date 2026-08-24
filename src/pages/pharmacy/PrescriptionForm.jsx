import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import '../../index.css';

export default function PrescriptionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [searchParams] = useSearchParams();
  const defaultPatientId = searchParams.get('patientId') || '';

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  
  const [formData, setFormData] = useState({
    patient_id: defaultPatientId,
    doctor_id: '',
    prescription_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'active'
  });
  
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDropdowns();
    if (isEditing) {
      fetchPrescription();
    }
  }, [id]);

  const fetchDropdowns = async () => {
    const { data: pData } = await supabase.from('patients').select('patient_id, first_name, last_name').order('last_name');
    if (pData) setPatients(pData);
    
    const { data: dData } = await supabase.from('doctors').select('doctor_id, first_name, last_name').order('last_name');
    if (dData) setDoctors(dData);
    
    const { data: mData } = await supabase.from('medicines').select('medicine_id, medicine_name').order('medicine_name');
    if (mData) setMedicines(mData);
  };

  const fetchPrescription = async () => {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('prescription_id', id)
      .single();

    if (error) {
      toast.error('Failed to load prescription');
      navigate('/pharmacy/prescriptions');
      return;
    }

    setFormData({
      patient_id: data.patient_id || '',
      doctor_id: data.doctor_id || '',
      prescription_date: data.prescription_date ? data.prescription_date.split('T')[0] : '',
      notes: data.notes || '',
      status: data.status || 'active'
    });

    const { data: itemsData } = await supabase
      .from('prescription_items')
      .select('*')
      .eq('prescription_id', id);

    if (itemsData) {
      setPrescriptionItems(itemsData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...prescriptionItems];
    updated[index][field] = field === 'quantity' || field === 'duration_days' ? parseInt(value) || 0 : value;
    setPrescriptionItems(updated);
  };

  const addItemRow = () => {
    setPrescriptionItems([...prescriptionItems, { medicine_id: '', dosage: '', frequency: '', duration_days: 1, quantity: 1, instructions: '' }]);
  };

  const removeItemRow = (index) => {
    const updated = prescriptionItems.filter((_, i) => i !== index);
    setPrescriptionItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { 
      ...formData, 
      patient_id: formData.patient_id ? parseInt(formData.patient_id) : null,
      doctor_id: formData.doctor_id ? parseInt(formData.doctor_id) : null
    };

    let prescriptionId = id;
    let error;

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('prescriptions')
        .update(payload)
        .eq('prescription_id', id);
      error = updateError;
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from('prescriptions')
        .insert([payload])
        .select();
      error = insertError;
      if (insertData && insertData.length > 0) {
        prescriptionId = insertData[0].prescription_id;
      }
    }

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (prescriptionId) {
      await supabase.from('prescription_items').delete().eq('prescription_id', prescriptionId);
      
      const validItems = prescriptionItems.filter(i => i.medicine_id).map(i => ({
        prescription_id: prescriptionId,
        medicine_id: parseInt(i.medicine_id),
        dosage: i.dosage,
        frequency: i.frequency,
        duration_days: i.duration_days,
        quantity: i.quantity,
        instructions: i.instructions
      }));

      if (validItems.length > 0) {
        await supabase.from('prescription_items').insert(validItems);
      }
    }

    setLoading(false);
    toast.success(isEditing ? 'Prescription updated successfully' : 'Prescription created successfully');
    if (defaultPatientId) {
      navigate(`/patients/view/${defaultPatientId}`);
    } else {
      navigate('/pharmacy/prescriptions');
    }
  };

  const handleCancel = () => {
    if (defaultPatientId) {
      navigate(`/patients/view/${defaultPatientId}`);
    } else {
      navigate('/pharmacy/prescriptions');
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '1000px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <button type="button" onClick={handleCancel} className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Prescription' : 'New Prescription'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="section-panel" style={{ marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Prescription Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Patient *</label>
                <SearchableSelect
                  name="patient_id"
                  options={patients.map(p => ({ label: `${p.first_name} ${p.last_name}`, value: p.patient_id }))}
                  value={formData.patient_id}
                  onChange={handleChange}
                  placeholder="Select Patient"
                  required
                />
              </div>

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
                <label className="form-label">Date</label>
                <input
                  type="date"
                  name="prescription_date"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.prescription_date}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Status</label>
                <SearchableSelect
                  name="status"
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Cancelled', value: 'cancelled' }
                  ]}
                  value={formData.status}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  className="form-input"
                  style={{ paddingLeft: '1rem', paddingTop: '0.5rem', minHeight: '60px', resize: 'vertical' }}
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="section-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="section-title" style={{ fontSize: '1.1rem', margin: 0 }}>Medicines</h2>
              <button type="button" className="btn btn-primary" onClick={addItemRow} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} /> Add Medicine
              </button>
            </div>

            {prescriptionItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                No medicines added. Click "Add Medicine".
              </div>
            ) : (
              <div style={{ overflowX: 'auto', paddingBottom: '200px' }}>
                <table className="data-table" style={{ minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Medicine *</th>
                      <th style={{ width: '15%' }}>Dosage</th>
                      <th style={{ width: '15%' }}>Frequency</th>
                      <th style={{ width: '10%' }}>Days</th>
                      <th style={{ width: '10%' }}>Qty</th>
                      <th style={{ width: '20%' }}>Instructions</th>
                      <th style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptionItems.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <SearchableSelect
                            name="medicine_id"
                            options={medicines.map(m => ({ label: m.medicine_name, value: m.medicine_id }))}
                            value={item.medicine_id}
                            onChange={(e) => handleItemChange(index, 'medicine_id', e.target.value)}
                            placeholder="Select..."
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 500mg"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            value={item.dosage}
                            onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 1x a day"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            value={item.frequency}
                            onChange={(e) => handleItemChange(index, 'frequency', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            value={item.duration_days}
                            onChange={(e) => handleItemChange(index, 'duration_days', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Take after meals"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            value={item.instructions}
                            onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" className="icon-btn delete" onClick={() => removeItemRow(index)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button type="button" onClick={handleCancel} className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Prescription'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
