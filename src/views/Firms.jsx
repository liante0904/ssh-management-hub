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

  const editFirm = (firm) => {
    const newName = window.prompt('새 증권사 이름을 입력하세요:', firm.firm_nm);
    if (!newName || newName === firm.firm_nm) return;
    api.updateFirm(firm.sec_firm_order, { firm_nm: newName })
      .then(() => {
        load();
        if (selectedFirm?.sec_firm_order === firm.sec_firm_order) {
          setSelectedFirm({ ...selectedFirm, firm_nm: newName });
        }
      })
      .catch(e => setErr(e.message));
  };

  const addBoard = () => {
    const name = window.prompt('게시판 이름:');
    if (!name) return;
    const cd = window.prompt('게시판 코드:');
    const label = window.prompt('라벨 이름:');
    
    api.createFirmBoard(selectedFirm.sec_firm_order, {
      board_nm: name,
      board_cd: cd,
      label_nm: label,
      article_board_order: boards.length + 1
    }).then(() => selectFirm(selectedFirm)).catch(e => setErr(e.message));
  };

  const editBoard = (board) => {
    const newName = window.prompt('새 게시판 이름을 입력하세요:', board.board_nm);
    if (!newName || newName === board.board_nm) return;
    api.updateFirmBoard(selectedFirm.sec_firm_order, board.article_board_order, { board_nm: newName })
      .then(() => selectFirm(selectedFirm))
      .catch(e => setErr(e.message));
  };

  const deleteBoard = (boardOrder) => {
    if (!window.confirm('이 게시판을 삭제하시겠습니까?')) return;
    api.deleteFirmBoard(selectedFirm.sec_firm_order, boardOrder)
      .then(() => selectFirm(selectedFirm)).catch(e => setErr(e.message));
  };

  return (
    <div style={{minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
      <div className="page-header">
        <h2>증권사 관리</h2>
        <div className="flex-row">
          <input 
            placeholder="Search firms..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{padding: '0.6rem 1rem', minWidth: '220px'}}
          />
        </div>
      </div>

      {err && <div className="card" style={{borderLeft: '4px solid var(--red)', padding: '0.75rem 1rem', color: 'var(--red)'}}>{err}</div>}

      <div className="firms-container" style={{display:'flex', flexWrap: 'wrap', gap:'1.25rem', alignItems: 'flex-start'}}>
        {/* Left: Firms List */}
        <div className="card" style={{flex: '1 1 400px', padding: '0', overflow: 'hidden'}}>
          <div style={{padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 style={{fontSize: '1rem'}}>증권사 목록 ({firms.length})</h3>
          </div>
          <div className="table-wrap" style={{maxHeight: '600px', overflowY: 'auto', border: 'none'}}>
            <table>
              <thead><tr><th>순서</th><th>증권사명</th><th>텔레그램</th><th>관리</th></tr></thead>
              <tbody>
                {firms.map(f => (
                  <tr key={f.sec_firm_order} 
                    className={selectedFirm?.sec_firm_order === f.sec_firm_order ? 'active-row' : ''}
                    onClick={() => selectFirm(f)}
                    style={{cursor:'pointer'}}>
                    <td>{f.sec_firm_order}</td>
                    <td style={{fontWeight: 500}}>{f.firm_nm}</td>
                    <td><span className={`badge ${f.telegram_update_yn === 'Y' ? 'badge-green' : 'badge-yellow'}`}>{f.telegram_update_yn === 'Y' ? 'ON' : 'OFF'}</span></td>
                    <td>
                      <button onClick={(e) => { e.stopPropagation(); editFirm(f); }} style={{fontSize:'.75rem', padding:'.3rem .6rem'}}>수정</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Boards Management */}
        <div className="card" style={{flex: '1 1 500px', padding: '0', overflow: 'hidden', minHeight: '400px'}}>
          {selectedFirm ? (
            <>
              <div style={{padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg3)'}}>
                <h3 style={{fontSize: '1rem'}}>📍 {selectedFirm.firm_nm} 게시판 설정</h3>
                <button className="primary" onClick={addBoard} style={{fontSize:'.8rem'}}>+ 게시판 추가</button>
              </div>
              <div className="table-wrap" style={{border: 'none'}}>
                <table>
                  <thead><tr><th>순서</th><th>게시판명</th><th>코드</th><th>라벨</th><th>작업</th></tr></thead>
                  <tbody>
                    {boards.map(b => (
                      <tr key={b.article_board_order}>
                        <td>{b.article_board_order}</td>
                        <td style={{fontWeight: 500}}>{b.board_nm}</td>
                        <td><code style={{background: 'var(--bg)', padding: '2px 4px', borderRadius: '4px', fontSize: '.8rem'}}>{b.board_cd}</code></td>
                        <td><span style={{color: 'var(--text2)', fontSize: '.85rem'}}>{b.label_nm}</span></td>
                        <td>
                          <div className="flex-row" style={{gap: '.25rem'}}>
                            <button onClick={() => editBoard(b)} style={{fontSize:'.7rem', padding:'.2rem .4rem'}}>수정</button>
                            <button className="danger" style={{fontSize:'.7rem', padding:'.2rem .4rem'}}
                              onClick={() => deleteBoard(b.article_board_order)}>삭제</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {boards.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{textAlign:'center', padding: '3rem', color:'var(--text2)'}}>
                          등록된 게시판이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '4rem', color: 'var(--text2)', textAlign: 'center'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🏢</div>
              <p>증권사를 선택하면<br/>해당 증권사의 게시판 목록을 관리할 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
