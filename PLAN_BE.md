# PulzApp — Backend & Monorepo Plan

## Trạng thái (snapshot)

| Phase | Trạng thái |
|---|---|
| Migrate sang monorepo (apps/mobile + apps/api + packages/shared) | ✅ Hoàn thành |
| Docker Postgres + Prisma schema + migration | ✅ Hoàn thành |
| `@pulz/shared` zod DTOs (auth/habit/group/leaderboard/user) | ✅ Build sang dist |
| BE: Auth module (register/login/refresh/me) — argon2 + JWT | ✅ Verified end-to-end |
| BE: Habits module (CRUD + checkin + streak calc) | ✅ Verified |
| BE: Seed (5 user + 3 habit/user + 30 ngày check-in random + 1 group) | ✅ Đã chạy |
| BE: Groups module (CRUD + invite code + leave) | ✅ Verified |
| BE: Leaderboard module (today/week/all) | ✅ Verified |
| FE: Groups screen + create/join modal + Group Detail | ✅ Hoàn thành |
| FE: Leaderboard screen (segment + podium + list) | ✅ Hoàn thành |
| FE: Add-Habit form (emoji/color/frequency/group select) | ✅ Hoàn thành |
| BE: edit group `PATCH /groups/:id` + kick member `DELETE /groups/:id/members/:userId` (owner-only) | ✅ Verified |
| BE: habit history `GET /habits/:id/history?days=30` (entries + currentStreak/longestStreak/totalDone) | ✅ Verified |
| BE Hardening: `@nestjs/throttler` (login 5/min, register 3/min, refresh 10/min, default 100/min/IP) | ✅ Verified `429` sau 5 fail |
| BE Hardening: CORS env-driven + dev fallback (localhost+LAN), `assertProductionSecrets` refuse start nếu secret yếu | ✅ |
| BE Swagger: `/docs` UI + `/docs-json` OpenAPI 3.0, bearer auth scheme `access-token`, 14 endpoints + 4 tag (auth/habits/groups/leaderboard) | ✅ Verified curl |
| FE: Edit habit + delete (reuse add-habit form), Stats heatmap 30 ngày, Edit group / kick member, Push notification reminder | ✅ Hoàn thành |
| FE: **Light theme** (Dark/Light/System), Profile cycle toggle, status bar style auto | ✅ Verified preview MCP |
| BE: profile management — `PATCH /auth/me` (rename + avatar) + `POST /auth/change-password` (argon2 verify old) + `DELETE /auth/me` (cascade owned groups + user) | ✅ Verified |
| BE: `GroupSummary.memberPreviews` ({initial, avatarUrl}[]) thay vì `memberAvatars: string[]` | ✅ |
| FE: Toast component, Edit profile modal, Notifications Switch, Account screen, Help screen, GroupCard initials | ✅ Hoàn thành |
| FE: Redesign Profile (hero avatar gradient + hero streak + achievement gradient/locked + icon bubbles) + Leaderboard (your-rank card + podium medal emoji + #1 bigger) | ✅ |
| BE: Password reset — `PasswordResetToken` model + `POST /auth/forgot-password` + `POST /auth/reset-password`, EmailService Resend HTTP API + dev log fallback, base64url 24-byte token (30 min TTL, single-use), forgot không leak user existence | ✅ |
| BE: Habit `category` enum (health/learning/mindfulness/lifestyle/other) + `streakShieldEnabled` flag, `calcStreak` cho phép 1 grace day khi shield bật | ✅ |
| FE: Forgot-password + Reset-password screens (deep-link cùng token), Login → Forgot link | ✅ |
| FE: Add Habit form thêm category chip picker + Streak Shield Switch; Home filter chips theo category (chỉ render category đang dùng) | ✅ |
| FE: API client axios + interceptor refresh | ✅ |
| FE: React Query + auth state với SecureStore | ✅ |
| FE: Login + Register screen | ✅ |
| FE: Home dùng useHabits hook thay local store | ✅ |
| FE: Profile có logout button | ✅ |
| `npx tsc --noEmit` ở cả 2 app | ✅ pass |

### Cách chạy local

Mở **3 terminal**:

**Terminal 1 — Postgres:**
```powershell
docker compose up -d postgres
# Verify: docker compose ps
```

**Terminal 2 — API:**
```powershell
npm run api
# → http://0.0.0.0:3000/api/v1
```

**Terminal 3 — Mobile:**
```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "192.168.1.6"
npm run mobile -- --lan
# Hoặc trực tiếp: cd apps/mobile && npx expo start --lan
```

Trên iPhone:
- Camera quét QR → mở Expo Go
- Màn login → email `minh@pulz.dev` / password `password123` (đã prefilled)
- Sau login → Home hiển thị 3 habit thật từ BE (tap check circle để toggle)
- Tab Tôi → logout

### Khi cần làm việc tiếp

- Đổi IP LAN khi network thay đổi: sửa `apps/mobile/.env` (`EXPO_PUBLIC_API_URL=http://<NEW_IP>:3000/api/v1`).
- Nếu sửa `packages/shared/src/*` → cần `npm run shared:build` (hoặc dùng `npm run shared:dev` watch).
- Nếu sửa Prisma schema → `npm run db:migrate` (trong `apps/api`: `npx prisma migrate dev --name <desc>`).

### Đã verified (cmd thực tế)

Phase 1-2:
```
POST /auth/login → {accessToken, refreshToken, user}
GET  /auth/me    → {id, email, displayName, ...}
GET  /habits     → 3 habits với streak + doneToday
POST /habits     → create với name/emoji/color/frequency/reminderTime/groupId
DELETE /habits/:id → cascade check-ins
POST /habits/:id/checkin → toggle idempotent theo ngày
```

Phase 3-4:
```
GET  /groups → list with memberCount/habitCount/today aggregates/avatars
POST /groups → tạo, sinh code 6 ký tự (skip ký tự dễ nhầm)
POST /groups/join → join by code
GET  /groups/:id → detail with members (streak, today done/total) + sharedHabits
POST /groups/:id/leave → owner không leave được
DELETE /groups/:id → owner-only
GET  /groups/:id/leaderboard?period=today|week|all → rank by total check-ins
```

Phase 5 (edit / kick / history / push):
```
PATCH  /groups/:id              → rename, owner-only
DELETE /groups/:id/members/:uid → kick member, owner-only, không kick chính mình
GET    /habits/:id/history?days=30 → entries[30] + currentStreak + longestStreak + totalDone
```

Phase 7 (profile management):
```
PATCH  /auth/me               → cập nhật displayName / avatarUrl
POST   /auth/change-password  → argon2 verify currentPassword, hash newPassword, rate 5/min
DELETE /auth/me               → xác nhận password, deleteMany groups owned, delete user. Cascade habits/check-ins/memberships qua Prisma onDelete: Cascade. Rate 3/min.

Group response schema:
  memberPreviews: { initial: string; avatarUrl: string | null }[]
    (thay cho memberAvatars: string[] — giúp FE render initial fallback đẹp hơn "?")
```

Phase 6 (hardening + docs):
```
Throttler:
  /auth/login    5/IP/phút   (verified: 5×401 → 429)
  /auth/register 3/IP/phút
  /auth/refresh  10/IP/phút
  default        100/IP/phút (áp dụng tất cả route khác, skip /docs)

CORS:
  Dev fallback: localhost + 192.168.* + 10.* + exp://
  Production: env CORS_ORIGINS bắt buộc whitelist, không cho phép `*`

Production guard (chỉ khi NODE_ENV=production):
  JWT_ACCESS_SECRET ≥ 32 chars + không chứa marker "dev-/change-me/replace-me"
  JWT_REFRESH_SECRET tương tự
  CORS_ORIGINS không phải "*"
  Refuse start nếu vi phạm

Swagger:
  GET /docs      → UI HTML (swagger-ui)
  GET /docs-json → OpenAPI 3.0 spec
  Bearer auth scheme "access-token" — paste accessToken qua Authorize button
  Tự bật trong dev, production cần ENABLE_SWAGGER=true để expose
```

Phase 8 (password reset + categories + shield):
```
POST /auth/forgot-password  body {email} → {ok: true [, devToken]}
  Public, rate 3/min/IP, base64url(24) token, expiresAt = now + 30 min
  devToken trả về chỉ khi NODE_ENV !== 'production' (để dev / test không cần Resend key)
  Email gửi qua Resend HTTP API; nếu RESEND_API_KEY trống → logger.warn full reset URL
  Không tiết lộ user-exists (luôn trả ok:true)

POST /auth/reset-password   body {token, newPassword(≥8,≤72)} → {ok}
  Public, rate 5/min/IP
  Transaction: update user.passwordHash + mark token.usedAt + invalidate other tokens của user
  Lỗi: token không tồn tại / expired / đã dùng → 400

Habit schema:
  category String?  -- enum check ở zod: health|learning|mindfulness|lifestyle|other
  streakShieldEnabled Boolean @default(false)

calcStreak(checkIns, today, shieldEnabled):
  Đếm ngược từ today, mỗi ngày có check-in → streak++
  Nếu shieldEnabled và streak > 0 và chưa shield + ngày đó không phải today → cho phép 1 ngày miss duy nhất
  Hết shield → break
```

---

## Context

Mục tiêu: dựng BE NestJS song song với mobile để các màn (Leaderboard, Groups, Profile, Add-Habit) có data thật. Lựa chọn đã chốt:

- **BE stack**: NestJS + Prisma + PostgreSQL
- **Auth**: JWT email/password (access + refresh), hash bằng argon2
- **Repo**: Monorepo npm workspaces (`apps/mobile` + `apps/api` + `packages/shared`)
- **Hosting**: Local dev (Docker compose Postgres) trước, deploy sau

Hiện tại `E:\workspace\PulzApp` là mobile app standalone. Cần migrate sang monorepo trước, sau đó dựng BE song song.

---

## Monorepo structure (target)

```
PulzApp/                          # repo root
├── package.json                  # root: workspaces config
├── tsconfig.base.json            # shared TS config base
├── .gitignore                    # update để cover apps/, packages/
├── docker-compose.yml            # Postgres + (sau này) Redis cho dev
├── .env.example                  # template env cho cả 2 app
├── README.md
├── PLAN.md                       # FE plan (đã có)
├── PLAN_BE.md                    # file này
├── CLAUDE_CODE_PROMPT.md
├── DESIGN.md
│
├── apps/
│   ├── mobile/                   # = nội dung hiện tại của project
│   │   ├── package.json          # tên: @pulz/mobile
│   │   ├── app.json, eas.json, tsconfig.json, babel.config.js
│   │   ├── app/                  # expo-router screens
│   │   ├── components/
│   │   ├── constants/
│   │   ├── lib/
│   │   │   ├── i18n.ts
│   │   │   └── api/              # ★ MỚI: axios client + endpoints
│   │   ├── locales/
│   │   ├── store/
│   │   └── ...
│   │
│   └── api/                      # ★ MỚI: NestJS
│       ├── package.json          # tên: @pulz/api
│       ├── tsconfig.json
│       ├── nest-cli.json
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── config/           # env validation (Joi)
│       │   ├── prisma/           # PrismaService module
│       │   ├── auth/             # register/login/refresh, JWT strategy, guards
│       │   ├── users/            # user CRUD, /me
│       │   ├── habits/           # habits CRUD + check-in
│       │   ├── groups/           # tạo/join nhóm, members
│       │   └── leaderboard/      # query rank theo group + period
│       ├── test/
│       └── .env                  # local, không commit
│
└── packages/
    └── shared/                   # ★ MỚI: types/DTO/Zod dùng chung
        ├── package.json          # tên: @pulz/shared
        ├── tsconfig.json
        └── src/
            ├── index.ts
            ├── auth.dto.ts       # zod schemas → infer types
            ├── habit.dto.ts
            ├── group.dto.ts
            └── leaderboard.dto.ts
```

Vì sao `packages/shared`: BE định nghĩa DTO bằng `zod`, FE import cùng schema để type-safe & runtime validate response. Một nguồn chân lý cho contract API.

---

## Migration steps (từ current state → monorepo)

### 1. Move mobile vào `apps/mobile`
Files cần di chuyển từ `PulzApp/` → `PulzApp/apps/mobile/`:
- `app/`, `components/`, `constants/`, `lib/`, `locales/`, `store/`
- `app.json`, `babel.config.js`, `eas.json`, `expo-env.d.ts`, `tsconfig.json`, `package.json`

Files **ở lại root**:
- `CLAUDE_CODE_PROMPT.md`, `DESIGN.md`, `PLAN.md`, `PLAN_BE.md`
- `.git/`, `.claude/`

Files cần **xoá để reinstall sạch**:
- `node_modules/`, `package-lock.json`

### 2. Root `package.json` (workspaces)
```json
{
  "name": "pulzapp",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "mobile": "npm run start -w @pulz/mobile",
    "api": "npm run start:dev -w @pulz/api",
    "db:up": "docker compose up -d postgres",
    "db:migrate": "npm run prisma:migrate -w @pulz/api",
    "db:studio": "npm run prisma:studio -w @pulz/api",
    "typecheck": "npm run typecheck --workspaces --if-present"
  }
}
```

### 3. `apps/mobile/package.json` đổi tên
- `"name": "@pulz/mobile"` (giữ scripts hiện tại)
- Thêm `"@pulz/shared": "*"` vào deps

### 4. `docker-compose.yml` ở root
```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: pulz
      POSTGRES_PASSWORD: pulz_dev
      POSTGRES_DB: pulz_dev
    volumes:
      - pulz_pg:/var/lib/postgresql/data
volumes:
  pulz_pg:
```

### 5. Verify migration
- `npm install` từ root (workspaces sẽ link)
- `cd apps/mobile && npx expo start --lan` vẫn hoạt động như cũ
- `npx tsc --noEmit` ở mobile vẫn pass

---

## Backend implementation

### A. NestJS scaffold (apps/api)
- `npx @nestjs/cli new api --skip-git --skip-install --package-manager npm` (rồi move vào `apps/api`).
- Cài deps:
  ```
  npm i -w @pulz/api \
    @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt \
    @prisma/client argon2 zod nestjs-zod \
    class-validator class-transformer
  npm i -D -w @pulz/api prisma @types/passport-jwt
  ```
- `main.ts`: bật CORS (allow mobile dev origin), global ValidationPipe, prefix `/api/v1`.

### B. Prisma schema (`apps/api/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  displayName  String
  avatarUrl    String?
  createdAt    DateTime @default(now())

  habits       Habit[]
  memberships  GroupMember[]
  ownedGroups  Group[]       @relation("GroupOwner")
  checkIns     CheckIn[]
}

