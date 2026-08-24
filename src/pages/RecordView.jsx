import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RecordView() {
  const { id, type, recordId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Record Details');

  useEffect(() => {
    fetchRecord();
  }, [type, recordId]);

  const fetchRecord = async () => {
    setLoading(true);
    let table = '';
    let pk = '';
    let joinDoctors = false;
    let pageTitle = 'Record Details';

    switch (type) {
      case 'appointments': table = 'appointments'; pk = 'appointment_id'; joinDoctors = true; pageTitle = 'Appointment Details'; break;
      case 'records': table = 'medical_records'; pk = 'record_id'; joinDoctors = true; pageTitle = 'Clinical Encounter Details'; break;
      case 'vitals': table = 'vital_signs'; pk = 'vital_id'; pageTitle = 'Vital Signs Details'; break;
      case 'cbc': table = 'lab_cbc'; pk = 'cbc_id'; pageTitle = 'CBC Report Details'; break;
      case 'chem': table = 'lab_chemistry'; pk = 'chem_id'; pageTitle = 'Chemistry Report Details'; break;
      case 'serology': table = 'lab_serology'; pk = 'serology_id'; pageTitle = 'Serology Report Details'; break;
      case 'ua': table = 'lab_urinalysis'; pk = 'ua_id'; pageTitle = 'Urinalysis Report Details'; break;
      case 'imaging': table = 'imaging_reports'; pk = 'imaging_id'; pageTitle = 'Imaging Report Details'; break;
      case 'prescriptions': table = 'prescriptions'; pk = 'prescription_id'; joinDoctors = true; pageTitle = 'Prescription Details'; break;
      case 'documents': table = 'medical_documents'; pk = 'document_id'; pageTitle = 'Document Details'; break;
      default: 
        toast.error('Invalid record type');
        navigate(-1);
        return;
    }

    setTitle(pageTitle);

    let query = supabase.from(table).select(joinDoctors ? '*, doctors(first_name, last_name, specialty)' : '*').eq(pk, recordId).single();
    
    const { data: recordData, error } = await query;

    if (type === 'prescriptions' && recordData) {
      const { data: items } = await supabase.from('prescription_items').select('*, medicines(medicine_name)').eq('prescription_id', recordId);
      if (items && items.length > 0) {
        recordData.medicines_prescribed = items.map(item => {
          return `${item.medicines?.medicine_name || 'Unknown'} - ${item.dosage || ''} ${item.frequency || ''} for ${item.duration_days || ''} days (Qty: ${item.quantity || ''})\nInstructions: ${item.instructions || '-'}`;
        }).join('\n\n');
      }
    }

    if (error) {
      toast.error('Failed to load record details');
      navigate(-1);
    } else {
      setData(recordData);
    }
    setLoading(false);
  };

  const formatKey = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  const renderValue = (val) => {
    if (val === null || val === undefined || val === '') return '-';
    if (typeof val === 'object') {
      const parts = [];
      for (const [k, v] of Object.entries(val)) {
        if (v && typeof v !== 'object') parts.push(`${formatKey(k)}: ${v}`);
      }
      return parts.join(' | ');
    }
    return String(val);
  };

  if (loading) {
    return (
      <div className="section-panel" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <p>Loading record details...</p>
      </div>
    );
  }

  if (!data) return null;

  const displayData = Object.entries(data).filter(
    ([key]) => key !== 'patient_id' && !key.endsWith('_id')
  );

  const fullWidthKeys = ['chief_complaint', 'diagnosis', 'purpose', 'notes', 'impression', 'diagnosis_impression', 'findings', 'remarks', 'prescription_text', 'medical_history', 'allergies', 'doctors'];

  return (
    <div className="dashboard-scroll-area">
      <div style={{ padding: '0 2rem 2rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-panel" style={{ backgroundColor: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', padding: '2.5rem', borderRadius: '1rem', margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={() => {
            const labTypes = ['cbc', 'chem', 'serology', 'ua', 'imaging'];
            if (labTypes.includes(type)) {
              navigate(`/patients/view/${id}?tab=labs`);
            } else if (type === 'appointments') {
              navigate(`/patients/view/${id}?tab=appointments`);
            } else if (type === 'records') {
              navigate(`/patients/view/${id}?tab=records`);
            } else if (type === 'prescriptions') {
              navigate(`/patients/view/${id}?tab=prescriptions`);
            } else if (type === 'vitals') {
              navigate(`/patients/view/${id}?tab=vitals`);
            } else if (type === 'documents') {
              navigate(`/patients/view/${id}?tab=documents`);
            } else {
              navigate(-1);
            }
          }} className="icon-btn" style={{ backgroundColor: '#F1F5F9', padding: '0.5rem', borderRadius: '50%' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>
            {title}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {displayData.map(([key, value]) => {
            const isFullWidth = fullWidthKeys.includes(key) || (typeof value === 'string' && value.length > 80);
            return (
              <div key={key} style={{ 
                gridColumn: isFullWidth ? '1 / -1' : 'auto',
                backgroundColor: '#F8FAFC', 
                padding: '1.5rem', 
                borderRadius: '0.75rem', 
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid var(--primary)'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  {formatKey(key)}
                </div>
                <div style={{ color: '#0F172A', fontSize: '1.05rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontWeight: 500 }}>
                  {key === 'document_type' && value === 'AI Scanner Result' ? 'Scanner Result' : (key === 'diagnosis_impression' && value === 'Document auto-parsed via Gemini AI' ? 'Document auto-parsed' : renderValue(value))}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}
