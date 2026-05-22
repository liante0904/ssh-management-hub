import { useState, useEffect } from 'react';

const REPOS = [
  { owner: 'liante0904', repo: 'ssh-management-hub-fastAPI', label: 'Management Hub API', desc: 'FastAPI 백엔드 서버' },
  { owner: 'liante0904', repo: 'ssh-management-hub', label: 'Management Hub Frontend', desc: 'React 프론트엔드' },
  { owner: 'liante0904', repo: 'dart-scraper-bot', label: 'DART Scraper Bot', desc: 'DART 공시 데이터 수집' },
  { owner: 'liante0904', repo: 'ssh-private-hub', label: 'Private Hub Frontend', desc: '비공개 허브 프론트엔드' },
  { owner: 'liante0904', repo: 'ssh-private-hub-fastAPI', label: 'Private Hub API', desc: '비공개 허브 백엔드' },
  { owner: 'liante0904', repo: 'ssh-reports-hub', label: 'Reports Hub Frontend', desc: '리포트 허브 프론트엔드' },
  { owner: 'liante0904', repo: 'ssh-reports-hub-fastAPI', label: 'Reports Hub API', desc: '리포트 허브 백엔드' },
  { owner: 'liante0904', repo: 'kr-earnings-revision-bot', label: 'KR Earnings Revision', desc: '실적 수정 추적 봇' },
  { owner: 'liante0904', repo: 'ssh-reports-scraper', label: 'Reports Scraper', desc: '리포트 스크래퍼' },
  { owner: 'liante0904', repo: 'naver-stock-news', label: 'Naver Stock News', desc: '네이버 증권 뉴스 수집' },
  { owner: 'liante0904', repo: 'hankyung-consensus-report', label: '한경 컨센서스 리포트', desc: '한국경제 컨센서스 리포트' },
  { owner: 'liante0904', repo: 'naver-stock-report', label: 'Naver Stock Report', desc: '네이버 증권 리포트' },
  { owner: 'liante0904', repo: 'fnguide-report-summary-bot', label: 'FnGuide Summary Bot', desc: 'FnGuide 리포트 요약 봇' },
];

function RepoCard({ repo, owner, label, desc }) {
  const [readme, setReadme] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [buildStatus, setBuildStatus] = useState('unknown');

  useEffect(() => {
    // Fetch README from GitHub raw
    const urls = [
      `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`,
      `https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`,
    ];

    async function fetchReadme() {
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const text = await res.text();
            setReadme(text);
            // Check for CI badges in README
            if (text.includes('passing') || text.includes('Actions/workflows') && text.includes('success')) {
              setBuildStatus('passing');
            }
            setLoading(false);
            return;
          }
        } catch {}
      }
      setError('README 없음');
      setLoading(false);
    }

    fetchReadme();
  }, [owner, repo]);

  // Extract progress-related content from README
  const progressLines = readme
    .split('\n')
    .filter(line =>
      line.toLowerCase().includes('progress') ||
      line.toLowerCase().includes('todo') ||
      line.toLowerCase().includes('done') ||
      line.toLowerCase().includes('진행') ||
      line.toLowerCase().includes('완료') ||
      line.toLowerCase().includes('예정') ||
      line.includes('✅') ||
      line.includes('⬜') ||
      line.includes('🔲') ||
      line.includes('☑') ||
      line.includes('✔') ||
      line.includes('⏳')
    );

  const hasProgress = progressLines.length > 0;
  const summaryLines = readme.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('!')).slice(0, 5);

  return (
    <div className="card" style={{padding: '1.25rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.75rem'}}>
        <div style={{flex: 1}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem'}}>
            <h3 style={{fontSize: '1rem', margin: 0}}>{label}</h3>
            <a
              href={`https://github.com/${owner}/${repo}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{fontSize: '.75rem', color: 'var(--accent)', textDecoration: 'none'}}
            >
              🔗
            </a>
          </div>
          <p style={{fontSize: '.8rem', color: 'var(--text2)', margin: 0}}>{desc}</p>
        </div>
        <span style={{
          fontSize: '.7rem', padding: '.2rem .5rem', borderRadius: '4px',
          background: loading ? 'var(--bg3)' : error ? 'rgba(248,113,113,.15)' : 'rgba(74,222,128,.15)',
          color: loading ? 'var(--text2)' : error ? 'var(--red)' : 'var(--green)',
          fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          {loading ? '⏳' : error ? '❌' : '✅'}
        </span>
      </div>

      {/* Progress Section */}
      {!loading && !error && hasProgress && (
        <div style={{marginTop: '.75rem', background: 'var(--bg3)', borderRadius: '8px', padding: '.75rem'}}>
          <div
            style={{fontSize: '.75rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '.5rem', cursor: 'pointer'}}
            onClick={() => setExpanded(!expanded)}
          >
            📌 진행 상황 {expanded ? '▲' : '▼'}
          </div>
          {expanded && (
            <div style={{fontSize: '.8rem', lineHeight: 1.6, color: 'var(--text)'}}>
              {progressLines.map((line, i) => (
                <div key={i} style={{padding: '.15rem 0'}}>{line.trim()}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {!loading && !error && !hasProgress && summaryLines.length > 0 && (
        <div style={{marginTop: '.75rem'}}>
          <div
            style={{fontSize: '.75rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '.5rem', cursor: 'pointer'}}
            onClick={() => setExpanded(!expanded)}
          >
            📝 README 요약 {expanded ? '▲' : '▼'}
          </div>
          {expanded && (
            <div style={{fontSize: '.8rem', lineHeight: 1.6, color: 'var(--text)'}}>
              {summaryLines.map((line, i) => (
                <div key={i} style={{padding: '.15rem 0'}}>{line.trim()}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{marginTop: '.5rem', fontSize: '.8rem', color: 'var(--text2)'}}>
          {error}
        </div>
      )}
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
        각 레포지토리의 README에서 진행 상황 관련 항목을 자동으로 추출하여 표시합니다.
        <br />카드를 클릭해 상세 내용을 확인하세요.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '1rem',
      }}>
        {REPOS.map(r => (
          <RepoCard key={r.repo} {...r} />
        ))}
      </div>
    </div>
  );
}
