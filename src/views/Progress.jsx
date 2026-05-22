import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 탐색할 마크다운 파일명 목록 (GitHub API 없이 raw.githubusercontent.com HEAD 요청)
const CANDIDATE_FILES = [
  'README.md', 'PROGRESS.md', 'TODO.md', 'CHANGELOG.md',
  'CONTRIBUTING.md', 'AGENTS.md', 'API_REFERENCE.md',
  'docs/README.md', 'docs/PROGRESS.md', '.github/PROGRESS.md',
];

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

// ── Modal ──────────────────────────────────────────
function MarkdownModal({ file, content, loading, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg2)', borderRadius: '12px',
        width: '100%', maxWidth: '900px', height: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div style={{
          padding: '.85rem 1.25rem', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg3)', flexShrink: 0,
        }}>
          <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
            <span style={{fontSize:'1.2rem'}}>📄</span>
            <span style={{fontWeight:600,fontSize:'.95rem'}}>{file?.name}</span>
            {file && <span style={{fontSize:'.75rem',color:'var(--text2)'}}>{file.path}</span>}
          </div>
          <button onClick={onClose} style={{
            background:'transparent',border:'none',fontSize:'1.3rem',
            color:'var(--text2)',cursor:'pointer',padding:'.25rem .5rem',
            borderRadius:'6px',
          }}>✕</button>
        </div>

        {/* Modal content */}
        <div style={{
          flex: 1, overflow: 'auto', padding: '1.5rem 2rem',
          fontSize: '.88rem', lineHeight: 1.8,
        }}>
          {loading ? (
            <div style={{textAlign:'center',padding:'3rem',color:'var(--text2)'}}>⏳ 불러오는 중...</div>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Repo Row ───────────────────────────────────────
function RepoRow({ owner, repo, label }) {
  const [mdFiles, setMdFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalFile, setModalFile] = useState(null);
  const [modalContent, setModalContent] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // raw.githubusercontent.com 에서 HEAD 요청으로 파일 존재 확인 (API rate limit 없음)
  useEffect(() => {
    let cancelled = false;
    const branches = ['main', 'master'];

    async function probe() {
      const found = [];
      for (const file of CANDIDATE_FILES) {
        if (cancelled) return;
        for (const branch of branches) {
          try {
            const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`;
            const res = await fetch(url, { method: 'HEAD' });
            if (res.ok) {
              found.push({ path: file, name: file.split('/').pop() });
              break;
            }
          } catch {}
        }
        if (!cancelled) await new Promise(r => setTimeout(r, 60));
      }
      if (!cancelled) {
        setMdFiles(found);
        setLoading(false);
      }
    }

    probe();
    return () => { cancelled = true; };
  }, [owner, repo]);

  // Open modal with file content
  const openFile = async (file) => {
    setModalFile(file);
    setModalLoading(true);
    setModalContent('');
    const branches = ['main', 'master'];
    for (const branch of branches) {
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`
        );
        if (!res.ok) continue;
        setModalContent(await res.text());
        setModalLoading(false);
        return;
      } catch {}
    }
    setModalContent('*파일을 불러올 수 없습니다*');
    setModalLoading(false);
  };

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '1rem',
        padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
        transition: 'background 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
        onMouseLeave={e => e.currentTarget.style.background = ''}
      >
        {/* Repo info */}
        <div style={{minWidth: '180px', maxWidth: '200px'}}>
          <div style={{fontWeight: 700, fontSize: '.93rem', marginBottom: '.15rem'}}>{label}</div>
          <a href={`https://github.com/${owner}/${repo}`} target="_blank" rel="noopener noreferrer"
            style={{fontSize: '.73rem', color: 'var(--accent)', textDecoration: 'none'}}>
            {owner}/{repo}
          </a>
        </div>

        {/* File tags */}
        <div style={{flex: 1, display: 'flex', flexWrap: 'wrap', gap: '.35rem', alignItems: 'center'}}>
          {loading ? (
            <span style={{fontSize:'.8rem',color:'var(--text2)'}}>⏳</span>
          ) : mdFiles.length === 0 ? (
            <span style={{fontSize:'.78rem',color:'var(--text2)'}}>마크다운 파일 없음</span>
          ) : (
            mdFiles.map(f => (
              <button
                key={f.path}
                onClick={() => openFile(f)}
                title={f.path}
                style={{
                  padding: '.3rem .6rem', fontSize: '.76rem',
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: '5px', cursor: 'pointer', color: 'var(--text)',
                  whiteSpace: 'nowrap', fontWeight: 500,
                }}
              >
                📄 {f.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {modalFile && (
        <MarkdownModal
          file={modalFile}
          content={modalContent}
          loading={modalLoading}
          onClose={() => setModalFile(null)}
        />
      )}
    </>
  );
}

// ── Page ───────────────────────────────────────────
export default function Progress() {
  return (
    <div style={{overflowY: 'auto', maxHeight: 'calc(100vh - 6rem)', paddingRight: '0.5rem'}}>
      <div className="page-header">
        <h2>진행 현황</h2>
        <span style={{fontSize: '.85rem', color: 'var(--text2)'}}>{REPOS.length}개 레포지토리</span>
      </div>

      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        {/* List header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '.7rem 1.25rem', background: 'var(--bg3)',
          borderBottom: '2px solid var(--border)',
          fontSize: '.78rem', fontWeight: 600, color: 'var(--text2)',
        }}>
          <div style={{minWidth: '180px', maxWidth: '200px'}}>레포지토리</div>
          <div style={{flex: 1}}>마크다운 파일</div>
        </div>

        {REPOS.map(r => (
          <RepoRow key={r.repo} {...r} />
        ))}
      </div>

      <p style={{fontSize: '.78rem', color: 'var(--text2)', marginTop: '.75rem', textAlign: 'center'}}>
        파일을 클릭하면 전체 화면으로 마크다운 내용을 볼 수 있습니다 • ESC 키로 닫기
      </p>
    </div>
  );
}
