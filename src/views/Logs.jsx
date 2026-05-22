import { useState, useEffect, useRef } from 'react';
import Ansi from 'ansi-to-react';
import { api } from '../lib/api';

export default function Logs() {
  const [entries, setEntries] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [logContent, setLogContent] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  const [err, setErr] = useState('');
  const [wideMode, setWideMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lineCount, setLineCount] = useState(500);
  const logEndRef = useRef(null);

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
      setCurrentFile(null);
      setWideMode(false);
    }).catch(e => setErr(e.message));
  };

  const viewFile = (file) => {
    setLoading(true);
    setCurrentFile(file);
    setWideMode(true);
    api.logView(file, lineCount).then(d => {
      setLogContent(d.content);
      setLoading(false);
    }).catch(e => {
      setErr(e.message);
      setLoading(false);
    });
  };

  const toggleWideMode = () => {
    setWideMode(prev => !prev);
  };

  const refreshLog = () => {
    if (currentFile) {
      setLoading(true);
      api.logView(currentFile, lineCount).then(d => {
        setLogContent(d.content);
        setLoading(false);
      }).catch(e => {
        setErr(e.message);
        setLoading(false);
      });
    }
  };

  const clearViewer = () => {
    setLogContent('');
    setCurrentFile(null);
    setWideMode(false);
  };

  // Auto scroll to bottom when log content changes
  useEffect(() => {
    if (logEndRef.current && logContent) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logContent]);

  const breadcrumbs = currentPath ? currentPath.split('/').filter(Boolean) : [];

  return (
    <div style={{height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column'}}>
      <div className="page-header">
        <h2>Logs</h2>
        <div className="flex-row gap1">
          {currentFile && (
            <>
              <button onClick={toggleWideMode} className={wideMode ? 'primary' : ''} style={{fontSize: '.8rem'}} title="Toggle wide mode">
                {wideMode ? '⊲ Split View' : '⊳ Wide View'}
              </button>
              <button onClick={refreshLog} style={{fontSize: '.8rem'}} disabled={loading} title="Refresh log content">
                🔄 Refresh
              </button>
              <button onClick={clearViewer} style={{fontSize: '.8rem'}} title="Close log viewer">
                ✕ Close
              </button>
            </>
          )}
        </div>
      </div>

      {err && <p style={{color:'var(--red)',marginBottom:'.5rem'}}>{err}</p>}

      {/* Breadcrumbs */}
      {currentPath && (
        <div className="flex-row mb1" style={{fontSize:'.8rem',color:'var(--text2)',gap:'.25rem',flexWrap:'wrap'}}>
          <span style={{cursor:'pointer',color:'var(--accent)'}} onClick={() => navigate(null)}>/</span>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{display:'flex',alignItems:'center',gap:'.25rem'}}>
              <span style={{color:'var(--text2)'}}>/</span>
              <span
                style={{cursor:i < breadcrumbs.length - 1 ? 'pointer' : 'default',color:i < breadcrumbs.length - 1 ? 'var(--accent)' : 'var(--text)'}}
                onClick={() => {
                  if (i < breadcrumbs.length - 1) {
                    const path = '/' + breadcrumbs.slice(0, i + 1).join('/');
                    navigate(path);
                  }
                }}
              >
                {crumb}
              </span>
            </span>
          ))}
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns: wideMode && currentFile ? '1fr' : '280px 1fr', gap:'1rem', flex: 1, overflow: 'hidden', transition: 'grid-template-columns 0.3s ease'}}>
        {/* File list - hidden in wide mode */}
        {!(wideMode && currentFile) && (
          <div className="table-wrap" style={{height: '100%', overflowY: 'auto'}}>
            <table style={{fontSize: '.85rem'}}>
              <thead><tr><th>Name</th></tr></thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i} style={{cursor:'pointer'}}
                    className={currentFile === e.full_path ? 'active-row' : ''}
                    onClick={() => e.type === 'directory' ? navigate(e.full_path) : viewFile(e.full_path)}>
                    <td>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display:'flex', alignItems:'center', gap:'.4rem'}}>
                          <span style={{flexShrink:0}}>{e.type === 'directory' ? '📁' : '📄'}</span>
                          <span>{e.name}</span>
                        </span>
                        <span style={{fontSize: '.7rem', opacity: 0.6, flexShrink: 0, marginLeft: '.5rem'}}>{e.size || ''}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td style={{textAlign:'center',color:'var(--text2)',padding:'2rem'}}>No files found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Log Viewer */}
        <div className="log-viewer" style={{
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1a1a2e',
          color: '#e0e0e0',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
          flex: 1
        }}>
          {/* Viewer toolbar */}
          <div className="log-toolbar">
            <div style={{display:'flex',alignItems:'center',gap:'.5rem',flexWrap:'wrap'}}>
              <span style={{fontWeight:600,fontSize:'.85rem'}}>
                {currentFile ? (
                  <span>📄 {currentFile.split('/').pop()}</span>
                ) : (
                  <span>Log Viewer</span>
                )}
              </span>
              {currentFile && (
                <span style={{fontSize:'.7rem',opacity:.6}}>{currentFile}</span>
              )}
            </div>
            <div className="flex-row" style={{gap:'.4rem'}}>
              <select
                value={lineCount}
                onChange={e => {
                  setLineCount(Number(e.target.value));
                  if (currentFile) viewFile(currentFile);
                }}
                style={{
                  fontSize: '.7rem',
                  padding: '2px 6px',
                  background: '#2d2d44',
                  border: '1px solid #444',
                  color: '#ccc',
                  borderRadius: '4px'
                }}
              >
                <option value="100">100 lines</option>
                <option value="500">500 lines</option>
                <option value="1000">1,000 lines</option>
                <option value="2000">2,000 lines</option>
                <option value="5000">5,000 lines</option>
              </select>
              {loading && <span style={{fontSize:'.7rem',opacity:.7}}>Loading...</span>}
            </div>
          </div>

          {/* Log content area */}
          <div
            className="log-content-area"
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '.75rem 1rem',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
              fontSize: '.82rem',
              lineHeight: 1.55,
              tabSize: 4
            }}
          >
            {logContent ? (
              <pre style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit'
              }}>
                <Ansi>{logContent}</Ansi>
              </pre>
            ) : (
              <div className="log-placeholder">
                <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>📋</div>
                <div style={{fontSize:'1rem',marginBottom:'.5rem',color:'#888'}}>No log file selected</div>
                <div style={{fontSize:'.8rem',color:'#666'}}>Select a log file from the list to view its contents</div>
              </div>
            )}
            <div ref={logEndRef} />
          </div>

          {/* Status bar */}
          <div className="log-statusbar">
            <span>{currentFile ? `${currentFile.split('/').pop()} — ${logContent ? logContent.split('\n').length.toLocaleString() + ' lines' : '...'}` : 'Ready'}</span>
            <span style={{display:'flex',gap:'.5rem'}}>
              <span>UTF-8</span>
              <span>|</span>
              <span>ANSI Colors: On</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
