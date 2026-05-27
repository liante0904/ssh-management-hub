import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/ToastContext';

export default function Database() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState(null);
  const [allRows, setAllRows] = useState([]); // cumulative rows for "load more"
  const [loading, setLoading] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('table');
  const [tableFilter, setTableFilter] = useState('all'); // 'all' | 'tbl' | 'tbm'
  const [orderBy, setOrderBy] = useState(''); // column name for ORDER BY
  const [orderDir, setOrderDir] = useState('ASC'); // 'ASC' | 'DESC'
  const [loadOffset, setLoadOffset] = useState(0); // for "load more"
  const [cellModal, setCellModal] = useState(null); // { column, value } for full-value popup
  const [error, setError] = useState(''); // table query error state

  // SQL query state
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM tbl_sec_reports LIMIT 10');
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlErr, setSqlErr] = useState('');
  const { toast, prompt } = useToast();

  useEffect(() => {
    api.dbTables()
      .then(d => setTables(d.tables || []))
      .catch(e => toast.error(e.message));
  }, []);

  // Filter tables by prefix (tables are now {name, comment} objects)
  const tableFilterFn = (t) => {
    const n = t.name || t;
    if (tableFilter === 'tbl') return n.toLowerCase().startsWith('tbl_');
    if (tableFilter === 'tbm') return n.toLowerCase().startsWith('tbm_');
    return true;
  };

  const filtered = tables
    .filter(t => (t.name || t).toLowerCase().includes(search.toLowerCase()))
    .filter(tableFilterFn);

  // Edit comment handler
  const editComment = async (tableName, currentComment, columnName) => {
    const target = columnName ? `컬럼 ${columnName}` : `테이블 ${tableName}`;
    const newComment = prompt(`${target} 코멘트:`, currentComment || '');
    if (newComment === null) return; // cancelled
    try {
      await api.dbComment(tableName, newComment, columnName);
      toast.success(`${target} 코멘트가 업데이트되었습니다.`);
      // Refresh table data to show updated comments
      if (selectedTable === tableName) {
        viewTable(tableName);
      }
      // Refresh table list to show updated table comment
      if (!columnName) {
        api.dbTables().then(d => setTables(d.tables || [])).catch(() => {});
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const viewTable = (name) => {
    setSelectedTable(name);
    setLoading(true);
    setError('');
    setAllRows([]);
    setLoadOffset(0);
    setMode('table');
    const params = { limit: 50, offset: 0 };
    if (orderBy) {
      params.order_by = orderBy;
      params.order_dir = orderDir;
    }
    api.dbQuery(name, params)
      .then(d => {
        setTableData(d);
        setAllRows(d.data);
        setError('');
      })
      .catch(e => {
        setError(e.message);
        setTableData(null);
      })
      .finally(() => setLoading(false));
  };

  // Load 50 more rows
  const loadMore = () => {
    if (!selectedTable || loading) return;
    const newOffset = loadOffset + 50;
    setLoading(true);
    const params = { limit: 50, offset: newOffset };
    if (orderBy) {
      params.order_by = orderBy;
      params.order_dir = orderDir;
    }
    api.dbQuery(selectedTable, params)
      .then(d => {
        setAllRows(prev => [...prev, ...d.data]);
        setLoadOffset(newOffset);
        setTableData(prev => prev ? { ...prev, data: [...prev.data, ...d.data] } : d);
      })
      .catch(e => {
        setError(e.message);
      })
      .finally(() => setLoading(false));
  };

  // Toggle ORDER BY for a column
  const toggleOrderBy = (col) => {
    if (orderBy === col) {
      // Toggle direction
      const newDir = orderDir === 'ASC' ? 'DESC' : 'ASC';
      setOrderDir(newDir);
      // Reload with new order
      if (selectedTable) {
        setAllRows([]);
        setLoadOffset(0);
        setError('');
        setLoading(true);
        api.dbQuery(selectedTable, { limit: 50, offset: 0, order_by: col, order_dir: newDir })
          .then(d => {
            setTableData(d);
            setAllRows(d.data);
            setError('');
          })
          .catch(e => {
            setError(e.message);
            setTableData(null);
          })
          .finally(() => setLoading(false));
      }
    } else {
      setOrderBy(col);
      setOrderDir('ASC');
      if (selectedTable) {
        setAllRows([]);
        setLoadOffset(0);
        setError('');
        setLoading(true);
        api.dbQuery(selectedTable, { limit: 50, offset: 0, order_by: col, order_dir: 'ASC' })
          .then(d => {
            setTableData(d);
            setAllRows(d.data);
            setError('');
          })
          .catch(e => {
            setError(e.message);
            setTableData(null);
          })
          .finally(() => setLoading(false));
      }
    }
  };

  const runQuery = () => {
    if (!sqlQuery.trim()) return;
    setSqlErr('');
    setLoading(true);
    api.dbSqlQuery(sqlQuery)
      .then(setSqlResult)
      .catch(e => setSqlErr(e.message))
      .finally(() => setLoading(false));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      runQuery();
    }
  };

  // Count tables by prefix
  const tblCount = tables.filter(t => (t.name || t).toLowerCase().startsWith('tbl_')).length;
  const tbmCount = tables.filter(t => (t.name || t).toLowerCase().startsWith('tbm_')).length;

  // Check if there might be more rows to load
  const hasMore = tableData && allRows.length >= 50 && allRows.length === (loadOffset + 50);

  return (
    <div style={{height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column'}}>
      <div className="page-header" style={{marginBottom: '.5rem'}}>
        <h2>DB 뷰어</h2>
        <div className="flex-row" style={{gap:'.4rem'}}>
          <button onClick={() => setMode('table')} className={mode === 'table' ? 'primary' : ''}
            style={{fontSize:'.78rem', padding:'.35rem .65rem'}}>
            📊 테이블
          </button>
          <button onClick={() => setMode('query')} className={mode === 'query' ? 'primary' : ''}
            style={{fontSize:'.78rem', padding:'.35rem .65rem'}}>
            ⚡ 쿼리
          </button>
          {selectedTable && mode === 'table' && (
            <span style={{fontSize:'.75rem', color:'var(--text2)', marginLeft:'.5rem'}}>
              {selectedTable} · {allRows.length} rows
            </span>
          )}
        </div>
      </div>

      {/* ── TABLE MODE ── */}
      {mode === 'table' && (
        <div style={{display:'flex', gap:0, flex:1, overflow:'hidden', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg2)'}}>

          {/* Left: Table List */}
          <div style={{
            width: leftOpen ? 320 : 0,
            minWidth: leftOpen ? 240 : 0,
            overflow: 'hidden',
            transition: 'width 0.2s ease, min-width 0.2s ease',
            borderRight: leftOpen ? '1px solid var(--border)' : 'none',
            display: 'flex', flexDirection: 'column',
          }}>
            {leftOpen && (
              <>
                <div style={{padding:'.5rem .7rem', borderBottom:'1px solid var(--border)'}}>
                  <input
                    placeholder="테이블 검색..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{width:'100%', fontSize:'.8rem', padding:'.4rem .6rem'}}
                  />
                </div>
                {/* Filter Buttons: tbl_ / tbm_ / 전체 */}
                <div style={{
                  display: 'flex', gap: '.25rem', padding: '.35rem .7rem',
                  borderBottom: '1px solid var(--border)', fontSize: '.72rem',
                }}>
                  <button
                    onClick={() => setTableFilter('all')}
                    className={tableFilter === 'all' ? 'primary' : ''}
                    style={{flex: 1, fontSize: '.7rem', padding: '.25rem .4rem'}}
                  >
                    전체 ({tables.length})
                  </button>
                  <button
                    onClick={() => setTableFilter('tbl')}
                    className={tableFilter === 'tbl' ? 'primary' : ''}
                    style={{flex: 1, fontSize: '.7rem', padding: '.25rem .4rem'}}
                    title="tbl_ 레코드성 테이블"
                  >
                    📋 tbl_ ({tblCount})
                  </button>
                  <button
                    onClick={() => setTableFilter('tbm')}
                    className={tableFilter === 'tbm' ? 'primary' : ''}
                    style={{flex: 1, fontSize: '.7rem', padding: '.25rem .4rem'}}
                    title="tbm_ 마스터성 테이블"
                  >
                    🗂️ tbm_ ({tbmCount})
                  </button>
                </div>
                <div style={{flex:1, overflowY:'auto', overflowX:'hidden'}}>
                  <div style={{fontSize:'.82rem'}}>
                    {filtered.map(t => {
                      const tName = t.name || t;
                      const tComment = t.comment || '';
                      const isSelected = selectedTable === tName;
                      return (
                      <div key={tName}
                        style={{
                          cursor:'pointer',
                          padding:'.35rem .7rem',
                          display:'flex',
                          flexDirection:'column',
                          borderBottom:'1px solid var(--border)',
                          background: isSelected ? 'rgba(49,130,246,0.08)' : 'transparent',
                          borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                          overflow:'hidden',
                        }}
                        onClick={() => viewTable(tName)}
                        title={tComment || tName}
                      >
                        <div style={{display:'flex', alignItems:'center', gap:'.4rem'}}>
                          <span style={{flexShrink:0, fontSize:'.85rem'}}>
                            {tName.toLowerCase().startsWith('tbl_') ? '📋' : tName.toLowerCase().startsWith('tbm_') ? '🗂️' : '📊'}
                          </span>
                          <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500}}>{tName}</span>
                          <span
                            onClick={(e) => { e.stopPropagation(); editComment(tName, tComment); }}
                            title="코멘트 수정"
                            style={{flexShrink:0, cursor:'pointer', fontSize:'.7rem', opacity:0.5, padding:'2px'}}
                          >✏️</span>
                        </div>
                        {tComment && (
                          <div style={{fontSize:'.65rem', color:'var(--text2)', paddingLeft:'1.6rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                            {tComment}
                          </div>
                        )}
                      </div>
                      );
                    })}
                    {filtered.length === 0 && (
                      <div style={{textAlign:'center', color:'var(--text2)', padding:'1.5rem', fontSize:'.8rem'}}>
                        {search ? '검색 결과 없음' : '테이블 없음'}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setLeftOpen(o => !o)}
            title={leftOpen ? '목록 접기' : '목록 펼치기'}
            style={{
              flexShrink:0, width:24, border:'none', background:'var(--bg3)',
              cursor:'pointer', color:'var(--text2)', fontSize:'.65rem',
              padding:0, borderRadius:0,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg3)'}
          >{leftOpen ? '◀' : '▶'}</button>

          <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0}}>
            {selectedTable ? (
              <>
                <div style={{padding:'.4rem .8rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'.78rem', background:'var(--bg3)', flexShrink:0, flexWrap:'wrap', gap:'.3rem'}}>
                  <span style={{fontWeight:600}}>Table: {selectedTable}</span>
                  <div className="flex-row" style={{gap:'.4rem', fontSize:'.7rem'}}>
                    {tableData && <span style={{color:'var(--text2)'}}>{tableData.columns.length} cols · {allRows.length} rows</span>}
                    {orderBy && (
                      <span style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        padding: '.1rem .4rem',
                        borderRadius: '4px',
                        fontSize: '.68rem',
                        fontWeight: 600,
                      }}>
                        ORDER BY {orderBy} {orderDir}
                      </span>
                    )}
                    {orderBy && (
                      <button
                        onClick={() => { setOrderBy(''); setOrderDir('ASC'); viewTable(selectedTable); }}
                        style={{fontSize:'.65rem', padding:'.1rem .35rem'}}
                        title="정렬 초기화"
                      >
                        ✕ 정렬해제
                      </button>
                    )}
                  </div>
                </div>
                <div style={{flex:1, overflow:'auto'}}>
                  {loading && allRows.length === 0 ? (
                    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text2)', fontSize:'.85rem'}}>Loading...</div>
                  ) : error && !tableData ? (
                    <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:'2rem', gap:'.75rem'}}>
                      <div style={{fontSize:'1.5rem'}}>❌</div>
                      <div style={{fontWeight:600, color:'var(--red)', fontSize:'.9rem'}}>데이터를 불러올 수 없습니다</div>
                      <div style={{color:'var(--text2)', fontSize:'.78rem', textAlign:'center', maxWidth:'400px', wordBreak:'break-all'}}>{error}</div>
                      <button className="primary" onClick={() => viewTable(selectedTable)} style={{fontSize:'.8rem',padding:'.4rem 1rem'}}>
                        🔄 다시 시도
                      </button>
                    </div>
                  ) : tableData ? (
                    <>
                      <table style={{fontSize:'.78rem', tableLayout: 'auto', minWidth: '100%'}}>
                        <thead>
                          <tr>
                            <th style={{width:40, textAlign:'center', color:'var(--text2)', position:'sticky', left:0, zIndex:2, background:'var(--bg3)'}}>#</th>
                            {tableData.columns.map(c => {
                              const colComment = tableData.column_comments?.[c] || '';
                              return (
                              <th
                                key={c}
                                style={{
                                  minWidth: 120,
                                  maxWidth: 400,
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  position: 'relative',
                                  background: orderBy === c ? 'rgba(49,130,246,0.1)' : 'var(--bg3)',
                                  color: orderBy === c ? 'var(--accent)' : 'var(--text2)',
                                }}
                                onClick={() => toggleOrderBy(c)}
                                title={colComment ? `${colComment}\n클릭: ORDER BY ${c}` : `클릭: ORDER BY ${c} ${orderBy === c && orderDir === 'ASC' ? 'DESC' : 'ASC'}`}
                              >
                                <div style={{display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'.1rem'}}>
                                  <span style={{display:'flex', alignItems:'center', gap:'.25rem'}}>
                                    {c}
                                    {orderBy === c && (
                                      <span style={{fontSize:'.65rem'}}>{orderDir === 'ASC' ? '↑' : '↓'}</span>
                                    )}
                                  </span>
                                  {colComment && (
                                    <span style={{fontSize:'.58rem', fontWeight:400, color:'var(--text2)', whiteSpace:'normal', lineHeight:1.3}}>
                                      {colComment}
                                    </span>
                                  )}
                                </div>
                                <span
                                  onClick={(e) => { e.stopPropagation(); editComment(selectedTable, colComment, c); }}
                                  title="컬럼 코멘트 수정"
                                  style={{position:'absolute', top:2, right:4, cursor:'pointer', fontSize:'.6rem', opacity:0.4, padding:'1px'}}
                                >✏️</span>
                              </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {allRows.map((row, i) => (
                            <tr key={i}>
                              <td style={{textAlign:'center', color:'var(--text2)', fontSize:'.7rem', position:'sticky', left:0, background:'var(--bg2)', zIndex:1}}>{i + 1}</td>
                              {tableData.columns.map(col => {
                                const raw = row[col];
                                const strVal = raw === null ? 'NULL' : raw === '' ? '(empty)' : String(raw);
                                const isLong = strVal.length > 50;
                                return (
                                  <td
                                    key={col}
                                    style={{
                                      minWidth: 120,
                                      maxWidth: 400,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: isLong ? 'nowrap' : 'normal',
                                      wordBreak: isLong ? undefined : 'break-word',
                                      cursor: isLong ? 'pointer' : 'default',
                                      color: raw === null ? 'var(--text2)' : 'var(--text)',
                                      fontStyle: raw === null ? 'italic' : 'normal',
                                    }}
                                    title={isLong ? strVal : undefined}
                                    onClick={() => {
                                      if (isLong || raw === null) {
                                        setCellModal({ column: col, value: strVal, rowIndex: i + 1 });
                                      }
                                    }}
                                  >
                                    {raw === null
                                      ? <span style={{color:'var(--text2)', fontStyle:'italic'}}>NULL</span>
                                      : raw === ''
                                        ? <span style={{color:'var(--text2)'}}>—</span>
                                        : isLong
                                          ? <span>{strVal.slice(0, 50)}... <span style={{color:'var(--accent)', fontSize:'.65rem'}}>[더보기]</span></span>
                                          : strVal
                                    }
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Load More Button */}
                      {hasMore && (
                        <div style={{textAlign:'center', padding:'1rem'}}>
                          <button
                            onClick={loadMore}
                            disabled={loading}
                            style={{fontSize:'.82rem', padding:'.5rem 1.5rem'}}
                          >
                            {loading ? '로딩 중...' : `50건 더 보기 (현재 ${allRows.length}건)`}
                          </button>
                        </div>
                      )}

                      {/* Loaded all indicator */}
                      {!hasMore && allRows.length >= 50 && (
                        <div style={{textAlign:'center', padding:'.75rem', color:'var(--text2)', fontSize:'.75rem'}}>
                          총 {allRows.length}건 로드 완료
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text2)', gap:'.5rem'}}>
                <span style={{fontSize:'2.5rem'}}>🗄️</span>
                <span style={{fontSize:'.9rem'}}>왼쪽 목록에서 테이블을 선택하세요</span>
                <span style={{fontSize:'.75rem', opacity:.6}}>총 {tables.length}개 테이블</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── QUERY MODE ── */}
      {mode === 'query' && (
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', gap:'.5rem'}}>
          <div style={{
            border:'1px solid var(--border)', borderRadius:'var(--radius-sm)',
            background:'var(--bg2)', overflow:'hidden', display:'flex', flexDirection:'column',
          }}>
            <div style={{
              padding:'.35rem .8rem', background:'var(--bg3)', borderBottom:'1px solid var(--border)',
              display:'flex', justifyContent:'space-between', alignItems:'center',
              fontSize:'.75rem', flexShrink:0,
            }}>
              <span style={{fontWeight:600}}>SQL Query <span style={{color:'var(--text2)', fontWeight:400}}>(SELECT only · Ctrl+Enter 실행)</span></span>
              <button className="primary" onClick={runQuery} disabled={loading}
                style={{fontSize:'.78rem', padding:'.3rem .7rem'}}>
                ▶ 실행
              </button>
            </div>
            <textarea
              value={sqlQuery}
              onChange={e => setSqlQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex:1, minHeight:80,
                padding:'.6rem .8rem',
                fontFamily:"'JetBrains Mono','Fira Code',monospace",
                fontSize:'.82rem',
                border:'none',
                outline:'none',
                resize:'vertical',
                background:'var(--bg2)',
                color:'var(--text)',
                lineHeight:1.6,
              }}
              placeholder="SELECT * FROM tbl_sec_reports LIMIT 10"
            />
          </div>

          {sqlErr && (
            <div style={{padding:'.6rem .8rem', background:'rgba(244,65,75,0.08)', border:'1px solid var(--red)', borderRadius:'var(--radius-sm)', color:'var(--red)', fontSize:'.82rem', fontFamily:'monospace'}}>
              {sqlErr}
            </div>
          )}

          {sqlResult && (
            <div style={{
              flex:1, overflow:'auto', border:'1px solid var(--border)',
              borderRadius:'var(--radius-sm)', background:'var(--bg2)',
            }}>
              <div style={{padding:'.3rem .7rem', background:'var(--bg3)', borderBottom:'1px solid var(--border)', fontSize:'.7rem', color:'var(--text2)', position:'sticky', top:0, zIndex:1}}>
                {sqlResult.columns.length} cols · {sqlResult.data.length} rows
              </div>
              <table style={{fontSize:'.78rem', tableLayout:'auto', minWidth:'100%'}}>
                <thead>
                  <tr>
                    <th style={{width:36, textAlign:'center', color:'var(--text2)'}}>#</th>
                    {sqlResult.columns.map(c => <th key={c} style={{minWidth:120, maxWidth:400}}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sqlResult.data.map((row, i) => (
                    <tr key={i}>
                      <td style={{textAlign:'center', color:'var(--text2)', fontSize:'.7rem'}}>{i + 1}</td>
                      {sqlResult.columns.map(col => {
                        const raw = row[col];
                        const strVal = raw === null ? 'NULL' : raw === '' ? '(empty)' : String(raw);
                        const isLong = strVal.length > 50;
                        return (
                          <td key={col}
                            style={{
                              minWidth: 120,
                              maxWidth: 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: isLong ? 'nowrap' : 'normal',
                              wordBreak: isLong ? undefined : 'break-word',
                              cursor: isLong ? 'pointer' : 'default',
                              color: raw === null ? 'var(--text2)' : 'var(--text)',
                              fontStyle: raw === null ? 'italic' : 'normal',
                            }}
                            title={isLong ? strVal : undefined}
                            onClick={() => {
                              if (isLong || raw === null) {
                                setCellModal({ column: col, value: strVal, rowIndex: i + 1 });
                              }
                            }}
                          >
                            {raw === null
                              ? <span style={{color:'var(--text2)', fontStyle:'italic'}}>NULL</span>
                              : raw === ''
                                ? <span style={{color:'var(--text2)'}}>—</span>
                                : isLong
                                  ? <span>{strVal.slice(0, 50)}... <span style={{color:'var(--accent)', fontSize:'.65rem'}}>[더보기]</span></span>
                                  : strVal
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sqlResult.data.length === 0 && (
                <div style={{textAlign:'center', padding:'2rem', color:'var(--text2)', fontSize:'.8rem'}}>
                  {sqlResult.message || 'No rows returned'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cell Full Value Modal */}
      {cellModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setCellModal(null)}
        >
          <div
            style={{
              background: 'var(--bg2)', borderRadius: 'var(--radius)',
              padding: '1.25rem 1.5rem', maxWidth: '700px', width: '100%',
              maxHeight: '80vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.75rem'}}>
              <div>
                <span style={{fontWeight:700, fontSize:'.9rem'}}>{cellModal.column}</span>
                {cellModal.rowIndex && <span style={{fontSize:'.75rem', color:'var(--text2)', marginLeft:'.5rem'}}>Row #{cellModal.rowIndex}</span>}
              </div>
              <button onClick={() => setCellModal(null)} style={{background:'transparent', border:'none', fontSize:'1.1rem', cursor:'pointer', color:'var(--text2)'}}>✕</button>
            </div>
            <div style={{
              flex:1, overflow:'auto',
              padding:'.75rem 1rem',
              background:'var(--bg)',
              borderRadius:'8px',
              fontFamily:"'JetBrains Mono','Fira Code',monospace",
              fontSize:'.82rem',
              lineHeight:1.6,
              whiteSpace:'pre-wrap',
              wordBreak:'break-all',
              color:'var(--text)',
              maxHeight:'60vh',
            }}>
              {cellModal.value}
            </div>
            <div style={{marginTop:'.75rem', display:'flex', justifyContent:'flex-end', gap:'.5rem'}}>
              <button onClick={() => {
                navigator.clipboard.writeText(cellModal.value).then(() => {
                  toast.success('클립보드에 복사되었습니다.');
                }).catch(() => toast.error('복사 실패'));
              }} style={{fontSize:'.78rem'}}>
                📋 복사
              </button>
              <button className="primary" onClick={() => setCellModal(null)} style={{fontSize:'.78rem'}}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
