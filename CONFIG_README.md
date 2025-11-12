# Hướng Dẫn Chỉnh Sửa Config

File `config.json` này chứa tất cả cấu hình cho ứng dụng photobooth. File này **KHÔNG bị mã hóa** khi build, nên bạn có thể chỉnh sửa trực tiếp sau khi build.

## Cấu trúc Config

```json
{
  "frames": [...],           // Danh sách các frame
  "defaultFrameMetadata": {...},  // Metadata mặc định cho tất cả frame
  "frameMetadata": {...}      // Metadata đặc biệt cho từng frame
}
```

## 1. Chỉnh Sửa Danh Sách Frame

Thêm/sửa/xóa frame trong mảng `frames`:

```json
{
  "id": 1,
  "name": "Basic White",
  "category": "Basic",
  "path": "/frame/basic-white.png"
}
```

- `id`: Số ID duy nhất
- `name`: Tên hiển thị của frame
- `category`: Danh mục (Basic, Birthday, Countries, Cute, Idol, School, Vietnam)
- `path`: Đường dẫn đến file frame trong thư mục `/public/frame/`

## 2. Chỉnh Sửa Metadata Mặc Định

Metadata mặc định áp dụng cho **TẤT CẢ** các frame nếu không có metadata đặc biệt:

```json
"defaultFrameMetadata": {
  "slots": [
    { "x": 6, "y": 3.4, "width": 88, "height": 18.9 },
    { "x": 6, "y": 23.3, "width": 88, "height": 18.9 },
    { "x": 6, "y": 43.3, "width": 88, "height": 18.9 },
    { "x": 6, "y": 63.1, "width": 88, "height": 18.9 }
  ]
}
```

- `x`: Vị trí slot từ trái (tính theo %)
- `y`: Vị trí slot từ trên (tính theo %)
- `width`: Chiều rộng slot (tính theo %)
- `height`: Chiều cao slot (tính theo %)

## 3. Chỉnh Sửa Metadata Đặc Biệt

Thêm metadata cho frame cụ thể nếu layout khác với mặc định:

```json
"frameMetadata": {
  "vietnam-mau-do.png": {
    "slots": [
      { "x": 10, "y": 5, "width": 80, "height": 20 },
      { "x": 10, "y": 30, "width": 80, "height": 20 },
      { "x": 10, "y": 55, "width": 80, "height": 20 },
      { "x": 10, "y": 80, "width": 80, "height": 20 }
    ]
  }
}
```

**Lưu ý**: Tên file trong `frameMetadata` phải khớp chính xác với tên file trong `path` của frame (phần sau `/frame/`).

## Cách Xác Định Vị Trí Slot

1. Mở frame image trong editor (Photoshop, GIMP, hoặc online editor)
2. Xác định vị trí và kích thước của các slot ảnh
3. Tính toán %:
   - `x` = (vị trí từ trái / chiều rộng frame) × 100
   - `y` = (vị trí từ trên / chiều cao frame) × 100
   - `width` = (chiều rộng slot / chiều rộng frame) × 100
   - `height` = (chiều cao slot / chiều cao frame) × 100

## 4. Chỉnh Sửa Ngôn Ngữ (Languages)

Config ngôn ngữ cho phép tùy chỉnh tất cả text trong ứng dụng:

```json
"languages": {
  "available": ["VI", "EN", "CN"],  // Danh sách ngôn ngữ có sẵn
  "default": "VI",                  // Ngôn ngữ mặc định
  "translations": {
    "VI": {
      "adBanner": {
        "line1": "chúng tớ nhận quảng cáo banner",
        "line2": "để có kinh phí duy trì server photobooth",
        "line3": "click để book vị trí đẹp này! ✨"
      },
      "title": "SFotor",
      "tagline": "ai cũng có quyền được chụp photobooth",
      "startButton": "BẮT ĐẦU",
      "footer": {
        "faq": "Hỏi & Đáp",
        "credit": "made by tuấn ang"
      },
      "fullscreenPrompt": {
        "title": "Trải nghiệm tốt hơn ở chế độ toàn màn hình",
        "text": "Ứng dụng này được thiết kế để xem toàn màn hình",
        "skip": "Bỏ qua",
        "fullscreen": "Toàn màn hình"
      },
      "donateModal": {
        "title": "Cảm ơn bạn đã ủng hộ!",
        "text1": "...",
        "text2": "...",
        "donationTitle": "Khao tui một ly trà sữa 💛🧡"
      }
    }
  }
}
```

**Cách thêm ngôn ngữ mới:**

1. Thêm code ngôn ngữ vào `available` (ví dụ: "FR", "JP")
2. Thêm object translations tương ứng với cấu trúc giống `VI`
3. Lưu và refresh trang

**Cách chỉnh sửa text:**

- Chỉ cần sửa giá trị trong `translations.[LANG]`
- Ví dụ: `translations.VI.title = "SFotor"`

## Sau Khi Chỉnh Sửa

1. Lưu file `config.json`
2. Refresh trang web (F5 hoặc Ctrl+R)
3. Config sẽ tự động load lại

**Không cần build lại!** File config nằm trong `public/` nên không bị mã hóa.
