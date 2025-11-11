// Helper function để xử lý đường dẫn với base URL cho GitHub Pages
export function getAssetPath(path) {
  // Nếu đường dẫn đã là URL đầy đủ hoặc data URL, trả về nguyên bản
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  // Lấy base URL từ Vite (sẽ là "/SFotor/" khi build)
  const baseUrl = import.meta.env.BASE_URL;

  // Nếu đường dẫn bắt đầu bằng "/", giữ nguyên và thêm base URL
  if (path.startsWith("/")) {
    return `${baseUrl}${path.slice(1)}`;
  }

  // Nếu không, thêm base URL vào đầu
  return `${baseUrl}${path}`;
}
