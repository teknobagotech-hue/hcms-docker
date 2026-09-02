import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  ArrowLeft, 
  Printer, 
  ExternalLink, 
  FileText, 
  Activity, 
  Heart, 
  Thermometer, 
  Wind, 
  Scale, 
  Edit, 
  User, 
  HeartPulse, 
  Clock, 
  Calendar,
  AlertCircle,
  Stethoscope,
  Pill,
  FlaskConical,
  Droplet,
  BarChart2,
  Zap,
  ShieldAlert,
  Microscope,
  Eye,
  Image as ImageIcon,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import DocumentPrintModal from '../components/DocumentPrintModal';

export default function RecordView() {
  const { id, type, recordId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Record Details');
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printDocType, setPrintDocType] = useState('Medical Certificate');

  useEffect(() => {
    fetchRecord();
  }, [type, recordId, id]);

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

    // Fetch patient info if available
    if (id) {
      const { data: ptData } = await supabase.from('patients').select('*').eq('patient_id', id).single();
      if (ptData) setPatient(ptData);
    }

    let query = supabase.from(table).select(joinDoctors ? '*, doctors(first_name, last_name, specialty)' : '*').eq(pk, recordId).single();
    
    const { data: recordData, error } = await query;

    if (type === 'prescriptions' && recordData) {
      const { data: items } = await supabase.from('prescription_items').select('*, medicines(medicine_name)').eq('prescription_id', recordId);
      if (items && items.length > 0) {
        recordData.raw_items = items;
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
      if (type === 'documents' && recordData.document_type) {
        if (recordData.document_type.toLowerCase().includes('referral')) {
          setPrintDocType('Referral Letter');
        } else {
          setPrintDocType('Medical Certificate');
        }
      }
    }
    setLoading(false);
  };

  const handleBack = () => {
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
  };

  const formatKey = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    try {
      const d = new Date(dateTimeStr);
      if (isNaN(d.getTime())) return String(dateTimeStr);
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return String(dateTimeStr);
    }
  };

  const renderValue = (val, key = '') => {
    if (val === null || val === undefined || val === '') return '-';
    if (key.includes('created_at') || key.includes('updated_at')) {
      return formatDateTime(val);
    }
    if (key.includes('date') && typeof val === 'string' && val.length === 10) {
      return formatDate(val);
    }
    if (typeof val === 'object') {
      const parts = [];
      for (const [k, v] of Object.entries(val)) {
        if (v && typeof v !== 'object') parts.push(`${formatKey(k)}: ${v}`);
      }
      return parts.join(' | ');
    }
    return String(val);
  };

  // Vitals Health Interpretations
  const getBpStatus = (bpStr) => {
    if (!bpStr) return null;
    const parts = String(bpStr).split('/');
    if (parts.length !== 2) return null;
    const sys = parseInt(parts[0], 10);
    const dia = parseInt(parts[1], 10);
    if (isNaN(sys) || isNaN(dia)) return null;

    if (sys >= 140 || dia >= 90) {
      return { label: 'Stage 2 HTN', color: '#DC2626', bg: '#FEF2F2', borderColor: '#FCA5A5' };
    } else if (sys >= 130 || dia >= 80) {
      return { label: 'Stage 1 HTN', color: '#D97706', bg: '#FFFBEB', borderColor: '#FDE68A' };
    } else if (sys >= 120 && dia < 80) {
      return { label: 'Elevated BP', color: '#D97706', bg: '#FFFBEB', borderColor: '#FDE68A' };
    } else if (sys < 120 && dia < 80) {
      return { label: 'Normal BP', color: '#16A34A', bg: '#F0FDF4', borderColor: '#86EFAC' };
    }
    return null;
  };

  const getSpo2Status = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    if (num < 95) return { label: 'Low SpO2', color: '#DC2626', bg: '#FEF2F2', borderColor: '#FCA5A5' };
    return { label: 'Normal', color: '#16A34A', bg: '#F0FDF4', borderColor: '#86EFAC' };
  };

  const getPrStatus = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = parseInt(val, 10);
    if (isNaN(num)) return null;
    if (num > 100) return { label: 'High Pulse', color: '#DC2626', bg: '#FEF2F2', borderColor: '#FCA5A5' };
    if (num < 60) return { label: 'Low Pulse', color: '#D97706', bg: '#FFFBEB', borderColor: '#FDE68A' };
    return { label: 'Normal', color: '#16A34A', bg: '#F0FDF4', borderColor: '#86EFAC' };
  };

  const getTempStatus = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    if (num >= 38.0) return { label: 'Fever', color: '#DC2626', bg: '#FEF2F2', borderColor: '#FCA5A5' };
    if (num >= 37.5) return { label: 'Elevated', color: '#D97706', bg: '#FFFBEB', borderColor: '#FDE68A' };
    if (num < 36.0) return { label: 'Low Temp', color: '#D97706', bg: '#FFFBEB', borderColor: '#FDE68A' };
    return { label: 'Normal', color: '#16A34A', bg: '#F0FDF4', borderColor: '#86EFAC' };
  };

  const getStatusBadge = (statusStr) => {
    if (!statusStr) return null;
    const s = String(statusStr).toLowerCase();
    let bg = '#F1F5F9';
    let color = '#475569';
    let border = '#CBD5E1';

    if (s.includes('completed') || s.includes('active') || s.includes('normal') || s.includes('negative') || s.includes('non-reactive')) {
      bg = '#F0FDF4'; color = '#16A34A'; border = '#86EFAC';
    } else if (s.includes('scheduled') || s.includes('pending') || s.includes('in progress')) {
      bg = '#EFF6FF'; color = '#2563EB'; border = '#93C5FD';
    } else if (s.includes('cancel') || s.includes('reactive') || s.includes('high') || s.includes('fever') || s.includes('abnormal')) {
      bg = '#FEF2F2'; color = '#DC2626'; border = '#FCA5A5';
    }

    return (
      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: '1rem', backgroundColor: bg, color: color, border: `1px solid ${border}`, textTransform: 'capitalize' }}>
        {statusStr}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="section-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-gray)', fontSize: '1.05rem' }}>Loading record details...</p>
      </div>
    );
  }

  if (!data) return null;

  // Custom Rendering for Vitals Details
  const renderVitalsView = () => {
    const bpStatus = getBpStatus(data.bp);
    const spo2Status = getSpo2Status(data.spo2);
    const prStatus = getPrStatus(data.pr);
    const tempStatus = getTempStatus(data.temperature_c);

    const metrics = [
      { label: 'Blood Pressure', value: data.bp || '-', unit: 'mmHg', icon: <Heart size={20} color="#0d9488" />, status: bpStatus },
      { label: 'Pulse Rate', value: data.pr ? `${data.pr}` : '-', unit: 'bpm', icon: <Activity size={20} color="#0d9488" />, status: prStatus },
      { label: 'SpO2 Level', value: data.spo2 ? `${data.spo2}` : '-', unit: '%', icon: <Wind size={20} color="#0d9488" />, status: spo2Status },
      { label: 'Temperature', value: data.temperature_c ? `${data.temperature_c}` : '-', unit: '°C', subValue: data.temperature_c ? `${(data.temperature_c * 9/5 + 32).toFixed(1)} °F` : null, icon: <Thermometer size={20} color="#0d9488" />, status: tempStatus },
      { label: 'Weight', value: data.weight_kg ? `${data.weight_kg}` : '-', unit: 'kg', subValue: data.weight_kg ? `${(data.weight_kg * 2.20462).toFixed(1)} lbs` : null, icon: <Scale size={20} color="#0d9488" />, status: null }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {metrics.map((m, idx) => (
            <div key={idx} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
                <div style={{ backgroundColor: '#F0FDFA', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.icon}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1.65rem', fontWeight: 700, color: m.status?.color || '#0F172A', letterSpacing: '-0.02em' }}>{m.value}</span>
                  {m.unit && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>{m.unit}</span>}
                </div>
                {m.subValue && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>{m.subValue}</div>}
              </div>
              {m.status && (
                <div style={{ marginTop: '0.875rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.725rem', fontWeight: 600, color: m.status.color, backgroundColor: m.status.bg, border: `1px solid ${m.status.borderColor}`, padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                    {m.status.label}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.75rem' }}>
          <div className="section-panel" style={{ margin: 0, padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <HeartPulse size={20} color="var(--primary)" /> Vital Measurements Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ paddingBottom: '0.875rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Blood Pressure</span>
                <div style={{ color: bpStatus?.color || 'var(--text-dark)', fontWeight: 600, marginTop: '0.35rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {data.bp || 'Not recorded'}
                  {bpStatus && <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', backgroundColor: bpStatus.bg, color: bpStatus.color, border: `1px solid ${bpStatus.borderColor}` }}>{bpStatus.label}</span>}
                </div>
              </div>
              <div style={{ paddingBottom: '0.875rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Pulse Rate</span>
                <div style={{ color: 'var(--text-dark)', fontWeight: 600, marginTop: '0.35rem', fontSize: '1.05rem' }}>{data.pr ? `${data.pr} bpm` : 'Not recorded'}</div>
              </div>
              <div style={{ paddingBottom: '0.875rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Oxygen Saturation (SpO2)</span>
                <div style={{ color: 'var(--text-dark)', fontWeight: 600, marginTop: '0.35rem', fontSize: '1.05rem' }}>{data.spo2 ? `${data.spo2}%` : 'Not recorded'}</div>
              </div>
              <div style={{ paddingBottom: '0.875rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Body Temperature</span>
                <div style={{ color: 'var(--text-dark)', fontWeight: 600, marginTop: '0.35rem', fontSize: '1.05rem' }}>{data.temperature_c ? `${data.temperature_c} °C (${(data.temperature_c * 9/5 + 32).toFixed(1)} °F)` : 'Not recorded'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Weight</span>
                <div style={{ color: 'var(--text-dark)', fontWeight: 600, marginTop: '0.35rem', fontSize: '1.05rem' }}>{data.weight_kg ? `${data.weight_kg} kg (${(data.weight_kg * 2.20462).toFixed(1)} lbs)` : 'Not recorded'}</div>
              </div>
            </div>
          </div>

          <div className="section-panel" style={{ margin: 0, padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileText size={20} color="var(--primary)" /> Clinical Context & Metadata
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ paddingBottom: '0.875rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Record Date</span>
                <div style={{ color: 'var(--text-dark)', fontWeight: 600, marginTop: '0.35rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} color="#64748B" />{formatDate(data.record_date)}
                </div>
              </div>
              <div style={{ paddingBottom: '0.875rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Patient Age at Recording</span>
                <div style={{ color: 'var(--text-dark)', fontWeight: 600, marginTop: '0.35rem', fontSize: '1.05rem' }}>{data.age ? `${data.age} years old` : 'Not specified'}</div>
              </div>
              <div style={{ paddingBottom: '0.875rem', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Recorded Timestamp</span>
                <div style={{ color: 'var(--text-dark)', marginTop: '0.35rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="#64748B" />{formatDateTime(data.created_at)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Clinical Notes</span>
                <div style={{ color: data.notes && data.notes !== '-' ? '#0F172A' : '#94A3B8', marginTop: '0.5rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {data.notes && data.notes !== '-' ? data.notes : 'No clinical notes provided for this record.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Appointments Render
  const renderAppointmentsView = () => {
    const doctorName = data.doctors ? `Dr. ${data.doctors.first_name || ''} ${data.doctors.last_name || ''}`.trim() : null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Appointment Date</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#0d9488" /> {formatDate(data.appointment_date)}
            </div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Time Slot</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#0d9488" /> {data.appointment_time || 'Not specified'}
            </div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Attending Doctor</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={18} color="#0d9488" /> {doctorName || 'Unassigned'}
            </div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Status</span>
            <div style={{ marginTop: '0.5rem' }}>{getStatusBadge(data.status || 'Scheduled')}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.75rem' }}>
          <div className="section-panel" style={{ margin: 0, padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Calendar size={20} color="var(--primary)" /> Appointment Overview
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Purpose / Chief Reason</span>
                <div style={{ color: '#0F172A', fontWeight: 600, marginTop: '0.35rem', fontSize: '1.05rem', backgroundColor: '#F8FAFC', padding: '0.875rem 1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                  {data.purpose || 'General Consultation'}
                </div>
              </div>
              <div style={{ paddingTop: '0.875rem', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Status</span>
                <div style={{ marginTop: '0.35rem' }}>{getStatusBadge(data.status || 'Scheduled')}</div>
              </div>
            </div>
          </div>

          <div className="section-panel" style={{ margin: 0, padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <UserCheck size={20} color="var(--primary)" /> Doctor & Metadata
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Attending Physician</span>
                <div style={{ color: '#0F172A', fontWeight: 600, marginTop: '0.35rem', fontSize: '1.05rem' }}>
                  {doctorName || 'Not assigned'} {data.doctors?.specialty ? `(${data.doctors.specialty})` : ''}
                </div>
              </div>
              <div style={{ paddingTop: '0.875rem', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Recorded Timestamp</span>
                <div style={{ color: '#0F172A', marginTop: '0.35rem', fontSize: '0.95rem' }}>{formatDateTime(data.created_at)}</div>
              </div>
              <div style={{ paddingTop: '0.875rem', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Appointment Notes</span>
                <div style={{ color: data.notes ? '#0F172A' : '#94A3B8', marginTop: '0.35rem', backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', fontSize: '0.95rem' }}>
                  {data.notes || 'No extra notes provided.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Records Render (Clinical Encounters)
  const renderEncountersView = () => {
    const doctorName = data.doctors ? `Dr. ${data.doctors.first_name || ''} ${data.doctors.last_name || ''}`.trim() : null;
    const hasVitals = data.blood_pressure || data.heart_rate || data.temperature_c || data.spo2 || data.weight_kg || data.bmi;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Visit Date</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#0d9488" /> {formatDate(data.record_date || data.visit_date)}
            </div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Attending Physician</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Stethoscope size={18} color="#0d9488" /> {doctorName || 'Unassigned'}
            </div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem', gridColumn: 'span 2' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Primary Diagnosis</span>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0D9488', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="#0d9488" /> {data.diagnosis || 'Clinical Assessment Completed'}
            </div>
          </div>
        </div>

        {/* Section 1: Chief Complaint, Diagnosis & Treatment */}
        <div className="section-panel" style={{ margin: 0, padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Stethoscope size={20} color="var(--primary)" /> Chief Complaint, Diagnosis & Treatment
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Chief Complaint *</span>
              <div style={{ color: '#0F172A', marginTop: '0.35rem', fontSize: '0.95rem', backgroundColor: '#FFFBEB', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #FDE68A', fontWeight: 500, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {data.chief_complaint || 'None specified'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Diagnosis</span>
              <div style={{ color: '#0F172A', marginTop: '0.35rem', fontSize: '0.95rem', backgroundColor: '#F0FDFA', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #99F6E4', fontWeight: 600, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {data.diagnosis || 'None'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Treatment Provided</span>
              <div style={{ color: '#0F172A', marginTop: '0.35rem', fontSize: '0.95rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {data.treatment || data.treatment_plan || 'No treatment provided documented.'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: SOAP Notes */}
        <div className="section-panel" style={{ margin: 0, padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={20} color="var(--primary)" /> SOAP Notes
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
            {/* Subjective */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '0.625rem', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ backgroundColor: '#0D9488', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '0.375rem' }}>S</span>
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Subjective</span>
              </div>
              <div style={{ color: data.subjective ? '#0F172A' : '#94A3B8', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {data.subjective || 'No subjective notes documented.'}
              </div>
            </div>

            {/* Objective */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '0.625rem', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ backgroundColor: '#2563EB', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '0.375rem' }}>O</span>
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Objective</span>
              </div>
              <div style={{ color: data.objective ? '#0F172A' : '#94A3B8', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {data.objective || 'No objective findings documented.'}
              </div>
            </div>

            {/* Assessment */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '0.625rem', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ backgroundColor: '#D97706', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '0.375rem' }}>A</span>
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Assessment</span>
              </div>
              <div style={{ color: data.assessment ? '#0F172A' : '#94A3B8', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {data.assessment || 'No assessment notes documented.'}
              </div>
            </div>

            {/* Plan */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '0.625rem', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ backgroundColor: '#16A34A', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '0.375rem' }}>P</span>
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>Plan</span>
              </div>
              <div style={{ color: data.plan ? '#0F172A' : '#94A3B8', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {data.plan || 'No plan documented.'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Vitals Snapshot (if present) */}
        {hasVitals && (
          <div className="section-panel" style={{ margin: 0, padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <HeartPulse size={20} color="var(--primary)" /> Vitals Snapshot (Captured During Visit)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              {data.blood_pressure && (
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Blood Pressure</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>{data.blood_pressure}</div>
                </div>
              )}
              {data.heart_rate && (
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Heart Rate</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>{data.heart_rate} bpm</div>
                </div>
              )}
              {data.spo2 && (
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>SpO2</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>{data.spo2}%</div>
                </div>
              )}
              {data.temperature_c && (
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Temperature</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>{data.temperature_c} °C</div>
                </div>
              )}
              {data.weight_kg && (
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Weight</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>{data.weight_kg} kg</div>
                </div>
              )}
              {data.bmi && (
                <div style={{ backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>BMI</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.2rem' }}>{data.bmi}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 4: Medical History & Additional Notes */}
        <div className="section-panel" style={{ margin: 0, padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={20} color="var(--primary)" /> Medical History & Additional Notes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Past Medical History Context</span>
              <div style={{ color: '#0F172A', marginTop: '0.35rem', fontSize: '0.95rem', backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                {data.medical_history || 'No prior medical history specified.'}
              </div>
            </div>
            <div style={{ paddingTop: '0.875rem', borderTop: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Physician Notes</span>
              <div style={{ color: '#0F172A', marginTop: '0.35rem', fontSize: '0.95rem', backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {data.notes || 'No extra notes.'}
              </div>
            </div>
            <div style={{ paddingTop: '0.875rem', borderTop: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Created Timestamp</span>
              <div style={{ color: '#0F172A', marginTop: '0.35rem', fontSize: '0.95rem' }}>{formatDateTime(data.created_at)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Prescriptions Render
  const renderPrescriptionsView = () => {
    const doctorName = data.doctors ? `Dr. ${data.doctors.first_name || ''} ${data.doctors.last_name || ''}`.trim() : null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Prescription Date</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#0d9488" /> {formatDate(data.prescription_date)}
            </div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Prescribing Doctor</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={18} color="#0d9488" /> {doctorName || 'Unassigned'}
            </div>
          </div>
        </div>

        <div className="section-panel" style={{ margin: 0, padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Pill size={20} color="var(--primary)" /> Prescribed Medications List
          </h3>
          <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '0.625rem', border: '1px solid #E2E8F0', whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '1rem', color: '#0F172A', fontWeight: 500 }}>
            {data.medicines_prescribed || data.notes || 'No medications listed.'}
          </div>
        </div>
      </div>
    );
  };

  // Lab CBC Render
  const renderCbcView = () => {
    const fields = [
      { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL' },
      { key: 'hematocrit', label: 'Hematocrit', unit: '%' },
      { key: 'rbc', label: 'RBC Count', unit: 'x10¹²/L' },
      { key: 'wbc', label: 'WBC Count', unit: 'x10⁹/L' },
      { key: 'platelets', label: 'Platelet Count', unit: 'x10⁹/L' },
      { key: 'neutrophils', label: 'Neutrophils', unit: '%' },
      { key: 'lymphocytes', label: 'Lymphocytes', unit: '%' },
      { key: 'monocytes', label: 'Monocytes', unit: '%' },
      { key: 'eosinophils', label: 'Eosinophils', unit: '%' },
      { key: 'basophils', label: 'Basophils', unit: '%' }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Hemoglobin</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '0.25rem' }}>{data.hemoglobin || '-'} <span style={{ fontSize: '0.85rem', color: '#64748B' }}>g/dL</span></div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>WBC Count</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '0.25rem' }}>{data.wbc || '-'} <span style={{ fontSize: '0.85rem', color: '#64748B' }}>x10⁹/L</span></div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Platelets</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '0.25rem' }}>{data.platelets || '-'} <span style={{ fontSize: '0.85rem', color: '#64748B' }}>x10⁹/L</span></div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Hematocrit</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '0.25rem' }}>{data.hematocrit || '-'} <span style={{ fontSize: '0.85rem', color: '#64748B' }}>%</span></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.75rem' }}>
          <div className="section-panel" style={{ margin: 0, padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FlaskConical size={20} color="var(--primary)" /> Complete Blood Count Results
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {fields.map(f => data[f.key] !== undefined && data[f.key] !== null && (
                <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>{f.label}</span>
                  <span style={{ fontSize: '1.05rem', color: '#0F172A', fontWeight: 700 }}>{data[f.key]} {f.unit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="section-panel" style={{ margin: 0, padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileText size={20} color="var(--primary)" /> Remarks & Metadata
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Test Date</span>
                <div style={{ color: '#0F172A', fontWeight: 600, marginTop: '0.35rem', fontSize: '1.05rem' }}>{formatDate(data.test_date)}</div>
              </div>
              <div style={{ paddingTop: '0.875rem', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Pathologist Remarks</span>
                <div style={{ color: '#0F172A', marginTop: '0.35rem', fontSize: '0.95rem', backgroundColor: '#F8FAFC', padding: '0.875rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                  {data.remarks || 'No remarks added.'}
                </div>
              </div>
              <div style={{ paddingTop: '0.875rem', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Created Timestamp</span>
                <div style={{ color: '#0F172A', marginTop: '0.35rem', fontSize: '0.95rem' }}>{formatDateTime(data.created_at)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Imaging Render
  const renderImagingView = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Imaging Modality</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={18} color="#0d9488" /> {data.imaging_type || 'X-Ray / Ultrasound'}
            </div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Body Part Examined</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="#0d9488" /> {data.body_part || 'Not specified'}
            </div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '0.875rem', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Test Date</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#0d9488" /> {formatDate(data.test_date)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.75rem' }}>
          <div className="section-panel" style={{ margin: 0, padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Eye size={20} color="var(--primary)" /> Findings & Impression
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Radiological Findings</span>
                <div style={{ color: '#0F172A', marginTop: '0.35rem', fontSize: '0.95rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {data.findings || 'No specific findings recorded.'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Radiological Impression</span>
                <div style={{ color: '#0F172A', marginTop: '0.35rem', fontSize: '1rem', backgroundColor: '#F0FDFA', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #99F6E4', fontWeight: 600, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {data.impression || 'No impression recorded.'}
                </div>
              </div>
            </div>
          </div>

          <div className="section-panel" style={{ margin: 0, padding: '1.75rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ImageIcon size={20} color="var(--primary)" /> Image Preview & Attachment
            </h3>
            {data.file_url ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <a href={data.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.5rem 1rem', width: 'fit-content' }}>
                  <ExternalLink size={16} /> Open Full High-Res Attachment
                </a>
                {(String(data.file_url).match(/\.(jpeg|jpg|png|gif|webp)/i) || String(data.file_url).includes('firebasestorage.googleapis.com')) && (
                  <div style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', padding: '0.5rem' }}>
                    <img src={data.file_url} alt="Imaging Preview" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '0.25rem' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#94A3B8', fontSize: '0.95rem', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                No image attachment uploaded for this report.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Generic Rendering for Other Record Types
  const renderGenericView = () => {
    const displayData = Object.entries(data).filter(
      ([key]) => key !== 'patient_id' && !key.endsWith('_id') && key !== 'raw_items'
    );

    const fullWidthKeys = ['chief_complaint', 'diagnosis', 'purpose', 'notes', 'impression', 'diagnosis_impression', 'findings', 'remarks', 'prescription_text', 'medical_history', 'allergies', 'doctors', 'file_url', 'medicines_prescribed'];

    return (
      <div className="section-panel" style={{ margin: 0, padding: '2rem', backgroundColor: '#ffffff', borderRadius: '0.875rem', border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileText size={20} color="var(--primary)" /> Information Overview
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {displayData.map(([key, value]) => {
            const isFullWidth = fullWidthKeys.includes(key) || (typeof value === 'string' && value.length > 80);
            const isFileUrl = key === 'file_url';

            return (
              <div key={key} style={{ 
                gridColumn: isFullWidth ? '1 / -1' : 'auto',
                backgroundColor: '#F8FAFC', 
                padding: '1.25rem 1.5rem', 
                borderRadius: '0.625rem', 
                border: '1px solid #E2E8F0'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  {formatKey(key)}
                </div>

                {isFileUrl && value ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <a 
                        href={value} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      >
                        <ExternalLink size={16} /> Open Attached File
                      </a>
                    </div>
                    {(String(value).match(/\.(jpeg|jpg|png|gif|webp)/i) || String(value).includes('firebasestorage.googleapis.com')) && (
                      <div style={{ marginTop: '0.5rem', maxWidth: '450px', maxHeight: '350px', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', padding: '0.5rem' }}>
                        <img 
                          src={value} 
                          alt="Attachment Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '320px', borderRadius: '0.25rem' }} 
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#0F172A', fontSize: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontWeight: 500 }}>
                    {key === 'document_type' && value === 'AI Scanner Result' ? 'Scanner Result' : (key === 'diagnosis_impression' && value === 'Document auto-parsed via Gemini AI' ? 'Document auto-parsed' : renderValue(value, key))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'vitals': return renderVitalsView();
      case 'appointments': return renderAppointmentsView();
      case 'records': return renderEncountersView();
      case 'prescriptions': return renderPrescriptionsView();
      case 'cbc': return renderCbcView();
      case 'imaging': return renderImagingView();
      default: return renderGenericView();
    }
  };

  return (
    <div className="dashboard-scroll-area">
      <div style={{ padding: '0 2rem 2rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Main Card Container */}
        <div className="section-panel" style={{ backgroundColor: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', padding: '2.25rem', borderRadius: '1rem', margin: 0 }}>
          
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                onClick={handleBack} 
                className="icon-btn" 
                style={{ backgroundColor: '#F1F5F9', padding: '0.6rem', borderRadius: '50%', border: 'none', cursor: 'pointer', transition: 'background 0.2s ease' }}
                title="Go Back"
              >
                <ArrowLeft size={20} color="#334155" />
              </button>
              
              <div>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.01em' }}>
                  {title}
                </h2>
                {patient && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', fontSize: '0.875rem', color: '#64748B', fontWeight: 500 }}>
                    <User size={14} color="var(--primary)" />
                    <span>Patient: <strong style={{ color: '#0F172A' }}>{patient.first_name} {patient.last_name}</strong></span>
                    {patient.gender && <span>• {patient.gender}</span>}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {type === 'vitals' && (
                <Link 
                  to={`/patients/${id}/vitals/edit/${recordId}`} 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0d9488', textDecoration: 'none' }}
                >
                  <Edit size={16} /> Edit Vital Signs
                </Link>
              )}

              {type === 'documents' && (
                <button 
                  onClick={() => setPrintModalOpen(true)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0d9488' }}
                >
                  <Printer size={16} /> Print Document
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          {renderContent()}

        </div>

      </div>

      <DocumentPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        patientId={id}
        initialDocument={data}
        defaultDocType={printDocType}
      />
    </div>
  );
}


