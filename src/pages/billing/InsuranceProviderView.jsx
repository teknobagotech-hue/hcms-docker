import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Archive, Shield, User, Phone, Mail, MapPin } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import '../../index.css';

export default function InsuranceProviderView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchProviderDetails();
  }, [id]);

  const fetchProviderDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('insurance_providers')
      .select('*')
      .eq('insurance_provider_id', id)
      .single();

    if (error) {
      toast.error('Failed to load insurance provider details');
      navigate('/billing/insurance');
      return;
    }

    setProvider(data);
    setLoading(false);
  };

  const handleArchive = async () => {
    const { error } = await supabase
      .from('insurance_providers')
      .update({ status: 'inactive' })
      .eq('insurance_provider_id', id);

    if (error) {
      toast.error('Failed to archive provider');
    } else {
      toast.success('Insurance provider archived successfully');
      fetchProviderDetails();
    }
    setModalOpen(false);
  };

  const openConfirmModal = (action) => {
    if (action === 'archive') {
      setModalConfig({
        title: 'Archive Insurance Provider',
        message: `Are you sure you want to archive "${provider.provider_name}"?`,
        confirmText: 'Archive',
        confirmType: 'warning',
        onConfirm: handleArchive
      });
    }
    setModalOpen(true);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading provider details...</div>;
  }

  if (!provider) return null;

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '850px' }}>
        
        {/* Header Panel */}
        <div className="section-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/billing/insurance" className="icon-btn" style={{ padding: '0.5rem' }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 className="section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
              Insurance Provider Details
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/billing/insurance/edit/${provider.insurance_provider_id}`} className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={16} /> Edit
            </Link>
            {provider.status === 'active' && (
              <button className="btn btn-warning" onClick={() => openConfirmModal('archive')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Archive size={16} /> Archive
              </button>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="section-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="icon-primary" style={{ width: '4rem', height: '4rem', padding: '1rem', borderRadius: '1rem', backgroundColor: '#F0FDFA', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                {provider.provider_name}
              </h2>
              <span className={`badge ${provider.status === 'active' ? 'badge-blue' : ''}`} style={{ backgroundColor: provider.status === 'active' ? '#DBEAFE' : '#F1F5F9', color: provider.status === 'active' ? '#1D4ED8' : '#64748B' }}>
                {provider.status ? provider.status.toUpperCase() : 'ACTIVE'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Provider ID</div>
              <p style={{ color: 'var(--text-dark)', fontWeight: 600, marginTop: '0.25rem' }}>#{provider.insurance_provider_id}</p>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Person</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                <User size={16} color="var(--text-gray)" />
                {provider.contact_person || 'Not specified'}
              </div>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Number / Phone</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                <Phone size={16} color="var(--text-gray)" />
                {provider.contact_number || provider.phone || 'Not specified'}
              </div>
            </div>

            <div>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                <Mail size={16} color="var(--text-gray)" />
                {provider.email ? (
                  <a href={`mailto:${provider.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                    {provider.email}
                  </a>
                ) : 'Not specified'}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-dark)', fontWeight: 500, marginTop: '0.25rem' }}>
                <MapPin size={16} color="var(--text-gray)" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span>{provider.address || 'No address provided'}</span>
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
