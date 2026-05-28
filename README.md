# Map-Dyoa (지도동)

지도동 멤버의 **치지직·유튜브 합방·게임 방송 일정**, **클립**, **멤버 프로필**, **HOI4 내전 전적**을 한곳에서 보는 팬 캘린더입니다.

프로덕션: [map-dyoa](https://map-dyoa.vercel.app) (Vercel) · 도메인 데이터 API: [map-dyoa-server](https://map-dyoa-server.fly.dev) (Fly.io)

---

## 주요 기능

| 영역 | 경로 | 설명 |
|------|------|------|
| **스케줄** | `/calendar` | 월간·주간 캘린더, 멤버·게임·즐겨찾기 필터, 라이브 뱃지, 일정 공유 |
| **멤버·라이브** | `/streamers` | 멤버 그리드, 치지직 라이브 상태, 멤버 상세 |
| **클립** | `/clips` | 클립 목록·검색·페이지네이션, 재생 모달 |
| **HOI4 전적** | `/hoi4` | 내전 세션별 국가·누적 리더보드 |
| **라이브** | `/live` | 동시 시청 멀티뷰 |
| **월간 통계** | `/calendar/monthly` | 월별 Wrapped 스타일 통계 |
| **도움말** | `/help` | 기능 안내 |
| **공지** | `/announcements` | 공지·후원 안내 |
| **관리자** | `/admin` | 일정·멤버·클립·게임·피드백·감사 로그 (Google 로그인) |

### 일정 등록 (관리자)

- 단일 / 일괄 / 이미지·텍스트 AI 추출
- HOI4 게임 선택 시 **내전 세션** 체크 + 멤버별 **국가** 입력 → `/hoi4` 전적에 집계
- 치지직 URL 자동 채우기 (제목·게임·멤버)

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | **Next.js 16** (App Router) |
| UI | **React 19**, **Tailwind CSS 4**, **Framer Motion** |
| 인증 | **NextAuth v5** (Google) |
| ORM | **Prisma 6** |
| DB | **PostgreSQL** (Supabase 등) |
| 검증 | **Zod** |
| 배포 | **Vercel** (프론트), **Fly.io** (map-dyoa-server) |
| 관측 | Vercel Analytics, Axiom (`next-axiom`) |

---

## 아키텍처

```
브라우저 → Next.js (map-dyoa)
              ├─ MAP_DYOA_SERVER_URL 있음 → Fly API (일정·스트리머·클립·게임)
              └─ MAP_DYOA_SERVER_URL 없음 → Prisma (로컬 전용)
              └─ Prisma (항상): NextAuth, AuditLog, 웹푸시 구독 등
```

- **`MAP_DYOA_SERVER_URL`이 설정되면** 일정·스트리머·클립 등 **도메인 데이터는 Fly API만** 사용합니다. Next 쪽 Prisma 도메인 경로는 비활성입니다.
- 일정 생성·수정·삭제 후 `calendar` / `hoi4` 캐시 태그를 무효화해 캘린더·전적 페이지가 갱신됩니다.

자세한 에이전트·커밋 규칙은 [`AGENTS.md`](./AGENTS.md)를 참고하세요.

---

## 로컬 개발

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수

`.env.example`을 복사해 `.env`를 만듭니다.

```bash
cp .env.example .env
```

| 변수 | 설명 |
|------|------|
| `MAP_DYOA_SERVER_URL` | Fly 일정 API (없으면 로컬 Prisma 모드) |
| `DATABASE_URL` / `DIRECT_URL` | NextAuth·AuditLog용 Postgres |
| `AUTH_SECRET` | NextAuth 시크릿 |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth |
| `NEXT_PUBLIC_SITE_URL` | OG·일정 공유 URL (로컬에서도 프로덕션 URL 권장) |
| `AXIOM_TOKEN` / `AXIOM_DATASET` | (선택) 로그 수집 |

### 3. DB 마이그레이션 (Prisma 사용 시)

```bash
npm run db:migrate
npx prisma generate
```

### 4. 개발 서버

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) → `/calendar`로 리다이렉트됩니다.

### 자주 쓰는 스크립트

| 명령 | 설명 |
|------|------|
| `npm run build` | Prisma generate + 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run configure:git-commit` | 한글 커밋 템플릿(`.gitmessage`) 적용 |

---

## 프로젝트 구조 (요약)

```
src/
├── app/              # App Router 페이지·API·Server Actions
├── components/       # UI (Calendar, Form, hoi4, clips, admin …)
├── hooks/            # 클라이언트 상태 훅
├── lib/              # 데이터 페칭, API 클라이언트, 유틸
├── constants/        # 게임 색상, 재검증 경로 등
└── providers/        # Auth, Theme
prisma/               # 스키마·마이그레이션
extension/            # 브라우저 확장 (선택)
```

---

## 후원

서버 유지비에 도움이 됩니다 → https://ctee.kr/place/mapdoya

서버비를 제외한 금액은 전부 기부됩니다.

---

## 피드백

- 사이트 내 **수정 요청** 폼
- 급한 이슈·건의: windowssart01@gmail.com

---

## 기여

취미로 AI와 함께 만든 프로젝트라 코드 품질이 완벽하지 않을 수 있습니다.  
버그 수정·리팩터·UX 개선 PR은 환영합니다. 커밋 메시지는 **한글**(`feat:`, `fix:` 접두사 + 한글 요약)을 사용합니다.
