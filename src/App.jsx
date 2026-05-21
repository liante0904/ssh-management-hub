import { useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { isLoggedIn, clearToken } from './lib/api';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Users from './views/Users';
import Reports from './views/Reports';
import Firms from './views/Firms';
import Logs from './views/Logs';

const nav = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/reports', label: 'Reports', icon: '📄' },
  { path: '/firms', label: 'Firms', icon: '🏢' },
  { path: '/logs', label: 'Logs', icon: '📋' },
];

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const navigate = useNavigate();

  const logout = () => { clearToken(); setLoggedIn(false); navigate('/login'); };

  if (!loggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setLoggedIn(true)} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">SSH Management Hub</div>
        <nav>
          {nav.map(n => (
            <NavLink key={n.path} to={n.path} end={n.path === '/'}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <span className="nav-icon">{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/firms" element={<Firms />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
