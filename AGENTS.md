# AGENTS.md

이 문서는 **SSH Management Hub** 프로젝트를 다루는 AI 에이전트와 개발자를 위한 가이드라인입니다.

## 🚀 프로젝트 개요
SSH Management Hub는 내부 관리 도구로, 사용자, 리포트, 증권사 및 시스템 로그 등을 관리하는 프론트엔드 애플리케이션입니다.

## 🛠 기술 스택
- **Framework**: React 19
- **Build Tool**: Vite
- **State Management**: React Context API (`AuthContext`)
- **Styling**: Vanilla CSS (CSS Variables 기반 테마 적용)
- **Testing**: Vitest, React Testing Library
- **Authentication**: Telegram Login 위젯 연동

## 📂 주요 구조
- `src/lib/api.js`: 모든 백엔드 API 통신을 담당하는 중앙 모듈.
- `src/context/AuthContext.jsx`: 인증 상태 및 토큰 관리.
- `src/views/`: 각 메뉴별 메인 페이지 컴포넌트.
- `src/components/`: 재사용 가능한 UI 컴포넌트 및 인증 관련 컴포넌트.
- `src/__tests__/`: 유닛 및 통합 테스트 코드.

## 📋 에이전트 가이드라인 (Mandates)
에이전트는 프로젝트 작업을 수행할 때 다음 규칙을 반드시 준수해야 합니다.

1. **CRUD 제한**: 조회(Read)를 제외한 생성(Create), 수정(Update), 삭제(Delete) 작업은 사용자의 명시적인 지시나 승인 없이는 절대 수행하지 않습니다. (메인 브랜치 커밋 포함)
2. **코드 맥락 유지**: 전체 코드 맥락을 정확히 읽고 이해한 후 작업을 진행하며, 기존 주석은 삭제하지 않고 유지합니다.
3. **스타일 가이드**: CSS 프레임워크(Tailwind 등)를 임의로 도입하지 않으며, 기존의 Vanilla CSS 및 변수 시스템을 활용합니다.
4. **보안**: API 키, 비밀번호, 세션 토큰 등 민감한 정보가 로그나 코드에 노출되지 않도록 주의합니다.
5. **예의**: 항상 예의를 갖추어 응대하며, 반말이나 농담은 지양합니다.

## 🧪 테스트 및 품질 관리
- 새로운 기능을 추가하거나 버그를 수정할 때는 반드시 관련 테스트를 업데이트하거나 새로 작성합니다.
- `npm run test` 또는 `npm run verify`를 통해 빌드 및 테스트 성공 여부를 확인합니다.

## ⚠️ LLM 혼동 가능성 분석 (LLM Confusion Hotspots)

이 섹션은 AI 에이전트(LLM)가 이 프로젝트를 다룰 때 혼동하기 쉬운 포인트를 사전에 문서화한 것입니다.
에이전트는 작업 전 이 섹션을 반드시 확인해야 합니다.

### 1. API 모듈의 내부/외부 함수 분리 (`src/lib/api.js`)
- `token()` 함수는 **모듈 내부 전용**이며 export되지 않습니다. `setToken()`과 `clearToken()`만 export됩니다.
- `AuthContext.jsx`는 `setToken`, `clearToken`을 `api.js`에서 import 하고, 별도로 `token`이라는 state도 관리합니다. **이름이 같지만 다른 대상**임에 주의.

### 2. Status Key 타입 불일치 (String vs Number)
- `Reports.jsx`의 `SYNC_LABELS`는 키가 `0, 1, 2, '-1'` 입니다. `0`, `1`, `2`는 **Number**, `'-1'`은 **String**.
- `PdfArchive.jsx`의 `STATUS_LABELS`는 `0, 1, 2, 9, '-1'` 로, 실패 상태에 `9`와 `'-1'` 두 가지가 공존.
- 필터링 시 `===` 비교에 주의해야 하며, API 응답의 상태값이 Number인지 String인지 확실하지 않으면 `==` 또는 명시적 변환을 고려.

