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
    const cls = s === 'active' ? 'badge-green' : s === 'blocked' ? 'badge-red' : 'badge-yellow';
    return <span className={`badge ${cls}`}>{s}</span>;
  };

  const toggleStatus = (id, newStatus) => {
    api.updateUserStatus(id, newStatus).then(load).catch(e => setErr(e.message));
  };

  const toggleAdmin = (id, isAdmin) => {
    api.toggleAdmin(id, isAdmin).then(load).catch(e => setErr(e.message));
  };

  return (
    <div>
      <h2 style={{marginBottom:'1rem'}}>Users</h2>
      <div className="flex-between mb1">
        <div className="flex-row">
          <input placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {data && <span style={{color:'var(--text2)',fontSize:'.85rem'}}>Total: {data.total}</span>}
      </div>

      {err && <p style={{color:'var(--red)',marginBottom:'.5rem'}}>{err}</p>}

      {data && (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Username</th><th>Status</th><th>Admin</th><th>Actions</th></tr></thead>
              <tbody>
                {data.users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>@{u.username}</td>
                    <td>{statusBadge(u.status)}</td>
                    <td>
                      <button className={u.is_admin ? 'danger' : 'primary'} style={{fontSize:'.75rem',padding:'.2rem .4rem'}}
                        onClick={() => toggleAdmin(u.id, !u.is_admin)}>
                        {u.is_admin ? 'Revoke' : 'Grant'}
                      </button>
                    </td>
                    <td className="flex-row">
                      {['active','blocked','inactive'].map(s => (
                        <button key={s} className={u.status === s ? 'primary' : ''}
                          style={{fontSize:'.7rem',padding:'.15rem .35rem'}}
                          onClick={() => toggleStatus(u.id, s)} disabled={u.status === s}>{s}</button>
                      ))}
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
