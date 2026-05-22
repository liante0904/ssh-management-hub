import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

function RepoPanel({ owner, repo, label }) {
  const [mdFiles, setMdFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFile, setActiveFile] = useState(null);
  const [content, setContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);

  // Fetch list of .md files via GitHub API
  useEffect(() => {
    const branches = ['main', 'master'];
    
    async function fetchTree() {
      for (const branch of branches) {
        try {
          const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
          );
          if (!res.ok) continue;
          const data = await res.json();
          const files = (data.tree || [])
            .filter(f => f.type === 'blob' && f.path.endsWith('.md'))
            .map(f => ({ path: f.path, name: f.path.split('/').pop() }))
            .sort((a, b) => {
              // README.md first, then alphabetical
              if (a.name === 'README.md') return -1;
              if (b.name === 'README.md') return 1;
              return a.path.localeCompare(b.path);
            });
          if (files.length > 0) {
            setMdFiles(files);
            // Auto-select README
            const readme = files.find(f => f.name === 'README.md') || files[0];
            setActiveFile(readme);
            setLoading(false);
            return;
          }
        } catch {}
      }
      setError('마크다운 파일 없음');
      setLoading(false);
    }

    fetchTree();
  }, [owner, repo]);

  // Fetch file content when active file changes
  useEffect(() => {
    if (!activeFile) return;
    setContentLoading(true);
    const branches = ['main', 'master'];
    
    async function fetchContent() {
      for (const branch of branches) {
        try {
          const res = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${activeFile.path}`
          );
          if (!res.ok) continue;
          const text = await res.text();
          setContent(text);
          setContentLoading(false);
          return;
        } catch {}
      }
      setContent('*파일을 불러올 수 없습니다*');
      setContentLoading(false);
    }

    fetchContent();
  }, [activeFile, owner, repo]);

  return (
    <div className="card" style={{padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '600px'}}>
      {/* Header */}
      <div style={{
        padding: '.85rem 1.1rem', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--bg3)',
      }}>
        <div>
          <h3 style={{fontSize: '.95rem', margin: 0}}>{label}</h3>
          <a href={`https://github.com/${owner}/${repo}`} target="_blank" rel="noopener noreferrer"
            style={{fontSize: '.7rem', color: 'var(--accent)', textDecoration: 'none'}}>
            {owner}/{repo} 🔗
          </a>
        </div>
        <span style={{fontSize: '.7rem', color: 'var(--text2)'}}>
          {loading ? '⏳' : error ? '❌' : `${mdFiles.length}개 파일`}
        </span>
      </div>

      {/* File tabs */}
      {mdFiles.length > 0 && (
        <div style={{
          display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border)',
          gap: 0, flexShrink: 0,
        }}>
          {mdFiles.map(f => (
            <button
              key={f.path}
              onClick={() => setActiveFile(f)}
              title={f.path}
              style={{
                padding: '.4rem .7rem', fontSize: '.75rem', whiteSpace: 'nowrap',
                background: activeFile?.path === f.path ? 'var(--bg2)' : 'transparent',
                border: 'none', borderBottom: activeFile?.path === f.path ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeFile?.path === f.path ? 'var(--accent)' : 'var(--text2)',
                cursor: 'pointer', borderRadius: 0, fontWeight: activeFile?.path === f.path ? 600 : 400,
              }}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '1rem 1.25rem',
        fontSize: '.85rem', lineHeight: 1.7,
        color: 'var(--text)',
      }}>
        {loading || contentLoading ? (
          <div style={{textAlign:'center',padding:'2rem',color:'var(--text2)'}}>⏳ 불러오는 중...</div>
        ) : error ? (
          <div style={{textAlign:'center',padding:'2rem',color:'var(--text2)'}}>{error}</div>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Progress() {
  return (
    <div style={{overflowY: 'auto', maxHeight: 'calc(100vh - 6rem)', paddingRight: '0.5rem'}}>
      <div className="page-header">
        <h2>진행 현황</h2>
        <span style={{fontSize: '.85rem', color: 'var(--text2)'}}>
          {REPOS.length}개 레포지토리
        </span>
      </div>

      <p style={{fontSize: '.85rem', color: 'var(--text2)', marginBottom: '1.25rem'}}>
        각 레포지토리의 마크다운(.md) 파일을 GitHub에서 실시간으로 불러옵니다.
        <br />탭을 클릭해 파일을 전환하고 스크롤로 전체 내용을 확인하세요.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
        gap: '1rem',
      }}>
        {REPOS.map(r => (
          <RepoPanel key={r.repo} {...r} />
        ))}
      </div>
    </div>
  );
}
