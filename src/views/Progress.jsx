import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';

const CANDIDATE_FILES = [
  'README.md', 'PROGRESS.md', 'TODO.md', 'CHANGELOG.md',
  'CONTRIBUTING.md', 'AGENTS.md', 'API_REFERENCE.md',
  'docs/README.md', 'docs/PROGRESS.md', '.github/PROGRESS.md',
];

function ghHeaders() {
  const h = {};
  if (GITHUB_TOKEN) h['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  return h;
}

const REPOS = [
  { owner: 'liante0904', repo: 'ssh-management-hub-fastAPI', label: 'Management Hub API' },
  { owner: 'liante0904', repo: 'ssh-management-hub', label: 'Management Hub Frontend' },
  { owner: 'liante0904', repo: 'dart-scraper-bot', label: 'DART Scraper Bot' },
  { owner: 'liante0904', repo: 'ssh-private-hub', label: 'Private Hub Frontend' },
  { owner: 'liante0904', repo: 'ssh-private-hub-fastAPI', label: 'Private Hub API' },
  { owner: 'liante0904', repo: 'ssh-reports-hub', label: 'Reports Hub Frontend' },
  { owner: 'liante0904', repo: 'ssh-reports-hub-fastAPI', label: 'Reports Hub API' },
  { owner: 'liante0904', repo: 'kr-earnings-revision-bot', label: 'KR Earnings Revision' },
  { owner: 'liante0904', repo: 'ssh-reports-scraper', label: 'Reports Scraper' },
  { owner: 'liante0904', repo: 'naver-stock-news', label: 'Naver Stock News' },
  { owner: 'liante0904', repo: 'hankyung-consensus-report', label: '한경 컨센서스' },
  { owner: 'liante0904', repo: 'naver-stock-report', label: 'Naver Stock Report' },
  { owner: 'liante0904', repo: 'fnguide-report-summary-bot', label: 'FnGuide Summary' },
];

const CACHE_TTL = 30 * 60 * 1000;

function cacheKey(owner, repo) { return `mh_progress_${owner}_${repo}`; }

function loadCache(owner, repo) {
  try {
    const raw = localStorage.getItem(cacheKey(owner, repo));
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (Date.now() - d.ts > CACHE_TTL) return null;
    return d.files;
  } catch { return null; }
}

function saveCache(owner, repo, files) {
  try { localStorage.setItem(cacheKey(owner, repo), JSON.stringify({ files, ts: Date.now() })); } catch {}
}

// ── Modal ──────────────────────────────────────────
function MarkdownModal({ file, content, loading, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(2px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem'}} onClick={onClose}>
      <div style={{background:'var(--bg2)',borderRadius:'12px',width:'100%',maxWidth:'900px',height:'90vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'.85rem 1.25rem',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg3)',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
            <span style={{fontSize:'1.2rem'}}>📄</span>
            <span style={{fontWeight:600,fontSize:'.95rem'}}>{file?.name}</span>
            {file&&<span style={{fontSize:'.75rem',color:'var(--text2)'}}>{file.path}</span>}
          </div>
          <button onClick={onClose} style={{background:'transparent',border:'none',fontSize:'1.3rem',color:'var(--text2)',cursor:'pointer',padding:'.25rem .5rem',borderRadius:'6px'}}>✕</button>
        </div>
        <div style={{flex:1,overflow:'auto',padding:'1.5rem 2rem',fontSize:'.88rem',lineHeight:1.8}}>
          {loading ? <div style={{textAlign:'center',padding:'3rem',color:'var(--text2)'}}>⏳ 불러오는 중...</div>
          : <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div>}
        </div>
      </div>
    </div>
  );
}

// ── Repo Row ───────────────────────────────────────
function RepoRow({ owner, repo, label }) {
  const cached = loadCache(owner, repo);
  const [mdFiles, setMdFiles] = useState(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [probing, setProbing] = useState(false);
  const [modalFile, setModalFile] = useState(null);
  const [modalContent, setModalContent] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const probe = useCallback(async (forceFull = false) => {
    const branches = ['main', 'master'];
    const current = forceFull ? [] : (loadCache(owner, repo) || []);
    const known = new Set(current.map(f => f.path));
    const toProbe = forceFull ? CANDIDATE_FILES : CANDIDATE_FILES.filter(f => !known.has(f));

    if (toProbe.length === 0) { setLoading(false); return; }

    setProbing(true);
    const found = [...current];

    for (const file of toProbe) {
      for (const branch of branches) {
        try {
          const url = `https://api.github.com/repos/${owner}/${repo}/contents/${file}?ref=${branch}`;
          if ((await fetch(url, { headers: ghHeaders() })).ok) { found.push({ path: file, name: file.split('/').pop() }); break; }
        } catch {}
      }
      await new Promise(r => setTimeout(r, 120));
    }

    found.sort((a, b) => a.name === 'README.md' ? -1 : b.name === 'README.md' ? 1 : a.path.localeCompare(b.path));
    setMdFiles(found);
    saveCache(owner, repo, found);
    setLoading(false);
    setProbing(false);
  }, [owner, repo]);

  useEffect(() => { probe(cached === null); }, []);

  const openFile = async (file) => {
    setModalFile(file); setModalLoading(true); setModalContent('');
    for (const branch of ['main', 'master']) {
      try {
        const headers = { ...ghHeaders(), Accept: 'application/vnd.github.v3.raw' };
        const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`, { headers });
        if (!r.ok) continue;
        setModalContent(await r.text()); setModalLoading(false); return;
      } catch {}
    }
    setModalContent('*파일을 불러올 수 없습니다*'); setModalLoading(false);
  };

  return (
    <>
      <div style={{display:'flex',alignItems:'flex-start',gap:'1rem',padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)',transition:'background 0.15s'}}
        onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
        onMouseLeave={e=>e.currentTarget.style.background=''}>
        <div style={{minWidth:'180px',maxWidth:'200px'}}>
          <div style={{fontWeight:700,fontSize:'.93rem',marginBottom:'.15rem'}}>{label}</div>
          <a href={`https://github.com/${owner}/${repo}`} target="_blank" rel="noopener noreferrer" style={{fontSize:'.73rem',color:'var(--accent)',textDecoration:'none'}}>{owner}/{repo}</a>
        </div>
        <div style={{flex:1,display:'flex',flexWrap:'wrap',gap:'.35rem',alignItems:'center'}}>
          {loading && !cached ? <span style={{fontSize:'.8rem',color:'var(--text2)'}}>⏳ 탐색 중...</span>
          : mdFiles.length === 0 ? <span style={{fontSize:'.78rem',color:'var(--text2)'}}>마크다운 파일 없음</span>
          : mdFiles.map(f => (
            <button key={f.path} onClick={()=>openFile(f)} title={f.path}
              style={{padding:'.3rem .6rem',fontSize:'.76rem',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'5px',cursor:'pointer',color:'var(--text)',whiteSpace:'nowrap',fontWeight:500}}>
              📄 {f.name}
            </button>
          ))}
          {probing && <span style={{fontSize:'.7rem',color:'var(--text2)'}}>🔍</span>}
          <button onClick={()=>probe(true)} title="전체 재탐색"
            style={{padding:'.2rem .4rem',fontSize:'.7rem',background:'transparent',border:'1px dashed var(--border)',borderRadius:'4px',cursor:'pointer',color:'var(--text2)'}}>
            🔄
          </button>
        </div>
      </div>
      {modalFile && <MarkdownModal file={modalFile} content={modalContent} loading={modalLoading} onClose={()=>setModalFile(null)} />}
    </>
  );
}

// ── Page ───────────────────────────────────────────
export default function Progress() {
  const clearCache = () => { REPOS.forEach(r => localStorage.removeItem(cacheKey(r.owner, r.repo))); window.location.reload(); };

  return (
    <div style={{overflowY:'auto',maxHeight:'calc(100vh - 6rem)',paddingRight:'0.5rem'}}>
      <div className="page-header">
        <h2>진행 현황</h2>
        <div className="flex-row gap1">
          <span style={{fontSize:'.85rem',color:'var(--text2)'}}>{REPOS.length}개 레포지토리</span>
          <button onClick={clearCache} style={{fontSize:'.75rem',padding:'.25rem .5rem'}} title="캐시 초기화">🗑️ 캐시 초기화</button>
        </div>
      </div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',gap:'1rem',padding:'.7rem 1.25rem',background:'var(--bg3)',borderBottom:'2px solid var(--border)',fontSize:'.78rem',fontWeight:600,color:'var(--text2)'}}>
          <div style={{minWidth:'180px',maxWidth:'200px'}}>레포지토리</div>
          <div style={{flex:1}}>마크다운 파일</div>
        </div>
        {REPOS.map(r => <RepoRow key={r.repo} {...r} />)}
      </div>
      <p style={{fontSize:'.75rem',color:'var(--text2)',marginTop:'.75rem',textAlign:'center'}}>
        발견된 파일은 30분 캐싱 • 누락 파일만 백그라운드 탐색 • 🔄 전체 재탐색 • 🗑️ 캐시 초기화
      </p>
    </div>
  );
}
