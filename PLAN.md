# PulzApp — Implementation Plan

> Plan này được copy từ `C:\Users\cmanh\.claude\plans\dazzling-gliding-falcon.md` để lưu cùng project.

---

## Trạng thái (snapshot)

| Phạm vi | Trạng thái |
|---|---|
| Bước 1–6 trong `CLAUDE_CODE_PROMPT.md` | ✅ Hoàn thành |
| Màn Home (đầy đủ UI, verify với Stitch) | ✅ Hoàn thành |
| 6 màn stub (Leaderboard / Groups / Profile / Onboarding / Add-Habit / Group Detail) | ✅ Hoàn thành |
| Leaderboard / Groups / Group Detail / Add-Habit (full UI + BE wire) | ✅ Hoàn thành |
| Onboarding (welcome + 2 CTA, redirect logic qua `hasSeenOnboarding`) | ✅ Hoàn thành |
| Profile (avatar, stats, achievements, settings, language toggle, logout) | ✅ Hoàn thành |
| Edit Habit (reuse add-habit form với `?habitId`, có Delete) | ✅ Hoàn thành |
| Group Detail: rename modal (owner) + long-press kick member | ✅ Hoàn thành |
| Habit Stats heatmap `app/habit/[id].tsx` (3 stat card + 30-day grid 7-col) | ✅ Hoàn thành |
| Push notification reminder (`expo-notifications`, daily local) | ✅ Hoàn thành |
| **Light theme** — Dark / Light / System cycle, persist qua zustand | ✅ Hoàn thành |
| Polish: pull-to-refresh, haptic feedback, skeleton loading, empty state illustration | ✅ Hoàn thành |
| FloatingTabBar dot animation (built-in `Animated.spring`, không phụ thuộc Reanimated) | ✅ Hoàn thành |
| HabitCard tinted theo `habit.color` (helper `hexToRgba` 0.18/0.5 cho bg/border) | ✅ Hoàn thành |
| Typography getter pattern + setTypographyScheme subscription (tránh RN dev freeze mutation) | ✅ Hoàn thành |
| `npm install` (954 packages) | ✅ exit 0 |
| `npx tsc --noEmit` | ✅ pass |
| `npx expo config` | ✅ parse OK |

### Câu hỏi đang chờ trả lời (đặt sau plan)
- Branding name hiển thị cho Onboarding: `PulzApp` vs `Thử thách thói quen nhóm`?
- Có thêm haptic + animation chuyển tab không?
- Màn tiếp theo nên dựng: Leaderboard / Groups / Profile / Onboarding / Add-Habit?

### Cách chạy thử
```powershell
cd E:\workspace\PulzApp
npx expo start
# Quét QR bằng Expo Go
```

---

## Context

Dự án `E:\workspace\PulzApp` ban đầu chỉ có 2 file định hướng:
- `CLAUDE_CODE_PROMPT.md` — yêu cầu kỹ thuật & cấu trúc thư mục mong muốn
- `DESIGN.md` — design system "Obsidian Pulse" (dark-first, glassmorphism có chọn lọc)

Mục tiêu của plan: dựng nền móng Expo (React Native + TypeScript + Expo Router) **đến mức chạy được màn Home với FloatingTabBar**, đồng thời **cấu hình sẵn** EAS/app.json để không phải redo khi sau này build native. Stitch MCP đã connect, dùng để tham chiếu layout Home và icon các tab.

Scope giới hạn (confirm với user):
- Bước 1–6 trong `CLAUDE_CODE_PROMPT.md` + dựng màn Home 1 lần đầu.
- Các màn còn lại (Leaderboard, Groups, Profile, Onboarding, Add-Habit, Group Detail) chỉ tạo file stub rỗng để Expo Router không lỗi.

---

## Stack & Dependencies

| Mục đích | Package |
|---|---|
| Core | `expo` (SDK 52), `react`, `react-native`, TypeScript |
| Routing | `expo-router`, `react-native-safe-area-context`, `react-native-screens` |
| Fonts | `expo-font`, `@expo-google-fonts/manrope`, `@expo-google-fonts/be-vietnam-pro` |
| Glass / blur | `expo-blur` (BlurView dùng cho Floating Pill Nav) |
| Gradient (FAB) | `expo-linear-gradient` |
| Icons | `@expo/vector-icons` (Ionicons cho tab icon outline/filled) |
| Storage | `@react-native-async-storage/async-storage` |
| State | `zustand` |
| i18n | `i18next`, `react-i18next`, `expo-localization` |
| Build sẵn sàng | `eas-cli` (cài khi cần) |