model Habit {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  emoji        String
  color        String?
  frequency    String   @default("daily") // daily | weekly:1,2,3 | etc.
  reminderTime String?  // "HH:mm" hoặc null
  groupId      String?
  group        Group?   @relation(fields: [groupId], references: [id], onDelete: SetNull)
  createdAt    DateTime @default(now())

  checkIns     CheckIn[]
  @@index([userId])
  @@index([groupId])
}

model CheckIn {
  id        String   @id @default(cuid())
  habitId   String
  habit     Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date      DateTime @db.Date          // chỉ ngày, không giờ
  completed Boolean  @default(true)
  createdAt DateTime @default(now())

  @@unique([habitId, date])             // 1 check-in / habit / day
  @@index([userId, date])
}

model Group {
  id        String   @id @default(cuid())
  code      String   @unique             // mã mời 6 ký tự
  name      String
  ownerId   String
  owner     User     @relation("GroupOwner", fields: [ownerId], references: [id])
  createdAt DateTime @default(now())

  members   GroupMember[]
  habits    Habit[]
}

model GroupMember {
  groupId  String
  group    Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role     String   @default("member")  // owner | admin | member
  joinedAt DateTime @default(now())

  @@id([groupId, userId])
  @@index([userId])
}
```

Seed (`prisma/seed.ts`): tạo user demo + 3 habit (water, exercise, sleep) + 1 group "Bạn thân" — dùng cho test FE khi BE chưa có UI quản trị.

### C. Modules

| Module | Endpoint | Mô tả |
|---|---|---|
| **Auth** | `POST /api/v1/auth/register` | body: email, password, displayName → tạo user, trả `{accessToken, refreshToken, user}` |
| | `POST /api/v1/auth/login` | body: email, password → `{accessToken, refreshToken, user}` |
| | `POST /api/v1/auth/refresh` | body: refreshToken → access mới |
| | `GET /api/v1/auth/me` | Bearer access → user info |
| **Habits** | `GET /api/v1/habits` | List habit của user + status hôm nay (done/streak) |
| | `POST /api/v1/habits` | Tạo habit |
| | `PATCH /api/v1/habits/:id` | Sửa |
| | `DELETE /api/v1/habits/:id` | Xoá (cascade check-ins) |
| | `POST /api/v1/habits/:id/checkin` | Toggle check-in hôm nay (idempotent) |
| | `GET /api/v1/habits/:id/checkins?from=&to=` | Lịch sử để vẽ streak |
| **Groups** | `POST /api/v1/groups` | Tạo nhóm (sinh code 6 ký tự) |
| | `POST /api/v1/groups/join` | body: code → join |
| | `GET /api/v1/groups` | Danh sách nhóm user thuộc |
| | `GET /api/v1/groups/:id` | Chi tiết + members + shared habits |
| | `POST /api/v1/groups/:id/leave` | Rời nhóm |
| **Leaderboard** | `GET /api/v1/groups/:id/leaderboard?period=today\|week\|all` | Rank members theo total check-ins |

Auth flow:
- Hash password bằng `argon2`.
- Access token TTL 15 phút, refresh 30 ngày, ký bằng JWT secret từ env.
- `JwtAuthGuard` global, route public dùng decorator `@Public()`.

### D. Env (`apps/api/.env.example`)
```
DATABASE_URL=postgresql://pulz:pulz_dev@localhost:5432/pulz_dev
JWT_ACCESS_SECRET=replace-me
JWT_REFRESH_SECRET=replace-me-too
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
PORT=3000
CORS_ORIGINS=http://localhost:8081,exp://192.168.1.6:8081
```

---

## Shared package (`packages/shared`)

Định nghĩa zod schema + infer type. BE dùng `nestjs-zod` để parse body. FE import schema để validate response.

Ví dụ `auth.dto.ts`:
```ts
import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(50),
});
export type RegisterDto = z.infer<typeof RegisterDto>;

