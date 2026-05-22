import { useState, useEffect, useRef, useMemo } from 'react';
import Ansi from 'ansi-to-react';
import { api } from '../lib/api';

// ── Log Syntax Highlighter (vi-style coloring) ─────
const LOG_COLORS = {
  ts: '#5a8a6a',      // timestamps
  err: '#ff6b6b',     // ERROR / CRITICAL / FATAL
  warn: '#ffd93d',    // WARN
  info: '#6cc070',    // INFO
  debug: '#8b8ba0',   // DEBUG / TRACE
  ip: '#4fc3f7',      // IP addresses
  url: '#64b5f6',     // URLs
  path: '#ffd54f',    // file paths
  num: '#b39ddb',     // numbers
  key: '#ce93d8',     // JSON keys
  str: '#a5d6a7',     // JSON strings
  dim: '#6a6a7a',     // dim text (comments, etc)
  ok: '#69f0ae',      // success
};

const PATTERNS = [
  // Log levels (highest priority)
  { re: /\b(CRITICAL|FATAL|EMERGENCY|ALERT)\b/g, color: 'err', bold: true },
  { re: /\b(ERROR|SEVERE|FAIL|FAILED|FAILURE)\b/g, color: 'err', bold: true },
  { re: /\b(WARN|WARNING)\b/g, color: 'warn' },
  { re: /\b(INFO|NOTICE)\b/g, color: 'info' },
  { re: /\b(DEBUG|TRACE|FINE|FINER|FINEST)\b/g, color: 'debug' },
  // Success
  { re: /\b(SUCCESS|OK|DONE|COMPLETED|SUCCEEDED|PASSED)\b/g, color: 'ok' },
  // Error-related words
  { re: /\b(exception|traceback|stack trace|timeout|refused|denied|forbidden|unauthorized|invalid)\b/gi, color: 'err' },
  // Timestamps
  { re: /\b\d{4}[-/]\d{2}[-/]\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/g, color: 'ts' },
  { re: /\b\d{2}[-/]\w{3}[-/]\d{4}[: ]\d{2}:\d{2}:\d{2}\b/g, color: 'ts' },
  { re: /\b\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\b/g, color: 'ts' },
  { re: /\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/g, color: 'ts' },
  // IP addresses
  { re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, color: 'ip' },
  // URLs
  { re: /\bhttps?:\/\/[^\s"'<>|]+/g, color: 'url' },
  // File paths
  { re: /(?:\/[^\s,;"'<>|]*)+\/[^\s,;"'<>|]*\.\w+/g, color: 'path' },
  { re: /\b\w+\.(?:py|js|jsx|ts|tsx|java|go|rs|c|cpp|h|yml|yaml|json|xml|toml|ini|cfg|conf|log|txt|md)(?:\s|$)/g, color: 'path' },
  // JSON keys
  { re: /"[^"]+"\s*:/g, color: 'key' },
  // Hex numbers
  { re: /\b0x[0-9a-fA-F]+\b/g, color: 'num' },
];

const HIGHLIGHT_REGEX = (() => {
  const all = PATTERNS.map(p => `(${p.re.source})`).join('|');
  return new RegExp(all, 'gi');
})();

function LogLine({ text }) {
  // Check for ANSI codes first
  const hasAnsi = /\x1b\[/.test(text);

  const html = useMemo(() => {
    if (hasAnsi) return null; // delegate to Ansi component

    const parts = [];
    let lastIndex = 0;
    let match;
    const re = new RegExp(HIGHLIGHT_REGEX.source, 'gi');

    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index), style: {} });
      }
      // Find which pattern matched
      for (let i = 0; i < PATTERNS.length; i++) {
        if (match[i + 1] !== undefined) {
          const p = PATTERNS[i];
          const color = LOG_COLORS[p.color] || '#e0e0e0';
          parts.push({
            text: match[0],
            style: { color, fontWeight: p.bold ? 700 : 400 },
          });
          break;
        }
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), style: {} });
    }

    if (parts.length === 0) return text;

    return parts.map((p, i) =>
      p.style.color
        ? <span key={i} style={{color: p.style.color, fontWeight: p.style.fontWeight}}>{p.text}</span>
        : p.text
    );
  }, [text]);

  if (hasAnsi) {
    return (
      <span style={{display:'block'}}>
        <Ansi>{text}</Ansi>
      </span>
    );
  }

  return <span style={{display:'block'}}>{html}</span>;
}

function LogHighlighter({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => <LogLine key={i} text={line} />);
}

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
        <h2>로그 뷰어</h2>
        <div className="flex-row gap1">
          {currentFile && (
            <>
              <button onClick={toggleWideMode} className={wideMode ? 'primary' : ''} style={{fontSize: '.8rem'}} title="Toggle wide mode">
                {wideMode ? '⊲ 분할 보기' : '⊳ 와이드 보기'}
              </button>
              <button onClick={refreshLog} style={{fontSize: '.8rem'}} disabled={loading} title="Refresh log content">
                🔄 새로고침
              </button>
              <button onClick={clearViewer} style={{fontSize: '.85rem'}} title="닫기">
                ✕ 닫기
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
                <LogHighlighter text={logContent} />
              </pre>
            ) : (
              <div className="log-placeholder">
                <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>📋</div>
                <div style={{fontSize:'1rem',marginBottom:'.5rem',color:'#888'}}>로그 파일을 선택하세요</div>
                <div style={{fontSize:'.85rem',color:'#666'}}>왼쪽 목록에서 로그 파일을 선택하면 내용이 표시됩니다</div>
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
