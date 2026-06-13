# Claude Code — Prompt khởi động

Dán prompt này vào Claude Code khi bắt đầu phiên làm việc:

---

## Prompt

```
Tôi đang xây dựng app mobile "Thử thách thói quen nhóm" bằng Expo (React Native).

## Bối cảnh
- App cho phép nhóm bạn bè tạo thử thách thói quen, check-in hàng ngày, và cạnh tranh trên bảng xếp hạng.
- Thiết kế UI đã hoàn tất trên Stitch (Google) — project ID: 3667436594816317354
- Design system tên "Obsidian Pulse" — dark-first, glassmorphism có chọn lọc, tối giản có chủ đích (2026 trends)
- File DESIGN.md trong project chứa toàn bộ design tokens (colors, typography, spacing, components, screen map)

## Yêu cầu kỹ thuật
- Expo SDK mới nhất, TypeScript
- Expo Router (file-based routing) cho navigation
- Bottom tab nav kiểu floating pill + FAB tách riêng (xem DESIGN.md mục Components > Floating Pill Nav)
- Fonts: Manrope (headline/số) + Be Vietnam Pro (body) — cài qua expo-google-fonts
- Không cần backend ngay — dùng local state (Zustand hoặc Context) + AsyncStorage cho MVP
- **Đa ngôn ngữ (i18n):** dùng `i18next` + `react-i18next` + `expo-localization`
  - Ngôn ngữ mặc định: Tiếng Việt (`vi`)
  - Hỗ trợ thêm: English (`en`), mở rộng được
  - Tự detect ngôn ngữ thiết bị, cho phép user chuyển thủ công trong Settings
  - Tất cả text hiển thị phải đi qua `t('key')`, KHÔNG hardcode string trong component
  - File translation đặt tại `locales/vi.json`, `locales/en.json`

## Stitch MCP
Tôi đã kết nối Stitch MCP. Bạn có thể:
- `stitch:list_screens` để xem danh sách 8 màn hình đã thiết kế
- `stitch:get_screen` để xem chi tiết layout + HTML code của từng màn
- `stitch:download_assets` để tải ảnh/asset về local
Hãy tham chiếu các màn trên Stitch làm nguồn chân lý cho layout và style.

## Cấu trúc mong muốn
app/
├── (tabs)/              # Bottom tab screens
│   ├── _layout.tsx      # Custom floating pill tab bar
│   ├── index.tsx        # Home
│   ├── leaderboard.tsx  # Bảng xếp hạng
│   ├── groups.tsx       # Nhóm
│   └── profile.tsx      # Trang cá nhân
├── onboarding.tsx       # Onboarding (no tabs)
├── add-habit.tsx        # Thêm thói quen (modal/push)
├── group/[id].tsx       # Chi tiết nhóm
├── _layout.tsx          # Root layout
constants/
├── colors.ts            # Obsidian Pulse color tokens
├── typography.ts        # Font styles
├── spacing.ts           # Spacing tokens
components/
├── FloatingTabBar.tsx   # Custom pill nav + FAB
├── HabitCard.tsx        # Thẻ thói quen
├── GlassCard.tsx        # Reusable glass container
├── ProgressBar.tsx      # Thanh tiến trình
├── PillBadge.tsx        # Streak/status badge
locales/
├── vi.json              # Tiếng Việt (default)
├── en.json              # English
lib/
├── i18n.ts              # i18next config + expo-localization detect
store/
├── useHabitStore.ts     # Zustand store cho habits
├── useGroupStore.ts     # Zustand store cho groups
├── useSettingsStore.ts  # Zustand store cho language preference + settings

## Bắt đầu
1. Đọc file DESIGN.md để nắm toàn bộ design tokens
2. Dùng Stitch MCP list_screens để xem 8 màn hình
3. Khởi tạo Expo project với TypeScript
4. Tạo constants/ từ design tokens
5. Setup i18n: cài i18next + react-i18next + expo-localization, tạo lib/i18n.ts, tạo locales/vi.json + locales/en.json với key cho toàn bộ text trong app
6. Dựng FloatingTabBar.tsx trước (component quan trọng nhất, dùng chung cho 5 màn)
7. Lần lượt dựng từng màn, tham chiếu Stitch cho layout, mọi text dùng t('key')

Hãy bắt đầu từ bước 1-5, rồi hỏi tôi trước khi tiếp tục.
```

---

## Cách dùng

### Bước 1: Kết nối Stitch MCP trong Claude Code
```bash
claude mcp add stitch \
  --transport http \
  --header "X-Goog-Api-Key: <YOUR_API_KEY>" \
  https://stitch.googleapis.com/mcp
```

### Bước 2: Copy DESIGN.md vào project
```bash
# Sau khi tạo Expo project
cp DESIGN.md ./DESIGN.md
```

### Bước 3: Paste prompt ở trên vào Claude Code

### Bước 4: Claude Code sẽ tự:
- Đọc DESIGN.md → hiểu tokens
- Gọi Stitch MCP → xem layout từng màn
- Tạo project Expo + cài dependencies
- Dựng components + screens theo đúng design

---

## Tips khi làm việc với Claude Code

- Nếu Claude Code quên style, nhắc: "Xem lại DESIGN.md"
- Nếu layout không khớp, nhắc: "Dùng stitch:get_screen để xem lại màn [tên]"
- Mỗi khi tạo component mới, nhắc: "Dùng tokens từ constants/, không hardcode màu"
- Khi cần thêm màn mới chưa có trên Stitch, nhắc: "Giữ đúng phong cách Obsidian Pulse như các màn khác"
- **i18n:** Nếu thấy hardcode text, nhắc: "Mọi string phải qua t('key'), thêm key vào cả vi.json và en.json"
- **Thêm ngôn ngữ:** Chỉ cần tạo file locales/xx.json mới và thêm vào i18n.ts — không cần sửa component
