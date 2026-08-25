import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import '../../index.css';

export default function StockReceiptForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [suppliers, setSuppliers] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    receipt_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    total_cost: 0,
    notes: '',
    status: 'completed'
  });
  
  const [receiptItems, setReceiptItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDropdowns();
    if (isEditing) {
      fetchReceipt();
    }
  }, [id]);

  const fetchDropdowns = async () => {
    const { data: supData } = await supabase.from('suppliers').select('supplier_id, supplier_name').order('supplier_name');
    if (supData) setSuppliers(supData);
    
    const { data: invData } = await supabase.from('inventory_items').select('item_id, item_name').order('item_name');
    if (invData) setItemsList(invData);
  };

  const fetchReceipt = async () => {
    const { data, error } = await supabase
      .from('stock_receipts')
      .select('*')
      .eq('receipt_id', id)
      .maybeSingle();

    if (error) {
      toast.error('Failed to load receipt details');
      navigate('/inventory/receipts');
      return;
    }

    setFormData({
      supplier_id: data.supplier_id || '',
      receipt_date: data.receipt_date ? data.receipt_date.split('T')[0] : '',
      reference_number: data.reference_number || '',
      total_cost: data.total_cost || 0,
      notes: data.notes || '',
      status: data.status || 'completed'
    });

    const { data: itemsData } = await supabase
      .from('stock_receipt_items')
      .select('*')
      .eq('receipt_id', id);

    if (itemsData) {
      setReceiptItems(itemsData);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...receiptItems];
    updated[index][field] = field === 'quantity_received' || field === 'unit_cost' ? parseFloat(value) || 0 : value;
    
    // Auto calculate total cost
    setReceiptItems(updated);
    
    if (field === 'quantity_received' || field === 'unit_cost') {
      const newTotal = updated.reduce((sum, item) => sum + ((item.quantity_received || 0) * (item.unit_cost || 0)), 0);
      setFormData(prev => ({ ...prev, total_cost: newTotal }));
    }
  };

  const addItemRow = () => {
    setReceiptItems([...receiptItems, { item_id: '', quantity_received: 1, unit_cost: 0, batch_number: '', expiry_date: '' }]);
  };

  const removeItemRow = (index) => {
    const updated = receiptItems.filter((_, i) => i !== index);
    setReceiptItems(updated);
    
    const newTotal = updated.reduce((sum, item) => sum + ((item.quantity_received || 0) * (item.unit_cost || 0)), 0);
    setFormData(prev => ({ ...prev, total_cost: newTotal }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { 
      ...formData, 
      supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null 
    };

    let receiptId = id;
    let error;

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('stock_receipts')
        .update(payload)
        .eq('receipt_id', id);
      error = updateError;
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from('stock_receipts')
        .insert([payload])
        .select();
      error = insertError;
      if (insertData && insertData.length > 0) {
        receiptId = insertData[0].receipt_id;
      }
    }

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Handle items saving
    if (receiptId) {
      // Very basic approach: delete old items and insert new ones
      await supabase.from('stock_receipt_items').delete().eq('receipt_id', receiptId);
      
      const validItems = receiptItems.filter(i => i.item_id).map(i => ({
        receipt_id: receiptId,
        item_id: parseInt(i.item_id),
        quantity_received: i.quantity_received,
        unit_cost: i.unit_cost,
        batch_number: i.batch_number || null,
        expiry_date: i.expiry_date || null
      }));

      if (validItems.length > 0) {
        await supabase.from('stock_receipt_items').insert(validItems);
      }
    }

    setLoading(false);
    toast.success(isEditing ? 'Receipt updated successfully' : 'Receipt created successfully');
    navigate('/inventory/receipts');
  };

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '1000px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Link to="/inventory/receipts" className="icon-btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            {isEditing ? 'Edit Stock Receipt' : 'Add New Stock Receipt'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="section-panel" style={{ marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Receipt Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Supplier *</label>
              <SearchableSelect
                name="supplier_id"
                options={suppliers.map(s => ({ label: s.supplier_name, value: s.supplier_id }))}
                value={formData.supplier_id}
                onChange={handleChange}
                placeholder="Select Supplier"
                required
              />
            </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Receipt Date *</label>
                <input
                  type="date"
                  name="receipt_date"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.receipt_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Reference Number</label>
                <input
                  type="text"
                  name="reference_number"
                  className="form-input"
                  style={{ paddingLeft: '1rem' }}
                  value={formData.reference_number}
                  onChange={handleChange}
                  placeholder="Invoice or PO number"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Total Cost (₱)</label>
                <input
                  type="number"
                  name="total_cost"
                  step="0.01"
                  min="0"
                  className="form-input"
                  style={{ paddingLeft: '1rem', backgroundColor: '#f8fafc' }}
                  value={formData.total_cost}
                  onChange={handleChange}
                  readOnly
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
              <h2 className="section-title" style={{ fontSize: '1.1rem', margin: 0 }}>Received Items</h2>
              <button type="button" className="btn btn-primary" onClick={addItemRow} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} /> Add Item
              </button>
            </div>

            {receiptItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                No items added yet. Click "Add Item" to start.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Item *</th>
                      <th style={{ width: '15%' }}>Qty *</th>
                      <th style={{ width: '15%' }}>Unit Cost (₱)</th>
                      <th style={{ width: '15%' }}>Batch No.</th>
                      <th style={{ width: '15%' }}>Expiry Date</th>
                      <th style={{ width: '10%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptItems.map((item, index) => (
                      <tr key={index}>
                        <td style={{ width: '40%' }}>
                        <SearchableSelect
                          name="item_id"
                          options={itemsList.map(inv => ({ label: inv.item_name, value: inv.item_id }))}
                          value={item.item_id}
                          onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                          placeholder="Select Item..."
                          required
                        />
                      </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="form-input"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            value={item.quantity_received}
                            onChange={(e) => handleItemChange(index, 'quantity_received', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-input"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            value={item.unit_cost}
                            onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            value={item.batch_number}
                            onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="form-input"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            value={item.expiry_date}
                            onChange={(e) => handleItemChange(index, 'expiry_date', e.target.value)}
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
              <Link to="/inventory/receipts" className="btn btn-cancel" style={{ textDecoration: 'none' }}>
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Receipt'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
