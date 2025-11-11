// ============================================
// METADATA ĐƯỢC LOAD TỪ CONFIG.JSON
// ============================================
// Config được load từ /public/config.json
// File này không bị mã hóa khi build, dễ chỉnh sửa
//
// CÁCH CHỈNH SỬA:
// 1. Mở file public/config.json
// 2. Chỉnh sửa defaultFrameMetadata để thay đổi layout mặc định cho tất cả frame
// 3. Thêm vào frameMetadata để chỉnh sửa layout cho frame cụ thể
//
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

import { loadConfig } from "./configLoader";

// Cache cho config
let configCache = null;

// Hàm để load config (sẽ được gọi khi cần)
async function getConfig() {
  if (!configCache) {
    configCache = await loadConfig();
  }
  return configCache;
}

// Hàm helper để lấy metadata của frame
// Trả về metadata đặc biệt nếu có, nếu không thì trả về mặc định theo type
export async function getFrameMetadata(framePath, frameType = null) {
  const config = await getConfig();
  const fileName = framePath.split("/").pop();

  // Kiểm tra xem có metadata đặc biệt không (ưu tiên cao nhất)
  if (config.frameMetadata && config.frameMetadata[fileName]) {
    return config.frameMetadata[fileName];
  }

  // Nếu không có frameType, tìm frame trong config để lấy type
  if (!frameType && config.frames) {
    const frame = config.frames.find((f) => f.path === framePath);
    if (frame && frame.type) {
      frameType = frame.type;
    }
  }

  // Load metadata mặc định theo type
  if (
    frameType &&
    config.defaultFrameMetadata &&
    config.defaultFrameMetadata[frameType]
  ) {
    return config.defaultFrameMetadata[frameType];
  }

  // Fallback: nếu defaultFrameMetadata là object cũ (backward compatibility)
  if (config.defaultFrameMetadata && config.defaultFrameMetadata.slots) {
    return config.defaultFrameMetadata;
  }

  // Fallback cuối cùng: metadata mặc định hardcoded
  return {
    slots: [
      { x: 6, y: 3.4, width: 88, height: 18.9 },
      { x: 6, y: 23.3, width: 88, height: 18.9 },
      { x: 6, y: 43.3, width: 88, height: 18.9 },
      { x: 6, y: 63.1, width: 88, height: 18.9 },
    ],
  };
}

// Hàm helper để tính toán vị trí slot dựa trên metadata
export function calculateSlotPosition(slot, frameWidth, frameHeight) {
  return {
    x: (slot.x / 100) * frameWidth,
    y: (slot.y / 100) * frameHeight,
    width: (slot.width / 100) * frameWidth,
    height: (slot.height / 100) * frameHeight,
  };
}

// Hàm tự động phát hiện slot nếu không có metadata
// Phương pháp: tìm các vùng trong suốt hoặc có màu đặc biệt trong frame
export function detectSlotsFromFrame(frameImage, slotCount = 4) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = frameImage.width;
  canvas.height = frameImage.height;

  ctx.drawImage(frameImage, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Tìm các vùng có độ trong suốt cao (alpha < 200)
  // Hoặc có màu trắng/đơn sắc (có thể là slot)
  const slots = [];
  const slotHeight = canvas.height / (slotCount + 1);
  const slotWidth = canvas.width * 0.3;
  const startX = (canvas.width - slotWidth) / 2;

  for (let i = 0; i < slotCount; i++) {
    const y = (i + 0.5) * slotHeight;
    slots.push({
      x: startX,
      y: y - slotHeight * 0.4,
      width: slotWidth,
      height: slotHeight * 0.8,
    });
  }

  return slots;
}
