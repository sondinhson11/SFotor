# 📝 Hướng Dẫn Cập Nhật Frames

## ✅ Cập Nhật Frame (KHÔNG cần build lại)

Khi bạn chỉ **thêm/sửa/xóa frame** trong `config.json`:

1. **Chỉnh sửa file `public/config.json`** (hoặc `dist/config.json` trên server)
2. **Upload file lên server** (nếu chỉnh sửa local)
3. **Xong!** - Website tự động load frame mới

> ⚠️ **Lưu ý**: Browser có cache 1 giờ, nên có thể cần hard refresh (Ctrl+F5) để thấy frame mới ngay lập tức.

## 🔄 Khi Nào Cần Build Lại?

Chỉ cần build lại (`npm run build`) khi:

- ✅ Thêm/sửa routes (pages) mới
- ✅ Thay đổi code React/JavaScript
- ✅ Thay đổi CSS
- ✅ Thêm dependencies mới
- ✅ Cập nhật `index.html`, `manifest.json`, etc.

**KHÔNG cần build lại khi:**

- ❌ Chỉ thêm/sửa frame trong `config.json`
- ❌ Chỉ cập nhật ảnh frame trong thư mục `public/frame/`

## 📋 Workflow Khuyến Nghị

### Cách 1: Chỉnh sửa trực tiếp trên server (Nhanh nhất)

1. Vào cPanel File Manager
2. Mở `public_html/config.json`
3. Chỉnh sửa thêm frame mới
4. Lưu file
5. Hard refresh website (Ctrl+F5)

### Cách 2: Chỉnh sửa local rồi upload

1. Chỉnh sửa `public/config.json` trên máy local
2. Upload file lên `public_html/config.json` trên server
3. Hard refresh website

## 🔍 Kiểm Tra Frame Mới

Sau khi thêm frame:

1. Mở website: `https://sfotor.site/frames`
2. Hard refresh: `Ctrl+F5` (Windows) hoặc `Cmd+Shift+R` (Mac)
3. Frame mới sẽ xuất hiện

## 📊 Sitemap.xml

**Sitemap chỉ cần cập nhật khi:**

- Thêm route (page) mới (ví dụ: `/about`, `/contact`)
- Thay đổi URL structure

**KHÔNG cần cập nhật sitemap khi:**

- Chỉ thêm frame vào `config.json`

Nếu cần cập nhật sitemap, chạy:

```bash
node scripts/update-sitemap.js
```

## 💡 Tips

- Luôn backup `config.json` trước khi chỉnh sửa
- Test frame mới trên local trước khi upload lên server
- Đảm bảo file ảnh frame đã được upload vào `public/frame/` hoặc `public_html/frame/`
