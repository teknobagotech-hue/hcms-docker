import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Calendar, AlertTriangle, ShoppingCart } from 'lucide-react';

export default function SummaryCards() {
  const [totalPatients, setTotalPatients] = useState(0);
  const [appointmentsToday, setAppointmentsToday] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      // 1. Total Patients
      const { count: pCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      if (pCount !== null) setTotalPatients(pCount);

      // 2. Appointments Today / Upcoming
      const todayStr = new Date().toISOString().split('T')[0];
      const { count: aCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('appointment_date', todayStr);
      if (aCount !== null) setAppointmentsToday(aCount);

      // 3. Low stock inventory items
      const { data: invItems } = await supabase.from('inventory_items').select('quantity_in_stock, reorder_level');
      if (invItems) {
        const low = invItems.filter(item => (item.quantity_in_stock || 0) <= (item.reorder_level || 5)).length;
        setLowStockCount(low);
      }

      // 4. Pharmacy Total Sales
      const { data: sales } = await supabase.from('inventory_withdrawals').select('amount_due');
      if (sales) {
        const sum = sales.reduce((acc, s) => acc + (Number(s.amount_due) || 0), 0);
        setTotalSales(sum);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary cards:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
      {/* Total Patients */}
      <div className="card card-primary">
        <div className="card-header">
          <div className="card-title">Total Patients</div>
          <div className="card-icon-wrapper">
            <Users />
          </div>
        </div>
        <div className="card-value">
          {loading ? '...' : totalPatients} <span>Active Records</span>
        </div>
        <div className="card-subtitle">
          Registered patients
        </div>
      </div>

      {/* Appointments Today / Upcoming */}
      <div className="card card-blue">
        <div className="card-header">
          <div className="card-title">Upcoming Appointments</div>
          <div className="card-icon-wrapper">
            <Calendar />
          </div>
        </div>
        <div className="card-value">
          {loading ? '...' : appointmentsToday} <span>Scheduled</span>
        </div>
        <div className="card-subtitle">
          Patient consultations
        </div>
      </div>

      {/* Pharmacy Sales */}
      <div className="card card-green" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
        <div className="card-header">
          <div className="card-title" style={{ color: '#166534' }}>Pharmacy Sales</div>
          <div className="card-icon-wrapper" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
            <ShoppingCart size={20} />
          </div>
        </div>
        <div className="card-value" style={{ color: '#14532d' }}>
          {loading ? '...' : `₱${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </div>
        <div className="card-subtitle" style={{ color: '#166534' }}>
          Total revenue
        </div>
      </div>

      {/* Inventory Alerts */}
      <div className="card card-danger">
        <div className="card-header">
          <div className="card-title">Inventory Alerts</div>
          <div className="card-icon-wrapper">
            <AlertTriangle />
          </div>
        </div>
        <div className="card-value">
          {loading ? '...' : lowStockCount} <span>Critical</span>
        </div>
        <div className="card-subtitle">
          Low Stock items
        </div>
      </div>
    </div>
  );
}
