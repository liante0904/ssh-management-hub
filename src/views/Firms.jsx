import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Firms() {
  const [firms, setFirms] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [boards, setBoards] = useState([]);
  const [err, setErr] = useState('');

  const load = () => {
    setErr('');
    api.firms(search || undefined).then(setFirms).catch(e => setErr(e.message));
  };

  useEffect(load, [search]);

  const selectFirm = (firm) => {
    setSelectedFirm(firm);
    api.firmBoards(firm.sec_firm_order).then(setBoards).catch(e => setErr(e.message));
  };

  const addBoard = () => {
    const name = window.prompt('Board Name:');
    if (!name) return;
    const cd = window.prompt('Board Code:');
    const label = window.prompt('Label Name:');
    
    api.createFirmBoard(selectedFirm.sec_firm_order, {
      board_nm: name,
      board_cd: cd,
      label_nm: label,
      article_board_order: boards.length + 1
    }).then(() => selectFirm(selectedFirm)).catch(e => setErr(e.message));
  };

  const deleteBoard = (boardOrder) => {
    if (!window.confirm('Delete this board?')) return;
    api.deleteFirmBoard(selectedFirm.sec_firm_order, boardOrder)
      .then(() => selectFirm(selectedFirm)).catch(e => setErr(e.message));
  };

  return (
    <div style={{height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column'}}>
      <h2 style={{marginBottom:'1rem'}}>Securities Firms & Boards Management</h2>
      <div className="flex-between mb1">
        <input placeholder="Search firm..." value={search} onChange={e => setSearch(e.target.value)} />
        <span style={{color:'var(--text2)',fontSize:'.85rem'}}>Total Firms: {firms.length}</span>
      </div>
      {err && <p style={{color:'var(--red)',marginBottom:'.5rem'}}>{err}</p>}

      <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap:'1.5rem', flex: 1, overflow: 'hidden'}}>
        {/* Left: Firms List */}
        <div className="table-wrap" style={{height: '100%', overflowY: 'auto'}}>
          <table>
            <thead><tr><th>Order</th><th>Firm Name</th><th>Telegram</th></tr></thead>
            <tbody>
              {firms.map(f => (
                <tr key={f.sec_firm_order} style={{cursor:'pointer'}}
                  className={selectedFirm?.sec_firm_order === f.sec_firm_order ? 'active-row' : ''}
                  onClick={() => selectFirm(f)}>
                  <td>{f.sec_firm_order}</td>
                  <td>{f.firm_nm}</td>
                  <td><span className={`badge ${f.telegram_update_yn === 'Y' ? 'badge-green' : 'badge-yellow'}`}>{f.telegram_update_yn}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Boards Management */}
        <div className="card" style={{margin: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
          {selectedFirm ? (
            <>
              <div className="flex-between mb1">
                <h3>Boards: {selectedFirm.firm_nm}</h3>
                <button className="primary" onClick={addBoard} style={{fontSize:'.8rem'}}>+ Add Board</button>
              </div>
              <div className="table-wrap" style={{flex: 1, overflow: 'auto'}}>
                <table>
                  <thead><tr><th>Order</th><th>Name</th><th>Code</th><th>Label</th><th>Actions</th></tr></thead>
                  <tbody>
                    {boards.map(b => (
                      <tr key={b.article_board_order}>
                        <td>{b.article_board_order}</td>
                        <td>{b.board_nm}</td>
                        <td><code>{b.board_cd}</code></td>
                        <td>{b.label_nm}</td>
                        <td>
                          <button className="danger" style={{fontSize:'.7rem', padding:'.15rem .4rem'}}
                            onClick={() => deleteBoard(b.article_board_order)}>Del</button>
                        </td>
                      </tr>
                    ))}
                    {boards.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', color:'var(--text2)'}}>No boards found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666'}}>
              Select a firm to manage its boards
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
