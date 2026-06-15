# UI/UX + Logic Test Report

**Mode:** Web build (`expo start --web`) drive qua Preview MCP
**Lý do:** không truy cập trực tiếp Expo Go trên iPhone bạn được. Web build chia sẻ ~80% code (logic, layout, state, API contract). Còn lại 20% (BlurView intensity native, haptic, status bar, safe-area, gesture iOS specific) yêu cầu test trên iPhone thật.

---

## Functional & UX flow — đã verify

| # | Flow | Kết quả |
|---|---|---|
| 1 | Cold start → redirect `/onboarding` khi `hasSeenOnboarding=false` | ✅ Onboarding hero gradient + 2 CTA render đúng |
| 2 | Onboarding "Have account? Sign in" → `/login` | ✅ Navigate đúng, mark `hasSeenOnboarding=true` |
| 3 | Login form prefilled `minh@pulz.dev` / `password123` → submit | ✅ Token stored (localStorage trên web), redirect `/` |
| 4 | Home render | ✅ Greeting cá nhân, glass progress card, 3 habits với emoji + tên VN, FAB tím |
| 5 | Tap check circle habit | ✅ Optimistic update + API call, progress bar fill animation, streak badge update từ "0d" → "2d", check icon teal |
| 6 | Tab navigation 4 tab | ✅ Active state đổi icon filled + dot, FloatingTabBar render đẹp |
| 7 | Groups list | ✅ Card "Bạn thân" với 5 members · 5 habits, progress bar 1/5 check-ins, avatar stack với "+2" overflow, code badge "DEMO01" |
| 8 | Tap Group card → Group Detail | ✅ Info card với invite code copyable, shared habits 4 items + counter "X/5 members done today", members list với role + streak + today stats |
| 9 | Back từ Group Detail | ✅ Quay về Groups tab |
| 10 | Tab Leaderboard | ✅ Title + group meta, segment "This week" selected, podium top-3 với vương miện ⭐ cho #1 (Huy 8pts), bar height 1>2>3, rank list #4-5 dưới |
| 11 | Tab Profile | ✅ Avatar M, name "Minh", email, joined month qua Intl, 3 stats từ data thật (streak 2, habits 3, group "Bạn thân"), achievements 3 badge (1 unlocked: "First group joined"), settings list 5 row |
| 12 | Tap Language setting | ✅ Toggle vi↔en, **toàn bộ UI re-render ngay** sang ngôn ngữ mới |
| 13 | FAB `+` → Add Habit modal | ✅ Form đầy đủ: tên, 9 emoji picker, 5 color dot, frequency segment (Daily/Weekly), reminder HH:mm field, group chip selector |
| 14 | Save button disabled khi name rỗng | ✅ Opacity 0.6 + disabled tap |
| 15 | Tap Theme setting | ✅ Cycle Dark → Light → System; icon đổi (moon → sunny → phone), label đổi; mọi surface + text invert đúng; persist qua reload |
| 16 | Light mode rendering | ✅ Nền trắng, text dark, cards `#FFFFFF`, dividers grey nhạt, brand colors (tím/teal/coral) giữ nguyên, contrast OK |
| 17 | Status bar style theo theme | ✅ Dark theme → status bar `light`; Light/System(light) → `dark` |

---

## Bug phát hiện + đã fix

### 🐛 #1: `expo-secure-store` không có web shim trong SDK 54
**Triệu chứng:** Khi `useAuthStore.hydrate()` gọi `SecureStore.getItemAsync()` trên web → `TypeError: ExpoSecureStore.default.getValueWithKeyAsync is not a function`. Auth state stuck, app load trong trạng thái lỗi.

**Root cause:** `expo-secure-store@15.0.7` mobile-only, không có browser polyfill.

**Fix:** [apps/mobile/lib/api/tokenStorage.ts](apps/mobile/lib/api/tokenStorage.ts) — thêm Platform.OS check, web fallback dùng `localStorage` (lazy require `expo-secure-store` chỉ trên native).

