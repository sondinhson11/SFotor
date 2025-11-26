import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./FrameSelection.css";
import {
  getFrameMetadata,
  calculateSlotPosition,
  detectSlotsFromFrame,
} from "../utils/frameMetadata";
import {
  loadConfig,
  checkConfigUpdated,
  clearConfigCache,
} from "../utils/configLoader";
import {
  getCurrentLanguage,
  setLanguage,
  loadTranslations,
  getAvailableLanguages,
  clearLanguageCache,
} from "../utils/language";
import { getAssetPath } from "../utils/pathHelper";

const FRAME_CATEGORIES = [
  "Tất cả",
  "Basic",
  "Birthday",
  "Countries",
  "Cute",
  "Idol",
  "School",
  "Vietnam",
];

// FRAMES fallback - chỉ dùng khi không load được config
// Frames chính được load từ /public/config.json
const FRAMES = [
  // Basic
  {
    id: 1,
    name: "Basic White",
    category: "Basic",
    path: "/frame/basic-white.png",
  },
  {
    id: 2,
    name: "Basic Black",
    category: "Basic",
    path: "/frame/basic-black.png",
  },
  {
    id: 3,
    name: "Basic Pastel Purple",
    category: "Basic",
    path: "/frame/basic-pastel-purple.png",
  },
  {
    id: 4,
    name: "Basic Pastel Pink",
    category: "Basic",
    path: "/frame/basic-pastel-pink.png",
  },
  {
    id: 5,
    name: "Basic Pastel Green",
    category: "Basic",
    path: "/frame/basic-pastel-green.png",
  },
  {
    id: 6,
    name: "Basic Pastel Blue",
    category: "Basic",
    path: "/frame/basic-pastel-blue.png",
  },
  {
    id: 7,
    name: "Basic Hot Orange",
    category: "Basic",
    path: "/frame/basic-hot-orange.png",
  },
  {
    id: 8,
    name: "Basic Sky Blue",
    category: "Basic",
    path: "/frame/basic-sky-blue.png",
  },
  {
    id: 9,
    name: "Basic Office Blue",
    category: "Basic",
    path: "/frame/basic-office-blue.png",
  },
  {
    id: 10,
    name: "Basic Goldie Yellow",
    category: "Basic",
    path: "/frame/basic-goldie-yellow.png",
  },
  {
    id: 11,
    name: "Basic Frame 1",
    category: "Basic",
    path: "/frame/basic-frame-1.png",
  },
  {
    id: 12,
    name: "Basic Frame 2",
    category: "Basic",
    path: "/frame/basic-frame-2.png",
  },

  // Birthday
  {
    id: 20,
    name: "Birthday Purple Sweet",
    category: "Birthday",
    path: "/frame/birthday-purple-sweet.png",
  },
  {
    id: 21,
    name: "Birthday",
    category: "Birthday",
    path: "/frame/birthday.png",
  },
  {
    id: 22,
    name: "HPBD White Vintage",
    category: "Birthday",
    path: "/frame/birthday-hpbd-white-vintage.png",
  },

  // Countries
  {
    id: 30,
    name: "Songkran Thailand",
    category: "Countries",
    path: "/frame/countries-songkran-thailand.png",
  },
  {
    id: 31,
    name: "Vietnam",
    category: "Countries",
    path: "/frame/countries-vietnam.png",
  },
  {
    id: 32,
    name: "Vietnam Hanoi",
    category: "Countries",
    path: "/frame/countries-vietnam-hanoi.png",
  },
  {
    id: 33,
    name: "Vietnam HCM",
    category: "Countries",
    path: "/frame/countries-vietnam-hcm.png",
  },
  {
    id: 34,
    name: "Vietnam Da Nang",
    category: "Countries",
    path: "/frame/countries-vietnam-danang.png",
  },
  {
    id: 35,
    name: "Vietnam Hue",
    category: "Countries",
    path: "/frame/countries-vietnam-hue.png",
  },
  {
    id: 36,
    name: "Vietnam Nha Trang",
    category: "Countries",
    path: "/frame/countries-vietnam-nhatrang.png",
  },
  {
    id: 37,
    name: "Vietnam Flag",
    category: "Countries",
    path: "/frame/countries-vietnam-flag.png",
  },

  // Cute
  {
    id: 40,
    name: "Cute Watermelon",
    category: "Cute",
    path: "/frame/cute-watermelon.png",
  },
  {
    id: 41,
    name: "Cute Vitinhtu",
    category: "Cute",
    path: "/frame/cute-vitinhtu.png",
  },
  {
    id: 42,
    name: "Cute Summer Vibe",
    category: "Cute",
    path: "/frame/cute-summer-vibe.png",
  },
  {
    id: 43,
    name: "Cute Puca",
    category: "Cute",
    path: "/frame/cute-puca.png",
  },
  {
    id: 44,
    name: "Cute Pause Breathe",
    category: "Cute",
    path: "/frame/cute-pause-breathe.png",
  },
  {
    id: 45,
    name: "Cute New Day",
    category: "Cute",
    path: "/frame/cute-new-day.png",
  },
  {
    id: 46,
    name: "Cute My BF",
    category: "Cute",
    path: "/frame/cute-my-bf.png",
  },
  {
    id: 47,
    name: "Cute Let's Part",
    category: "Cute",
    path: "/frame/cute-lets-part.png",
  },
  {
    id: 48,
    name: "Cute Forever Young",
    category: "Cute",
    path: "/frame/cute-forever-young.png",
  },
  {
    id: 49,
    name: "Cute Dream",
    category: "Cute",
    path: "/frame/cute-dream.png",
  },
  {
    id: 50,
    name: "Cute Cloud",
    category: "Cute",
    path: "/frame/cute-cloud.png",
  },
  {
    id: 51,
    name: "Cute Cats Read",
    category: "Cute",
    path: "/frame/cute-cats-read.png",
  },
  {
    id: 52,
    name: "Cute Cats Paws",
    category: "Cute",
    path: "/frame/cute-cats-paws.png",
  },
  {
    id: 53,
    name: "Cute Cats Fat",
    category: "Cute",
    path: "/frame/cute-cats-fat.png",
  },
  {
    id: 54,
    name: "Cute Biutiphun",
    category: "Cute",
    path: "/frame/cute-biutiphun.png",
  },
  {
    id: 55,
    name: "Cute Aichacha",
    category: "Cute",
    path: "/frame/cute-aichacha.png",
  },
  {
    id: 56,
    name: "Cute Drawing",
    category: "Cute",
    path: "/frame/cute-drawing.png",
  },

  // Idol
  {
    id: 60,
    name: "K-Pop Frame",
    category: "Idol",
    path: "/frame/idol-kpop.png",
  },
  {
    id: 61,
    name: "Blackpink World Tour",
    category: "Idol",
    path: "/frame/idol-blackpink-world-tour.png",
  },
  {
    id: 62,
    name: "TTPD Anniversary",
    category: "Idol",
    path: "/frame/idol-ttpd-anniversary.png",
  },
  {
    id: 63,
    name: "We Bare Bears",
    category: "Idol",
    path: "/frame/idol-we-bare-bears.png",
  },
  {
    id: 64,
    name: "Totally Spies",
    category: "Idol",
    path: "/frame/idol-totally-spies.png",
  },
  {
    id: 65,
    name: "Superstar",
    category: "Idol",
    path: "/frame/idol-superstar.png",
  },
  {
    id: 66,
    name: "Twinkle Star",
    category: "Idol",
    path: "/frame/idol-twinkle-star.png",
  },
  {
    id: 67,
    name: "Golden Moment Fandom",
    category: "Idol",
    path: "/frame/idol-golden-moment-fandom.png",
  },
  {
    id: 68,
    name: "Golden Moment Fandom 2",
    category: "Idol",
    path: "/frame/idol-golden-moment-fandom-2.png",
  },

  // School
  {
    id: 70,
    name: "LHP",
    category: "School",
    path: "/frame/school-lhp.png",
  },
  {
    id: 71,
    name: "NVN",
    category: "School",
    path: "/frame/school-nvn.png",
  },

  // Vietnam
  {
    id: 80,
    name: "Vietnam Màu Đỏ",
    category: "Vietnam",
    path: "/frame/vietnam-mau-do.png",
  },
  {
    id: 81,
    name: "Vietnam Floral",
    category: "Vietnam",
    path: "/frame/vietnam-floral.png",
  },
  {
    id: 82,
    name: "Độc Lập Tự Do Hạnh Phúc",
    category: "Vietnam",
    path: "/frame/vietnam-doclap-tudo-hanhphuc.png",
  },
  {
    id: 83,
    name: "Khát Vọng Là Người Việt",
    category: "Vietnam",
    path: "/frame/vietnam-khat-vong-la-nguoi-viet.png",
  },

  // Others
  {
    id: 90,
    name: "Y2K Memory",
    category: "Cute",
    path: "/frame/cute-y2k-memory.png",
  },
  {
    id: 91,
    name: "Memories",
    category: "Cute",
    path: "/frame/cute-memories.png",
  },
  {
    id: 92,
    name: "Summer",
    category: "Cute",
    path: "/frame/cute-summer.png",
  },
  {
    id: 93,
    name: "Jeans",
    category: "Cute",
    path: "/frame/cute-jeans.png",
  },
  {
    id: 94,
    name: "Autumn Lover",
    category: "Cute",
    path: "/frame/cute-autumn-lover.png",
  },
  {
    id: 95,
    name: "Pretty Girl",
    category: "Cute",
    path: "/frame/cute-pretty-girl.png",
  },
];

function FrameSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const determineCompactLayout = () =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [frames, setFrames] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [frameImage, setFrameImage] = useState(null);
  const [frameMetadata, setFrameMetadata] = useState(null);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());
  const [translations, setTranslations] = useState(null);
  const [availableLanguages, setAvailableLanguages] = useState(["VI", "EN"]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isCompactLayout, setIsCompactLayout] = useState(
    determineCompactLayout
  );
  const photos = location.state?.photos || [];

  // Load translations và available languages
  useEffect(() => {
    async function loadLangData() {
      const lang = getCurrentLanguage();
      setCurrentLang(lang);

      const trans = await loadTranslations();
      setTranslations(trans);

      const langs = await getAvailableLanguages();
      setAvailableLanguages(langs);

      setIsInitialLoad(false);
    }
    loadLangData();
  }, []);

  // Reload translations khi đổi ngôn ngữ
  useEffect(() => {
    if (isInitialLoad) return;

    async function reloadTranslations() {
      clearLanguageCache();
      const trans = await loadTranslations();
      setTranslations(trans);
    }
    reloadTranslations();
  }, [currentLang, isInitialLoad]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCurrentLang(lang);
  };

  // Load frames từ config
  useEffect(() => {
    async function loadFrames() {
      try {
        // Kiểm tra xem config có được update không (từ admin page)
        if (checkConfigUpdated()) {
          clearConfigCache();
          console.log("Config đã được update, reload từ server...");
        }

        const config = await loadConfig();
        setFrames(config.frames || []);
        if (config.frames && config.frames.length > 0) {
          setSelectedFrame(config.frames[0]);
        }
      } catch (error) {
        console.error("Error loading frames:", error);
        // Fallback về FRAMES cũ nếu không load được
        setFrames(FRAMES);
        setSelectedFrame(FRAMES[0]);
      }
    }
    loadFrames();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => {
      setIsCompactLayout(determineCompactLayout());
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load frame image and metadata when selected
  useEffect(() => {
    if (selectedFrame?.path) {
      const img = new Image();
      img.src = getAssetPath(selectedFrame.path);
      img.onload = () => {
        setFrameImage(img);
      };

      // Load metadata
      async function loadMetadata() {
        const metadata = await getFrameMetadata(selectedFrame.path);
        setFrameMetadata(metadata);
      }
      loadMetadata();
    }
  }, [selectedFrame]);

  const filteredFrames =
    isCompactLayout || selectedCategory === "Tất cả"
      ? frames
      : frames.filter((frame) => frame.category === selectedCategory);

  const downloadPhoto = async () => {
    if (!selectedFrame?.path || photos.length === 0) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Load frame image first
    const frameImg = new Image();
    frameImg.crossOrigin = "anonymous";
    frameImg.src = getAssetPath(selectedFrame.path);

    frameImg.onload = async () => {
      // Set canvas size to match frame
      canvas.width = frameImg.width;
      canvas.height = frameImg.height;

      // Lấy metadata cho frame (sẽ trả về mặc định nếu không có đặc biệt)
      const metadata = await getFrameMetadata(selectedFrame.path);
      const slots = metadata.slots
        .slice(0, photos.length)
        .map((slot) =>
          calculateSlotPosition(slot, canvas.width, canvas.height)
        );

      // Load và vẽ từng ảnh vào slot tương ứng TRƯỚC
      let loadedCount = 0;
      const photoImages = [];

      photos.forEach((photo, index) => {
        const photoImg = new Image();
        photoImg.crossOrigin = "anonymous";
        photoImg.src = photo;

        photoImg.onload = () => {
          loadedCount++;
          const slot = slots[index] || slots[0]; // Fallback về slot đầu nếu không đủ

          // Tính toán để ảnh fit vào slot giống như CSS object-fit: cover
          // object-fit: cover = fill toàn bộ slot, crop phần thừa, căn giữa
          const slotAspect = slot.width / slot.height;
          const photoAspect = photoImg.width / photoImg.height;

          // Vị trí và kích thước vẽ = chính xác slot (fill toàn bộ)
          const drawWidth = slot.width;
          const drawHeight = slot.height;
          const drawX = slot.x;
          const drawY = slot.y;

          // Tính toán phần ảnh nguồn cần crop để fit vào slot
          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = photoImg.width;
          let sourceHeight = photoImg.height;

          if (photoAspect > slotAspect) {
            // Ảnh rộng hơn slot: crop 2 bên, lấy phần giữa theo chiều ngang
            // Scale theo chiều cao
            sourceHeight = photoImg.height;
            sourceWidth = photoImg.height * slotAspect;
            sourceX = (photoImg.width - sourceWidth) / 2;
          } else {
            // Ảnh cao hơn slot: crop trên dưới, lấy phần giữa theo chiều dọc
            // Scale theo chiều rộng
            sourceWidth = photoImg.width;
            sourceHeight = photoImg.width / slotAspect;
            sourceY = (photoImg.height - sourceHeight) / 2;
          }

          // Lưu thông tin ảnh để vẽ sau (với source crop cho object-fit: cover)
          photoImages.push({
            img: photoImg,
            x: drawX,
            y: drawY,
            width: drawWidth,
            height: drawHeight,
            sourceX: sourceX,
            sourceY: sourceY,
            sourceWidth: sourceWidth,
            sourceHeight: sourceHeight,
          });

          // Khi tất cả ảnh đã load, vẽ chúng lên canvas
          if (loadedCount === photos.length) {
            // Bước 1: Vẽ tất cả ảnh trước (background) với object-fit: cover
            photoImages.forEach((photoData) => {
              ctx.drawImage(
                photoData.img,
                photoData.sourceX || 0,
                photoData.sourceY || 0,
                photoData.sourceWidth || photoData.img.width,
                photoData.sourceHeight || photoData.img.height,
                photoData.x,
                photoData.y,
                photoData.width,
                photoData.height
              );
            });

            // Bước 2: Vẽ frame overlay lên trên
            // Sử dụng destination-over để frame chỉ vẽ ở những vùng có nội dung
            // Hoặc nếu frame có transparent ở slot, ảnh sẽ hiển thị qua
            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

            // Download
            const link = document.createElement("a");
            link.download = `photobooth-${selectedFrame.name}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
          }
        };

        photoImg.onerror = () => {
          loadedCount++;
          if (loadedCount === photos.length) {
            // Vẽ ảnh đã load được trước với object-fit: cover
            photoImages.forEach((photoData) => {
              ctx.drawImage(
                photoData.img,
                photoData.sourceX || 0,
                photoData.sourceY || 0,
                photoData.sourceWidth || photoData.img.width,
                photoData.sourceHeight || photoData.img.height,
                photoData.x,
                photoData.y,
                photoData.width,
                photoData.height
              );
            });

            // Vẽ frame overlay lên trên
            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

            const link = document.createElement("a");
            link.download = `photobooth-${selectedFrame.name}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
          }
        };
      });
    };

    frameImg.onerror = () => {
      Swal.fire({
        icon: "error",
        title: "Lỗi Tải Khung Ảnh",
        text: "Không thể tải khung ảnh. Vui lòng thử lại.",
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
      });
    };
  };

  // Nếu chưa load translations, hiển thị loading
  if (!translations) {
    return (
      <div className="frame-selection-container">
        <div className="frame-loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="frame-selection-container">
      {/* Header */}
      <header className="frame-header-nav">
        <div className="header-left">
          <div className="header-logo-icon">
            <img src={getAssetPath("/logo.png")} alt="Logo" />
          </div>
          <span
            className="header-brand"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            {translations.title || "SFotor"}
          </span>
        </div>
        <div className="header-right">
          <div className="header-languages">
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                className={`header-lang-button ${
                  currentLang === lang ? "active" : ""
                }`}
                onClick={() => handleLanguageChange(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="frame-main">
        <div className="photo-strip-preview">
          <div className="photo-strip-frame">
            {selectedFrame?.path && frameImage ? (
              <div className="frame-preview-container">
                {/* Vẽ ảnh trước (background) */}
                {photos.length > 0 &&
                  frameMetadata &&
                  (() => {
                    // Sử dụng metadata đã load
                    const slots = frameMetadata.slots.slice(0, photos.length);

                    return (
                      <div className="photos-background">
                        {photos.map((photo, index) => {
                          const slot = slots[index] || slots[0];
                          return (
                            <div
                              key={index}
                              className="background-photo-slot"
                              style={{
                                left: `${slot.x}%`,
                                top: `${slot.y}%`,
                                width: `${slot.width}%`,
                                height: `${slot.height}%`,
                              }}
                            >
                              <img src={photo} alt={`Photo ${index + 1}`} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                {/* Vẽ frame overlay lên trên */}
                <img
                  src={getAssetPath(selectedFrame.path)}
                  alt={selectedFrame.name}
                  className="frame-preview-image"
                />
                {/* Download button ở góc trên bên trái */}
                <button
                  className="download-button"
                  onClick={downloadPhoto}
                  disabled={photos.length === 0 || !frameImage}
                >
                  <span>
                    {translations.frameSelection?.download ||
                      translations.shoot?.download ||
                      "Download"}
                  </span>
                </button>
              </div>
            ) : (
              <div className="frame-loading">Đang tải khung ảnh...</div>
            )}
          </div>
        </div>

        <div className="frame-selection-panel">
          {!isCompactLayout && (
            <div className="category-tabs">
              {FRAME_CATEGORIES.map((category) => (
                <button
                  key={category}
                  className={`category-tab ${
                    selectedCategory === category ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          <div className="frames-grid">
            {filteredFrames.map((frame) => (
              <div
                key={frame.id}
                className={`frame-item ${
                  selectedFrame.id === frame.id ? "selected" : ""
                }`}
                onClick={() => setSelectedFrame(frame)}
              >
                <div className="frame-preview">
                  <img
                    src={getAssetPath(frame.path)}
                    alt={frame.name}
                    className="frame-thumbnail"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="frame-fallback" style={{ display: "none" }}>
                    {frame.name}
                  </div>
                  <div className="frame-name">{frame.name}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="frame-actions">
            <button
              className="action-button retake"
              onClick={() => navigate("/shoot")}
            >
              <span>📷</span>{" "}
              {translations.frameSelection?.retake || "CHỤP LẠI"}
            </button>
            <button className="action-button print">
              <span>🖨️</span>{" "}
              {translations.frameSelection?.print || "ĐẶT IN ẢNH"}
            </button>
          </div>
        </div>
      </div>

      {/* Gradient background */}
      <div className="frame-gradient"></div>

      {/* Footer */}
      <div className="frame-footer">
        <span className="footer-credit">
          {translations.footer?.credit || "made by Sơn Đình Sơn"}
        </span>
      </div>
    </div>
  );
}

export default FrameSelection;
