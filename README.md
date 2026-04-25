# 가전렌탈 관리자 페이지 (Rental Admin)

가전렌탈 고객 관리 시스템 - AI 파싱 기반 고객등록, 관리, 잠재고객 DB

## 기술 스택

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: NeonDB (PostgreSQL) - `@neondatabase/serverless`
- **AI 파싱**: Google Gemini API (`gemini-2.0-flash`)
- **배포**: Netlify (`@netlify/plugin-nextjs`)

## 주요 기능

### 📋 고객등록
- 거래처 사이트에서 복사한 원시 텍스트를 붙여넣기
- Gemini AI가 자동으로 고객 정보 파싱 (브랜드, 고객명, 주민번호, 연락처, 주소, 모델코드, 프로모션 등)
- 파싱 결과 미리보기 및 인라인 수정
- 확인 후 NeonDB에 저장

### 👥 고객관리
- 등록된 고객 목록 조회 (상태별 필터, 이름/전화번호 검색)
- 행 클릭 시 슬라이드 패널로 상세 보기/수정
- 체크박스 선택 → 일괄 삭제/설치완료 처리
- 프로모션 토글 (반값할인/타사보상 중복불가, 결합할인 중복가능)
- 설치예정일 선택 시 자동 서명완료 전환
- 거래처 전달용 텍스트 자동생성 + 클립보드 복사

### 📁 DB (잠재고객 관리)
- 전화번호만으로 빠른 등록
- 인라인 수정/삭제
- 상태 드롭다운 (상담전 / 상담완료 / 2차상담완료)

### 🔗 OpenClaw 연동
- `/api/openclaw` POST 엔드포인트
- Gemini AI로 의도 분류 → 고객등록 또는 잠재고객 등록 자동 분기

### ⏰ 자동 상태 변경
- Netlify Scheduled Function (매일 KST 17:00)
- 설치예정일 당일 서명완료 → 설치완료 자동 전환

### 🔐 보안 및 인증
- Edge 호환 Web Crypto API 기반 보안 미들웨어 구현
- HMAC 암호화 쿠키 세션 방식 사용
- 관리자 아이디 및 비밀번호 검증 (`.env.local` 연동)

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env.local` 파일을 프로젝트 루트에 생성:
```env
DATABASE_URL=postgres://user:password@your-endpoint.neon.tech/dbname
GEMINI_API_KEY=your-gemini-api-key
ADMIN_ID=your-admin-id
ADMIN_PW=your-admin-password
AUTH_SECRET=your-secure-random-string
```

### 3. DB 마이그레이션
서버 실행 후 한 번 호출:
```bash
curl http://localhost:3000/api/migrate
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 배포
```bash
npm ci && npm run build
```
Netlify에 배포 시 환경변수(`DATABASE_URL`, `GEMINI_API_KEY`)를 Netlify 대시보드에서 설정해주세요.

## DB 스키마

### customers 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| order_id | VARCHAR(20) | 자동생성 (UMJ-XXXXXXXX-XXXX) |
| received_at | TIMESTAMPTZ | 접수일시 |
| brand | VARCHAR(50) | 브랜드 |
| customer_name | VARCHAR(50) | 고객명 |
| ssn | VARCHAR(20) | 주민번호 앞 7자리 |
| phone | VARCHAR(20) | 휴대폰 |
| address | TEXT | 주소 |
| account | TEXT | 계좌/카드 |
| model_code | VARCHAR(100) | 모델코드 |
| color | VARCHAR(50) | 색상 |
| contract_period | VARCHAR(20) | 의무기간 |
| service_type | VARCHAR(50) | 관리유형 |
| monthly_fee | INTEGER | 월 렌탈료 |
| promotion | TEXT[] | 프로모션 배열 |
| desired_install_date | VARCHAR(100) | 설치희망일 |
| scheduled_install_date | DATE | 설치예정일 |
| status | VARCHAR(20) | 진행상태 |
| memo | TEXT | 메모 |

### db_leads 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| phone | VARCHAR(20) | 전화번호 (필수) |
| customer_name | VARCHAR(50) | 고객명 |
| memo | TEXT | 메모 |
| status | VARCHAR(20) | 상태 |

## API 엔드포인트

| HTTP | Path | 설명 |
|------|------|------|
| POST | `/api/parse` | 텍스트 → Gemini 파싱 |
| GET | `/api/customers` | 고객 목록 |
| POST | `/api/customers` | 고객 등록 |
| GET/PATCH/DELETE | `/api/customers/[id]` | 고객 상세/수정/삭제 |
| POST | `/api/customers/bulk` | 일괄 처리 |
| GET | `/api/leads` | 잠재고객 목록 |
| POST | `/api/leads` | 잠재고객 등록 |
| PATCH/DELETE | `/api/leads/[id]` | 잠재고객 수정/삭제 |
| POST | `/api/openclaw` | OpenClaw 연동 |
| GET | `/api/migrate` | DB 마이그레이션 |
