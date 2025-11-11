# SFotor

Ứng dụng photobooth được xây dựng với React + Vite.

## 🚀 Deploy lên GitHub Pages

Dự án đã được cấu hình sẵn để deploy lên GitHub Pages. Để deploy:

### Bước 1: Kích hoạt GitHub Pages

1. Vào repository trên GitHub
2. Vào **Settings** → **Pages**
3. Trong phần **Source**, chọn **GitHub Actions**
4. Lưu lại

### Bước 2: Push code lên GitHub

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### Bước 3: Kiểm tra deployment

1. Vào tab **Actions** trên GitHub để xem quá trình build và deploy
2. Sau khi deploy thành công, website sẽ có tại: `https://sondinhson11.github.io/SFotor/`

## 📝 Lưu ý

- Base path đã được cấu hình là `/SFotor/` trong `vite.config.js`
- React Router đã được cấu hình với `basename="/SFotor"`
- File `404.html` đã được tạo để xử lý routing cho SPA trên GitHub Pages
- GitHub Actions workflow sẽ tự động build và deploy mỗi khi push code lên branch `main`

## 🛠️ Development

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production
npm run build

# Preview build
npm run preview
```

## 📦 Cấu trúc dự án

- `src/` - Source code React
- `public/` - Static files và assets
- `.github/workflows/` - GitHub Actions workflows
- `vite.config.js` - Cấu hình Vite với base path cho GitHub Pages
