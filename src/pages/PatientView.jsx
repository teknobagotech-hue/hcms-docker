import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Trash2, Archive, UserRound, Phone, MapPin, Calendar, HeartPulse, Activity, FileText, FlaskConical, Stethoscope, FileSignature, ShieldCheck } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import PatientAppointments from '../components/PatientAppointments';
import PatientVitals from '../components/PatientVitals';
import PatientRecords from '../components/PatientRecords';
import PatientLabs from '../components/PatientLabs';
import PatientPrescriptions from '../components/PatientPrescriptions';
import PatientDocuments from '../components/PatientDocuments';
import PatientInsurance from '../components/PatientInsurance';
import '../index.css';

export default function PatientView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'overview';

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dashboard Tabs State
  const [activeTab, setActiveTab] = useState(initialTab);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_id', id)
      .single();

    if (error) {
      toast.error('Failed to load patient details');
      navigate('/patients');
    } else {
      setPatient(data);
    }
    setLoading(false);
  };

  const handleArchive = async () => {
    const { error } = await supabase
      .from('patients')
      .update({ status: 'inactive' })
      .eq('patient_id', id);

    if (error) {
      toast.error('Failed to archive patient');
    } else {
      toast.success('Patient archived successfully');
      fetchPatient();
    }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('patient_id', id);

    if (error) {
      toast.error('Failed to delete patient. Ensure all clinical records are deleted first.');
    } else {
      toast.success('Patient deleted successfully');
      navigate('/patients');
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action) => {
    const fullName = `${patient.first_name} ${patient.last_name}`;
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive Patient',
        message: `Are you sure you want to archive ${fullName}?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: handleArchive
      });
    } else if (action === 'delete') {
      setModalConfig({
        title: 'Delete Patient',
        message: `Are you sure you want to permanently delete ${fullName}? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmType: 'danger',
        onConfirm: handleDelete
      });
    }
    setModalOpen(true);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  if (!patient) return null;

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <UserRound size={16} /> },
    { id: 'appointments', label: 'Appointments', icon: <Calendar size={16} /> },
    { id: 'records', label: 'Medical Records', icon: <Stethoscope size={16} /> },
    { id: 'vitals', label: 'Vital Signs', icon: <Activity size={16} /> },
    { id: 'labs', label: 'Laboratory', icon: <FlaskConical size={16} /> },
    { id: 'prescriptions', label: 'Prescriptions', icon: <FileSignature size={16} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
    { id: 'insurance', label: 'Insurance', icon: <ShieldCheck size={16} /> },
  ];

  return (
    <div className="dashboard-scroll-area" style={{ backgroundColor: '#F8FAFC' }}>
      
      {/* Top Header Banner */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--border-color)', padding: '1.5rem 2rem' }}>
        <div className="dashboard-container patient-header-banner" style={{ margin: '0 auto', maxWidth: '1800px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="icon-primary" style={{ width: '5rem', height: '5rem', padding: '1rem', borderRadius: '50%', flexShrink: 0 }}>
              <UserRound size={48} strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-dark)' }}>
                  {patient.last_name}, {patient.first_name} {patient.middle_name}
                </h1>
                <span className={`badge`} style={{ 
                  backgroundColor: patient.status === 'active' ? '#DBEAFE' : patient.status === 'deceased' ? '#FEE2E2' : '#F1F5F9', 
                  color: patient.status === 'active' ? '#1D4ED8' : patient.status === 'deceased' ? '#DC2626' : '#64748B' 
                }}>
                  {patient.status.toUpperCase()}
                </span>
              </div>
              
              <div className="patient-info-meta" style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-gray)', fontSize: '0.875rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Calendar size={14} /> {new Date(patient.date_of_birth).toLocaleDateString()} ({calculateAge(patient.date_of_birth)} yrs)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><HeartPulse size={14} /> {patient.gender || 'Unspecified'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Phone size={14} /> {patient.contact_number || 'No phone'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><MapPin size={14} /> {patient.address ? 'Has Address' : 'No address'}</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '0.5rem' }}>Patient ID: #{patient.patient_id}</div>
            </div>
          </div>

          <div className="patient-action-btns" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => window.open(`/patients/print/${patient.patient_id}`, '_blank')}
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff', border: '1px solid var(--border-color)', color: 'var(--text-dark)' }}>
              <FileText size={16} /> Print Profile
            </button>
            <Link to={`/patients/edit/${patient.patient_id}`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={16} /> Edit Demographics
            </Link>
            {patient.status === 'active' && (
              <button className="btn btn-warning" onClick={() => openConfirmModal('archive')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Archive size={16} /> Archive
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--border-color)', padding: '0 1rem' }}>
        <div className="dashboard-container tabs-nav-container" style={{ margin: '0 auto', maxWidth: '1800px', display: 'flex', flexDirection: 'row', gap: '1.5rem', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '1rem 0.5rem', border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-gray)',
                fontWeight: activeTab === tab.id ? 600 : 500,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-container" style={{ maxWidth: '1800px', padding: '2rem', margin: '0 auto' }}>
        
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* Medical History Summary */}
            <div className="section-panel" style={{ margin: 0 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--primary)" /> General Medical History
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Known Allergies</span>
                  <div style={{ color: patient.allergies ? '#DC2626' : 'var(--text-dark)', fontWeight: patient.allergies ? 600 : 400, marginTop: '0.25rem' }}>
                    {patient.allergies || 'None reported'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Past Medical History</span>
                  <div style={{ color: 'var(--text-dark)', marginTop: '0.25rem' }}>{patient.medical_history || 'None'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Surgical History</span>
                  <div style={{ color: 'var(--text-dark)', marginTop: '0.25rem' }}>{patient.surgical_history || 'None'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Medications</span>
                  <div style={{ color: 'var(--text-dark)', marginTop: '0.25rem' }}>{patient.medications || 'None'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Previous Hospitalization</span>
                  <div style={{ color: 'var(--text-dark)', marginTop: '0.25rem' }}>{patient.previous_hospitalization || 'None'}</div>
                </div>
              </div>
            </div>

            {/* Social & Lifestyle */}
            <div className="section-panel" style={{ margin: 0 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HeartPulse size={18} color="var(--primary)" /> Social & Lifestyle
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Smoking History</span>
                  <div style={{ color: 'var(--text-dark)', marginTop: '0.25rem' }}>{patient.smoking_history || 'None'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alcohol Intake</span>
                  <div style={{ color: 'var(--text-dark)', marginTop: '0.25rem' }}>{patient.alcoholic_intake || 'None'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Occupation</span>
                  <div style={{ color: 'var(--text-dark)', marginTop: '0.25rem' }}>{patient.occupation || 'Not specified'}</div>
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="section-panel" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={18} color="var(--primary)" /> Emergency Contacts
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-gray)', marginBottom: '0.5rem' }}>Primary Emergency Contact</h4>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 500 }}>{patient.emergency_contact_name || 'Not provided'}</p>
                  <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-gray)' }}>{patient.emergency_contact_relationship}</p>
                  <p style={{ margin: '0 0 0.25rem 0' }}>{patient.emergency_contact_phone}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-gray)', marginBottom: '0.5rem' }}>Guardian (If Minor)</h4>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 500 }}>{patient.guardian_name || 'Not provided'}</p>
                  <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-gray)' }}>{patient.guardian_relationship}</p>
                  <p style={{ margin: '0 0 0.25rem 0' }}>{patient.guardian_phone}</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Phase 2: Implemented */}
        {activeTab === 'appointments' && (
          <PatientAppointments patientId={id} />
        )}
        {activeTab === 'vitals' && (
          <PatientVitals patientId={id} />
        )}
        {activeTab === 'records' && (
          <PatientRecords patientId={id} />
        )}
        {activeTab === 'labs' && (
          <PatientLabs patientId={id} />
        )}
        {activeTab === 'prescriptions' && (
          <PatientPrescriptions patientId={id} />
        )}
        {activeTab === 'documents' && (
          <PatientDocuments patientId={id} />
        )}
        {activeTab === 'insurance' && (
          <PatientInsurance patientId={id} />
        )}

      </div>

      <ConfirmModal 
        isOpen={modalOpen} 
        onCancel={() => setModalOpen(false)}
        {...modalConfig}
      />
    </div>
  );
}
