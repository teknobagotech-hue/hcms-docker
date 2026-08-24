import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Trash2, Archive, MapPin, Calendar, Activity } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import '../index.css';

export default function DepartmentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchDepartment();
  }, [id]);

  const fetchDepartment = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('department_id', id)
      .single();

    if (error) {
      toast.error('Failed to load department details');
      navigate('/departments');
    } else {
      setDepartment(data);
    }
    setLoading(false);
  };

  const handleArchive = async () => {
    const { error } = await supabase
      .from('departments')
      .update({ status: 'inactive' })
      .eq('department_id', id);

    if (error) {
      toast.error('Failed to archive department');
    } else {
      toast.success('Department archived successfully');
      fetchDepartment();
    }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('department_id', id);

    if (error) {
      toast.error('Failed to delete department. It may be in use.');
    } else {
      toast.success('Department deleted successfully');
      navigate('/departments');
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action) => {
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive Department',
        message: `Are you sure you want to archive "${department.department_name}"?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: handleArchive
      });
    } else if (action === 'delete') {
      setModalConfig({
        title: 'Delete Department',
        message: `Are you sure you want to permanently delete "${department.department_name}"? This action cannot be undone.`,
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

  if (!department) return null;

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        
        <div className="section-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/departments" className="icon-btn" style={{ padding: '0.5rem' }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
              Department Details
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/departments/edit/${department.department_id}`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={16} /> Edit
            </Link>
            {department.status === 'active' && (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="icon-primary" style={{ width: '4rem', height: '4rem', padding: '1rem' }}>
              <Activity size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                {department.department_name}
              </h2>
              <span className={`badge ${department.status === 'active' ? 'badge-blue' : ''}`} style={{ backgroundColor: department.status === 'active' ? '#DBEAFE' : '#F1F5F9', color: department.status === 'active' ? '#1D4ED8' : '#64748B' }}>
                {department.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div className="form-label">Department ID</div>
              <p style={{ color: 'var(--text-dark)', fontWeight: 500 }}>{department.department_id}</p>
            </div>
            
            <div>
              <div className="form-label">Location</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500 }}>
                <MapPin size={16} color="var(--text-gray)" />
                {department.location || 'Not specified'}
              </div>
            </div>

            <div>
              <div className="form-label">Created At</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500 }}>
                <Calendar size={16} color="var(--text-gray)" />
                {new Date(department.created_at).toLocaleDateString()}
              </div>
            </div>

            <div>
              <div className="form-label">Last Updated</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500 }}>
                <Calendar size={16} color="var(--text-gray)" />
                {new Date(department.updated_at).toLocaleDateString()}
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
