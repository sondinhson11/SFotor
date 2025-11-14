# 🔧 Hướng Dẫn Setup API Upload

## Vấn đề: "File PHP không được xử lý đúng"

Lỗi này xảy ra khi server trả về code PHP thay vì JSON. Có 3 nguyên nhân chính:

## ✅ Bước 1: Kiểm tra PHP có hoạt động không

### 1. Upload file test

- Upload file `public/api/test.php` lên server vào `public_html/api/test.php`

### 2. Truy cập test endpoint

Mở trình duyệt và truy cập:

```
https://sfotor.site/api/test.php
```

### 3. Kiểm tra kết quả:

**✅ Nếu thấy JSON như này:**

```json
{
    "success": true,
    "message": "PHP đang hoạt động bình thường!",
    "php_version": "8.x",
    ...
}
```

→ **PHP hoạt động OK!** Vấn đề là ở file `upload-config.php`

**❌ Nếu thấy code PHP:**

```php
<?php
header('Content-Type: application/json; charset=utf-8');
...
```

→ **Server không chạy PHP** hoặc đường dẫn sai

**❌ Nếu thấy 404:**
→ **File chưa được upload** lên server

## ✅ Bước 2: Upload file upload-config.php

### 1. Build project

```bash
npm run build
```

### 2. Upload file

Upload file `dist/api/upload-config.php` lên server:

- **Đường dẫn:** `public_html/api/upload-config.php`
- **Tạo thư mục `api/` nếu chưa có**

### 3. Set quyền file

Trong cPanel File Manager:

- File `upload-config.php`: **644** hoặc **755**
- Thư mục `api/`: **755**
- Thư mục `frame/`: **755** (có thể ghi)

## ✅ Bước 3: Kiểm tra đường dẫn

### Cấu trúc thư mục đúng:

```
public_html/
  ├── api/
  │   ├── test.php              ← File test
  │   └── upload-config.php     ← File upload
  ├── config.json
  ├── frame/
  │   └── (các file ảnh)
  └── index.html
```

### Kiểm tra URL:

- Test: `https://sfotor.site/api/test.php`
- Upload: `https://sfotor.site/api/upload-config.php`

## ✅ Bước 4: Test upload

### 1. Đăng nhập admin

- URL: `https://sfotor.site/admin/login`
- Username: `sondinhson11`
- Password: `As121202@`

### 2. Thêm frame mới

- Click "➕ Thêm Frame Mới"
- Nhập thông tin và upload ảnh
- Click "Lưu"

### 3. Upload lên server

- Click "☁️ Upload Lên Server"
- Xem console (F12) để debug nếu có lỗi

## 🔍 Debug

### Mở Console (F12)

Xem các log:

- `Uploading to: https://sfotor.site/api/upload-config.php`
- `Response status: 200` (hoặc lỗi khác)
- `Response headers: ...`

### Các lỗi thường gặp:

1. **404 Not Found**

   - File chưa được upload
   - Đường dẫn sai

2. **500 Internal Server Error**

   - Lỗi PHP trong file
   - Quyền file không đúng

3. **403 Forbidden**

   - Quyền file không đúng
   - Server chặn truy cập

4. **PHP code hiển thị**
   - Server không chạy PHP
   - File extension sai (phải là `.php`)

## 💡 Giải pháp thay thế

Nếu không thể fix API, sử dụng **"📥 Tải ZIP"**:

1. Click "📥 Tải ZIP"
2. Giải nén file ZIP
3. Upload `config.json` lên `public_html/config.json`
4. Upload các file trong `frame/` lên `public_html/frame/`

## 📝 Lưu ý

- Đảm bảo server hỗ trợ PHP (thường cPanel đều có)
- File PHP phải có extension `.php`
- Quyền file phải đúng (644 cho file, 755 cho thư mục)
- Kiểm tra error log trong cPanel nếu vẫn lỗi
