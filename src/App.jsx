import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/ToastContext';
import ToastContainer from './components/ui/Toast';
import ConfirmDialog from './components/ui/ConfirmDialog';
import LoginScreen from './components/auth/LoginScreen';
import Dashboard from './views/Dashboard';
import Users from './views/Users';
import Reports from './views/Reports';
import PdfArchive from './views/PdfArchive';
import Firms from './views/Firms';
import Database from './views/Database';
import Logs from './views/Logs';
import Progress from './views/Progress';

const nav = [
  { path: '/', label: '대시보드', icon: '📊' },
  { path: '/users', label: '사용자 관리', icon: '👥' },
  { path: '/reports', label: '리포트 관리', icon: '📄' },
  { path: '/pdf-archive', label: 'PDF 관리', icon: '📑' },
  { path: '/firms', label: '증권사 관리', icon: '🏢' },
  { path: '/database', label: 'DB 뷰어', icon: '🗄️' },
  { path: '/logs', label: '로그 뷰어', icon: '📋' },
  { path: '/progress', label: '진행 현황', icon: '📈' },
];

export default function App() {
  const { token, authState, logout, isInitialized } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mh_theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('mh_sidebar_collapsed') === 'true';
  });

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

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('mh_sidebar_collapsed', String(next));
      return next;
    });
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
    <ToastProvider>
      <div className="app-layout">
        <ToastContainer />
        <ConfirmDialog />
        {/* Mobile header with hamburger */}
        <div className="mobile-header">
        <button className="hamburger" onClick={toggleSidebar} aria-label="Toggle navigation">
          ☰
        </button>
        <span className="mobile-brand" onClick={() => navigate('/')} style={{cursor:'pointer'}}>
          SSH Management Hub
        </span>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-brand" onClick={() => { navigate('/'); closeSidebar(); }} style={{cursor:'pointer'}}>
          {!sidebarCollapsed && 'SSH Management Hub'}
          <button className="sidebar-collapse-btn" onClick={(e) => { e.stopPropagation(); toggleSidebarCollapse(); }} aria-label="Toggle sidebar" title={sidebarCollapsed ? '메뉴 펼치기' : '메뉴 접기'}>
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
        </div>
        <nav>
          {nav.map(n => (
            <NavLink key={n.path} to={n.path} end={n.path === '/'}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              onClick={closeSidebar}
              title={sidebarCollapsed ? n.label : undefined}>
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item sidebar-theme-btn" onClick={toggleTheme} title={sidebarCollapsed ? (theme === 'light' ? '다크 모드' : '라이트 모드') : undefined}>
            <span className="nav-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
            <span className="nav-label">{theme === 'light' ? '다크 모드' : '라이트 모드'}</span>
          </button>
          <button className="btn-logout" onClick={logout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">로그아웃</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/pdf-archive" element={<PdfArchive />} />
          <Route path="/firms" element={<Firms />} />
          <Route path="/database" element={<Database />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
    </ToastProvider>
  );
}
