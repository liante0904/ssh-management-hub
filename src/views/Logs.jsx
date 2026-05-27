import { useState, useEffect, useRef, useMemo } from 'react';
import Ansi from 'ansi-to-react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/ToastContext';

// ── Log Syntax Highlighter (vi-style) ─────
const LOG_COLORS = {
  ts: '#5a8a6a', err: '#ff6b6b', warn: '#ffd93d', info: '#6cc070',
  debug: '#8b8ba0', ip: '#4fc3f7', url: '#64b5f6', path: '#ffd54f',
  num: '#b39ddb', key: '#ce93d8', str: '#a5d6a7', dim: '#6a6a7a', ok: '#69f0ae',
};

const PATTERNS = [
  { re: /\b(CRITICAL|FATAL|EMERGENCY|ALERT)\b/g, color: 'err', bold: true },
  { re: /\b(ERROR|SEVERE|FAIL|FAILED|FAILURE)\b/g, color: 'err', bold: true },
  { re: /\b(WARN|WARNING)\b/g, color: 'warn' },
  { re: /\b(INFO|NOTICE)\b/g, color: 'info' },
  { re: /\b(DEBUG|TRACE|FINE|FINER|FINEST)\b/g, color: 'debug' },
  { re: /\b(SUCCESS|OK|DONE|COMPLETED|SUCCEEDED|PASSED)\b/g, color: 'ok' },
  { re: /\b(exception|traceback|stack trace|timeout|refused|denied|forbidden|unauthorized|invalid)\b/gi, color: 'err' },
  { re: /\b\d{4}[-/]\d{2}[-/]\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/g, color: 'ts' },
  { re: /\b\d{2}[-/]\w{3}[-/]\d{4}[: ]\d{2}:\d{2}:\d{2}\b/g, color: 'ts' },
  { re: /\b\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\b/g, color: 'ts' },
  { re: /\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/g, color: 'ts' },
  { re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, color: 'ip' },
  { re: /\bhttps?:\/\/[^\s"'<>|]+/g, color: 'url' },
  { re: /(?:\/[^\s,;"'<>|]*)+\.[\w]+/g, color: 'path' },
  { re: /\b\w+\.(?:py|js|jsx|ts|tsx|java|go|rs|c|cpp|h|yml|yaml|json|xml|toml|ini|cfg|conf|log|txt|md)(?:\s|$)/g, color: 'path' },
  { re: /"[^"]+"\s*:/g, color: 'key' },
  { re: /\b0x[0-9a-fA-F]+\b/g, color: 'num' },
];

const HIGHLIGHT_REGEX = (() => {
  const all = PATTERNS.map(p => `(${p.re.source})`).join('|');
  return new RegExp(all, 'gi');
})();

function LogLine({ text }) {
  const hasAnsi = /\x1b\[/.test(text);
  const html = useMemo(() => {
    if (hasAnsi) return null;
    const parts = [];
    let lastIndex = 0;
    let match;
    const re = new RegExp(HIGHLIGHT_REGEX.source, 'gi');
    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index), style: {} });
      }
      for (let i = 0; i < PATTERNS.length; i++) {
        if (match[i + 1] !== undefined) {
          const p = PATTERNS[i];
          const color = LOG_COLORS[p.color] || '#e0e0e0';
          parts.push({ text: match[0], style: { color, fontWeight: p.bold ? 700 : 400 } });
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
    return <span style={{display:'block'}}><Ansi>{text}</Ansi></span>;
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
  const [leftOpen, setLeftOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lineCount, setLineCount] = useState(500);
  const [sortRecent, setSortRecent] = useState(true); // ls -lrt style: recent first
  const [logFilter, setLogFilter] = useState('all'); // 'all' | 'error' | 'warning' | 'info'
  const [logSearch, setLogSearch] = useState(''); // inline search within log
  const logEndRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    api.logs().then(d => {
      setEntries(d.entries);
      setCurrentPath(d.current_path);
    }).catch(e => toast.error(e.message));
  }, []);

  const navigate = (path) => {
    api.logs(path).then(d => {
      setEntries(d.entries);
      setCurrentPath(d.current_path);
      setLogContent('');
      setCurrentFile(null);
    }).catch(e => toast.error(e.message));
  };

  const viewFile = (file) => {
    setLoading(true);
    setCurrentFile(file);
    setLogFilter('all');
    setLogSearch('');
    api.logView(file, lineCount).then(d => {
      setLogContent(d.content);
      setLoading(false);
    }).catch(e => {
      toast.error(e.message);
      setLoading(false);
    });
  };

  const refreshLog = () => {
    if (currentFile) {
      setLoading(true);
      api.logView(currentFile, lineCount).then(d => {
        setLogContent(d.content);
        setLoading(false);
      }).catch(e => {
        toast.error(e.message);
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    if (logEndRef.current && logContent) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logContent]);

  const breadcrumbs = currentPath ? currentPath.split('/').filter(Boolean) : [];

  // Sort entries: directories first, then files sorted by name
  const sortedEntries = useMemo(() => {
    const dirs = entries.filter(e => e.type === 'directory');
    const files = entries.filter(e => e.type !== 'directory');
    if (sortRecent) {
      // ls -lrt style: recent last (or recent first based on name - we reverse)
      files.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      files.sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...dirs, ...files];
  }, [entries, sortRecent]);

  // Filter log lines based on severity filter
  const filteredLogLines = useMemo(() => {
    if (!logContent) return [];
    let lines = logContent.split('\n');

    // Apply severity filter
    if (logFilter === 'error') {
      lines = lines.filter(l =>
        /ERROR|SEVERE|FAIL|FAILED|FAILURE|CRITICAL|FATAL|exception|traceback|stack trace/i.test(l)
      );
    } else if (logFilter === 'warning') {
      lines = lines.filter(l =>
        /WARN|WARNING/i.test(l)
      );
    } else if (logFilter === 'info') {
      lines = lines.filter(l =>
        /INFO|NOTICE/i.test(l) && !/ERROR|SEVERE|FAIL|WARN|WARNING/i.test(l)
      );
    }

    // Apply inline search
    if (logSearch.trim()) {
      const searchLower = logSearch.toLowerCase();
      lines = lines.filter(l => l.toLowerCase().includes(searchLower));
    }

    return lines;
  }, [logContent, logFilter, logSearch]);

  // Count severity levels for badges
  const errorCount = useMemo(() => {
    if (!logContent) return 0;
    return logContent.split('\n').filter(l =>
      /ERROR|SEVERE|FAIL|FAILED|FAILURE|CRITICAL|FATAL/i.test(l)
    ).length;
  }, [logContent]);

  const warnCount = useMemo(() => {
    if (!logContent) return 0;
    return logContent.split('\n').filter(l =>
      /WARN|WARNING/i.test(l)
    ).length;
  }, [logContent]);

  const filteredContent = filteredLogLines.join('\n');

  return (
    <div style={{height: 'calc(100vh - 5rem)', display: 'flex', flexDirection: 'column'}}>
      <div className="page-header" style={{marginBottom: '.5rem'}}>
        <h2>로그 뷰어</h2>
        <div className="flex-row" style={{gap:'.5rem'}}>
          {currentFile && (
            <>
              <button onClick={refreshLog} disabled={loading} style={{fontSize:'.8rem'}}>
                🔄 새로고침
              </button>
              <select
                value={lineCount}
                onChange={e => {
                  const n = Number(e.target.value);
                  setLineCount(n);
                  if (currentFile) {
                    setLoading(true);
                    api.logView(currentFile, n).then(d => {
                      setLogContent(d.content);
                      setLoading(false);
                    }).catch(e => {
                      toast.error(e.message);
                      setLoading(false);
                    });
                  }
                }}
                style={{fontSize:'.78rem', padding:'.35rem .5rem'}}
              >
                <option value="100">100줄</option>
                <option value="500">500줄</option>
                <option value="1000">1,000줄</option>
                <option value="2000">2,000줄</option>
                <option value="5000">5,000줄</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Breadcrumbs */}
      {currentPath && (
        <div className="flex-row" style={{fontSize:'.75rem', color:'var(--text2)', gap:'.2rem', marginBottom:'.4rem', flexWrap:'wrap'}}>
          <span style={{cursor:'pointer', color:'var(--accent)', fontWeight:500}} onClick={() => navigate(null)}>root</span>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{display:'flex', alignItems:'center', gap:'.2rem'}}>
              <span>/</span>
              <span
                style={{cursor:i < breadcrumbs.length - 1 ? 'pointer' : 'default', color:i < breadcrumbs.length - 1 ? 'var(--accent)' : 'var(--text)', fontWeight:500}}
                onClick={() => { if (i < breadcrumbs.length - 1) navigate('/' + breadcrumbs.slice(0, i + 1).join('/')); }}
              >
                {crumb}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Split Panel */}
      <div style={{display:'flex', gap:0, flex:1, overflow:'hidden', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg2)'}}>

        {/* Left: File List */}
        <div style={{
          width: leftOpen ? 280 : 0,
          minWidth: leftOpen ? 200 : 0,
          overflow: 'hidden',
          transition: 'width 0.2s ease, min-width 0.2s ease',
          borderRight: leftOpen ? '1px solid var(--border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {leftOpen && (
            <>
              {/* Sort toggle */}
              <div style={{
                padding: '.35rem .7rem', borderBottom: '1px solid var(--border)',
                display: 'flex', gap: '.25rem', fontSize: '.7rem',
              }}>
                <button
                  onClick={() => setSortRecent(true)}
                  className={sortRecent ? 'primary' : ''}
                  style={{flex:1, fontSize:'.68rem', padding:'.25rem .35rem'}}
                  title="최근 파일 먼저 (ls -lrt 스타일, 이름 역순)"
                >
                  🕐 최근순
                </button>
                <button
                  onClick={() => setSortRecent(false)}
                  className={!sortRecent ? 'primary' : ''}
                  style={{flex:1, fontSize:'.68rem', padding:'.25rem .35rem'}}
                  title="이름순 정렬"
                >
                  🔤 이름순
                </button>
              </div>
              <div style={{flex:1, overflowY:'auto'}}>
                {sortedEntries.map((e, i) => (
                  <div key={i}
                    style={{
                      cursor:'pointer',
                      padding:'.45rem .7rem',
                      fontSize:'.82rem',
                      display:'flex',
                      justifyContent:'space-between',
                      alignItems:'center',
                      borderBottom:'1px solid var(--border)',
                      background: currentFile === e.full_path ? 'rgba(49,130,246,0.08)' : 'transparent',
                      borderLeft: currentFile === e.full_path ? '3px solid var(--accent)' : '3px solid transparent',
                      transition: 'background 0.1s',
                    }}
                    onClick={() => e.type === 'directory' ? navigate(e.full_path) : viewFile(e.full_path)}
                    onMouseEnter={ev => { if (ev.currentTarget.style.background === 'transparent') ev.currentTarget.style.background = 'var(--bg3)'; }}
                    onMouseLeave={ev => { if (ev.currentTarget.style.background === 'var(--bg3)') ev.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'.4rem'}}>
                      <span style={{flexShrink:0, fontSize:'.85rem'}}>{e.type === 'directory' ? '📁' : '📄'}</span>
                      <span>{e.name}</span>
                    </span>
                    <span style={{fontSize:'.68rem', color:'var(--text2)', flexShrink:0, marginLeft:'.5rem'}}>{e.size || ''}</span>
                  </div>
                ))}
                {entries.length === 0 && (
                  <div style={{textAlign:'center', color:'var(--text2)', padding:'2rem', fontSize:'.8rem'}}>
                    파일이 없습니다
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Divider Toggle */}
        <button
          onClick={() => setLeftOpen(o => !o)}
          title={leftOpen ? '목록 접기' : '목록 펼치기'}
          style={{
            flexShrink: 0,
            width: 24,
            border: 'none',
            background: 'var(--bg3)',
            cursor: 'pointer',
            color: 'var(--text2)',
            fontSize: '.65rem',
            padding: 0,
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={ev => ev.currentTarget.style.background = 'var(--border)'}
          onMouseLeave={ev => ev.currentTarget.style.background = 'var(--bg3)'}
        >
          {leftOpen ? '◀' : '▶'}
        </button>

        {/* Right: Log Viewer */}
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0}}>
          {/* Toolbar */}
          <div className="log-toolbar" style={{flexShrink:0}}>
            <div style={{display:'flex', alignItems:'center', gap:'.5rem'}}>
              <span style={{fontWeight:600, fontSize:'.82rem'}}>
                {currentFile ? `📄 ${currentFile.split('/').pop()}` : 'Log Viewer'}
              </span>
              {currentFile && <span style={{fontSize:'.68rem', opacity:.6}}>{currentFile}</span>}
              {loading && <span style={{fontSize:".7rem", opacity:0.7}}>Loading...</span>}
            </div>
            <div className="flex-row" style={{gap:'.4rem'}}>
              {/* ERROR/WARNING filter buttons */}
              {currentFile && (
                <>
                  <button
                    onClick={() => setLogFilter('all')}
                    className={logFilter === 'all' ? 'primary' : ''}
                    style={{fontSize:'.68rem', padding:'.2rem .5rem'}}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setLogFilter('error')}
                    className={logFilter === 'error' ? 'primary' : ''}
                    style={{
                      fontSize:'.68rem', padding:'.2rem .5rem',
                      background: logFilter === 'error' ? 'var(--red)' : undefined,
                      borderColor: logFilter === 'error' ? 'var(--red)' : undefined,
                    }}
                    title="ERROR / FAIL / CRITICAL 라인만 표시"
                  >
                    🔴 ERROR ({errorCount})
                  </button>
                  <button
                    onClick={() => setLogFilter('warning')}
                    className={logFilter === 'warning' ? 'primary' : ''}
                    style={{
                      fontSize:'.68rem', padding:'.2rem .5rem',
                      background: logFilter === 'warning' ? 'var(--yellow)' : undefined,
                      borderColor: logFilter === 'warning' ? 'var(--yellow)' : undefined,
                      color: logFilter === 'warning' ? '#000' : undefined,
                    }}
                    title="WARNING 라인만 표시"
                  >
                    🟡 WARNING ({warnCount})
                  </button>
                  <button
                    onClick={() => setLogFilter('info')}
                    className={logFilter === 'info' ? 'primary' : ''}
                    style={{fontSize:'.68rem', padding:'.2rem .5rem'}}
                    title="INFO / NOTICE 라인만 표시"
                  >
                    🔵 INFO
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Inline Search Bar */}
          {currentFile && (
            <div style={{
              padding:'.3rem .8rem', background:'#1e2030',
              borderBottom:'1px solid #2e3040', display:'flex', gap:'.4rem', alignItems:'center',
            }}>
              <span style={{fontSize:'.68rem', color:'#888', flexShrink:0}}>🔍</span>
              <input
                placeholder="로그 내용 검색..."
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                style={{
                  flex:1, fontSize:'.72rem', padding:'.2rem .5rem',
                  background:'#14161f', border:'1px solid #2e3040', color:'#e0e0e0',
                  borderRadius:'4px', outline:'none',
                }}
              />
              {logSearch && (
                <span style={{fontSize:'.68rem', color:'#888', flexShrink:0}}>
                  {filteredLogLines.length} lines
                </span>
              )}
            </div>
          )}

          {/* Log Content */}
          <div style={{
            flex:1, overflow:'auto', padding:'.6rem .85rem',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontSize:'.8rem', lineHeight:1.55, tabSize:4,
            background: '#1a1a2e', color: '#e0e0e0',
          }}>
            {logContent ? (
              <>
                {logFilter !== 'all' || logSearch ? (
                  <pre style={{margin:0, whiteSpace:'pre-wrap', wordBreak:'break-all', fontFamily:'inherit', fontSize:'inherit', lineHeight:'inherit'}}>
                    <LogHighlighter text={filteredContent} />
                  </pre>
                ) : (
                  <pre style={{margin:0, whiteSpace:'pre-wrap', wordBreak:'break-all', fontFamily:'inherit', fontSize:'inherit', lineHeight:'inherit'}}>
                    <LogHighlighter text={logContent} />
                  </pre>
                )}
              </>
            ) : (
              <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#666', gap:'.5rem'}}>
                <span style={{fontSize:'2.5rem'}}>📋</span>
                <span style={{fontSize:'.9rem'}}>로그 파일을 선택하세요</span>
                <span style={{fontSize:'.75rem', opacity:.6}}>왼쪽 목록에서 파일을 클릭하면 내용이 표시됩니다</span>
              </div>
            )}
            <div ref={logEndRef} />
          </div>

          {/* Status bar */}
          <div className="log-statusbar" style={{flexShrink:0}}>
            <span>
              {currentFile
                ? `${currentFile.split('/').pop()} · ${filteredLogLines.length.toLocaleString()} / ${logContent ? logContent.split('\n').length.toLocaleString() : 0} lines`
                : 'Ready'}
            </span>
            <span>UTF-8 | ANSI On {logFilter !== 'all' ? `| Filter: ${logFilter}` : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
