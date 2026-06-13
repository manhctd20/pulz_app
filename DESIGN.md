# Obsidian Pulse — Design System

App: **Thử thách thói quen nhóm** (Group Habit Challenge)
Platform: Mobile (Expo / React Native)
Style: Dark-first, Targeted Glassmorphism, Minimal có chủ đích (2026)

---

## Colors

### Surfaces (Tonal Layering — không dùng đường kẻ phân cách)
| Token | Hex | Dùng cho |
|---|---|---|
| `surface.lowest` | `#0E0E0E` | Nền chính (OLED black) |
| `surface.low` | `#1C1B1B` | Nền section |
| `surface.base` | `#131313` | Nền non-interactive |
| `surface.container` | `#201F1F` | Card container |
| `surface.high` | `#2A2A2A` | Card interactive |
| `surface.highest` | `#353534` | Elevated elements |

### Brand
| Token | Hex | Dùng cho |
|---|---|---|
| `primary` | `#7F77DD` | Nút chính, active state, FAB gradient start |
| `primaryLight` | `#C5C0FF` | Text trên nền tối, icon active |
| `primaryContainer` | `#8C84EB` | FAB gradient end, badge nền |
| `secondary` | `#5DCAA5` | Teal — hoàn thành, progress, streak |
| `secondaryLight` | `#6EDAB4` | Text teal trên nền tối |
| `tertiary` | `#FF9F87` | Coral — streak fire, cảnh báo nhẹ |

### Text
| Token | Hex/Opacity | Dùng cho |
|---|---|---|
| `text.primary` | `#E5E2E1` | Tiêu đề, nội dung chính |
| `text.secondary` | `#C8C4D4` | Phụ đề, mô tả |
| `text.muted` | `#928F9D` | Placeholder, hint |
| `text.inactive` | `#7D7B85` | Icon/nhãn tab inactive |

### Semantic
| Token | Hex |
|---|---|
| `error` | `#FFB4AB` |
| `success` | `#5DCAA5` |
| `warning` | `#FF9F87` |

---

## Typography

| Style | Font | Size | Weight | Line Height | Letter Spacing | Dùng cho |
|---|---|---|---|---|---|---|
| `display` | Manrope | 40px | 800 | 48px | -0.02em | Onboarding hero |
| `headline` | Manrope | 28px | 700 | 36px | -0.01em | Tiêu đề màn hình |
| `title` | Manrope | 20px | 600 | 28px | — | Section title |
| `body.lg` | Be Vietnam Pro | 16px | 400 | 24px | — | Nội dung chính |
| `body.sm` | Be Vietnam Pro | 14px | 400 | 20px | — | Nội dung phụ |
| `label` | Manrope | 12px | 700 | 16px | 0.05em | Badge, tab label, caps |
| `number` | Manrope | — | 500-700 | — | — | Điểm số, streak, % |

> **Lưu ý:** Be Vietnam Pro được chọn vì xử lý dấu tiếng Việt tốt. Manrope cho tiêu đề và số liệu.

---

## Spacing & Layout

| Token | Value | Dùng cho |
|---|---|---|
| `unit` | 4px | Base unit |
| `padding.screen` | 20px | Lề trái phải màn hình |
| `gap.items` | 16px | Khoảng cách giữa items trong list |
| `gap.sections` | 32px | Khoảng cách giữa sections |
| `touchTarget` | 48px | Chiều cao tối thiểu nút/interactive |

---

## Border Radius

| Token | Value | Dùng cho |
|---|---|---|
| `radius.sm` | 4px | Chip nhỏ |
| `radius.md` | 8px | Input, badge |
| `radius.lg` | 16px | Card, thẻ thói quen |
| `radius.xl` | 24px | Nút chính |
| `radius.full` | 9999px | Pill nav, avatar, FAB |

---

## Elevation & Glass

### Tonal Layering (thay cho đường kẻ)
- Level 0: `#0E0E0E` (base)
- Level 1: `#131313` (surface)
- Level 2: `#1A1A1A` (card)
- Level 3: `#201F1F` (elevated card)

