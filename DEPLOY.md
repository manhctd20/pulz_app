# Deploy guide

Deploy PulzApp BE lên Railway (nhanh nhất, free tier) + mobile qua EAS Preview build.

---

## 1. Backend → Railway

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

| Service | Free tier | Khi vượt |
|---|---|---|
| Railway | $5 credit/tháng (đủ ~500 hours runtime + Postgres < 1GB) | $5-10/tháng cho hobby |
| EAS Build | 30 builds/tháng free | $19/tháng (Production) |
| Expo Updates | unlimited OTA | — |
| Apple Developer | — | $99/năm (chỉ cần khi publish App Store) |
| Google Play Developer | — | $25 one-time |

Cho MVP test với 5-20 bạn bè, **chi phí $0** nếu chỉ dùng Android APK + Railway free tier.

---

## 5. Alternative hosting

Nếu Railway không hợp:

| Provider | Pros | Cons |
|---|---|---|
| **Render** | Free Postgres 90 ngày, free web service tier (sleep after 15 phút) | Sleep cold start chậm |
| **Fly.io** | Generous free tier, IPv6, regions gần VN | UI hơi rối |
| **VPS tự host** (Hetzner, DigitalOcean) | Full control, $5/tháng dư xài | Phải tự cài Docker + nginx + SSL |

Tất cả đều support build từ Dockerfile. Tham khảo `apps/api/Dockerfile` (chưa có, có thể add sau).

---

## 6. Tham khảo
- [Railway docs — Monorepo](https://docs.railway.app/guides/monorepo)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Updates](https://docs.expo.dev/eas-update/introduction/)
