# PulzApp — Thử thách thói quen nhóm

Mobile app (Expo / React Native) + NestJS backend giúp nhóm bạn bè tạo thử thách thói quen, check-in hàng ngày, leo top bảng xếp hạng.

Design system: **Obsidian Pulse** — dark-first, glassmorphism có chọn lọc (xem [DESIGN.md](DESIGN.md)).

---

## Monorepo structure

```
PulzApp/
├── apps/
│   ├── mobile/        # Expo SDK 54 + Expo Router + React 19
│   └── api/           # NestJS 10 + Prisma + PostgreSQL
├── packages/
│   └── shared/        # Zod DTOs dùng chung BE ↔ FE (build sang dist/)
├── .claude/
│   └── skills/
│       └── test-pulz/ # Slash command /test-pulz cho smoke + security + perf
├── docker-compose.yml # Postgres 16 cho dev
├── DESIGN.md          # Obsidian Pulse design tokens
├── PLAN.md            # Plan FE (Home + foundation)
└── PLAN_BE.md         # Plan BE (monorepo + Auth + Habits + Groups + Leaderboard)
```

---

## Tech stack

### Mobile (`apps/mobile`)
- Expo SDK **54**, React **19.1**, React Native **0.81** (New Architecture default)
- Expo Router (file-based, typed routes)
- Fonts: Manrope (UI/numbers) + Be Vietnam Pro (body)
- State: Zustand (auth, settings, persist AsyncStorage) + React Query (server state, optimistic update)
- API: axios + interceptor refresh token, zod parse response
- Token storage: `expo-secure-store` trên native, `localStorage` shim trên web
- Visual: `expo-blur` (BlurView pill nav), `expo-linear-gradient` (FAB, hero), Ionicons
- i18n: i18next + react-i18next + expo-localization (default `vi`, support `en`, auto-detect)
- **Theme**: Dark / Light / System cycle qua zustand `theme` setting, `useColors()` hook + `makeStyles(colors)` pattern
- **Notifications**: `expo-notifications` local daily reminder theo `reminderTime` của habit

### API (`apps/api`)
- NestJS 10 (HTTP + DI + decorators)
- Prisma 5 + PostgreSQL 16 (Docker)
- Auth: JWT access (15m) + refresh (30d), argon2 password hash
- Validation: nestjs-zod (parse body với schema từ `@pulz/shared`)
- Global JwtAuthGuard với `@Public()` decorator để mark route công khai
- Rate limit: `@nestjs/throttler` v6 — login 5/min, register 3/min, refresh 10/min, default 100/min/IP
- CORS: env-driven, dev fallback localhost+LAN+exp://, production whitelist bắt buộc
- Production guard: refuse start nếu JWT secret yếu hoặc `CORS_ORIGINS=*`
- Swagger: `/docs` UI + `/docs-json` OpenAPI 3.0 (auto-bật trong dev)

### Shared (`packages/shared`)
- Zod schemas → infer TypeScript types
- Build CommonJS to `dist/` (load được từ cả NestJS và Metro)
- Định nghĩa contract API: User, Auth, Habit, Group, Leaderboard

---

## Setup local (lần đầu)

### 1. Prerequisites
- Node.js **20+**
- Docker Desktop (để chạy Postgres)
- iPhone hoặc Android có **Expo Go** (tải App Store / Play Store)
- PC + thiết bị cùng wifi LAN

### 2. Cài deps
```powershell
git clone <repo-url> PulzApp
cd PulzApp
npm install              # workspaces resolve dep cho cả 3 package
npm run shared:build     # build @pulz/shared sang dist (BE và FE cần)
```

### 3. Env
```powershell
# apps/api/.env (tự generate khi chạy)
Copy-Item apps\api\.env.example apps\api\.env

# apps/mobile/.env — đổi IP LAN của PC bạn
Set-Content apps\mobile\.env "EXPO_PUBLIC_API_URL=http://192.168.1.6:3000/api/v1"
```

Lấy IP LAN: `ipconfig | Select-String IPv4`.

### 4. Database
```powershell
docker compose up -d postgres
npm run db:migrate       # tạo schema từ prisma/schema.prisma
npm run db:seed          # seed 5 user demo + habits + 30 ngày check-in
```

Seed sẽ in:
```
✅ Seed done. Login: minh@pulz.dev / password123
```

---

## Chạy dev

Mở **3 terminal**:

