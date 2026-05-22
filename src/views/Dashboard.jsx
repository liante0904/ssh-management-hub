import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const menuItems = [
  { path: '/users', label: '사용자 관리', desc: 'Telegram 사용자 계정 및 권한 관리', icon: '👥', color: '#6366f1' },
  { path: '/reports', label: '리포트 관리', desc: '증권사 리포트 동기화 상태 및 PDF 재처리', icon: '📄', color: '#0ea5e9' },
  { path: '/firms', label: '증권사 관리', desc: '증권사 및 게시판 설정 관리', icon: '🏢', color: '#22c55e' },
  { path: '/database', label: 'DB 뷰어', desc: 'PostgreSQL 데이터베이스 테이블 조회', icon: '🗄️', color: '#f59e0b' },
  { path: '/logs', label: '로그 뷰어', desc: '서버 로그 파일 탐색 및 실시간 조회', icon: '📋', color: '#ef4444' },
  { path: '/progress', label: '진행 현황', desc: '전체 레포지토리 개발 진행 상황', icon: '📈', color: '#8b5cf6' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    api.metrics().then(setMetrics).catch(() => {});
  }, []);

  return (
    <div style={{overflowY: 'auto', maxHeight: 'calc(100vh - 6rem)', paddingRight: '0.5rem'}}>
      <div className="page-header">
        <h2>SSH Management Hub</h2>
        {metrics && (
          <span style={{fontSize: '.85rem', color: 'var(--text2)'}}>
            {metrics.oci2 ? '🟢 프로덕션 연결됨' : '🔴 프로덕션 연결 안됨'}
          </span>
        )}
      </div>

      {/* Quick Stats */}
      {metrics && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '.75rem', marginBottom: '1.5rem'
        }}>
          <div className="stat blue">
            <div className="stat-value">{metrics.cpu.percent}%</div>
            <div className="stat-label">CPU (OCI)</div>
          </div>
          <div className="stat green">
            <div className="stat-value">{metrics.memory.used_gb}GB</div>
            <div className="stat-label">RAM / {metrics.memory.total_gb}GB</div>
          </div>
          <div className="stat green">
            <div className="stat-value">{metrics.reports.today_inserts}</div>
            <div className="stat-label">오늘 수집된 리포트</div>
          </div>
          <div className="stat blue">
            <div className="stat-value">{metrics.reports.total.toLocaleString()}</div>
            <div className="stat-label">누적 리포트</div>
          </div>
        </div>
      )}

      {/* Menu Grid */}
      <h3 style={{fontSize: '1rem', marginBottom: '1rem', color: 'var(--text2)'}}>빠른 메뉴</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '1rem',
      }}>
        {menuItems.map(item => (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            className="menu-card"
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '.75rem',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
              e.currentTarget.style.borderColor = item.color;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = '';
            }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: item.color + '20',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{fontWeight: 700, fontSize: '1rem', marginBottom: '.25rem'}}>
                {item.label}
              </div>
              <div style={{fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.4}}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* OCI2 Production Status */}
      {metrics && (
        <div style={{marginTop: '1.5rem'}}>
          <h3 style={{fontSize: '1rem', marginBottom: '1rem', color: 'var(--text2)'}}>프로덕션 서버 (oci2)</h3>
          {metrics.oci2 ? (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '.75rem'
            }}>
              <div className={`stat ${metrics.oci2.cpu_percent > 80 ? 'red' : 'green'}`}>
                <div className="stat-value">{metrics.oci2.cpu_percent}%</div>
                <div className="stat-label">CPU</div>
              </div>
              <div className={`stat ${metrics.oci2.percent > 80 ? 'red' : 'green'}`}>
                <div className="stat-value">{metrics.oci2.used_gb}GB</div>
                <div className="stat-label">RAM / {metrics.oci2.total_gb}GB</div>
              </div>
              <div className={`stat ${metrics.oci2.disk_percent > 80 ? 'red' : 'green'}`}>
                <div className="stat-value">{metrics.oci2.disk_used_gb}GB</div>
                <div className="stat-label">Disk / {metrics.oci2.disk_total_gb}GB</div>
              </div>
            </div>
          ) : (
            <div className="card" style={{textAlign:'center', padding:'1rem', color:'var(--red)', fontSize:'.9rem'}}>
              ⚠️ 프로덕션 서버 연결 실패 — 백엔드 서버의 SSH 설정을 확인하세요
            </div>
          )}
        </div>
      )}
    </div>
  );
}
