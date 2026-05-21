import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const SYNC_LABELS = { 0: 'Pending', 1: 'Processing', 2: 'Done', '-1': 'Failed' };
const SYNC_CLASS = { 0: 'badge-yellow', 1: 'badge-blue', 2: 'badge-green', '-1': 'badge-red' };

export default function Reports() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [err, setErr] = useState('');

  const load = () => {
    setErr('');
    api.reports(page, filters).then(setData).catch(e => setErr(e.message));
  };

  useEffect(load, [page, filters]);

  const updateFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  const reset = (id) => {
    api.updateReportSync(id, 0, 0).then(load).catch(e => setErr(e.message));
  };

  return (
    <div>
      <h2 style={{marginBottom:'1rem'}}>Reports</h2>
      <div className="flex-between mb1">
        <div className="flex-row">
          <input placeholder="Firm..." value={filters.firm_nm || ''} onChange={e => updateFilter('firm_nm', e.target.value)} />
          <input placeholder="Date YYYYMMDD..." value={filters.reg_dt || ''} onChange={e => updateFilter('reg_dt', e.target.value)} style={{width:'130px'}} />
          <select value={filters.sync_status ?? ''} onChange={e => updateFilter('sync_status', e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">All sync</option>
            <option value="0">Pending</option>
            <option value="1">Processing</option>
            <option value="2">Done</option>
            <option value="-1">Failed</option>
          </select>
          <input placeholder="Title..." value={filters.search || ''} onChange={e => updateFilter('search', e.target.value)} />
        </div>
        {data && <span style={{color:'var(--text2)',fontSize:'.85rem'}}>Total: {data.total.toLocaleString()}</span>}
      </div>

      {err && <p style={{color:'var(--red)',marginBottom:'.5rem'}}>{err}</p>}

      {data && (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Firm</th><th>Title</th><th>Date</th><th>Download</th><th>Sync</th><th>PDF</th><th>Summary</th><th>Actions</th></tr></thead>
              <tbody>
                {data.reports.map(r => (
                  <tr key={r.report_id}>
                    <td>{r.report_id}</td>
                    <td>{r.firm_nm}</td>
                    <td style={{maxWidth:'300px',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {r.article_url ? <a href={r.article_url} target="_blank" style={{color:'var(--accent)'}}>{r.article_title}</a> : r.article_title}
                    </td>
                    <td>{r.reg_dt}</td>
                    <td><span className={`badge ${r.download_status_yn === 'Y' ? 'badge-green' : 'badge-yellow'}`}>{r.download_status_yn || 'N'}</span></td>
                    <td><span className={`badge ${SYNC_CLASS[r.sync_status] || ''}`}>{SYNC_LABELS[r.sync_status] || r.sync_status}</span></td>
                    <td><span className={`badge ${SYNC_CLASS[r.pdf_sync_status] || ''}`}>{SYNC_LABELS[r.pdf_sync_status] || r.pdf_sync_status}</span></td>
                    <td>{r.gemini_summary ? <span className="badge badge-green">Yes</span> : <span className="badge badge-yellow">No</span>}</td>
                    <td>
                      <button style={{fontSize:'.7rem',padding:'.15rem .4rem'}} onClick={() => reset(r.report_id)}>Reset</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            {Array.from({length: Math.min(Math.ceil(data.total / data.page_size), 20)}, (_, i) => (
              <button key={i+1} className={page === i+1 ? 'active' : ''} onClick={() => setPage(i+1)}>{i+1}</button>
            ))}
            {Math.ceil(data.total / data.page_size) > 20 && <span>...</span>}
          </div>
        </>
      )}
    </div>
  );
}
