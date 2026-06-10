import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/ToastContext';

export default function Firms() {
  const [firms, setFirms] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [boards, setBoards] = useState([]);
  const { toast, confirm, prompt } = useToast();

  const load = useCallback(() => {
    api.firms(search || undefined)
      .then(setFirms)
      .catch(e => toast.error(e.message));
  }, [search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const selectFirm = (firm) => {
    setSelectedFirm(firm);
    api.firmBoards(firm.sec_firm_order)
      .then(setBoards)
      .catch(e => toast.error(e.message));
  };

  const editFirm = async (firm) => {
    const newName = await prompt('새 증권사 이름을 입력하세요:', firm.firm_nm);
    if (!newName || newName === firm.firm_nm) return;
    api.updateFirm(firm.sec_firm_order, { firm_nm: newName })
      .then(() => {
        toast.success('증권사 이름이 변경되었습니다.');
        load();
        if (selectedFirm?.sec_firm_order === firm.sec_firm_order) {
          setSelectedFirm({ ...selectedFirm, firm_nm: newName });
        }
      })
      .catch(e => toast.error(e.message));
  };

  const toggleGa = async (firm) => {
    const newVal = firm.ga_enabled_yn === 'Y' ? 'N' : 'Y';
    const ok = await confirm(
      `${firm.firm_nm}의 GA 자동 수집을 ${newVal === 'Y' ? '활성화' : '비활성화'}하시겠습니까?`,
      'GA 설정 변경'
    );
    if (!ok) return;
    api.updateFirm(firm.sec_firm_order, { ga_enabled_yn: newVal })
      .then(() => {
        toast.success(`GA 자동 수집이 ${newVal === 'Y' ? '활성화' : '비활성화'}되었습니다.`);
        load();
        if (selectedFirm?.sec_firm_order === firm.sec_firm_order) {
          setSelectedFirm({ ...selectedFirm, ga_enabled_yn: newVal });
        }
      })
      .catch(e => toast.error(e.message));
  };

  const addBoard = async () => {
    const name = await prompt('게시판 이름:');
    if (!name) return;
    const cd = await prompt('게시판 코드:');
    if (!cd) return;
    const label = await prompt('라벨 이름:');
    if (!label) return;
    
    api.createFirmBoard(selectedFirm.sec_firm_order, {
      board_nm: name,
      board_cd: cd,
      label_nm: label,
      article_board_order: boards.length + 1
    })
      .then(() => {
        toast.success('게시판이 추가되었습니다.');
        selectFirm(selectedFirm);
      })
      .catch(e => toast.error(e.message));
  };

  const editBoard = async (board) => {
    const newName = await prompt('새 게시판 이름을 입력하세요:', board.board_nm);
    if (!newName || newName === board.board_nm) return;
    api.updateFirmBoard(selectedFirm.sec_firm_order, board.article_board_order, { board_nm: newName })
      .then(() => {
        toast.success('게시판 이름이 변경되었습니다.');
        selectFirm(selectedFirm);
      })
      .catch(e => toast.error(e.message));
  };

  const deleteBoard = async (boardOrder) => {
    const ok = await confirm('이 게시판을 삭제하시겠습니까?', '게시판 삭제');
    if (!ok) return;
    api.deleteFirmBoard(selectedFirm.sec_firm_order, boardOrder)
      .then(() => {
        toast.success('게시판이 삭제되었습니다.');
        selectFirm(selectedFirm);
      })
      .catch(e => toast.error(e.message));
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

      {/* Telegram ON/OFF 설명 */}
      <div className="card" style={{
        padding: '.75rem 1rem',
        borderLeft: '4px solid var(--accent)',
        fontSize: '.82rem',
        lineHeight: 1.6,
        color: 'var(--text2)',
      }}>
        <strong style={{color: 'var(--text)'}}>📡 텔레그램 ON/OFF 안내</strong><br/>
        <strong>ON (초록색)</strong>: 해당 증권사의 새 리포트가 수집되면 <strong>텔레그램 봇을 통해 구독자에게 자동 전송</strong>됩니다.<br/>
        <strong>OFF (노란색)</strong>: 텔레그램 자동 전송이 <strong>비활성화</strong>된 상태입니다. 리포트는 수집되지만 구독자에게 전송되지 않습니다.<br/>
        <span style={{fontSize: '.75rem'}}>※ 텔레그램 ON/OFF 전환은 백엔드 API를 통해 변경 가능합니다. (추후 UI 토글 지원 예정)</span>
      </div>

      <div className="firms-container" style={{display:'flex', flexWrap: 'wrap', gap:'1.25rem', alignItems: 'flex-start'}}>
        {/* Left: Firms List */}
        <div className="card" style={{flex: '1 1 400px', padding: '0', overflow: 'hidden'}}>
          <div style={{padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 style={{fontSize: '1rem'}}>증권사 목록 ({firms.length})</h3>
          </div>
          <div className="table-wrap" style={{maxHeight: '600px', overflowY: 'auto', border: 'none'}}>
            <table>
              <thead><tr><th>순서</th><th>증권사명</th><th>텔레그램</th><th>GA</th><th>관리</th></tr></thead>
              <tbody>
                {firms.map(f => (
                  <tr key={f.sec_firm_order} 
                    className={selectedFirm?.sec_firm_order === f.sec_firm_order ? 'active-row' : ''}
                    onClick={() => selectFirm(f)}
                    style={{cursor:'pointer'}}>
                    <td>{f.sec_firm_order}</td>
                    <td style={{fontWeight: 500}}>{f.firm_nm}</td>
                    <td>
                      <span
                        className={`badge ${f.telegram_update_yn === 'Y' ? 'badge-green' : 'badge-yellow'}`}
                        title={f.telegram_update_yn === 'Y'
                          ? '텔레그램 자동 전송 ON - 구독자에게 새 리포트 전송됨'
                          : '텔레그램 자동 전송 OFF - 구독자에게 전송되지 않음'}
                        style={{cursor: 'help'}}
                      >
                        {f.telegram_update_yn === 'Y' ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${f.ga_enabled_yn === 'Y' ? 'badge-green' : 'badge-yellow'}`}
                        title={f.ga_enabled_yn === 'Y'
                          ? 'GitHub Actions 자동 수집 ON - 클릭하여 OFF'
                          : 'GitHub Actions 자동 수집 OFF - 클릭하여 ON'}
                        style={{cursor: 'pointer'}}
                        onClick={(e) => { e.stopPropagation(); toggleGa(f); }}
                      >
                        {f.ga_enabled_yn === 'Y' ? 'ON' : 'OFF'}
                      </span>
                    </td>
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