### Glassmorphism (dùng có chọn lọc)
```
background: rgba(20, 20, 20, 0.7)
backdrop-filter: blur(20px)
border: 0.5px solid rgba(255, 255, 255, 0.09)
```
Chỉ dùng cho: floating nav, thẻ tiến độ nổi bật, modal overlay.

### Shadow
```
// Card shadow
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3)

// Nav pill shadow
box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55)

// FAB glow
box-shadow: 0 6px 22px rgba(127, 119, 221, 0.6)
```

---

## Components

### Floating Pill Nav + FAB (kiểu Zalo 2026)
```
Layout: flex row, gap 10-12px
├── Pill (flex: 1)
│   border-radius: 9999px
│   background: rgba(28, 28, 28, 0.96)
│   backdrop-filter: blur(20px)
│   border: 0.5px solid rgba(255, 255, 255, 0.09)
│   box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55)
│   padding: 9px horizontal
│   height: ~64px
│   position: absolute bottom 16px, left/right 14px
│   ├── Tab: Home
│   ├── Tab: Hạng
│   ├── Tab: Nhóm
│   └── Tab: Tôi
│       Active: icon filled + #C5C0FF + chấm 4px dưới
│       Inactive: icon outline + #7D7B85
└── FAB (tách riêng bên phải pill)
    width/height: 50px
    border-radius: 50%
    background: linear-gradient(135deg, #7F77DD, #8C84EB)
    box-shadow: 0 6px 22px rgba(127, 119, 221, 0.6)
    icon: "+" trắng
    action: mở màn Thêm thói quen
```

### Habit Card (Thẻ thói quen)
```
background: #1A1A1A hoặc glass
border-radius: 16px
padding: 12-16px
Layout: flex row
├── Icon box (28x28, radius 8, nền nhạt theo màu nhãn)
├── Info (flex: 1)
│   ├── Tên thói quen (body.lg, bold)
│   └── Streak "🔥 X ngày liên tiếp" (body.sm, text.secondary)
└── Check circle (22x22)
    Done: nền teal #5DCAA5, icon ✓ trắng
    Pending: viền 1.5px #7D7B85, rỗng
```

### Progress Bar
```
Track: height 4px, radius 2px, nền surface.high
Fill: height 4px, radius 2px, nền teal hoặc gradient tím→teal
```

### Primary Button
```
background: #7F77DD
color: white
border-radius: 24px (hoặc full pill)
height: 48px+
font: label, uppercase hoặc title case
```

### Ghost Button
```
background: transparent
border: 0.5px solid rgba(255, 255, 255, 0.15)
color: text.primary
border-radius: 24px
height: 48px
```

### Pill Badge
```
background: rgba(127, 119, 221, 0.15) hoặc tương ứng
color: #C5C0FF
border-radius: 9999px
padding: 3px 8px
font: label (12px, 700, caps)
```

---

## Screens (8 màn trên Stitch)

### Có bottom nav (floating pill + FAB):
1. **Home** — Lời chào, thẻ tiến độ glass, danh sách thói quen, check-in
2. **Bảng xếp hạng (Hạng)** — Segment tabs, podium top 3, full leaderboard list
3. **Nhóm** — Tạo/nhập mã, danh sách nhóm với tiến độ chung
4. **Trang cá nhân (Tôi)** — Avatar, stats, huy hiệu, cài đặt (bao gồm chuyển ngôn ngữ)
5. **Trạng thái rỗng nhóm** — Empty state khi chưa có nhóm

### Không có bottom nav (push screen):
6. **Onboarding** — Illustration, CTA "Bắt đầu", page dots
7. **Thêm thói quen** — Form: tên, emoji, màu, tần suất, nhắc nhở, nhóm
8. **Chi tiết nhóm** — Thông tin nhóm, tiến độ chung, thói quen chung, thành viên

---

## Stitch Project Reference

- **Project ID:** `3667436594816317354`
- **Design System:** `assets/513a8e5b24434e8f93804d35fe5eb876` (Obsidian Pulse)
- Dùng Stitch MCP trong Claude Code để xem chi tiết từng màn:
  ```
  stitch:get_screen(projectId, screenId)
  stitch:list_screens(projectId)
  stitch:download_assets(projectId, outputDir)
  ```
