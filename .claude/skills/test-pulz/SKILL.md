---
name: test-pulz
description: Run end-to-end smoke + security + performance tests on PulzApp BE (Auth, Habits, Groups, Leaderboard, Authz, IDOR, latency, npm audit) and optional mobile typecheck. Use after implementing a new BE feature, after migrating data, or before pushing. Args `--api-only` skip mobile typecheck, `--no-restart` reuse running API, `--reseed` reset DB, `--quick` skip security+perf, `--security-only` only security battery.
---

# /test-pulz — Smoke test PulzApp

Mục đích: sau khi implement xong 1 tính năng (BE module, FE màn dùng API mới, sửa schema...), chạy skill này để confirm các tính năng đã có vẫn hoạt động + tính năng mới hoạt động.

## Khi nào dùng
- User vừa nói "đã xong tính năng X, kiểm tra giúp"
- Sau khi migrate schema (`prisma migrate dev`)
- Trước khi commit hoặc push một thay đổi đụng BE / contract API
- Sau khi merge / pull code mới về

## Phạm vi
Skill này test **BE end-to-end qua HTTP**, không test UI tự động (RN không có headless test sẵn). Sau khi BE pass, prompt user mở Expo Go để smoke test UI thủ công.

## Args
- `--api-only` : skip mobile typecheck.
- `--no-restart` : giả định API đã chạy ở `http://localhost:3000/api/v1`, không tự start.
- `--reseed` : reset database + chạy lại seed trước khi test (clean slate).

## Pre-flight (luôn chạy trước)

1. **Postgres up?**
   ```powershell
   docker compose ps --format json | ConvertFrom-Json | Where-Object { $_.Service -eq 'postgres' -and $_.State -eq 'running' }
   ```
   Nếu rỗng → `docker compose up -d postgres` + wait `docker inspect pulz-postgres --format '{{.State.Health.Status}}'` until `healthy` (timeout 60s).

2. **Shared package built?**
   ```powershell
   Test-Path E:\workspace\PulzApp\packages\shared\dist\index.js
   ```
   Nếu False → `npm run shared:build` (từ root).

3. **API running?**
   ```powershell
   try { Invoke-WebRequest -Uri http://localhost:3000/api/v1/auth/me -TimeoutSec 2 -ErrorAction Stop } catch { $_.Exception.Response.StatusCode }
   ```
   - Trả `401 Unauthorized` → API up, tốt.
   - Connection refused / không bắt được → start API: `npm run start:dev -w @pulz/api` **trong background** (`run_in_background: true`). Đợi log có `API listening on` (tail file output) hoặc poll `/auth/me` trả 401 (timeout 60s).
   - Nếu user truyền `--no-restart` và API không tới được → fail luôn, không start.

4. **Reseed nếu user yêu cầu** (`--reseed`):
   ```powershell
   cd apps\api; npx prisma migrate reset --force --skip-seed; npx tsx prisma\seed.ts
   ```

## Test battery

Thực hiện tuần tự, mỗi check ghi PASS/FAIL + chi tiết. **Không dừng ở fail đầu tiên** — chạy hết để có report đầy đủ. Cuối báo cáo summary: `X/Y checks passed`.

Track 2 token động (PowerShell variables):
- `$minhT` = access token của user `minh@pulz.dev`
- `$lanT` = access token của user `lan@pulz.dev`

Convention assertion: dùng `try { ... } catch { FAIL }`. So sánh bằng `-eq`/`-gt`/`Should` style đơn giản. Bắt cả HTTP error code khi cần (vd group not found phải trả 404).

### Auth (C1–C4)

**C1: Login seed user `minh@pulz.dev`**
```powershell
$body = '{"email":"minh@pulz.dev","password":"password123"}'
$res = Invoke-RestMethod -Uri http://localhost:3000/api/v1/auth/login -Method Post -Body $body -ContentType 'application/json'
```
Expect: `$res.accessToken` không null, `$res.user.displayName -eq 'Minh'`. Lưu `$minhT = $res.accessToken`. Cũng login `lan@pulz.dev` lưu `$lanT`.

