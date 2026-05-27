# 변경사항 요약 (2026-05-27)

## Phase 0: Dashboard UI 전면 재설계

### Dashboard.jsx — 완전 재작성
- **ServerCard** 재설계: CPU/RAM/Disk 세로 배치 + **진행 막대(Progress Bar)** 시각화
  - 80% 초과 시 붉은색 경고, 정상 시 accent/green 계열
  - 연결 안됨 상태 회색 박스 처리
  - 최소 카드 너비 320px, 폰트 .82rem / bold 700
- **빠른 메뉴** 그리드 확장: `minmax(210px, 1fr)` → 카드당 최소 35% 넓어짐
  - 아이콘 1.5rem, 레이블 .9rem, 설명 .78rem (2줄 자연 줄바꿈)
  - **말줄임표 제거**: `overflow:hidden / textOverflow:ellipsis / whiteSpace:nowrap` 모두 삭제
  - `wordBreak:keep-all` + `lineHeight:1.45` 로 한글 가독성 향상
- **시스템/리포트 섹션 완전 분리**
  - `시스템 현황`: CPU / 메모리 / 디스크 / 데이터베이스 (4 StatCard + 진행 막대)
  - `리포트 현황`: 오늘 수집 / 누적 리포트 (2 StatCard) + 최근 수집 활동
- **StatCard** 신규 컴포넌트: 값 1.4rem / bold 800, 통일된 디자인
- DB 상태 `OK` → `정상` 으로 한글화
- **전체 폰트 크기 상향**: 섹션 타이틀 1rem, 카드 값 최대 1.4rem

### Dashboard.test.jsx
- DB 상태 텍스트 변경 반영 (`'OK'` → `'정상'`)
- 서버 카드 메트릭 검증 정규식 매처로 업데이트

---

## Phase 1: 공통 인프라

### App.jsx
- `ToastProvider`, `ToastContainer`, `ConfirmDialog` 통합

### index.css
- Toast slideIn 애니메이션 추가

### AGENTS.md
- LLM 혼동 가능성 10가지 포인트 문서화
  - Status Key 타입 불일치 (String vs Number)
  - Reports/PdfArchive 필드명 차이
  - useEffect 의존성 함정
  - 도메인 용어
  - Toast 시스템 사용법 등

---

## Phase 2: 기능 개선

### Users.jsx
- `useCallback`으로 useEffect 의존성 문제 해결
- `window.confirm` → Toast `confirm()` 교체
- 에러를 `setErr` 대신 `toast.error()`로 표시

### Reports.jsx
- **개별회사 스크랩 재처리** 패널 추가
  - 증권사 선택 드롭다운 + 재처리 실행
- Toast/ConfirmDialog 통합

### PdfArchive.jsx
- ⚡ **최근 100건 재처리** 빠른 실행 버튼 추가
- Toast/ConfirmDialog 통합

### Firms.jsx
- 📡 **텔레그램 ON/OFF 설명 카드** 추가
- `window.prompt` → Toast `prompt()` 교체
- 텔레그램 배지에 `title` 툴팁 추가

### api.js
- `dbQuery()` 함수 확장: `order_by`, `order_dir`, `offset` 파라미터 지원

---

## Phase 3: DB 뷰어

### Database.jsx
- **tbl_ / tbm_ / 전체** 필터 버튼 (테이블 개수 표시)
- **셀 클릭 → Modal** 로 전체 값 보기 + 📋 클립보드 복사
- 컬럼 `minWidth: 120px` 적용, 넓은 컬럼은 최대 400px까지
- **50건씩 더 보기** 버튼 (누적 로딩)
- 컬럼 헤더 **클릭 → ORDER BY ASC/DESC 토글** (정렬 상태 배지 표시)

---

## Phase 4: 로그 뷰어

### Logs.jsx
- 왼쪽 파일 리스트 🕐 **최근순** / 🔤 **이름순** 정렬 토글 버튼
- 🔴 **ERROR** / 🟡 **WARNING** / 🔵 **INFO** 필터 버튼 (건수 배지 포함)
- 로그 내용 **인라인 검색** 바
- 필터링된 라인 수 상태바 표시

---

## Phase 5: 테스트

### Users.test.jsx
- `ToastProvider` 래퍼 추가

### PdfArchive.test.jsx
- `ToastProvider` 래퍼 추가
- 새 버튼 테스트 반영

---

## 검증 결과
- ✅ 빌드 성공
- ✅ 38 tests passed / 5 test files
