import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.metrics().then(setMetrics).catch(e => setErr(e.message));
  }, []);

  if (err) return <div className="card"><p style={{color:'var(--red)'}}>{err}</p></div>;
  if (!metrics) return <div className="card"><p>Loading...</p></div>;

  const { cpu, memory, disk, database, reports, last_activity, system, oci2 } = metrics;

  return (
    <div style={{overflowY: 'auto', maxHeight: 'calc(100vh - 8rem)', paddingRight: '0.5rem'}}>
      <div className="flex-between mb1">
        <h2 style={{margin: 0}}>System Dashboard</h2>
        <span style={{fontSize: '.8rem', color: 'var(--text2)'}}>Last sync: {new Date().toLocaleTimeString()}</span>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem'}}>
        {/* Local: OCI Management Hub */}
        <section>
          <h3 style={{color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <span>🏠</span> Management Hub (OCI Local)
          </h3>
          <div className="stats-grid" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
            <div className={`stat ${cpu.percent > 80 ? 'red' : 'green'}`}>
              <div className="stat-value">{cpu.percent}%</div>
              <div className="stat-label">CPU ({cpu.cores} cores)</div>
            </div>
            <div className={`stat ${memory.percent > 80 ? 'red' : 'green'}`}>
              <div className="stat-value">{memory.used_gb}/{memory.total_gb} GB</div>
              <div className="stat-label">RAM ({memory.percent}%)</div>
            </div>
            <div className={`stat ${disk.percent > 80 ? 'red' : 'green'}`}>
              <div className="stat-value">{disk.used_gb}/{disk.total_gb} GB</div>
              <div className="stat-label">Disk ({disk.percent}%)</div>
            </div>
            <div className={`stat ${database.status === 'online' ? 'blue' : 'red'}`}>
              <div className="stat-value">{database.status}</div>
              <div className="stat-label">Main DB ({database.latency_ms}ms)</div>
            </div>
          </div>
        </section>

        {/* Remote: Production Server (oci2) */}
        <section>
          <h3 style={{color: 'var(--accent2)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <span>🚀</span> Production Server (oci2)
          </h3>
          {oci2 ? (
            <div className="stats-grid" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
              <div className={`stat ${oci2.cpu_percent > 80 ? 'red' : 'green'}`}>
                <div className="stat-value">{oci2.cpu_percent}%</div>
                <div className="stat-label">CPU Usage</div>
              </div>
              <div className={`stat ${oci2.percent > 80 ? 'red' : 'green'}`}>
                <div className="stat-value">{oci2.used_gb}/{oci2.total_gb} GB</div>
                <div className="stat-label">RAM ({oci2.percent}%)</div>
              </div>
              <div className={`stat ${oci2.disk_percent > 80 ? 'red' : 'green'}`}>
                <div className="stat-value">{oci2.disk_used_gb}/{oci2.disk_total_gb} GB</div>
                <div className="stat-label">Disk ({oci2.disk_percent}%)</div>
              </div>
              <div className="stat blue">
                <div className="stat-value">Connected</div>
                <div className="stat-label">SSH via ~/.ssh/config</div>
              </div>
            </div>
          ) : (
            <div className="card" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '215px', border: '1px dashed var(--red)', backgroundColor: 'rgba(248, 113, 113, 0.05)'}}>
              <div style={{textAlign: 'center'}}>
                <p style={{fontSize: '2rem', marginBottom: '0.5rem'}}>⚠️</p>
                <p style={{fontWeight: 'bold', color: 'var(--red)'}}>Connection Failed</p>
                <p style={{fontSize: '.8rem', color: 'var(--text2)', marginTop: '0.5rem'}}>Check SSH config for 'oci2'</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem'}}>
        <div className="card">
          <h2>Latest Activity</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
            <div className="flex-between">
              <span className="badge badge-blue">{last_activity.last_firm || '-'}</span>
              <span style={{fontSize:'.85rem',color:'var(--text2)'}}>{last_activity.last_save_time}</span>
            </div>
            <div style={{fontSize: '.95rem', fontWeight: 500}}>{last_activity.last_title || 'No recent articles'}</div>
          </div>
        </div>

        <div className="card">
          <h2>Report Statistics</h2>
          <div className="flex-row gap1">
            <div style={{flex: 1, textAlign: 'center', padding: '1rem', background: 'var(--bg3)', borderRadius: '8px'}}>
              <div style={{fontSize: '1.5rem', fontWeight: 700}}>{reports.total.toLocaleString()}</div>
              <div style={{fontSize: '.75rem', color: 'var(--text2)'}}>Cumulative Total</div>
            </div>
            <div style={{flex: 1, textAlign: 'center', padding: '1rem', background: 'var(--bg3)', borderRadius: '8px'}}>
              <div style={{fontSize: '1.5rem', fontWeight: 700}}>{reports.today_inserts}</div>
              <div style={{fontSize: '.75rem', color: 'var(--text2)'}}>Today's New</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
