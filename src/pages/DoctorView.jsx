import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Trash2, Archive, Phone, Mail, FileSignature, Calendar, Building2, UserRound } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import '../index.css';

export default function DoctorView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  const fetchDoctor = async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, departments(department_name)')
      .eq('doctor_id', id)
      .single();

    if (error) {
      toast.error('Failed to load doctor details');
      navigate('/doctors');
    } else {
      setDoctor(data);
    }
    setLoading(false);
  };

  const handleArchive = async () => {
    const { error } = await supabase
      .from('doctors')
      .update({ status: 'inactive' })
      .eq('doctor_id', id);

    if (error) {
      toast.error('Failed to archive doctor');
    } else {
      toast.success('Doctor archived successfully');
      fetchDoctor();
    }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('doctor_id', id);

    if (error) {
      toast.error('Failed to delete doctor. They may have active records.');
    } else {
      toast.success('Doctor deleted successfully');
      navigate('/doctors');
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action) => {
    const fullName = `Dr. ${doctor.first_name} ${doctor.last_name}`;
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive Doctor',
        message: `Are you sure you want to archive ${fullName}?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: handleArchive
      });
    } else if (action === 'delete') {
      setModalConfig({
        title: 'Delete Doctor',
        message: `Are you sure you want to permanently delete ${fullName}? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmType: 'danger',
        onConfirm: handleDelete
      });
    }
    setModalOpen(true);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!doctor) return null;

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        
        <div className="section-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/doctors" className="icon-btn" style={{ padding: '0.5rem' }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
              Doctor Profile
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/doctors/edit/${doctor.doctor_id}`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={16} /> Edit
            </Link>
            {doctor.status === 'active' && (
              <button className="btn btn-warning" onClick={() => openConfirmModal('archive')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Archive size={16} /> Archive
              </button>
            )}
            <button className="btn btn-danger" onClick={() => openConfirmModal('delete')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>

        <div className="section-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="icon-primary" style={{ width: '5rem', height: '5rem', padding: '1.25rem', borderRadius: '1rem' }}>
              <UserRound size={40} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                Dr. {doctor.first_name} {doctor.middle_name} {doctor.last_name}
              </h2>
              <p style={{ color: 'var(--text-gray)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                {doctor.specialty || 'General Practitioner'}
              </p>
              <span className={`badge ${doctor.status === 'active' ? 'badge-blue' : ''}`} style={{ backgroundColor: doctor.status === 'active' ? '#DBEAFE' : '#F1F5F9', color: doctor.status === 'active' ? '#1D4ED8' : '#64748B' }}>
                {doctor.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div className="form-label">Department</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-dark)', fontWeight: 500 }}>
                  <div style={{ padding: '0.5rem', backgroundColor: '#F1F5F9', borderRadius: '0.375rem', color: '#64748B' }}><Building2 size={18} /></div>
                  {doctor.departments?.department_name || 'Not Assigned'}
                </div>
              </div>

              <div>
                <div className="form-label">Contact Number</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-dark)', fontWeight: 500 }}>
                  <div style={{ padding: '0.5rem', backgroundColor: '#F1F5F9', borderRadius: '0.375rem', color: '#64748B' }}><Phone size={18} /></div>
                  {doctor.contact_number || 'N/A'}
                </div>
              </div>

              <div>
                <div className="form-label">Email Address</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-dark)', fontWeight: 500 }}>
                  <div style={{ padding: '0.5rem', backgroundColor: '#F1F5F9', borderRadius: '0.375rem', color: '#64748B' }}><Mail size={18} /></div>
                  {doctor.email || 'N/A'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div className="form-label">License Number</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-dark)', fontWeight: 500 }}>
                  <div style={{ padding: '0.5rem', backgroundColor: '#F1F5F9', borderRadius: '0.375rem', color: '#64748B' }}><FileSignature size={18} /></div>
                  {doctor.license_number || 'N/A'}
                </div>
              </div>

              <div>
                <div className="form-label">Doctor ID</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-dark)', fontWeight: 500 }}>
                  <div style={{ padding: '0.5rem', backgroundColor: '#F1F5F9', borderRadius: '0.375rem', color: '#64748B' }}>#</div>
                  {doctor.doctor_id}
                </div>
              </div>
            </div>
            
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <div className="form-label">Schedule & Notes</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--text-dark)', backgroundColor: '#F8FAFC', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', whiteSpace: 'pre-wrap' }}>
                <Calendar size={18} color="#64748B" style={{ marginTop: '0.125rem' }} />
                <span style={{ lineHeight: 1.5 }}>
                  {doctor.schedule || 'No schedule notes provided.'}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

      <ConfirmModal 
        isOpen={modalOpen} 
        onCancel={() => setModalOpen(false)}
        {...modalConfig}
      />
    </div>
  );
}
