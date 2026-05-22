import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const SYNC_LABELS = { 0: 'Pending', 1: 'Processing', 2: 'Done', '-1': 'Failed' };
const SYNC_CLASS = { 0: 'badge-yellow', 1: 'badge-blue', 2: 'badge-green', '-1': 'badge-red' };

export default function Reports() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [err, setErr] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [retryMsg, setRetryMsg] = useState('');

  const load = () => {
    setErr('');
    api.reports(page, filters).then(setData).catch(e => setErr(e.message));
  };

  useEffect(load, [page, filters]);

  const updateFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  const reset = (id) => {
    if (!window.confirm('Reset this report to pending state?')) return;
    api.updateReportSync(id, 0, 0).then(load).catch(e => setErr(e.message));
  };

  const retryPdf = (id) => {
    api.updateReportSync(id, 0, 0).then(load).catch(e => setErr(e.message));
  };

  const bulkRetryFailed = async () => {
    // Fetch all failed PDFs from page 1 (up to 50 items)
    setRetrying(true);
    setRetryMsg('Fetching failed PDF reports...');
    try {
      const res = await api.reports(1, { sync_status: -1 });
      const failed = res.reports || [];
      if (failed.length === 0) {
        setRetryMsg('No failed PDF reports found.');
        setRetrying(false);
        return;
      }
      const toRetry = failed.slice(0, 50);
      if (!window.confirm(`Found ${toRetry.length} failed PDF reports. Reset all to pending for reprocessing?`)) {
        setRetrying(false);
        setRetryMsg('');
        return;
      }
      setRetryMsg(`Retrying ${toRetry.length} reports...`);
      for (let i = 0; i < toRetry.length; i++) {
        try {
          await api.updateReportSync(toRetry[i].report_id, 0, 0);
          setRetryMsg(`Retried ${i + 1}/${toRetry.length}...`);
        } catch (e) {
          console.error(`Failed to retry report ${toRetry[i].report_id}:`, e);
        }
      }
      setRetryMsg(`Completed! ${toRetry.length} reports reset to pending.`);
      load();
    } catch (e) {
      setErr(e.message);
      setRetryMsg('');
    }
    setRetrying(false);
  };

  // Calculate failed counts
  const totalFailed = data?.reports?.filter(r => r.sync_status === -1 || r.pdf_sync_status === -1).length || 0;
  const pdfFailed = data?.reports?.filter(r => r.pdf_sync_status === -1).length || 0;

  return (
    <div>
      <div className="page-header">
        <h2>Reports</h2>
        <div className="flex-row gap1">
          {totalFailed > 0 && (
            <span className="badge badge-red" style={{fontSize: '.8rem', padding: '.35rem .65rem'}}>
              ⚠️ {totalFailed} failed
            </span>
          )}
          <button className="primary" onClick={bulkRetryFailed} disabled={retrying} style={{fontSize: '.8rem'}}>
            🔄 {retrying ? 'Retrying...' : 'Bulk Retry Failed PDFs'}
          </button>
        </div>
      </div>

      {retryMsg && (
        <div className="card" style={{padding: '.75rem 1rem', marginBottom: '1rem', borderLeft: '4px solid var(--accent)', fontSize: '.85rem'}}>
          {retryMsg}
        </div>
      )}

      <div className="flex-row gap1 mb1" style={{flexWrap: 'wrap'}}>
        <input placeholder="Firm name..." value={filters.firm_nm || ''} onChange={e => updateFilter('firm_nm', e.target.value)} style={{minWidth: '160px'}} />
        <input placeholder="Date YYYYMMDD..." value={filters.reg_dt || ''} onChange={e => updateFilter('reg_dt', e.target.value)} style={{width: '140px'}} />
        <select value={filters.sync_status ?? ''} onChange={e => updateFilter('sync_status', e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">All sync status</option>
          <option value="0">Pending</option>
          <option value="1">Processing</option>
          <option value="2">Done</option>
          <option value="-1">Failed</option>
        </select>
        <input placeholder="Title search..." value={filters.search || ''} onChange={e => updateFilter('search', e.target.value)} style={{minWidth: '180px'}} />
        <select value={filters.pdf_failed ?? ''} onChange={e => updateFilter('pdf_failed', e.target.value || undefined)}>
          <option value="">All PDF status</option>
          <option value="1">PDF Failed Only</option>
        </select>
      </div>

      {err && <p style={{color:'var(--red)',marginBottom:'.5rem'}}>{err}</p>}

      {data && (
        <>
          <div className="flex-between mb1" style={{fontSize: '.8rem', color: 'var(--text2)'}}>
            <span>Total: {data.total.toLocaleString()} reports</span>
            <span>Page {page} of {Math.ceil(data.total / data.page_size)}</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Firm</th>
                  <th style={{minWidth: '200px'}}>Title</th>
                  <th>Date</th>
                  <th>Download</th>
                  <th>Sync</th>
                  <th>PDF</th>
                  <th>Summary</th>
                  <th style={{minWidth: '140px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.reports.map(r => (
                  <tr key={r.report_id} className={r.pdf_sync_status === -1 ? 'row-warning' : ''}>
                    <td style={{fontWeight:500,fontSize:'.8rem',color:'var(--text2)'}}>#{r.report_id}</td>
                    <td style={{fontWeight:500}}>{r.firm_nm}</td>
                    <td style={{maxWidth:'350px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {r.article_url ? (
                        <a href={r.article_url} target="_blank" rel="noopener noreferrer" style={{color:'var(--accent)'}} title={r.article_title}>
                          {r.article_title}
                        </a>
                      ) : (
                        <span title={r.article_title}>{r.article_title}</span>
                      )}
                    </td>
                    <td style={{whiteSpace:'nowrap'}}>{r.reg_dt}</td>
                    <td><span className={`badge ${r.download_status_yn === 'Y' ? 'badge-green' : 'badge-yellow'}`}>{r.download_status_yn || 'N'}</span></td>
                    <td><span className={`badge ${SYNC_CLASS[r.sync_status] || ''}`}>{SYNC_LABELS[r.sync_status] || r.sync_status}</span></td>
                    <td><span className={`badge ${SYNC_CLASS[r.pdf_sync_status] || ''}`}>{SYNC_LABELS[r.pdf_sync_status] || r.pdf_sync_status}</span></td>
                    <td>{r.gemini_summary ? <span className="badge badge-green">Yes</span> : <span className="badge badge-yellow">No</span>}</td>
                    <td>
                      <div className="flex-row" style={{gap:'.3rem'}}>
                        <button style={{fontSize:'.7rem',padding:'.2rem .4rem'}} onClick={() => reset(r.report_id)} title="Reset to pending">Reset</button>
                        {r.pdf_sync_status === -1 && (
                          <button className="primary" style={{fontSize:'.7rem',padding:'.2rem .4rem'}} 
                            onClick={() => retryPdf(r.report_id)} title="Retry PDF processing">Retry PDF</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.reports.length === 0 && (
            <div className="card" style={{textAlign:'center',padding:'3rem',color:'var(--text2)'}}>
              No reports found matching the current filters.
            </div>
          )}

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
