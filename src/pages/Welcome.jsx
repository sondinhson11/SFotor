import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Welcome.css";
import {
  getCurrentLanguage,
  setLanguage,
  loadTranslations,
  getAvailableLanguages,
  clearLanguageCache,
} from "../utils/language";
import { getAssetPath } from "../utils/pathHelper";

function Welcome() {
  const navigate = useNavigate();
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

  // Nếu chưa load translations, hiển thị loading
  if (!translations) {
    return (
      <div className="welcome-container">
        <div className="welcome-main-content">
          <div className="welcome-logo">
            <img src={getAssetPath("/logo.png")} alt="Logo" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-container">
      {/* Header */}
      <header className="welcome-header">
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
      <div className="welcome-main-content">
        {/* Logo/Mascot */}
        <div className="welcome-logo">
          <img src="/logo.png" alt="Logo" />
        </div>

        {/* Title */}
        <h1 className="welcome-title">
          {translations.welcome?.title || "Chào mừng đến với SFotor!"}
        </h1>

        {/* Description */}
        <p className="welcome-text">
          {translations.welcome?.text ||
            "Tạo những bức ảnh photobooth tuyệt đẹp với nhiều khung ảnh độc đáo"}
        </p>

        {/* Button */}
        <div className="welcome-buttons">
          <button className="welcome-button" onClick={() => navigate("/shoot")}>
            {translations.welcome?.button || "Bắt đầu chụp ảnh"}
          </button>
        </div>
      </div>

      {/* Gradient background */}
      <div className="welcome-gradient"></div>

      {/* Footer */}
      <div className="welcome-footer">
        <span className="footer-credit">
          {translations.footer?.credit || "made by Sơn Đình Sơn"}
        </span>
      </div>
    </div>
  );
}

export default Welcome;
