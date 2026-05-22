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
