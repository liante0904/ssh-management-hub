import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginScreen from './components/auth/LoginScreen';
import Dashboard from './views/Dashboard';
import Users from './views/Users';
import Reports from './views/Reports';
import Firms from './views/Firms';
import Database from './views/Database';
import Logs from './views/Logs';

const nav = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/reports', label: 'Reports', icon: '📄' },
  { path: '/firms', label: 'Firms', icon: '🏢' },
  { path: '/database', label: 'Database', icon: '🗄️' },
  { path: '/logs', label: 'Logs', icon: '📋' },
];

export default function App() {
  const { token, authState, logout, isInitialized } = useAuth();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mh_theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mh_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (!isInitialized) return null;

  if (authState !== 'ready') {
    return (
      <Routes>
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      {/* Mobile header with hamburger */}
      <div className="mobile-header">
        <button className="hamburger" onClick={toggleSidebar} aria-label="Toggle navigation">
          ☰
        </button>
        <span className="mobile-brand">SSH Management Hub</span>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">SSH Management Hub</div>
        <nav>
          {nav.map(n => (
            <NavLink key={n.path} to={n.path} end={n.path === '/'}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              onClick={closeSidebar}>
              <span className="nav-icon">{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer" style={{marginTop: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
          <button className="nav-item" onClick={toggleTheme} style={{width: '100%', justifyContent: 'flex-start', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', borderRadius: '6px'}}>
            <span className="nav-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button className="btn-logout" onClick={logout} style={{margin: 0}}>Logout</button>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/firms" element={<Firms />} />
          <Route path="/database" element={<Database />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
