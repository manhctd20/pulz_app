# Deploy guide

Hai cách deploy: **(A) cloud truly-free** (Render + Neon, không cần card) hoặc **(B) self-host qua Cloudflare Tunnel** (PC bật 24/7, không cold start). Railway vẫn được nhắc đến cuối tài liệu cho khi sẵn sàng trả $5/tháng.

## TL;DR — fully free, no card

1. Postgres: [Neon](https://neon.tech) free (forever, 0.5GB compute / 3GB storage)
2. BE: [Render](https://render.com) free Web Service (sleep 15 phút idle, cold start ~30s)
3. Mobile: `npx expo start --tunnel` — share URL/QR cho bạn bè, không cần build native
4. Optional: cron-job.org ping `/api/v1/auth/me` mỗi 10 phút để giữ Render awake

Bạn bè cần Expo Go (App Store/Play Store) → scan QR → dùng app luôn. Zero cost.

---

## A. Cloud free path (Render + Neon)

### A1. Postgres trên Neon (zero cost, forever)

1. Đăng nhập [neon.tech](https://neon.tech) bằng GitHub (no card required).
2. Create Project → Region gần nhất (Singapore cho VN).
3. Sau khi tạo xong, vào tab **Connection Details** → copy connection string dạng:
   ```
   postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Local test connection:
   ```powershell
   $env:DATABASE_URL = "<paste>"
   cd apps/api
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   ```
   Sau lệnh này DB Neon đã có schema + seed data. Nếu cần xoá seed thì manually qua SQL editor của Neon.

### A2. Backend trên Render

1. Đăng nhập [render.com](https://render.com) bằng GitHub. Free tier không yêu cầu card.
2. **New +** → **Web Service** → connect repo PulzApp.
3. Service config:
   - **Name**: `pulz-api`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Runtime**: Node
   - **Build Command**:
     ```
     cd ../.. && npm install && npm run shared:build && cd apps/api && npx prisma generate && npm run build
     ```
   - **Start Command**:
     ```
     cd apps/api && npx prisma migrate deploy && node dist/main.js
     ```
   - **Instance Type**: **Free**
4. Tab **Environment** → Add:
   ```
   NODE_ENV=production
   DATABASE_URL=<Neon connection string>
   JWT_ACCESS_SECRET=<node -e "console.log(require('crypto').randomBytes(48).toString('base64'))">
   JWT_REFRESH_SECRET=<lệnh trên lần 2, secret khác>
   JWT_ACCESS_TTL=15m
   JWT_REFRESH_TTL=30d
   PORT=3000
   CORS_ORIGINS=exp://exp.host,https://expo.dev
   ```
   > Render free tier không cần `RESEND_API_KEY` — service sẽ log reset token thay vì gửi email (đủ cho test, user vẫn lấy được token qua API response trong NODE_ENV != production; muốn email thật thì đăng ký Resend free 100 email/ngày).
5. **Create Web Service** → Render build + deploy (~5-8 phút).
6. URL public dạng `https://pulz-api.onrender.com`.

**Verify**:
```powershell
curl https://pulz-api.onrender.com/api/v1/auth/me
# Expect 401 (alive)
```

### A3. Chống cold start (optional, free)

Render free sleep sau 15 phút không có request. Cold start ~30s lần đầu user mở app.

Workaround đơn giản: [cron-job.org](https://cron-job.org) free:
1. Đăng ký account.
2. **CREATE CRONJOB** → URL `https://pulz-api.onrender.com/api/v1/auth/me`, schedule mỗi 10 phút.
3. Render server sẽ luôn awake (lưu ý tổng compute hours free là 750 giờ/tháng, đủ cho 24/7).

### A4. Mobile share qua Expo Go tunnel

Không cần build EAS, đủ cho test 5-20 friends:

```powershell
cd apps/mobile
# Đổi env trỏ về Render URL
Set-Content .env "EXPO_PUBLIC_API_URL=https://pulz-api.onrender.com/api/v1"

npx expo start --tunnel
```

Tunnel mode chạy qua ngrok-tunnel của Expo. Console hiện QR + URL dạng `exp://u.expo.dev/...`. Share URL hoặc QR cho bạn bè.

Bạn bè:
1. Cài **Expo Go** (App Store / Play Store)
2. Scan QR (iOS: Camera native; Android: trong Expo Go có scanner)
3. App load qua tunnel → kết nối API Render → chạy

**Lưu ý SDK version**: Apple chỉ cho cài Expo Go latest. Phải đảm bảo SDK mobile khớp Expo Go hiện tại — nếu mismatch chạy `npx expo install --fix`.

### A5. Nếu muốn APK native cài thẳng (EAS free 30 builds/tháng)

```powershell
npm install -g eas-cli
cd apps/mobile
eas login
eas init
eas build --profile preview --platform android
```

Sau 10-20 phút, EAS đưa link download APK. Friends Android tải về cài thẳng.

---

## B. Self-host qua Cloudflare Tunnel (PC 24/7, no cold start)

Phù hợp nếu PC bạn để bật 24/7 và muốn 0 cold start. Postgres + API chạy local, public chỉ phần API qua tunnel.

### B1. Postgres local
```powershell
docker compose up -d postgres   # đã có sẵn
```

### B2. API local
```powershell
npm run api
# → http://0.0.0.0:3000/api/v1
```

### B3. Cài Cloudflare Tunnel
1. Cài cloudflared: [download Windows .exe](https://github.com/cloudflare/cloudflared/releases) → save `cloudflared.exe`.
2. Quick tunnel (không cần Cloudflare account):
   ```powershell
   .\cloudflared.exe tunnel --url http://localhost:3000
   ```
   Console sẽ in URL random dạng:
   ```
   https://random-words-xxxx.trycloudflare.com
   ```
3. URL này public truy cập được, persistent miễn `cloudflared` còn chạy. Restart sẽ đổi URL.

### B4. Persistent URL (cần Cloudflare account free)
Nếu muốn URL cố định `https://api.yourdomain.com`:
1. Đăng ký domain trên Cloudflare (~$10/năm cho `.com`, miễn phí cho `.tk`/`.ml` qua Freenom — không ổn định lắm).
2. Vào dashboard Cloudflare → **Zero Trust** → **Networks** → **Tunnels** → **Create tunnel**.
3. Đặt tên `pulz-api` → next → copy lệnh `cloudflared service install <TOKEN>` chạy trên PC.
4. Public Hostname tab → `api.yourdomain.com` → Service `http://localhost:3000`. Save.
5. Domain Cloudflare tự thêm CNAME, SSL auto.

### B5. Mobile config
```
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
# hoặc trycloudflare URL nếu dùng quick tunnel
```

Bạn bè scan QR Expo tunnel như A4.

---

## C. Railway (legacy — $5 credit/tháng)

Vẫn dùng được nếu chấp nhận $5/tháng credit (hết là phải bơm thêm). Cấu hình bên dưới — giữ lại cho ai đã setup sẵn.

[Railway](https://railway.app) host được Node + Postgres trong 1 project. Free tier: ~$5/tháng credit, đủ cho MVP.

### Bước 1: Tạo project + Postgres
1. Đăng nhập Railway → **New Project** → **Provision PostgreSQL**.
2. Vào Postgres service → tab **Variables** → copy `DATABASE_URL` (sẽ dùng làm env cho API).

### Bước 2: Deploy API
1. Trong cùng project, **New** → **GitHub Repo** → chọn repo PulzApp.
2. Service config:
   - **Root Directory**: `apps/api`
   - **Build Command**: `cd ../.. && npm install && npm run shared:build && cd apps/api && npx prisma generate && npm run build`
   - **Start Command**: `cd apps/api && npx prisma migrate deploy && node dist/main.js`
   - **Watch Paths** (optional): `apps/api/**`, `packages/shared/**`

3. Tab **Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=<paste từ Postgres service, hoặc reference: ${{Postgres.DATABASE_URL}}>
   JWT_ACCESS_SECRET=<chạy node -e "console.log(require('crypto').randomBytes(48).toString('base64'))">
   JWT_REFRESH_SECRET=<chạy lần nữa, secret khác>
   JWT_ACCESS_TTL=15m
   JWT_REFRESH_TTL=30d
   PORT=3000
   CORS_ORIGINS=https://your-domain.com,exp://exp.host/@your-username/pulzapp
   ```

   > **Quan trọng**: nếu dùng secret yếu hoặc `CORS_ORIGINS=*` trong production, API sẽ **refuse to start** (xem `assertProductionSecrets` trong `apps/api/src/main.ts`).

4. Tab **Settings** → **Networking** → bật **Generate Domain** để có URL public dạng `pulz-api-production.up.railway.app`.

5. Deploy → check logs xem `🚀 API listening on http://0.0.0.0:3000/api/v1`.

### Bước 3: Seed (1 lần)
Sau khi deploy lần đầu, chạy seed qua Railway shell hoặc local với `DATABASE_URL` production:
```powershell
$env:DATABASE_URL = "<production DATABASE_URL>"
cd apps/api
npx tsx prisma/seed.ts
```
*(Sau bước này, **đổi password seed users** hoặc xoá hết và tạo account thật).*

### Bước 4: Verify
```powershell
curl https://pulz-api-production.up.railway.app/api/v1/auth/me
# Expect: 401 (server alive, route protected)
```

---

## 2. Mobile → EAS Build (Preview / Production)

Mobile không deploy như BE — phải build native app rồi distribute. Có 2 lựa chọn:

| Option | Khi nào dùng | Distribute |
|---|---|---|
| **EAS Update** | Đổi JS/asset, không đổi native deps | OTA — user mở app là tự cập nhật |
| **EAS Build (Preview)** | Lần đầu hoặc thêm native module | Build IPA/APK → bạn tải vào TestFlight (iOS) hoặc cài trực tiếp APK (Android) |

### Bước 1: Setup EAS
```powershell
npm install -g eas-cli
cd apps/mobile
eas login                # đăng nhập tài khoản Expo
eas init                 # link project với Expo dashboard, sinh projectId
```

### Bước 2: Cấu hình env production
Cập nhật `apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://pulz-api-production.up.railway.app/api/v1
```
> Lưu ý: env biến `EXPO_PUBLIC_*` được inline vào bundle khi build. Đổi URL = phải build lại (hoặc dùng EAS Update với env mới).

### Bước 3: Build Preview cho iOS / Android
```powershell
# Android APK (cài thẳng cho bạn bè test):
eas build --profile preview --platform android

# iOS (cần Apple Developer account $99/year để cài thiết bị thật):
eas build --profile preview --platform ios
```

Build mất ~10-20 phút. Sau khi xong, EAS đưa link download — share cho bạn bè:
- Android: cài bằng cách bật "Cài app từ nguồn không xác định" → tap APK.
- iOS: phải qua TestFlight nếu chưa enrol device qua `eas device:create`.

### Bước 4: OTA Update (sau khi đã có Preview build)
Khi sửa JS/UI mà không đổi native deps:
```powershell
eas update --branch preview --message "Fix Home greeting"
```
User mở app sẽ tự pull update mới (vài giây).

---

## 3. Checklist trước khi mời bạn bè test

- [ ] API health: `curl https://your-api.../api/v1/auth/me` trả 401
- [ ] `/test-pulz` từ local chỉ vào prod URL (đổi tạm `EXPO_PUBLIC_API_URL` rồi test) — Auth + Habits + Groups + Leaderboard pass
- [ ] `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` đã generate strong (≥48 random bytes base64)
- [ ] `CORS_ORIGINS` không phải `*`, đã có domain mobile EAS scheme + production domain
- [ ] Seed users có password mạnh (hoặc đã xoá seed users sau verify)
- [ ] Rate limit hoạt động: thử login fail 6 lần → phải có 429
- [ ] Database backup tự động bật (Railway: Settings → Backups, hoặc dùng `pg_dump` cron)

---

## 4. Chi phí ước tính

| Service | Free tier (recipe A) | Khi vượt |
|---|---|---|
| Neon Postgres | 0.5GB compute / 3GB storage / 750h compute/tháng — **$0 forever** | $19/tháng |
| Render Web | 750h instance hours/tháng, sleep 15p idle, cold start ~30s — **$0** | $7/tháng |
| Cloudflare Tunnel | Quick tunnel hoặc Zero Trust free tier — **$0** | Pro $20/tháng nếu cần advanced |
| Expo Go + tunnel | Unlimited share qua URL/QR — **$0**, không build native | — |
| EAS Build | 30 builds/tháng free (Android APK + iOS sim) | $19/tháng (Production) |
| Expo Updates | unlimited OTA — **$0** | — |
| cron-job.org | Unlimited cron 1 phút/cron — **$0** | — |
| Apple Developer | — | $99/năm (chỉ cần khi publish App Store) |
| Google Play Developer | — | $25 one-time |

**Cho MVP test với 5-20 bạn bè bằng Recipe A: chi phí $0/tháng**. Trade-off: cold start ~30s nếu không cron-ping; mobile chạy qua Expo Go không cần build native.

---

## 5. Alternative hosting

| Provider | Pros | Cons |
|---|---|---|
| **Render** (recipe A) | Free web tier không cần card, có thể dùng forever | Sleep 15 phút → cold start ~30s; lưu DB phải dùng Neon hoặc Render PG 90 ngày |
| **Neon** (recipe A DB) | Forever free Postgres, không cần card, persistent | Compute cap 0.5 vCPU |
| **Cloudflare Tunnel** (recipe B) | Không cold start, không card, URL public miễn phí | PC phải bật 24/7 |
| **Fly.io** | Generous free, regions gần VN | Yêu cầu credit card để verify |
| **Railway** | UI dễ dùng, 1-click monorepo | $5 credit/tháng (vượt là phải bơm thêm) |
| **VPS tự host** (Hetzner, DigitalOcean) | Full control, $5/tháng dư xài | Phải tự cài Docker + nginx + SSL |

Tất cả đều support build từ Dockerfile. Tham khảo `apps/api/Dockerfile` (chưa có, có thể add sau).

---

## 6. Tham khảo
- [Railway docs — Monorepo](https://docs.railway.app/guides/monorepo)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Updates](https://docs.expo.dev/eas-update/introduction/)
