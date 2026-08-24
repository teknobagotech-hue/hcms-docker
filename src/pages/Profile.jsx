import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Save, ShieldCheck } from 'lucide-react';
import '../index.css';

export default function Profile() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setEmail(session.user.email);
        fetchProfile(session.user.id);
      }
    });
  }, []);

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error(error);
    } else if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!session?.user) return;
    setSaving(true);

    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: fullName })
      .eq('id', session.user.id);

    if (error) {
      toast.error('Failed to update profile name');
    } else {
      toast.success('Profile name updated');
    }
    setSaving(false);
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    if (!session?.user) return;
    setSaving(true);

    const updates = {};
    if (email !== session.user.email) updates.email = email;
    if (password) updates.password = password;

    if (Object.keys(updates).length === 0) {
      setSaving(false);
      return toast('No changes to save', { icon: 'ℹ️' });
    }

    const { error } = await supabase.auth.updateUser(updates);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Credentials updated successfully');
      if (updates.email) {
        toast('Please check your email for a confirmation link.', { icon: '📧' });
      }
      setPassword(''); // Clear password field after update
    }
    setSaving(false);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;
  }

  return (
    <div className="dashboard-scroll-area">
      <div className="dashboard-container" style={{ maxWidth: '600px' }}>
        
        <div className="section-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <h1 className="section-title" style={{ margin: 0, fontSize: '1.5rem' }}>
            My Profile
          </h1>
        </div>

        <div className="section-panel" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="icon-primary" style={{ width: '4rem', height: '4rem', padding: '1rem', borderRadius: '50%' }}>
              <User size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                {profile?.full_name || session?.user?.email}
              </h2>
              <span className="badge badge-blue" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={14} /> {profile?.role || 'User'}
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ paddingLeft: '1rem' }} 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={16} /> Save Profile Name
              </button>
            </div>
          </form>
        </div>

        <div className="section-panel">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '1.5rem' }}>
            Login Credentials
          </h3>

          <form onSubmit={handleUpdateCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input 
                  type="email" 
                  className="form-input" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">New Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="Leave blank to keep current password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-gray)', marginTop: '0.5rem' }}>
                Must be at least 6 characters long. You will be logged out of other devices if you change this.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-warning" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={16} /> Update Credentials
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
