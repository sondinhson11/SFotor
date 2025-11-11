# Hướng dẫn cấu hình Frame Metadata

## Tổng quan

Hệ thống metadata cho phép định nghĩa chính xác vị trí và kích thước của các slot ảnh trong mỗi frame. Điều này đảm bảo ảnh chụp được ghép chính xác vào đúng vị trí trong frame.

## Cấu trúc Metadata

Mỗi frame có thể có metadata định nghĩa các slot như sau:

```javascript
"ten-file-frame.png": {
  slots: [
    { x: 35, y: 15, width: 30, height: 18 }, // Slot 1
    { x: 35, y: 35, width: 30, height: 18 }, // Slot 2
    { x: 35, y: 55, width: 30, height: 18 }, // Slot 3
    { x: 35, y: 75, width: 30, height: 18 }, // Slot 4
  ],
}
```

### Giải thích các tham số:

- **x**: Vị trí ngang của slot (tính theo % từ trái, 0-100)
- **y**: Vị trí dọc của slot (tính theo % từ trên, 0-100)
- **width**: Chiều rộng của slot (tính theo % của frame width, 0-100)
- **height**: Chiều cao của slot (tính theo % của frame height, 0-100)

## Cách thêm metadata cho frame mới

1. Mở file `src/utils/frameMetadata.js`
2. Thêm entry mới vào object `FRAME_METADATA`:

```javascript
"ten-file-frame-moi.png": {
  slots: [
    { x: 35, y: 15, width: 30, height: 18 },
    { x: 35, y: 35, width: 30, height: 18 },
    { x: 35, y: 55, width: 30, height: 18 },
    { x: 35, y: 75, width: 30, height: 18 },
  ],
},
```

3. Lưu file và reload ứng dụng

## Cách xác định vị trí slot

### Phương pháp 1: Sử dụng công cụ chỉnh sửa ảnh

1. Mở frame trong Photoshop/GIMP hoặc công cụ chỉnh sửa ảnh
2. Xác định vị trí các slot (thường là các vùng trống hoặc trong suốt)
3. Đo vị trí và kích thước tính theo %:
   - Nếu frame có width 1000px và slot ở vị trí 350px từ trái → x = 35%
   - Nếu frame có height 2000px và slot ở vị trí 300px từ trên → y = 15%

### Phương pháp 2: Sử dụng DevTools

1. Mở frame trong trình duyệt
2. Inspect element và xem kích thước thực tế
3. Tính toán % dựa trên kích thước frame

### Phương pháp 3: Thử nghiệm và điều chỉnh

1. Bắt đầu với giá trị mặc định (x: 35, y: 15, width: 30, height: 18)
2. Test với ảnh thực tế
3. Điều chỉnh các giá trị cho đến khi ảnh khớp đúng vị trí

## Layout phổ biến

### Layout 4 slot dọc (phổ biến nhất)

```javascript
slots: [
  { x: 35, y: 15, width: 30, height: 18 },
  { x: 35, y: 35, width: 30, height: 18 },
  { x: 35, y: 55, width: 30, height: 18 },
  { x: 35, y: 75, width: 30, height: 18 },
];
```

### Layout 3 slot dọc

```javascript
slots: [
  { x: 35, y: 20, width: 30, height: 20 },
  { x: 35, y: 45, width: 30, height: 20 },
  { x: 35, y: 70, width: 30, height: 20 },
];
```

### Layout 2 slot ngang

```javascript
slots: [
  { x: 20, y: 40, width: 25, height: 30 },
  { x: 55, y: 40, width: 25, height: 30 },
];
```

## Fallback

Nếu frame không có metadata, hệ thống sẽ tự động phát hiện slot dựa trên layout mặc định (4 slot dọc, ở giữa frame). Tuy nhiên, kết quả có thể không chính xác 100%.

## Lưu ý

- Metadata được tính theo %, nên sẽ tự động scale với mọi kích thước frame
- Đảm bảo các slot không overlap với nhau
- Slot có thể có kích thước khác nhau tùy theo thiết kế frame
- Nên test với ảnh thực tế sau khi thêm metadata mới
