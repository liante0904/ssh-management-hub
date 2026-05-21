import { useState, useEffect } from 'react';
import Ansi from 'ansi-to-react';
import { api } from '../lib/api';

export default function Logs() {
  const [entries, setEntries] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [logContent, setLogContent] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    api.logs().then(d => {
      setEntries(d.entries);
      setCurrentPath(d.current_path);
    }).catch(e => setErr(e.message));
  }, []);

  const navigate = (path) => {
    api.logs(path).then(d => {
      setEntries(d.entries);
      setCurrentPath(d.current_path);
      setLogContent('');
    }).catch(e => setErr(e.message));
  };

  const viewFile = (file) => {
    api.logView(file).then(d => setLogContent(d.content)).catch(e => setErr(e.message));
  };

  return (
    <div style={{height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column'}}>
      <h2 style={{marginBottom:'1rem'}}>Logs</h2>
      {err && <p style={{color:'var(--red)',marginBottom:'.5rem'}}>{err}</p>}

      {currentPath && (
        <div className="flex-row mb1" style={{fontSize:'.85rem',color:'var(--text2)'}}>
          <span>/ {currentPath || 'root'}</span>
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns: '280px 1fr', gap:'1rem', flex: 1, overflow: 'hidden'}}>
        <div className="table-wrap" style={{height: '100%', overflowY: 'auto'}}>
          <table style={{fontSize: '.85rem'}}>
            <thead><tr><th>Name</th></tr></thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} style={{cursor:'pointer'}}
                  className={currentPath === e.full_path ? 'active-row' : ''}
                  onClick={() => e.type === 'directory' ? navigate(e.full_path) : viewFile(e.full_path)}>
                  <td>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {e.type === 'directory' ? '📁' : '📄'} {e.name}
                      </span>
                      <span style={{fontSize: '.7rem', opacity: 0.6}}>{e.size || ''}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{margin: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e', color: '#d4d4d4', padding: '0'}}>
          <div style={{padding: '0.5rem 1rem', borderBottom: '1px solid #333', fontSize: '.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span>Log Viewer</span>
            <button onClick={() => setLogContent('')} style={{padding: '2px 8px', fontSize: '.7rem'}}>Clear</button>
          </div>
          <div style={{flex: 1, overflow: 'auto', padding: '1rem', fontFamily: 'monospace', fontSize: '.9rem', lineHeight: 1.4}}>
            {logContent ? (
              <pre style={{margin: 0, whiteSpace: 'pre-wrap'}}>
                <Ansi>{logContent}</Ansi>
              </pre>
            ) : (
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666'}}>
                Select a log file to view content
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
