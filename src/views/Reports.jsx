import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/ToastContext';

const SYNC_LABELS = { 0: 'Pending', 1: 'Processing', 2: 'Done', '-1': 'Failed' };
const SYNC_CLASS = { 0: 'badge-yellow', 1: 'badge-blue', 2: 'badge-green', '-1': 'badge-red' };

export default function Reports() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [retrying, setRetrying] = useState(false);
  const [retryMsg, setRetryMsg] = useState('');
  const [firmOptions, setFirmOptions] = useState([]);
  const [showReprocessFirm, setShowReprocessFirm] = useState(false);
  const { toast, confirm } = useToast();

  const load = useCallback(() => {
    api.reports(page, filters)
      .then(d => setData(d))
      .catch(e => toast.error(e.message));
  }, [page, filters, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Load firm list for dropdown when no firm filter is active
  useEffect(() => {
    if (!filters.firm_nm) {
      api.firms().then(f => setFirmOptions(f || [])).catch(() => {});
    }
  }, [filters.firm_nm]);

  const updateFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  const reset = async (id) => {
    const ok = await confirm('이 리포트를 pending 상태로 초기화하시겠습니까?', '리포트 초기화');
    if (!ok) return;
    api.updateReportSync(id, 0, 0)
      .then(() => {
        toast.success('리포트가 초기화되었습니다.');
        load();
      })
      .catch(e => toast.error(e.message));
  };

  const retryPdf = async (id) => {
    const ok = await confirm('이 리포트의 PDF 처리를 재시도하시겠습니까?', 'PDF 재처리');
    if (!ok) return;
    api.updateReportSync(id, 0, 0)
      .then(() => {
        toast.success('PDF 재처리가 요청되었습니다.');
        load();
      })
      .catch(e => toast.error(e.message));
  };

  // 개별회사 스크랩 재처리: 현재 필터에 걸린 회사의 모든 리포트 재처리
  const reprocessCompany = async () => {
    if (!filters.firm_nm) {
      toast.warning('먼저 증권사명을 입력/선택해주세요.');
      return;
    }
    const company = filters.firm_nm;
    const ok = await confirm(
      `'${company}' 증권사의 모든 리포트를 재처리하시겠습니까?\n\n현재 필터링된 리포트들의 sync_status를 0(대기)으로 초기화합니다.`,
      '개별회사 스크랩 재처리'
    );
    if (!ok) return;

    setRetrying(true);
    setRetryMsg(`${company} 재처리 중...`);
    try {
      // Fetch all reports for this firm (up to 200)
      const res = await api.reports(1, { ...filters, firm_nm: company });
      const reports = res.reports || [];
      if (reports.length === 0) {
        toast.info(`${company}에 해당하는 리포트가 없습니다.`);
        setRetrying(false);
        setRetryMsg('');
        return;
      }
      const toRetry = reports.slice(0, 200);
      setRetryMsg(`${company}: ${toRetry.length}건 재처리 중...`);
      for (let i = 0; i < toRetry.length; i++) {
        try {
          await api.updateReportSync(toRetry[i].report_id, 0, 0);
          setRetryMsg(`${company}: ${i + 1}/${toRetry.length} 완료...`);
        } catch (e) {
          console.error(`Failed to retry report ${toRetry[i].report_id}:`, e);
        }
      }
      toast.success(`${company}: ${toRetry.length}건 재처리 완료`);
      setRetryMsg('');
      load();
    } catch (e) {
      toast.error(e.message);
      setRetryMsg('');
    }
    setRetrying(false);
  };

  const bulkRetryFailed = async () => {
    setRetrying(true);
    setRetryMsg('Fetching failed PDF reports...');
    try {
      const res = await api.reports(1, { sync_status: -1 });
      const failed = res.reports || [];
      if (failed.length === 0) {
        toast.info('실패한 PDF 리포트가 없습니다.');
        setRetrying(false);
        setRetryMsg('');
        return;
      }
      const toRetry = failed.slice(0, 50);
      const ok = await confirm(
        `${toRetry.length}건의 실패한 PDF 리포트를 재처리하시겠습니까?`,
        '실패 PDF 일괄 재처리'
      );
      if (!ok) {
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
      toast.success(`${toRetry.length}건 재처리 완료`);
      setRetryMsg('');
      load();
    } catch (e) {
      toast.error(e.message);
      setRetryMsg('');
    }
    setRetrying(false);
  };

  const totalFailed = data?.reports?.filter(r => r.sync_status === -1 || r.pdf_sync_status === -1).length || 0;

  return (
    <div>
      <div className="page-header">
        <h2>리포트 관리</h2>
        <div className="flex-row gap1">
          {totalFailed > 0 && (
            <span className="badge badge-red" style={{fontSize: '.85rem', padding: '.4rem .7rem'}}>
              ⚠️ {totalFailed}건 실패
            </span>
          )}
          <button className="primary" onClick={bulkRetryFailed} disabled={retrying} style={{fontSize: '.9rem',padding:'.5rem .85rem'}}>
            🔄 {retrying ? '재처리 중...' : '실패 PDF 일괄 재처리'}
          </button>
          <button
            onClick={() => setShowReprocessFirm(!showReprocessFirm)}
            style={{fontSize: '.9rem',padding:'.5rem .85rem'}}
            title="특정 증권사의 모든 리포트 재처리"
          >
            🏢 개별회사 재처리
          </button>
        </div>
      </div>

      {retryMsg && (
        <div className="card" style={{padding: '.75rem 1rem', marginBottom: '1rem', borderLeft: '4px solid var(--accent)', fontSize: '.85rem'}}>
          {retryMsg}
        </div>
      )}

      {/* 개별회사 재처리 패널 */}
      {showReprocessFirm && (
        <div className="card mb1" style={{padding: '1rem'}}>
          <h4 style={{marginBottom: '.5rem'}}>개별회사 스크랩 재처리</h4>
          <p style={{fontSize: '.8rem', color: 'var(--text2)', marginBottom: '.75rem'}}>
            선택한 증권사의 모든 리포트(최대 200건)의 sync_status를 0(대기)으로 초기화합니다.
          </p>
          <div className="flex-row gap1" style={{flexWrap: 'wrap', alignItems: 'flex-end'}}>
            <div style={{flex: 1, minWidth: '200px'}}>
              <label style={{fontSize:'.75rem',display:'block',marginBottom:'.25rem'}}>증권사 선택</label>
              {firmOptions.length > 0 ? (
                <select
                  value={filters.firm_nm || ''}
                  onChange={e => updateFilter('firm_nm', e.target.value || undefined)}
                  style={{width: '100%'}}
                >
                  <option value="">증권사 선택...</option>
                  {firmOptions.map(f => (
                    <option key={f.sec_firm_order} value={f.firm_nm}>{f.firm_nm}</option>
                  ))}
                </select>
              ) : (
                <input
                  placeholder="증권사명 직접 입력..."
                  value={filters.firm_nm || ''}
                  onChange={e => updateFilter('firm_nm', e.target.value)}
                  style={{width: '100%'}}
                />
              )}
            </div>
            <button
              className="primary"
              onClick={reprocessCompany}
              disabled={retrying || !filters.firm_nm}
              style={{padding:'.45rem .85rem', fontSize:'.85rem'}}
            >
              {retrying ? '처리 중...' : '재처리 실행'}
            </button>
          </div>
        </div>
      )}

      <div className="flex-row gap1 mb1" style={{flexWrap: 'wrap'}}>
        <input placeholder="증권사명..." value={filters.firm_nm || ''} onChange={e => updateFilter('firm_nm', e.target.value)} style={{minWidth: '160px'}} />
        <input placeholder="날짜 YYYYMMDD..." value={filters.reg_dt || ''} onChange={e => updateFilter('reg_dt', e.target.value)} style={{width: '150px'}} />
        <select value={filters.sync_status ?? ''} onChange={e => updateFilter('sync_status', e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">전체 동기화</option>
          <option value="0">대기</option>
          <option value="1">처리중</option>
          <option value="2">완료</option>
          <option value="-1">실패</option>
        </select>
        <input placeholder="제목 검색..." value={filters.search || ''} onChange={e => updateFilter('search', e.target.value)} style={{minWidth: '180px'}} />
        <select value={filters.pdf_failed ?? ''} onChange={e => updateFilter('pdf_failed', e.target.value || undefined)}>
          <option value="">전체 PDF</option>
          <option value="1">PDF 실패만</option>
        </select>
      </div>

      {data && (
        <>
          <div className="flex-between mb1" style={{fontSize: '.8rem', color: 'var(--text2)'}}>
            <span>총 {data.total.toLocaleString()}건</span>
            <span>Page {page} of {Math.ceil(data.total / data.page_size)}</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>증권사</th>
                  <th style={{minWidth: '200px'}}>제목</th>
                  <th>날짜</th>
                  <th>다운로드</th>
                  <th>동기화</th>
                  <th>PDF</th>
                  <th>요약</th>
                  <th style={{minWidth: '140px'}}>작업</th>
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