### 🐛 #2: Joined month hard-code Tiếng Việt
**Triệu chứng:** Profile hiển thị "Joined Tháng 6/2026" ngay cả khi app đang English.

**Fix:** [apps/mobile/app/(tabs)/profile.tsx](apps/mobile/app/(tabs)/profile.tsx) — `formatJoinedMonth(iso, locale)` dùng `Intl.DateTimeFormat` với locale `vi-VN` hoặc `en-US`. Verified: VN ra "tháng 6 năm 2026", EN ra "June 2026".

### 🐛 #3: Light theme — Typography text giữ màu cũ sau khi cycle theme
**Triệu chứng:** Tap Theme → app surface invert sang light NHƯNG text dùng `Typography.headline` vẫn dark (vô hình trên nền trắng).

**Root cause:** Ban đầu mutation `Object.assign(Typography.X, {color})` đặt trong `useEffect` của root layout → chạy AFTER zustand state change → component đã render xong với màu cũ.

**Fix:** [apps/mobile/lib/theme.ts](apps/mobile/lib/theme.ts) — chuyển `syncTypography(colors)` vào BÊN TRONG `useColors()` hook. Hook gọi sync mỗi lần được consume, ensure Typography colors update SYNCHRONOUSLY trước khi consumer render. Thêm `lastSyncedScheme` guard tránh assign thừa.

---

## UX nit (không block)

1. **Avatar placeholder `?`** trong GroupCard khi `avatarUrl: null` — nên show chữ cái đầu tên user thay vì `?`. Cần BE trả thêm `displayName` trong `memberAvatars`, hoặc đổi schema `memberAvatars` → `members[{ name, avatarUrl }]`.
2. **Podium positions** trong Leaderboard hiện dựa `entries[0/1/2]` chứ không dùng field `rank`. Khi có tied ranks (vd 2 user cùng 6pts), podium vẫn show 2 và 3 distinct. Acceptable cho MVP, có thể add "T-2" badge sau.

---

## Web test không cover được (cần iPhone)

1. **BlurView intensity native** — web dùng CSS `backdrop-filter: blur()`, khác cảm giác frosted thật của iOS Material.
2. **Haptic feedback** — chưa add `expo-haptics`, nhưng nếu add sau cần test trên iPhone.
3. **iOS safe area** — Dynamic Island, notch handling.
4. **Status bar styling** — `expo-status-bar` chỉ apply trên native.
5. **Touch gestures** — pan, swipe, long-press.
6. **`Alert.alert`** — render fallback browser dialog trên web, không chạy y nhau iOS Alert. Khuyến nghị thay bằng custom modal nếu muốn UX nhất quán.
7. **Modal `presentation: 'modal'`** — trên web hiện full screen, không có slide-up sheet như iOS.
8. **Performance trên thiết bị thật** — bundle size, FPS với 100+ habits, scroll long lists.

---

## Khuyến nghị bước tiếp theo

1. **Bạn test trên iPhone** thật để verify các điểm trong "Web không cover được" — 10-15 phút quét QR + đi qua flow.
2. **Cân nhắc fix 2 UX nit** ở trên nếu muốn polish trước deploy.
3. **Chạy `/test-pulz`** từ Claude Code để verify BE security + perf sau khi đã hardening throttler (S11 sẽ pass).
4. **Deploy theo [DEPLOY.md](DEPLOY.md)** khi sẵn sàng share cho bạn bè test thật.

---

## Cách reproduce test

```powershell
# Setup
docker compose up -d postgres
npm run api               # T1

# Web preview (Claude Code)
# .claude/launch.json đã có config "mobile-web"
# Invoke Preview MCP: preview_start { name: "mobile-web" }
# Sau khi compile (~40s), drive qua preview_eval/click/screenshot
```

Hoặc mở browser tay tại `http://localhost:8081` sau khi `npm run mobile -- --web` để tự test.
