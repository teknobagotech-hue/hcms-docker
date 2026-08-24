import { useState } from 'react';
import { User, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import '../index.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel (Image) */}
      <div className="login-image-section">
        <div className="login-image-overlay"></div>
      </div>

      {/* Right Panel (Form) */}
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h1 className="login-title">Sign in to your account</h1>
          <p className="login-subtitle">Enter your clinical credentials to access the HMS.</p>

          <form onSubmit={handleLogin}>
            {error && (
              <div style={{ backgroundColor: '#FEE2E2', color: '#EF4444', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Clinical ID or Email
              </label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="dr.smith@stjude.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Secure Password
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-options">
              <div className="remember-me">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember my credentials</label>
              </div>
              <a href="#" className="forgot-password">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="submit-btn" disabled={loading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              {loading && <Loader2 className="animate-spin" size={16} />}
              {loading ? 'Signing in...' : 'Secure Sign In'}
            </button>
          </form>

          <div className="divider"></div>

          <div className="info-box">
            <ShieldCheck className="info-icon" />
            <p className="info-text">
              <strong>Authorized Access Only.</strong> By logging in, you agree to comply with HIPAA regulations. All activity is logged and monitored for compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
