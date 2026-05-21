import { useState, useEffect } from 'react';
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
    <div>
      <h2 style={{marginBottom:'1rem'}}>Logs</h2>
      {err && <p style={{color:'var(--red)',marginBottom:'.5rem'}}>{err}</p>}

      {currentPath && (
        <div className="flex-row mb1" style={{fontSize:'.85rem',color:'var(--text2)'}}>
          <span>/ {currentPath || 'root'}</span>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:logContent?'1fr 2fr':'1fr',gap:'1rem'}}>
        <div className="table-wrap" style={{maxHeight:'70vh'}}>
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Modified</th></tr></thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} style={{cursor:'pointer'}}
                  onClick={() => e.type === 'directory' ? navigate(e.full_path) : viewFile(e.full_path)}>
                  <td>{e.type === 'directory' ? '📁' : '📄'} {e.name}</td>
                  <td><span className={`badge ${e.type === 'directory' ? 'badge-blue' : ''}`}>{e.type}</span></td>
                  <td>{e.size || '-'}</td>
                  <td>{e.modified || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logContent && (
          <div className="card">
            <h2>File Content</h2>
            <pre className="log-content">{logContent}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
