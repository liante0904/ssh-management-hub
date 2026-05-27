# API_REFERENCE.md

이 문서는 **SSH Management Hub**에서 사용되는 백엔드 API 명세입니다. 모든 API 통신은 `src/lib/api.js`를 통해 이루어집니다.

## 🌐 공통 설정
- **Base URL**: `import.meta.env.VITE_API_BASE_URL` (기본값: `''`)
- **Authentication**: `Authorization: Bearer {token}` (LocalStorage의 `mh_token` 사용)
- **Content-Type**: `application/json`

---

## 🔐 Auth APIs

### 1. Telegram 인증
- **Method**: `POST`
- **Path**: `/api/auth/telegram`
- **Body**: Telegram Login Widget 데이터 (`id`, `first_name`, `username`, `auth_date`, `hash`)

### 2. 비상 로그인 (JWT Secret Key)
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Body**: `{ "secret": "jwt-secret-key" }`
- **Response**: `{ "access_token": "...", "user": { ... } }`

### 3. 내 정보 조회
- **Method**: `GET`
- **Path**: `/api/auth/me`

## 🛠 Admin APIs

### 1. 시스템 메트릭 조회
- **Method**: `GET`
- **Path**: `/admin/metrics`
- **Description**: 시스템의 전반적인 메트릭 정보를 조회합니다.

### 2. 로그 목록 조회
- **Method**: `GET`
- **Path**: `/admin/logs?path={path}`
- **Description**: 지정된 경로의 로그 파일 목록을 조회합니다.

### 3. 로그 파일 내용 조회
- **Method**: `GET`
- **Path**: `/admin/logs/view?file={file}&lines={lines}&tail={tail}`
- **Parameters**:
  - `file` (string): 로그 파일 경로
  - `lines` (number): 읽을 라인 수 (기본값: 500)
  - `tail` (boolean): 끝에서부터 읽을지 여부 (기본값: true)

### 4. DB 테이블 목록 조회
- **Method**: `GET`
- **Path**: `/admin/db/tables`
- **Description**: 데이터베이스의 모든 테이블 목록과 코멘트를 조회합니다.

### 5. DB 테이블 데이터 쿼리
- **Method**: `GET`
- **Path**: `/admin/db/query/{table}?limit={limit}&offset={offset}&order_by={col}&order_dir={dir}`
- **Description**: 특정 테이블의 데이터를 조회하며, 정렬 및 페이징을 지원합니다.

### 6. DB 코멘트 업데이트
- **Method**: `PUT`
- **Path**: `/admin/db/comment`
- **Body**: `{ "table_name": string, "comment": string, "column_name": string | null }`

### 7. 커스텀 SQL 실행
- **Method**: `POST`
- **Path**: `/admin/db/query`
- **Body**: `{ "query": string, "limit": number }`

---

## 👥 User APIs

### 1. 사용자 목록 조회
- **Method**: `GET`
- **Path**: `/api/users?page={page}&page_size=20&status={status}&search={search}`
- **Description**: 가입된 사용자 목록을 페이징 처리하여 조회합니다.

### 2. 사용자 상태 업데이트
- **Method**: `PUT`
- **Path**: `/api/users/{id}/status`
- **Body**: `{ "status": "active" | "inactive" | ... }`

### 3. 관리자 권한 설정
- **Method**: `PUT`
- **Path**: `/api/users/{id}/admin`
- **Body**: `{ "is_admin": boolean }`

### 4. 사용자 삭제
- **Method**: `DELETE`
- **Path**: `/api/users/{id}`

---

## 📄 Report APIs

### 1. 리포트 목록 조회
- **Method**: `GET`
- **Path**: `/api/reports?page={page}&firm_nm={firm_nm}&reg_dt={reg_dt}&sync_status={sync_status}&search={search}`

### 2. 리포트 동기화 상태 업데이트
- **Method**: `PUT`
- **Path**: `/api/reports/{id}/sync`
- **Body**: `{ "sync_status": any, "pdf_sync_status": any }`

### 3. 리포트 PDF 조회
- **Method**: `GET`
- **Path**: `/api/reports/{id}/pdf`

### 4. FnGuide 리포트 조회
- **Method**: `GET`
- **Path**: `/api/reports/fnguide?page={page}&company_name={company}`

### 5. 전송 이력 조회
- **Method**: `GET`
- **Path**: `/api/reports/send-history?report_id={reportId}&user_id={userId}`

### 6. PDF 아카이브 목록 조회
- **Method**: `GET`
- **Path**: `/api/reports/pdf-archive?page={page}&firm_nm={firm}&archive_status={status}&reg_dt={dt}&sync_status={sync}&search={search}&sort={sort}`

### 7. PDF 아카이브 통계 (일별)
- **Method**: `GET`
- **Path**: `/api/reports/pdf-archive/stats/daily?days={days}`

### 8. PDF 아카이브 통계 (증권사별)
- **Method**: `GET`
- **Path**: `/api/reports/pdf-archive/stats/by-firm`

### 9. PDF 아카이브 재처리
- **Method**: `POST`
- **Path**: `/api/reports/pdf-archive/reprocess`
- **Body**: `{ "report_ids": number[], "archive_status": string, "sync_status": number, "firm_nm": string, "limit": number }`

---

## 🏢 Firm APIs

### 1. 증권사 목록 조회
- **Method**: `GET`
- **Path**: `/api/firms?search={search}`

### 2. 증권사 정보 업데이트
- **Method**: `PUT`
- **Path**: `/api/firms/{orderId}`
- **Body**: 증권사 관련 데이터 객체

### 3. 증권사 게시판 목록 조회
- **Method**: `GET`
- **Path**: `/api/firms/{orderId}/boards`

### 4. 증권사 게시판 생성/수정/삭제
- **Create**: `POST /api/firms/{orderId}/boards`
- **Update**: `PUT /api/firms/{orderId}/boards/{boardOrder}`
- **Delete**: `DELETE /api/firms/{orderId}/boards/{boardOrder}`
