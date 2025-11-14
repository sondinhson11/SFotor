/**
 * Script để tự động cập nhật lastmod trong sitemap.xml
 * Chạy script này khi bạn thêm/sửa routes (pages) mới
 * KHÔNG cần chạy khi chỉ thêm frame vào config.json
 */

const fs = require("fs");
const path = require("path");

const sitemapPath = path.join(__dirname, "../public/sitemap.xml");
const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

try {
  let sitemap = fs.readFileSync(sitemapPath, "utf8");

  // Cập nhật tất cả lastmod thành ngày hôm nay
  sitemap = sitemap.replace(
    /<lastmod>[\d-]+<\/lastmod>/g,
    `<lastmod>${today}</lastmod>`
  );

  fs.writeFileSync(sitemapPath, sitemap, "utf8");
  console.log("✅ Đã cập nhật sitemap.xml với lastmod:", today);
  console.log("📝 Lưu ý: Chỉ cần cập nhật sitemap khi thêm/sửa routes (pages)");
  console.log("   Không cần cập nhật khi chỉ thêm frame vào config.json");
} catch (error) {
  console.error("❌ Lỗi khi cập nhật sitemap:", error.message);
  process.exit(1);
}