**C2: GET /auth/me**
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/v1/auth/me -Headers @{Authorization="Bearer $minhT"}
```
Expect: `email -eq 'minh@pulz.dev'`.

**C3: Refresh token**
```powershell
$body = '{"refreshToken":"' + $res.refreshToken + '"}'
$r = Invoke-RestMethod -Uri http://localhost:3000/api/v1/auth/refresh -Method Post -Body $body -ContentType 'application/json'
```
Expect: `$r.accessToken` không null và khác `$minhT`.

**C4: Reject invalid creds**
```powershell
try { Invoke-RestMethod -Uri http://localhost:3000/api/v1/auth/login -Method Post -Body '{"email":"minh@pulz.dev","password":"wrong"}' -ContentType 'application/json'; "should-fail" } catch { $_.Exception.Response.StatusCode }
```
Expect: 401.

### Swagger docs (C0)

**C0: Swagger docs reachable**
```powershell
$r = Invoke-WebRequest -Uri http://localhost:3000/docs -UseBasicParsing -TimeoutSec 5
$j = (Invoke-WebRequest -Uri http://localhost:3000/docs-json -UseBasicParsing).Content | ConvertFrom-Json
```
Expect: HTML status 200 + body chứa `swagger-ui`. JSON spec có `openapi: '3.0.0'` và ≥10 paths. KHÔNG bị throttle (skipIf đã setup).

### Habits (C5–C8)

**C5: GET /habits với token Minh**
Expect: array length >= 3 (seed), mỗi item có `id, name, emoji, currentStreak, doneToday`.

**C6: Create habit `Đọc sách 30 phút`**
```powershell
$body = '{"name":"Đọc sách 30 phút","emoji":"📖","frequency":"daily"}'
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
$h = Invoke-RestMethod -Uri http://localhost:3000/api/v1/habits -Method Post -Body $bytes -ContentType 'application/json; charset=utf-8' -Headers @{Authorization="Bearer $minhT"}
```
Expect: `$h.id` không null, `$h.currentStreak -eq 0`, `$h.doneToday -eq $false`.

**C7: Check-in idempotent toggle**
- POST `/habits/$($h.id)/checkin` → expect `done=true, currentStreak >= 1`
- POST lại lần nữa → expect `done=false, currentStreak` giảm về 0
- POST lần thứ ba → expect `done=true, currentStreak >= 1` lại

**C8: Delete habit + verify gone**
- DELETE `/habits/$($h.id)` → expect 200
- GET `/habits/$($h.id)/checkin` POST nữa → expect 404 (habit không còn)

**C8b: Habit history**
- GET `/habits/<seed habit id>/history?days=30`
- Expect: `entries.Count = 30`, mỗi entry `{date, completed}`. `currentStreak`, `longestStreak`, `totalDone` >= 0. `longestStreak >= currentStreak`. `totalDone` = số entries có `completed: true`.

### Groups (C9–C13)

**C9: List groups của Minh**
Expect: ít nhất 1 group (seed: code DEMO01 nếu chưa reseed).

**C10: Tạo group mới**
```powershell
$body = '{"name":"Test Group"}'
$g = Invoke-RestMethod -Uri http://localhost:3000/api/v1/groups -Method Post -Body $body -ContentType 'application/json' -Headers @{Authorization="Bearer $minhT"}
```
Expect: `$g.code.Length -eq 6`, `$g.memberCount -eq 1`, `$g.ownerId` = Minh's id.

**C11: Lan join bằng code**
```powershell
$joined = Invoke-RestMethod -Uri http://localhost:3000/api/v1/groups/join -Method Post -Body ('{"code":"' + $g.code + '"}') -ContentType 'application/json' -Headers @{Authorization="Bearer $lanT"}
```
Expect: `memberCount -eq 2`.

Verify join duplicate: gọi lại với Lan → expect 409.

**C12: Get detail + verify members/sharedHabits structure**
```powershell
$d = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/groups/$($g.id)" -Headers @{Authorization="Bearer $minhT"}
```
Expect: `$d.members.Count -eq 2`, mỗi member có `user.displayName, role, currentStreak, todayDone, todayTotal`. `$d.sharedHabits` là array (có thể rỗng nếu chưa add habit nào vào group).

**C13: Lan leave + Minh (owner) cannot leave + Minh delete**
- POST `/groups/$($g.id)/leave` với `$lanT` → 200, `ok: true`
- POST `/groups/$($g.id)/leave` với `$minhT` → 400 (owner không leave)
- DELETE `/groups/$($g.id)` với `$lanT` → 403 (đã leave nên không phải member, expect 403/404 OK cả 2)
- DELETE `/groups/$($g.id)` với `$minhT` → 200

**C13b: Rename group (owner-only)**
- Tạo test group bằng `$minhT`, lưu `$g.id`
- PATCH `/groups/$($g.id)` body `{"name":"Renamed"}` với `$minhT` → 200, response có `name: "Renamed"` và `code` giữ nguyên
- PATCH cùng endpoint với `$lanT` (non-owner) → expect 403
- Cleanup: DELETE group

**C13c: Kick member (owner-only)**
- Tạo test group bằng `$minhT`; Lan join bằng `$lanT`
- DELETE `/groups/$($g.id)/members/$lanId` với `$minhT` → 200
- Verify detail.memberCount giảm 1
- Owner tự kick chính mình: DELETE `/groups/$($g.id)/members/$minhId` với `$minhT` → expect 400
- Non-owner kick member khác: dùng `$lanT` để kick → expect 403 (Lan đã bị kick)
- Cleanup: DELETE group

### Leaderboard (C14)

Lấy seed group DEMO01 (id qua list /groups), thử 3 period:
```powershell
foreach ($p in 'today','week','all') {
  $lb = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/groups/$seedGroupId/leaderboard?period=$p" -Headers @{Authorization="Bearer $minhT"}
  # Expect: entries count -eq 5, all ranks unique increasing OR ties allowed
}
```
Expect: `entries.Count -eq 5`, mỗi entry có `userId, displayName, totalCheckIns, rank`. Verify rank sorted ascending khi sort theo totalCheckIns desc.

### Authorization edge cases (C15)

- Gọi GET `/habits` không header → expect 401
- Lan gọi GET `/groups/<seed-DEMO01-id>` mà Lan vẫn là member → expect 200
- Tạo user mới qua register, gọi GET DEMO01 detail → expect 403 (not a member)
- IDOR habit: tạo habit với `$minhT`, dùng `$lanT` thử PATCH habit đó → expect 403/404. Verify ở S3 đã chi tiết hơn.

### Mobile typecheck (C16) — skip nếu `--api-only`

```powershell
cd E:\workspace\PulzApp; npm run typecheck -w @pulz/mobile
```
Expect: exit code 0.

Cũng chạy `npm run typecheck -w @pulz/api` và `npm run typecheck -w @pulz/shared`.

---

## Security battery — skip nếu `--quick`

Track variable: `$secFails = @()` để liệt kê cuối cùng.

**S1: JWT signature tampering**
Lấy `$minhT`, đảo 1 ký tự ở giữa signature (sau dot thứ 2). Gọi `/auth/me` với token đã sửa.
Expect: 401. Nếu khác → FAIL (cryptographic verification bị hỏng).

**S2: Algorithm `none` attack**
Tạo JWT với header `{"alg":"none"}` payload `{"sub":"<minh-id>","email":"minh@pulz.dev"}` không signature. Gọi `/auth/me`.
Expect: 401. Nếu 200 → CRITICAL (lib accept `alg:none`).

**S3: IDOR — Lan thao tác habit của Minh**
- GET `/habits` với `$minhT` → lấy 1 habit ID của Minh
- PATCH habit đó với `$lanT` (body `{"name":"hacked"}`) → expect 403 hoặc 404
- DELETE với `$lanT` → expect 403 hoặc 404
- POST `/habits/<minhHabitId>/checkin` với `$lanT` → expect 403 hoặc 404
Nếu bất kỳ 200 → CRITICAL (IDOR habit).

**S4: IDOR — Non-member xem group**
Register user mới `idor_<timestamp>@test.dev` / `password123`. Login. Gọi GET `/groups/<DEMO01-id>`.
Expect: 403. Nếu 200 → FAIL.

**S5: Mass assignment trong register**
POST `/auth/register` với body có thêm field `role: "admin"` hoặc `id: "deadbeef"`:
```powershell
$body = '{"email":"mass_<ts>@test.dev","password":"password123","displayName":"X","role":"admin","id":"hack"}'
```
Expect: 200 hoặc 400 (zod strict mode). Nếu 200, GET `/auth/me` với token mới → user record không có `role: "admin"`, `id` là cuid mới (không phải "hack"). Schema Prisma không có `role` ở User nên field bị ignore → OK. Verify `id` khác `"hack"`.

**S6: SQL/NoSQL injection probe (read-only payload)**
- POST login với `email: "minh@pulz.dev' OR '1'='1"` password bất kỳ → expect 401 (Prisma parameterize)
- POST login với `email: {"$ne": null}` (object thay vì string) → expect 400 (zod reject non-string)
Nếu bất kỳ 200 → CRITICAL.

**S7: Password strength**
POST register với password `"short"` (5 ký tự):
Expect: 400 (zod schema `min(8)`). Nếu 200 → FAIL.

**S8: Login error message không phân biệt user-exists vs wrong-password**
- POST login `"notexist_<ts>@test.dev" / "anything"` → response message X
- POST login `"minh@pulz.dev" / "wrongpassword"` → response message Y
Expect: X.message -eq Y.message (cả 2 = "Invalid credentials"). Khác → INFO (info leak nhẹ, không CRITICAL).

**S9: Group code không leak qua API public**
GET `/groups` không token → expect 401. Verify response body không chứa group code nào.

**S10: Owner cannot be removed by member**
Lan join Test Group → Lan gọi DELETE `/groups/<id>` (không phải owner) → expect 403. Đã verify ở C13 implicit, ghi nhận lại trong security pass.

**S11: Rate limit on auth** (BE đã có `@nestjs/throttler` v6)
Cấu hình: `/auth/login` 5/phút/IP, `/auth/register` 3/phút/IP, `/auth/refresh` 10/phút/IP, default 100/phút/IP.

Test: gọi 8 POST `/auth/login` liên tục (cùng IP). Expect: 5 đầu → 401 (wrong password), 3 sau → 429.
- 5 OK + ≥1 throttled (429) → PASS
- Tất cả 401, không có 429 → FAIL (throttler không hoạt động — check ThrottlerGuard registered global trong app.module.ts).
- ⚠️ Lưu ý: throttler counter trong-memory, reset khi API restart. Nếu test pass rồi muốn test lại cần đợi 60s hoặc restart API.

**S12: Dependency vulnerabilities**
```powershell
cd E:\workspace\PulzApp; $audit = npm audit --json 2>$null | ConvertFrom-Json
$high = $audit.metadata.vulnerabilities.high + $audit.metadata.vulnerabilities.critical
```
Expect: `$high -eq 0`. Nếu > 0 → FAIL, in tên các package vulnerable + lệnh `npm audit fix`.

**S13: Sensitive data trong response**
GET `/auth/me`, GET `/habits`, GET `/groups`, GET `/groups/:id`:
- KHÔNG có field `passwordHash` ở bất kỳ response.
- KHÔNG có raw `JWT_*` secret trong stack trace error (gây 500 cố ý: gọi `/habits/invalid-uuid-format`, check response).
Nếu lộ → CRITICAL.

**S14: CORS lockdown**
Dev fallback (CORS_ORIGINS rỗng): cho phép `localhost`, `192.168.*`, `10.*`, `exp://`. Block public origin.
- Test 1: gửi OPTIONS preflight với `Origin: http://localhost:8081` → expect `Access-Control-Allow-Origin: http://localhost:8081`.
- Test 2: với `Origin: https://evil.com` → expect KHÔNG có `Access-Control-Allow-Origin` (hoặc không match).
Production guard: nếu `NODE_ENV=production` + `CORS_ORIGINS=*` → API refuse start. Để test: tạm set 2 biến + restart → expect throw `Refusing to start in production with insecure config`. Khôi phục env sau test.

**S15: Production secret guard**
Thử `NODE_ENV=production` + JWT secret cũ (chứa "dev-") → API phải refuse start với message rõ ràng. Khôi phục env sau test.

---

## Performance battery — skip nếu `--quick`

Track endpoint latency với `Measure-Command`. Chạy 5 lần warmup + 10 lần đo, lấy p50 + p95.

Thresholds (Postgres local, 5 user × 3 habit × 30 ngày check-in seed):
| Endpoint | p50 mục tiêu | p95 mục tiêu |
|---|---|---|
| POST /auth/login | 200ms | 400ms (argon2 verify chậm cố ý) |
| GET /auth/me | 30ms | 80ms |
| GET /habits | 50ms | 120ms |
| POST /habits/:id/checkin | 60ms | 150ms |
| GET /groups | 80ms | 200ms |
| GET /groups/:id | 150ms | 400ms (N+1 risk) |
| GET /groups/:id/leaderboard?period=week | 80ms | 200ms |

Pattern PowerShell:
```powershell
function Bench($name, $block) {
  1..5 | ForEach-Object { & $block } | Out-Null
  $times = 1..10 | ForEach-Object { (Measure-Command $block).TotalMilliseconds }
  $sorted = $times | Sort-Object
  $p50 = $sorted[4]
  $p95 = $sorted[9]
  [PSCustomObject]@{ Endpoint=$name; p50=[math]::Round($p50); p95=[math]::Round($p95) }
}
$results = @()
$results += Bench '/auth/me' { Invoke-RestMethod -Uri http://localhost:3000/api/v1/auth/me -Headers @{Authorization="Bearer $minhT"} }
# ... tương tự cho các endpoint khác
$results | Format-Table -AutoSize
```

Mỗi endpoint:
- p95 ≤ target → PASS
- target < p95 ≤ 2× target → WARN (in vàng, không fail)
- p95 > 2× target → FAIL (CRITICAL, có thể là N+1 hoặc thiếu index)

**P-extra: Detect N+1 trong /groups/:id**
Bật Prisma query log tạm thời (set `DEBUG=prisma:query`) qua env hoặc add `log: ['query']` vào PrismaClient. Đếm số query khi gọi GET `/groups/:id` 1 lần.
- Member count = 5, habit count = 5 trong seed
- Expect tổng query ≤ 6 (1 group + 1 members + 1 habits + 1 aggregate today + 1 _count + buffer). Nếu > 15 → FAIL (likely N+1).
Skip check này nếu khó setup log temporary; mark INFO.

**P-extra: Mobile bundle size khi --api-only chưa skip**
```powershell
cd apps\mobile; npx expo export --platform ios --no-bytecode --output-dir .perf-bundle 2>&1
Get-ChildItem .perf-bundle -Recurse -File | Measure-Object Length -Sum
```
Expect: bundle JS < 6MB (typical RN app). Cleanup `.perf-bundle` sau khi đo. (Tốn ~30s; skip nếu `--quick`.)

---

## Reporting

Sau khi chạy xong, in summary dạng:

```
PulzApp smoke test — <timestamp>
=================================
Infra
  C0 Swagger  : /docs 200 + /docs-json valid ✅
Functional
  Auth        : 4/4 ✅
  Habits      : 5/5 ✅ (CRUD + checkin + history)
  Groups      : 8/8 ✅ (CRUD + rename + kick)
  Leaderboard : 1/1 ✅
  Authz       : 4/4 ✅
Security
  S1-S10      : 10/10 ✅
  S11 throttle: ✅ login 5/min, 6th → 429
  S12 audit   : 0 high/critical ✅
  S13 leak    : ✅
  S14 CORS    : ✅ dev fallback OK, prod guard active
  S15 prod sec: ✅ refuse start with weak secrets
Performance
  /auth/me            : p50  18ms / p95  42ms ✅
  /habits             : p50  35ms / p95  91ms ✅
  /habits/:id/history : p50  45ms / p95 110ms ✅
  /groups             : p50  72ms / p95 168ms ✅
  /groups/:id         : p50 142ms / p95 387ms ✅
  /leaderboard?week   : p50  68ms / p95 178ms ✅
  /auth/login         : p50 187ms / p95 312ms ✅
  N+1 detection       : 7 queries — OK ✅
Typecheck   : 3/3 ✅
---
PASS: 35/35
```

Severity convention:
- **CRITICAL** : bug bảo mật nghiêm trọng (IDOR, alg:none, SQL inject, secret leak) — block release.
- **FAIL**    : functional broken, performance regression > 2× target.
- **WARN**    : performance giữa 1× và 2× target.
- **INFO**    : nice-to-have (rate limit, CORS lock-down) — note nhưng không block.

Nếu có fail, in chi tiết cụ thể từng check fail (HTTP code thực tế, response body nếu khác expect, latency thực tế). KHÔNG ẩn lỗi. Sau report, gợi ý next action cho từng CRITICAL/FAIL.

## Sau khi xong

Nếu tất cả pass, nhắc user:
> BE smoke OK. Để verify UI: `npm run mobile -- --lan` (đảm bảo `EXPO_PUBLIC_API_URL` trỏ đúng IP LAN trong `apps/mobile/.env`), login `minh@pulz.dev / password123`, đi qua Home → Nhóm → Hạng → tap FAB Add Habit để confirm flow.

Nếu API được start bởi skill (không phải user đã chạy sẵn), hỏi user có muốn stop không trước khi thoát. Mặc định LEAVE RUNNING để user verify UI ngay.

## Lưu ý implementation cho agent

- Dùng `Invoke-RestMethod` cho JSON response, `Invoke-WebRequest` khi cần status code.
- Khi expect lỗi HTTP, dùng `try/catch` và check `$_.Exception.Response.StatusCode -as [int]`.
- Test data create (group "Test Group", habit "Đọc sách 30 phút") phải cleanup (DELETE) ở cuối check tương ứng để không leak state giữa các lần chạy.
- Không seed lại trừ khi user nói `--reseed`.
- Nếu Docker không chạy → fail check #1, in lệnh `docker compose up -d postgres` cho user, không tự start Docker Desktop.
- Tất cả endpoint dùng prefix `/api/v1` (đã set global trong main.ts).
