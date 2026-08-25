import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../index.css';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div className="dashboard-scroll-area" style={{ backgroundColor: '#F8FAFC' }}>
      <div 
        className="dashboard-container" 
        style={{ 
          maxWidth: '600px', 
          margin: '4rem auto', 
          textAlign: 'center', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyInContent: 'center',
          gap: '1.5rem'
        }}
      >
        <div className="section-panel" style={{ width: '100%', padding: '3rem 2rem' }}>
          <div 
            style={{ 
              width: '5rem', 
              height: '5rem', 
              borderRadius: '50%', 
              backgroundColor: '#FEF2F2', 
              color: '#EF4444', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}
          >
            <ShieldAlert size={48} />
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
            Access Denied
          </h1>

          <p style={{ color: 'var(--text-gray)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            You do not have permission to view or manage this page with your current role (<strong>{role.toUpperCase()}</strong>).
            If you believe this is an error, please contact a system administrator.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} /> Go Back
            </button>
            <Link 
              to="/" 
              className="btn btn-primary" 
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Home size={16} /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