| Terminal | Lệnh | Mục đích |
|---|---|---|
| T1 | `docker compose up -d postgres` | Postgres (chỉ cần chạy 1 lần, container persist) |
| T2 | `npm run api` | NestJS dev server (auto-restart khi sửa code BE) |
| T3 | `npm run mobile -- --lan` | Expo Metro bundler |

Trên iPhone:
1. Mở **Camera** chụp QR (Expo Go iOS không có scanner nội tại — bắt buộc dùng Camera native)
2. Bấm banner thông báo ở đỉnh màn hình → mở Expo Go
3. Splash → Onboarding (lần đầu) → Login

> **Lưu ý wifi**: Nếu iPhone không vào được URL `192.168.x.x:8081`, set Windows wifi profile sang Private và mở port 8081 trong firewall, hoặc fallback `npx expo start --tunnel` (chậm hơn nhưng bypass network issues).

### Demo credentials (từ seed)
| Email | Password | Role |
|---|---|---|
| `minh@pulz.dev` | `password123` | Owner nhóm "Bạn thân" (code `DEMO01`) |
| `lan@pulz.dev` | `password123` | Member |
| `huy@pulz.dev` | `password123` | Member |
| `mai@pulz.dev` | `password123` | Member |
| `an@pulz.dev` | `password123` | Member |

---

## App features (đã implement)

### Auth
- Register / Login với email + password (argon2 hash)
- JWT access + refresh token, auto-refresh khi access hết hạn (axios interceptor)
- Token persist qua `expo-secure-store` (an toàn hơn AsyncStorage)
- Logout với confirm dialog
- **Forgot / Reset password** — request reset code qua email, token base64url 24-byte hết hạn 30 phút, dùng 1 lần. Email gửi qua Resend HTTP API; nếu `RESEND_API_KEY` trống, BE log token và trả `devToken` trong response (chỉ khi `NODE_ENV !== 'production'`). Route public, rate limit 3/min cho forgot và 5/min cho reset

### Home
- Greeting cá nhân hoá theo `user.displayName`
- Glass progress card với gradient progress bar
- Danh sách habit hôm nay, tap check để toggle (optimistic update qua React Query)
- Streak badge "🔥 X ngày"

### Habits
- Add Habit: emoji picker (9), color picker (5), frequency (daily/weekly), reminder HH:mm, chọn group, **category** (health/learning/mindfulness/lifestyle/other), **Streak Shield** toggle
- Check-in idempotent theo ngày UTC (toggle on/off) — unique key `(habitId, userId, date)` để hỗ trợ shared habit
- Tự động tính streak (consecutive days). Khi Streak Shield bật, cho phép lỡ tối đa 1 ngày trong chuỗi mà streak không reset (mỗi chuỗi chỉ shield 1 lần)
- Home filter chips theo category (chỉ render những category đang được dùng)
- **Group habit (isShared)** — chủ nhóm tạo 1 habit qua `POST /groups/:id/habits`, habit tự xuất hiện trên Home của tất cả members; mỗi member có check-in/streak/history riêng nhưng cùng tham chiếu 1 habit record. Group Detail liệt kê "Habits chung" với số member đã hoàn thành hôm nay. Edit/Delete shared habit chỉ owner. Trên Home, shared habit có badge 👥

### Groups
- Tạo nhóm với auto-gen code 6 ký tự (skip ký tự dễ nhầm I/O/0/1)
- Join nhóm bằng code (modal nhập code)
- List nhóm với avatar stack + progress chung + member count
- Group Detail: info card, mã mời tap-to-copy, shared habits, members với streak + today done/total
- Leave nhóm (owner không leave được, phải delete)
- Delete nhóm (chỉ owner)

