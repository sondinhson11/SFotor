// Utility để load config từ file JSON trong public
// File config.json không bị mã hóa khi build, dễ chỉnh sửa

let cachedConfig = null;
let forceReload = false; // Flag để force reload từ server
let cacheTimestamp = null; // Timestamp của lần cache cuối
const CACHE_MAX_AGE = 5 * 60 * 1000; // Cache tối đa 5 phút

export async function loadConfig(force = false) {
  // Nếu force = true, bỏ qua cache
  if (force) {
    forceReload = true;
    cachedConfig = null;
    cacheTimestamp = null;
  }

  // Kiểm tra cache có cũ quá không (nếu cache > 5 phút thì reload)
  const now = Date.now();
  if (cachedConfig && cacheTimestamp && !forceReload) {
    const cacheAge = now - cacheTimestamp;
    if (cacheAge > CACHE_MAX_AGE) {
      console.log(
        `Config cache đã cũ (${Math.round(
          cacheAge / 1000
        )}s), reload từ server...`
      );
      forceReload = true;
      cachedConfig = null;
    }
  }

  // Nếu đã load rồi và không force, trả về cache
  if (cachedConfig && !forceReload) {
    return cachedConfig;
  }

  try {
    // Auto-detect base URL based on current hostname
    let baseUrl = import.meta.env.BASE_URL;

    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      // If using custom domain, use "/" instead of "/SFotor/"
      if (
        hostname === "sfotor.online" ||
        hostname === "www.sfotor.online" ||
        hostname === "sfotor.site" ||
        hostname === "www.sfotor.site"
      ) {
        baseUrl = "/";
      }
    }

    // Nếu force reload, thêm timestamp để bypass browser cache
    const url = forceReload
      ? `${baseUrl}config.json?t=${Date.now()}`
      : `${baseUrl}config.json`;

    const response = await fetch(url, {
      cache: forceReload ? "no-cache" : "default",
      headers: forceReload
        ? {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          }
        : {
            "Cache-Control": "max-age=3600", // Cache 1 giờ
          },
    });

    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }

    const config = await response.json();
    cachedConfig = config;
    cacheTimestamp = Date.now(); // Lưu timestamp của lần cache
    forceReload = false; // Reset flag sau khi load xong
    return config;
  } catch (error) {
    console.error("Error loading config:", error);
    forceReload = false; // Reset flag nếu có lỗi
    // Trả về config mặc định nếu không load được
    return {
      frames: [],
      defaultFrameMetadata: {
        banv1: {
          slots: [
            { x: 6, y: 3.4, width: 88, height: 18.9 },
            { x: 6, y: 23.3, width: 88, height: 18.9 },
            { x: 6, y: 43.3, width: 88, height: 18.9 },
            { x: 6, y: 63.1, width: 88, height: 18.9 },
          ],
        },

        banv2: {
          slots: [
            { x: 6, y: 1.8, width: 90, height: 23 },
            { x: 6, y: 25, width: 90, height: 23 },
            { x: 6, y: 48, width: 90, height: 23 },
            { x: 6, y: 71, width: 90, height: 23 },
          ],
        },
      },
      frameMetadata: {},
    };
  }
}

// Hàm để reload config (dùng khi muốn refresh sau khi chỉnh sửa)
export function clearConfigCache() {
  cachedConfig = null;
  cacheTimestamp = null;
  forceReload = true;
}

// Hàm để đánh dấu config đã được update (gọi sau khi upload thành công)
export function markConfigUpdated() {
  // Lưu timestamp vào localStorage để các tab khác biết
  if (typeof window !== "undefined") {
    localStorage.setItem("config_updated_at", Date.now().toString());
  }
  clearConfigCache();
}

// Hàm để kiểm tra xem config có được update không (từ tab khác)
export function checkConfigUpdated() {
  if (typeof window === "undefined") return false;

  const updatedAt = localStorage.getItem("config_updated_at");
  if (!updatedAt) return false;

  const lastCheck = sessionStorage.getItem("last_config_check");
  if (lastCheck && parseInt(lastCheck) >= parseInt(updatedAt)) {
    return false; // Đã check rồi
  }

  // Nếu có update mới hơn lần check cuối
  sessionStorage.setItem("last_config_check", updatedAt);
  return true;
}
// ============================================
// METADATA ĐƯỢC LOAD TỪ CONFIG.JSON
// ============================================
// Config được load từ /public/config.json
// File này không bị mã hóa khi build, dễ chỉnh sửa

// CÁCH CHỈNH SỬA:
// 1. Mở file public/config.json
// 2. Chỉnh sửa defaultFrameMetadata để thay đổi layout mặc định cho tất cả frame
// 3. Thêm vào frameMetadata để chỉnh sửa layout cho frame cụ thể

// VÍ DỤ trong config.json:
// {
//   "defaultFrameMetadata": {
//     "slots": [
//       { "x": 6, "y": 3.4, "width": 88, "height": 18.9 }
//     ]
//   },
//   "frameMetadata": {
//     "vietnam-mau-do.png": {
//       "slots": [
//         { "x": 10, "y": 5, "width": 80, "height": 20 }
//       ]
//     }
//   }
// }
