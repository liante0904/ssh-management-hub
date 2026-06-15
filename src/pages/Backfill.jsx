import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import './Backfill.css';

export default function Backfill() {
  const [firms, setFirms] = useState([]);
  const [selected, setSelected] = useState([]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.backfillFirms().then(setFirms).catch(() => {});
  }, []);

  const toggleFirm = (key) => {
    setSelected(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]);
  };

  const runBackfill = async () => {
    if (!selected.length) return;
    setRunning(true); setError('');
    try {
      const res = await api.backfillBatch(selected, 7);
      setResults(res.results || []);
    } catch (e) {
      setError(e.message);
    }
    setRunning(false);
  };

  const runSingle = async (firm) => {
    setRunning(true); setError('');
    try {
      const res = await api.backfillRun(firm);
      setResults(prev => [res, ...prev.filter(r => r.firm !== firm)]);
    } catch (e) {
      setError(e.message);
    }
    setRunning(false);
  };

  return (
    <div className="backfill-page">
      <h2>증권사 백필</h2>
      <p>GA standalone이 놓친 과거 데이터를 수동으로 수집합니다.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="firm-grid">
        {firms.map(f => (
          <button
            key={f.key}
            className={`firm-chip ${selected.includes(f.key) ? 'active' : ''}`}
            onClick={() => toggleFirm(f.key)}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="actions">
        <button className="btn primary" disabled={!selected.length || running} onClick={runBackfill}>
          {running ? '실행 중...' : `${selected.length}개 증권사 백필 실행`}
        </button>
        <button className="btn" onClick={() => setSelected(firms.map(f => f.key))}>
          전체 선택
        </button>
      </div>

      {results.length > 0 && (
        <div className="results">
          <h3>결과</h3>
          <table>
            <thead>
              <tr><th>증권사</th><th>상태</th><th>건수</th><th>소요</th><th>오류</th><th>재실행</th></tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.firm} className={r.status === 'success' ? 'ok' : 'fail'}>
                  <td>{r.firm_nm || r.firm}</td>
                  <td>{r.status}</td>
                  <td>{r.articles || 0}</td>
                  <td>{r.elapsed_sec}s</td>
                  <td>{r.error || (r.bad_dates ? `${r.bad_dates} bad dates` : '')}</td>
                  <td><button className="btn small" onClick={() => runSingle(r.firm)}>재실행</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
