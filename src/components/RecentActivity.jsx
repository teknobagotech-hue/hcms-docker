import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Activity } from 'lucide-react';

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    setLoading(true);
    try {
      const activityList = [];

      // 1. Fetch recent medical records
      const { data: records } = await supabase
        .from('medical_records')
        .select('record_id, record_date, diagnosis, patients(first_name, last_name)')
        .order('record_date', { ascending: false })
        .limit(5);

      if (records) {
        records.forEach(r => {
          const patientName = r.patients ? `${r.patients.first_name} ${r.patients.last_name}` : 'Patient';
          activityList.push({
            id: `mr-${r.record_id}`,
            date: new Date(r.record_date || Date.now()),
            title: `Medical record created for ${patientName}`,
            description: r.diagnosis ? `Diagnosis: ${r.diagnosis}` : 'Clinical encounter recorded'
          });
        });
      }

      // 2. Fetch recent prescriptions
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('prescription_id, prescription_date, status, patients(first_name, last_name)')
        .order('prescription_date', { ascending: false })
        .limit(5);

      if (prescriptions) {
        prescriptions.forEach(p => {
          const patientName = p.patients ? `${p.patients.first_name} ${p.patients.last_name}` : 'Patient';
          activityList.push({
            id: `rx-${p.prescription_id}`,
            date: new Date(p.prescription_date || Date.now()),
            title: `Prescription issued for ${patientName}`,
            description: `Status: ${p.status || 'Active'}`
          });
        });
      }

      // 3. Fetch recent pharmacy sales
      const { data: sales } = await supabase
        .from('inventory_withdrawals')
        .select('withdrawal_id, withdrawal_date, customer_name, amount_due, patients(first_name, last_name)')
        .order('withdrawal_date', { ascending: false })
        .limit(5);

      if (sales) {
        sales.forEach(s => {
          const customerName = s.patients ? `${s.patients.first_name} ${s.patients.last_name}` : (s.customer_name || 'Walk-in Customer');
          activityList.push({
            id: `sale-${s.withdrawal_id}`,
            date: new Date(s.withdrawal_date || Date.now()),
            title: `Pharmacy sale for ${customerName}`,
            description: `Amount: ₱${Number(s.amount_due || 0).toFixed(2)}`
          });
        });
      }

      // Sort combined activity chronologically (newest first)
      activityList.sort((a, b) => b.date - a.date);

      setActivities(activityList.slice(0, 6));
    } catch (err) {
      console.error('Error fetching recent activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${Math.max(1, diffMins)} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="section-panel">
      <div className="section-header">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} className="text-primary" />
          Recent Clinical Activity
        </h2>
      </div>
      
      {loading ? (
        <p style={{ padding: '1rem', color: 'var(--text-light)' }}>Loading activity feed...</p>
      ) : activities.length === 0 ? (
        <p style={{ padding: '1rem', color: 'var(--text-light)' }}>No recent activity recorded.</p>
      ) : (
        <div className="timeline">
          {activities.map((activity) => (
            <div className="timeline-item" key={activity.id}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-title">
                  {activity.title}
                </div>
                <div className="timeline-desc">
                  {formatTimeAgo(activity.date)} • {activity.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
