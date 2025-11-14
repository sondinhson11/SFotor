import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import {
  getCurrentLanguage,
  setLanguage,
  loadTranslations,
  getAvailableLanguages,
  clearLanguageCache,
} from "../utils/language";
import { getAssetPath } from "../utils/pathHelper";

function Home() {
  const navigate = useNavigate();
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());
  const [translations, setTranslations] = useState(null);
  const [availableLanguages, setAvailableLanguages] = useState(["VI", "EN"]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

  // Reload translations khi đổi ngôn ngữ (không chạy lần đầu)
  useEffect(() => {
    if (isInitialLoad) return;

    async function reloadTranslations() {
      clearLanguageCache();
      const trans = await loadTranslations();
      setTranslations(trans);
    }
    reloadTranslations();
  }, [currentLang, isInitialLoad]);

  // Check if fullscreen prompt should be shown (chỉ trên desktop)
  useEffect(() => {
    // Chỉ hiển thị khi đã load translations xong
    if (!translations) return;

    // Kiểm tra xem có phải là mobile/tablet không
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      window.innerWidth <= 768 ||
      "ontouchstart" in window;

    // Chỉ hiển thị fullscreen prompt trên desktop
    if (isMobileDevice) {
      setShowFullscreenPrompt(false);
      return;
    }

    // Kiểm tra xem có đang ở fullscreen không
    const isFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    // Nếu chưa ở fullscreen, hiển thị prompt sau 2 giây
    if (!isFullscreen) {
      const timer = setTimeout(() => {
        setShowFullscreenPrompt(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // Nếu đã fullscreen, ẩn prompt
      setShowFullscreenPrompt(false);
    }
  }, [translations]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCurrentLang(lang);
  };

  const handleFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
    setShowFullscreenPrompt(false);
  };

  const handleSkipFullscreen = () => {
    setShowFullscreenPrompt(false);
  };

  // Lắng nghe sự kiện fullscreen change để tự động ẩn prompt khi vào fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (isFullscreen) {
        setShowFullscreenPrompt(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  // Nếu chưa load translations, hiển thị loading hoặc default
  if (!translations) {
    return (
      <div className="home-container">
        <div className="home-main-content">
          <div className="home-logo">
            <img src={getAssetPath("/logo.png")} alt="Logo" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
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

      {/* Main content */}
      <div className="home-main-content">
        {/* Logo/Mascot */}
        <div className="home-logo">
          <img src={getAssetPath("/logo.png")} alt="Logo" />
        </div>

        {/* Title */}
        <h1 className="home-title">{translations.title || "SFotor"}</h1>

        {/* Tagline */}
        <p className="home-tagline">
          {translations.tagline ||
            "ai cũng có quyền được chụp photobooth - miễn phí~"}
        </p>

        {/* Buttons */}
        <div className="home-buttons">
          <button
            className="home-start-button"
            onClick={() => navigate("/welcome")}
          >
            {translations.startButton || "BẮT ĐẦU"}
          </button>
          <button
            className="home-heart-button"
            onClick={() => setShowDonateModal(true)}
            aria-label="Donate"
          >
            ❤️
          </button>
        </div>
      </div>

      {/* Gradient background */}
      <div className="home-gradient"></div>

      {/* Footer */}
      <div className="home-footer">
        <span className="footer-credit">
          {translations.footer?.credit || "made by Sơn Đình Sơn"}
        </span>
      </div>

      {/* Fullscreen Prompt Modal */}
      {showFullscreenPrompt && (
        <div className="modal-overlay" onClick={handleSkipFullscreen}>
          <div
            className="fullscreen-prompt"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="prompt-title">
              {translations.fullscreenPrompt?.title ||
                "Trải nghiệm tốt hơn ở chế độ toàn màn hình"}
            </p>
            <p className="prompt-text">
              {translations.fullscreenPrompt?.text ||
                "Ứng dụng này được thiết kế để xem toàn màn hình"}
            </p>
            <div className="prompt-buttons">
              <button
                className="prompt-button skip"
                onClick={handleSkipFullscreen}
              >
                {translations.fullscreenPrompt?.skip || "Bỏ qua"}
              </button>
              <button
                className="prompt-button fullscreen"
                onClick={handleFullscreen}
              >
                <span>⛶</span>{" "}
                {translations.fullscreenPrompt?.fullscreen || "Toàn màn hình"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donate Modal */}
      {showDonateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDonateModal(false)}
        >
          <div className="donate-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="donate-title">
              {translations.donateModal?.title || "Cảm ơn bạn đã ủng hộ!"}
            </h2>
            <div className="donate-content">
              <p>
                {translations.donateModal?.text1 ||
                  'Chiếc Photo-Booth ảo này được tạo ra với niềm đam mê chụp ảnh, với "sứ mệnh" phấn đấu đến năm 2025 mỗi nhà sẽ có một chiếc phô tô bút tại gia.'}
              </p>
              <p>
                {translations.donateModal?.text2 ||
                  "Nếu bạn enjoy trải nghiệm này, đừng quên chia sẻ video hậu trường với mọi người và hashtag #sfotor nhé!"}
              </p>
            </div>

            {/* Social Media Buttons */}
            <div className="social-buttons">
              <button className="social-button">Follow me</button>
              <button className="social-button">Tiktok</button>
              <button className="social-button">Instagram</button>
            </div>

            {/* Donation Section */}
            <div className="donation-section">
              <h3 className="donation-title">
                {translations.donateModal?.donationTitle ||
                  "Khao tui một ly trà sữa 💛🧡"}
              </h3>
              <div className="qr-code-placeholder">
                <img
                  src={getAssetPath("/qr.jpg")}
                  alt="QR code"
                  className="qr-image"
                />
              </div>
              <a
                href="https://paypal.me/sondinhson12"
                target="_blank"
                rel="noopener noreferrer"
                className="paypal-link"
              >
                Paypal.me/sondinhson12
              </a>
            </div>

            <button
              className="modal-close-button"
              onClick={() => setShowDonateModal(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