> Tất cả đều tương thích **Expo Go** → test nhanh bằng QR. Đồng thời `app.json` + `eas.json` viết đầy đủ ngay từ đầu để chạy `eas build` không phải sửa lại.

---

## File structure (kết thúc plan này)

```
PulzApp/
├── app.json                       # ★ bundle id, scheme, plugins, splash, icon placeholder
├── eas.json                       # ★ profile development / preview / production
├── package.json
├── tsconfig.json
├── babel.config.js                # expo-router plugin
├── .gitignore
├── expo-env.d.ts
├── app/
│   ├── _layout.tsx                # Root: load fonts, init i18n, Stack
│   ├── (tabs)/
│   │   ├── _layout.tsx            # Custom tabBar = FloatingTabBar
│   │   ├── index.tsx              # ★ HOME (full UI)
│   │   ├── leaderboard.tsx        # stub
│   │   ├── groups.tsx             # stub
│   │   └── profile.tsx            # stub
│   ├── onboarding.tsx             # stub
│   ├── add-habit.tsx              # stub (modal route)
│   └── group/[id].tsx             # stub
├── constants/
│   ├── colors.ts                  # tokens từ DESIGN.md (surfaces, brand, text, semantic)
│   ├── typography.ts              # display/headline/title/body/label
│   └── spacing.ts                 # unit, padding, gap, touchTarget, radius
├── components/
│   ├── FloatingTabBar.tsx         # ★ Pill (BlurView) + 4 tab + FAB gradient tách riêng
│   ├── GlassCard.tsx              # BlurView wrapper, dùng ở Home progress card
│   ├── HabitCard.tsx              # Thẻ thói quen (row: iconBox + info + check)
│   ├── ProgressBar.tsx            # track + fill
│   ├── PillBadge.tsx              # streak/status
│   └── StubScreen.tsx             # placeholder cho các màn chưa dựng
├── locales/
│   ├── vi.json                    # default — toàn bộ key Home + tab labels
│   └── en.json                    # bản dịch song song
├── lib/
│   └── i18n.ts                    # init i18next với expo-localization, fallback vi
└── store/
    ├── useHabitStore.ts           # zustand + persist (AsyncStorage)
    ├── useGroupStore.ts           # khung rỗng
    └── useSettingsStore.ts        # language preference + userName
```

`★` = file có nội dung đầy đủ trong plan này. Còn lại tối thiểu để build pass.

---

## Implementation steps

### 1. Init project (bước 1–3 prompt gốc)
- Cập nhật `app.json`:
  - `expo.scheme`: `pulzapp`
  - `expo.ios.bundleIdentifier`: `com.pulzapp.app`
  - `expo.android.package`: `com.pulzapp.app`
  - `expo.plugins`: `["expo-router", "expo-font", "expo-localization"]`
  - `expo.userInterfaceStyle`: `dark`
  - splash/icon: dùng default (sẽ thay sau khi tải asset Stitch)
- Tạo `eas.json` 3 profile (`development` với `developmentClient: true`, `preview`, `production`).
- Bật `expo-router` typed routes trong `app.json` (`experiments.typedRoutes`).

### 2. Design tokens (bước 4)
- `constants/colors.ts`: object `Colors` đúng theo bảng trong DESIGN.md (surfaces, brand, text, semantic) + `Colors.glass` cho overlay.
- `constants/typography.ts`: object `Typography` (display/headline/title/bodyLg/bodySm/label/number) trả về `TextStyle`. Family lấy theo key font đã load (vd `Manrope_700Bold`).
- `constants/spacing.ts`: `Spacing` (4/8/12/16/20/24/32) + `Radius` (sm/md/lg/xl/full) + `TouchTarget`.

### 3. i18n (bước 5)
- `lib/i18n.ts`:
  - import `i18n` từ `i18next`, `initReactI18next`, `getLocales` từ `expo-localization`.
  - resources: `{ vi: { translation: viJson }, en: { translation: enJson } }`.
  - `lng`: device locale (`vi`/`en`) hoặc fallback `vi`, `fallbackLng: 'vi'`, `compatibilityJSON: 'v4'`.
