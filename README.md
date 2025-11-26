# 주문 시스템 (Order System)

Next.js 기반의 주문 관리 시스템으로, 관리자 보안 시스템과 동적 페이지 관리 기능을 포함합니다.

## 주요 기능

### 사용자 기능
- **주문하기**: 상품 선택 및 주문 제출
- **동적 페이지**: 관리자가 생성한 커스텀 페이지 조회

### 관리자 기능
- **상품 관리**: 상품 등록, 수정, 삭제
- **주문 관리**: 주문 내역 조회 및 상태 관리
- **페이지 관리**: 동적 페이지 생성 및 삭제
- **보안**: Google Sheets 기반 비밀번호 관리

## 기술 스택

- **프레임워크**: Next.js 14.0.4
- **언어**: JavaScript
- **스타일링**: CSS Modules
- **인증**: JWT (jsonwebtoken)
- **데이터 저장**: 
  - 비밀번호: Google Sheets
  - 상품/주문/페이지: JSON 파일 (또는 Notion API)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example` 파일을 `.env`로 복사하고 필요한 값을 입력하세요:

```env
# Google Sheets (비밀번호 저장)
GOOGLE_CLIENT_EMAIL=your-client-email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_SHEET_ID=your-spreadsheet-id

# JWT Secret
JWT_SECRET=your-secret-key

# Notion API (선택적 - 데이터 저장용)
NOTION_API_KEY=your-notion-api-key
NOTION_DATABASE_ID_PAGES=your-pages-database-id
NOTION_DATABASE_ID_PRODUCTS=your-products-database-id
NOTION_DATABASE_ID_ORDERS=your-orders-database-id
```

### 3. Google Sheets 설정

1. Google Cloud Console에서 프로젝트 생성
2. Google Sheets API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. 새 스프레드시트 생성
5. "password"라는 이름의 시트 생성
6. A2 셀에 초기 관리자 비밀번호 입력
7. 서비스 계정 이메일에 스프레드시트 편집 권한 부여

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

### 5. 프로덕션 빌드

```bash
npm run build
npm start
```

## 프로젝트 구조

```
order-system/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Modal.js
│   └── ProductCard.js
├── data/               # JSON 데이터 파일
│   ├── products.json
│   ├── orders.json
│   └── pages.json
├── middleware/         # 미들웨어
│   └── adminAuth.js
├── pages/              # Next.js 페이지
│   ├── api/           # API 라우트
│   │   ├── auth/     # 인증 API
│   │   ├── products/ # 상품 API
│   │   ├── orders/   # 주문 API
│   │   └── pages/    # 페이지 API
│   ├── admin/         # 관리자 페이지
│   │   ├── index.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── pages.js
│   │   └── change-password.js
│   ├── index.js       # 메인 페이지
│   ├── order.js       # 주문 페이지
│   └── [path].js      # 동적 페이지
├── styles/             # CSS 스타일
├── utils/              # 유틸리티 함수
│   ├── googleSheets.js
│   ├── passwordUtils.js
│   └── storage.js
└── package.json
```

## API 엔드포인트

### 인증
- `POST /api/auth/verify-admin` - 관리자 로그인
- `GET /api/auth/check-auth` - 인증 상태 확인
- `GET /api/auth/logout` - 로그아웃
- `POST /api/auth/change-password` - 비밀번호 변경

### 상품
- `GET /api/products` - 상품 목록 조회
- `POST /api/products` - 상품 생성 (관리자)
- `GET /api/products/[id]` - 특정 상품 조회
- `PUT /api/products/[id]` - 상품 수정 (관리자)
- `DELETE /api/products/[id]` - 상품 삭제 (관리자)

### 주문
- `GET /api/orders` - 주문 목록 조회 (관리자)
- `POST /api/orders` - 주문 생성
- `GET /api/orders/[id]` - 특정 주문 조회 (관리자)
- `PUT /api/orders/[id]` - 주문 상태 업데이트 (관리자)

### 페이지
- `GET /api/pages/list` - 페이지 목록 조회 (관리자)
- `POST /api/pages/create` - 페이지 생성 (관리자)
- `GET /api/pages/[path]` - 특정 페이지 조회
- `PUT /api/pages/[path]` - 페이지 수정 (관리자)
- `DELETE /api/pages/[path]` - 페이지 삭제 (관리자)

## 사용 방법

### 관리자 로그인
1. 메인 페이지에서 "관리자 페이지" 버튼 클릭
2. Google Sheets에 설정한 비밀번호 입력
3. 관리자 대시보드로 이동

### 상품 등록
1. 관리자 페이지 → 상품 관리
2. "새 상품 추가" 클릭
3. 상품 정보 입력 (이름, 설명, 가격, 이미지 URL)
4. 저장

### 주문 처리
1. 사용자가 주문 페이지에서 상품 선택 및 주문
2. 관리자 페이지 → 주문 관리에서 주문 내역 확인
3. 주문 상태 변경 (대기중/확인됨/완료/취소)

### 페이지 생성
1. 관리자 페이지 → 페이지 관리
2. "새 페이지 생성" 클릭
3. 경로와 제목 입력
4. 생성 후 해당 페이지로 이동하여 컨텐츠 편집

## 보안

- JWT 기반 인증 시스템
- Google Sheets를 통한 비밀번호 관리
- HTTP-only 쿠키를 사용한 토큰 저장
- 관리자 전용 API 경로 보호

## 라이센스

ISC
