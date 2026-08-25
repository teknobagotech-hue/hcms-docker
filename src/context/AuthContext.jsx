import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({
  session: null,
  user: null,
  profile: null,
  role: 'staff',
  loading: true,
  hasRole: () => false,
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
      }
      if (data) {
        setProfile(data);
      } else {
        // Fallback default profile if not present in DB
        setProfile({ id: userId, role: 'staff', full_name: session?.user?.email || 'User' });
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const role = (profile?.role || 'staff').toLowerCase();

  /**
   * Check if current user has any of the required roles.
   * Admin always passes.
   * @param {string | string[]} allowedRoles
   */
  const hasRole = (allowedRoles) => {
    if (!allowedRoles) return true;
    if (role === 'admin') return true; // Admin has superuser override

    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return rolesArray.map(r => r.toLowerCase()).includes(role);
  };

  const value = {
    session,
    user: session?.user || null,
    profile,
    role,
    loading,
    hasRole,
    refreshProfile: () => session?.user && fetchProfile(session.user.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