export const AuthResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().nullable(),
  }),
});
export type AuthResponse = z.infer<typeof AuthResponse>;
```

---

## FE integration (apps/mobile)

### Thêm deps mobile
- `axios` cho HTTP client
- `@tanstack/react-query` cho data fetching + cache
- `expo-secure-store` cho lưu access/refresh token (an toàn hơn AsyncStorage)
- `@pulz/shared` workspace dep

### File mới
- `lib/api/client.ts` — axios instance + interceptor tự refresh khi access hết hạn.
- `lib/api/auth.ts`, `habits.ts`, `groups.ts` — wrap endpoint, parse với zod schema.
- `lib/api/queries.ts` — React Query hooks (`useHabits`, `useGroups`, `useLeaderboard`, `useToggleCheckIn`).
- `store/useAuthStore.ts` — zustand giữ user, token; subscribe SecureStore khi mount.
- `app/_layout.tsx` — bọc `<QueryClientProvider>`, hydrate auth state, redirect chưa auth → `/onboarding`.

### Env switching
- `apps/mobile/.env` (đọc qua `expo-constants` extra):
  ```
  EXPO_PUBLIC_API_URL=http://192.168.1.6:3000/api/v1
  ```
- Để cả device thật connect được: API listen `0.0.0.0`, dùng IP LAN (giống Metro).

### Cập nhật stores cũ
- `useHabitStore` (zustand + AsyncStorage) → thay bằng React Query hooks gọi BE.
- `useSettingsStore` (language, userName) → vẫn dùng zustand, chỉ sync `displayName` từ `/auth/me`.

---

## Parallel work plan

Mỗi phase BE mở khoá 1-2 màn FE:

| Phase | BE work | FE màn unlock |
|---|---|---|
| **1. Foundation** | Monorepo migrate, Prisma init, Auth module, JWT guard, seed user demo | Onboarding + Login/Register UI |
| **2. Habits** | Habits CRUD + CheckIn endpoint + streak calc | Home (dynamic data thật), Add-Habit |
| **3. Groups** | Groups + members + invite code | Groups list, Empty groups, Group Detail |
| **4. Leaderboard** | Leaderboard query (aggregate check-ins theo period) | Leaderboard screen |
| **5. Polish** | Push notification (sau), error handling, rate limit | Profile (display + settings) |

Phase 1 phải xong trước khi các phase khác bắt đầu (vì cần guard). Sau đó 2-3-4 có thể song song nếu cần — nhưng nên tuần tự để FE-BE feedback nhanh.

---

## Verification (cho phase 1)

1. `docker compose up -d postgres` — Postgres lên port 5432.
2. `npm run db:migrate -w @pulz/api` — Prisma migration apply.
3. `npm run api` — Nest dev server lên port 3000.
4. Test trong terminal:
   ```
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H 'Content-Type: application/json' \
     -d '{"email":"a@b.com","password":"12345678","displayName":"Minh"}'
   ```
   → trả `{accessToken, refreshToken, user}`.
5. `curl http://localhost:3000/api/v1/auth/me -H 'Authorization: Bearer <accessToken>'` → user info.
6. `npm run mobile` — Expo start; mobile vẫn render Home như cũ.
7. `npx tsc --noEmit` ở cả `apps/mobile` và `apps/api` đều pass.

---

## Out of scope (giai đoạn này)

- Social login (Google/Apple).
- Email verify / forgot password.
- Push notification reminder.
- File upload avatar (dùng URL public placeholder).
- Tests (Jest unit + e2e — thêm khi BE ổn).
- CI/CD.
- Deploy production (Railway/Render/VPS).
- Rate limit, observability (Sentry, OpenTelemetry).

---

## Decision points cần xác nhận trước khi code

1. **Migrate ngay hay sau khi FE Home stable?** — Khuyến nghị: migrate trước rồi mới code BE (clean state).
2. **Phase 1 first** chỉ làm Auth + scaffold, hay luôn 1 phát thẳng Phase 2 (Habits)? — Khuyến nghị: Phase 1 only, để có guard và verify auth flow trước.
3. **Tên DB / port khác** không? — Mặc định `pulz_dev` / 5432.
4. **Có cần seed nhiều user mẫu** để test leaderboard không? — Có thể seed 5 user + 1 group "Demo" với check-in random 30 ngày.

Sau khi bạn confirm 4 điểm trên, tôi bắt đầu Phase 1 (migrate + Auth scaffold).
