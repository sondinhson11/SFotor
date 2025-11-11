// Utility để load config từ file JSON trong public
// File config.json không bị mã hóa khi build, dễ chỉnh sửa

let cachedConfig = null;

export async function loadConfig() {
  // Nếu đã load rồi thì trả về cache
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const baseUrl = import.meta.env.BASE_URL;
    const response = await fetch(`${baseUrl}config.json`);
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }
    const config = await response.json();
    cachedConfig = config;
    return config;
  } catch (error) {
    console.error("Error loading config:", error);
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

// // Hàm để reload config (dùng khi muốn refresh sau khi chỉnh sửa)
// export function clearConfigCache() {
//   cachedConfig = null;
// }
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
