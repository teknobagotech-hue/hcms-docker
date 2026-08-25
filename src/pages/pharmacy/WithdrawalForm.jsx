import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import '../../index.css';

export default function WithdrawalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [patients, setPatients] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_id: '',
    withdrawal_date: new Date().toISOString().split('T')[0],
    sale_type: 'retail',
    payment_status: 'unpaid',
    amount_due: 0,
    amount_paid: 0,
    discount_value: 0,
    discount_type: 'percentage',
    notes: '',
    status: 'pending'
  });
  
  const [withdrawalItems, setWithdrawalItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDropdowns();
    if (isEditing) {
      fetchWithdrawal();
    }
  }, [id]);

  const fetchDropdowns = async () => {
    const { data: pData } = await supabase.from('patients').select('patient_id, first_name, last_name').order('last_name');
    if (pData) setPatients(pData);
    
    // Fetch inventory items along with their price for calculations
    const { data: iData } = await supabase.from('inventory_items').select('item_id, item_name, price, quantity_in_stock, unit').eq('status', 'active').order('item_name');
    if (iData) setItemsList(iData);
  };

  const fetchWithdrawal = async () => {
    const { data, error } = await supabase
      .from('inventory_withdrawals')
      .select('*')
      .eq('withdrawal_id', id)
      .single();

    if (error) {
      toast.error('Failed to load record details');
      navigate('/pharmacy/sales');
      return;
    }

    setFormData({
      customer_name: data.customer_name || '',
      customer_id: data.customer_id || '',
      withdrawal_date: data.withdrawal_date ? data.withdrawal_date.split('T')[0] : '',
      sale_type: data.sale_type || 'retail',
      payment_status: data.payment_status || 'unpaid',
      amount_due: data.amount_due || 0,
      amount_paid: data.amount_paid || 0,
      discount_value: data.discount_value || 0,
      discount_type: data.discount_type || 'percentage',
      notes: data.notes || '',
      status: data.status || 'pending'
    });

    const { data: itemsData } = await supabase
      .from('inventory_withdrawal_items')
      .select('*')
      .eq('withdrawal_id', id);

    if (itemsData) {
      setWithdrawalItems(itemsData);
    }
  };

  const calculateTotal = (items, discVal, discType) => {
    let subtotal = 0;
    items.forEach(item => {
      const invItem = itemsList.find(i => i.item_id === parseInt(item.item_id));
      if (invItem) {
        subtotal += (invItem.price || 0) * (item.quantity || 0);
      }
    });

    let total = subtotal;
    if (discVal > 0) {
      if (discType === 'percentage') {
        total = subtotal - (subtotal * (discVal / 100));
      } else {
        total = subtotal - discVal;
      }
    }
    
    return Math.max(0, total);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: parsedValue };
      
      // Auto-recalculate if discount changes
      if (name === 'discount_value' || name === 'discount_type') {
        updated.amount_due = calculateTotal(withdrawalItems, 
          name === 'discount_value' ? parsedValue : prev.discount_value,
          name === 'discount_type' ? parsedValue : prev.discount_type
        );
      }
      
      return updated;
    });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...withdrawalItems];
    updated[index][field] = field === 'quantity' ? parseInt(value) || 0 : value;
    setWithdrawalItems(updated);
    
    const newTotal = calculateTotal(updated, formData.discount_value, formData.discount_type);
    setFormData(prev => ({ ...prev, amount_due: newTotal }));
  };

  const addItemRow = () => {
    setWithdrawalItems([...withdrawalItems, { item_id: '', quantity: 1 }]);
  };

  const removeItemRow = (index) => {
    const updated = withdrawalItems.filter((_, i) => i !== index);
    setWithdrawalItems(updated);
    
    const newTotal = calculateTotal(updated, formData.discount_value, formData.discount_type);
    setFormData(prev => ({ ...prev, amount_due: newTotal }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { 
      ...formData, 
      customer_id: formData.customer_id ? parseInt(formData.customer_id) : null 
    };

    let withdrawalId = id;
    let error;

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('inventory_withdrawals')
        .update(payload)
        .eq('withdrawal_id', id);
      error = updateError;
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from('inventory_withdrawals')
        .insert([payload])
        .select();
      error = insertError;
      if (insertData && insertData.length > 0) {
        withdrawalId = insertData[0].withdrawal_id;
      }
    }

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (withdrawalId) {
      await supabase.from('inventory_withdrawal_items').delete().eq('withdrawal_id', withdrawalId);
      
      const validItems = withdrawalItems.filter(i => i.item_id).map(i => ({
        withdrawal_id: withdrawalId,
        item_id: parseInt(i.item_id),
        quantity: i.quantity
      }));

      if (validItems.length > 0) {
        await supabase.from('inventory_withdrawal_items').insert(validItems);
      }
    }

    setLoading(false);
    toast.success(isEditing ? 'Sale record updated successfully' : 'Sale created successfully');
    navigate('/pharmacy/sales');
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '1000px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to="/pharmacy/sales" className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Sale Record' : 'New Pharmacy Sale'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* Left Column - Main Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="section-panel">
                <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Customer & Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Registered Patient (Optional)</label>
                    <SearchableSelect
                      name="customer_id"
                      options={patients.map(p => ({ label: `${p.first_name} ${p.last_name}`, value: p.patient_id }))}
                      value={formData.customer_id}
                      onChange={handleChange}
                      placeholder="Walk-in / Select Patient"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Customer Name (If Walk-in)</label>
                    <input
                      type="text"
                      name="customer_name"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.customer_name}
                      onChange={handleChange}
                      disabled={!!formData.customer_id}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      name="withdrawal_date"
                      className="form-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.withdrawal_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Sale Type</label>
                    <SearchableSelect
                      name="sale_type"
                      options={[
                        { label: 'Retail', value: 'retail' },
                        { label: 'Wholesale', value: 'wholesale' },
                        { label: 'Internal Use', value: 'internal_use' }
                      ]}
                      value={formData.sale_type}
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
                  <h2 className="section-title" style={{ fontSize: '1.1rem', margin: 0 }}>Items Dispensed</h2>
                  <button type="button" className="btn btn-primary" onClick={addItemRow} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={16} /> Add Item
                  </button>
                </div>

                {withdrawalItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                    No items added. Click "Add Item".
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: '50%' }}>Item *</th>
                          <th style={{ width: '25%' }}>Price</th>
                          <th style={{ width: '20%' }}>Qty *</th>
                          <th style={{ width: '5%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawalItems.map((item, index) => {
                          const invItem = itemsList.find(i => i.item_id === parseInt(item.item_id));
                          return (
                            <tr key={index}>
                              <td>
                                <SearchableSelect
                                  name="item_id"
                                  options={itemsList.map(inv => ({ label: `${inv.item_name} (${inv.quantity_in_stock} ${inv.unit} in stock)`, value: inv.item_id }))}
                                  value={item.item_id}
                                  onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                                  placeholder="Select..."
                                  required
                                />
                              </td>
                              <td style={{ color: 'var(--text-gray)' }}>
                                {invItem ? `₱${Number(invItem.price).toFixed(2)}` : '-'}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  className="form-input"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                  required
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button type="button" className="icon-btn delete" onClick={() => removeItemRow(index)}>
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Billing Summary */}
            <div className="section-panel" style={{ position: 'sticky', top: '1.5rem' }}>
              <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Payment Summary</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Discount Type</label>
                  <SearchableSelect
                    name="discount_type"
                    options={[
                      { label: 'Percentage (%)', value: 'percentage' },
                      { label: 'Fixed Amount (₱)', value: 'fixed' }
                    ]}
                    value={formData.discount_type}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Discount Value</label>
                  <input
                    type="number"
                    name="discount_value"
                    min="0"
                    step="0.01"
                    className="form-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.discount_value}
                    onChange={handleChange}
                  />
                </div>

                <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Amount Due (₱)</label>
                  <input
                    type="number"
                    name="amount_due"
                    className="form-input"
                    style={{ paddingLeft: '1rem', backgroundColor: '#f8fafc', fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-color)' }}
                    value={formData.amount_due}
                    readOnly
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Amount Paid (₱)</label>
                  <input
                    type="number"
                    name="amount_paid"
                    min="0"
                    step="0.01"
                    className="form-input"
                    style={{ paddingLeft: '1rem' }}
                    value={formData.amount_paid}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Payment Status</label>
                  <SearchableSelect
                    name="payment_status"
                    options={[
                      { label: 'Unpaid', value: 'unpaid' },
                      { label: 'Partial', value: 'partial' },
                      { label: 'Paid', value: 'paid' }
                    ]}
                    value={formData.payment_status}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Order Status</label>
                  <SearchableSelect
                    name="status"
                    options={[
                      { label: 'Pending', value: 'pending' },
                      { label: 'Completed', value: 'completed' },
                      { label: 'Cancelled', value: 'cancelled' }
                    ]}
                    value={formData.status}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  <Save size={16} style={{ marginRight: '0.5rem' }} />
                  {loading ? 'Processing...' : 'Save Transaction'}
                </button>
                <Link to="/pharmacy/sales" className="btn btn-cancel" style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}>
                  Cancel
                </Link>
              </div>
            </div>

          </div>
        </form>

      </div>
    </div>
  );
}
