import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/ToastContext';

const STATUS_LABELS = { 0: 'Pending', 2: 'Done', 3: 'Failed', 9: 'Failed', '-1': 'Failed' };
const STATUS_CLASS = { 0: 'badge-yellow', 2: 'badge-green', 3: 'badge-red', 9: 'badge-red', '-1': 'badge-red' };

const ARCHIVE_STATUS_OPTIONS = [
  { value: '', label: '전체 아카이브' },
  { value: 'INIT', label: 'INIT' },
  { value: 'ARCHIVED', label: 'ARCHIVED' },
];

export default function PdfArchive() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [dailyStats, setDailyStats] = useState(null);
  const [firmStats, setFirmStats] = useState(null);
  const [showStats, setShowStats] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [retryMsg, setRetryMsg] = useState('');
  const [reprocessForm, setReprocessForm] = useState({ archive_status: '', limit: 100 });
  const [showReprocess, setShowReprocess] = useState(false);
  const { toast, confirm } = useToast();

  const load = useCallback(() => {
    api.pdfArchive(page, filters).then(setData).catch(e => toast.error(e.message));
  }, [page, filters, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  const loadStats = async () => {
    try {
      const [daily, firm] = await Promise.all([
        api.pdfArchiveStatsDaily(30),
        api.pdfArchiveStatsByFirm(),
      ]);
      setDailyStats(daily);
      setFirmStats(firm);
      setShowStats(true);
    } catch (e) {
      toast.error(e.message);
    }
  };

  // 빠른 실행: 최근일자 기준 100건 재처리
  const quickReprocessRecent100 = async () => {
    const ok = await confirm(
      '최근 등록된 100건의 PDF 아카이브 항목을 재처리하시겠습니까?\n\npdf_sync_status를 0(대기)으로 초기화하여 PDF 다운로드/처리를 다시 트리거합니다.',
      '최근 100건 재처리'
    );
    if (!ok) return;

    setRetrying(true);
    setRetryMsg('최근 100건 재처리 요청 중...');
    try {
      // reg_dt 기준으로 최신 100건 조회
      const res = await api.pdfArchive(1, { sort: 'reg_dt_desc', ...filters });
      const items = res.items || [];
      if (items.length === 0) {
        toast.info('재처리할 항목이 없습니다.');
        setRetrying(false);
        setRetryMsg('');
        return;
      }
      const toRetry = items.slice(0, 100);
      setRetryMsg(`최근 ${toRetry.length}건 재처리 중...`);
      for (let i = 0; i < toRetry.length; i++) {
        try {
          await api.pdfArchiveReprocess({ report_ids: [toRetry[i].report_id], limit: 1 });
          setRetryMsg(`최근 100건: ${i + 1}/${toRetry.length} 완료...`);
        } catch (e) {
          console.error(`Failed to reprocess ${toRetry[i].report_id}:`, e);
        }
      }
      toast.success(`최근 ${toRetry.length}건 재처리 완료`);
      setRetryMsg('');
      load();
    } catch (e) {
      toast.error(e.message);
      setRetryMsg('');
    }
    setRetrying(false);
  };

  const bulkReprocess = async () => {
    if (!reprocessForm.archive_status && !reprocessForm.pdf_sync_status && !reprocessForm.firm_nm) {
      toast.warning('최소 하나의 필터 조건이 필요합니다');
      return;
    }
    const ok = await confirm(
      `필터 조건에 맞는 항목을 재처리하시겠습니까?`,
      '일괄 재처리 확인'
    );
    if (!ok) return;

    setRetrying(true);
    setRetryMsg('재처리 요청 중...');
    try {
      const res = await api.pdfArchiveReprocess({
        archive_status: reprocessForm.archive_status || undefined,
        firm_nm: reprocessForm.firm_nm || undefined,
        pdf_sync_status: reprocessForm.pdf_sync_status !== '' ? Number(reprocessForm.pdf_sync_status) : undefined,
        limit: reprocessForm.limit,
      });
      toast.success(res.message || '재처리 완료');
      setRetryMsg(res.message);
      load();
    } catch (e) {
      toast.error(e.message);
      setRetryMsg('');
    }
    setRetrying(false);
  };

  const retrySingle = async (reportId) => {
    const ok = await confirm(`Report #${reportId} 재처리 하시겠습니까?`, '개별 재처리');
    if (!ok) return;
    try {
      const res = await api.pdfArchiveReprocess({ report_ids: [reportId], limit: 1 });
      toast.success(res.message || '재처리 완료');
      setRetryMsg(res.message);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    loadStats();
  }, []);

  const totalAll = data?.summary?.total ?? data?.total ?? 0;
  const totalArchived = data?.summary?.archived ?? 0;
  const totalAllFailed = data?.summary?.failed ?? 0;

  return (
    <div>
      <div className="page-header">
        <h2>PDF 아카이브 관리</h2>
        <div className="flex-row gap1">
          <button onClick={loadStats} style={{fontSize: '.9rem',padding:'.5rem .85rem'}}>
            📊 {showStats ? '통계 새로고침' : '통계 보기'}
          </button>
          <button className="primary" onClick={quickReprocessRecent100} disabled={retrying}
            style={{fontSize: '.9rem',padding:'.5rem .85rem'}}>
            ⚡ 최근 100건 재처리
          </button>
          <button onClick={() => setShowReprocess(!showReprocess)} style={{fontSize: '.9rem',padding:'.5rem .85rem'}}>
            🔄 일괄 재처리
          </button>
        </div>
      </div>

      {/* Quick Summary */}
      {data && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '.5rem', marginBottom: '.75rem',
        }}>
          <div className="card" style={{padding:'.5rem .75rem', textAlign:'center'}}>
            <div style={{fontSize:'1.1rem', fontWeight:700, color:'var(--accent)'}}>{totalAll.toLocaleString()}</div>
            <div style={{fontSize:'.65rem', color:'var(--text2)'}}>전체 PDF</div>
          </div>
          <div className="card" style={{padding:'.5rem .75rem', textAlign:'center'}}>
            <div style={{fontSize:'1.1rem', fontWeight:700, color:'var(--green)'}}>{totalArchived.toLocaleString()}</div>
            <div style={{fontSize:'.65rem', color:'var(--text2)'}}>아카이브 완료</div>
          </div>
          <div className="card" style={{padding:'.5rem .75rem', textAlign:'center'}}>
            <div style={{fontSize:'1.1rem', fontWeight:700, color: totalAllFailed > 0 ? 'var(--red)' : 'var(--text2)'}}>{totalAllFailed.toLocaleString()}</div>
            <div style={{fontSize:'.65rem', color:'var(--text2)'}}>미완료/실패</div>
          </div>
          <div className="card" style={{padding:'.5rem .75rem', textAlign:'center'}}>
            <div style={{fontSize:'1.1rem', fontWeight:700, color:'var(--text2)'}}>
              {totalAll > 0 ? `${Math.round((totalArchived / totalAll) * 100)}%` : '-'}
            </div>
            <div style={{fontSize:'.65rem', color:'var(--text2)'}}>완료율</div>
          </div>
        </div>
      )}

      {retryMsg && (
        <div className="card" style={{padding: '.75rem 1rem', marginBottom: '1rem', borderLeft: '4px solid var(--accent)', fontSize: '.85rem'}}>
          {retryMsg}
        </div>
      )}

      {/* Reprocess Panel */}
      {showReprocess && (
        <div className="card mb1" style={{padding: '1rem'}}>
          <h4 style={{marginBottom: '.75rem'}}>PDF 일괄 재처리</h4>
          <p style={{fontSize: '.8rem', color: 'var(--text2)', marginBottom: '.75rem'}}>
            필터 조건에 맞는 건들의 pdf_sync_status를 0(대기)으로 초기화하여 PDF 다운로드/처리를 다시 트리거합니다.
          </p>
          <div className="flex-row gap1" style={{flexWrap: 'wrap', alignItems: 'flex-end'}}>
            <div>
              <label style={{fontSize:'.75rem',display:'block',marginBottom:'.25rem'}}>아카이브 상태</label>
              <select value={reprocessForm.archive_status}
                onChange={e => setReprocessForm(f => ({ ...f, archive_status: e.target.value }))}>
                <option value="">전체</option>
                <option value="INIT">INIT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:'.75rem',display:'block',marginBottom:'.25rem'}}>PDF Sync</label>
              <select value={reprocessForm.pdf_sync_status}
                onChange={e => setReprocessForm(f => ({ ...f, pdf_sync_status: e.target.value }))}>
                <option value="">전체</option>
                <option value="0">대기</option>
                <option value="9">실패</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:'.75rem',display:'block',marginBottom:'.25rem'}}>증권사명</label>
              <input placeholder="증권사명..." value={reprocessForm.firm_nm || ''}
                onChange={e => setReprocessForm(f => ({ ...f, firm_nm: e.target.value }))}
                style={{width:'140px'}} />
            </div>
            <div>
              <label style={{fontSize:'.75rem',display:'block',marginBottom:'.25rem'}}>최대 건수</label>
              <select value={reprocessForm.limit}
                onChange={e => setReprocessForm(f => ({ ...f, limit: Number(e.target.value) }))}>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={300}>300</option>
                <option value={500}>500</option>
              </select>
            </div>
            <button className="primary" onClick={bulkReprocess} disabled={retrying}
              style={{padding:'.4rem .85rem', fontSize:'.85rem'}}>
              {retrying ? '처리 중...' : '재처리 실행'}
            </button>
          </div>
        </div>
      )}

      {/* Stats Panel */}
      {showStats && (
        <div className="mb1" style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
          {dailyStats && (
            <div className="card" style={{padding: '1rem'}}>
              <h4 style={{marginBottom: '.75rem'}}>일별 아카이브 통계 (최근 30일)</h4>
              <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                <table style={{fontSize: '.8rem'}}>
                  <thead>
                    <tr>
                      <th>날짜</th>
                      <th>전체</th>
                      <th>완료</th>
                      <th>미완료</th>
                      <th>완료율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStats.map(d => (
                      <tr key={d.date}>
                        <td>{d.date}</td>
                        <td>{d.total}</td>
                        <td><span className="badge badge-green">{d.archived}</span></td>
                        <td><span className="badge badge-red">{d.failed}</span></td>
                        <td>{d.total > 0 ? `${((d.archived / d.total) * 100).toFixed(0)}%` : '-'}</td>
                      </tr>
                    ))}
                    {dailyStats.length === 0 && (
                      <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text2)'}}>데이터 없음</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {firmStats && (
            <div className="card" style={{padding: '1rem'}}>
              <h4 style={{marginBottom: '.75rem'}}>증권사별 아카이브 통계</h4>
              <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                <table style={{fontSize: '.8rem'}}>
                  <thead>
                    <tr>
                      <th>증권사</th>
                      <th>전체</th>
                      <th>완료</th>
                      <th>미완료</th>
                      <th>완료율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firmStats.map(f => (
                      <tr key={f.firm_nm}>
                        <td style={{fontWeight:500}}>{f.firm_nm}</td>
                        <td>{f.total}</td>
                        <td><span className="badge badge-green">{f.archived}</span></td>
                        <td><span className="badge badge-red">{f.failed}</span></td>
                        <td>{f.total > 0 ? `${((f.archived / f.total) * 100).toFixed(0)}%` : '-'}</td>
                      </tr>
                    ))}
                    {firmStats.length === 0 && (
                      <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text2)'}}>데이터 없음</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex-row gap1 mb1" style={{flexWrap: 'wrap'}}>
        <input placeholder="증권사명..." value={filters.firm_nm || ''}
          onChange={e => updateFilter('firm_nm', e.target.value)} style={{minWidth: '140px'}} />
        <select value={filters.archive_status || ''}
          onChange={e => updateFilter('archive_status', e.target.value || undefined)}>
          {ARCHIVE_STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input placeholder="날짜 YYYYMMDD..." value={filters.reg_dt || ''}
          onChange={e => updateFilter('reg_dt', e.target.value)} style={{width: '150px'}} />
        <select value={filters.pdf_sync_status ?? ''}
          onChange={e => updateFilter('pdf_sync_status', e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">전체 PDF Sync</option>
          <option value="0">대기</option>
          <option value="2">완료</option>
          <option value="3">실패(3)</option>
          <option value="9">실패(9)</option>
        </select>
        <select value={filters.download_status_yn || ''}
          onChange={e => updateFilter('download_status_yn', e.target.value || undefined)}>
          <option value="">전체 다운로드</option>
          <option value="Y">Y</option>
          <option value="N">N</option>
        </select>
        <input placeholder="제목 검색..." value={filters.search || ''}
          onChange={e => updateFilter('search', e.target.value)} style={{minWidth: '180px'}} />
      </div>

      {data && (
        <>
          <div className="flex-between mb1" style={{fontSize: '.8rem', color: 'var(--text2)'}}>
            <span>총 {data.total.toLocaleString()}건</span>
            <span>Page {page} of {Math.max(1, Math.ceil(data.total / data.page_size))}</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>증권사</th>
                  <th style={{minWidth: '180px'}}>제목</th>
                  <th>날짜</th>
                  <th>파일명</th>
                  <th>크기</th>
                  <th>페이지</th>
                  <th>아카이브</th>
                  <th>저장소</th>
                  <th>PDF Sync</th>
                  <th>재시도</th>
                  <th>텍스트</th>
                  <th style={{minWidth: '100px'}}>작업</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(r => (
                  <tr key={r.report_id} className={r.archive_status !== 'ARCHIVED' && (r.pdf_sync_status === 9 || r.pdf_sync_status === 3) ? 'row-warning' : ''}>
                    <td style={{fontWeight:500,fontSize:'.8rem',color:'var(--text2)'}}>#{r.report_id}</td>
                    <td style={{fontWeight:500}}>{r.firm_nm || '-'}</td>
                    <td style={{maxWidth:'300px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                      title={r.title}>
                      {r.title || '-'}
                    </td>
                    <td style={{whiteSpace:'nowrap'}}>{r.reg_dt || '-'}</td>
                    <td style={{maxWidth:'150px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:'.75rem'}}
                      title={r.file_name}>
                      {r.file_name || '-'}
                    </td>
                    <td style={{whiteSpace:'nowrap',fontSize:'.8rem'}}>{formatFileSize(r.file_size)}</td>
                    <td style={{textAlign:'center'}}>{r.page_count || '-'}</td>
                    <td>
                      <span className={`badge ${r.archive_status === 'ARCHIVED' ? 'badge-green' : 'badge-yellow'}`}>
                        {r.archive_status || 'INIT'}
                      </span>
                    </td>
                    <td style={{fontSize:'.75rem'}}>{r.storage_backend || '-'}</td>
                    <td><span className={`badge ${STATUS_CLASS[r.pdf_sync_status] || 'badge-yellow'}`}>{STATUS_LABELS[r.pdf_sync_status] || r.pdf_sync_status}</span></td>
                    <td style={{textAlign:'center'}}>
                      {(r.retry_count || 0) > 0 ? (
                        <span className="badge badge-yellow">{r.retry_count}</span>
                      ) : '0'}
                    </td>
                    <td>
                      {r.has_text ? <span className="badge badge-green">Y</span> : <span className="badge badge-yellow">N</span>}
                      {r.is_encrypted && <span className="badge badge-red" style={{marginLeft:'.2rem'}}>🔒</span>}
                    </td>
                    <td>
                      <div className="flex-row" style={{gap:'.3rem'}}>
                        {r.archive_status !== 'ARCHIVED' && (
                          <button className="primary" style={{fontSize:'.7rem',padding:'.2rem .4rem'}}
                            onClick={() => retrySingle(r.report_id)} title="재처리">
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.items.length === 0 && (
            <div className="card" style={{textAlign:'center',padding:'3rem',color:'var(--text2)'}}>
              No PDF archives found matching the current filters.
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
