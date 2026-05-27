import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../components/ui/ToastContext';

const menuItems = [
  { path: '/users', label: '사용자 관리', desc: 'Telegram 사용자 계정 및 권한', icon: '👥', color: '#6366f1' },
  { path: '/reports', label: '리포트 관리', desc: '증권사 리포트 동기화 및 PDF 재처리', icon: '📄', color: '#0ea5e9' },
  { path: '/pdf-archive', label: 'PDF 관리', desc: 'PDF 아카이브 현황, 통계, 재처리', icon: '📑', color: '#8b5cf6' },
  { path: '/firms', label: '증권사 관리', desc: '증권사 및 게시판 설정', icon: '🏢', color: '#22c55e' },
  { path: '/database', label: 'DB 뷰어', desc: 'PostgreSQL 테이블 조회', icon: '🗄️', color: '#f59e0b' },
  { path: '/logs', label: '로그 뷰어', desc: '서버 로그 탐색 및 실시간 조회', icon: '📋', color: '#ef4444' },
  { path: '/progress', label: '진행 현황', desc: '전체 개발 진행 상황', icon: '📈', color: '#06b6d4' },
];

/* ── 진행 막대 컴포넌트 ── */
function ProgressBar({ percent, color }) {
  const warn = percent > 80;
  const pct = Math.min(Math.max(percent, 0), 100);
  return (
    <div style={{
      height: '6px', background: 'var(--bg3)', borderRadius: '3px',
      marginTop: '.25rem', overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: warn ? 'var(--red)' : color,
        borderRadius: '3px', transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

/* ── 서버 상태 카드 (재설계: 세로 레이아웃 + 진행 막대) ── */
function ServerCard({ name, label, data, color }) {
  if (!data) {
    return (
      <div className="card" style={{padding: '1.1rem 1.2rem', textAlign: 'center', opacity: 0.7}}>
        <div style={{fontSize:'.9rem', fontWeight:600, marginBottom:'.4rem'}}>{label}</div>
        <div style={{fontSize:'.85rem', color:'var(--red)'}}>🔴 연결 안됨</div>
      </div>
    );
  }

  const cpuWarn = data.cpu_percent > 80;
  const ramWarn = data.percent > 80;
  const diskWarn = (data.disk_percent || 0) > 80;

  return (
    <div className="card" style={{padding: '1rem 1.2rem'}}>
      <div style={{
        fontSize:'.92rem', fontWeight:700, marginBottom:'.65rem',
        display:'flex', alignItems:'center', gap:'.45rem',
      }}>
        <span style={{
          display:'inline-block', width:9, height:9, borderRadius:'50%',
          background: color, flexShrink:0,
        }} />
        {label}
      </div>

      <div style={{display:'flex', flexDirection:'column', gap:'.55rem'}}>
        {/* CPU */}
        <div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'.82rem', marginBottom:'.12rem'}}>
            <span style={{color: cpuWarn ? 'var(--red)' : 'var(--text2)'}}>CPU</span>
            <span style={{fontWeight:700, color: cpuWarn ? 'var(--red)' : 'var(--text)'}}>
              {data.cpu_percent}%
            </span>
          </div>
          <ProgressBar percent={data.cpu_percent} color={color} />
        </div>

        {/* RAM */}
        <div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'.82rem', marginBottom:'.12rem'}}>
            <span style={{color: ramWarn ? 'var(--red)' : 'var(--text2)'}}>메모리</span>
            <span style={{fontWeight:700, color: ramWarn ? 'var(--red)' : 'var(--text)'}}>
              {data.used_gb}G / {data.total_gb}G
            </span>
          </div>
          <ProgressBar percent={data.percent} color={color} />
        </div>

        {/* Disk */}
        <div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'.82rem', marginBottom:'.12rem'}}>
            <span style={{color: diskWarn ? 'var(--red)' : 'var(--text2)'}}>디스크</span>
            <span style={{fontWeight:700, color: diskWarn ? 'var(--red)' : 'var(--text)'}}>
              {data.disk_used_gb || '-'}G / {data.disk_total_gb || '-'}G
            </span>
          </div>
          <ProgressBar percent={data.disk_percent || 0} color={color} />
        </div>
      </div>
    </div>
  );
}