### Leaderboard
- Segment 3 period: Hôm nay / Tuần này / Tất cả
- Group switcher nếu user join > 1 nhóm
- Podium top-3 với vương miện ⭐ cho #1
- Danh sách rank còn lại, highlight nếu là chính mình
- Tied ranks giữ chung số (vd 2 người cùng 17 điểm cùng rank #2)

### Profile
- Avatar block với tên, email, joined month
- 3 stat card: longest streak, habit count, group name
- 3 achievement badge auto-unlock dựa data thật (7-day streak, 5 habits, first group)
- Settings list: Thông báo / Giao diện / **Ngôn ngữ (tap toggle vi↔en)** / Tài khoản / Help
- Logout với Alert confirm

### Onboarding
- Welcome screen với hero gradient + emoji
- 2 CTA: Bắt đầu (register) / Đăng nhập
- Chỉ hiển thị lần đầu (`hasSeenOnboarding` flag trong settings store)

### i18n
- Default **Tiếng Việt**, fallback `vi`
- Auto-detect ngôn ngữ thiết bị
- Tap toggle trong Profile để đổi sang English (persist qua AsyncStorage)
- Mọi text trong app đi qua `t('key')` — không hardcode

---

## Testing — `/test-pulz`

Project có **slash command custom** để smoke test toàn bộ BE + security + performance. Tham chiếu: [.claude/skills/test-pulz/SKILL.md](.claude/skills/test-pulz/SKILL.md).

### Khi nào dùng
- Sau khi implement xong tính năng BE mới
- Sau khi đổi schema Prisma + migrate
- Trước khi commit hoặc push code đụng API contract
- Sau khi merge / pull code mới về

### Cách invoke (trong Claude Code)
```
/test-pulz                  # chạy hết: functional + security + performance + typecheck (~3 phút)
/test-pulz --quick          # chỉ functional + typecheck (~30s)
/test-pulz --security-only  # chỉ S1-S14
/test-pulz --api-only       # skip mobile typecheck + bundle size
/test-pulz --no-restart     # giả định API đã chạy, không tự start
/test-pulz --reseed         # reset DB + chạy lại seed trước khi test (clean slate)
```

### Test coverage

**Infrastructure (C0):**
- Swagger reachable at `/docs` + `/docs-json` returns valid OpenAPI 3.0

**Functional (23 checks):**
- C1-C4 Auth: login / me / refresh / reject wrong password
- C4b PATCH /auth/me + change-password
- C4c DELETE /auth/me cascade owned groups
- **C4d Password reset**: forgot trả devToken (dev mode), reset đổi password thành công, token single-use (reuse → 400), forgot với email không tồn tại vẫn 200 (không leak)
- C5-C8 Habits: list / create / checkin toggle 3 lần (idempotent) / delete / history 30 ngày
- **C8c Category + Streak Shield**: round-trip create/patch giữ nguyên field, zod reject category invalid
- **C8d Group habit (isShared)**: owner tạo shared habit qua POST /groups/:id/habits, member non-owner bị 403, Lan/Minh đều thấy habit qua GET /habits, check-in từng user lưu riêng (unique habitId+userId+date), delete shared chỉ owner
- C9-C13 Groups: list / create với code 6 ký tự / Lan join + duplicate 409 / detail structure / Lan leave + Minh owner-can't-leave + delete / **rename owner-only** / **kick member owner-only**
- C14 Leaderboard: 3 period với rank đúng
- C15 Authz: 401 không token, 403 không phải member
- C16 Typecheck: `@pulz/api`, `@pulz/mobile`, `@pulz/shared`

**Security (15 checks):**
- S1 JWT signature tampering → expect 401
- S2 Algorithm `none` attack → expect 401 (CRITICAL nếu lộ)
- S3 IDOR habit: Lan thử thao tác habit của Minh → expect 403/404
- S4 IDOR group: non-member xem group → expect 403
- S5 Mass assignment: register với extra field `role: admin` → field bị ignore
- S6 SQL/NoSQL injection probe → expect reject
- S7 Password strength: short password → expect 400
- S8 Login error không phân biệt user-exists vs wrong-password
- S9 Group code không leak qua endpoint public
- S10 Member không xoá nhóm của owner
- S11 Rate limit on auth (đã có `@nestjs/throttler`, 5 fail → 429) ✅
- S12 `npm audit` — fail nếu high/critical vulnerability
- S13 Response không leak `passwordHash` / JWT secret
- S14 CORS dev fallback OK, production guard active
- S15 Production guard refuse start nếu JWT secret yếu / CORS `*`

**Performance:**
- Đo p50/p95 cho 7 endpoint (warmup 5 + đo 10 lần)
- Thresholds: `/auth/me` p95 80ms, `/habits` 120ms, `/groups/:id` 400ms, etc.
- N+1 detection: đếm Prisma queries khi gọi `/groups/:id`, expect ≤ 15
- Mobile bundle size: `npx expo export` rồi đo, expect JS < 6MB

### Severity levels
- **CRITICAL** — bug bảo mật nghiêm trọng (IDOR, alg:none, SQL inject, secret leak) → block release
- **FAIL** — functional broken / perf regression > 2× target
- **WARN** — perf giữa 1× và 2× target
- **INFO** — nice-to-have (rate limit, CORS lock-down)

### Report format
```
PulzApp smoke test — <timestamp>
=================================
Functional
  Auth        : 4/4 ✅
  Habits      : 4/4 ✅
  Groups      : 5/5 ✅
  Leaderboard : 1/1 ✅
  Authz       : 3/3 ✅
Security
  S1-S10      : 10/10 ✅
  S11 throttle: ⚠️ INFO — BE chưa có rate limit
  S12 audit   : 0 high/critical ✅
  S13 leak    : ✅
  S14 CORS    : ⚠️ INFO — `*` chỉ OK cho dev
Performance
  /auth/me            : p50  18ms / p95  42ms ✅
  /habits             : p50  35ms / p95  91ms ✅
  /groups             : p50  72ms / p95 168ms ✅
  /groups/:id         : p50 142ms / p95 387ms ✅
  /leaderboard?week   : p50  68ms / p95 178ms ✅
  /auth/login         : p50 187ms / p95 312ms ✅
  N+1 detection       : 7 queries — OK ✅
Typecheck   : 3/3 ✅
---
PASS: 30/30 + 2 INFO warnings
```

### Manual UI test (sau khi BE pass)
1. Login `minh@pulz.dev / password123`
2. Home → tap habit → state lưu (kill app → mở lại → habit giữ state)
3. FAB `+` → Add Habit → fill form → save → habit mới xuất hiện
4. Tab Nhóm → tap "Bạn thân" → group detail → copy code → tap "Rời nhóm" (nếu không phải owner)
5. Tab Nhóm → tap "Tạo nhóm" → modal nhập tên → save → group mới xuất hiện
6. Tab Hạng → segment Tuần này → podium hiển thị top 3
7. Tab Tôi → tap Ngôn ngữ → đổi sang English → UI toàn app đổi tiếng Anh
8. Tap Đăng xuất → Alert confirm → quay về Login

---

## API endpoints

Tất cả endpoint dùng prefix `/api/v1`. Auth bằng header `Authorization: Bearer <accessToken>`.

📘 **Swagger UI**: `http://localhost:3000/docs` (auto bật trong dev, set `ENABLE_SWAGGER=true` để bật trong production). OpenAPI spec JSON ở `/docs-json`. Tap **Authorize** → paste access token để test các route có auth.

### Auth
| Method | Path | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/auth/register` | `{email, password, displayName}` | `{accessToken, refreshToken, user}` | public |
| POST | `/auth/login` | `{email, password}` | `{accessToken, refreshToken, user}` | public |
| POST | `/auth/refresh` | `{refreshToken}` | `{accessToken}` | public |
| POST | `/auth/forgot-password` | `{email}` | `{ok, devToken?}` (devToken chỉ ở `NODE_ENV != production`) | public, rate 3/min |
| POST | `/auth/reset-password` | `{token, newPassword}` | `{ok}` | public, rate 5/min |
| GET | `/auth/me` | — | `User` | bearer |
| PATCH | `/auth/me` | `{displayName?, avatarUrl?}` | `User` | bearer |
| POST | `/auth/change-password` | `{currentPassword, newPassword}` | `{ok}` | bearer, rate 5/min |
| DELETE | `/auth/me` | `{password}` | `{ok}` | bearer, rate 3/min, cascade owned groups |

### Habits (auth required)
| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/habits` | — | `HabitWithStatus[]` (với streak + doneToday) |
| POST | `/habits` | `CreateHabitDto` | `HabitWithStatus` |
| PATCH | `/habits/:id` | `UpdateHabitDto` | `HabitWithStatus` |
| DELETE | `/habits/:id` | — | `{ok: true}` |
| POST | `/habits/:id/checkin` | — | `CheckInResponse` (toggle theo ngày UTC) |
| GET | `/habits/:id/history` | `days=30` | `HabitHistoryResponse` (entries + currentStreak + longestStreak + totalDone) |

### Groups (auth required)
| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/groups` | — | `GroupSummary[]` |
| POST | `/groups` | `{name}` | `GroupSummary` |
| POST | `/groups/join` | `{code}` | `GroupSummary` |
| GET | `/groups/:id` | — | `GroupDetail` (members + sharedHabits chỉ `isShared=true`) |
| PATCH | `/groups/:id` | `{name}` | `GroupSummary` (chỉ owner) |
| POST | `/groups/:id/leave` | — | `{ok: true}` (owner không leave được) |
| DELETE | `/groups/:id` | — | `{ok: true}` (chỉ owner) |
| DELETE | `/groups/:id/members/:userId` | — | `{ok: true}` (kick, chỉ owner, không kick chính mình) |
| POST | `/groups/:id/habits` | `CreateHabitDto` | `HabitWithStatus` (shared habit, chỉ owner, tự set `isShared=true`) |

### Leaderboard
| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/groups/:id/leaderboard` | `period=today\|week\|all` | `LeaderboardResponse` |

DTO types đầy đủ ở [packages/shared/src/](packages/shared/src/).

---

## Scripts hữu ích

```powershell
npm run shared:build        # build @pulz/shared
npm run shared:dev          # build watch mode (khi sửa zod schema)

npm run api                 # NestJS dev
npm run api:build           # production build (dist/)

npm run mobile              # Expo Metro
npm run mobile:lan          # Metro với --lan flag

npm run db:up               # docker compose up postgres
npm run db:down             # docker compose down
npm run db:migrate          # prisma migrate dev
npm run db:studio           # Prisma Studio (DB GUI)
npm run db:seed             # chạy seed script

npm run typecheck           # typecheck cả 3 workspaces
```

### Khi sửa Prisma schema
```powershell
cd apps\api
npx prisma migrate dev --name <description>
# Prisma Client tự regenerate
```

### Khi sửa zod schema trong @pulz/shared
```powershell
npm run shared:build
# Hoặc chạy npm run shared:dev (watch) ở 1 terminal riêng
```

Vì shared được compile sang `dist/` và cả NestJS lẫn Metro đều load từ `dist/index.js`, không tự reload khi sửa `.ts` source.

---

## Troubleshooting

### iPhone không vào được `192.168.x.x:8081`
- Wifi profile Windows phải là **Private** (không phải Public)
- Mở firewall port 8081: `New-NetFirewallRule -DisplayName "Expo 8081" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow` (Admin)
- Hoặc fallback: `npx expo start --tunnel` (qua ngrok)

### Expo Go báo "Project uses SDK X, your Expo Go is SDK Y"
Apple chỉ cho cài Expo Go latest. Phải nâng project theo SDK của Expo Go:
```powershell
npm install -w @pulz/mobile expo@latest
npx expo install --fix
```

### Mobile báo `expo-asset` not found
```powershell
npx expo install expo-asset
```

### TypeError zod khi load `@pulz/shared`
Quên build:
```powershell
npm run shared:build
```

### Database migration drift
```powershell
cd apps\api
npx prisma migrate reset --force --skip-seed
npx tsx prisma\seed.ts
```

---

## Roadmap

### ✅ Done
- Foundation: Expo Router + tokens + i18n + Floating Pill TabBar + FAB
- Auth: register / login / refresh / logout với JWT + argon2
- Habits: CRUD + check-in idempotent + streak
- Groups: create / join by code / detail / leave / delete
- Leaderboard: 3 period với rank + podium UI
- 8 screens đầy đủ: Onboarding, Login, Register, Home, Add-Habit, Groups, Group Detail, Leaderboard, Profile
- i18n vi/en với toggle trong Profile
- Test skill `/test-pulz` với security + perf coverage
- **Hardening**: `@nestjs/throttler` (login 5/min, register 3/min, refresh 10/min, default 100/min/IP), CORS env-driven (dev fallback localhost+LAN, prod whitelist bắt buộc), production startup refuse khởi động nếu JWT secret yếu hoặc `CORS_ORIGINS=*`
- **Deploy guide**: [DEPLOY.md](DEPLOY.md) — Railway (BE + Postgres) + EAS Build (mobile Preview/Production) + OTA Update
- **Edit habit + delete**: tap habit row trên Home → Stats screen → nút Sửa → Add Habit form prefill, có nút Xoá thói quen
- **Edit group + kick member**: icon ✏️ trong header Group Detail (owner-only) mở rename modal; long-press hoặc nút ✕ trên member row để kick (owner-only); nút Xoá nhóm thay thế Rời nhóm khi là owner
- **Stats heatmap 30 ngày**: màn `/habit/[id]` với 3 stat card (streak hiện tại / dài nhất / tổng ngày done) + heatmap grid 7-col đánh dấu ngày done teal vs pending dim
- **Push notification reminder**: `expo-notifications` schedule daily local notification theo `reminderTime` HH:mm của từng habit, auto-sync khi habits thay đổi, permission request lần đầu
- **Light theme**: cycle Dark / Light / System trong Profile → Theme row. Status bar style + tất cả surface + text invert đúng. System mode tự follow OS color scheme
- **Polish UX**: pull-to-refresh trên Home/Groups/Leaderboard (RefreshControl + haptic tap); haptic feedback (tap/success/selection) cho check-in, tab switch, FAB, segment, modal; skeleton shimmer thay ActivityIndicator (HabitCardSkeleton/GroupCardSkeleton); EmptyState với gradient circle + emoji/icon ở 3 màn trống; FloatingTabBar dot animation slide spring; habit `color` tint vào HabitCard iconBox
- **Profile cleanup**: Edit profile modal (bottom sheet sửa displayName qua `PATCH /auth/me`); Notifications Switch on/off (cancel scheduled khi off); Account screen riêng (đổi password + delete account cascade); Help screen với FAQ + contact mailto
- **Toast component**: `<ToastProvider>` global + `useToast()` hook, 3 variant (success/info/error), slide-down animation, auto dismiss 2.2s. Dùng cho copy invite code, save profile, change password success
- **GroupCard avatar initials**: BE trả `memberPreviews: [{initial, avatarUrl}]` thay vì `memberAvatars: string[]`. FE hiển thị chữ cái đầu tên member trên avatar gradient
- **Redesign Profile + Leaderboard**: Profile hero gradient avatar + hero streak card + achievement gradient/locked states + setting icon bubbles; Leaderboard "Your rank" card với gap-to-leader, podium gold/silver/bronze (medal emoji 🥇🥈🥉 + #1 to hơn), rank list highlight user của mình
- **Forgot / Reset password**: Prisma `PasswordResetToken` model (token + userId + expiresAt + usedAt + cascade delete on user), `EmailService` dùng Resend HTTP API (no SDK) với fallback log khi `RESEND_API_KEY` chưa set, screens `forgot-password` + `reset-password` với deep-link cùng token, route public + throttle (3/min forgot, 5/min reset), forgot luôn trả `ok: true` để không leak user existence
- **Habit categories + Streak Shield**: Habit schema thêm `category` (enum 5: health/learning/mindfulness/lifestyle/other) + `streakShieldEnabled` (boolean), Add Habit form có chip picker category + Switch shield (kèm hint), `calcStreak` cho phép 1 ngày lỡ duy nhất trong chuỗi khi shield bật, Home thêm filter chips horizontal scroll trên habits section (chỉ hiển thị category đang dùng)
- **Group habit assignment (isShared)**: Habit schema thêm `isShared` (boolean), `CheckIn` unique chuyển từ `(habitId, date)` → `(habitId, userId, date)` để mỗi member có 1 check-in/ngày trên cùng habit chung. Endpoint mới `POST /groups/:id/habits` (owner-only) tạo shared habit. `HabitsService.list(userId)` trả về union personal habits + shared habits trong các group user là member. Edit/Delete shared habit chỉ owner; check-in/history mở cho tất cả member. Group Detail "Habits chung" giờ filter theo `isShared=true` và đếm chính xác member done hôm nay. Home tự render shared habit kèm badge 👥. Owner thấy nút "+ Tạo habit chung" trong section Habits chung của Group Detail

### ⏳ Next (đề xuất, chưa cam kết)
- **Avatar upload** (BE: presigned S3 URL hoặc Cloudinary; FE: image picker)
- **Habit notes** (nhật ký mỗi check-in với 280 ký tự)
- **Sharing stats**: chia sẻ heatmap habit qua Share API
- **Per-habit leaderboard**: ranking riêng theo từng shared habit (hiện tại leaderboard tổng theo group)
- **Tests automation**: Jest unit cho service + Detox e2e cho FE
- **CI/CD**: GitHub Actions chạy `/test-pulz` trên PR
- **Deploy**: Railway/Render cho API, EAS build cho mobile

---

## Tài liệu liên quan

- [DESIGN.md](DESIGN.md) — Obsidian Pulse design tokens (colors, typography, components)
- [PLAN.md](PLAN.md) — Plan FE foundation
- [PLAN_BE.md](PLAN_BE.md) — Plan BE monorepo + module breakdown
- [DEPLOY.md](DEPLOY.md) — Deploy guide (Railway + EAS Build)
- [TEST_REPORT.md](TEST_REPORT.md) — UI/UX + logic test report (web build via Preview MCP)
- [CLAUDE_CODE_PROMPT.md](CLAUDE_CODE_PROMPT.md) — Prompt khởi tạo Claude Code session ban đầu
- [.claude/skills/test-pulz/SKILL.md](.claude/skills/test-pulz/SKILL.md) — Test skill chi tiết
