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

  const { cpu, memory, disk, database, reports, last_activity, system } = metrics;

  return (
    <div>
      <h2 style={{marginBottom:'1rem'}}>System Overview</h2>
      <div className="stats-grid">
        <div className={`stat ${cpu.percent > 80 ? 'red' : 'green'}`}>
          <div className="stat-value">{cpu.percent}%</div>
          <div className="stat-label">CPU ({cpu.cores} cores)</div>
        </div>
        <div className={`stat ${memory.percent > 80 ? 'red' : 'green'}`}>
          <div className="stat-value">{memory.percent}%</div>
          <div className="stat-label">RAM ({memory.used_gb}/{memory.total_gb} GB)</div>
        </div>
        <div className={`stat ${disk.percent > 80 ? 'red' : 'green'}`}>
          <div className="stat-value">{disk.percent}%</div>
          <div className="stat-label">Disk ({disk.used_gb}/{disk.total_gb} GB)</div>
        </div>
        <div className={`stat ${database.status === 'online' ? 'blue' : 'red'}`}>
          <div className="stat-value">{database.status}</div>
          <div className="stat-label">DB ({database.latency_ms}ms)</div>
        </div>
        <div className="stat blue">
          <div className="stat-value">{reports.total.toLocaleString()}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat blue">
          <div className="stat-value">{reports.today_inserts}</div>
          <div className="stat-label">Today</div>
        </div>
        <div className="stat">
          <div className="stat-value" style={{fontSize:'1rem'}}>{system.uptime_days}d</div>
          <div className="stat-label">Uptime</div>
        </div>
      </div>

      <div className="card mt1">
        <h2>Last Activity</h2>
        <div className="flex-row gap1" style={{marginTop:'.5rem'}}>
          <span className="badge badge-blue">{last_activity.last_firm || '-'}</span>
          <span style={{fontSize:'.85rem',color:'var(--text2)'}}>
            {last_activity.last_title || 'No data'} — {last_activity.last_save_time || ''}
          </span>
        </div>
      </div>
    </div>
  );
}
