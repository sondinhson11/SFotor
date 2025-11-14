// Utility để quản lý ngôn ngữ từ config
import { loadConfig } from "./configLoader";

let languageCache = null;
let translationsCache = null;

// Lấy ngôn ngữ hiện tại từ localStorage hoặc default
export function getCurrentLanguage() {
  const saved = localStorage.getItem("appLanguage");
  if (saved) {
    return saved;
  }

  // Nếu chưa có, lấy từ config
  if (languageCache) {
    return languageCache;
  }

  return "VI"; // Default
}

// Lưu ngôn ngữ vào localStorage
export function setLanguage(lang) {
  localStorage.setItem("appLanguage", lang);
  languageCache = lang;
}

// Load translations từ config
export async function loadTranslations() {
  if (translationsCache) {
    return translationsCache;
  }

  try {
    const config = await loadConfig();
    const currentLang = getCurrentLanguage();
    const translations =
      config.languages?.translations?.[currentLang] ||
      config.languages?.translations?.[config.languages?.default] ||
      config.languages?.translations?.VI;

    translationsCache = translations;
    return translations;
  } catch (error) {
    console.error("Error loading translations:", error);
    // Return default Vietnamese translations
    return {
      adBanner: {
        line1: "chúng tớ nhận quảng cáo banner",
        line2: "để có kinh phí duy trì server photobooth",
        line3: "click để book vị trí đẹp này! ✨",
      },
      title: "SFotor",
      tagline: "ai cũng có quyền được chụp photobooth - miễn phí~",
      startButton: "BẮT ĐẦU",
      footer: {
        faq: "Hỏi & Đáp",
        credit: "made by Sơn Đình Sơn",
      },
      fullscreenPrompt: {
        title: "Trải nghiệm tốt hơn ở chế độ toàn màn hình",
        text: "Ứng dụng này được thiết kế để xem toàn màn hình",
        skip: "Bỏ qua",
        fullscreen: "Toàn màn hình",
      },
      donateModal: {
        title: "Cảm ơn bạn đã ủng hộ!",
        text1:
          'Chiếc Photo-Booth ảo này được tạo ra với niềm đam mê chụp ảnh, với "sứ mệnh" phấn đấu đến năm 2025 mỗi nhà sẽ có một chiếc phô tô bút tại gia.',
        text2:
          "Nếu bạn enjoy trải nghiệm này, đừng quên chia sẻ video hậu trường với mọi người và hashtag #sfotor nhé!",
        donationTitle: "Khao tui một ly trà sữa 💛🧡",
      },
    };
  }
}

// Clear cache khi đổi ngôn ngữ
export function clearLanguageCache() {
  translationsCache = null;
  languageCache = null;
}

// Lấy danh sách ngôn ngữ có sẵn
export async function getAvailableLanguages() {
  try {
    const config = await loadConfig();
    return config.languages?.available || ["VI", "EN"];
  } catch (error) {
    return ["VI", "EN"];
  }
}
