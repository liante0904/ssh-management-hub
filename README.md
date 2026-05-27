# SSH Management Hub (Frontend)

관리자 대시보드 — 사용자 관리, 리포트 관리, PDF 아카이브, DB 조회/SQL 쿼리, 로그 뷰어, 진행 현황

## 기술 스택

- React 18 + React Router 6
- Vite 4 (빌드)
- Vitest + Testing Library (테스트)
- Netlify (호스팅)

## 페이지 구성

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 대시보드 | OCI(배포)/OCI2(프로덕션) 서버 상태, 빠른 메뉴, 시스템/리포트 통계 |
| `/users` | 사용자 관리 | Telegram 사용자 목록, 상태/권한 관리 |
| `/reports` | 리포트 관리 | 증권사 리포트 동기화 상태, PDF 재처리 |
| `/pdf-archive` | PDF 관리 | PDF 아카이브 현황/통계/재처리 (tbl_sec_reports_pdf_archive) |
| `/firms` | 증권사 관리 | 증권사 및 게시판 설정 |
| `/database` | DB 뷰어 | PostgreSQL 테이블 조회 + 커스텀 SQL 쿼리 (Ctrl+Enter) |
| `/logs` | 로그 뷰어 | 서버 로그 파일 탐색, ANSI 컬러 렌더링, IDE 스타일 분할 패널 |
| `/progress` | 진행 현황 | 13개 연동 레포지토리 마크다운 파일 뷰어 |

## 개발

```bash
npm install
npm run dev        # localhost:5175
npm run build      # 프로덕션 빌드
npm test           # vitest (38개 테스트)
```

## 인증

- Telegram Login Widget 으로 관리자 인증
- 비상 로그인: JWT Secret Key 입력

## API 프록시

Netlify → `ssh-oci.duckdns.org` → nginx → FastAPI 백엔드

## 연동 레포지토리 (진행 현황 페이지)

| 레포 | 설명 |
|------|------|
| ssh-management-hub-fastAPI | FastAPI 백엔드 |
| ssh-management-hub | React 프론트엔드 |
| dart-scraper-bot | DART 공시 데이터 수집 |
| ssh-private-hub | 비공개 허브 프론트엔드 |
| ssh-private-hub-fastAPI | 비공개 허브 백엔드 |
| ssh-reports-hub | 리포트 허브 프론트엔드 |
| ssh-reports-hub-fastAPI | 리포트 허브 백엔드 |
| kr-earnings-revision-bot | 실적 수정 추적 |
| ssh-reports-scraper | 리포트 스크래퍼 |
| naver-stock-news | 네이버 증권 뉴스 |
| hankyung-consensus-report | 한경 컨센서스 리포트 |
| naver-stock-report | 네이버 증권 리포트 |
| fnguide-report-summary-bot | FnGuide 리포트 요약 |
