import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Database() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.dbTables()
      .then(d => setTables(d.tables))
      .catch(e => setErr(e.message));
  }, []);

  const viewTable = (name) => {
    setSelectedTable(name);
    setLoading(true);
    setErr('');
    api.dbQuery(name)
      .then(setTableData)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column'}}>
      <div className="page-header">
        <h2>DB 뷰어</h2>
        {selectedTable && <span style={{fontSize:'.8rem', color:'var(--text2)'}}>main_db</span>}
      </div>
      {err && <p style={{color:'var(--red)', marginBottom:'.5rem'}}>{err}</p>}

      <div style={{display:'grid', gridTemplateColumns: '260px 1fr', gap:'1rem', flex: 1, overflow: 'hidden'}}>
        <div className="table-wrap" style={{height: '100%', overflowY: 'auto'}}>
          <table>
            <thead><tr><th>Table Name</th></tr></thead>
            <tbody>
              {tables.map(t => (
                <tr key={t} style={{cursor:'pointer'}} 
                  className={selectedTable === t ? 'active-row' : ''}
                  onClick={() => viewTable(t)}>
                  <td>📊 {t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{margin: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
          {selectedTable ? (
            <>
              <div className="flex-between mb1">
                <h3>Table: {selectedTable}</h3>
                {tableData && <span style={{fontSize:'.8rem', color:'var(--text2)'}}>{tableData.data.length} rows shown (limit 50)</span>}
              </div>
              
              {loading ? (
                <p>Loading table data...</p>
              ) : tableData ? (
                <div className="table-wrap" style={{flex: 1, overflow: 'auto'}}>
                  <table style={{fontSize: '.8rem'}}>
                    <thead>
                      <tr>
                        {tableData.columns.map(c => <th key={c}>{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.data.map((row, i) => (
                        <tr key={i}>
                          {tableData.columns.map(col => (
                            <td key={col} style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                              {row[col]?.toString() || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          ) : (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666'}}>
              Select a table to view data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
