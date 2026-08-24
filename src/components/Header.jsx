import { Menu, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Header({ toggleSidebar }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="header">
      <button className="menu-toggle" onClick={toggleSidebar}>
        <Menu />
      </button>
      <div className="user-profile">
        <img 
          src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=150&auto=format&fit=crop" 
          alt="User Avatar" 
          className="avatar" 
        />
        <button 
          onClick={handleSignOut} 
          title="Sign Out" 
          style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.75rem', display: 'flex', alignItems: 'center', color: 'var(--text-gray)' }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