- `locales/vi.json` & `locales/en.json` — key:
  - `tabs.home`, `tabs.leaderboard`, `tabs.groups`, `tabs.profile`
  - `home.greeting` (interp `{{name}}`), `home.progressTitle`, `home.progressSubtitle` (`{{done}}`, `{{total}}`), `home.habitsTitle`, `home.streakBadge` (`{{days}}`), `home.streakSuffix` (`{{days}}`), `home.checkedIn`, `home.notCheckedIn`, `home.rank` (`{{rank}}`)
  - `common.addHabit`
  - `habits.water`, `habits.exercise`, `habits.sleep`
  - `screens.*` cho stub labels
- `store/useSettingsStore.ts`: zustand giữ `language` + `userName`, action `setLanguage` đồng bộ với `i18n.changeLanguage` + persist.
- Import `lib/i18n` 1 lần trong `app/_layout.tsx` để init sớm.

### 4. Root layout + font loading
- `app/_layout.tsx`:
  - dùng `useFonts` từ `@expo-google-fonts/manrope` + `@expo-google-fonts/be-vietnam-pro` load weights `500/600/700/800` Manrope, `400/500/600` Be Vietnam Pro.
  - `SplashScreen.preventAutoHideAsync()` → khi fonts ready thì `hideAsync()`.
  - Render `<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surface.lowest } }} />`.
  - Khai báo riêng `add-habit` với `presentation: 'modal'`.

### 5. FloatingTabBar (bước 6 — component quan trọng nhất)
- `app/(tabs)/_layout.tsx`: dùng `<Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>` + 4 `<Tabs.Screen>` với label i18n.
- `components/FloatingTabBar.tsx`:
  - Container `View` `position: absolute, bottom: insets.bottom + 16, left: 14, right: 14, flexDirection: 'row', gap: 12`.
  - **Pill** `flex: 1`: `BlurView intensity={40} tint="dark"` + overlay `rgba(28,28,28,0.96)`, border `0.5px rgba(255,255,255,0.09)`, radius `9999`, height `64`, shadow `0 10px 28px rgba(0,0,0,0.55)` (iOS `shadow*`, Android `elevation: 12`).
  - 4 tab `Pressable flex: 1, alignItems: 'center'`:
    - Active: Ionicons filled + color `Colors.primaryLight` + dot 4px dưới icon.
    - Inactive: Ionicons outline + color `Colors.text.inactive`.
    - Mapping icon: home → `home`, leaderboard → `trophy`, groups → `people`, profile → `person`.
  - **FAB** tách bên phải pill: `Pressable` 50x50, `LinearGradient` `[Colors.primary, Colors.primaryContainer]`, radius full, icon `+` 24px trắng, shadow glow `rgba(127,119,221,0.6)`. `onPress` → `router.push('/add-habit')`.
  - Hành vi: `state.index` để xác định active, `navigation.navigate(route.name)` khi tap sau khi emit `tabPress`.

### 6. Reusable components & Home screen
- `components/GlassCard.tsx`: `BlurView intensity={20} tint="dark"` + nền `rgba(20,20,20,0.7)` + border + radius `lg`. Prop `style`, `children`.
- `components/ProgressBar.tsx`: prop `value: 0..1` + `gradient?: boolean`. Solid teal `Colors.secondary` mặc định; `gradient` thì tím→teal.
- `components/HabitCard.tsx`: row layout đúng DESIGN.md (iconBox 36×36 chứa emoji, info, check circle 22×22).
- `components/PillBadge.tsx`: prop `tone: 'primary' | 'secondary' | 'tertiary'`.
- `app/(tabs)/index.tsx` (Home) — layout đã verify với Stitch screen `9078671ca5e340cb8acda23115b3648b`:
  - `SafeAreaView edges={['top']}` + `ScrollView contentContainerStyle paddingBottom: 140` (chừa cho tabBar).
  - **Header row** (flex row, space-between):
    - Trái: greeting `t('home.greeting', { name })` style `headline` — placeholder name "Minh" (từ `useSettingsStore`).
    - Phải: `PillBadge` "🔥 12 ngày" tone tertiary + avatar 36×36 radius full (placeholder bg `Colors.primaryContainer`).
  - **GlassCard progress** (BlurView):
    - Title: `t('home.progressTitle')` = "Thử thách thói quen nhóm".
    - Sub: `t('home.progressSubtitle', { done, total })`.
    - Row dưới: ProgressBar gradient tím→teal (value = done/total) + số `done/total` (Manrope number) + nhãn rank "#2" nhỏ.
  - **Section "Thói quen hôm nay"** (`t('home.habitsTitle')`): title + 3 `HabitCard` mock:
    - 💧 "Uống đủ nước" — 12 ngày — done
    - 🏃 "Tập thể dục" — 5 ngày — done
    - 😴 "Ngủ trước 11h" — 3 ngày — pending
    - Tap check circle → `useHabitStore().toggleCheckIn(id)`.

