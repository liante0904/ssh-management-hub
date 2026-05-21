import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Firms() {
  const [firms, setFirms] = useState([]);
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');

  const load = () => {
    setErr('');
    api.firms(search || undefined).then(setFirms).catch(e => setErr(e.message));
  };

  useEffect(load, [search]);

  return (
    <div>
      <h2 style={{marginBottom:'1rem'}}>Securities Firms</h2>
      <div className="flex-between mb1">
        <input placeholder="Search firm..." value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{color:'var(--text2)',fontSize:'.85rem'}}>Total: {firms.length}</span>
      </div>
      {err && <p style={{color:'var(--red)',marginBottom:'.5rem'}}>{err}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Order</th><th>Firm Name</th><th>Telegram</th><th>PDF URL</th></tr></thead>
          <tbody>
            {firms.map(f => (
              <tr key={f.sec_firm_order}>
                <td>{f.sec_firm_order}</td>
                <td>{f.firm_nm}</td>
                <td><span className={`badge ${f.telegram_update_yn === 'Y' ? 'badge-green' : 'badge-yellow'}`}>{f.telegram_update_yn}</span></td>
                <td style={{maxWidth:'250px',overflow:'hidden',textOverflow:'ellipsis'}}>
                  {f.COMMENT_PDF_URL ? <a href={f.COMMENT_PDF_URL} target="_blank" style={{color:'var(--accent)',fontSize:'.8rem'}}>{f.COMMENT_PDF_URL}</a> : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