### 3. Reports vs PdfArchive 필드명 차이
| 개념 | Reports.jsx | PdfArchive.jsx |
|------|-------------|----------------|
| 제목 | `article_title` | `title` |
| URL | `article_url` | (없음) |
| 파일명 | (없음) | `file_name` |
| 목록 키 | `report_id` (최상위) | `report_id` (최상위) |
| 목록 배열 | `data.reports` | `data.items` |
| 동기화상태 | `sync_status`, `pdf_sync_status` | `sync_status` (archive_status 별도) |
- 같은 "리포트" 도메인이지만 **완전히 다른 필드명**을 사용하므로, API 호출 및 렌더링 시 혼동하지 말 것.

### 4. useEffect 의존성 배열 함정
- `Users.jsx`의 `useEffect(load, [page, status, search])`에서 `load` 함수는 매 렌더마다 재생성되지만 의존성 배열에 포함되지 않았습니다. React의 `react-hooks/exhaustive-deps` 규칙 관점에서는 잠재적 문제.
- 같은 패턴이 `Reports.jsx`(`useEffect(load, [page, filters])`)에도 존재합니다. `filters`는 객체이므로 참조가 매번 바뀔 수 있음.

### 5. Inline Style 패턴
- 이 프로젝트는 CSS 클래스 대신 **inline style**을 광범위하게 사용합니다. (예: `style={{padding:'.5rem', fontSize:'.8rem'}}`)
- CSS 변수(`var(--accent)`, `var(--text2)` 등)는 inline style 내에서도 사용 가능합니다.
- **Tailwind CSS나 CSS Modules는 사용하지 않습니다.** 새로운 스타일 추가 시 기존 패턴을 따릅니다.

### 6. 도메인 특화 용어 (Korean-English Hybrid)
- `sec_firm_order`: 증권사 순서 (Security Firm Order)
- `article_board_order`: 게시판 순서
- `telegram_update_yn`: 텔레그램 업데이트 여부 ('Y'/'N')
- `firm_nm`: 증권사명 (Firm Name)
- `reg_dt`: 등록일자 (Register Date)
- `download_status_yn`: 다운로드 상태 여부
- 이 필드명들은 DB 컬럼명과 1:1 매칭되므로 **임의로 변경하면 안 됩니다.**

### 7. Toast / ConfirmDialog 시스템 (신규 추가)
- `window.confirm()`과 `window.prompt()` 대신 **ToastContext의 `confirm()` / `prompt()`** 를 사용합니다.
- 사용법: `const ok = await confirm('정말 삭제하시겠습니까?', '삭제 확인');`
- `window.alert()` 대신 **`toast.error()` / `toast.success()` / `toast.warning()` / `toast.info()`** 사용.
- `src/components/ui/ToastContext.jsx`에서 `useToast()` 훅으로 접근.

### 8. Pagination 패턴 차이
- `Users.jsx`: `Math.ceil(data.total / data.page_size)` — 전체 페이지 네비게이션.
- `Reports.jsx` / `PdfArchive.jsx`: `Math.min(Math.ceil(total / page_size), 20)` — 최대 20페이지만 표시 후 `...`.

### 9. 테마 시스템
- CSS Variables 기반: `[data-theme='dark']` / `[data-theme='light']`
- `App.jsx`에서 `theme` state를 관리하고 `document.documentElement.setAttribute('data-theme', theme)`로 적용.
- `localStorage` 키 `mh_theme`에 저장.

### 10. 인증 흐름
- `AuthContext.jsx`의 `authState`: `'unknown'` → `'pending'` → `'ready'` / `'unauthorized'` / `'offline'`.
- `token`은 `api.js`의 `setToken()`으로 localStorage에 저장되고, `req()` 함수가 모든 요청의 `Authorization` 헤더에 포함.
- 401 응답 시 `mh_token`과 `mh_user`가 localStorage에서 제거됩니다.
