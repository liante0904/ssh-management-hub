import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Users() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');

  const load = () => {
    setErr('');
    api.users(page, status || undefined, search || undefined)
      .then(setData).catch(e => setErr(e.message));
  };

  useEffect(load, [page, status, search]);

  const statusBadge = (s) => {
    const labels = { active: '활성', blocked: '차단', inactive: '비활성' };
    const cls = s === 'active' ? 'badge-green' : s === 'blocked' ? 'badge-red' : 'badge-yellow';
    return <span className={`badge ${cls}`}>{labels[s] || s}</span>;
  };

  const toggleStatus = (id, newStatus) => {
    api.updateUserStatus(id, newStatus).then(load).catch(e => setErr(e.message));
  };

  const toggleAdmin = (id, isAdmin) => {
    api.toggleAdmin(id, isAdmin).then(load).catch(e => setErr(e.message));
  };

  const deleteUser = (id) => {
    if (!window.confirm('정말 이 사용자를 삭제하시겠습니까?')) return;
    api.deleteUser(id).then(load).catch(e => setErr(e.message));
  };

  const statusLabels = { active: '활성', blocked: '차단', inactive: '비활성' };

  return (
    <div>
      <div className="page-header">
        <h2>사용자 관리</h2>
        {data && <span style={{color:'var(--text2)',fontSize:'.9rem'}}>총 {data.total.toLocaleString()}명</span>}
      </div>

      <div className="flex-row gap1 mb1" style={{flexWrap: 'wrap'}}>
        <input placeholder="이름 또는 사용자명 검색..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{minWidth:'240px'}} />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">전체 상태</option>
          <option value="active">활성</option>
          <option value="blocked">차단</option>
          <option value="inactive">비활성</option>
        </select>
      </div>

      {err && <p style={{color:'var(--red)',marginBottom:'.5rem'}}>{err}</p>}

      {data && (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>이름</th><th>사용자명</th><th>상태</th><th>관리자</th><th>작업</th></tr></thead>
              <tbody>
                {data.users.map(u => (
                  <tr key={u.id}>
                    <td style={{fontWeight:500,color:'var(--text2)'}}>#{u.id}</td>
                    <td style={{fontWeight:500}}>{u.first_name} {u.last_name}</td>
                    <td style={{color:'var(--accent)'}}>@{u.username}</td>
                    <td>{statusBadge(u.status)}</td>
                    <td>
                      <button className={u.is_admin ? 'danger' : 'primary'} style={{fontSize:'.8rem',padding:'.3rem .6rem'}}
                        onClick={() => toggleAdmin(u.id, !u.is_admin)}>
                        {u.is_admin ? '해제' : '부여'}
                      </button>
                    </td>
                    <td>
                      <div className="flex-row" style={{gap:'.3rem'}}>
                        {['active','blocked','inactive'].map(s => (
                          <button key={s} className={u.status === s ? 'primary' : ''}
                            style={{fontSize:'.78rem',padding:'.3rem .5rem'}}
                            onClick={() => toggleStatus(u.id, s)} disabled={u.status === s}>
                            {statusLabels[s]}
                          </button>
                        ))}
                        <button className="danger" style={{fontSize:'.78rem',padding:'.3rem .5rem'}}
                          onClick={() => deleteUser(u.id)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            {Array.from({length: Math.ceil(data.total / data.page_size)}, (_, i) => (
              <button key={i+1} className={page === i+1 ? 'active' : ''} onClick={() => setPage(i+1)}>{i+1}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
