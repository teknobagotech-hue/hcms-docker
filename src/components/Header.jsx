import { Menu, LogOut, Shield, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useScan } from '../context/ScanContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ toggleSidebar }) {
  const { profile, role } = useAuth();
  const { isScanning, scanProgress } = useScan();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu />
        </button>

        {isScanning && (
          <div 
            onClick={() => navigate('/patients/scan')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, rgba(14,186,113,0.12), rgba(16,185,129,0.18))',
              border: '1px solid rgba(16,185,129,0.35)',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              fontSize: '0.825rem',
              fontWeight: '600',
              color: '#0eba71',
              boxShadow: '0 2px 8px rgba(14,186,113,0.12)',
              transition: 'all 0.2s ease'
            }}
            title="Document Scanning in progress. Click to view."
          >
            <Loader2 className="animate-spin" size={15} />
            <span>Scanning Document... ({scanProgress}%)</span>
          </div>
        )}
      </div>

      <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)' }}>
            {profile?.full_name || 'User'}
          </span>
          <span 
            style={{ 
              fontSize: '0.7rem', 
              fontWeight: 600, 
              color: '#1D4ED8', 
              backgroundColor: '#DBEAFE', 
              padding: '0.15rem 0.5rem', 
              borderRadius: '0.375rem', 
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              alignSelf: 'flex-end',
              marginTop: '0.1rem'
            }}
          >
            <Shield size={10} /> {role}
          </span>
        </div>

        <img 
          src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=150&auto=format&fit=crop" 
          alt="User Avatar" 
          className="avatar" 
        />
        
        <button 
          onClick={handleSignOut} 
          title="Sign Out" 
          style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.5rem', display: 'flex', alignItems: 'center', color: 'var(--text-gray)' }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

