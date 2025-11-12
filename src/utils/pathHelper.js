// Helper function để xử lý đường dẫn với base URL cho GitHub Pages hoặc custom domain
export function getAssetPath(path) {
  // Nếu đường dẫn đã là URL đầy đủ hoặc data URL, trả về nguyên bản
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  // Auto-detect base URL based on current hostname
  let baseUrl = import.meta.env.BASE_URL;

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // If using custom domain, use "/" instead of "/SFotor/"
    if (hostname === "sfotor.online" || hostname === "www.sfotor.online") {
      baseUrl = "/";
    }
  }

  // Nếu đường dẫn bắt đầu bằng "/", giữ nguyên và thêm base URL
  if (path.startsWith("/")) {
    return `${baseUrl}${path.slice(1)}`;
  }

  // Nếu không, thêm base URL vào đầu
  return `${baseUrl}${path}`;
}