### 7. Store + AsyncStorage
- `store/useHabitStore.ts`: zustand `{ habits: Habit[], toggleCheckIn(id), addHabit(...) }` + `persist` middleware dùng `createJSONStorage(() => AsyncStorage)`. Seed 3 habit mẫu. Habit hỗ trợ cả `nameKey` (i18n) lẫn `nameRaw`.
- `store/useGroupStore.ts`: khung rỗng (type `Group` + create với mảng rỗng).
- `store/useSettingsStore.ts`: persist `{ language, userName }`, sync `i18n.changeLanguage` khi rehydrate.

### 8. Stub các màn còn lại
Mỗi file `(tabs)/leaderboard.tsx`, `(tabs)/groups.tsx`, `(tabs)/profile.tsx`, `onboarding.tsx`, `add-habit.tsx`, `group/[id].tsx` dùng chung `components/StubScreen.tsx` — chỉ hiển thị title từ `t('screens.*')`. Routing không gãy, TabBar đổi tab không crash.

---

## Verification

1. `npx expo start` → quét QR bằng Expo Go.
2. Mở app trên thiết bị:
   - Splash → Home render, font Manrope/BeVietnamPro đã apply.
   - Greeting + progress card (glass) hiển thị đúng tone tối + blur.
   - 3 habit card check/uncheck được, state lưu sau khi reload (kill app → mở lại → habit vẫn ở trạng thái cuối).
   - FloatingTabBar nổi đáy, tap 4 tab chuyển sang stub không crash, active state đổi icon + dot.
   - FAB tap mở route `/add-habit` (modal stub).
3. Đổi ngôn ngữ device sang English → relaunch → label tab + greeting tiếng Anh.
4. Toggle device theme: app vẫn dark (do `userInterfaceStyle: dark`).
5. `npx tsc --noEmit` — không có lỗi type. ✅ (đã chạy)
6. `npx expo config --type public` — parse OK. ✅ (đã chạy)
7. EAS sẵn sàng: `eas build --profile preview --platform android --dry-run` (chưa cần chạy build thật).

---

## Out of scope (làm sau)

- 6 màn còn lại (đang ở dạng stub): Leaderboard, Groups (+ empty state), Profile, Onboarding, Add-Habit, Group Detail.
- Backend / sync.
- Animation chuyển tab, haptic feedback.
- Asset Stitch (icon app, illustration 3D cho Onboarding) — sẽ tải qua `stitch:download_assets` khi build các màn còn lại.
- Tests (chưa setup Jest).
- Push notification (`expo-notifications`).
- Notification reminder cho habit.

---

## Stitch screen mapping

Project ID: `3667436594816317354`. Mapping screen ID → file Expo Router:

| Screen | ID | File |
|---|---|---|
| Home | `9078671ca5e340cb8acda23115b3648b` ★ | `app/(tabs)/index.tsx` |
| Bảng xếp hạng | `14d5f4cce8b241d0a8a9138a1d238aff` | `app/(tabs)/leaderboard.tsx` |
| Nhóm | `cc146db1b88b4fc19aa10830a9756698` | `app/(tabs)/groups.tsx` |
| Empty groups | `0195aeb9fd2049998108e20c11a7467d` | empty state trong `groups.tsx` |
| Trang cá nhân | `704ad5d4e56e49a58f23085aee2b6a74` | `app/(tabs)/profile.tsx` |
| Onboarding | `db00218afbf544c38cdd26d87252851a` | `app/onboarding.tsx` |
| Thêm thói quen | `d8b9261b65ad44f9a4a4b1e3b9df08a6` | `app/add-habit.tsx` |
| Chi tiết nhóm | `c52b976134b84f01bc2d2da841190879` | `app/group/[id].tsx` |
| Illustration 3D (asset) | `9b146a169e384dadaccec26e2447de97` | `assets/onboarding-hero.png` (chưa tải) |

★ = đã verify HTML với Stitch.