/* ── 통계 카드 (시스템 / 리포트 공통) ── */
function StatCard({ label, value, sub, color, percent, dbStatus, simple }) {
  const warn = percent !== undefined && percent > 80;
  const valueColor = dbStatus === 'offline'
    ? 'var(--red)'
    : (warn ? 'var(--red)' : (color || 'var(--text)'));

  return (
    <div className="card" style={{padding: '.9rem 1.1rem'}}>
      <div style={{fontSize:'.8rem', color:'var(--text2)', marginBottom:'.25rem', fontWeight:500}}>
        {label}
      </div>
      <div style={{
        fontSize:'1.4rem', fontWeight:800, color: valueColor,
        letterSpacing: '-0.02em', lineHeight: 1.2,
      }}>
        {value}
      </div>
      <div style={{fontSize:'.78rem', color:'var(--text2)', marginTop:'.15rem'}}>
        {sub}
      </div>
      {!simple && percent !== undefined && (
        <ProgressBar percent={percent} color={warn ? 'var(--red)' : (color || 'var(--accent)')} />
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    api.metrics()
      .then(setMetrics)
      .catch(() => toast.warning('서버 메트릭을 불러올 수 없습니다.', 3000));
  }, []);

  return (
    <div style={{overflowY: 'auto', maxHeight: 'calc(100vh - 6rem)', paddingRight: '0.5rem'}}>

      {/* ── Header ── */}
      <div className="page-header" style={{marginBottom: '1rem'}}>
        <h2>SSH Management Hub</h2>
        {metrics && (
          <div style={{display:'flex', gap:'.85rem', fontSize:'.85rem', flexWrap:'wrap'}}>
            <span style={{color: metrics.oci ? 'var(--green)' : 'var(--red)', fontWeight:500}}>
              {metrics.oci ? '🟢 OCI 배포' : '🔴 OCI'}
            </span>
            <span style={{color: metrics.oci2 ? 'var(--green)' : 'var(--red)', fontWeight:500}}>
              {metrics.oci2 ? '🟢 OCI2 프로덕션' : '🔴 OCI2'}
            </span>
          </div>
        )}
      </div>

      {/* ── 빠른 메뉴 ── */}
      <h3 style={{fontSize: '1rem', fontWeight:700, marginBottom: '.6rem', color: 'var(--text2)'}}>
        빠른 메뉴
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: '.6rem',
        marginBottom: '1.25rem',
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
              padding: '.8rem .95rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '.65rem',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = item.color;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = '';
            }}
          >
            <span style={{fontSize:'1.5rem', flexShrink:0}}>{item.icon}</span>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:600, fontSize:'.9rem', lineHeight:1.35, marginBottom:'.15rem'}}>{item.label}</div>
              <div style={{
                fontSize:'.78rem', color:'var(--text2)',
                lineHeight:1.45, wordBreak:'keep-all',
              }}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 서버 상태 ── */}
      {metrics && (
        <div style={{marginBottom: '1.25rem'}}>
          <h3 style={{fontSize: '1rem', fontWeight:700, marginBottom: '.6rem', color: 'var(--text2)'}}>
            서버 상태
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '.6rem',
          }}>
            <ServerCard name="oci" label="OCI 배포서버" data={metrics.oci} color="var(--accent)" />
            <ServerCard name="oci2" label="OCI2 프로덕션" data={metrics.oci2} color="var(--green)" />
          </div>
        </div>
      )}

      {/* ── 시스템 현황 ── */}
      {metrics && (
        <div style={{marginBottom: '1.25rem'}}>
          <h3 style={{fontSize: '1rem', fontWeight:700, marginBottom: '.6rem', color: 'var(--text2)'}}>
            시스템 현황
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '.6rem',
          }}>
            <StatCard
              label="CPU" value={`${metrics.cpu.percent}%`}
              sub={`${metrics.cpu.cores}코어`} color="var(--accent)"
              percent={metrics.cpu.percent}
            />
            <StatCard
              label="메모리" value={`${metrics.memory.used_gb}G`}
              sub={`/ ${metrics.memory.total_gb}G`} color="var(--green)"
              percent={metrics.memory.percent}
            />
            <StatCard
              label="디스크" value={`${metrics.disk.used_gb}G`}
              sub={`/ ${metrics.disk.total_gb}G`} color="#0ea5e9"
              percent={metrics.disk.percent}
            />
            <StatCard
              label="데이터베이스"
              value={metrics.database.status === 'online' ? '정상' : 'OFF'}
              sub={`응답 ${metrics.database.latency_ms}ms`}
              color={metrics.database.status === 'online' ? 'var(--green)' : 'var(--red)'}
              dbStatus={metrics.database.status}
            />
          </div>
        </div>
      )}

      {/* ── 리포트 현황 ── */}
      {metrics && (
        <div style={{marginBottom: '1rem'}}>
          <h3 style={{fontSize: '1rem', fontWeight:700, marginBottom: '.6rem', color: 'var(--text2)'}}>
            리포트 현황
          </h3>

          {/* 오늘 수집 / 누적 리포트 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '.6rem',
            marginBottom: metrics.last_activity?.last_title ? '.6rem' : 0,
          }}>
            <StatCard
              label="오늘 수집" value={metrics.reports.today_inserts.toLocaleString()}
              sub="건" color="#f59e0b" simple
            />
            <StatCard
              label="누적 리포트" value={metrics.reports.total.toLocaleString()}
              sub="건" color="var(--text2)" simple
            />
          </div>

          {/* 최근 수집 리포트 */}
          {metrics.last_activity?.last_title && (
            <div className="card" style={{padding: '.8rem 1.1rem'}}>
              <div style={{fontSize:'.78rem', color:'var(--text2)', marginBottom:'.2rem'}}>
                📌 최근 수집
              </div>
              <div style={{fontWeight:600, fontSize:'.88rem', lineHeight:1.4}}>
                <b>{metrics.last_activity.last_firm}</b> — {metrics.last_activity.last_title}
              </div>
              <div style={{fontSize:'.75rem', color:'var(--text2)', marginTop:'.2rem'}}>
                {metrics.last_activity.last_save_time}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
