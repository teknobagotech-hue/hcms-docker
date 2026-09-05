import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Archive, Calendar, UserCog, ShieldCheck, CheckCircle } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import '../index.css';

export default function UserView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Failed to load user details');
      navigate('/users');
    } else {
      setUser(data);
    }
    setLoading(false);
  };

  const handleArchive = async () => {
    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('user_profiles')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to archive user');
    } else {
      toast.success('User archived successfully');
      fetchUser();
    }
    setModalOpen(false);
  };

  const handleActivate = async () => {
    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('user_profiles')
      .update({ status: 'active' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to activate user');
    } else {
      toast.success('User activated successfully');
      fetchUser();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action) => {
    const name = user.full_name || 'Unnamed User';
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive User',
        message: `Are you sure you want to archive ${name}?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: handleArchive
      });
    } else if (action === 'activate') {
      setModalConfig({
        title: 'Activate User',
        message: `Are you sure you want to activate ${name}?`,
        confirmText: 'Activate',
        confirmType: 'primary',
        onConfirm: handleActivate
      });
    }
    setModalOpen(true);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '600px' }}>
        
        <div className="section-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/users" className="icon-btn" style={{ padding: '0.5rem' }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
              User Profile
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/users/edit/${user.id}`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={16} /> Edit
            </Link>
            {user.status === 'inactive' ? (
              <button className="btn btn-success" onClick={() => openConfirmModal('activate')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#16A34A', color: '#fff' }}>
                <CheckCircle size={16} /> Activate
              </button>
            ) : (
              <button className="btn btn-warning" onClick={() => openConfirmModal('archive')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Archive size={16} /> Archive
              </button>
            )}
          </div>
        </div>

        <div className="section-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="icon-primary" style={{ width: '5rem', height: '5rem', padding: '1.25rem', borderRadius: '1rem' }}>
              <UserCog size={40} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                {user.full_name || 'Unnamed User'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--text-gray)', fontSize: '1.125rem', fontWeight: 500, textTransform: 'capitalize' }}>
                  {(user.role || 'Staff').replace('_', ' ')}
                </span>
                <span className={`badge ${user.status === 'active' || !user.status ? 'badge-blue' : ''}`} style={{ backgroundColor: user.status === 'active' || !user.status ? '#DBEAFE' : '#F1F5F9', color: user.status === 'active' || !user.status ? '#1D4ED8' : '#64748B', textTransform: 'uppercase' }}>
                  {user.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            
            <div style={{ padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <div className="form-label" style={{ marginBottom: '1rem' }}>System Information</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', marginBottom: '0.25rem' }}>User ID (UUID)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-dark)', fontWeight: 500, wordBreak: 'break-all' }}>
                    <ShieldCheck size={18} color="var(--primary)" />
                    {user.id}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', marginBottom: '0.25rem' }}>Created At</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-dark)', fontWeight: 500 }}>
                    <Calendar size={18} color="var(--primary)" />
                    {new Date(user.created_at).toLocaleString()}
                  </div>
                </div>
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
